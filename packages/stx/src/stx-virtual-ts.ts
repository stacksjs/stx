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
 * Pull the script blocks out of a `.stx` source, with the line each body starts on.
 *
 * `<script server>` and `<script client>` are recognised by attribute. A bare
 * `<script>` is reported as `plain`: it ships to the browser verbatim without
 * the auto-import preamble, so it is a different checking context and callers
 * may want to skip it.
 */
export function extractScriptBlocks(source: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = []
  SCRIPT_RE.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = SCRIPT_RE.exec(source)) !== null) {
    const attrs = (match[1] || '').trim()
    const body = match[2] ?? ''

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
    const openTag = match[0].match(/^<script[^>]*>/i)?.[0] ?? '<script>'
    const startLine = lineAt(source, match.index + openTag.length)

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

/** Attributes that carry markup or a plain string, never an expression. */
const NON_EXPRESSION_ATTRS = new Set([
  'x-cloak',
  'x-ref',
  'x-transition',
  'x-teleport',
  'v-slot',
  'x-hydrate',
  ':key',
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
      kind: 'interpolation',
    })
  }

  DIRECTIVE_ATTR_RE.lastIndex = 0
  while ((m = DIRECTIVE_ATTR_RE.exec(masked)) !== null) {
    const name = m[1]
    const value = m[3] ?? ''
    // Strip event/directive modifiers: `@keydown.enter` is still `@keydown`.
    const base = name.replace(/\..*$/, '')
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

  // @foreach(items as item) / @foreach(items as key => value)
  for (const m of source.matchAll(/@for(?:each|else)\s*\(([\s\S]*?)\)/g)) {
    const asMatch = m[1].match(/^([\s\S]*?)\bas\b([\s\S]*)$/)
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
] as const

export function serverContextDeclarations(): string {
  return STX_SERVER_CONTEXT.map(name => `declare var ${name}: any`).join('\n')
}

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

export interface BuildVirtualOptions {
  /** Append `{{ }}` and directive expressions. Default true. */
  templateExpressions?: boolean
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
    const bodyLines = block.code.split('\n')
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
        append(pad + statement.text, {
          line: expression.line,
          column: expression.column,
          expression,
          prefixLength: statement.prefixLength + pad.length,
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
