/** Script mode is an attribute name, never a word inside an attribute value. */
export function scriptAttributes(source: string): Map<string, string | true> {
  const attributes = new Map<string, string | true>()
  for (const match of source.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attributes.set(match[1]!.toLowerCase(), match[2] ?? match[3] ?? match[4] ?? true)
  return attributes
}

/** Authored JavaScript/TypeScript bodies, excluding data and template script types. */
export function scriptContainsCode(attributes: ReadonlyMap<string, string | true>): boolean {
  const type = attributes.get('type')
  return typeof type !== 'string' || !type.trim() || /^(?:module|(?:text|application)\/(?:javascript|typescript|ecmascript))$/i.test(type.trim())
}
