/**
 * Codemods for adopting stx primitives an app hand-rolled around (#1843).
 *
 * Two production apps built on stx reached past it into vanilla JS for things
 * it already ships. The audit found the cause was discovery, not absence: one
 * app called bare `confirm()` in five places and used `title=` thirteen times
 * while `stxConfirm` and `x-tooltip` were both delivered and used zero times.
 * A native fallback that WORKS is the hardest kind of gap to notice — nothing
 * fails, so nothing prompts you to look.
 *
 * #1843 proposes both rewrites as "mechanical and safe". Neither is, and the
 * difference matters enough that this tool reports by default and only edits
 * when asked:
 *
 *   - `confirm()` returns a boolean synchronously; `stxConfirm()` returns a
 *     Promise. `if (confirm(m))` rewritten to `if (stxConfirm(m))` is ALWAYS
 *     TRUE, because a Promise is truthy. A blind rewrite turns every "Delete
 *     this?" into an unconditional yes.
 *
 *   - `title=` is announced by screen readers. `x-tooltip` sets no `role` and
 *     no `aria-*` — it is a visual tooltip driven by mouseover/focusin.
 *     Replacing one with the other removes the accessible description. So the
 *     tooltip rule ADDS `x-tooltip` and keeps `title`.
 */

export type CodemodRule = 'confirm' | 'tooltip'

export interface CodemodFinding {
  file: string
  line: number
  rule: CodemodRule
  /** Whether this site was (or would be) rewritten. */
  applied: boolean
  /** Why it was left alone, when it was. */
  reason?: string
  snippet: string
}

export interface CodemodFileResult {
  code: string
  findings: CodemodFinding[]
}

export interface CodemodOptions {
  /** Which rules to run. Default: both. */
  rules?: CodemodRule[]
  /** File name used in findings. */
  file?: string
}

const DEFAULT_RULES: CodemodRule[] = ['confirm', 'tooltip']

function lineOf(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i++) {
    if (source[i] === '\n')
      line++
  }
  return line
}

function snippetAt(source: string, index: number): string {
  const start = source.lastIndexOf('\n', index) + 1
  const end = source.indexOf('\n', index)
  return source.slice(start, end === -1 ? source.length : end).trim().slice(0, 120)
}

/**
 * Whether the call at `index` sits inside an `async` function.
 *
 * Deliberately conservative: it walks back to the nearest function boundary and
 * only answers yes when it can see `async` on it. Anything it cannot prove —
 * a call nested in a callback, a method shorthand, a construct this does not
 * model — is reported rather than rewritten. Being wrong here silently breaks
 * a confirmation dialog, so "not sure" has to mean "don't touch".
 */
function isInsideAsyncFunction(source: string, index: number): boolean {
  const before = source.slice(0, index)

  // Nearest `function` / `=>` opener before the call.
  const fnKeyword = before.lastIndexOf('function')
  const arrow = before.lastIndexOf('=>')
  const boundary = Math.max(fnKeyword, arrow)
  if (boundary === -1)
    return false

  // `async` has to reach that opener without crossing a statement terminator
  // or a block brace: `async function`, `async (a, b) =>`, `async x =>` all
  // qualify, while `async function f() { arr.map(x => …` does not — the `{`
  // between them means the arrow is a DIFFERENT, synchronous function, and
  // rewriting inside it would produce exactly the always-true bug.
  const window = source.slice(Math.max(0, boundary - 120), boundary)
  return /\basync\b[^;{}]*$/.test(window)
}

/**
 * `confirm(...)` → `await stxConfirm(...)`, only where provably safe.
 *
 * Matches a call in statement or expression position but NOT a property access
 * (`window.confirm`, `this.confirm`) and not a declaration of the same name.
 */
function applyConfirmRule(source: string, file: string, findings: CodemodFinding[]): string {
  const pattern = /(^|[^\w$.])confirm\s*\(/g
  let out = ''
  let last = 0
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(source)) !== null) {
    const callAt = match.index + match[1].length
    const line = lineOf(source, callAt)
    const snippet = snippetAt(source, callAt)

    // Already migrated, or the app's own helper — leave it.
    if (/stxConfirm\s*\($/.test(source.slice(0, callAt + 'confirm('.length))) {
      continue
    }

    const safe = isInsideAsyncFunction(source, callAt)

    findings.push({
      file,
      line,
      rule: 'confirm',
      applied: safe,
      snippet,
      reason: safe
        ? undefined
        : 'stxConfirm() returns a Promise and native confirm() is synchronous, so this needs `await` inside an async function. '
          + 'Rewriting it here would make the condition always true.',
    })

    if (safe) {
      out += source.slice(last, callAt) + 'await stxConfirm('
      last = callAt + 'confirm('.length
    }
  }

  return out + source.slice(last)
}

/**
 * `title="…"` → `x-tooltip="…" title="…"`.
 *
 * Additive on purpose. `title` carries the accessible description that a
 * screen reader announces; `x-tooltip` sets no role and no aria-*, so
 * replacing one with the other is an accessibility regression dressed up as
 * an upgrade. Keeping both gets the styled tooltip without losing anything.
 */
function applyTooltipRule(source: string, file: string, findings: CodemodFinding[]): string {
  // Attribute only — never the `<title>` element, which is a different thing
  // entirely (and inside `<svg>` it IS the accessible name).
  const pattern = /(<[a-z][\w-]*\b[^>]*?)\stitle=(["'])(.*?)\2/gis
  let out = ''
  let last = 0
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(source)) !== null) {
    const [whole, openTag, quote, value] = match
    const line = lineOf(source, match.index)
    const snippet = snippetAt(source, match.index)

    // Already has one, or the value is dynamic in a way we should not guess at.
    if (/\bx-tooltip[=\s]/.test(openTag) || value.trim() === '') {
      findings.push({
        file,
        line,
        rule: 'tooltip',
        applied: false,
        snippet,
        reason: /\bx-tooltip[=\s]/.test(openTag) ? 'already has x-tooltip' : 'empty title',
      })
      continue
    }

    findings.push({ file, line, rule: 'tooltip', applied: true, snippet })

    out += source.slice(last, match.index)
      + `${openTag} x-tooltip=${quote}${value}${quote} title=${quote}${value}${quote}`
    last = match.index + whole.length
  }

  return out + source.slice(last)
}

/** Run the codemods over one file's source. */
export function codemodSource(source: string, options: CodemodOptions = {}): CodemodFileResult {
  const rules = options.rules ?? DEFAULT_RULES
  const file = options.file ?? '<source>'
  const findings: CodemodFinding[] = []

  let code = source
  if (rules.includes('confirm'))
    code = applyConfirmRule(code, file, findings)
  if (rules.includes('tooltip'))
    code = applyTooltipRule(code, file, findings)

  return { code, findings }
}

/** Human-readable report. */
export function formatCodemodFindings(findings: CodemodFinding[], wrote: boolean): string {
  if (findings.length === 0)
    return 'No hand-rolled equivalents found.'

  const applied = findings.filter(f => f.applied)
  const skipped = findings.filter(f => !f.applied)
  const lines: string[] = []

  if (applied.length > 0) {
    lines.push(wrote ? `Rewrote ${applied.length} site(s):` : `Would rewrite ${applied.length} site(s) (pass --fix):`)
    for (const f of applied)
      lines.push(`  ${f.file}:${f.line}  [${f.rule}]  ${f.snippet}`)
  }

  if (skipped.length > 0) {
    lines.push('', `Needs a human — ${skipped.length} site(s):`)
    for (const f of skipped)
      lines.push(`  ${f.file}:${f.line}  [${f.rule}]  ${f.snippet}\n      ${f.reason}`)
  }

  return lines.join('\n')
}
