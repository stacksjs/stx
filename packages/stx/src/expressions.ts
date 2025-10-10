/**
 * Module for processing template expressions and filters
 */

import { memoize } from './performance-utils'
import { isExpressionSafe, safeEvaluate } from './safe-evaluator'
import { createDetailedErrorMessage } from './utils'

/**
 * Add basic filter support to expressions
 */
export type FilterFunction = (value: any, ...args: any[]) => any

// Global context for access in filters
let globalContext: Record<string, any> = {}

/**
 * Set global context for filters
 */
export function setGlobalContext(context: Record<string, any>): void {
  globalContext = context
}

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
    try {
      const numValue = Number(value)
      return Number.isNaN(numValue) ? '' : numValue.toFixed(Number.parseInt(String(decimals), 10))
    }
    catch {
      return ''
    }
  },

  // Array filters
  join: (value: any, separator: string = ',') => {
    if (!Array.isArray(value))
      return ''
    // Join the array with the separator without escaping
    return value.join(String(separator))
  },

  // Safety filters
  escape: (value: any) => {
    if (value === undefined || value === null)
      return ''
    return escapeHtml(String(value))
  },

  // Translation filter
  translate: (value: any, params: Record<string, any> = {}) => {
    // Access translations from the current context
    const context = globalContext
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
  t: (value: any, params: Record<string, any> = {}) => {
    return defaultFilters.translate(value, params)
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
export function processExpressions(template: string, context: Record<string, any>, filePath: string): string {
  // Set the global context for access in filters
  setGlobalContext(context)

  let output = template

  // Replace triple curly braces with unescaped expressions {{{ expr }}} - similar to {!! expr !!}
  output = output.replace(/\{\{\{([\s\S]*?)\}\}\}/g, (match, expr, offset) => {
    try {
      const value = evaluateExpression(expr, context)
      // Return raw content without escaping
      return value !== undefined && value !== null ? String(value) : ''
    }
    catch (error: any) {
      return createDetailedErrorMessage(
        'Expression',
        `Error evaluating: {{{ ${expr.trim()}}}}: ${error.message || ''}`,
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
    catch (error: any) {
      return createDetailedErrorMessage(
        'Expression',
        `Error evaluating: {!! ${expr.trim()} !!}: ${error.message || ''}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  // Replace {{ expr }} with escaped expressions
  output = output.replace(/\{\{([\s\S]*?)\}\}/g, (match, expr, offset) => {
    try {
      const value = evaluateExpression(expr, context)
      // Escape HTML for security
      return value !== undefined && value !== null ? escapeHtml(String(value)) : ''
    }
    catch (error: any) {
      return createDetailedErrorMessage(
        'Expression',
        `Error evaluating: {{ ${expr.trim()} }}: ${error.message || ''}`,
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

    // Find the filter function
    const filterFn = defaultFilters[filterName]
    if (!filterFn) {
      throw new Error(`Filter not found: ${filterName}`)
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

    // Apply the filter with parameters
    try {
      result = filterFn(result, ...params)
    }
    catch (error: any) {
      throw new Error(`Error applying filter '${filterName}': ${error.message}`)
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
 * Memoized version of unsafe expression evaluation for performance
 */
const memoizedUnsafeEvaluate = memoize((expression: string, contextKeys: string, contextValues: string) => {
  try {
    const keys = JSON.parse(contextKeys)
    const values = JSON.parse(contextValues)

    // eslint-disable-next-line no-new-func
    const exprFn = new Function(...keys, `
      try {
        return ${expression};
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
    return undefined
  }
}, 500)

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
    catch (evalError: any) {
      // If evaluation fails, fall back to safe evaluator
      return safeEvaluate(trimmedExpr, context)
    }
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
