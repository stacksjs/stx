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

/** Registry of placeholder tokens to their original expressions (populated at build time) */
const placeholderRegistry = new Map<string, { type: 'expr' | 'cond' | 'raw', expression: string }>()

/**
 * Reset the placeholder counter and registry (for testing / between builds).
 */
export function resetPlaceholders(): void {
  placeholderCounter = 0
  placeholderRegistry.clear()
}

/**
 * Create a unique placeholder token and register the expression.
 *
 * @param type - The type of placeholder ('expr' for expressions, 'cond' for conditionals)
 * @param expr - The original expression (stored in the registry for serve-time hydration)
 * @returns A unique placeholder token string
 */
export function createPlaceholder(type: 'expr' | 'cond' | 'raw', expr: string): string {
  const id = placeholderCounter++
  // Use HTML comments so they survive HTML parsing and don't affect layout
  const token = `<!--__STX_${type.toUpperCase()}_${id}__-->`
  // Store the expression so the template compiler can retrieve it
  placeholderRegistry.set(token, { type, expression: expr })
  return token
}

/**
 * Get the registered placeholder map (all tokens created since last reset).
 * Used by the template compiler to build the CompiledTemplate.placeholders field.
 */
export function getPlaceholderRegistry(): PlaceholderMap {
  const map: PlaceholderMap = {}
  for (const [token, info] of placeholderRegistry) {
    map[token] = { type: info.type, expression: info.expression }
  }
  return map
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
    const token = match[0]
    const type = match[1].toLowerCase() as 'expr' | 'cond' | 'raw'
    // Look up expression from registry (populated during createPlaceholder)
    const registered = placeholderRegistry.get(token)
    map[token] = { type, expression: registered?.expression || '' }
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
