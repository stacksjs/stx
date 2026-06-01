/**
 * stx-strict — the documented-footgun linter (stacksjs/stx#1744, Phase 1).
 *
 * A self-contained detection engine: feed it `.stx` (or store `.ts`) source
 * and it returns diagnostics for the patterns that "look correct but do
 * nothing / do the wrong thing" at runtime. It deliberately has NO imports
 * from the rest of the package (no template pipeline, no i18n) so it's cheap
 * to run and trivially unit-testable; wiring it into pickier / the CLI / the
 * editor is a thin follow-up (Phase 1 ships the hard part — correct detection
 * with low false-positive rate).
 *
 * Phase 1 covers the five highest-hit footguns from the issue:
 *   1. stx/no-bare-function-ref-in-event       `@click="toggleLike"` (no parens)
 *   2. stx/no-view-level-script-client         `<script client>` in a view file
 *   3. stx/store-value-imports-must-be-local   value import escaping resources/stores/
 *   4. stx/no-signal-call-in-for-iteration-var calling the `:for` loop var like a signal
 *   5. stx/no-backticks-in-html-comments       a backtick inside an HTML comment
 *
 * Remaining footguns (web-components, template tags, @include loop-var
 * forwarding, etc.) are Phase 2.
 */

export type StxStrictRuleId =
  | 'stx/no-bare-function-ref-in-event'
  | 'stx/no-view-level-script-client'
  | 'stx/store-value-imports-must-be-local'
  | 'stx/no-signal-call-in-for-iteration-var'
  | 'stx/no-backticks-in-html-comments'

export interface StxStrictDiagnostic {
  ruleId: StxStrictRuleId
  message: string
  /** 1-based line number. */
  line: number
  /** 1-based column number. */
  column: number
  severity: 'error' | 'warning'
}

export interface StxStrictOptions {
  /** Used for view/component + store-file classification. */
  filePath?: string
  /**
   * Override the view/component verdict that drives the view-level
   * `<script client>` rule. Default: a path containing `/components/`
   * (or `/Components/`) is a component, everything else is a view.
   */
  fileKind?: 'view' | 'component'
  /** Enable/disable individual rules. Unlisted rules default to ON. */
  rules?: Partial<Record<StxStrictRuleId, boolean>>
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Attribute-form names that are stx directives, NOT DOM event handlers. */
const DIRECTIVE_ATTR_NAMES = new Set([
  'if', 'else', 'elseif', 'else-if', 'for', 'foreach', 'show', 'model',
  'html', 'text', 'bind', 'key', 'ref', 'once', 'memo', 'slot', 'teleport',
  'cloak', 'pre', 'effect', 'init',
])

/** Void HTML elements — no closing tag, so they have no element body. */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

/** Escape a string for safe interpolation into a `new RegExp(...)`. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Compute the [start,end) spans of every `<script>`/`<style>` body + the tags. */
function rawTextSpans(src: string): Array<[number, number]> {
  const spans: Array<[number, number]> = []
  const re = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(src)) !== null) spans.push([m.index, m.index + m[0].length])
  return spans
}

function inSpans(spans: Array<[number, number]>, i: number): boolean {
  for (const [s, e] of spans) {
    if (i >= s && i < e) return true
  }
  return false
}

/** Map a 0-based char offset to 1-based { line, column }. */
function offsetToLineCol(src: string, offset: number): { line: number, column: number } {
  let line = 1
  let lineStart = 0
  for (let i = 0; i < offset && i < src.length; i++) {
    if (src[i] === '\n') {
      line++
      lineStart = i + 1
    }
  }
  return { line, column: offset - lineStart + 1 }
}

/** Find the end index of `<tag …>…</tag>` (one past the close), or -1. */
function elementEnd(src: string, tag: string, startTagEnd: number): number {
  const lower = tag.toLowerCase()
  const len = src.length
  let depth = 1
  let i = startTagEnd
  while (i < len) {
    const lt = src.indexOf('<', i)
    if (lt === -1) return -1
    i = lt
    if (src.startsWith('<!--', i)) {
      const c = src.indexOf('-->', i + 4)
      if (c === -1) return -1
      i = c + 3
      continue
    }
    if (src[i + 1] === '/') {
      const m = /^<\/([a-z][\w-]*)\s*>/i.exec(src.slice(i, i + 64))
      if (!m) { i++; continue }
      if (m[1].toLowerCase() === lower) {
        depth--
        i += m[0].length
        if (depth === 0) return i
        continue
      }
      i += m[0].length
      continue
    }
    const om = /^<([a-z][\w-]*)\b/i.exec(src.slice(i, i + 64))
    if (!om) { i++; continue }
    const gt = src.indexOf('>', i)
    if (gt === -1) return -1
    if (om[1].toLowerCase() === lower && src[gt - 1] !== '/') depth++
    i = gt + 1
  }
  return -1
}

// ---------------------------------------------------------------------------
// Rule 1 — bare function reference in an event handler
// ---------------------------------------------------------------------------

function ruleBareFunctionRef(src: string, spans: Array<[number, number]>, out: StxStrictDiagnostic[]): void {
  // @event(.modifier)*="value"  — events use the `@` attribute prefix. The name
  // may contain `:` (namespaced events like @update:modelValue) and `-`.
  const re = /@([a-z][\w:-]*)((?:\.[a-z][\w-]*)*)\s*=\s*"([^"]*)"/gi
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(src)) !== null) {
    if (inSpans(spans, m.index)) continue
    // Directive check uses the segment before any `:` (so @model:foo is still
    // treated as the model directive, but @update:modelValue is an event).
    const base = m[1].toLowerCase().split(':')[0]
    if (DIRECTIVE_ATTR_NAMES.has(base)) continue // @if/@for/etc are directives, not events
    const value = m[3].trim()
    // A bare ref is a pure identifier or member path with no call, operator,
    // assignment, arrow, or whitespace — i.e. `handler` or `store.method`.
    if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(value)) {
      const at = src.indexOf(m[3], m.index)
      const { line, column } = offsetToLineCol(src, at < 0 ? m.index : at)
      out.push({
        ruleId: 'stx/no-bare-function-ref-in-event',
        message: `Event handler @${m[1]}="${value}" is a bare reference and will not fire. Call it: @${m[1]}="${value}()".`,
        line,
        column,
        severity: 'error',
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Rule 2 — view-level <script client>
// ---------------------------------------------------------------------------

function ruleViewLevelScriptClient(src: string, fileKind: 'view' | 'component', out: StxStrictDiagnostic[]): void {
  if (fileKind !== 'view') return
  const re = /<script\b([^>]*)>/gi
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(src)) !== null) {
    // `client` as a standalone attribute (not part of e.g. `data-client`).
    // The captured attr string excludes the closing `>`, so allow end-of-string
    // after `client` as well as a following space / `=` / `/`.
    if (/(?:^|\s)client(?=[\s/=]|$)/i.test(m[1])) {
      const { line, column } = offsetToLineCol(src, m.index)
      out.push({
        ruleId: 'stx/no-view-level-script-client',
        message: `<script client> at the top level of a view is silently dropped — only components get client scopes. Move it into a component, or use <script> (server).`,
        line,
        column,
        severity: 'error',
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Rule 3 — store value imports must resolve inside resources/stores/
// ---------------------------------------------------------------------------

/** Normalize a POSIX-ish path, collapsing `.`/`..` segments. */
function normalizePath(p: string): string {
  const parts = p.split('/')
  const out: string[] = []
  for (const seg of parts) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') out.pop()
    else out.push(seg)
  }
  return out.join('/')
}

function ruleStoreValueImports(src: string, filePath: string, out: StxStrictDiagnostic[]): void {
  const norm = filePath.replace(/\\/g, '/')
  const storesIdx = norm.indexOf('resources/stores/')
  if (storesIdx === -1) return
  const storesRoot = norm.slice(0, storesIdx + 'resources/stores'.length)
  const fileDir = norm.slice(0, norm.lastIndexOf('/'))

  // import|export [type] … from '<spec>'  — only flag VALUE bindings (type-only
  // erased). `export … from` re-exports are part of the store bundle too, so
  // they're checked alongside `import`.
  const re = /\b(import|export)\s+(type\s+)?([^'"]*?)\s*from\s*['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(src)) !== null) {
    if (m[2]) continue // `import type …` / `export type …` — erased, safe
    const kind = m[1]
    const spec = m[4]
    let outside: boolean
    if (spec.startsWith('.')) {
      const resolved = normalizePath(`${fileDir}/${spec}`)
      outside = !resolved.startsWith(normalizePath(storesRoot))
    }
    else {
      outside = true // bare specifier / alias — resolves outside the stores dir
    }
    if (outside) {
      const { line, column } = offsetToLineCol(src, m.index)
      const verb = kind === 'export' ? 'Value re-export' : 'Value import'
      out.push({
        ruleId: 'stx/store-value-imports-must-be-local',
        message: `${verb} from "${spec}" is outside resources/stores/ and will be stripped from the store bundle. Use \`${kind} type\`, or move the value into the stores dir.`,
        line,
        column,
        severity: 'error',
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Rule 4 — calling the :for iteration variable like a signal
// ---------------------------------------------------------------------------

/** Extract ALL bound variables from a `:for` expression (value + key/index). */
function forIterationVars(expr: string): string[] {
  const e = expr.trim()
  const idents = (s: string): string[] => {
    const found = s.match(/[A-Za-z_$][\w$]*/g)
    return found ? found : []
  }
  // Blade: "iterable as idx => item" | "iterable as (item, idx)" | "iterable as item"
  const asM = /\bas\s+(.+)$/.exec(e)
  if (asM) {
    const rhs = asM[1].trim()
    const arrow = /^([A-Za-z_$][\w$]*)\s*=>\s*([A-Za-z_$][\w$]*)/.exec(rhs)
    if (arrow) return [arrow[1], arrow[2]]
    const paren = /^\(([^)]*)\)/.exec(rhs)
    if (paren) return idents(paren[1])
    const bare = /^([A-Za-z_$][\w$]*)/.exec(rhs)
    return bare ? [bare[1]] : []
  }
  // JS: "(item, idx) in iterable" | "item of iterable" | "item in iterable"
  const paren = /^\(([^)]*)\)\s+(?:in|of)\s+/.exec(e)
  if (paren) return idents(paren[1])
  const jsM = /^([A-Za-z_$][\w$]*)\s+(?:in|of)\s+/.exec(e)
  return jsM ? [jsM[1]] : []
}

function ruleSignalCallInForVar(src: string, out: StxStrictDiagnostic[]): void {
  const re = /(?::for|x-for|@for)\s*=\s*"([^"]*)"/gi
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(src)) !== null) {
    const vars = forIterationVars(m[1])
    if (vars.length === 0) continue
    const tagStart = src.lastIndexOf('<', m.index)
    if (tagStart === -1) continue
    const tagM = /^<([a-z][\w-]*)/i.exec(src.slice(tagStart, tagStart + 64))
    if (!tagM) continue
    const startTagEnd = src.indexOf('>', m.index)
    if (startTagEnd === -1) continue

    // Search region = the OPENING TAG (so calls in sibling attributes like
    // :key="item()" / @change="item()" are caught) PLUS the element body — but
    // not for void/self-closing elements, which have no body. The `:for`
    // attribute's own value is masked so the iterable expression can't match.
    const isVoid = src[startTagEnd - 1] === '/' || VOID_TAGS.has(tagM[1].toLowerCase())
    const end = isVoid ? startTagEnd + 1 : elementEnd(src, tagM[1], startTagEnd + 1)
    const regionEnd = end === -1 ? startTagEnd + 1 : end
    // Build the region with the :for value blanked (same length, so offsets hold).
    const forValStart = src.indexOf(m[1], m.index)
    let region = src.slice(tagStart, regionEnd)
    if (forValStart >= 0 && forValStart + m[1].length <= regionEnd) {
      const rel = forValStart - tagStart
      region = region.slice(0, rel) + ' '.repeat(m[1].length) + region.slice(rel + m[1].length)
    }

    for (const v of vars) {
      // `var(` not preceded by `.`/word — i.e. calling the loop var itself. The
      // var name is escaped (e.g. `$` is regex-special).
      const callRe = new RegExp(`(?<![.\\w$])${escapeRegExp(v)}\\s*\\(`, 'g')
      let c: RegExpExecArray | null
      // eslint-disable-next-line no-cond-assign
      while ((c = callRe.exec(region)) !== null) {
        const abs = tagStart + c.index
        const { line, column } = offsetToLineCol(src, abs)
        out.push({
          ruleId: 'stx/no-signal-call-in-for-iteration-var',
          message: `"${v}" is a :for iteration variable, not a signal — calling it as "${v}()" leaves it as a function and silently breaks comparisons. Use "${v}" directly.`,
          line,
          column,
          severity: 'error',
        })
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Rule 5 — backticks inside HTML comments
// ---------------------------------------------------------------------------

function ruleBackticksInHtmlComments(src: string, out: StxStrictDiagnostic[]): void {
  const re = /<!--([\s\S]*?)-->/g
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(src)) !== null) {
    const body = m[1]
    const tick = body.indexOf('`')
    if (tick !== -1) {
      const abs = m.index + 4 + tick
      const { line, column } = offsetToLineCol(src, abs)
      out.push({
        ruleId: 'stx/no-backticks-in-html-comments',
        message: `Backtick inside an HTML comment leaks into the merged setup function and flips the JS parser into template-literal mode. Remove it or rephrase the comment.`,
        line,
        column,
        severity: 'error',
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function isRuleOn(rules: StxStrictOptions['rules'], id: StxStrictRuleId): boolean {
  return rules?.[id] !== false
}

/**
 * Lint a single source string for the Phase-1 stx footguns.
 *
 * @example
 * ```ts
 * const diagnostics = lintStxStrict(source, { filePath: 'resources/views/login.stx' })
 * for (const d of diagnostics)
 *   console.error(`${d.line}:${d.column} ${d.ruleId} — ${d.message}`)
 * ```
 */
export function lintStxStrict(source: string, options: StxStrictOptions = {}): StxStrictDiagnostic[] {
  const out: StxStrictDiagnostic[] = []
  const spans = rawTextSpans(source)
  const filePath = (options.filePath ?? '').replace(/\\/g, '/')
  const fileKind: 'view' | 'component' = options.fileKind
    ?? (/\/components?\//i.test(filePath) ? 'component' : 'view')

  if (isRuleOn(options.rules, 'stx/no-bare-function-ref-in-event'))
    ruleBareFunctionRef(source, spans, out)
  if (isRuleOn(options.rules, 'stx/no-view-level-script-client'))
    ruleViewLevelScriptClient(source, fileKind, out)
  if (filePath && isRuleOn(options.rules, 'stx/store-value-imports-must-be-local'))
    ruleStoreValueImports(source, filePath, out)
  if (isRuleOn(options.rules, 'stx/no-signal-call-in-for-iteration-var'))
    ruleSignalCallInForVar(source, out)
  if (isRuleOn(options.rules, 'stx/no-backticks-in-html-comments'))
    ruleBackticksInHtmlComments(source, out)

  // Stable order: by position.
  out.sort((a, b) => (a.line - b.line) || (a.column - b.column))
  // Dedupe by (ruleId, line, column): nested same-named :for loops can have an
  // outer pass and an inner pass both report the identical call site.
  const seen = new Set<string>()
  return out.filter((d) => {
    const k = `${d.ruleId}:${d.line}:${d.column}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
