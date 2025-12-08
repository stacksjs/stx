/**
 * Module for handling authentication and authorization in templates
 */

import { createSafeFunction, isExpressionSafe, safeEvaluate } from './safe-evaluator'

/**
 * Safely evaluates an auth expression within the given context
 * Similar to evaluateExpression but specialized for auth conditionals
 * Uses the safe evaluator to prevent code injection
 *
 * @param {string} expression - The expression to evaluate
 * @param {Record<string, any>} context - The context object containing variables
 * @returns The evaluated result
 */
export function evaluateAuthExpression(expression: string, context: Record<string, any>): any {
  try {
    const trimmedExpr = expression.trim()

    // Use safe evaluation to prevent code injection
    if (isExpressionSafe(trimmedExpr)) {
      const exprFn = createSafeFunction(trimmedExpr, Object.keys(context))
      return exprFn(...Object.values(context))
    }
    else {
      // Fall back to safe evaluator for potentially unsafe expressions
      return safeEvaluate(trimmedExpr, context)
    }
  }
  catch {
    // Silent fail for auth expressions - return false rather than throwing
    return false
  }
}
