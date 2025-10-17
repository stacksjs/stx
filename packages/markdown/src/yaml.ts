import type { YamlOptions } from './types'

/**
 * Fast, native YAML parser powered by Bun's first-class YAML support
 * Uses Bun.YAML.parse and Bun.YAML.stringify for optimal performance and conformance
 */

/**
 * Parse YAML string to JavaScript object
 */
export function parse<T = any>(input: string, options: YamlOptions = {}): T {
  const strict = options.strict ?? false

  try {
    // Remove UTF-8 BOM if present
    const content = input.replace(/^\uFEFF/, '')

    // Handle empty input
    if (!content.trim()) {
      return {} as T
    }

    // Use Bun's native YAML parser for optimal performance
    const result = Bun.YAML.parse(content)

    // Bun.YAML.parse returns an array for multi-document YAML
    // If it's a single document, return the first element
    if (Array.isArray(result) && result.length === 1) {
      return result[0] as T
    }

    return result as T
  }
  catch (error) {
    if (strict) {
      throw new Error(`YAML parsing failed: ${error}`)
    }
    // Return empty object for malformed YAML in non-strict mode
    return {} as T
  }
}

/**
 * Fallback parser for edge cases (kept for compatibility)
 * @internal
 */
function _parseFallback<T = any>(input: string, _options: YamlOptions = {}): T {
  const strict = _options.strict ?? false

  try {
    const content = input.replace(/^\uFEFF/, '')

    if (!content.trim()) {
      return {} as T
    }

    // Split into lines for processing
    const lines = content.split('\n')
    const result: any = {}
    const stack: Array<{ obj: any, indent: number, key?: string }> = [{ obj: result, indent: -1 }]

    const _currentIndent = 0
    let inMultiline = false
    let multilineKey = ''
    let multilineValue: string[] = []
    let multilineIndent = 0

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      // Skip comments and empty lines (unless in multiline)
      if (!inMultiline && (line.trim().startsWith('#') || !line.trim())) {
        continue
      }

      // Calculate indentation
      const match = line.match(/^(\s*)/)
      const indent = match ? match[1].length : 0

      // Handle multiline strings
      if (inMultiline) {
        // Check if we're still in multiline mode
        if (line.trim() && indent > multilineIndent) {
          multilineValue.push(line.substring(multilineIndent))
          continue
        }
        else {
          // End of multiline
          const current = stack[stack.length - 1]
          if (multilineKey) {
            current.obj[multilineKey] = multilineValue.join('\n')
          }
          inMultiline = false
          multilineKey = ''
          multilineValue = []

          // Process the current line if it's not empty
          if (!line.trim())
            continue
        }
      }

      // Remove leading whitespace
      line = line.substring(indent)

      // Handle list items
      if (line.match(/^-\s+/)) {
        // Pop stack if we've decreased indentation
        while (stack.length > 1 && indent < stack[stack.length - 1].indent) {
          stack.pop()
        }

        const current = stack[stack.length - 1]

        // Check if we need to convert the current context to an array
        if (!Array.isArray(current.obj)) {
          // If current.obj has a 'key' marker, we're in the context of a key that should be an array
          if (current.key) {
            // Replace the empty object with an array
            const parent = stack[stack.length - 2]
            if (parent) {
              parent.obj[current.key] = []
              current.obj = parent.obj[current.key]
            }
            else {
              current.obj[current.key] = []
              current.obj = current.obj[current.key]
            }
          }
        }

        // Parse the value
        const value = line.substring(2).trim()
        const parsed = parseValue(value)

        if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
          current.obj.push(parsed)
          stack.push({ obj: parsed, indent })
        }
        else {
          current.obj.push(parsed)
        }
        continue
      }

      // Handle key-value pairs
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()

        // Pop stack if we've decreased indentation
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
          stack.pop()
        }

        const current = stack[stack.length - 1]

        // Handle multiline indicators
        if (value === '|' || value === '>') {
          inMultiline = true
          multilineKey = key
          multilineIndent = indent + 2 // Standard YAML indentation
          multilineValue = []
          continue
        }

        // Handle empty value (could be null or nested object/array)
        if (!value) {
          // Create a placeholder object for now
          // It will be replaced with an array if list items follow, or kept as object for nested keys
          current.obj[key] = {}
          stack.push({ obj: current.obj[key], indent, key })
        }
        else {
          // Parse the value
          current.obj[key] = parseValue(value)
        }
      }
    }

    // Clean up empty objects that should be null
    function cleanupEmptyObjects(obj: any) {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          const keys = Object.keys(obj[key])
          if (keys.length === 0) {
            obj[key] = null
          }
          else {
            cleanupEmptyObjects(obj[key])
          }
        }
      }
    }

    cleanupEmptyObjects(result)

    return result as T
  }
  catch (error) {
    if (strict) {
      throw new Error(`YAML parsing failed: ${error}`)
    }
    return {} as T
  }
}

/**
 * Parse a YAML value to its appropriate JavaScript type
 */
function parseValue(value: string): any {
  // Handle null
  if (value === 'null' || value === '~' || value === '') {
    return null
  }

  // Handle booleans
  if (value === 'true' || value === 'yes' || value === 'on') {
    return true
  }
  if (value === 'false' || value === 'no' || value === 'off') {
    return false
  }

  // Handle numbers
  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10)
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return Number.parseFloat(value)
  }

  // Handle quoted strings
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    return value.substring(1, value.length - 1)
  }

  // Handle arrays in flow style
  if (value.startsWith('[') && value.endsWith(']')) {
    const items = value.substring(1, value.length - 1).split(',')
    return items.map(item => parseValue(item.trim()))
  }

  // Handle objects in flow style
  if (value.startsWith('{') && value.endsWith('}')) {
    const content = value.substring(1, value.length - 1)
    const obj: any = {}
    const pairs = content.split(',')
    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':')
      if (colonIndex > 0) {
        const key = pair.substring(0, colonIndex).trim()
        const val = pair.substring(colonIndex + 1).trim()
        obj[key] = parseValue(val)
      }
    }
    return obj
  }

  // Default to string
  return value
}

/**
 * Stringify JavaScript object to YAML
 */
export function stringify(obj: any, _options: YamlOptions = {}): string {
  try {
    // Use Bun's native YAML stringify with block-style formatting (2 spaces)
    return Bun.YAML.stringify(obj, null, 2)
  }
  catch {
    // Fallback to custom implementation if needed
    return stringifyFallback(obj, 0)
  }
}

/**
 * Fallback stringify for edge cases
 * @internal
 */
function stringifyFallback(obj: any, indent: number): string {
  return stringifyValue(obj, indent)
}

/**
 * Recursively stringify a value to YAML format
 */
function stringifyValue(value: any, indent: number): string {
  const spaces = ' '.repeat(indent)

  if (value === null || value === undefined) {
    return 'null'
  }

  if (typeof value === 'boolean') {
    return value.toString()
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value === 'string') {
    // Quote strings with special characters
    if (value.includes(':') || value.includes('#') || value.includes('\n')) {
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return value
  }

  if (Array.isArray(value)) {
    if (value.length === 0)
      return '[]'

    return value.map((item) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const itemStr = stringifyValue(item, indent + 2)
        return `\n${spaces}- ${itemStr.trim()}`
      }
      return `\n${spaces}- ${stringifyValue(item, indent + 2)}`
    }).join('')
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0)
      return '{}'

    return keys.map((key) => {
      const val = value[key]
      if (typeof val === 'object' && val !== null) {
        return `\n${spaces}${key}:${stringifyValue(val, indent + 2)}`
      }
      return `\n${spaces}${key}: ${stringifyValue(val, indent + 2)}`
    }).join('')
  }

  return String(value)
}
