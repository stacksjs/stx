/**
 * Placeholder Token System
 *
 * Generates and resolves placeholder tokens for the template pre-compilation pipeline.
 * During build mode, dynamic expressions are replaced with placeholder tokens.
 * At serve time, only the placeholders are resolved with request-time data.
 *
 * @module placeholder
 */

let placeholderCounter = 0

/**
 * Reset the placeholder counter (for testing).
 */
export function resetPlaceholders(): void {
  placeholderCounter = 0
}

/**
 * Create a unique placeholder token.
 *
 * @param type - The type of placeholder ('expr' for expressions, 'cond' for conditionals)
 * @param expr - The original expression (stored in the compiled template metadata)
 * @returns A unique placeholder token string
 */
export function createPlaceholder(type: 'expr' | 'cond' | 'raw', expr: string): string {
  const id = placeholderCounter++
  // Use HTML comments so they survive HTML parsing and don't affect layout
  return `<!--__STX_${type.toUpperCase()}_${id}__-->`
}

/**
 * A map of placeholder tokens to their original expressions.
 */
export interface PlaceholderMap {
  [token: string]: {
    type: 'expr' | 'cond' | 'raw'
    expression: string
  }
}

/**
 * Extract all placeholder tokens from compiled HTML.
 *
 * @returns A map of token → expression info
 */
export function extractPlaceholders(html: string): PlaceholderMap {
  const map: PlaceholderMap = {}
  const regex = /<!--__STX_(EXPR|COND|RAW)_(\d+)__-->/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const type = match[1].toLowerCase() as 'expr' | 'cond' | 'raw'
    map[match[0]] = { type, expression: '' } // Expression stored in compiled template metadata
  }

  return map
}

/**
 * Replace placeholder tokens with evaluated values.
 * Uses simple string replacement for maximum performance.
 *
 * @param html - The compiled HTML with placeholder tokens
 * @param values - Map of placeholder token → resolved value
 * @returns HTML with all placeholders replaced
 */
export function replacePlaceholders(html: string, values: Map<string, string>): string {
  let result = html
  for (const [token, value] of values) {
    // Use split/join for reliable replacement (no regex special char issues)
    result = result.split(token).join(value)
  }
  return result
}

/**
 * Check if HTML contains any placeholder tokens.
 */
export function hasPlaceholders(html: string): boolean {
  return html.includes('<!--__STX_')
}
