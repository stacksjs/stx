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

/** Regions whose contents are text, not markup. */
const SKIP_REGIONS: Array<{ open: RegExp, close: string }> = [
  { open: /<!--/, close: '-->' },
  { open: /<script\b/i, close: '</script>' },
  { open: /<style\b/i, close: '</style>' },
]

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

  while (cursor < html.length) {
    const rest = html.slice(cursor)

    // Where does the next real body tag start, and where does the next
    // skippable region start? Whichever comes first wins.
    const bodyMatch = /<body\b([^>]*)>/i.exec(rest)
    if (!bodyMatch)
      return null

    const bodyAt = cursor + bodyMatch.index

    let nearestSkipAt = -1
    let nearestClose = ''
    for (const region of SKIP_REGIONS) {
      const found = region.open.exec(rest)
      if (!found)
        continue
      const at = cursor + found.index
      if (at < bodyAt && (nearestSkipAt === -1 || at < nearestSkipAt)) {
        nearestSkipAt = at
        nearestClose = region.close
      }
    }

    // No skippable region before it: this is the tag.
    if (nearestSkipAt === -1) {
      return {
        index: bodyAt,
        tag: bodyMatch[0],
        attrs: bodyMatch[1] ?? '',
      }
    }

    // Jump past the region. An unterminated one (a stray `<!--`, a `<style>`
    // with no close) means everything after it is text as far as the browser
    // is concerned, so there is no real body tag to find.
    const closeAt = html.toLowerCase().indexOf(nearestClose, nearestSkipAt)
    if (closeAt === -1)
      return null

    cursor = closeAt + nearestClose.length
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
