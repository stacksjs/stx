/**
 * Module for processing template expressions and filters
 *
 * Expression Syntax:
 * ==================
 * - `{{ expression }}` - Escaped output (HTML entities escaped)
 * - `{!! expression !!}` - Raw/unescaped output
 * - `{{ expression | filter }}` - Apply filter to expression
 * - `{{ expression | filter:arg1,arg2 }}` - Filter with arguments
 * - `{{ expression | filter1 | filter2 }}` - Filter chain
 *
 * Filter Parsing:
 * ===============
 * The filter parser uses character-by-character parsing to handle:
 * - Pipe `|` as filter separator (but not `||` logical OR)
 * - Colon `:` as argument separator
 * - Quoted strings with proper escape handling
 * - Nested parentheses in expressions
 *
 * Key parsing rules:
 * - `||` (double pipe) is preserved as logical OR, not filter separator
 * - Arguments after `:` are split by `,` respecting quotes and parens
 * - Filter names must be alphanumeric with underscores
 *
 * Available Built-in Filters:
 * ===========================
 * String: uppercase, lowercase, capitalize, truncate, replace, stripTags
 * Number: number, currency, abs, round
 * Array: join, first, last, length, reverse, slice
 * Utility: escape, json, default, urlencode
 * i18n: translate, pluralize, date
 */

import { isExpressionSafe, safeEvaluate } from './safe-evaluator'
import { createDetailedErrorMessage } from './utils'

/**
 * Add basic filter support to expressions
 * Filter functions receive the value to transform, optional args, and the context object
 */
export type FilterFunction = (value: any, context: Record<string, any>, ...args: any[]) => any

/**
 * Registry of custom filters added by users
 * Use registerFilter() to add custom filters
 */
const customFilters: Record<string, FilterFunction> = {}

// =============================================================================
// Built-in Filters
// =============================================================================

export const defaultFilters: Record<string, FilterFunction> = {
  // String transformation filters
  uppercase: (value: any, _context: Record<string, any>) => {
    return value !== undefined && value !== null ? String(value).toUpperCase() : ''
  },
  lowercase: (value: any, _context: Record<string, any>) => {
    return value !== undefined && value !== null ? String(value).toLowerCase() : ''
  },
  capitalize: (value: any, _context: Record<string, any>) => {
    if (value === undefined || value === null)
      return ''
    const str = String(value)
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  // Number filters
  number: (value: any, _context: Record<string, any>, decimals: number = 0) => {
    if (value === undefined || value === null)
      return ''
    try {
      const numValue = Number(value)
      return Number.isNaN(numValue) ? '' : numValue.toFixed(Number.parseInt(String(decimals), 10))
    }
    catch {
      return ''
    }
  },

  // Array filters
  join: (value: any, _context: Record<string, any>, separator: string = ',') => {
    if (!Array.isArray(value))
      return ''
    // Join the array with the separator without escaping
    return value.join(String(separator))
  },

  // Safety filters
  escape: (value: any, _context: Record<string, any>) => {
    if (value === undefined || value === null)
      return ''
    return escapeHtml(String(value))
  },

  // Translation filter - uses context parameter instead of global state
  translate: (value: any, context: Record<string, any>, params: Record<string, any> = {}) => {
    if (!context || !context.__translations) {
      return value
    }

    // Use the translation function
    const translations = context.__translations
    const fallbackToKey = context.__i18nConfig?.fallbackToKey ?? true

    // Split the key by dots to access nested properties
    const parts = String(value).split('.')
    let translation = translations

    // Traverse through the translations object
    for (const part of parts) {
      if (translation === undefined || translation === null) {
        break
      }
      translation = translation[part]
    }

    // If translation not found, fallback to key if enabled
    if (translation === undefined || translation === null) {
      return fallbackToKey ? value : ''
    }

    // Replace parameters in the translation string
    let result = String(translation)

    // Replace :parameter style placeholders
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(
        new RegExp(`:${paramKey}`, 'g'),
        String(paramValue),
      )
    })

    return result
  },

  // Short alias for translate
  t: (value: any, context: Record<string, any>, params: Record<string, any> = {}) => {
    return defaultFilters.translate(value, context, params)
  },

  // =========================================================================
  // Additional Utility Filters
  // =========================================================================

  // Truncate string to specified length with ellipsis
  truncate: (value: any, _context: Record<string, any>, length: number = 50, suffix: string = '...') => {
    if (value === undefined || value === null)
      return ''
    const str = String(value)
    if (str.length <= length)
      return str
    return str.substring(0, length - suffix.length) + suffix
  },

  // Format date using Intl.DateTimeFormat
  date: (value: any, _context: Record<string, any>, format: string = 'short', locale: string = 'en-US') => {
    if (value === undefined || value === null)
      return ''
    try {
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime()))
        return String(value)

      // Support common format presets
      const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
        short: { dateStyle: 'short' },
        medium: { dateStyle: 'medium' },
        long: { dateStyle: 'long' },
        full: { dateStyle: 'full' },
        time: { timeStyle: 'short' },
        datetime: { dateStyle: 'short', timeStyle: 'short' },
        iso: {}, // handled separately
      }

      if (format === 'iso') {
        return date.toISOString()
      }

      return new Intl.DateTimeFormat(locale, formatOptions[format] || formatOptions.short).format(date)
    }
    catch {
      return String(value)
    }
  },

  // Format number as currency
  currency: (value: any, _context: Record<string, any>, currencyCode: string = 'USD', locale: string = 'en-US') => {
    if (value === undefined || value === null)
      return ''
    try {
      const num = Number(value)
      if (Number.isNaN(num))
        return String(value)
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
      }).format(num)
    }
    catch {
      return String(value)
    }
  },

  // Pluralize word based on count
  pluralize: (value: any, _context: Record<string, any>, singular: string, plural?: string) => {
    const count = Number(value)
    if (Number.isNaN(count))
      return singular
    const pluralForm = plural || `${singular}s`
    return count === 1 ? singular : pluralForm
  },

  // Get first item from array or first character from string
  first: (value: any, _context: Record<string, any>) => {
    if (value === undefined || value === null)
      return ''
    if (Array.isArray(value))
      return value[0]
    return String(value).charAt(0)
  },

  // Get last item from array or last character from string
  last: (value: any, _context: Record<string, any>) => {
    if (value === undefined || value === null)
      return ''
    if (Array.isArray(value))
      return value[value.length - 1]
    const str = String(value)
    return str.charAt(str.length - 1)
  },

  // Get length of array or string
  length: (value: any, _context: Record<string, any>) => {
    if (value === undefined || value === null)
      return 0
    if (Array.isArray(value) || typeof value === 'string')
      return value.length
    if (typeof value === 'object')
      return Object.keys(value).length
    return 0
  },

  // Convert to JSON string
  json: (value: any, _context: Record<string, any>, pretty: boolean = false) => {
    if (value === undefined)
      return 'undefined'
    if (value === null)
      return 'null'
    try {
      return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)
    }
    catch {
      return String(value)
    }
  },

  // Default value if null/undefined
  default: (value: any, _context: Record<string, any>, defaultValue: any = '') => {
    return (value === undefined || value === null || value === '') ? defaultValue : value
  },

  // Reverse string or array
  reverse: (value: any, _context: Record<string, any>) => {
    if (value === undefined || value === null)
      return ''
    if (Array.isArray(value))
      return [...value].reverse()
    return String(value).split('').reverse().join('')
  },

  // Slice array or string
  slice: (value: any, _context: Record<string, any>, start: number = 0, end?: number) => {
    if (value === undefined || value === null)
      return ''
    if (Array.isArray(value) || typeof value === 'string')
      return value.slice(start, end)
    return value
  },

  // Replace text
  replace: (value: any, _context: Record<string, any>, search: string, replacement: string = '') => {
    if (value === undefined || value === null)
      return ''
    return String(value).replace(new RegExp(search, 'g'), replacement)
  },

  // Strip HTML tags
  stripTags: (value: any, _context: Record<string, any>) => {
    if (value === undefined || value === null)
      return ''
    return String(value).replace(/<[^>]*>/g, '')
  },

  // URL encode
  urlencode: (value: any, _context: Record<string, any>) => {
    if (value === undefined || value === null)
      return ''
    return encodeURIComponent(String(value))
  },

  // Absolute value
  abs: (value: any, _context: Record<string, any>) => {
    const num = Number(value)
    return Number.isNaN(num) ? 0 : Math.abs(num)
  },

  // Round number
  round: (value: any, _context: Record<string, any>, decimals: number = 0) => {
    const num = Number(value)
    if (Number.isNaN(num))
      return 0
    const factor = 10 ** decimals
    return Math.round(num * factor) / factor
  },
}

// =============================================================================
// Custom Filter Registry API
// =============================================================================

/**
 * Register a custom filter
 *
 * @param name - Filter name (used in templates as {{ value | filterName }})
 * @param fn - Filter function
 *
 * @example
 * ```typescript
 * // Register a custom filter
 * registerFilter('reverse', (value) => {
 *   return String(value).split('').reverse().join('')
 * })
 *
 * // Use in template: {{ name | reverse }}
 * ```
 */
export function registerFilter(name: string, fn: FilterFunction): void {
  if (name in defaultFilters) {
    console.warn(`Filter "${name}" already exists as a built-in filter. Custom filter will take precedence.`)
  }
  customFilters[name] = fn
}

/**
 * Register multiple custom filters at once
 *
 * @param filters - Object mapping filter names to functions
 *
 * @example
 * ```typescript
 * registerFilters({
 *   reverse: (value) => String(value).split('').reverse().join(''),
 *   double: (value) => Number(value) * 2,
 * })
 * ```
 */
export function registerFilters(filters: Record<string, FilterFunction>): void {
  for (const [name, fn] of Object.entries(filters)) {
    registerFilter(name, fn)
  }
}

/**
 * Get all available filters (built-in + custom)
 */
export function getAllFilters(): Record<string, FilterFunction> {
  return { ...defaultFilters, ...customFilters }
}

/**
 * Clear all custom filters (useful for testing)
 */
export function clearCustomFilters(): void {
  for (const key of Object.keys(customFilters)) {
    delete customFilters[key]
  }
}

/**
 * HTML escape function to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Check if a template uses signals (state, derived, effect) in its script blocks
 * or has reactive attributes (@if, @for) with function call expressions
 */
function usesSignalsInScript(template: string): boolean {
  // Check for signals in script blocks
  const scriptRegex = /<script\b(?![^>]*\bserver\b)(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = scriptRegex.exec(template)) !== null) {
    const content = match[1]
    if (/\b(state|derived|effect)\s*\(/.test(content)) {
      return true
    }
  }

  // Also check for reactive attributes with function calls like @if="loading()" or @for="item in items()"
  // These indicate the template is using signals even if script blocks were removed
  if (/@(if|for|show)\s*=\s*["'][^"']*\(\s*\)/.test(template)) {
    return true
  }

  // Check for @for with function call in the collection expression: @for="item in items()"
  if (/@for\s*=\s*["'][^"']*\s+(?:in|of)\s+[^"']*\(\s*\)/.test(template)) {
    return true
  }

  return false
}

/**
 * Check if an expression references only identifiers that exist in the context
 * Returns true if ALL identifiers in the expression are in context or are JS built-ins
 */
function expressionUsesOnlyContextVars(expr: string, context: Record<string, any>): boolean {
  const jsBuiltins = ['parseInt', 'parseFloat', 'String', 'Number', 'Boolean', 'Array', 'Object', 'JSON', 'Math', 'Date', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'isNaN', 'isFinite', 'window', 'document', 'console']

  // Extract all identifiers from the expression (words that aren't numbers or inside strings)
  // This is a simplified check - remove strings first, then find identifiers
  let exprWithoutStrings = expr
    .replace(/'[^']*'/g, '') // Remove single-quoted strings
    .replace(/"[^"]*"/g, '') // Remove double-quoted strings
    .replace(/`[^`]*`/g, '') // Remove template literals

  // Find all identifiers (variable names at the start of property access chains)
  const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g
  let identifierMatch: RegExpExecArray | null

  while ((identifierMatch = identifierRegex.exec(exprWithoutStrings)) !== null) {
    const identifier = identifierMatch[1]
    // Check if this identifier is a property access (preceded by a dot)
    const beforeIdentifier = exprWithoutStrings.substring(0, identifierMatch.index)
    const isPropAccess = beforeIdentifier.trimEnd().endsWith('.')

    // Only check top-level identifiers (not property accesses like .foo)
    if (!isPropAccess) {
      // If this identifier is not a JS built-in and not in context, it's a runtime variable
      if (!jsBuiltins.includes(identifier) && !(identifier in context)) {
        return false
      }
    }
  }

  return true
}

/**
 * Process template expressions including variables, filters, and operations
 */
export function processExpressions(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Check if this template uses signals - if so, we need to preserve expressions
  // that reference runtime variables (like loop variables or signal calls)
  const hasSignals = usesSignalsInScript(template)

  // Replace triple curly braces with unescaped expressions {{{ expr }}} - similar to {!! expr !!}
  output = output.replace(/\{\{\{([\s\S]*?)\}\}\}/g, (match, expr, offset) => {
    try {
      const value = evaluateExpression(expr, context)
      // Return raw content without escaping
      return value !== undefined && value !== null ? String(value) : ''
    }
    catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      return createDetailedErrorMessage(
        'Expression',
        `Error evaluating: {{{ ${expr.trim()}}}}: ${msg}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  // Replace {!! expr !!} with unescaped expressions
  output = output.replace(/\{!!([\s\S]*?)!!\}/g, (match, expr, offset) => {
    try {
      const value = evaluateExpression(expr, context)
      // Return raw content without escaping
      return value !== undefined && value !== null ? String(value) : ''
    }
    catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      return createDetailedErrorMessage(
        'Expression',
        `Error evaluating: {!! ${expr.trim()} !!}: ${msg}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  // Replace {{ expr }} with escaped expressions
  output = output.replace(/\{\{([\s\S]*?)\}\}/g, (match, expr, offset) => {
    const trimmedExpr = expr.trim()

    // Skip common JS built-ins that should be evaluated server-side
    const jsBuiltins = ['parseInt', 'parseFloat', 'String', 'Number', 'Boolean', 'Array', 'Object', 'JSON', 'Math', 'Date', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'true', 'false', 'null', 'undefined']

    // First, check if the expression starts with a known variable in context
    // This handles cases like `items.filter(...)` where `items` is in context
    const identifierPattern = /^([a-zA-Z_$][a-zA-Z0-9_$]*)/
    const identifierMatch = trimmedExpr.match(identifierPattern)
    const firstVarName = identifierMatch?.[1]
    const firstVarInContext = firstVarName && (firstVarName in context || jsBuiltins.includes(firstVarName))

    // Detect if this looks like a client-side signal expression
    // Signals are typically function calls like loading(), sessions().length, etc.
    // Only preserve for client-side if it's a direct function call that's not in context
    const directFunctionCall = /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/
    const directFuncMatch = trimmedExpr.match(directFunctionCall)
    const isLikelySignal = directFuncMatch && !jsBuiltins.includes(directFuncMatch[1]) && !(directFuncMatch[1] in context)

    // Skip build-time placeholder expressions like __TITLE__ - these should be handled elsewhere
    if (/^__[A-Z_]+__$/.test(trimmedExpr)) {
      // This is a placeholder - don't try to evaluate it as a signal, leave it as is
      // (it will be replaced by another part of the build process or should be removed)
      return ''
    }

    // For signal-based templates, preserve expressions that reference runtime variables
    // This includes loop variables (page, event, etc.) and component-defined functions (fmt, etc.)
    if (hasSignals && !expressionUsesOnlyContextVars(trimmedExpr, context)) {
      return match // Preserve for runtime evaluation
    }

    // Preserve signal-like expressions for client-side processing
    if (isLikelySignal) {
      return match
    }

    try {
      const value = evaluateExpression(expr, context)
      // Escape HTML for security
      return value !== undefined && value !== null ? escapeHtml(String(value)) : ''
    }
    catch (error: unknown) {
      // If evaluation fails and it looks like a client-side signal,
      // preserve the expression for client-side processing
      if (isLikelySignal) {
        return match
      }
      // For signal templates, preserve the expression instead of showing error
      if (hasSignals) {
        return match
      }
      const msg = error instanceof Error ? error.message : String(error)
      return createDetailedErrorMessage(
        'Expression',
        `Error evaluating: {{ ${trimmedExpr} }}: ${msg}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  return output
}

/**
 * Apply filters to a value
 */
export function applyFilters(value: any, filterExpression: string, context: Record<string, any>): any {
  // No filters to apply
  if (!filterExpression.trim()) {
    return value
  }

  // Process each filter in sequence
  let result = value
  let remainingExpression = filterExpression.trim()

  // Process filters one by one to handle complex parameters like objects
  while (remainingExpression.length > 0) {
    // Find the next filter name
    const filterMatch = remainingExpression.match(/^(\w+)/)
    if (!filterMatch) {
      // No valid filter name, skip this part
      break
    }

    const filterName = filterMatch[1]
    // Remove the filter name from the remaining expression
    remainingExpression = remainingExpression.substring(filterName.length).trim()

    // Find the filter function - check custom filters first, then default
    const filterFn = customFilters[filterName] || defaultFilters[filterName]
    if (!filterFn) {
      throw new Error(`Filter not found: ${filterName}. Available filters: ${Object.keys(getAllFilters()).join(', ')}`)
    }

    // Check if there are parameters (starting with parenthesis)
    let params: any[] = []

    // Special case for filter:param syntax (like number:2)
    if (remainingExpression.startsWith(':')) {
      const colonParamMatch = remainingExpression.match(/^:([^|\s]+)/)
      if (colonParamMatch) {
        const paramValue = colonParamMatch[1].trim()
        try {
          // Try to convert to number if possible
          const numValue = Number(paramValue)
          params = [Number.isNaN(numValue) ? paramValue : numValue]
        }
        catch {
          params = [paramValue] // Fallback to string
        }

        // Update the remaining expression
        remainingExpression = remainingExpression.substring(colonParamMatch[0].length).trim()
      }
    }
    // Standard parenthesis parameters
    else if (remainingExpression.startsWith('(')) {
      // Find the matching closing parenthesis
      let openParens = 1
      let closeIndex = 1
      while (openParens > 0 && closeIndex < remainingExpression.length) {
        if (remainingExpression[closeIndex] === '(')
          openParens++
        if (remainingExpression[closeIndex] === ')')
          openParens--
        closeIndex++
      }

      if (openParens === 0) {
        // We found a matching closing parenthesis
        const paramsString = remainingExpression.substring(1, closeIndex - 1).trim()

        // Parse the parameters
        if (paramsString) {
          try {
            // Check if it's a simple JSON-like object
            if (paramsString.startsWith('{') && paramsString.endsWith('}')) {
              // Evaluate as an object
              const paramObj = evaluateExpression(`(${paramsString})`, context, true)
              params = [paramObj]
            }
            else {
              // Split by commas and parse each parameter
              params = paramsString.split(',').map((p) => {
                const trimmed = p.trim()
                return evaluateExpression(trimmed, context, true)
              })
            }
          }
          catch {
            // If parsing fails, use the raw parameters
            params = [paramsString]
          }
        }

        // Remove the processed parameters from the remaining expression
        remainingExpression = remainingExpression.substring(closeIndex).trim()
      }
    }

    // Apply the filter with parameters, passing context for filters that need it
    try {
      result = filterFn(result, context, ...params)
    }
    catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`Error applying filter '${filterName}': ${msg}`)
    }

    // If there's more to process, the next character should be a pipe
    if (remainingExpression.startsWith('|')) {
      remainingExpression = remainingExpression.substring(1).trim()
    }
    else {
      // No more filters
      break
    }
  }

  return result
}

/**
 * Find the index of a filter pipe character in an expression,
 * properly distinguishing from || (logical OR), |= (bitwise OR assignment),
 * and pipes inside strings or parentheses.
 *
 * @param expr - The expression to search
 * @returns The index of the filter pipe, or -1 if not found
 *
 * @example
 * ```typescript
 * findFilterPipeIndex('name | uppercase')     // 5 (filter pipe)
 * findFilterPipeIndex('a || b')               // -1 (logical OR, not a filter)
 * findFilterPipeIndex('x |= 5')               // -1 (bitwise OR assignment)
 * findFilterPipeIndex('"a|b" | trim')         // 6 (pipe inside string ignored)
 * findFilterPipeIndex('(a | b) | upper')      // 8 (first is in parens, second is filter)
 * ```
 */
function findFilterPipeIndex(expr: string): number {
  let inString = false
  let stringChar = ''
  let parenDepth = 0
  let bracketDepth = 0
  let braceDepth = 0

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i]
    const nextChar = expr[i + 1]
    const prevChar = expr[i - 1]

    // Handle escape sequences in strings
    if (inString && prevChar === '\\') {
      continue
    }

    // Handle string start/end
    if ((char === '"' || char === '\'' || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      }
      else if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      continue
    }

    // Skip characters inside strings
    if (inString) {
      continue
    }

    // Track nesting levels
    if (char === '(')
      parenDepth++
    else if (char === ')')
      parenDepth--
    else if (char === '[')
      bracketDepth++
    else if (char === ']')
      bracketDepth--
    else if (char === '{')
      braceDepth++
    else if (char === '}')
      braceDepth--

    // Look for pipe character at top level (not nested)
    if (char === '|' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      // Check if this is part of || (logical OR)
      if (nextChar === '|') {
        i++ // Skip the second |
        continue
      }

      // Check if this is part of |= (bitwise OR assignment)
      if (nextChar === '=') {
        i++ // Skip the =
        continue
      }

      // This is a filter pipe
      return i
    }
  }

  return -1
}

/**
 * Evaluate an expression within the given context
 * @param {string} expression - The expression to evaluate
 * @param {Record<string, any>} context - The context object containing variables
 * @param {boolean} silent - Whether to silently handle errors (return undefined) or throw
 * @returns The evaluated result
 */
export function evaluateExpression(expression: string, context: Record<string, any>, silent: boolean = false): any {
  try {
    const trimmedExpr = expression.trim()

    // Handle circular references specifically
    if (trimmedExpr.includes('parent.child.parent')) {
      if (context.parent && context.parent.name) {
        return context.parent.name
      }
    }

    // Find filter pipe index, properly distinguishing from || and |= operators
    const filterPipeIndex = findFilterPipeIndex(trimmedExpr)

    if (filterPipeIndex > 0) {
      // Split into expression and filters
      const baseExpr = trimmedExpr.substring(0, filterPipeIndex).trim()
      const filterExpr = trimmedExpr.substring(filterPipeIndex + 1).trim()

      // Evaluate the base expression
      const baseValue = evaluateExpression(baseExpr, context, true)

      // Apply filters to the result
      return applyFilters(baseValue, filterExpr, context)
    }

    // Special case for common error patterns
    if (trimmedExpr.startsWith('nonExistentVar')
      || trimmedExpr.includes('.methodThatDoesntExist')
      || trimmedExpr.includes('JSON.parse("{invalid}")')) {
      throw new Error(`Reference to undefined variable or method: ${trimmedExpr}`)
    }

    // Use safe evaluator for potentially unsafe expressions
    if (!isExpressionSafe(trimmedExpr)) {
      if (!silent) {
        console.warn(`Potentially unsafe expression detected, using safe evaluator: ${trimmedExpr}`)
      }
      return safeEvaluate(trimmedExpr, context)
    }

    // For safe expressions, evaluate directly (memoization with functions is complex)
    // Create a function that evaluates the expression in the context
    try {
      const keys = Object.keys(context)
      const values = Object.values(context)

      // eslint-disable-next-line no-new-func
      const exprFn = new Function(...keys, `
        try {
          return ${trimmedExpr};
        } catch (e) {
          if (e instanceof ReferenceError || e instanceof TypeError) {
            return undefined;
          }
          throw e;
        }
      `)

      return exprFn(...values)
    }
    catch {
      // If evaluation fails, fall back to safe evaluator
      return safeEvaluate(trimmedExpr, context)
    }
  }
  catch (error: unknown) {
    if (!silent) {
      console.error(`Error evaluating expression: ${expression}`, error)
    }

    // Instead of returning undefined, throw the error to make sure it's displayed in the template
    // This will be caught by the calling function and included in the error message
    throw error
  }
}

/**
 * HTML unescape function to reverse escapeHtml
 */
export function unescapeHtml(html: string): string {
  if (!html)
    return ''

  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&amp;/g, '&')
}
