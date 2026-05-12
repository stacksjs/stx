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
  /**
   * Allow bracket notation with string literals like `obj["key"]` (default: false).
   *
   * SECURITY WARNING: Enabling bracket notation broadens the attack surface.
   * Bracket notation can access properties that dot-notation filters block
   * (e.g. `obj["__proto__"]`, `obj["constructor"]`), and a dynamic key path
   * assembled at runtime (`obj[userInput]`) cannot be statically proven safe.
   * Only enable when all bracket keys are known string literals authored by
   * the template writer — never based on untrusted input.
   */
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
  // Object creation (can invoke arbitrary constructors)
  /\bnew\s+/,
  // Delete operator (can modify object structure)
  /\bdelete\s+/,
  // this keyword (can access execution context)
  /\bthis\b/,
]

const DANGEROUS_IDENTIFIERS = new Set([
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'process',
  'require',
  'import',
  'exports',
  'module',
  'window',
  'document',
  'global',
  'globalThis',
  'constructor',
  'prototype',
  'Reflect',
  'Proxy',
  'Symbol',
  'WeakMap',
  'WeakSet',
  'WeakRef',
  'FinalizationRegistry',
  'Generator',
  'AsyncGenerator',
  'delete',
  'this',
])

const DANGEROUS_BRACKET_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
])

/**
 * Pattern for bracket notation property access with strings - checked separately based on config.
 * Only matches bracket notation when preceded by a word char, ), or ] (property access context).
 * Does NOT match array literals like ['a', 'b'] which are preceded by [, :, =, (, or start of expression.
 */
const BRACKET_NOTATION_PATTERN = /[\w)\]]\s*\[\s*['"]/

/**
 * Strip string literals from an expression for safe pattern checking.
 * This prevents false positives when dangerous keywords appear inside strings.
 * e.g., "__proto__" as a string value should be allowed.
 *
 * IMPORTANT: Template literal interpolations (${...}) are preserved because
 * they execute code and must still be checked for dangerous patterns.
 */
function stripStringLiterals(expr: string): string {
  let result = ''
  let inString: string | null = null
  let escaped = false
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true; continue }
    if (inString) {
      // Template literals: preserve ${...} interpolations (they execute code)
      if (inString === '`' && ch === '$' && i + 1 < expr.length && expr[i + 1] === '{') {
        let tplDepth = 1
        i += 2 // skip ${
        while (i < expr.length && tplDepth > 0) {
          if (expr[i] === '{') tplDepth++
          else if (expr[i] === '}') tplDepth--
          if (tplDepth > 0) { result += expr[i]; i++ }
        }
        continue
      }
      if (ch === inString) inString = null
      continue
    }
    if (ch === '"' || ch === '\'' || ch === '`') { inString = ch; continue }
    result += ch
  }
  return result
}

function assertNoUnsafeIdentifierTokens(strippedExpression: string, originalExpression: string): void {
  const identifierRe = /[$A-Z_a-z][$\w]*/g
  let match: RegExpExecArray | null

  while ((match = identifierRe.exec(strippedExpression)) !== null) {
    const identifier = match[0]
    const previous = strippedExpression[match.index - 1]

    if (DANGEROUS_IDENTIFIERS.has(identifier)) {
      throw new Error(`Potentially unsafe expression (matched /\\b${identifier}\\b/; identifier ${identifier}): ${originalExpression}`)
    }

    if (previous === '.' && DANGEROUS_BRACKET_KEYS.has(identifier)) {
      throw new Error(`Potentially unsafe expression (matched /.${identifier}/; property ${identifier}): ${originalExpression}`)
    }
  }
}

function assertSafeBracketLiteralKeys(expression: string): void {
  const bracketLiteralRe = /\[\s*(['"])(.*?)\1\s*\]/g
  let match: RegExpExecArray | null

  while ((match = bracketLiteralRe.exec(expression)) !== null) {
    const key = match[2]
    if (!DANGEROUS_BRACKET_KEYS.has(key))
      continue

    const previousNonSpace = expression.slice(0, match.index).match(/\S(?=\s*$)/)?.[0]
    const nextNonSpace = expression.slice(match.index + match[0].length).match(/^\s*(\S)/)?.[1]
    const isComputedObjectKey = (previousNonSpace === '{' || previousNonSpace === ',') && nextNonSpace === ':'

    if (!isComputedObjectKey) {
      throw new Error(`Potentially unsafe expression (bracket key ${match[2]}): ${expression}`)
    }
  }
}

/**
 * Sanitize an expression by checking for dangerous patterns
 */
export function sanitizeExpression(expression: string): string {
  const trimmed = expression.trim()

  // Strip string literals before checking patterns to avoid false positives
  // e.g., "__proto__" as a string value should be allowed
  const stripped = stripStringLiterals(trimmed)
  assertNoUnsafeIdentifierTokens(stripped, trimmed)
  assertSafeBracketLiteralKeys(trimmed)

  // Check for dangerous patterns on the stripped expression. Including the
  // matched pattern in the error message makes it straightforward for devs
  // to identify WHICH rule rejected their expression instead of guessing —
  // e.g. whether they tripped the `eval` filter or the `__proto__` filter.
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(stripped)) {
      throw new Error(`Potentially unsafe expression (matched /${pattern.source}/): ${trimmed}`)
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
    // Skip internal stx keys (double underscore) and dangerous keys.
    // Single underscore keys like _id, _name are user variables and should be kept.
    if (key.startsWith('__') || DANGEROUS_PATTERNS.some(p => p.test(key))) {
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
  if (depth >= currentConfig.maxSanitizeDepth) {
    return '[Object too deep]'
  }

  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1))
  }

  // Pass through known safe built-in types that lose methods when shallow-copied
  if (obj instanceof Date || obj instanceof RegExp || obj instanceof Map
    || obj instanceof Set || obj instanceof Error) {
    return obj
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip dangerous keys (double-underscore prefix for internal keys, not single-underscore user vars)
    if (key.startsWith('__')
      || key === 'constructor'
      || key === 'prototype') {
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
    const safeContext = createSafeContext(context)
    const keys = Object.keys(safeContext)
    const values = Object.values(safeContext)
    const func = createSafeFunction(expression, keys)

    return func(...values) as T
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

/**
 * Return the reason an expression is unsafe, or `null` if it passes all
 * sanitization checks. Useful for tooling and debugging — lets callers
 * report a structured reason without `try/catch`ing sanitize errors.
 *
 * @example
 * getExpressionSafetyReason('eval(x)') // → 'matched pattern /\\beval\\b/'
 * getExpressionSafetyReason('a + b')   // → null
 */
export function getExpressionSafetyReason(expression: string): string | null {
  try {
    sanitizeExpression(expression)
    return null
  }
  catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

// =============================================================================
// Safe Evaluation Functions
// =============================================================================

/**
 * Safely evaluate an expression and return a boolean result
 * Used for conditional expressions in @if, @unless, etc.
 *
 * @param expression - The condition expression to evaluate
 * @param context - Variables available during evaluation
 * @returns Boolean result, defaults to false on error
 */
export function safeEvaluateCondition(expression: string, context: Record<string, unknown>): boolean {
  try {
    const result = safeEvaluate<unknown>(expression, context)
    return Boolean(result)
  }
  catch {
    return false
  }
}

/**
 * Safely evaluate an expression that returns an array
 * Used for loop iterations in @foreach, @for, etc.
 *
 * @param expression - The array expression to evaluate
 * @param context - Variables available during evaluation
 * @returns Array result, defaults to empty array on error
 */
export function safeEvaluateArray(expression: string, context: Record<string, unknown>): unknown[] {
  try {
    const result = safeEvaluate<unknown>(expression, context)
    if (Array.isArray(result)) {
      return result
    }
    // Handle array-like objects. Length must be a non-negative, finite
    // integer — `Array.from({ length: Infinity })` throws RangeError and
    // `Array.from({ length: NaN })` silently produces an empty-but-wrong
    // array; reject both so callers get a predictable `[]`.
    if (result && typeof result === 'object' && 'length' in result) {
      const len = (result as any).length
      if (typeof len === 'number' && Number.isFinite(len) && len >= 0 && Number.isInteger(len)) {
        return Array.from(result as ArrayLike<unknown>)
      }
    }
    return []
  }
  catch {
    return []
  }
}

/**
 * Safely evaluate an expression that returns an object
 * Used for props, attributes, configuration objects
 *
 * @param expression - The object expression to evaluate
 * @param context - Variables available during evaluation
 * @returns Object result, defaults to empty object on error
 */
export function safeEvaluateObject(expression: string, context: Record<string, unknown>): Record<string, unknown> {
  try {
    const result = safeEvaluate<unknown>(expression, context)
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return result as Record<string, unknown>
    }
    return {}
  }
  catch {
    return {}
  }
}

/**
 * Names that JavaScript rejects as function parameters even when they look
 * like valid identifiers. Built from the spec's reserved word set plus the
 * strict-mode-only reserved words (we always emit `'use strict'` in the
 * generated function body) plus the two names — `arguments` and `eval` —
 * that strict mode forbids in parameter position. Used by createSafeFunction
 * to filter incoming context keys so a single bad name (`class`, `for`,
 * `let`, …) doesn't crash the entire @if / {{ }} / safe-evaluation pipeline.
 */
const RESERVED_PARAM_NAMES = new Set([
  // Reserved words (ES2015+)
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
  'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
  'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
  'typeof', 'var', 'void', 'while', 'with', 'yield',
  // Strict-mode-reserved
  'let', 'static', 'implements', 'interface', 'package', 'private',
  'protected', 'public',
  // Always banned in strict-mode parameter position
  'arguments', 'eval',
  // `await` is reserved inside async functions; we wrap the body in async
  // semantics via try/catch in callers, so be conservative.
  'await',
])

/**
 * Create a sandboxed function that can only access the provided context
 * This is a safer alternative to `new Function()` that validates expressions first
 *
 * @param expression - The expression to compile into a function
 * @param contextKeys - Variable names that will be available
 * @returns A function that takes context values and returns the result
 * @throws Error if expression contains dangerous patterns
 *
 * @example
 * ```typescript
 * const fn = createSafeFunction('x + y', ['x', 'y'])
 * const result = fn(1, 2) // returns 3
 * ```
 */
export function createSafeFunction(expression: string, contextKeys: string[]): (...args: unknown[]) => unknown {
  // Validate the expression first
  const sanitizedExpr = sanitizeExpression(expression)

  // Drop context keys that JS rejects as function-parameter names BEFORE
  // handing them to `new Function(...keys, body)`. Three classes of
  // rejected names:
  //
  //  1. Non-identifiers: `passed-class`, `data-id`, `1bad`, `foo.bar`
  //     ("Unexpected token '-'" / "Unexpected number").
  //  2. Reserved words: `class`, `const`, `function`, `if`, `for`, …
  //     ("Cannot use the keyword 'class' as a parameter name").
  //  3. Strict-mode-reserved words: `let`, `static`, `implements`, …
  //     (we always emit `'use strict'` in the function body).
  //
  // Real templates spread HTML-style attribute names into the evaluator
  // constantly — Vue-/Tailwind-style components use `class`, `style`,
  // `for`, `data-*`, `aria-*`, etc. as prop bag keys. A single offender
  // used to crash every `@if` / `{{ }}` evaluation in the template; this
  // filter makes the evaluator survive whatever the caller spreads in.
  // Dropped keys can't be referenced from the expression anyway — JS has
  // no syntax to read `class` or `passed-class` as identifiers in user
  // code — so dropping is both safe and what callers expect.
  const validIdent = /^[A-Za-z_$][\w$]*$/
  const validIndices: number[] = []
  const filteredKeys: string[] = []
  for (let i = 0; i < contextKeys.length; i++) {
    const key = contextKeys[i]
    if (!validIdent.test(key)) continue
    if (RESERVED_PARAM_NAMES.has(key)) continue
    validIndices.push(i)
    filteredKeys.push(key)
  }

  // Create the function with strict mode
  // eslint-disable-next-line no-new-func
  const func = new Function(...filteredKeys, `
    'use strict';
    try {
      return ${sanitizedExpr};
    }
catch (e) {
      if (e instanceof ReferenceError || e instanceof TypeError) {
        return undefined;
      }
      throw e;
    }
  `)

  // Fast path when nothing was filtered: skip the value-projection pass.
  if (filteredKeys.length === contextKeys.length) {
    // eslint-disable-next-line pickier/no-unused-vars
    return func as (...args: unknown[]) => unknown
  }

  // Project the caller's values down to the columns that survived the
  // identifier filter. Callers pass values positionally aligned with the
  // ORIGINAL contextKeys, so we read each surviving slot and forward it.
  return ((...args: unknown[]) => {
    const projected = new Array(validIndices.length)
    for (let i = 0; i < validIndices.length; i++) projected[i] = args[validIndices[i]]
    return func(...projected)
  }) as (...args: unknown[]) => unknown
}

/**
 * Safely evaluate a return expression (e.g., "return x + y")
 * Used for script block execution
 *
 * @param code - Code that may contain return statements
 * @param context - Variables available during evaluation
 * @returns The result of the code execution
 */
// Maximum characters accepted by `safeEvaluateCode`. At ~64KB of inline
// template code you're almost certainly looking at minified output or
// adversarial input; the pattern-scan step would otherwise pay linear cost
// per regex on pathological input. Apps that legitimately need longer
// inline code can call the lower-level evaluators directly.
const MAX_SAFE_EVAL_CODE_LENGTH = 64 * 1024

export function safeEvaluateCode(code: string, context: Record<string, unknown>): unknown {
  try {
    if (typeof code !== 'string') return undefined
    if (code.length > MAX_SAFE_EVAL_CODE_LENGTH) {
      // Silent failure via the outer try/catch, but make the reason visible
      // in debug logs so developers with huge inline blocks aren't left
      // guessing why their directive went dark.
      throw new Error(`safeEvaluateCode: input exceeds ${MAX_SAFE_EVAL_CODE_LENGTH} chars`)
    }

    // Check for dangerous patterns in the full code
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        throw new Error(`Potentially unsafe code detected`)
      }
    }

    const safeContext = createSafeContext(context)
    const keys = Object.keys(safeContext)
    const values = Object.values(safeContext)

    // eslint-disable-next-line no-new-func
    const func = new Function(...keys, `
      'use strict';
      ${code}
    `)

    return func(...values)
  }
  catch {
    return undefined
  }
}

/**
 * Validate a for loop expression for safety
 * Checks for dangerous patterns like eval, Function, import, etc.
 *
 * @param expression - The for loop expression (e.g., "let i = 0; i < n; i++")
 * @returns true if safe, false if potentially dangerous
 */
export function isForExpressionSafe(expression: string): boolean {
  const trimmed = expression.trim()

  // Check for dangerous patterns
  const forDangerousPatterns = [
    /\beval\s*\(/i,
    /\bFunction\s*\(/i,
    /\bimport\s*\(/i,
    /\brequire\s*\(/i,
    /\bprocess\b/i,
    /\b__proto__\b/i,
    /\bconstructor\s*[.(]/i,
    /\bglobalThis\b/i,
    /\bwindow\b/i,
    /\bdocument\b/i,
    /\bfetch\s*\(/i,
    /\bBun\b/i,
    /\bDeno\b/i,
    /\bconsole\b/i,
    /\bthis\b/i,
    /\bReflect\b/i,
    /\bProxy\b/i,
    /\bprototype\b/i,
    /\.(bind|call|apply)\s*\(/i,
  ]

  for (const pattern of forDangerousPatterns) {
    if (pattern.test(trimmed)) {
      return false
    }
  }

  return true
}

/**
 * Create a safe loop function with iteration limits
 *
 * @param loopType - 'for' or 'while'
 * @param expression - The loop expression or condition
 * @param body - The loop body template
 * @param contextKeys - Variable names available in context
 * @param maxIterations - Maximum iterations allowed (for while loops)
 * @returns A function that executes the loop safely
 */
export function createSafeLoopFunction(
  loopType: 'for' | 'while',
  expression: string,
  body: string,
  contextKeys: string[],
  maxIterations: number = 1000,
): (...args: unknown[]) => string {
  // Validate the expression
  if (!isForExpressionSafe(expression)) {
    throw new Error(`Unsafe expression in @${loopType}: ${expression}`)
  }

  // Process the body to escape template literals and prevent injection via ${} sequences
  const processedBody = body.replace(/`/g, '\\`').replace(/\$\{/g, '\\${').replace(/\{\{([^}]+)\}\}/g, (_match: string, expr: string) => {
    return `\${${expr}}`
  })

  if (loopType === 'for') {
    // eslint-disable-next-line no-new-func
    return new Function(...contextKeys, `
      'use strict';
      let result = '';
      for (${expression}) {
        result += \`${processedBody}\`;
      }
      return result;
    // eslint-disable-next-line pickier/no-unused-vars
    `) as (...args: unknown[]) => string
  }
  else {
    // while loop with safety limit
    // eslint-disable-next-line no-new-func
    return new Function(...contextKeys, `
      'use strict';
      let result = '';
      let __safeCounter = 0;
      const __maxIterations = ${maxIterations};
      while (${expression} && __safeCounter < __maxIterations) {
        __safeCounter++;
        result += \`${processedBody}\`;
      }
      // Surface the truncation both inline (for end users) and via
      // console.warn (for developers running \`stx dev\`). A silent cut-off
      // made pages render half a list with no breadcrumb.
      if (__safeCounter >= __maxIterations) {
        result += '<!-- [Loop Error]: Maximum iterations exceeded -->';
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('[stx] @while loop hit max iterations (' + __maxIterations + '); template output was truncated. Raise via createSafeForLoop(..., maxIterations) if intentional.');
        }
      }
      return result;
    // eslint-disable-next-line pickier/no-unused-vars
    `) as (...args: unknown[]) => string
  }
}
