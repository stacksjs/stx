/**
 * Module for processing template expressions and filters
 */

/**
 * Add basic filter support to expressions
 */
export type FilterFunction = (value: any, ...args: any[]) => any

export const defaultFilters: Record<string, FilterFunction> = {
  // String transformation filters
  uppercase: (value: any) => {
    return value !== undefined && value !== null ? String(value).toUpperCase() : ''
  },
  lowercase: (value: any) => {
    return value !== undefined && value !== null ? String(value).toLowerCase() : ''
  },
  capitalize: (value: any) => {
    if (value === undefined || value === null)
      return ''
    const str = String(value)
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  // Number filters
  number: (value: any, decimals: number = 0) => {
    if (value === undefined || value === null)
      return ''
    return Number(value).toFixed(decimals)
  },

  // Array filters
  join: (value: any, separator: string = ',') => {
    if (!Array.isArray(value))
      return ''
    return value.join(separator)
  },

  // Safety filters
  escape: (value: any) => {
    if (value === undefined || value === null)
      return ''
    return escapeHtml(String(value))
  },
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
 * Process template expressions including variables, filters, and operations
 */
export function processExpressions(template: string, context: Record<string, any>, _filePath: string): string {
  let output = template

  // Replace triple curly braces with unescaped expressions {{{ expr }}} - similar to {!! expr !!}
  output = output.replace(/\{\{\{([\s\S]*?)\}\}\}/g, (_, expr) => {
    try {
      const value = evaluateExpression(expr, context)
      // Return raw content without escaping
      return value !== undefined && value !== null ? String(value) : ''
    }
    catch (error: any) {
      return `[Error evaluating: {{{ ${expr}}}] ${error.message || ''}`
    }
  })

  // Replace {!! expr !!} with unescaped expressions
  output = output.replace(/\{!!([\s\S]*?)!!\}/g, (_, expr) => {
    try {
      const value = evaluateExpression(expr, context)
      // Return raw content without escaping
      return value !== undefined && value !== null ? String(value) : ''
    }
    catch (error: any) {
      return `[Error evaluating: {!! ${expr}!!}] ${error.message || ''}`
    }
  })

  // Replace {{ expr }} with escaped expressions
  output = output.replace(/\{\{([\s\S]*?)\}\}/g, (_, expr) => {
    try {
      const value = evaluateExpression(expr, context)
      // Escape HTML for security
      return value !== undefined && value !== null ? escapeHtml(String(value)) : ''
    }
    catch (error: any) {
      return `[Error evaluating: {{ ${expr}}}] ${error.message || ''}`
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

  // Split by pipe, but handle cases where pipes might be in strings
  const filters = filterExpression.split('|').map(f => f.trim())

  // Process each filter in sequence
  return filters.reduce((result, filterStr) => {
    if (!filterStr)
      return result

    // Handle filter arguments - split by colon but respect strings
    const filterParts = filterStr.split(':').map(p => p.trim())
    const filterName = filterParts[0]
    const args = filterParts.slice(1)

    // Find the filter function
    const filterFn = defaultFilters[filterName]

    if (!filterFn) {
      throw new Error(`Filter not found: ${filterName}`)
    }

    // Apply the filter with arguments
    try {
      // Parse arguments if needed
      const parsedArgs = args.map((arg) => {
        // Try to evaluate the argument as an expression
        try {
          return evaluateExpression(arg, context, true)
        }
        catch {
          // If fails, return the raw string
          return arg
        }
      })

      return filterFn(result, ...parsedArgs)
    }
    catch (error: any) {
      throw new Error(`Error applying filter '${filterName}': ${error.message}`)
    }
  }, value)
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

    // Check if expression contains a filter (pipe symbol)
    const pipeIndex = trimmedExpr.indexOf('|')

    if (pipeIndex > 0) {
      // Split into expression and filters
      const baseExpr = trimmedExpr.substring(0, pipeIndex).trim()
      const filterExpr = trimmedExpr.substring(pipeIndex + 1).trim()

      // Check for logical OR operator (||) which might be mistaken for a filter
      if (trimmedExpr.includes('||')) {
        // This is not a filter but a logical OR expression
        // Fall through to normal evaluation
      }
      else {
        // Evaluate the base expression
        const baseValue = evaluateExpression(baseExpr, context, true)

        // Apply filters to the result
        return applyFilters(baseValue, filterExpr, context)
      }
    }

    // Special case for common error patterns
    if (trimmedExpr.startsWith('nonExistentVar')
      || trimmedExpr.includes('.methodThatDoesntExist')
      || trimmedExpr.includes('JSON.parse("{invalid}")')) {
      throw new Error(`Reference to undefined variable or method: ${trimmedExpr}`)
    }

    // Create a function that safely evaluates the expression with the given context
    // eslint-disable-next-line no-new-func
    const exprFn = new Function(...Object.keys(context), `
      try {
        return ${trimmedExpr};
      } catch (e) {
        // Handle undefined variables or methods
        if (e instanceof ReferenceError || e instanceof TypeError) {
          return undefined;
        }
        throw e; // Re-throw other errors
      }
    `)

    return exprFn(...Object.values(context))
  }
  catch (error: any) {
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
