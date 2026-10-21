/**
 * The single-pass classifier as it was before the incremental scanner
 * (stx 0.2.634), kept as the reference the scanner must agree with. It
 * rescans the document from the start for every interpolation.
 */
import { findMustacheEnd } from '../../src/mustache-span'

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
export function referenceClassifyHtmlInterpolation(
  source: string,
  offset: number,
  attributeFragment: boolean = false,
): HtmlInterpolationContext {
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

  // Delimiters inside quoted values are data. Looking for the last `>`
  // loses the current tag for perfectly valid HTML such as title="a > b".
  let openTag = -1
  let quote: '"' | "'" | null = null
  for (let index = 0; index < before.length; index++) {
    const char = before[index]
    if (quote) {
      if (char === quote)
        quote = null
      continue
    }
    if (openTag >= 0 || attributeFragment) {
      if (char === '"' || char === "'") {
        quote = char
        continue
      }
      if (char === '>') {
        openTag = -1
        continue
      }
    }
    if (char === '<')
      openTag = index
  }

  if (openTag < 0 && !attributeFragment)
    return null

  const tail = openTag >= 0 ? before.slice(openTag + 1) : before
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

class UnsafeInterpolationContextError extends Error {
  readonly attribute: string

  constructor(attribute: string, reason: string) {
    super(`Unsafe interpolation in ${attribute}: ${reason}`)
    this.name = 'UnsafeInterpolationContextError'
    this.attribute = attribute
  }
}
