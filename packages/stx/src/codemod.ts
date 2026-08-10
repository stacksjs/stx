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

import { stripCommentsAndLiterals } from './strip-literals'

export type CodemodRule
  = | 'confirm'
    | 'alert'
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
    rule: 'alert',
    /*
     * `stxAlert` sits directly beside `stxConfirm` in the runtime — same
     * signature, same `_createDialog` call, both on `window` — but only
     * `confirm` had a rule, so the native call it replaces was invisible. One
     * app had 30 `alert()` calls in a single file, none reported, while the
     * same run correctly flagged all 3 of its `confirm()` sites
     * (stacksjs/stx#1903).
     *
     * Report-only, and for a DIFFERENT reason than `confirm`. `confirm` is
     * dangerous because the return value flips: `if (stxConfirm(m))` is always
     * true. `alert` has no return value to get wrong — the difference is that
     * native `alert()` BLOCKS and `stxAlert()` does not, so anything after it
     * in the same block used to run after dismissal and would now run
     * immediately:
     *
     *     alert('About to reload')
     *     location.reload()
     *
     * Safe to rewrite only when nothing follows in the block, which is harder
     * to prove than the async check `confirm` uses and worth much less. So this
     * reports, and says why.
     */
    // `window.alert(...)` counts for the same reason `window.confirm(...)` does
    // (#1914): it is the spelling a linted codebase uses. Any other receiver is
    // somebody else's method and is still excluded.
    pattern: /(?<![.#\w$])(?:(?:window|globalThis)\s*\.\s*)?alert\s*\(/g,
    primitive: 'stxAlert(message)',
    why: 'themed, focus-trapped and non-blocking — but `await` it if the code after it '
      + 'depended on the native dialog blocking until dismissal',
    // `window.alert(...)` is an explicit choice of the native dialog, and a
    // file with its own `alert` is not calling the global one (#1898's lesson).
    reject: source => /\b(?:async\s+)?function\s+alert\s*\(/.test(source)
      || /\b(?:const|let|var)\s+alert\s*=/.test(source),
  },
  {
    rule: 'search-params',
    pattern: /new\s+URLSearchParams\s*\(/g,
    primitive: 'useSearchParams()',
    why: 'reactive, and writes back through the router instead of history.replaceState',
    /*
     * Only a constructor that READS the current query is adopting search-param
     * state. `new URLSearchParams()` followed by `p.set(…)` is building a query
     * string for a link, and there is nothing to adopt (stacksjs/stx#1909).
     */
    reject: (source, index) => {
      const open = source.indexOf('(', index)
      if (open === -1)
        return true
      const arg = source.slice(open + 1, source.indexOf(')', open) + 1)
      return !/\b(?:location|search|href|url)\b/i.test(arg)
    },
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
 * Whether this file declares a `confirm` of its own.
 *
 * Covers the shapes a component actually uses: a function declaration, a
 * `const`/`let` bound to a function or arrow, a method in an object literal,
 * and a destructured import. A `defineEmits` event NAMED confirm does not
 * count — `emit('confirm')` is a string, not a binding.
 */
function declaresOwnConfirm(source: string): boolean {
  return /\b(?:async\s+)?function\s+confirm\s*\(/.test(source)
    || /\b(?:const|let|var)\s+confirm\s*=/.test(source)
    || /\bimport\s*\{[^}]*\bconfirm\b[^}]*\}/.test(source)
}

/**
 * `confirm(...)` → `await stxConfirm(...)`, only where provably safe.
 *
 * Matches a call in statement or expression position but NOT a property access
 * (`window.confirm`, `this.confirm`) and not a declaration of the same name.
 */
function applyConfirmRule(source: string, file: string, findings: CodemodFinding[]): string {
  /*
   * A file that declares its own `confirm` is not calling the browser's
   * (stacksjs/stx#1898). `ConfirmDialog.stx` — the component whose entire
   * purpose is to BE the replacement — declares `function confirm()` and calls
   * it from its own template, and got reported twice for doing so.
   *
   * Bailing on the whole file rather than resolving scopes: the shadowing
   * declaration and the calls are routinely in different blocks of the same
   * `.stx` file (a `<script client>` function, a `@click` in the markup), so
   * anything narrower has to model scope across the block boundary to get the
   * common case right. The cost is a missed rewrite in a file that both
   * declares a `confirm` and separately calls the global one, which is not a
   * thing anyone writes.
   */
  if (declaresOwnConfirm(source))
    return source

  /*
   * `window.confirm(...)` counts (stacksjs/stx#1914).
   *
   * This used to skip it, on the reasoning that naming the global is "an
   * explicit choice of the native dialog". That reasoning was wrong: several
   * style guides REQUIRE the explicit global, so it is the form a linted
   * codebase is most likely to contain. In one real app the rule found 1 of 3
   * sites, and the 2 it missed were the destructive ones.
   *
   * Still excludes any OTHER receiver: `this.confirm(...)` and
   * `dialog.confirm(...)` are somebody else's method, not the browser's.
   */
  const pattern = /(^|[^\w$.])(?:(?:window|globalThis)\s*\.\s*)?confirm\s*\(/g
  // Matched against the code view so a `confirm(...)` NAMED in a comment or a
  // string is not a call (#1905). Positions are preserved, so every slice below
  // Matched against the code view so a `confirm(...)` NAMED in a comment or a
  // string is not a call (#1905). Positions are preserved, so every slice below
  // still comes from the real source.
  const searchable = searchableSource(source)
  let out = ''
  let last = 0
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(searchable)) !== null) {
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
      // The match may be `window.confirm(`, so the replaced span is whatever
      // was matched after the leading boundary character, not a fixed width.
      out += source.slice(last, callAt) + 'await stxConfirm('
      last = callAt + (match[0].length - match[1].length)
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
  // Matched against a copy with HTML comments blanked, so a `title=` inside a
  // commented-out block is not rewritten (#1905). Attribute values survive —
  // this view blanks comments only, which is why it is not the code view.
  const searchable = markupSearchable(source)
  let out = ''
  let last = 0
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(searchable)) !== null) {
    const [whole, openTag, quote, value] = match
    const line = lineOf(source, match.index)
    const snippet = snippetAt(source, match.index)

    /*
     * A capitalised tag is a component, and its `title` is a PROP, not an HTML
     * attribute (stacksjs/stx#1902).
     *
     * The rule's justification for keeping `title` — that it carries the
     * accessible description a screen reader announces — is about the HTML
     * attribute. On `<ValueCard title="MIT licensed">` the prop is rendered
     * into an `<h3>`: there is no native tooltip and no accessible description
     * to preserve, so the rewrite migrates nothing and invents a second thing.
     * It also produces `x-tooltip` ON a component, which is the construct
     * #1830 was filed about, and duplicates the card's own heading as hover
     * text.
     *
     * Reported rather than skipped, because a component MAY be forwarding the
     * prop to a real element and a human can tell. Same "needs a human" bucket
     * the `confirm` rule uses.
     */
    const tagName = openTag.match(/^<([A-Za-z][\w-]*)/)?.[1] ?? ''
    if (/^[A-Z]/.test(tagName)) {
      findings.push({
        file,
        line,
        rule: 'tooltip',
        applied: false,
        snippet,
        reason: `\`title\` on <${tagName}> is a component prop, not an HTML attribute — `
          + 'adding x-tooltip here would put a tooltip on a component and may duplicate text it already renders.',
      })
      continue
    }

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
 * The same idea for a rule that reads MARKUP rather than JavaScript.
 *
 * Only HTML comments are blanked. `stripCommentsAndLiterals` cannot be used
 * here: it is JavaScript-aware, so it would blank `title="Top sources"` — the
 * attribute VALUE the tooltip rule has to read and copy.
 */
function markupSearchable(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, ' '))
    .replace(/\{\{--[\s\S]*?--\}\}/g, match => match.replace(/[^\n]/g, ' '))
}


/**
 * Blank JavaScript comments, keeping string literals.
 *
 * For the rules whose pattern names a string and so cannot match without one.
 */
function blankJsComments(source: string): string {
  const blank = (match: string): string => match.replace(/[^\n]/g, ' ')

  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, blank)
}

/**
 * The text a code rule should actually match against.
 *
 * Three things are blanked, all positions-preserving so a match index still
 * points at the real source and `reject`/`requires` still read the original
 * (stacksjs/stx#1905):
 *
 * 1. **Comments and string literals.** Three of six report hits in one app were
 *    prose — and every one described code that had ALREADY been migrated, since
 *    the comments existed to explain the migration. So the rule fired hardest
 *    on exactly the code that already complied, which is close to the worst
 *    possible signal.
 *
 * 2. **`<script server>` blocks.** Every primitive these rules suggest is a
 *    client-side one, so `new URLSearchParams()` in a server block is correct
 *    code being told to adopt a reactive composable it cannot use.
 *
 * 3. Nothing else — markup stays, because the tooltip rule reads it.
 *
 * A rule whose pattern names a string — `addEventListener('click', …)` — keeps
 * its literals, or it could never match. That is decided from the pattern's own
 * source rather than a hand-kept list of exceptions, because a list of rules
 * that must agree with another list of rules is how this codebase has been
 * bitten repeatedly.
 *
 * `stripCommentsAndLiterals` is the same function the server-to-client bridge
 * and `stx typecheck` use to decide what counts as a reference. One rule, one
 * implementation.
 */
function searchableSource(source: string, keepStrings = false): string {
  const markupOnly = markupSearchable(source)
  const blanked = keepStrings ? blankJsComments(markupOnly) : stripCommentsAndLiterals(markupOnly)

  /*
   * Every script element that is NOT `<script client>`, blanked whole.
   *
   * A `<script server>` block is the obvious one: the primitives these rules
   * suggest are all client-side. But a plain `<script>` is just as wrong, and
   * for a sharper reason (stacksjs/stx#1909) — it runs BEFORE the stx runtime
   * loads, which is usually the entire point of writing one:
   *
   *     <script>  // pre-paint auth bounce, runs before the runtime exists
   *     if (!hasToken()) window.location.replace('/login')
   *     </script>
   *
   * `navigate()` does not exist at that moment, so the suggestion is not merely
   * unhelpful, it is impossible to apply. Only a `<script client>` block is
   * guaranteed the runtime.
   */
  return blanked.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (match, attrs: string) =>
    /\bclient\b/i.test(attrs) ? match : match.replace(/[^\n]/g, ' '))
}

/**
 * Report the patterns that cannot be rewritten safely.
 *
 * Never edits, so it runs against the ORIGINAL source and its line numbers stay
 * true regardless of what the rewrite rules did.
 */
function applyReportRules(source: string, file: string, rules: CodemodRule[], findings: CodemodFinding[]): void {
  // Two views, picked per rule: a pattern that names a string needs its
  // literals, everything else is safer without them.
  const codeView = searchableSource(source)
  const stringView = searchableSource(source, true)

  for (const entry of REPORT_RULES) {
    if (!rules.includes(entry.rule))
      continue
    if (entry.requires && !entry.requires(source))
      continue

    entry.pattern.lastIndex = 0
    let match: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    const searchable = /['"]/.test(entry.pattern.source) ? stringView : codeView
    entry.pattern.lastIndex = 0
    while ((match = entry.pattern.exec(searchable)) !== null) {
      // `reject` reads the ORIGINAL text: it inspects what surrounds a match,
      // and `location.href = 'mailto:…'` is decided by the string literal the
      // searchable view has blanked away.
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

  // One line, one finding per rule. A rule whose pattern is an alternation can
  // match the same construct twice, and two reports of one site read as two
  // problems (#1905).
  const seen = new Set<string>()
  const unique = findings.filter((finding) => {
    const key = `${finding.rule}:${finding.line}`
    if (seen.has(key))
      return false
    seen.add(key)
    return true
  })

  return { code, findings: unique }
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
