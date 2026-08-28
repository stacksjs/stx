/**
 * Turn a `.stx` file into TypeScript that a real compiler can check
 * (stacksjs/stx#1852, asks 4 and 5).
 *
 * `stx typecheck` and the VS Code tsserver plugin both need the same answer to
 * "what TypeScript is in this file, and where did it come from". They used to
 * answer it differently, and the editor's answer was wrong in three ways at
 * once: it concatenated every script block into one buffer, which made two
 * blocks that legitimately declare the same name collide; it dropped the HTML
 * while doing so, so **every diagnostic landed on the wrong line**; and it then
 * suppressed every "Cannot find name" mentioning a hardcoded list of runtime
 * globals, which also suppressed genuine typos.
 *
 * This module is the single extractor, so the editor and CI cannot disagree
 * about what a file contains or where a diagnostic belongs.
 *
 * ## Positions survive by construction
 *
 * The virtual source is built as an array of lines the same length as the
 * source, with each block's body written at the index it already occupies. A
 * diagnostic's line number therefore *is* the line number in the `.stx` file —
 * no offset table, and nothing to get wrong when a file has several blocks.
 *
 * Only synthetic lines appended past the end of the file need a map, and
 * {@link VirtualFile.lineMap} carries it.
 *
 * ## What is deliberately not attempted
 *
 * Template expressions are checked for syntax and for names that resolve, not
 * for deep types. Two things stand in the way, and pretending otherwise would
 * produce false positives in a CI gate:
 *
 *  - The runtime globals are typed `any` (see `runtime-globals.ts`), so a
 *    signal's value type is unknown to begin with.
 *  - Templates auto-unwrap signals — `:if="flag"` reads the value while
 *    `@click="flag.set(true)"` reads the signal object — so the same name has
 *    two types depending on the attribute it appears in.
 *
 * Server-block bindings do have real types, and those are checked: see
 * {@link buildTemplateScopeSource}, which inlines server bodies so
 * `{{ row.total_vists }}` fails against a typed row.
 *
 * @module stx-virtual-ts
 */

import { BROWSER_CORE_IMPORTS } from './browser-core-imports'
import path from 'node:path'
import { stripCommentsAndLiterals } from './strip-literals'
import { STX_RUNTIME_GLOBALS } from './runtime-globals'

export type ScriptKind = 'server' | 'client' | 'plain'

export interface ScriptBlock {
  kind: ScriptKind
  /** Block body, without the surrounding tags. */
  code: string
  /** 1-based line in the source file where the body's first character sits. */
  startLine: number
  /** The opening tag's attributes, trimmed. */
  attrs: string
}

/** A `{{ }}` interpolation or a directive attribute value. */
export interface TemplateExpression {
  /** The expression text, with any filter chain already removed. */
  code: string
  /** 1-based line of the expression's first character. */
  line: number
  /** 1-based column of the expression's first character. */
  column: number
  kind: 'interpolation' | 'directive'
  /** For directives, the attribute name (`:if`, `@click`, `x-text`). */
  attribute?: string
  /**
   * 0-based offset of the expression's first character, used to work out which
   * `@if` / `@unless` blocks enclose it. Not part of a diagnostic; `line` and
   * `column` carry that.
   */
  offset?: number
}

/** A synthetic line's origin, for diagnostics that land outside the source. */
export interface MappedLine {
  line: number
  column: number
  /** Present when the line came from a template expression. */
  expression?: TemplateExpression
  /**
   * Characters of wrapper before the expression starts on the synthetic line.
   *
   * Subtracting it turns a column in the virtual line into a column inside the
   * expression, so a squiggle lands on the offending identifier rather than at
   * the start of the attribute.
   */
  prefixLength?: number
}

export interface VirtualFile {
  text: string
  /**
   * Virtual 1-based line → where it came from.
   *
   * Only holds entries for lines the source does not already account for.
   * Anything absent is at its own line number, because the body was written at
   * the index it occupies in the file.
   */
  lineMap: Map<number, MappedLine>
  /** Lines after this are synthetic. */
  sourceLineCount: number
}

const SCRIPT_RE = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi

/**
 * A copy of `source` with comment CONTENTS blanked, positions preserved.
 *
 * A comment that mentions a script tag in prose was opening a real block, and
 * everything from there to the next `</script>` — the rest of the sentence, the
 * `-->`, and the actual script below it — was handed to TypeScript as code. One
 * real file produced 106 errors, every one pointing at an English sentence
 * (stacksjs/stx#1901).
 *
 * Documenting the framework in a comment above the thing being documented is
 * the most ordinary thing an author can do, and `<script client>` is exactly
 * what they would name. The checker has to read markup as markup before it can
 * claim to check the code inside it.
 *
 * Every blanked character becomes a space and every newline stays a newline, so
 * an offset into the result is an offset into the source and the bodies are
 * still sliced from the original text.
 */
function blankCommentContents(source: string): string {
  const blank = (match: string): string =>
    match.replace(/[^\n]/g, ' ')

  return source
    // HTML comments, and the stx template comment, which is equally prose.
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\{\{--[\s\S]*?--\}\}/g, blank)
}

/**
 * Pull the script blocks out of a `.stx` source, with the line each body starts on.
 *
 * `<script server>` and `<script client>` are recognised by attribute. A bare
 * `<script>` is reported as `plain` so a caller can tell which tag the author
 * actually wrote — NOT so it can be skipped. It is a client block; `client` is
 * an explicit alias for the default, not a separate kind (stacksjs/stx#1920).
 */
export function extractScriptBlocks(source: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = []
  // Scanned over a copy whose comment contents are blanked, so a script tag
  // NAMED in prose cannot open a block. Positions are preserved, so every
  // offset below still indexes the real source, and the bodies are sliced from
  // it rather than from the blanked copy (#1901).
  const scannable = blankCommentContents(source)
  SCRIPT_RE.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = SCRIPT_RE.exec(scannable)) !== null) {
    const attrs = (match[1] || '').trim()
    const openLength = (match[0].match(/^<script(?:\s[^>]*)?>/i)?.[0] ?? '<script>').length
    const closeLength = (match[0].match(/<\/script\s*>$/i)?.[0] ?? '</script>').length
    const bodyStart = match.index + openLength
    const bodyEnd = match.index + match[0].length - closeLength
    const body = source.slice(bodyStart, bodyEnd)

    // `src` scripts have no inline body to check.
    if (/\bsrc\s*=/.test(attrs))
      continue
    // Skip non-TS/JS types (JSON-LD, importmap, text/template, …).
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)
    if (typeMatch && !/^(?:module|text\/(?:javascript|typescript))$/i.test(typeMatch[1]))
      continue

    const kind: ScriptKind = /\bserver\b/.test(attrs)
      ? 'server'
      : /\bclient\b/.test(attrs)
        ? 'client'
        : 'plain'

    // The body begins right after the opening tag, so count the newlines up to
    // that point; +1 converts to a 1-based line number.
    const startLine = lineAt(source, bodyStart)

    blocks.push({ kind, code: body, startLine, attrs })
  }

  return blocks
}

/** 1-based line number of an offset. */
function lineAt(source: string, offset: number): number {
  let line = 1
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source.charCodeAt(i) === 10)
      line++
  }
  return line
}

/** 1-based column of an offset. */
function columnAt(source: string, offset: number): number {
  const lineStart = source.lastIndexOf('\n', offset - 1) + 1
  return offset - lineStart + 1
}

/**
 * Blank out everything an expression cannot appear in, preserving offsets.
 *
 * Scripts, styles, HTML comments and `@verbatim` blocks are replaced with
 * spaces so that scanning for `{{ }}` never has to reason about nesting, while
 * every surviving character keeps its original line and column.
 */
export function maskNonTemplateRegions(source: string): string {
  const chars = source.split('')
  const blank = (start: number, end: number): void => {
    for (let i = start; i < end && i < chars.length; i++) {
      if (chars[i] !== '\n')
        chars[i] = ' '
    }
  }

  const regions: RegExp[] = [
    /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi,
    /<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi,
    /<!--[\s\S]*?-->/g,
    // `{{-- … --}}` is a template comment, not an expression. Masked before the
    // interpolation scan so the scan never has to tell them apart.
    /\{\{--[\s\S]*?--\}\}/g,
    /@verbatim\b[\s\S]*?@endverbatim\b/g,
  ]

  for (const re of regions) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(source)) !== null)
      blank(m.index, m.index + m[0].length)
  }

  return chars.join('')
}

/**
 * Split a filter chain off an interpolation, returning the head expression.
 *
 * `{{ name | upper }}` is stx syntax, not TypeScript — the pipe is a filter
 * separator (`expressions.ts`). Only the part before the first top-level `|`
 * is TypeScript, and `||` is a real operator that must survive.
 */
export function stripFilterChain(expression: string): string {
  let depth = 0
  let quote = ''

  for (let i = 0; i < expression.length; i++) {
    const ch = expression[i]

    if (quote) {
      if (ch === '\\') {
        i++
        continue
      }
      if (ch === quote)
        quote = ''
      continue
    }

    if (ch === '"' || ch === '\'' || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++
      continue
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth--
      continue
    }
    if (ch === '|' && depth === 0) {
      // `||` is logical OR, not a filter separator.
      if (expression[i + 1] === '|') {
        i++
        continue
      }
      if (expression[i - 1] === '|')
        continue
      return expression.slice(0, i)
    }
  }

  return expression
}

/**
 * Directive attributes whose value is not a plain expression.
 *
 * `:for="item in items"` and `@click="open.set(true)"` both need special
 * handling — the first declares names, the second is a statement.
 */
const FOR_ATTRS = new Set([':for', 'x-for', 'v-for'])

const DIRECTIVE_ATTR_RE = /(?:^|\s)((?::|x-|v-|@)[\w.:-]+)\s*=\s*(["'])([\s\S]*?)\2/g

/**
 * Placeholder for a server interpolation spliced into a client expression.
 *
 * `:show="photos()[{{ idx }}]"` is real stx — the server fills `{{ idx }}` in
 * before the client ever parses the attribute. Left in place it is a syntax
 * error, so it is replaced with a declared `any`; the interpolation itself is
 * still extracted and checked on its own.
 */
export const INTERPOLATION_PLACEHOLDER = '__stx_interpolated'

/** Name of the generated helper that reads an iterable's element type. */
export const ELEMENT_HELPER = '__StxElement'

/** Name of the generated helper that models a template's signal auto-unwrap. */
export const UNWRAP_HELPER = '__StxTemplateValue'

/**
 * How a signal reads inside a template.
 *
 * Templates auto-unwrap, so the same name has two types depending on where it
 * appears: `:if="flag"` reads the VALUE, `@click="flag.set(true)"` reads the
 * SIGNAL. A single declaration cannot be both, and picking one produces false
 * positives in whichever context loses.
 *
 * So a signal is typed as the intersection of the two. `flag` satisfies
 * `boolean` operations AND carries `.set`, which means neither form is reported.
 * The cost is a false NEGATIVE — `:if="flag.set"` type-checks though it is
 * meaningless — and that is the right way round for a CI gate: this check earns
 * its place by catching renamed fields (`{{ user.nmae }}`), and a gate people
 * mute because it invents errors catches nothing at all.
 *
 * Keyed on the `_isSignal` / `_isDerived` brands that `stx.d.ts` declares and
 * that `test/reactivity/dual-impl-parity.test.ts` pins, so a plain function or
 * a plain value is left exactly as it is.
 */
const UNWRAP_HELPER_DECL
  = `type ${UNWRAP_HELPER}<T> = T extends { readonly _isSignal: true } | { readonly _isDerived: true }`
    + ` ? (T extends () => infer V ? T & V : T)`
    + ` : T`

export function substituteInterpolations(value: string): string {
  return value
    .replace(/\{\{[\s\S]*?\}\}/g, INTERPOLATION_PLACEHOLDER)
    .replace(/\{!![\s\S]*?!!\}/g, INTERPOLATION_PLACEHOLDER)
}

/**
 * The same substitution, but the result occupies the same space as the source.
 *
 * A `<script client>` block may take a server value through an interpolation —
 * `const duration = {{ duration }}` — and 48 of the framework's own 95
 * components do exactly that. As TypeScript that is a syntax error, so
 * `stx typecheck` reported 369 of them across the component library: a parse
 * failure, which suppresses every real diagnostic in the same file. The gate
 * was not strict there, it was blind.
 *
 * Position-preserving because these are script blocks, not attribute values.
 * A diagnostic on the line after an interpolation has to keep pointing at the
 * code the author wrote, so the replacement is padded to the original width and
 * carries the original newline count. For a single-line interpolation — all but
 * a handful — every column after it is preserved exactly.
 *
 * `0` rather than a named placeholder because it fits in `{{a}}`, the shortest
 * interpolation anyone writes; a longer identifier could not be padded DOWN to
 * fit and would shift the line.
 */
export function substituteInterpolationsInPlace(code: string): string {
  return code.replace(/\{\{[\s\S]*?\}\}|\{!![\s\S]*?!!\}/g, (match) => {
    const newlines = match.split('\n').length - 1
    const width = match.length - newlines

    return `0${' '.repeat(Math.max(0, width - 1))}${'\n'.repeat(newlines)}`
  })
}

/**
 * Control-flow directives that can legitimately open a line inside a script.
 *
 * Deliberately not the whole directive registry — only the forms that generate
 * code around JavaScript, which are the ones that turn up in a script body.
 * Naming them beats matching any line-leading `@identifier`, which would also
 * blank a decorator.
 */
const SCRIPT_BODY_DIRECTIVES = [
  'foreach',
  'endforeach',
  'forelse',
  'endforelse',
  'for',
  'endfor',
  'while',
  'endwhile',
  'empty',
  'if',
  'elseif',
  'else',
  'endif',
  'unless',
  'endunless',
  'isset',
  'endisset',
  'switch',
  'case',
  'default',
  'endswitch',
  'auth',
  'endauth',
  'guest',
  'endguest',
  'env',
  'endenv',
  'once',
  'endonce',
  'break',
  'continue',
]

const SCRIPT_BODY_DIRECTIVE_RE = new RegExp(
  String.raw`^[ \t]*@(?:${SCRIPT_BODY_DIRECTIVES.join('|')})\b[ \t]*(\([^\n)]*\))?[ \t]*$`,
  'gm',
)

/**
 * Blank stx directives that a script body writes to generate JavaScript.
 *
 * A template can loop inside a script — building a lookup table from server
 * data is the obvious use — and the directive is expanded away long before the
 * browser sees it:
 *
 *   const data = {
 *     &#64;foreach(features as f)
 *       '{{ f.id }}': { title: '{{ f.title }}' },
 *     &#64;endforeach
 *   }
 *
 * To TypeScript the directive line is a syntax error, and one of those mutes
 * semantic checking for the WHOLE program, not just the file. So checking bare
 * `<script>` blocks (#1920) made a valid page report 37 invented syntax errors
 * — and a checker that invents errors gets muted, which is the failure mode
 * this file exists to avoid.
 *
 * Blanked rather than removed so every line number after it still points at the
 * line the author wrote. Only a directive ALONE on its line is matched: that is
 * how they are written, and it cannot swallow code sharing the line.
 */
export function blankScriptDirectives(code: string): string {
  return code.replace(SCRIPT_BODY_DIRECTIVE_RE, match => match.replace(/[^\n]/g, ' '))
}

/** Attributes that carry markup or a plain string, never an expression. */
const NON_EXPRESSION_ATTRS = new Set([
  'x-cloak',
  'x-ref',
  'x-transition',
  'x-teleport',
  'v-slot',
  'x-hydrate',
  ':key',
  /*
   * The tooltip attributes carry literal text, not an expression: the runtime
   * reads them with `getAttribute` and assigns straight to `textContent`
   * (signals.ts, the tooltip block) — it never evaluates them.
   *
   * Their absence made two shipped tools contradict each other.
   * `stx codemod --fix` ADDS `x-tooltip="Schedule a post on this day"`, and
   * `stx typecheck` then parsed that sentence as TypeScript: one app went from
   * 0 errors to 34 by running one stx tool over it and then the other
   * (stacksjs/stx#1907).
   */
  'x-tooltip',
  'x-tooltip-position',
])

/**
 * Every checkable expression in the markup, with the position it occupies.
 *
 * Interpolations escaped as `@{{ … }}` are skipped: that syntax exists to emit
 * the braces literally.
 */
export function extractTemplateExpressions(source: string): TemplateExpression[] {
  const masked = maskNonTemplateRegions(source)
  const found: TemplateExpression[] = []

  // `{{ … }}` and the raw form `{!! … !!}`.
  const interpolation = /(@?)\{\{([\s\S]*?)\}\}|(@?)\{!!([\s\S]*?)!!\}/g
  let m: RegExpExecArray | null
  while ((m = interpolation.exec(masked)) !== null) {
    const escaped = m[1] || m[3]
    if (escaped)
      continue
    const raw = m[2] ?? m[4] ?? ''
    const openLength = m[2] !== undefined ? 2 : 3
    const code = stripFilterChain(raw)
    if (!code.trim())
      continue
    // Past the leading whitespace, so a column lands on the first real
    // character. `{{ row.total_vists }}` must point at `row`, not at the space.
    const offset = m.index + openLength + (code.length - code.trimStart().length)
    found.push({
      code: code.trim(),
      line: lineAt(masked, offset),
      column: columnAt(masked, offset),
      offset,
      kind: 'interpolation',
    })
  }

  DIRECTIVE_ATTR_RE.lastIndex = 0
  while ((m = DIRECTIVE_ATTR_RE.exec(masked)) !== null) {
    const name = m[1]
    const value = m[3] ?? ''
    // Strip event/directive modifiers: `@keydown.enter` is still `@keydown`,
    // and `x-transition:enter` is still `x-transition`.
    //
    // The colon half matters as much as the dot half. `NON_EXPRESSION_ATTRS`
    // lists the bare `x-transition`, but the attribute is only ever written
    // with a phase — `x-transition:enter`, `:leave-end` and four more — so the
    // exclusion never fired and every phase was parsed as TypeScript. Their
    // values are CSS class lists (`reactive.ts` reads them with a regex, and
    // `runtime-globals.ts` registers the directive), so `ease-out duration-300`
    // was reported as `TS1005 ')' expected`.
    //
    // Half of them were passing for a worse reason than failing: `opacity-0`
    // is a syntactically valid subtraction, so it type-checked as arithmetic on
    // two undeclared names. The selective-looking failure is the tell.
    //
    // The colon is only a separator when something precedes it — `:key` and
    // `:if` are sigils, and must not collapse to the empty string.
    const base = name.replace(/\..*$/, '').replace(/^([^:].*?):.*$/, '$1')
    if (NON_EXPRESSION_ATTRS.has(base) || NON_EXPRESSION_ATTRS.has(name))
      continue
    if (!value.trim())
      continue

    // Offset of the value: after the attribute name, the `=` and the quote.
    const offset = m.index + m[0].indexOf(m[2], m[0].indexOf(name) + name.length) + 1

    if (FOR_ATTRS.has(base)) {
      // Only the iterable half is an expression; the binding half declares names.
      const inMatch = value.match(/\s+(?:in|of)\s+/)
      if (!inMatch || inMatch.index === undefined)
        continue
      const iterable = value.slice(inMatch.index + inMatch[0].length)
      const iterableStart = inMatch.index + inMatch[0].length
        + (iterable.length - iterable.trimStart().length)
      found.push({
        code: substituteInterpolations(iterable.trim()),
        line: lineAt(masked, offset + iterableStart),
        column: columnAt(masked, offset + iterableStart),
        offset: offset + iterableStart,
        kind: 'directive',
        attribute: base,
      })
      continue
    }

    const lead = value.length - value.trimStart().length
    found.push({
      code: substituteInterpolations(value.trim()),
      line: lineAt(masked, offset + lead),
      column: columnAt(masked, offset + lead),
      offset: offset + lead,
      kind: 'directive',
      attribute: base,
    })
  }

  found.sort((a, b) => a.line - b.line || a.column - b.column)
  return found
}

/**
 * Names a template introduces that no script block declares.
 *
 * Loop bindings are collected for the whole file rather than tracked per
 * subtree. That is deliberately over-permissive: using a loop variable outside
 * its loop goes unreported, which is a missing error, whereas scoping it
 * precisely without an HTML parser would invent errors that are not there.
 */
export interface TemplateBinding {
  name: string
  /**
   * The iterable it was drawn from, when that is a plain identifier.
   *
   * `@foreach(rows as row)` can then type `row` as `rows`' element type, which
   * is what turns a renamed column into a compile error rather than a silent
   * `undefined`. Anything more complex than an identifier stays `any` — a call
   * or a member chain would need the whole expression to resolve, and being
   * wrong there invents errors.
   */
  iterable?: string
}

/**
 * The text inside the parentheses that open at `openIndex`, or null when they
 * never close. Parenthesis-aware, so a call or a nested group inside the group
 * does not end it early.
 *
 * Bounded, and the bound is not cosmetic. A directive head is a few dozen
 * characters; an unbalanced `(` anywhere in the markup - which is ordinary in
 * HTML text - would otherwise send this scanning to the end of the file, once
 * per directive, and a large view has hundreds. That is quadratic on exactly
 * the files that are already the slowest to check.
 */
const MAX_DIRECTIVE_HEAD = 2000

function balancedGroup(source: string, openIndex: number): string | null {
  let depth = 0
  const limit = Math.min(source.length, openIndex + MAX_DIRECTIVE_HEAD)

  for (let index = openIndex; index < limit; index++) {
    const char = source[index]
    if (char === '(')
      depth++
    else if (char === ')') {
      depth--
      if (depth === 0)
        return source.slice(openIndex + 1, index)
    }
  }

  return null
}

export function collectTemplateBindings(source: string): TemplateBinding[] {
  const bindings = new Map<string, TemplateBinding>()
  const add = (raw: string, iterable?: string): void => {
    const parts = raw.split(/[,[\]{}()\s]+/).filter(Boolean)
    for (const part of parts) {
      const name = part.replace(/^\.\.\./, '').trim()
      if (!/^\$?[A-Z_$][\w$]*$/i.test(name))
        continue
      // Only a lone `value` binding can take the element type; `key => value`
      // and `(item, index)` destructure into shapes this does not model.
      const typed = parts.length === 1 ? iterable : undefined
      const existing = bindings.get(name)
      if (!existing)
        bindings.set(name, { name, iterable: typed })
      else if (existing.iterable !== typed)
        existing.iterable = undefined // two loops, two types — stay honest
    }
  }

  const IDENTIFIER = /^\$?[A-Z_$][\w$]*$/i
  const iterableOf = (raw: string): string | undefined => {
    const trimmed = raw.trim()
    return IDENTIFIER.test(trimmed) ? trimmed : undefined
  }

  /*
   * @foreach(items as item) / @foreach(items as key => value)
   *
   * The head is read to its BALANCED closing paren, not to the first one. A
   * non-greedy `\)` stops inside the iterable the moment it contains a call -
   * `@foreach(filterItems(listItems, query) as item)` captured
   * `filterItems(listItems, query`, found no ` as `, and skipped the directive
   * entirely. The loop variable was then declared nowhere and every use of it
   * in the body came back "Cannot find name 'item'".
   */
  for (const m of source.matchAll(/@for(?:each|else)\s*\(/g)) {
    const head = balancedGroup(source, m.index + m[0].length - 1)
    if (head === null)
      continue
    const asMatch = head.match(/^([\s\S]*?)\bas\b([\s\S]*)$/)
    if (!asMatch)
      continue
    add(asMatch[2].replace(/=>/g, ' '), iterableOf(asMatch[1]))
  }

  // @for (let i = 0; …)
  for (const m of source.matchAll(/@for\s*\(\s*(?:let|const|var)\s+([\w$]+)/g))
    add(m[1])

  // :for="(item, index) in items" / x-for="item of list"
  const masked = maskNonTemplateRegions(source)
  DIRECTIVE_ATTR_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = DIRECTIVE_ATTR_RE.exec(masked)) !== null) {
    const base = m[1].replace(/\..*$/, '')
    if (!FOR_ATTRS.has(base))
      continue
    const inMatch = m[3].match(/\s+(?:in|of)\s+/)
    if (!inMatch || inMatch.index === undefined)
      continue
    add(m[3].slice(0, inMatch.index), iterableOf(m[3].slice(inMatch.index + inMatch[0].length)))
  }

  // @php / @js / @ts blocks declare into the template scope.
  for (const block of source.matchAll(/@(?:php|js|ts)\b([\s\S]*?)@end(?:php|js|ts)\b/g)) {
    for (const decl of block[1].matchAll(/\b(?:const|let|var|function|class)\s+([\w$]+)/g))
      add(decl[1])
  }

  return [...bindings.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Top-level names a script block declares.
 *
 * Used to give template expressions a scope without inlining a block that
 * would collide with another one.
 */
export function collectBlockDeclarations(code: string): string[] {
  const names = new Set<string>()

  for (const m of code.matchAll(/^\s*(?:export\s+)?(?:const|let|var)\s+([\w$]+)/gm))
    names.add(m[1])
  for (const m of code.matchAll(/^\s*(?:export\s+)?(?:async\s+)?function\s*\*?\s*([\w$]+)/gm))
    names.add(m[1])
  for (const m of code.matchAll(/^\s*(?:export\s+)?class\s+([\w$]+)/gm))
    names.add(m[1])
  // Destructured declarations: `const { a, b } = …`, `const [x] = …`
  for (const m of code.matchAll(/^\s*(?:export\s+)?(?:const|let|var)\s*[[{]([^\]}]*)[\]}]/gm)) {
    for (const part of m[1].split(',')) {
      const name = part.split(':').pop()!.split('=')[0].replace(/^\.\.\./, '').trim()
      if (/^[A-Z_$][\w$]*$/i.test(name))
        names.add(name)
    }
  }

  return [...names].sort()
}

/** `import` statements, so they can be lifted out of a block-scoped body. */
const IMPORT_LINE_RE = /^\s*import\s[\s\S]*?(?:$|;)/

/** Ambient declarations for the globals the stx runtime injects. */
export function runtimeGlobalDeclarations(): string {
  return [
    'declare var window: any',
    ...STX_RUNTIME_GLOBALS.map(name => `declare var ${name}: any`),
  ].join('\n')
}

/**
 * Context the server injects into a `<script server>` block.
 *
 * Mirrors what `serve.ts` puts in scope. Declaring these is what lets the
 * checker report a genuine typo instead of suppressing every unresolved name.
 */
export const STX_SERVER_CONTEXT = [
  'params',
  'query',
  'cookies',
  'host',
  'ip',
  'setResponseStatus',
  'setResponseHeader',
  'notFound',
  'request',
  'url',
  'definePageMeta',
  // Declaring exactly what crosses into a client block (#1868). Absent from
  // this list it was "Cannot find name", so the checker rejected the one API
  // the typed bridge is built on.
  'defineClientPayload',
  'defineStore',
  /*
   * The render props.
   *
   * `variable-extractor.ts` reserves `props` and `$props` as context bindings,
   * so a server block reads them the same way it reads `params` - but they were
   * not declared here, only in `STX_TEMPLATE_GLOBALS`, which covers template
   * expressions and not script blocks. Every email template in the wild opens
   * `const name = props.customerName`, and the checker called that a typo.
   */
  'props',
  '$props',
] as const

export function serverContextDeclarations(): string {
  return STX_SERVER_CONTEXT.map(name => `declare var ${name}: any`).join('\n')
}

/**
 * The names a `defineClientPayload({ … })` call publishes, or `null` when the
 * page does not declare one.
 *
 * Only the keys matter. The runtime captures values, and `extractBridgeData`
 * publishes the declared set in full and nothing else, so the key set IS the
 * contract between the two blocks (#1868).
 *
 * `null` and `[]` mean different things: `null` is a page that never declared,
 * and still gets the old name-scraping bridge; `[]` is a page that declared an
 * empty payload and therefore publishes nothing.
 */
export function extractClientPayloadNames(serverCode: string): string[] | null {
  const call = /\bdefineClientPayload\s*\(\s*\{([\s\S]*?)\}\s*\)/g
  let match: RegExpExecArray | null
  let found = false
  const names = new Set<string>()
  // JS rules, not template rules: this is a server script's CODE, so comments
  // and string literals are what has to be blanked — a `defineClientPayload`
  // named inside a comment is not a declaration. The same function the runtime
  // bridge uses, so both agree on what counts.
  const searchable = stripCommentsAndLiterals(serverCode)

  // eslint-disable-next-line no-cond-assign
  while ((match = call.exec(searchable)) !== null) {
    found = true
    for (const entry of splitPayloadEntries(match[1])) {
      // `{ liveNow }` and `{ liveNow: computeIt() }` both publish `liveNow`.
      const name = entry.split(':')[0].trim()
      if (/^[A-Za-z_$][\w$]*$/.test(name))
        names.add(name)
    }
  }

  return found ? [...names] : null
}

/**
 * Split an object literal's body on the commas that separate its entries.
 *
 * A plain `split(',')` breaks on the comma inside `{ a: f(x, y) }`, which would
 * silently publish a name of `y)` and drop nothing — the kind of failure that
 * shows up as a missing binding at runtime rather than an error here.
 */
function splitPayloadEntries(body: string): string[] {
  const entries: string[] = []
  let depth = 0
  let current = ''

  for (const char of body) {
    if (char === ',' && depth === 0) {
      entries.push(current)
      current = ''
      continue
    }
    if (char === '(' || char === '[' || char === '{')
      depth++
    else if (char === ')' || char === ']' || char === '}')
      depth--
    current += char
  }

  entries.push(current)

  return entries.filter(entry => entry.trim().length > 0)
}

/** Top-level `import` statements, and everything else, separated. */
export function splitTopLevelImports(code: string): { imports: string, body: string } {
  const importLine = /^[ \t]*import\b[\s\S]*?(?:from\s*['"][^'"]*['"]|['"][^'"]*['"])[ \t]*;?[ \t]*$/gm
  const imports: string[] = []

  const body = code.replace(importLine, (statement) => {
    imports.push(statement.trim())
    // Replaced by blank lines of the same count, so every remaining line keeps
    // its number — a diagnostic that points at the wrong line is worse than no
    // diagnostic.
    return statement.split('\n').map(() => '').join('\n')
  })

  return { imports: imports.join('\n'), body }
}

/**
 * Declarations that give a client block the server values it is actually given.
 *
 * A `<script client>` block is checked in its own buffer, so a name reaching it
 * through the server-to-client bridge was simply "Cannot find name" — which
 * means `stx typecheck` reported an error for every page that used the bridge
 * at all. A checker that invents errors gets muted, and a muted gate catches
 * nothing.
 *
 * The types are inferred rather than guessed. The server block is re-emitted
 * inside a wrapper function that returns exactly the declared payload, and each
 * published name is then declared as a lookup into that function's return type,
 * so `const liveNow = await countLive()` reaches the client block as whatever
 * `countLive` returns — not `any`, and not a hand-written annotation that can
 * drift from the code above it (#1868 ask 2).
 *
 * Everything is emitted with `var`, `function` and `type`, all of which hoist,
 * so this appends to the buffer and no line number moves.
 *
 * A page that declares nothing still gets its server bindings, as `any`. That
 * is exactly what the scraping bridge does — publish any server name the client
 * source mentions — and declaring `any` is the honest description of a value
 * whose delivery depends on textual reference. Omitting them instead would make
 * `stx typecheck` report "Cannot find name" on every page that uses the bridge
 * at all, and a checker that invents errors gets muted.
 *
 * So the incentive runs the right way: declare a payload and the names are
 * checked against the server block, or do not and they are `any`.
 */
/**
 * Top-level `interface X {…}` / `type X = …` statements, with their source text.
 *
 * The payload projection wraps the whole server body in a scope function so the
 * checker can infer each published value's type from real code. That works for
 * VALUES and traps TYPES: an `interface AutofixState` declared in
 * `<script server>` lives inside that function, so a `<script client>` block in
 * the same file naming it got `Cannot find name 'AutofixState'` — an error about
 * code that is correct and runs (stacksjs/stx#1924).
 *
 * Scanned at depth zero so an interface declared inside a helper is not lifted
 * out of the scope it belongs to. The brace matcher walks the real source rather
 * than a blanked copy, because the declaration's BODY is what has to be carried
 * across, not just its name.
 */
export function extractTypeDeclarations(code: string): Array<{ name: string, text: string }> {
  const searchable = stripCommentsAndLiterals(code)

  // Nesting depth at every offset, so a declaration inside a function body can
  // be told from one at the top level. Computed once rather than per match.
  const depthAt = new Array<number>(searchable.length)
  let depth = 0
  for (let i = 0; i < searchable.length; i++) {
    const c = searchable[i]
    if (c === '}' || c === ')' || c === ']')
      depth = Math.max(0, depth - 1)
    depthAt[i] = depth
    if (c === '{' || c === '(' || c === '[')
      depth++
  }

  const found: Array<{ name: string, text: string }> = []
  // `export` is allowed and carries no meaning here; the keyword is dropped.
  const start = /^[ \t]*(?:export[ \t]+)?(interface|type)[ \t]+([A-Za-z_$][\w$]*)/gm
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = start.exec(searchable)) !== null) {
    // Inside a function or an object literal: lifting it out would change what
    // the name refers to.
    if (depthAt[match.index] !== 0)
      continue

    const kind = match[1]
    const name = match[2]
    let end: number

    if (kind === 'interface') {
      // Body runs to the brace that closes the one opening it.
      const open = searchable.indexOf('{', match.index)
      if (open === -1)
        continue
      let depth = 0
      end = -1
      for (let i = open; i < searchable.length; i++) {
        if (searchable[i] === '{')
          depth++
        else if (searchable[i] === '}' && --depth === 0) {
          end = i + 1
          break
        }
      }
      if (end === -1)
        continue
    }
    else {
      // A type alias ends at the first top-level `;` or newline that is not
      // inside a brace, bracket or paren — a union may span many lines.
      let depth = 0
      end = searchable.length
      for (let i = searchable.indexOf('=', match.index) + 1; i < searchable.length; i++) {
        const c = searchable[i]
        if (c === '{' || c === '[' || c === '(' || c === '<')
          depth++
        else if (c === '}' || c === ']' || c === ')' || c === '>')
          depth--
        else if (depth <= 0 && (c === ';' || (c === '\n' && !/[=|&,<([{]\s*$/.test(searchable.slice(Math.max(0, i - 40), i))))) {
          end = c === ';' ? i + 1 : i
          break
        }
      }
    }

    found.push({ name, text: code.slice(match.index, end).replace(/^[ \t]*export[ \t]+/, '') })
    start.lastIndex = end
  }

  return found
}

/** Type names a block declares for itself, which must not be redeclared over it. */
function declaredTypeNames(code: string): Set<string> {
  return new Set(extractTypeDeclarations(code).map(entry => entry.name))
}

export function clientPayloadDeclarations(serverCode: string, clientCode = ''): string {
  const published = extractClientPayloadNames(serverCode)

  /*
   * Types the server block declares, carried across for the client block to name.
   *
   * A type is not data — it does not cross the bridge at runtime and needs no
   * payload entry — but the two blocks live in one file and authors write them
   * as one unit: the interface goes in the server block beside the value it
   * describes, and the client block annotates with it. That was
   * `Cannot find name`, an error about correct, working code (#1924).
   *
   * Skipped when the client block declares the same name itself, so a local
   * definition wins rather than colliding with the one lifted over it.
   */
  const ownTypes = declaredTypeNames(clientCode)
  const serverTypes = extractTypeDeclarations(serverCode)
    .filter(entry => !ownTypes.has(entry.name))
    .map(entry => entry.text)

  if (!published) {
    const scraped = collectBlockDeclarations(serverCode)
    if (scraped.length === 0 && serverTypes.length === 0)
      return ''

    return [
      '',
      `// ${SCRAPED_COMMENT}`,
      ...serverTypes,
      ...scraped.map(name => `declare var ${name}: any`),
    ].join('\n')
  }

  if (published.length === 0) {
    return serverTypes.length > 0
      ? ['', `// ${PAYLOAD_COMMENT}`, ...serverTypes].join('\n')
      : ''
  }

  const { imports, body } = splitTopLevelImports(serverCode)

  // `export` is illegal inside a function body, and a server block routinely
  // exports. The keyword carries no meaning for the inferred type.
  const scopeBody = body.replace(/^[ \t]*export[ \t]+(?=(?:const|let|var|function|async|class)\b)/gm, '')

  const parts = [
    '',
    `// ${PAYLOAD_COMMENT}`,
  ]

  if (imports)
    parts.push(imports)

  // Ahead of the scope function, which redeclares them in its own scope — the
  // inner one shadows and both are legal.
  parts.push(...serverTypes)

  parts.push(
    // `async`, so a server block using top-level await is still valid inside
    // it; `Awaited<…>` below unwraps the promise that costs.
    `async function ${PAYLOAD_SCOPE}() {`,
    scopeBody,
    `  return { ${published.join(', ')} }`,
    '}',
    `type ${PAYLOAD_TYPE} = Awaited<ReturnType<typeof ${PAYLOAD_SCOPE}>>`,
    // Each published name resolves to the wrapper's own binding, which shadows
    // the `declare var` below it — so this is a projection, not a cycle.
    ...published.map(name => `declare var ${name}: ${PAYLOAD_TYPE}[${JSON.stringify(name)}]`),
  )

  return parts.join('\n')
}


/**
 * Declarations at the TOP LEVEL of a block, ignoring anything nested.
 *
 * `collectBlockDeclarations` matches `^\s*const …` with leading whitespace
 * allowed, so it also returns bindings local to a function. For most callers
 * that is harmless. For the bridge warning it is not: a `const state` inside a
 * helper never crosses to the client, and naming it told the author to declare
 * a payload entry that would do nothing (stacksjs/stx#1908).
 *
 * Nested braces are blanked first, so only depth-zero declarations survive to
 * be matched by the shared patterns.
 */
export function collectTopLevelDeclarations(code: string): string[] {
  const source = stripCommentsAndLiterals(code)
  const chars = source.split('')
  let depth = 0

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    if (c === '{' || c === '(' || c === '[') {
      depth++
      continue
    }
    if (c === '}' || c === ')' || c === ']') {
      depth = Math.max(0, depth - 1)
      continue
    }
    // Keep newlines so the shared patterns still see line starts.
    if (depth > 0 && c !== '\n')
      chars[i] = ' '
  }

  return collectBlockDeclarations(chars.join(''))
}

/**
 * Server bindings a client block reaches for without a declared payload.
 *
 * The scraping bridge publishes a server binding when its name appears as a
 * free identifier in the client source, so these DO arrive at runtime — they
 * are just untyped, and their delivery depends on a textual coincidence rather
 * than on anything the page states. Reporting them is #1868 ask 4, and it is
 * only worth doing now that ask 2 gives them somewhere to go: warning people
 * off the implicit path before the typed replacement existed would have been
 * noise.
 *
 * A warning, not an error. These pages work; the fix is mechanical and the
 * reward is types rather than correctness, so a gate that fails CI over it
 * would be punishing an app for predating the feature.
 *
 * Empty once the page declares a payload, and empty when the client block does
 * not actually mention any server name.
 */
export function scrapedBridgeNames(serverCode: string, clientCode: string): string[] {
  if (extractClientPayloadNames(serverCode) !== null)
    return []

  const searchable = stripCommentsAndLiterals(clientCode)
  // The runtime destructures these from `window.stx` into every client block,
  // so the client already has them and the bridge never publishes one. Naming
  // `state` as a value that "reaches this block" was both wrong and actively
  // bad advice: `defineClientPayload({ state })` would shadow the runtime's
  // own (#1908).
  const provided = new Set<string>(STX_RUNTIME_GLOBALS)

  return collectTopLevelDeclarations(serverCode).filter((name) => {
    if (provided.has(name))
      return false
    // A name the client block declares for itself is not carried in either.
    if (collectBlockDeclarations(clientCode).includes(name))
      return false
    // The bridge's own rule: a free identifier, not a property access.
    const free = new RegExp(`(?<![.#\\w$])${name}(?![\\w$])`)
    return free.test(searchable)
  })
}

/** Marker comment so a generated preamble is recognisable in a dumped buffer. */
export const PAYLOAD_COMMENT = 'stx: types for the declared client payload (#1868)'
/** The same, for a page still relying on the name-scraping bridge. */
export const SCRAPED_COMMENT = 'stx: untyped bridge names — declare a defineClientPayload to check these (#1868)'
const PAYLOAD_SCOPE = '__stxServerScope'
const PAYLOAD_TYPE = '__StxClientPayload'
const PAYLOAD_NAMESPACE = '__StxServerBlock'

/**
 * Names the template engine puts in scope for every page.
 *
 * Declared rather than suppressed. The editor plugin used to drop every
 * "Cannot find name" whose message mentioned one of a hardcoded list, which
 * also dropped genuine typos; giving the names a declaration means an
 * unrecognised one is still an error (#1852 ask 3).
 */
export const STX_TEMPLATE_GLOBALS = [
  '$env',
  '$user',
  '$slot',
  '$slots',
  '$attrs',
  '$props',
  '$page',
  '$route',
  '$loop',
  /*
   * `loop` as well as `$loop`. The loop directive binds BOTH names to the same
   * context - see `loop:` / `$loop:` in `loops.ts` - and only the sigil form
   * was declared, so `{{ loop.index }}` and `{{ loop.last }}` were reported as
   * "Cannot find name 'loop'. Did you mean '$loop'?" against markup that works.
   */
  'loop',
  '$errors',
  '$csrf',
  'props',
  'slot',
] as const

/**
 * Names declared by both a server block and a client/plain block.
 *
 * The editor gets one buffer per file, so blocks cannot be given separate
 * modules the way the CLI does — they all land at top level and a name declared
 * on both sides reads as a redeclaration. That is a false signal, and this is
 * what lets the plugin suppress exactly those and nothing else.
 */
export function crossScopeCollisions(blocks: readonly ScriptBlock[]): string[] {
  const server = new Set<string>()
  const client = new Set<string>()
  for (const block of blocks) {
    const target = block.kind === 'server' ? server : client
    for (const name of collectBlockDeclarations(block.code))
      target.add(name)
  }
  return [...server].filter(name => client.has(name)).sort()
}

/** An event handler body that assigns straight to a template binding. */
const DIRECT_ASSIGNMENT_RE = /^\s*[A-Z_$][\w$]*\s*=[^=]/i

/**
 * Render one template expression as a checkable statement.
 *
 * Returns `null` for the shapes that cannot be modelled without inventing
 * errors — `@click="open = !open"` assigns to what TypeScript sees as a
 * `const`, and that form is documented stx syntax, not a mistake.
 */
/**
 * The `@if` / `@unless` conditions that enclose a given offset, outermost first
 * and already negated for `@else` / `@elseif` branches.
 *
 * Markup guards its own expressions, and the checker did not know it. A page
 * that writes
 *
 *   @if (comparison)
 *     {{ comparison.name }}
 *   @endif
 *
 * is safe, and `comparison` is `T | undefined` from the `.find()` above it, so
 * every read inside the branch came back as "possibly undefined" - 75 of them
 * in one application. Reported against markup that cannot fail is the fastest
 * way to make a checker ignored, and the advice it implies (add a `?.`) makes
 * the template worse.
 *
 * Conditions are emitted verbatim into `if (…)`, so a condition that does not
 * compile is reported where it is written - as its own template expression -
 * rather than twice.
 */
export function guardChainAt(source: string, offset: number): string[] {
  const directive = /@(if|unless|elseif|else|endif|endunless)\b\s*(\()?/g
  const stack: Array<{ conditions: string[] }> = []
  let match: RegExpExecArray | null

  while ((match = directive.exec(source)) !== null) {
    if (match.index >= offset)
      break

    const name = match[1]!

    if (name === 'endif' || name === 'endunless') {
      stack.pop()
      continue
    }

    // Read the balanced parenthesised condition, when there is one.
    let condition = ''
    if (match[2] === '(') {
      let depth = 0
      let index = match.index + match[0].length - 1
      const start = index + 1
      for (; index < source.length; index++) {
        const char = source[index]
        if (char === '(')
          depth++
        else if (char === ')') {
          depth--
          if (depth === 0)
            break
        }
      }
      condition = source.slice(start, index).trim()
      directive.lastIndex = index + 1
    }

    if (name === 'if') {
      stack.push({ conditions: [condition] })
    }
    else if (name === 'unless') {
      stack.push({ conditions: [`!(${condition})`] })
    }
    else if (name === 'elseif' || name === 'else') {
      // Everything before this branch is now known to be false, and an
      // `@elseif` adds its own condition on top.
      const current = stack[stack.length - 1]
      if (!current)
        continue
      const negated = current.conditions.map(c => `!(${c})`)
      current.conditions = name === 'elseif' ? [...negated, condition] : negated
    }
  }

  return stack.flatMap(entry => entry.conditions).filter(Boolean)
}

export function expressionStatement(
  expression: TemplateExpression,
): { text: string, prefixLength: number } | null {
  const code = expression.code.trim()
  if (!code)
    return null

  if (expression.attribute?.startsWith('@')) {
    // `@click="open = !open"` assigns to what TypeScript sees as a `const`.
    // That form is documented stx syntax, not a mistake, so it is not modelled
    // rather than reported (see the runtime's own isDirectAssignment guard).
    if (DIRECT_ASSIGNMENT_RE.test(code))
      return null
    const prefix = ';(($event: any): void => { '
    return { text: `${prefix}${code} });`, prefixLength: prefix.length }
  }

  const prefix = ';void (('
  return { text: `${prefix}${code}));`, prefixLength: prefix.length }
}

/**
 * The three places a module specifier can appear: `from '…'` (which covers both
 * `import … from` and `export … from`), a side-effect `import '…'`, and a
 * dynamic `import('…')` — the last of which is also the `import('./x').Foo`
 * type syntax.
 */
const RELATIVE_SPECIFIER_RE = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"\n]*)\2/g

/**
 * Rewrite relative module specifiers to absolute paths against the real file.
 *
 * A block's virtual buffer is written into the state directory, and TypeScript
 * resolves a relative specifier against the file that CONTAINS it — so
 * `../target`, written in `pages/deep/rel.stx`, was looked for next to
 * `.stx/typecheck/` and reported as a missing module (stacksjs/stx#1928).
 *
 * A `paths` alias to the same file resolved fine, because those go through the
 * absolute `baseUrl` the checker emits. That asymmetry is the whole bug: a
 * relative import is the first thing anyone writes and what every editor's
 * auto-import produces, so an app hitting it either rewrites correct imports
 * into aliases to appease the checker, or mutes the checker.
 *
 * Rewriting each specifier is preferred over pointing the program at the source
 * directory — `rootDirs`, the built-in answer for a virtual layout, MERGES its
 * entries into one namespace, so `./util` from one checked page could silently
 * resolve to a different page's `util` when both directories are roots. Each
 * buffer knows exactly one origin, so resolving per file cannot cross-talk.
 *
 * Textual rather than parsed, and deliberately: `Bun.Transpiler.scanImports`
 * erases `import type`, which is the form a type-checker cares about most. The
 * cost is that the literal text `from './x'` inside a string or comment is
 * rewritten too — inert, since this buffer is never executed, and it cannot
 * change a line count, so every diagnostic still lands on the author's line.
 */
export function absolutizeRelativeSpecifiers(code: string, originDir: string): string {
  if (!originDir)
    return code

  return code.replace(RELATIVE_SPECIFIER_RE, (_whole, prefix: string, quote: string, specifier: string) => {
    // Forward slashes even on Windows: a backslash inside the quoted specifier
    // would be read as a string escape.
    const absolute = path.resolve(originDir, specifier).replace(/\\/g, '/')
    return `${prefix}${quote}${absolute}${quote}`
  })
}

export interface BuildVirtualOptions {
  /** Append `{{ }}` and directive expressions. Default true. */
  templateExpressions?: boolean
  /**
   * Directory the `.stx` file really lives in.
   *
   * Relative imports in its script blocks are resolved against it, since the
   * buffer this builds is written somewhere else entirely (#1928).
   */
  originDir?: string
  /** Append ambient declarations at all. Default true. */
  globals?: boolean
  /**
   * Declare the stx runtime globals as `any`. Default true.
   *
   * Pass `false` when the program already includes the package's `stx.d.ts`,
   * which types them properly — these would shadow it.
   */
  runtimeGlobals?: boolean
}

/**
 * Build one line-aligned TypeScript buffer for a whole `.stx` file.
 *
 * Every script body is written at the line index it already occupies, so a
 * diagnostic's line and column are the `.stx` file's line and column with no
 * translation. Synthetic content is appended past the end of the file and
 * carried by {@link VirtualFile.lineMap}, so a diagnostic there still resolves
 * to a real position — or to nothing, for the ambient declarations, which is
 * how the caller knows to drop it.
 */
export function buildVirtualTypeScript(
  source: string,
  options: BuildVirtualOptions = {},
): VirtualFile {
  const blocks = extractScriptBlocks(source)
  const sourceLines = source.split('\n')
  const lines: string[] = Array.from({ length: sourceLines.length }, () => '')
  const lineMap = new Map<number, MappedLine>()

  for (const block of blocks) {
    // Line-count preserving, so every body line still lands on its own line (#1928).
    const bodyLines = absolutizeRelativeSpecifiers(block.code, options.originDir ?? '').split('\n')
    bodyLines.forEach((text, i) => {
      const index = block.startLine - 1 + i
      if (index < lines.length)
        lines[index] = text
    })
  }

  const append = (text: string, origin?: MappedLine): void => {
    lines.push(text)
    if (origin)
      lineMap.set(lines.length, origin)
  }

  if (options.globals !== false) {
    append('')
    // Skipped when the caller supplies the package's real `stx.d.ts`. These are
    // `any`, so emitting them alongside it would SHADOW the typed declarations
    // — the buffer is a module, so a local `declare var state: any` wins over
    // the ambient `state<T>(initial: T): StxSignal<T>` and every client-side
    // expression goes back to being unchecked (#1889).
    if (options.runtimeGlobals !== false) {
      for (const decl of runtimeGlobalDeclarations().split('\n'))
        append(decl)
    }
    for (const decl of serverContextDeclarations().split('\n'))
      append(decl)
    /*
     * The names stx auto-imports into a client script from
     * `@stacksjs/browser` - `debounce`, `useTimeoutFn`, `useDocumentVisibility`
     * and the rest of `BROWSER_CORE_IMPORTS`. They are injected at build time
     * and were declared nowhere, so the checker reported each one as
     * "Cannot find name" against a script that runs.
     *
     * `any`, like the other context names: their real types live in a package
     * this buffer does not import, and a wrong type would be worse than a
     * loose one.
     */
    for (const name of BROWSER_CORE_IMPORTS)
      append(`declare var ${name}: any`)
    for (const name of STX_TEMPLATE_GLOBALS)
      append(`declare var ${name}: any`)
    append(`declare var ${INTERPOLATION_PLACEHOLDER}: any`)

    // Loop bindings the markup introduces, which no script block declares.
    //
    // A binding drawn from an identifier a block declares gets that iterable's
    // ELEMENT type, so `@foreach(rows as row)` makes `{{ row.total_vists }}` an
    // error against a typed row. A name a block already declares is skipped:
    // redeclaring it would report a collision against the author's own code.
    const declared = new Set(blocks.flatMap(block => collectBlockDeclarations(block.code)))
    append(`type ${ELEMENT_HELPER}<T> = T extends readonly (infer E)[] ? E : T extends Iterable<infer E2> ? E2 : any`)
    for (const binding of collectTemplateBindings(source)) {
      if (declared.has(binding.name))
        continue
      const type = binding.iterable && declared.has(binding.iterable)
        ? `${ELEMENT_HELPER}<typeof ${binding.iterable}>`
        : 'any'
      append(`declare var ${binding.name}: ${type}`)
    }
  }

  if (options.templateExpressions !== false) {
    const statements = extractTemplateExpressions(source)
      .map(expression => ({ expression, statement: expressionStatement(expression) }))
      .filter((entry): entry is { expression: TemplateExpression, statement: { text: string, prefixLength: number } } =>
        entry.statement !== null)

    if (statements.length > 0) {
      // Re-type the script blocks' own bindings for the template's reading of
      // them, by shadowing each as a parameter of a wrapper function. A
      // parameter is the only way to give a name a second type without
      // redeclaring it, which would collide with the author's own code.
      //
      // The type aliases are hoisted to the top level on purpose: writing
      // `(count: __StxTemplateValue<typeof count>)` inline makes the annotation
      // reference the parameter it is annotating, which TypeScript reads as a
      // circular initialiser.
      const maskedSource = maskNonTemplateRegions(source)
      const declared = [...new Set(blocks.flatMap(block => collectBlockDeclarations(block.code)))]
      const shadowed = declared.filter(name => /^[A-Z_$][\w$]*$/i.test(name))

      let indent = 0
      if (shadowed.length > 0) {
        append(UNWRAP_HELPER_DECL)
        for (const name of shadowed)
          append(`type __StxT_${name} = ${UNWRAP_HELPER}<typeof ${name}>`)
        append(`;((${shadowed.map(name => `${name}: __StxT_${name}`).join(', ')}) => {`)
        indent = 1
      }

      for (const { expression, statement } of statements) {
        const pad = '  '.repeat(indent)
        /*
         * Wrapped in the `@if` / `@unless` blocks that enclose it, so a guard
         * the markup already applies narrows the expression the same way it
         * would in TypeScript. One `if` per expression rather than grouping:
         * the statement stays on one line, so its diagnostic keeps pointing at
         * the source line and column it came from.
         */
        const guards = expression.offset === undefined
          ? []
          : guardChainAt(maskedSource, expression.offset)
        // Braced, because every statement starts with `;` for ASI safety and
        // `if (x) ;void(…)` makes that semicolon the if-body - which TypeScript
        // rejects outright as TS1313.
        const guardPrefix = guards.length > 0
          ? `${guards.map(condition => `if (${condition}) `).join('')}{ `
          : ''
        const guardSuffix = guards.length > 0 ? ' }' : ''

        append(pad + guardPrefix + statement.text + guardSuffix, {
          line: expression.line,
          column: expression.column,
          expression,
          prefixLength: statement.prefixLength + pad.length + guardPrefix.length,
        })
      }

      if (indent > 0)
        append('});')
    }
  }

  // Makes the buffer a MODULE. Without it a block-less file is a global script,
  // so a top-level `const open` does not shadow lib.dom's `open` and
  // `open.set(…)` reports against `Window.open` instead of the signal. Any name
  // lib.dom happens to claim — `name`, `status`, `length`, `close` — hits this.
  append('export {}')

  return { text: lines.join('\n'), lineMap, sourceLineCount: sourceLines.length }
}

/** Offsets at which each 1-based line starts. */
export function lineStarts(text: string): number[] {
  const starts = [0]
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10)
      starts.push(i + 1)
  }
  return starts
}

/** Offset → 1-based line and column. */
export function offsetToPosition(starts: readonly number[], offset: number): { line: number, column: number } {
  let low = 0
  let high = starts.length - 1
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (starts[mid] <= offset)
      low = mid
    else high = mid - 1
  }
  return { line: low + 1, column: offset - starts[low] + 1 }
}

/** 1-based line and column → offset, clamped to the line. */
export function positionToOffset(starts: readonly number[], line: number, column: number): number {
  const index = Math.min(Math.max(line, 1), starts.length) - 1
  const next = index + 1 < starts.length ? starts[index + 1] - 1 : Number.MAX_SAFE_INTEGER
  return Math.min(starts[index] + Math.max(column, 1) - 1, next)
}

/** Where a diagnostic in a virtual buffer belongs in the `.stx` file. */
export interface ResolvedPosition {
  line: number
  column: number
  /** Set when the diagnostic came from a template expression. */
  expression?: TemplateExpression
}

/**
 * Translate a position in a virtual buffer back to the `.stx` file.
 *
 * Returns `null` for the ambient declarations appended past the end of the
 * file — they correspond to nothing the author wrote, so a diagnostic there
 * must be dropped rather than pointed at an arbitrary line.
 */
export function resolvePosition(
  virtual: VirtualFile,
  line: number,
  column: number,
): ResolvedPosition | null {
  const mapped = virtual.lineMap.get(line)

  if (!mapped) {
    // Script-block content sits at the line it already occupies.
    return line <= virtual.sourceLineCount ? { line, column } : null
  }

  const within = Math.max(0, column - 1 - (mapped.prefixLength ?? 0))
  return {
    line: mapped.line,
    column: mapped.column + within,
    expression: mapped.expression,
  }
}
