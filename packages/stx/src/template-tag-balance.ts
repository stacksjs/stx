/**
 * Dev-mode template tag-balance check (stacksjs/stx#1769).
 *
 * A single dropped closing tag (e.g. a missing `</div>`) is silently
 * auto-closed by the HTML parser at EOF, re-parenting every following sibling
 * INSIDE the unclosed element. Those siblings then inherit the element's
 * `x-show`/`display:none` state and render blank — with zero diagnostics at any
 * layer (the server 200s, hydration succeeds, no console output). The failure
 * is purely structural and only visible by eye.
 *
 * This does a coarse, void- and optional-close-aware open/close COUNT per tag
 * name and reports any mismatch. It intentionally does not attempt a full HTML
 * parse: the goal is a cheap, high-signal dev heads-up, not a validator.
 */

// Void elements never take a closing tag — excluded from counting entirely.
const VOID_TAGS: ReadonlySet<string> = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

// Elements whose end tag may be legally omitted (HTML spec). A count mismatch
// on these is usually idiomatic (`<li>`/`<td>`/`<p>` without a close), so we
// never warn on them — this is what keeps the check false-positive-free.
const OPTIONAL_CLOSE_TAGS: ReadonlySet<string> = new Set([
  'html', 'head', 'body', 'p', 'li', 'dt', 'dd', 'rt', 'rp',
  'option', 'optgroup', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'colgroup', 'caption',
])

export interface TagBalanceIssue {
  /** Tag name as written (case preserved, so `<Icon>`/`</Icon>` match). */
  tag: string
  opened: number
  closed: number
  /** 1-based line of the first opening tag of this name (best-effort). */
  firstOpenLine: number
}

/** Replace every non-newline char with a space so line/column numbers of the
 *  surviving text stay accurate after a region is neutralised. */
function blankKeepingLines(s: string): string {
  return s.replace(/[^\n]/g, ' ')
}

/**
 * Return the set of tag names whose opening/closing counts don't balance.
 * Pure and side-effect free.
 */
export function findUnbalancedTags(template: string): TagBalanceIssue[] {
  // Neutralise regions where a `<`/`>` is not markup: scripts, styles, HTML
  // comments and stx interpolations. Quoted attribute values are handled by
  // the tag matcher below; stripping every quoted region from the full
  // template would mistake prose apostrophes for quote delimiters.
  const stripped = template
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, blankKeepingLines)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, blankKeepingLines)
    .replace(/<!--[\s\S]*?-->/g, blankKeepingLines)
    .replace(/\{\{\{[\s\S]*?\}\}\}/g, blankKeepingLines)
    .replace(/\{\{[\s\S]*?\}\}/g, blankKeepingLines)
    .replace(/\{!![\s\S]*?!!\}/g, blankKeepingLines)

  interface OpenInfo { count: number, firstLine: number }
  const opens = new Map<string, OpenInfo>()
  const closes = new Map<string, number>()

  // Keep `>` inside quoted attributes within the same tag without treating
  // apostrophes in normal text as the start of a quoted region.
  const tagRe = /<(\/?)([A-Za-z][\w-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*?(\/?)>/g
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = tagRe.exec(stripped)) !== null) {
    const isClose = m[1] === '/'
    const name = m[2]
    const selfClose = m[3] === '/'
    if (VOID_TAGS.has(name.toLowerCase()))
      continue
    if (selfClose)
      continue
    if (isClose) {
      closes.set(name, (closes.get(name) ?? 0) + 1)
    }
    else {
      const existing = opens.get(name)
      if (existing) {
        existing.count++
      }
      else {
        const line = stripped.slice(0, m.index).split('\n').length
        opens.set(name, { count: 1, firstLine: line })
      }
    }
  }

  const issues: TagBalanceIssue[] = []
  for (const name of new Set([...opens.keys(), ...closes.keys()])) {
    if (OPTIONAL_CLOSE_TAGS.has(name.toLowerCase()))
      continue
    const opened = opens.get(name)?.count ?? 0
    const closed = closes.get(name) ?? 0
    if (opened !== closed)
      issues.push({ tag: name, opened, closed, firstOpenLine: opens.get(name)?.firstLine ?? 0 })
  }
  return issues
}

// Dedupe key = filePath + template length, so a given broken file warns once
// (not once per request or per @include site); an edit that changes the file's
// length re-arms the warning. Dev-only + bounded to actually-broken files.
const warnedKeys = new Set<string>()

/**
 * Dev-mode warning: log any tag-balance issues for a template. Best-effort — a
 * diagnostic must never throw and break the build.
 */
export function warnUnbalancedTags(template: string, filePath: string): void {
  let issues: TagBalanceIssue[]
  try {
    issues = findUnbalancedTags(template)
  }
  catch {
    return
  }
  if (issues.length === 0)
    return

  const dedupeKey = `${filePath}:${template.length}`
  if (warnedKeys.has(dedupeKey))
    return
  warnedKeys.add(dedupeKey)

  const label = filePath ? (filePath.split(/[/\\]/).pop() || filePath) : 'template'
  for (const { tag, opened, closed, firstOpenLine } of issues) {
    if (opened > closed) {
      const where = firstOpenLine ? ` (first opened at line ${firstOpenLine})` : ''
      console.warn(
        `[stx] ${label}: <${tag}> ${opened} opened, ${closed} closed — an unclosed <${tag}>${where} `
        + `may swallow the content that follows it.`,
      )
    }
    else {
      console.warn(
        `[stx] ${label}: <${tag}> ${opened} opened, ${closed} closed — ${closed - opened} stray </${tag}>.`,
      )
    }
  }
}
