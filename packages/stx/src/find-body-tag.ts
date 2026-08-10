/**
 * Locate the real `<body>` open tag.
 *
 * Every consumer of this used to do `html.replace(/<body([^>]*)>/, ...)`, which
 * takes the FIRST match anywhere in the document — including inside a
 * `<style>` block, a `<script>`, or an HTML comment. Any of those can contain
 * the characters `<body` in prose without meaning a tag.
 *
 * When that happened the consequences were silent and total. The setup-wiring
 * step in process.ts stamps `data-stx="__stx_setup_…"` onto the body open tag,
 * and the runtime invokes a page's setup function by reading that attribute.
 * Stamp it into a CSS comment instead and the real `<body>` never gets it, so
 * the setup function ships, parses, and is never called: every `:if`,
 * `:hidden`, `@click` and `{{ signal() }}` on the page stays inert, with no
 * error anywhere. A single sentence in a CSS comment mentioning the body
 * element was enough to disable a whole site's interactivity.
 *
 * `runtime-injection.ts` has the same shape and a similar failure: it would
 * inject the signals runtime `<script>` INSIDE a `<style>` block, where it
 * never executes.
 *
 * This is the same class of bug as the unanchored `hasDocumentShell` check
 * fixed in stacksjs/stx#1792, whose reporter ended up writing a house rule
 * telling authors not to name the tag in prose. Authors should not need that
 * rule; scanning should skip regions that cannot contain markup.
 */

/**
 * Regions whose contents are text, not markup.
 *
 * Both ends are patterns because the closing tag is not a fixed string:
 * `</script >` is a legal end tag, and matching it with `indexOf('</script>')`
 * reports the script as unterminated — which this module reads as "no real
 * body tag exists" and skips the injection entirely. `conditionals.ts` masks
 * scripts with `<\/script\s*>` for the same reason; two parsers written in the
 * same week disagreeing about where a script ends is its own bug.
 *
 * These carry the `g` flag so scanning can move a `lastIndex` instead of
 * re-slicing the document. Every use assigns `lastIndex` first, and the
 * function is synchronous with no callbacks, so the shared state cannot be
 * observed between calls.
 */
const SKIP_REGIONS: Array<{ open: RegExp, close: RegExp }> = [
  { open: /<!--/g, close: /-->/g },
  { open: /<script\b/gi, close: /<\/script\s*>/gi },
  { open: /<style\b/gi, close: /<\/style\s*>/gi },
]

/** The candidate body tag. Same `g`-flag contract as {@link SKIP_REGIONS}. */
const BODY_OPEN = /<body\b([^>]*)>/gi

export interface BodyTagMatch {
  /** Index of the `<` that opens the tag. */
  index: number
  /** The full open tag, e.g. `<body class="x">`. */
  tag: string
  /** The attribute text between `<body` and `>`, e.g. ` class="x"`. */
  attrs: string
}

/**
 * Find the `<body>` open tag that is genuinely markup, skipping comments,
 * scripts and style blocks.
 *
 * @returns the match, or null when the document has no real body tag.
 */
export function findBodyOpenTag(html: string): BodyTagMatch | null {
  let cursor = 0

  /*
   * Scanning moves `lastIndex` rather than slicing.
   *
   * The previous shape did `html.slice(cursor)` per iteration and
   * `html.toLowerCase()` per skipped region — two full copies of the document
   * for every script and style tag it walked past. On the 1.19 MB page the
   * compression work was measured against, that is megabytes of copying to
   * find one tag, and it grows with the square of the document.
   */
  /*
   * A match found from an earlier cursor is still the next one, as long as it
   * has not been passed. Without this cache every iteration rescans the whole
   * remaining document for `<body` and for each region opener, so a document
   * with many scripts is quadratic in scans even after the copying is gone —
   * 281 KB took 61 ms. A `null` is a permanent answer: no match from a smaller
   * cursor means no match from a larger one.
   */
  let bodyMatch: RegExpExecArray | null | undefined
  const opens: Array<RegExpExecArray | null | undefined> = SKIP_REGIONS.map(() => undefined)

  while (cursor < html.length) {
    // Where does the next real body tag start, and where does the next
    // skippable region start? Whichever comes first wins.
    if (bodyMatch === undefined || (bodyMatch !== null && bodyMatch.index < cursor)) {
      BODY_OPEN.lastIndex = cursor
      bodyMatch = BODY_OPEN.exec(html)
    }
    if (!bodyMatch)
      return null

    const bodyAt = bodyMatch.index

    let nearestSkipAt = -1
    let nearestClose: RegExp | null = null
    for (let i = 0; i < SKIP_REGIONS.length; i++) {
      const region = SKIP_REGIONS[i]
      let found = opens[i]
      if (found === undefined || (found !== null && found.index < cursor)) {
        region.open.lastIndex = cursor
        found = region.open.exec(html)
        opens[i] = found
      }
      if (!found)
        continue
      if (found.index < bodyAt && (nearestSkipAt === -1 || found.index < nearestSkipAt)) {
        nearestSkipAt = found.index
        nearestClose = region.close
      }
    }

    // No skippable region before it: this is the tag.
    if (nearestSkipAt === -1 || !nearestClose) {
      return {
        index: bodyAt,
        tag: bodyMatch[0],
        attrs: bodyMatch[1] ?? '',
      }
    }

    // Jump past the region. An unterminated one (a stray `<!--`, a `<style>`
    // with no close) means everything after it is text as far as the browser
    // is concerned, so there is no real body tag to find.
    nearestClose.lastIndex = nearestSkipAt
    const closed = nearestClose.exec(html)
    if (!closed)
      return null

    cursor = closed.index + closed[0].length
  }

  return null
}

/** Whether the document carries a real `<body>` tag, ignoring text regions. */
export function hasBodyOpenTag(html: string): boolean {
  return findBodyOpenTag(html) !== null
}

/**
 * Replace the real `<body>` open tag, leaving text regions alone.
 *
 * @param replacer - receives the full tag and its attribute text
 * @returns the html unchanged when there is no real body tag
 */
export function replaceBodyOpenTag(
  html: string,
  replacer: (tag: string, attrs: string) => string,
): string {
  const match = findBodyOpenTag(html)
  if (!match)
    return html

  return html.slice(0, match.index)
    + replacer(match.tag, match.attrs)
    + html.slice(match.index + match.tag.length)
}
