/** Values supported by STX's Info.plist configuration (#2152). */
export type PlistValue = string | number | boolean | readonly PlistValue[] | { readonly [key: string]: PlistValue }

const escapeXml = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Serialize an app's dictionary before its bundle is signed. Never splice raw XML. */
export function renderInfoPlist(entries: Readonly<Record<string, PlistValue>>): string {
  const ancestors = new Set<object>()
  const render = (value: PlistValue, pad: string, location: string): string => {
    if (typeof value === 'string') return `${pad}<string>${escapeXml(value)}</string>`
    if (typeof value === 'boolean') return `${pad}<${value}/>`
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new TypeError(`Non-finite Info.plist number at ${location}`)
      const tag = Number.isSafeInteger(value) ? 'integer' : 'real'
      return `${pad}<${tag}>${value}</${tag}>`
    }
    if (value !== null && typeof value === 'object') {
      const array = Array.isArray(value)
      if (!array && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
        throw new TypeError(`Unsupported Info.plist value at ${location}`)
      if (ancestors.has(value)) throw new TypeError(`Cyclic Info.plist value at ${location}`)
      ancestors.add(value)
      try {
        const tag = array ? 'array' : 'dict'
        const indent = `${pad}    `
        const children = array
          ? Array.from(value, (item, index) => render(item, indent, `${location}[${index}]`))
          : Object.entries(value).map(([key, item]) => `${indent}<key>${escapeXml(key)}</key>\n${render(item, indent, `${location}.${key}`)}`)
        return children.length ? `${pad}<${tag}>\n${children.join('\n')}\n${pad}</${tag}>` : `${pad}<${tag}/>`
      }
      finally { ancestors.delete(value) }
    }
    throw new TypeError(`Unsupported Info.plist value at ${location}`)
  }
  if (!entries || Array.isArray(entries) || typeof entries !== 'object')
    throw new TypeError('Info.plist root must be a dictionary')
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
${render(entries, '', 'infoPlist')}
</plist>
`
}
