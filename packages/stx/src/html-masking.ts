/**
 * Element-position-aware masking.
 *
 * Several pipeline stages temporarily replace `<script>…</script>` bodies or
 * `<!-- … -->` comments with sentinel placeholders so later passes don't process
 * their contents, then restore them at the end. A naive global regex
 * (`/<script…>…<\/script>/g`, `/<!--…-->/g`) also matches such a token when it
 * appears INSIDE a quoted attribute value — e.g. `aria-label="<script>x</script>"`
 * or `title="<!-- "><img onerror=alert(1)> -->"`. The renderer's HTML-escaping
 * then runs against the harmless placeholder, and the raw token is restored into
 * the attribute afterward, breaking out of it — an XSS.
 *
 * `maskAtElementPosition` walks the string tracking tag/attribute/quote state and
 * only masks tokens that begin at *element position* (not within an open tag, not
 * inside a quoted attribute value). A token embedded in an attribute is left in
 * place to be escaped normally.
 *
 * This is a leaf module (no stx imports) so any stage can use it without risking
 * an import cycle.
 *
 * @module html-masking
 */

/**
 * Locate a maskable token starting at `html[i]`.
 * @returns the end index (exclusive) of the token, or -1 if none starts here.
 */
export type TokenMatcher = (html: string, i: number) => number

export interface ElementPositionToken {
  start: number
  end: number
  token: string
}

// Sticky (`y`) open matchers anchor at `lastIndex` without slicing; global (`g`)
// close matchers scan forward from `lastIndex`. This keeps maskAtElementPosition
// O(n) overall instead of O(n²) (no per-`<` substring copy).
const SCRIPT_OPEN = /<script\b[^>]*>/iy
const SCRIPT_CLOSE = /<\/script\s*>/ig
const STYLE_OPEN = /<style\b[^>]*>/iy
const STYLE_CLOSE = /<\/style\s*>/ig

function matchElement(html: string, i: number, open: RegExp, close: RegExp): number {
  open.lastIndex = i
  const om = open.exec(html)
  if (!om || om.index !== i)
    return -1
  close.lastIndex = open.lastIndex
  const cm = close.exec(html)
  if (!cm)
    return -1
  return cm.index + cm[0].length
}

/** Matches a real `<script…>…</script>` element (through the first `</script>`). */
export function matchScriptElement(html: string, i: number): number {
  return matchElement(html, i, SCRIPT_OPEN, SCRIPT_CLOSE)
}

/** Matches a real `<style…>…</style>` element (through the first `</style>`). */
export function matchStyleElement(html: string, i: number): number {
  return matchElement(html, i, STYLE_OPEN, STYLE_CLOSE)
}

/** Matches an HTML comment `<!-- … -->` (through the first `-->`). */
export function matchHtmlComment(html: string, i: number): number {
  if (!html.startsWith('<!--', i))
    return -1
  const closeRel = html.indexOf('-->', i + 4)
  if (closeRel === -1)
    return -1
  return closeRel + '-->'.length
}

/**
 * Return the end of an opaque HTML region at `i`.
 *
 * Comments and raw-text elements are opaque to the browser tokenizer. A
 * `<script>` substring inside an HTML comment, a style body, or another script
 * body is text, not an element. Unclosed opaque regions consume the remainder
 * of the document, matching browser parsing closely enough for template scans.
 */
function matchOpaqueRegion(html: string, i: number): number {
  if (html.startsWith('<!--', i)) {
    const end = matchHtmlComment(html, i)
    return end === -1 ? html.length : end
  }

  for (const [open, close] of [
    [SCRIPT_OPEN, SCRIPT_CLOSE],
    [STYLE_OPEN, STYLE_CLOSE],
  ] as const) {
    open.lastIndex = i
    const opening = open.exec(html)
    if (!opening || opening.index !== i)
      continue

    close.lastIndex = open.lastIndex
    const closing = close.exec(html)
    return closing ? closing.index + closing[0].length : html.length
  }

  return -1
}

/**
 * Find tokens that begin where an HTML element can actually start.
 *
 * The walk also treats comments and script/style raw-text bodies as opaque, so
 * callers never see tag-like text nested inside those regions.
 */
export function scanAtElementPosition(html: string, match: TokenMatcher): ElementPositionToken[] {
  const tokens: ElementPositionToken[] = []
  let i = 0
  const n = html.length
  let inTag = false
  let quote: string | null = null

  while (i < n) {
    const ch = html[i]

    if (inTag) {
      if (quote) {
        if (ch === quote)
          quote = null
      }
      else if (ch === '"' || ch === '\'') {
        quote = ch
      }
      else if (ch === '>') {
        inTag = false
      }
      i++
      continue
    }

    if (ch !== '<') {
      i++
      continue
    }

    const end = match(html, i)
    if (end > i) {
      tokens.push({ start: i, end, token: html.slice(i, end) })
      i = end
      continue
    }

    const opaqueEnd = matchOpaqueRegion(html, i)
    if (opaqueEnd > i) {
      i = opaqueEnd
      continue
    }

    if (/^<\/?[a-zA-Z]/.test(html.slice(i, i + 2)))
      inTag = true
    i++
  }

  return tokens
}

/**
 * Mask every token (per `match`) that begins at element position, replacing it
 * with `placeholder(token, index)`. Returns the rewritten string plus the ordered
 * list of removed tokens. Restore by replacing each placeholder with `tokens[i]`.
 *
 * Note: HTML attributes do not use backslash escaping, so a `"`/`'` always
 * toggles the surrounding quote — matching how browsers parse attribute values.
 */
export function maskAtElementPosition(
  html: string,
  match: TokenMatcher,
  placeholder: (token: string, index: number) => string,
): { output: string, tokens: string[] } {
  const matches = scanAtElementPosition(html, match)
  if (matches.length === 0)
    return { output: html, tokens: [] }

  const tokens = matches.map(item => item.token)
  let output = ''
  let cursor = 0
  for (let index = 0; index < matches.length; index++) {
    const item = matches[index]
    output += html.slice(cursor, item.start)
    output += placeholder(item.token, index)
    cursor = item.end
  }
  output += html.slice(cursor)

  return { output, tokens }
}

/**
 * Stash genuine `<script>…</script>` ELEMENTS behind NUL-byte sentinels so a
 * component scanner doesn't mis-resolve tag-like JS string literals (e.g.
 * `div.innerHTML = '<v:shape>'`) as component references (stacksjs/stx#1730), and
 * so an attribute-embedded `<script>` is never pulled out and restored unescaped.
 */
export function stashScriptElements(html: string): { output: string, scripts: string[] } {
  const { output, tokens } = maskAtElementPosition(
    html,
    matchScriptElement,
    (_token, index) => `\x00STX_SCRIPT_${index}\x00`,
  )
  return { output, scripts: tokens }
}

/** Restore scripts stashed by {@link stashScriptElements}. */
export function restoreStashedScripts(html: string, scripts: string[]): string {
  if (scripts.length === 0)
    return html
  return html.replace(/\x00STX_SCRIPT_(\d+)\x00/g, (_, idx) => scripts[+idx] ?? '')
}
