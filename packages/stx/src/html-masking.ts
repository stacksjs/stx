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
  const tokens: string[] = []
  let output = ''
  let i = 0
  const n = html.length
  let inTag = false // between `<` and `>` of a (non-masked) tag
  let quote: string | null = null

  while (i < n) {
    const ch = html[i]

    if (inTag) {
      output += ch
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

    if (ch === '<') {
      const end = match(html, i)
      if (end > i) {
        output += placeholder(html.slice(i, end), tokens.length)
        tokens.push(html.slice(i, end))
        i = end
        continue
      }
      // Not a maskable token. If it's a tag start, track its attribute/quote
      // state; otherwise treat `<` as ordinary text.
      if (/^<\/?[a-zA-Z]/.test(html.slice(i, i + 2))) {
        inTag = true
      }
      output += ch
      i++
      continue
    }

    output += ch
    i++
  }

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
