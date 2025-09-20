/**
 * Safe expression evaluator that reduces security risks from using new Function()
 */

/**
 * List of allowed global functions and methods for expression evaluation
 */
const ALLOWED_GLOBALS = new Set([
  // Math functions
  'Math', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  // String functions
  'String', 'encodeURIComponent', 'decodeURIComponent',
  // Array functions
  'Array',
  // Date functions
  'Date',
  // JSON (safe methods only)
  'JSON',
  // Number
  'Number',
  // Boolean
  'Boolean'
])

/**
 * List of dangerous patterns that should never be allowed
 */
const DANGEROUS_PATTERNS = [
  /\b(eval|Function|setTimeout|setInterval|setImmediate)\b/,
  /\b(process|require|import|exports|module)\b/,
  /\b(window|document|global|globalThis)\b/,
  /\b(constructor|prototype|__proto__)\b/,
  /__\w+__/,  // Dunder methods
  /\[\s*['"]/,  // Bracket notation with strings (potential injection)
]

/**
 * Sanitize an expression by checking for dangerous patterns
 */
export function sanitizeExpression(expression: string): string {
  const trimmed = expression.trim()

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error(`Potentially unsafe expression: ${trimmed}`)
    }
  }

  return trimmed
}

/**
 * Create a safer context object that only exposes safe properties
 */
export function createSafeContext(context: Record<string, any>): Record<string, any> {
  const safeContext: Record<string, any> = {}

  // Add allowed globals
  safeContext.Math = Math
  safeContext.JSON = JSON
  safeContext.Date = Date
  safeContext.String = String
  safeContext.Number = Number
  safeContext.Boolean = Boolean
  safeContext.Array = Array
  safeContext.parseInt = parseInt
  safeContext.parseFloat = parseFloat
  safeContext.isNaN = isNaN
  safeContext.isFinite = isFinite
  safeContext.encodeURIComponent = encodeURIComponent
  safeContext.decodeURIComponent = decodeURIComponent

  // Add user context, but sanitize values
  for (const [key, value] of Object.entries(context)) {
    // Skip dangerous keys
    if (key.startsWith('_') || DANGEROUS_PATTERNS.some(p => p.test(key))) {
      continue
    }

    // For objects, create a safe copy
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      safeContext[key] = sanitizeObject(value)
    } else {
      safeContext[key] = value
    }
  }

  return safeContext
}

/**
 * Recursively sanitize an object by removing dangerous properties
 */
function sanitizeObject(obj: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[Object too deep]'
  }

  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1))
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip dangerous keys
    if (key.startsWith('_') ||
        key === 'constructor' ||
        key === 'prototype' ||
        key === '__proto__') {
      continue
    }

    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, depth + 1)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Safely evaluate an expression with the given context
 */
export function safeEvaluate(expression: string, context: Record<string, any>): any {
  try {
    const sanitizedExpr = sanitizeExpression(expression)
    const safeContext = createSafeContext(context)

    // Create function with safe context
    const func = new Function(...Object.keys(safeContext), `
      'use strict';
      try {
        return ${sanitizedExpr};
      } catch (e) {
        if (e instanceof ReferenceError || e instanceof TypeError) {
          return undefined;
        }
        throw e;
      }
    `)

    return func(...Object.values(safeContext))
  } catch (error: any) {
    // Return undefined for evaluation errors instead of throwing
    return undefined
  }
}

/**
 * Check if an expression is safe to evaluate
 */
export function isExpressionSafe(expression: string): boolean {
  try {
    sanitizeExpression(expression)
    return true
  } catch {
    return false
  }
}