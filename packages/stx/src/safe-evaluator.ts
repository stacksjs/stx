/**
 * Safe expression evaluator that reduces security risks from using new Function()
 */

// =============================================================================
// Configuration
// =============================================================================

/**
 * Safe evaluator configuration options
 */
export interface SafeEvaluatorConfig {
  /** Maximum depth for object sanitization (default: 10) */
  maxSanitizeDepth: number
  /** Allow bracket notation with string literals like obj["key"] (default: false) */
  allowBracketNotation: boolean
}

/**
 * Default configuration
 */
const defaultConfig: SafeEvaluatorConfig = {
  maxSanitizeDepth: 10,
  allowBracketNotation: false,
}

/**
 * Current configuration (can be modified via configureSafeEvaluator)
 */
let currentConfig: SafeEvaluatorConfig = { ...defaultConfig }

/**
 * Configure the safe evaluator
 *
 * @example
 * ```typescript
 * configureSafeEvaluator({
 *   maxSanitizeDepth: 20,
 *   allowBracketNotation: true
 * })
 * ```
 */
export function configureSafeEvaluator(config: Partial<SafeEvaluatorConfig>): void {
  currentConfig = { ...currentConfig, ...config }
}

/**
 * Reset configuration to defaults
 */
export function resetSafeEvaluatorConfig(): void {
  currentConfig = { ...defaultConfig }
}

/**
 * Get current configuration
 */
export function getSafeEvaluatorConfig(): SafeEvaluatorConfig {
  return { ...currentConfig }
}

// =============================================================================
// Allowed Globals
// =============================================================================

/**
 * List of allowed global functions and methods for expression evaluation
 */
const _ALLOWED_GLOBALS = new Set([
  // Math functions
  'Math',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  // String functions
  'String',
  'encodeURIComponent',
  'decodeURIComponent',
  // Array functions
  'Array',
  // Date functions
  'Date',
  // JSON (safe methods only)
  'JSON',
  // Number
  'Number',
  // Boolean
  'Boolean',
])

// =============================================================================
// Dangerous Patterns
// =============================================================================

/**
 * List of dangerous patterns that should never be allowed
 *
 * Categories:
 * 1. Code execution: eval, Function, timers
 * 2. Module system: process, require, import
 * 3. Global access: window, document, global
 * 4. Prototype manipulation: constructor, prototype, __proto__
 * 5. Reflection/Metaprogramming: Reflect, Proxy, Symbol
 * 6. Weak references: WeakMap, WeakSet (can bypass GC, hide data)
 * 7. Generators/Iterators: potential for infinite loops
 * 8. Dunder methods: __anything__
 */
const DANGEROUS_PATTERNS = [
  // Code execution
  /\b(eval|Function|setTimeout|setInterval|setImmediate)\b/,
  // Module system access
  /\b(process|require|import|exports|module)\b/,
  // Global object access
  /\b(window|document|global|globalThis)\b/,
  // Prototype manipulation
  /\b(constructor|prototype|__proto__)\b/,
  // Reflection and metaprogramming APIs
  /\b(Reflect|Proxy)\b/,
  // Symbol (can create hidden properties)
  /\bSymbol\b/,
  // Weak references (can hide data, bypass sanitization)
  /\b(WeakMap|WeakSet|WeakRef|FinalizationRegistry)\b/,
  // Generators (potential for infinite loops, state persistence)
  /\b(Generator|AsyncGenerator)\b/,
  // Dunder methods
  /__\w+__/,
  // Bind/call/apply (can change execution context)
  /\.(bind|call|apply)\s*\(/,
]

/**
 * Pattern for bracket notation with strings - checked separately based on config
 */
const BRACKET_NOTATION_PATTERN = /\[\s*['"]/

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

  // Check bracket notation based on configuration
  if (!currentConfig.allowBracketNotation && BRACKET_NOTATION_PATTERN.test(trimmed)) {
    throw new Error(`Bracket notation with strings not allowed: ${trimmed}. Enable with configureSafeEvaluator({ allowBracketNotation: true })`)
  }

  return trimmed
}

/**
 * Create a safer context object that only exposes safe properties
 */
export function createSafeContext(context: Record<string, unknown>): Record<string, unknown> {
  const safeContext: Record<string, unknown> = {}

  // Add allowed globals
  safeContext.Math = Math
  safeContext.JSON = JSON
  safeContext.Date = Date
  safeContext.String = String
  safeContext.Number = Number
  safeContext.Boolean = Boolean
  safeContext.Array = Array
  safeContext.parseInt = Number.parseInt
  safeContext.parseFloat = Number.parseFloat
  safeContext.isNaN = Number.isNaN
  safeContext.isFinite = Number.isFinite
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
    }
    else {
      safeContext[key] = value
    }
  }

  return safeContext
}

/**
 * Recursively sanitize an object by removing dangerous properties
 * Uses configurable maxSanitizeDepth from configuration
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion - use configurable depth
  if (depth > currentConfig.maxSanitizeDepth) {
    return '[Object too deep]'
  }

  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip dangerous keys
    if (key.startsWith('_')
      || key === 'constructor'
      || key === 'prototype'
      || key === '__proto__') {
      continue
    }

    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, depth + 1)
    }
    else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Safely evaluate an expression with the given context
 *
 * @param expression - The JavaScript expression to evaluate
 * @param context - Variables available during evaluation
 * @returns The result of the expression evaluation, or undefined on error
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = safeEvaluate('name.toUpperCase()', { name: 'hello' })
 *
 * // With type parameter for typed result
 * const count = safeEvaluate<number>('items.length', { items: [1, 2, 3] })
 * ```
 */
export function safeEvaluate<T = unknown>(expression: string, context: Record<string, unknown>): T | undefined {
  try {
    const sanitizedExpr = sanitizeExpression(expression)
    const safeContext = createSafeContext(context)

    // Create function with safe context
    // eslint-disable-next-line no-new-func
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
  }
  catch {
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
  }
  catch {
    return false
  }
}
