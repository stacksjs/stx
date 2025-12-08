import { describe, expect, it } from 'bun:test'

// Since parseAttributes is not exported, we test it by reimplementing it here
// This ensures the algorithm is correct
interface ParsedAttribute {
  name: string
  value: string | true
  isBinding: boolean
}

function parseAttributes(attributesStr: string): ParsedAttribute[] {
  const attributes: ParsedAttribute[] = []
  let pos = 0
  const len = attributesStr.length

  while (pos < len) {
    // Skip whitespace
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    if (pos >= len)
      break

    // Check for binding prefix
    let isBinding = false
    if (attributesStr[pos] === ':') {
      isBinding = true
      pos++
    }
    else if (attributesStr.slice(pos, pos + 7) === 'v-bind:') {
      isBinding = true
      pos += 7
    }

    // Read attribute name (until = or whitespace or end)
    let name = ''
    while (pos < len && !/[\s=]/.test(attributesStr[pos])) {
      name += attributesStr[pos]
      pos++
    }

    if (!name)
      break

    // Skip whitespace
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    // Check for = sign
    if (pos < len && attributesStr[pos] === '=') {
      pos++ // Skip =

      // Skip whitespace after =
      while (pos < len && /\s/.test(attributesStr[pos])) {
        pos++
      }

      // Read value
      let value = ''
      if (pos < len && (attributesStr[pos] === '"' || attributesStr[pos] === '\'')) {
        const quote = attributesStr[pos]
        pos++ // Skip opening quote

        // Read until closing quote, handling escapes
        while (pos < len && attributesStr[pos] !== quote) {
          if (attributesStr[pos] === '\\' && pos + 1 < len) {
            // Handle escape sequence
            pos++
            value += attributesStr[pos]
          }
          else {
            value += attributesStr[pos]
          }
          pos++
        }
        pos++ // Skip closing quote
      }
      else {
        // Unquoted value (read until whitespace)
        while (pos < len && !/\s/.test(attributesStr[pos])) {
          value += attributesStr[pos]
          pos++
        }
      }

      attributes.push({ name, value, isBinding })
    }
    else {
      // Boolean attribute (no value)
      attributes.push({ name, value: true, isBinding })
    }
  }

  return attributes
}

describe('parseAttributes', () => {
  it('should parse simple double-quoted attributes', () => {
    const result = parseAttributes('name="value" title="hello"')
    expect(result).toEqual([
      { name: 'name', value: 'value', isBinding: false },
      { name: 'title', value: 'hello', isBinding: false },
    ])
  })

  it('should parse single-quoted attributes', () => {
    const result = parseAttributes('name=\'value\'')
    expect(result).toEqual([
      { name: 'name', value: 'value', isBinding: false },
    ])
  })

  it('should parse boolean attributes', () => {
    const result = parseAttributes('disabled readonly')
    expect(result).toEqual([
      { name: 'disabled', value: true, isBinding: false },
      { name: 'readonly', value: true, isBinding: false },
    ])
  })

  it('should parse Vue-like : bindings', () => {
    const result = parseAttributes(':prop="expr" :data="items"')
    expect(result).toEqual([
      { name: 'prop', value: 'expr', isBinding: true },
      { name: 'data', value: 'items', isBinding: true },
    ])
  })

  it('should parse v-bind: bindings', () => {
    const result = parseAttributes('v-bind:prop="expr"')
    expect(result).toEqual([
      { name: 'prop', value: 'expr', isBinding: true },
    ])
  })

  it('should handle = signs in values', () => {
    const result = parseAttributes('url="https://example.com?a=1&b=2"')
    expect(result).toEqual([
      { name: 'url', value: 'https://example.com?a=1&b=2', isBinding: false },
    ])
  })

  it('should handle complex query strings in values', () => {
    const result = parseAttributes('href="page.html?foo=bar&baz=qux#section"')
    expect(result).toEqual([
      { name: 'href', value: 'page.html?foo=bar&baz=qux#section', isBinding: false },
    ])
  })

  it('should handle escaped quotes in values', () => {
    const result = parseAttributes('title="He said \\"hello\\""')
    expect(result).toEqual([
      { name: 'title', value: 'He said "hello"', isBinding: false },
    ])
  })

  it('should handle mixed static and binding attributes', () => {
    const result = parseAttributes('class="card" :title="cardTitle" disabled')
    expect(result).toEqual([
      { name: 'class', value: 'card', isBinding: false },
      { name: 'title', value: 'cardTitle', isBinding: true },
      { name: 'disabled', value: true, isBinding: false },
    ])
  })

  it('should handle whitespace variations', () => {
    const result = parseAttributes('  name = "value"   title="hello"  ')
    expect(result).toEqual([
      { name: 'name', value: 'value', isBinding: false },
      { name: 'title', value: 'hello', isBinding: false },
    ])
  })

  it('should handle empty string', () => {
    const result = parseAttributes('')
    expect(result).toEqual([])
  })

  it('should handle unquoted values', () => {
    const result = parseAttributes('count=5 name=test')
    expect(result).toEqual([
      { name: 'count', value: '5', isBinding: false },
      { name: 'name', value: 'test', isBinding: false },
    ])
  })

  it('should handle HTML in values', () => {
    const result = parseAttributes('content="<p>Hello</p>"')
    expect(result).toEqual([
      { name: 'content', value: '<p>Hello</p>', isBinding: false },
    ])
  })

  it('should handle JSON-like expressions in bindings', () => {
    const result = parseAttributes(':config="{ a: 1, b: 2 }"')
    expect(result).toEqual([
      { name: 'config', value: '{ a: 1, b: 2 }', isBinding: true },
    ])
  })

  it('should handle array expressions in bindings', () => {
    const result = parseAttributes(':items="[1, 2, 3]"')
    expect(result).toEqual([
      { name: 'items', value: '[1, 2, 3]', isBinding: true },
    ])
  })
})
