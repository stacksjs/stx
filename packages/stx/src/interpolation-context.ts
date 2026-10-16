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
  const before = source.slice(0, offset)
  const openTag = before.lastIndexOf('<')
  const closeTag = before.lastIndexOf('>')

  if (openTag >= 0 && closeTag > openTag)
    return null

  if (openTag < 0 && !attributeFragment)
    return null

  const tail = openTag >= 0 ? before.slice(openTag + 1) : before
  if (openTag >= 0 && /^\s*[!/?]/.test(tail))
    return /^\s*\/?\s*$/.test(tail) ? { kind: 'tag-name' } : null

  if (openTag >= 0 && /^\s*$/.test(tail))
    return { kind: 'tag-name' }

  const doubleQuoted = /(?:^|\s)([^\s"'<>/=]+)\s*=\s*"([^"]*)$/.exec(tail)
  if (doubleQuoted) {
    return {
      kind: 'attribute',
      name: doubleQuoted[1],
      quote: '"',
      valuePrefix: doubleQuoted[2],
    }
  }

  const singleQuoted = /(?:^|\s)([^\s"'<>/=]+)\s*=\s*'([^']*)$/.exec(tail)
  if (singleQuoted) {
    return {
      kind: 'attribute',
      name: singleQuoted[1],
      quote: "'",
      valuePrefix: singleQuoted[2],
    }
  }

  const unquoted = /(?:^|\s)([^\s"'<>/=]+)\s*=\s*([^\s"'=<>`]*)$/.exec(tail)
  if (unquoted) {
    return {
      kind: 'attribute',
      name: unquoted[1],
      quote: null,
      valuePrefix: unquoted[2],
    }
  }

  return openTag >= 0 || /^\s*[^<>]*$/.test(tail) ? { kind: 'tag' } : null
}

export class UnsafeInterpolationContextError extends Error {
  readonly attribute: string

  constructor(attribute: string, reason: string) {
    super(`Unsafe interpolation in ${attribute}: ${reason}`)
    this.name = 'UnsafeInterpolationContextError'
    this.attribute = attribute
  }
}
