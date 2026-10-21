import { findMustacheEnd } from './mustache-span'

export interface AttributeInterpolationContext {
  kind: 'attribute'
  name: string
  quote: '"' | "'" | null
  valuePrefix: string
}

export interface TagInterpolationContext {
  kind: 'tag'
}

export interface TagNameInterpolationContext {
  kind: 'tag-name'
}

export type HtmlInterpolationContext = AttributeInterpolationContext | TagInterpolationContext | TagNameInterpolationContext | null

/**
 * Classify the HTML position occupied by an interpolation.
 *
 * This intentionally answers one narrow question rather than parsing HTML:
 * script/style elements have already been masked by the expression pipeline,
 * and only the current open tag can make an escaped value unsafe. Attribute
 * fragments (the input used by interpolateScriptAttributes) work too because
 * they simply have no leading `<tag` portion.
 */
export function classifyHtmlInterpolation(
  source: string,
  offset: number,
  attributeFragment: boolean = false,
): HtmlInterpolationContext {
  const { openTag, tail } = attributeFragment
    ? scanFragment(source, offset)
    : documentScanner(source).at(offset)
  return classifyTail(tail, openTag, attributeFragment)
}

/**
 * What precedes `offset` in an attribute fragment: the whole prefix, with
 * earlier authored expressions as holes. Fragments are one tag's attributes,
 * so rebuilding the prefix per call is cheap.
 */
function scanFragment(source: string, offset: number): { openTag: number, tail: string } {
  // Earlier authored expressions are holes in HTML, including their quotes
  // and delimiters. They must not change the surrounding attribute state.
  let before = ''
  let start = 0
  for (let index = 0; index < offset; index++) {
    if (!source.startsWith('{{', index))
      continue
    const end = findMustacheEnd(source, index)
    if (end < 0 || end + 2 > offset)
      break
    before += source.slice(start, index) + 'x'
    index = end + 1
    start = end + 2
  }
  before += source.slice(start, offset)

  let openTag = -1
  let quote: '"' | "'" | null = null
  for (let index = 0; index < before.length; index++) {
    const char = before[index]
    if (quote) {
      if (char === quote)
        quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '>') {
      openTag = -1
      continue
    }
    if (char === '<')
      openTag = index
  }
  return { openTag, tail: openTag >= 0 ? before.slice(openTag + 1) : before }
}

/**
 * The state of a document's HTML up to an offset, kept between calls.
 *
 * A render asks about every interpolation of one template in order, and
 * rescanning from the start for each made a page with a few hundred
 * expressions quadratic: a quarter of HQ's home-page render went here. The
 * scanner keeps its position and tag/quote state for the last document and
 * only advances; a different document, or an earlier offset, starts over.
 *
 * Closed expressions before the offset are holes (they change no state). An
 * expression that does not close before the offset ends the holes for that
 * question: from there the text is read as it stands, as the single-pass
 * version did. Such a span is never committed, because a later offset past
 * its end makes it a hole again.
 */
interface DocumentScanner {
  at: (offset: number) => { openTag: number, tail: string }
}

let lastScanner: { source: string, scanner: DocumentScanner } | null = null

function documentScanner(source: string): DocumentScanner {
  if (lastScanner && lastScanner.source === source)
    return lastScanner.scanner
  const scanner = createDocumentScanner(source)
  lastScanner = { source, scanner }
  return scanner
}

function createDocumentScanner(source: string): DocumentScanner {
  let pos = 0
  let openTag = -1
  let quote: '"' | "'" | null = null
  // Where an expression that never closes begins: everything after it is text.
  let neverClosed = -1

  const step = (index: number, state: { openTag: number, quote: '"' | "'" | null }): void => {
    const char = source[index]
    if (state.quote) {
      if (char === state.quote)
        state.quote = null
      return
    }
    if (state.openTag >= 0) {
      if (char === '"' || char === "'") {
        state.quote = char
        return
      }
      if (char === '>') {
        state.openTag = -1
        return
      }
    }
    if (char === '<')
      state.openTag = index
  }

  /**
   * Where an HTML comment starting at `index` ends (just past its `-->`, or
   * the end of the document), or -1 when none starts there. Only outside a
   * tag: a comment is not markup, so its text cannot open a tag or a quote.
   * Read as markup, the apostrophe in `<!-- the device's own setting -->`
   * opened a quote that swallowed the comment's `>`, and every interpolation
   * after it was classified as inside that "tag" - text, never an attribute -
   * at the cost of rescanning back to the comment each time.
   */
  const commentEnd = (index: number, state: { openTag: number, quote: '"' | "'" | null }): number => {
    if (state.openTag >= 0 || !source.startsWith('<!--', index))
      return -1
    const close = source.indexOf('-->', index + 4)
    return close < 0 ? source.length : close + 3
  }

  return {
    at(offset: number) {
      if (offset < pos) {
        pos = 0
        openTag = -1
        quote = null
        neverClosed = -1
      }
      const committed = { openTag, quote }
      let inComment = false
      while (pos < offset) {
        if (neverClosed < 0 && source.startsWith('{{', pos)) {
          const end = findMustacheEnd(source, pos)
          if (end < 0) {
            neverClosed = pos
          }
          else if (end + 2 <= offset) {
            pos = end + 2
            continue
          }
          else {
            break
          }
        }
        const comment = commentEnd(pos, committed)
        if (comment >= 0) {
          if (comment > offset) {
            inComment = true
            break
          }
          pos = comment
          continue
        }
        step(pos, committed)
        pos++
      }
      openTag = committed.openTag
      quote = committed.quote
      // Inside a comment: text, whatever the comment says.
      if (inComment)
        return { openTag: -1, tail: '' }

      // The rest, up to the offset, read as text for this question only.
      const textFrom = neverClosed >= 0 ? neverClosed : pos
      const current = { openTag, quote }
      for (let index = pos; index < offset; index++) {
        const comment = commentEnd(index, current)
        if (comment >= 0) {
          if (comment > offset)
            return { openTag: -1, tail: '' }
          index = comment - 1
          continue
        }
        step(index, current)
      }

      if (current.openTag < 0)
        return { openTag: -1, tail: '' }
      // The open tag's own text, with its closed expressions as holes.
      let tail = ''
      let start = current.openTag + 1
      for (let index = start; index < Math.min(offset, textFrom); index++) {
        if (!source.startsWith('{{', index))
          continue
        const end = findMustacheEnd(source, index)
        tail += source.slice(start, index) + 'x'
        index = end + 1
        start = end + 2
      }
      tail += source.slice(start, offset)
      return { openTag: current.openTag, tail }
    },
  }
}

function classifyTail(tail: string, openTag: number, attributeFragment: boolean): HtmlInterpolationContext {
  if (openTag < 0 && !attributeFragment)
    return null

  if (openTag >= 0 && /^\s*[!/?]/.test(tail))
    return /^\s*\/?\s*$/.test(tail) ? { kind: 'tag-name' } : null

  if (openTag >= 0 && /^\s*$/.test(tail))
    return { kind: 'tag-name' }

  // Walk actual attributes in order. A suffix that looks like `title="`
  // can itself be text inside onclick='...' or srcdoc='...'.
  let cursor = 0
  if (openTag >= 0) {
    while (cursor < tail.length && !/\s/.test(tail[cursor]))
      cursor++
  }
  while (cursor < tail.length) {
    while (/\s/.test(tail[cursor] ?? '') && cursor < tail.length)
      cursor++
    const nameStart = cursor
    while (cursor < tail.length && !/[\s=/>]/.test(tail[cursor]))
      cursor++
    const name = tail.slice(nameStart, cursor)
    if (!name)
      break
    while (cursor < tail.length && /\s/.test(tail[cursor]))
      cursor++
    if (tail[cursor] !== '=')
      continue
    cursor++
    while (cursor < tail.length && /\s/.test(tail[cursor]))
      cursor++
    const delimiter = tail[cursor]
    if (delimiter === '"' || delimiter === "'") {
      const valueStart = ++cursor
      const end = tail.indexOf(delimiter, cursor)
      if (end === -1)
        return { kind: 'attribute', name, quote: delimiter, valuePrefix: tail.slice(valueStart) }
      cursor = end + 1
    }
    else {
      const valueStart = cursor
      while (cursor < tail.length && !/\s/.test(tail[cursor]))
        cursor++
      if (cursor === tail.length)
        return { kind: 'attribute', name, quote: null, valuePrefix: tail.slice(valueStart) }
    }
  }

  return { kind: 'tag' }
}

export class UnsafeInterpolationContextError extends Error {
  readonly attribute: string

  constructor(attribute: string, reason: string) {
    super(`Unsafe interpolation in ${attribute}: ${reason}`)
    this.name = 'UnsafeInterpolationContextError'
    this.attribute = attribute
  }
}
