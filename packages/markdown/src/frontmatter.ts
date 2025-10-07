import type { ParsedMarkdown } from './types'
import * as yaml from './yaml'

/**
 * Fast frontmatter parser optimized for Bun
 * Replaces gray-matter with a performance-focused implementation
 */

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
const FRONTMATTER_REGEX_ALT = /^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+\r?\n/

/**
 * Parse markdown with frontmatter
 */
export function parse<T = Record<string, any>>(content: string): ParsedMarkdown<T> {
  const original = content

  // Try YAML frontmatter (---)
  let match = content.match(FRONTMATTER_REGEX)
  let data: any = {}
  let matter: string | undefined
  let markdown = content

  if (match) {
    matter = match[1]
    markdown = content.substring(match[0].length)
    data = yaml.parse<T>(matter)
  }
  else {
    // Try TOML frontmatter (+++)
    match = content.match(FRONTMATTER_REGEX_ALT)
    if (match) {
      matter = match[1]
      markdown = content.substring(match[0].length)
      // For TOML, we'll use a simple parser
      data = parseToml(matter) as T
    }
  }

  return {
    data: data as T,
    content: markdown,
    original,
    matter,
  }
}

/**
 * Simple TOML parser for frontmatter
 */
function parseToml(content: string): Record<string, any> {
  const result: Record<string, any> = {}
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    // Parse key-value pairs
    const equalIndex = trimmed.indexOf('=')
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim()
      const value = trimmed.substring(equalIndex + 1).trim()

      // Parse value
      result[key] = parseTomlValue(value)
    }
  }

  return result
}

/**
 * Parse TOML value
 */
function parseTomlValue(value: string): any {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    return value.substring(1, value.length - 1)
  }

  // Boolean
  if (value === 'true')
    return true
  if (value === 'false')
    return false

  // Number
  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10)
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return Number.parseFloat(value)
  }

  // Array
  if (value.startsWith('[') && value.endsWith(']')) {
    const items = value.substring(1, value.length - 1).split(',')
    return items.map(item => parseTomlValue(item.trim()))
  }

  return value
}

/**
 * Stringify data to frontmatter markdown
 */
export function stringify<T = Record<string, any>>(
  data: T,
  content: string,
  format: 'yaml' | 'toml' = 'yaml',
): string {
  if (!data || Object.keys(data).length === 0) {
    return content
  }

  const delimiter = format === 'yaml' ? '---' : '+++'
  const matter = format === 'yaml' ? yaml.stringify(data).trim() : stringifyToml(data).trim()

  return `${delimiter}\n${matter}\n${delimiter}\n${content}`
}

/**
 * Stringify object to TOML format
 */
function stringifyToml(obj: any): string {
  const lines: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      lines.push(`${key} = "${value}"`)
    }
    else if (typeof value === 'boolean' || typeof value === 'number') {
      lines.push(`${key} = ${value}`)
    }
    else if (Array.isArray(value)) {
      const items = value.map((item) => {
        if (typeof item === 'string')
          return `"${item}"`
        return String(item)
      })
      lines.push(`${key} = [${items.join(', ')}]`)
    }
  }

  return lines.join('\n')
}

/**
 * Check if content has frontmatter
 */
export function hasFrontmatter(content: string): boolean {
  return FRONTMATTER_REGEX.test(content) || FRONTMATTER_REGEX_ALT.test(content)
}

/**
 * Extract only the frontmatter (without parsing)
 */
export function extractFrontmatter(content: string): string | null {
  let match = content.match(FRONTMATTER_REGEX)
  if (match)
    return match[1]

  match = content.match(FRONTMATTER_REGEX_ALT)
  if (match)
    return match[1]

  return null
}
