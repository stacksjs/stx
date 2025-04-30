/**
 * Module for handling authentication and authorization in templates
 */

/**
 * Safely evaluates an auth expression within the given context
 * Similar to evaluateExpression but specialized for auth conditionals
 *
 * @param {string} expression - The expression to evaluate
 * @param {Record<string, any>} context - The context object containing variables
 * @returns The evaluated result
 */
export function evaluateAuthExpression(expression: string, context: Record<string, any>): any {
  try {
    const trimmedExpr = expression.trim()

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
  catch {
    // Silent fail for auth expressions - return false rather than throwing
    return false
  }
}
