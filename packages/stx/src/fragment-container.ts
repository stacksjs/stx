/**
 * Locating the SPA swap container in rendered HTML.
 *
 * The client resolves the container with a CSS selector (`router.container`,
 * falling back to `[data-stx-content]` then `main`). The server used to ignore
 * that entirely and string-slice from the first `<main …>` to the LAST
 * `</main>`, which produced three separate failures:
 *
 *  - configuring `router: { container: '[data-stx-content]' }` still produced a
 *    `<main>`-shaped fragment, which the client then injected into a different
 *    element, duplicating the page chrome;
 *  - a page with two `<main>` elements swapped everything between the first open
 *    and the last close, i.e. the wrong span;
 *  - a page with no `<main>` shipped its whole body as the "fragment", silently
 *    disabling SPA navigation for every link on it, at HTTP 200.
 *
 * This module resolves the same selector the client uses and finds the container's
 * OWN matching close tag by depth counting, so nesting and repetition behave.
 *
 * It is deliberately a small matcher, not a CSS engine: it covers the selector
 * shapes a swap container realistically uses — a tag name, an attribute, an id,
 * a class, and a tag qualified by one of those. Anything else returns null, and
 * the caller is expected to say so rather than silently ship the whole body.
 *
 * @module fragment-container
 */

export interface ContainerRegion {
  /** The container's opening tag, verbatim (attributes included). */
  openTag: string
  /** Index at which the opening tag starts. */
  openIndex: number
  /** Index of the first character of the container's inner content. */
  start: number
  /** Index of the container's matching `</tag>`. */
  end: number
  /** The container's tag name, lowercased. */
  tagName: string
}

interface ParsedSelector {
  tag?: string
  attr?: string
  attrValue?: string
  id?: string
  className?: string
}

/** Elements that never have a closing tag, so can never be a swap container. */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

interface IgnoredRange {
  start: number
  end: number
}

/**
 * Comments and raw-text elements can contain strings such as `<main>` which
 * are text, not nodes. Preserve their offsets so the lightweight matcher can
 * skip false tags without changing the indexes returned to callers.
 */
function ignoredMarkupRanges(html: string): IgnoredRange[] {
  const ranges: IgnoredRange[] = []
  const ignoredRe = /<!--[\s\S]*?(?:-->|$)|<(script|style|textarea|title|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
  let match: RegExpExecArray | null
  while ((match = ignoredRe.exec(html)) !== null)
    ranges.push({ start: match.index, end: match.index + match[0].length })
  return ranges
}

function isIgnoredOffset(offset: number, ranges: IgnoredRange[]): boolean {
  return ranges.some(range => offset >= range.start && offset < range.end)
}

/**
 * Parse the supported subset of CSS selector syntax.
 *
 * Returns null for anything unsupported (descendant combinators, `:has()`,
 * comma lists) rather than guessing — a wrong container is worse than a
 * reported one.
 */
export function parseContainerSelector(selector: string): ParsedSelector | null {
  const trimmed = (selector || '').trim()
  if (!trimmed)
    return null
  // No combinators, grouping or pseudo-classes.
  if (/[\s>+~,:]/.test(trimmed))
    return null

  const parsed: ParsedSelector = {}
  let rest = trimmed

  const tagMatch = rest.match(/^[a-z][\w-]*/i)
  if (tagMatch) {
    parsed.tag = tagMatch[0].toLowerCase()
    rest = rest.slice(tagMatch[0].length)
  }

  while (rest.length > 0) {
    const attr = rest.match(/^\[([\w-]+)(?:=(["']?)([^\]"']*)\2)?\]/)
    if (attr) {
      parsed.attr = attr[1]
      if (attr[3] !== undefined && attr[3] !== '')
        parsed.attrValue = attr[3]
      rest = rest.slice(attr[0].length)
      continue
    }
    const id = rest.match(/^#([\w-]+)/)
    if (id) {
      parsed.id = id[1]
      rest = rest.slice(id[0].length)
      continue
    }
    const cls = rest.match(/^\.([\w-]+)/)
    if (cls) {
      parsed.className = cls[1]
      rest = rest.slice(cls[0].length)
      continue
    }
    // Unrecognised trailing syntax — refuse rather than approximate.
    return null
  }

  if (!parsed.tag && !parsed.attr && !parsed.id && !parsed.className)
    return null
  return parsed
}

function attributesMatch(attrs: string, parsed: ParsedSelector): boolean {
  if (parsed.attr) {
    const re = parsed.attrValue === undefined
      ? new RegExp(`\\b${parsed.attr}(?=[\\s=>/]|$)`, 'i')
      : new RegExp(`\\b${parsed.attr}\\s*=\\s*(["'])\\s*${parsed.attrValue}\\s*\\1`, 'i')
    if (!re.test(attrs))
      return false
  }
  if (parsed.id) {
    const re = new RegExp(`\\bid\\s*=\\s*(["'])\\s*${parsed.id}\\s*\\1`, 'i')
    if (!re.test(attrs))
      return false
  }
  if (parsed.className) {
    const classMatch = attrs.match(/\bclass\s*=\s*(["'])([\s\S]*?)\1/i)
    if (!classMatch)
      return false
    if (!classMatch[2].split(/\s+/).includes(parsed.className))
      return false
  }
  return true
}

/**
 * Find the region of `html` occupied by the first element matching `selector`.
 *
 * The closing tag is found by depth counting over same-named tags, so a
 * container that contains another element of the same name — or a page that has
 * two of them — resolves to the container's OWN close rather than the last one
 * in the document.
 */
export function findContainerRegion(html: string, selector = 'main'): ContainerRegion | null {
  const parsed = parseContainerSelector(selector)
  if (!parsed)
    return null

  const openRe = /<([a-z][\w-]*)\b([^>]*)>/gi
  const ignoredRanges = ignoredMarkupRanges(html)
  let match: RegExpExecArray | null

  while ((match = openRe.exec(html)) !== null) {
    if (isIgnoredOffset(match.index, ignoredRanges))
      continue
    const tagName = match[1].toLowerCase()
    const attrs = match[2] || ''

    // A self-closing or void element has no inner region to swap.
    if (attrs.trimEnd().endsWith('/') || VOID_ELEMENTS.has(tagName))
      continue
    if (parsed.tag && parsed.tag !== tagName)
      continue
    if (!attributesMatch(attrs, parsed))
      continue

    const openTag = match[0]
    const contentStart = match.index + openTag.length

    // Depth-count to this element's OWN closing tag. `lastIndexOf('</main>')`
    // is what produced the two-<main> bug: it always found the document's last
    // close, which for two siblings is the second one's.
    const pairRe = new RegExp(`<(/?)${tagName}\\b([^>]*)>`, 'gi')
    pairRe.lastIndex = contentStart
    let depth = 1
    let pair: RegExpExecArray | null

    while ((pair = pairRe.exec(html)) !== null) {
      if (isIgnoredOffset(pair.index, ignoredRanges))
        continue
      const isClose = pair[1] === '/'
      const selfClosing = !isClose && (pair[2] || '').trimEnd().endsWith('/')
      if (selfClosing)
        continue
      depth += isClose ? -1 : 1
      if (depth === 0) {
        return {
          openTag,
          openIndex: match.index,
          start: contentStart,
          end: pair.index,
          tagName,
        }
      }
    }

    // Unbalanced markup: the container opened and never closed. Report it as
    // unfound rather than slicing to end-of-document.
    return null
  }

  return null
}
