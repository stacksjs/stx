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

export type CodemodRule
  = | 'confirm'
    | 'tooltip'
    | 'route-params'
    | 'search-params'
    | 'navigate'
    | 'fetch'
    | 'polling'
    | 'debounce'
    | 'click-outside'
    | 'focus'
    | 'clipboard'
    | 'watch'

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

/**
 * Patterns that are REPORTED, never rewritten.
 *
 * The two rules above can edit because the mapping is local and total. These
 * cannot: `location.pathname.match(/\/judges\/(\d+)/)` becomes
 * `useRouteParam('id')` only if you know what the route pattern is called, and
 * a hand `fetch` + `AbortController` becomes `useFetch` only by restructuring
 * the component around it. A tool that guessed would produce diffs nobody can
 * review.
 *
 * Reporting is most of the value anyway. #1843's whole finding is that these
 * primitives are delivered and used ZERO times — one app called bare `confirm()`
 * five times while `stxConfirm` shipped unused — so the gap is knowing they
 * exist, not typing the replacement.
 *
 * Each entry is deliberately narrow. A detector that fires on ordinary code
 * gets the whole tool muted, which is the same failure as not shipping it.
 */
interface ReportRule {
  rule: CodemodRule
  pattern: RegExp
  /** What to reach for instead. */
  primitive: string
  /** Why the hand-rolled version is worse. */
  why: string
  /**
   * Extra condition on the whole file, for patterns that are only a smell in
   * combination — `setTimeout` alone is not a debounce.
   */
  requires?: (source: string) => boolean
  /**
   * Reject an individual hit by looking at what surrounds it.
   *
   * Both uses here came out of running the detectors over the example corpus:
   * `setInterval(updateClock, 1000)` is a clock, not polling, and
   * `location.href = 'mailto:…'` cannot become `navigate()` at all. A detector
   * that fires on those teaches people to ignore the tool.
   */
  reject?: (source: string, index: number) => boolean
}

/** The text just after a match, for local context checks. */
function contextAfter(source: string, index: number, length = 240): string {
  return source.slice(index, index + length)
}

const REPORT_RULES: ReportRule[] = [
  {
    rule: 'route-params',
    pattern: /\blocation\s*\.\s*pathname\s*\.\s*(?:match|split)\s*\(/g,
    primitive: 'useRoute() / useRouteParams() / useRouteParam(name)',
    why: 'parsing the URL by hand re-implements the router and does not update on SPA navigation',
  },
  {
    rule: 'search-params',
    pattern: /new\s+URLSearchParams\s*\(/g,
    primitive: 'useSearchParams()',
    why: 'reactive, and writes back through the router instead of history.replaceState',
  },
  {
    rule: 'navigate',
    pattern: /\blocation\s*\.\s*(?:assign|replace)\s*\(|\blocation\s*\.\s*href\s*=/g,
    primitive: 'navigate(path) / goBack()',
    why: 'a full document load throws away every store and the scroll position; navigate() is an SPA transition',
    // An external or non-http destination is not something navigate() handles —
    // `location.href = 'mailto:…'` is the correct code.
    reject: (source, index) =>
      /^[^\n]*?(?:['"`]\s*)?(?:mailto:|tel:|sms:|https?:\/\/|\/\/)/.test(contextAfter(source, index, 160)),
  },
  {
    rule: 'fetch',
    pattern: /new\s+AbortController\s*\(/g,
    primitive: 'useFetch(url) / useAsyncData(key, fn)',
    why: 'cancellation, loading and error state are already wired; hand-rolling them is where the races live',
  },
  {
    rule: 'polling',
    pattern: /setInterval\s*\(/g,
    primitive: 'useEventSource() / useSSE() / useWebSocket() / useChannel()',
    why: 'polling burns requests and lags; the push primitives are delivered',
    // Only a smell when THIS interval hits the network. A file-wide check was
    // not enough: `setInterval(updateClock, 1000)` in a file that fetches
    // somewhere else is a clock, and reporting it is noise.
    reject: (source, index) => !/\bfetch\s*\(|\$fetch\b|useFetch\b|\.get\s*\(|axios\b/
      .test(contextAfter(source, index)),
  },
  {
    rule: 'debounce',
    pattern: /\bclearTimeout\s*\(/g,
    primitive: 'useDebounce(fn, ms) / useThrottle(fn, ms)',
    why: 'a hand-held timer handle per call site is the usual source of stale-result bugs',
    requires: source => /setTimeout\s*\(/.test(source),
  },
  {
    rule: 'click-outside',
    pattern: /document\s*\.\s*addEventListener\s*\(\s*['"](?:click|mousedown|pointerdown)['"]/g,
    primitive: 'useClickOutside(ref, fn)',
    why: 'the document-level listener plus the blur race is exactly what this composable exists to remove',
  },
  {
    rule: 'focus',
    pattern: /\.\s*(?:getElementById|querySelector)\s*\([^)]*\)\s*(?:\?\.)?\s*\.?focus\s*\(/g,
    primitive: 'useFocus(ref) with x-ref',
    why: 'a query by id breaks under nested scopes and SPA navigation; a ref does not',
  },
  {
    rule: 'clipboard',
    pattern: /navigator\s*\.\s*(?:clipboard|share)\b/g,
    primitive: 'useClipboard() / useShare()',
    why: 'permission state, the copied flag and the unsupported-browser fallback are already handled',
  },
  {
    rule: 'watch',
    // The documented hack: an effect whose body only exists to touch signals.
    pattern: /\beffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\bvoid\s+\w+\s*\(\s*\)/g,
    primitive: 'watch(source, cb) / watchMultiple([...], cb)',
    why: 'the `void a(); void b()` dance is a manual dependency list; watch takes one directly',
  },
]

const DEFAULT_RULES: CodemodRule[] = ['confirm', 'tooltip', ...REPORT_RULES.map(r => r.rule)]

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

/**
 * Report the patterns that cannot be rewritten safely.
 *
 * Never edits, so it runs against the ORIGINAL source and its line numbers stay
 * true regardless of what the rewrite rules did.
 */
function applyReportRules(source: string, file: string, rules: CodemodRule[], findings: CodemodFinding[]): void {
  for (const entry of REPORT_RULES) {
    if (!rules.includes(entry.rule))
      continue
    if (entry.requires && !entry.requires(source))
      continue

    entry.pattern.lastIndex = 0
    let match: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((match = entry.pattern.exec(source)) !== null) {
      if (entry.reject?.(source, match.index))
        continue
      findings.push({
        file,
        line: lineOf(source, match.index),
        rule: entry.rule,
        applied: false,
        snippet: snippetAt(source, match.index),
        reason: `${entry.primitive} — ${entry.why}`,
      })
    }
  }
}

/** Run the codemods over one file's source. */
export function codemodSource(source: string, options: CodemodOptions = {}): CodemodFileResult {
  const rules = options.rules ?? DEFAULT_RULES
  const file = options.file ?? '<source>'
  const findings: CodemodFinding[] = []

  // Detection first, against the untouched source.
  applyReportRules(source, file, rules, findings)

  let code = source
  if (rules.includes('confirm'))
    code = applyConfirmRule(code, file, findings)
  if (rules.includes('tooltip'))
    code = applyTooltipRule(code, file, findings)

  findings.sort((a, b) => a.line - b.line)
  return { code, findings }
}

/** Rules that can rewrite; everything else is reported only. */
const REWRITABLE = new Set<CodemodRule>(['confirm', 'tooltip'])

/** Human-readable report. */
export function formatCodemodFindings(findings: CodemodFinding[], wrote: boolean): string {
  if (findings.length === 0)
    return 'No hand-rolled equivalents found.'

  const applied = findings.filter(f => f.applied)
  // A rewrite that was declined is a different thing from a pattern that was
  // only ever going to be reported — the first needs a decision, the second is
  // a suggestion. Rolling them together made every finding look like a chore.
  const declined = findings.filter(f => !f.applied && REWRITABLE.has(f.rule))
  const adopt = findings.filter(f => !f.applied && !REWRITABLE.has(f.rule))
  const lines: string[] = []

  if (applied.length > 0) {
    lines.push(wrote ? `Rewrote ${applied.length} site(s):` : `Would rewrite ${applied.length} site(s) (pass --fix):`)
    for (const f of applied)
      lines.push(`  ${f.file}:${f.line}  [${f.rule}]  ${f.snippet}`)
  }

  if (declined.length > 0) {
    lines.push('', `Needs a human — ${declined.length} site(s):`)
    for (const f of declined)
      lines.push(`  ${f.file}:${f.line}  [${f.rule}]  ${f.snippet}\n      ${f.reason}`)
  }

  if (adopt.length > 0) {
    lines.push('', `An stx primitive already covers this — ${adopt.length} site(s):`)
    for (const f of adopt)
      lines.push(`  ${f.file}:${f.line}  [${f.rule}]  ${f.snippet}\n      use ${f.reason}`)
  }

  return lines.join('\n')
}
