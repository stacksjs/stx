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

  // No short-lived pair array/iterator for every ordinary opening tag.
  SCRIPT_OPEN.lastIndex = i
  const scriptOpen = SCRIPT_OPEN.exec(html)
  if (scriptOpen?.index === i) {
    SCRIPT_CLOSE.lastIndex = SCRIPT_OPEN.lastIndex
    const close = SCRIPT_CLOSE.exec(html)
    return close ? close.index + close[0].length : html.length
  }

  STYLE_OPEN.lastIndex = i
  const styleOpen = STYLE_OPEN.exec(html)
  if (styleOpen?.index === i) {
    STYLE_CLOSE.lastIndex = STYLE_OPEN.lastIndex
    const close = STYLE_CLOSE.exec(html)
    return close ? close.index + close[0].length : html.length
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
      // Most pages are text (or a large inlined runtime). Seek the next tag
      // in native code instead of indexing one JS character at a time.
      const next = html.indexOf('<', i + 1)
      if (next === -1)
        break
      i = next
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

    // Preserve the old two-character anchored test: it did not enter tag
    // state for a closing `</...>` because the slash occupied that span.
    const letter = html.charCodeAt(i + 1)
    if ((letter >= 65 && letter <= 90) || (letter >= 97 && letter <= 122))
      inTag = true
    i++
  }

  return tokens
}

/**
 * Cheap, conservative preflight for the unresolved-expression cloak pass.
 *
 * A mustache in an element's own text needs at least two opening and two
 * closing braces outside tags, comments, and script/style raw text. They may
 * be separated by child elements, so looking only for contiguous `{{` is NOT
 * sufficient. False positives merely run the normal cloak scan; false
 * negatives would leave an unresolved expression visible.
 */
export function mightContainOwnTextMustache(html: string): boolean {
  let opening = 0
  let closing = 0
  let i = 0
  let inTag = false
  let quote: string | null = null

  while (i < html.length) {
    if (inTag) {
      const ch = html[i]
      if (quote) {
        if (ch === quote) quote = null
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

    const lt = html.indexOf('<', i)
    const textEnd = lt === -1 ? html.length : lt
    while (i < textEnd) {
      const ch = html[i++]
      if (ch === '{') opening++
      else if (ch === '}') closing++
      if (opening >= 2 && closing >= 2)
        return true
    }
    if (lt === -1)
      break

    const opaqueEnd = matchOpaqueRegion(html, lt)
    if (opaqueEnd > lt) {
      i = opaqueEnd
      continue
    }

    const first = html.charCodeAt(lt + 1)
    const letter = first === 47 ? html.charCodeAt(lt + 2) : first
    if ((letter >= 65 && letter <= 90) || (letter >= 97 && letter <= 122))
      inTag = true
    i = lt + 1
  }

  return false
}

/**
 * Drop the oldest entries until there is room for one more.
 *
 * Wholesale `clear()` was the first version and it made the caches useless: a
 * render cycles through more distinct documents than the cap, so hitting the cap
 * wiped the entry that was about to be reused. Measured on the #1945 fixture, one
 * key-and-content pair missed 24 times in a row — computed every time, hit never.
 * A Map iterates in insertion order, so the first key is the oldest.
 */
function evictOldest(cache: Map<string, unknown>, maxEntries: number): void {
  while (cache.size >= maxEntries) {
    const oldest = cache.keys().next()
    if (oldest.done)
      return
    cache.delete(oldest.value)
  }
}

/**
 * Opt-in memo for callers that mask the same document repeatedly.
 *
 * `maskAtElementPosition` cannot decide this for itself: the result depends on
 * the `placeholder` callback, which is a closure the cache cannot inspect. So
 * the caller supplies a key that fully determines that callback's behaviour —
 * for the comment mask in component-renderer.ts that is the placeholder prefix
 * plus the index offset — and takes responsibility for its uniqueness. No key,
 * no caching.
 *
 * Worth it because the component pipeline re-enters over unchanged content: the
 * comment mask alone rebuilds 3.1MB of document across 34 calls in one render of
 * the #1945 fixture, twelve of them byte-identical at the same offset.
 *
 * Bounded and large-inputs-only, like the stash cache below it, and for the same
 * reason: this holds documents alive, and caching the small majority of calls
 * would make that unbounded.
 */
const MASK_CACHE_MIN_BYTES = 65536
const MASK_CACHE_MAX_ENTRIES = 12
const maskCache = new Map<string, { output: string, tokens: string[] }>()

/** Drop cached mask results. Dev/HMR calls this when templates change. */
export function clearMaskCache(): void {
  maskCache.clear()
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
  /**
   * Opt in to memoisation. Must fully determine what `placeholder` returns for
   * a given index — two calls sharing a key MUST be interchangeable.
   */
  cacheKey?: string,
): { output: string, tokens: string[] } {
  const cacheable = cacheKey !== undefined && html.length >= MASK_CACHE_MIN_BYTES
  const key = cacheable ? `${cacheKey}\u0000${html}` : ''
  if (cacheable) {
    const hit = maskCache.get(key)
    // Tokens copied out: callers spread this array into their own, and a shared
    // one would let a later mutation reach an earlier caller's restore.
    if (hit)
      return { output: hit.output, tokens: hit.tokens.slice() }
  }

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

  if (cacheable) {
    evictOldest(maskCache, MASK_CACHE_MAX_ENTRIES)
    maskCache.set(key, { output, tokens })
    return { output, tokens: tokens.slice() }
  }

  return { output, tokens }
}

/**
 * Stash genuine `<script>…</script>` ELEMENTS behind NUL-byte sentinels so a
 * component scanner doesn't mis-resolve tag-like JS string literals (e.g.
 * `div.innerHTML = '<v:shape>'`) as component references (stacksjs/stx#1730), and
 * so an attribute-embedded `<script>` is never pulled out and restored unescaped.
 */
/**
 * Stash results for the few large documents a render masks over and over.
 *
 * One render of the #1945 fixture calls `stashScriptElements` 60 times on
 * documents over 100KB — and those 60 calls carry exactly TWO distinct inputs,
 * one 113,034 bytes seen 48 times and one 161,610 bytes seen 12 times. The
 * component pipeline re-enters over content that has not changed, so 58 of the
 * 60 rebuild a document that was already built.
 *
 * Keyed on the input string itself rather than a hash: a hash collision here
 * would restore the wrong script bodies into a page, and the input has to be
 * retained to compare against anyway.
 *
 * The trade is explicit. This holds a small number of documents alive — bounded
 * below, roughly 340KB at the cap on this fixture — to stop re-deriving them.
 * That is retention bought with allocation, which is worth stating plainly
 * rather than burying: the win is real for a server rendering the same view
 * repeatedly, and it is a cost, not a free lunch.
 *
 * Small inputs are not cached. They are cheap to redo, they are the vast
 * majority of calls (518 per render), and caching them would make the retention
 * unbounded in the thing it is meant to bound.
 */
const STASH_CACHE_MIN_BYTES = 65536
const STASH_CACHE_MAX_ENTRIES = 4
const stashCache = new Map<string, { output: string, scripts: string[] }>()

export function stashScriptElements(html: string): { output: string, scripts: string[] } {
  const cacheable = html.length >= STASH_CACHE_MIN_BYTES
  if (cacheable) {
    const hit = stashCache.get(html)
    // The array is copied out. Callers receive it as `stashed.scripts` and a
    // shared array would let one caller's mutation reach another's restore;
    // the strings inside are shared, so this is a handful of pointers.
    if (hit)
      return { output: hit.output, scripts: hit.scripts.slice() }
  }

  const { output, tokens } = maskAtElementPosition(
    html,
    matchScriptElement,
    (_token, index) => `\x00STX_SCRIPT_${index}\x00`,
  )

  if (cacheable) {
    // Cleared wholesale rather than evicted one at a time: this holds a couple
    // of documents for one render's shape, and the next shape wants different
    // ones. An LRU's bookkeeping would cost more than it saves at this size.
    evictOldest(stashCache, STASH_CACHE_MAX_ENTRIES)
    stashCache.set(html, { output, scripts: tokens })
    return { output, scripts: tokens.slice() }
  }

  return { output, scripts: tokens }
}

/** Drop cached stash results. Dev/HMR calls this when templates change on disk. */
export function clearStashCache(): void {
  stashCache.clear()
}

/** Restore scripts stashed by {@link stashScriptElements}. */
export function restoreStashedScripts(html: string, scripts: string[]): string {
  if (scripts.length === 0)
    return html
  return html.replace(/\x00STX_SCRIPT_(\d+)\x00/g, (_, idx) => scripts[+idx] ?? '')
}
