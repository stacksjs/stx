import path from 'node:path'
import process from 'node:process'

// =============================================================================
// Error Codes
// =============================================================================

/**
 * Numeric error codes for programmatic error handling
 *
 * Error code ranges:
 * - 1000-1099: Syntax errors
 * - 1100-1199: Runtime errors
 * - 1200-1299: Security errors
 * - 1300-1399: File errors
 * - 1400-1499: Configuration errors
 * - 1500-1599: Component errors
 * - 1600-1699: Expression errors
 */
export const ErrorCodes = {
  // Syntax errors (1000-1099)
  UNCLOSED_DIRECTIVE: 1001,
  UNCLOSED_EXPRESSION: 1002,
  INVALID_DIRECTIVE_SYNTAX: 1003,
  MALFORMED_EXPRESSION: 1004,
  UNEXPECTED_TOKEN: 1005,

  // Runtime errors (1100-1199)
  UNDEFINED_VARIABLE: 1101,
  TYPE_ERROR: 1102,
  EVALUATION_ERROR: 1103,
  INFINITE_LOOP: 1104,
  CIRCULAR_REFERENCE: 1105,

  // Security errors (1200-1299)
  UNSAFE_EXPRESSION: 1201,
  PATH_TRAVERSAL: 1202,
  XSS_ATTEMPT: 1203,
  CODE_INJECTION: 1204,

  // File errors (1300-1399)
  FILE_NOT_FOUND: 1301,
  FILE_READ_ERROR: 1302,
  INVALID_FILE_PATH: 1303,
  PERMISSION_DENIED: 1304,

  // Configuration errors (1400-1499)
  INVALID_CONFIG: 1401,
  MISSING_REQUIRED_CONFIG: 1402,
  DEPRECATED_CONFIG: 1403,

  // Component errors (1500-1599)
  COMPONENT_NOT_FOUND: 1501,
  INVALID_PROPS: 1502,
  COMPONENT_RENDER_ERROR: 1503,

  // Expression errors (1600-1699)
  FILTER_NOT_FOUND: 1601,
  INVALID_FILTER_ARGS: 1602,
  EXPRESSION_TIMEOUT: 1603,
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Get error code name from numeric code
 */
export function getErrorCodeName(code: number): string | undefined {
  for (const [name, value] of Object.entries(ErrorCodes)) {
    if (value === code)
      return name
  }
  return undefined
}

// =============================================================================
// Error Configuration
// =============================================================================

/**
 * Error handling configuration
 */
export interface ErrorConfig {
  /** Show relative paths instead of absolute (default: false) */
  showRelativePaths: boolean
  /** Base directory for relative path calculation */
  baseDir?: string
  /** Enable auto-recovery for common syntax errors (default: false in production) */
  enableAutoRecovery: boolean
  /** Log warnings when auto-recovery is applied */
  logRecoveryWarnings: boolean
}

const defaultErrorConfig: ErrorConfig = {
  showRelativePaths: false,
  enableAutoRecovery: process.env.NODE_ENV === 'development',
  logRecoveryWarnings: true,
}

let currentErrorConfig: ErrorConfig = { ...defaultErrorConfig }

/**
 * Configure error handling behavior
 */
export function configureErrorHandling(config: Partial<ErrorConfig>): void {
  currentErrorConfig = { ...currentErrorConfig, ...config }
}

/**
 * Get current error configuration
 */
export function getErrorConfig(): ErrorConfig {
  return { ...currentErrorConfig }
}

/**
 * Reset error configuration to defaults
 */
export function resetErrorConfig(): void {
  currentErrorConfig = { ...defaultErrorConfig }
}

/**
 * Format file path based on configuration
 */
function formatFilePath(filePath: string): string {
  if (!currentErrorConfig.showRelativePaths || !filePath) {
    return filePath
  }

  const baseDir = currentErrorConfig.baseDir || process.cwd()
  try {
    const relativePath = path.relative(baseDir, filePath)
    // Only use relative path if it doesn't start with ..
    return relativePath.startsWith('..') ? filePath : relativePath
  }
  catch {
    return filePath
  }
}

// =============================================================================
// Error Classes
// =============================================================================

/**
 * Custom error types for better error classification
 */
export class StxError extends Error {
  /** Numeric error code for programmatic handling */
  public numericCode: ErrorCode

  constructor(
    message: string,
    public code: string,
    public filePath?: string,
    public line?: number,
    public column?: number,
    public context?: string,
    numericCode?: ErrorCode,
  ) {
    super(message)
    this.name = 'StxError'
    this.numericCode = numericCode || 1100 // Default to generic runtime error
    // Format file path based on configuration
    if (this.filePath) {
      this.filePath = formatFilePath(this.filePath)
    }
  }
}

export class StxSyntaxError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string, numericCode?: ErrorCode) {
    super(message, 'stx_SYNTAX_ERROR', filePath, line, column, context, numericCode || ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
    this.name = 'StxSyntaxError'
  }
}

export class StxRuntimeError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string, numericCode?: ErrorCode) {
    super(message, 'stx_RUNTIME_ERROR', filePath, line, column, context, numericCode || ErrorCodes.EVALUATION_ERROR)
    this.name = 'StxRuntimeError'
  }
}

export class StxSecurityError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string, numericCode?: ErrorCode) {
    super(message, 'stx_SECURITY_ERROR', filePath, line, column, context, numericCode || ErrorCodes.UNSAFE_EXPRESSION)
    this.name = 'StxSecurityError'
  }
}

export class StxFileError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string, numericCode?: ErrorCode) {
    super(message, 'stx_FILE_ERROR', filePath, line, column, context, numericCode || ErrorCodes.FILE_NOT_FOUND)
    this.name = 'StxFileError'
  }
}

/**
 * Error context information
 */
export interface ErrorContext {
  filePath: string
  template: string
  offset: number
  match: string
}

// =============================================================================
// Standardized Error Formatting
// =============================================================================

/**
 * Error output format options
 */
export type ErrorOutputFormat = 'html' | 'text' | 'json' | 'console'

/**
 * Standardized error message options
 */
export interface ErrorMessageOptions {
  /** Error type/category (e.g., 'Directive', 'Expression', 'Syntax') */
  type: string
  /** The error message */
  message: string
  /** Numeric error code */
  code?: ErrorCode
  /** File path where error occurred */
  filePath?: string
  /** Line number */
  line?: number
  /** Column number */
  column?: number
  /** Template content for context */
  template?: string
  /** Position offset in template */
  offset?: number
  /** The problematic code snippet */
  snippet?: string
  /** Suggestion for fixing the error */
  suggestion?: string
  /** Output format */
  format?: ErrorOutputFormat
}

/**
 * Standardized error message result
 */
export interface StandardizedError {
  /** Formatted error message for display */
  formatted: string
  /** Raw error data */
  data: {
    type: string
    code: number | undefined
    codeName: string | undefined
    message: string
    filePath: string | undefined
    line: number | undefined
    column: number | undefined
    snippet: string | undefined
    suggestion: string | undefined
    timestamp: string
  }
}

/**
 * Create a standardized error message in any format
 *
 * This is the primary function for creating consistent error messages across
 * the entire codebase. Use this instead of ad-hoc error string formatting.
 *
 * @example
 * ```typescript
 * // For directive errors
 * const error = formatError({
 *   type: 'Directive',
 *   message: 'Unknown directive @foo',
 *   code: ErrorCodes.INVALID_DIRECTIVE_SYNTAX,
 *   filePath: 'template.stx',
 *   line: 10,
 *   format: 'html'
 * })
 *
 * // For expression errors
 * const error = formatError({
 *   type: 'Expression',
 *   message: 'Cannot read property "name" of undefined',
 *   code: ErrorCodes.UNDEFINED_VARIABLE,
 *   template: templateContent,
 *   offset: 150,
 *   format: 'console'
 * })
 * ```
 */
export function formatError(options: ErrorMessageOptions): StandardizedError {
  const {
    type,
    message,
    code,
    filePath,
    line,
    column,
    template,
    offset,
    snippet,
    suggestion,
    format = 'text',
  } = options

  // Calculate line/column from offset if not provided
  let actualLine = line
  let actualColumn = column
  if (!actualLine && template && offset !== undefined) {
    const position = getLineAndColumn(template, offset)
    actualLine = position.line
    actualColumn = position.column
  }

  // Format file path based on configuration
  const displayPath = filePath ? formatFilePath(filePath) : undefined

  // Get code name
  const codeName = code ? getErrorCodeName(code) : undefined

  // Build raw data
  const data = {
    type,
    code,
    codeName,
    message,
    filePath: displayPath,
    line: actualLine,
    column: actualColumn,
    snippet,
    suggestion,
    timestamp: new Date().toISOString(),
  }

  // Format based on output type
  let formatted: string

  switch (format) {
    case 'html':
      formatted = formatErrorAsHtml(data, template, offset)
      break
    case 'json':
      formatted = JSON.stringify(data, null, 2)
      break
    case 'console':
      formatted = formatErrorAsConsole(data, template, offset)
      break
    case 'text':
    default:
      formatted = formatErrorAsText(data, template, offset)
      break
  }

  return { formatted, data }
}

/**
 * Format error as plain text
 */
function formatErrorAsText(
  data: StandardizedError['data'],
  template?: string,
  offset?: number,
): string {
  const parts: string[] = []

  // Header
  const codeStr = data.code ? ` [${data.codeName || data.code}]` : ''
  parts.push(`[${data.type} Error${codeStr}]`)

  // Location
  if (data.filePath) {
    let location = data.filePath
    if (data.line) {
      location += `:${data.line}`
      if (data.column) {
        location += `:${data.column}`
      }
    }
    parts.push(`at ${location}`)
  }

  // Message
  parts.push(`\n${data.message}`)

  // Context from template
  if (template && offset !== undefined && data.line) {
    const contextLines = getContextLines(template, data.line, 2)
    if (contextLines) {
      parts.push(`\n${contextLines}`)
    }
  }

  // Snippet
  if (data.snippet) {
    parts.push(`\nSnippet: ${data.snippet}`)
  }

  // Suggestion
  if (data.suggestion) {
    parts.push(`\nSuggestion: ${data.suggestion}`)
  }

  return parts.join(' ')
}

/**
 * Format error as HTML comment (for template output)
 */
function formatErrorAsHtml(
  data: StandardizedError['data'],
  _template?: string,
  _offset?: number,
): string {
  const codeStr = data.code ? ` [${data.code}]` : ''
  const locationStr = data.filePath
    ? ` in ${data.filePath}${data.line ? `:${data.line}` : ''}`
    : ''

  let html = `<!-- [${data.type} Error${codeStr}]${locationStr}: ${escapeHtmlComment(data.message)}`

  if (data.suggestion) {
    html += ` | Suggestion: ${escapeHtmlComment(data.suggestion)}`
  }

  html += ' -->'
  return html
}

/**
 * Format error for console output with colors
 */
function formatErrorAsConsole(
  data: StandardizedError['data'],
  template?: string,
  offset?: number,
): string {
  const red = '\x1B[31m'
  const yellow = '\x1B[33m'
  const cyan = '\x1B[36m'
  const gray = '\x1B[90m'
  const bold = '\x1B[1m'
  const reset = '\x1B[0m'

  const parts: string[] = []

  // Header with box
  const codeStr = data.code ? ` [${data.codeName || data.code}]` : ''
  parts.push(`${bold}${red}━━━ ${data.type} Error${codeStr} ━━━${reset}`)

  // Location
  if (data.filePath) {
    let location = `${cyan}${data.filePath}${reset}`
    if (data.line) {
      location += `${gray}:${data.line}${reset}`
      if (data.column) {
        location += `${gray}:${data.column}${reset}`
      }
    }
    parts.push(`\n${gray}at${reset} ${location}`)
  }

  // Message
  parts.push(`\n\n${data.message}`)

  // Context from template
  if (template && offset !== undefined && data.line) {
    const contextLines = getContextLinesColored(template, data.line, 2)
    if (contextLines) {
      parts.push(`\n\n${gray}Context:${reset}\n${contextLines}`)
    }
  }

  // Suggestion
  if (data.suggestion) {
    parts.push(`\n\n${yellow}Suggestion:${reset} ${data.suggestion}`)
  }

  parts.push(`\n${red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`)

  return parts.join('')
}

/**
 * Get context lines around error location
 */
function getContextLines(template: string, errorLine: number, contextSize: number): string {
  const lines = template.split('\n')
  const startLine = Math.max(0, errorLine - contextSize - 1)
  const endLine = Math.min(lines.length - 1, errorLine + contextSize - 1)

  const result: string[] = []
  for (let i = startLine; i <= endLine; i++) {
    const lineNum = (i + 1).toString().padStart(4)
    const indicator = i === errorLine - 1 ? '>' : ' '
    result.push(`${indicator}${lineNum} | ${lines[i]}`)
  }

  return result.join('\n')
}

/**
 * Get context lines with color highlighting
 */
function getContextLinesColored(template: string, errorLine: number, contextSize: number): string {
  const lines = template.split('\n')
  const startLine = Math.max(0, errorLine - contextSize - 1)
  const endLine = Math.min(lines.length - 1, errorLine + contextSize - 1)

  const gray = '\x1B[90m'
  const red = '\x1B[31m'
  const reset = '\x1B[0m'

  const result: string[] = []
  for (let i = startLine; i <= endLine; i++) {
    const lineNum = (i + 1).toString().padStart(4)
    const isErrorLine = i === errorLine - 1
    const indicator = isErrorLine ? `${red}>${reset}` : ' '
    const lineContent = isErrorLine ? `${red}${lines[i]}${reset}` : `${gray}${lines[i]}${reset}`
    result.push(`${indicator}${gray}${lineNum}${reset} | ${lineContent}`)
  }

  return result.join('\n')
}

/**
 * Escape content for use in HTML comments
 */
function escapeHtmlComment(str: string): string {
  return str.replace(/--/g, '- -').replace(/>/g, '&gt;')
}

/**
 * Quick helper for creating inline error messages (for template output)
 *
 * @example
 * ```typescript
 * return inlineError('Directive', 'Unknown directive @foo')
 * // Returns: <!-- [Directive Error]: Unknown directive @foo -->
 * ```
 */
export function inlineError(type: string, message: string, code?: ErrorCode): string {
  return formatError({ type, message, code, format: 'html' }).formatted
}

/**
 * Quick helper for creating console error messages
 *
 * @example
 * ```typescript
 * console.error(consoleError('Syntax', 'Missing closing bracket', filePath, line))
 * ```
 */
export function consoleError(
  type: string,
  message: string,
  filePath?: string,
  line?: number,
  code?: ErrorCode,
): string {
  return formatError({ type, message, code, filePath, line, format: 'console' }).formatted
}

/**
 * Enhanced error reporting with better context
 */
export function createEnhancedError(
  type: string,
  message: string,
  context: ErrorContext,
): string {
  const lines = context.template.split('\n')
  const position = getLineAndColumn(context.template, context.offset)

  let errorOutput = `[${type} Error at line ${position.line} in ${context.filePath}]: ${message}\n\n`

  // Add context lines
  const startLine = Math.max(0, position.line - 3)
  const endLine = Math.min(lines.length - 1, position.line + 2)

  errorOutput += 'Context:\n'
  for (let i = startLine; i <= endLine; i++) {
    const lineNum = i + 1
    const line = lines[i] || ''
    const indicator = i === position.line - 1 ? '>' : ' '
    errorOutput += `${indicator} ${lineNum.toString().padStart(3)}: ${line}\n`
  }

  // Add pointer to exact location
  if (position.line - 1 < lines.length) {
    const padding = ' '.repeat(position.column + 5) // Account for line number
    errorOutput += `${padding}^\n`
  }

  return errorOutput
}

/**
 * Get line and column number from string offset
 */
function getLineAndColumn(text: string, offset: number): { line: number, column: number } {
  const beforeOffset = text.substring(0, offset)
  const lines = beforeOffset.split('\n')

  return {
    line: lines.length,
    column: lines[lines.length - 1].length,
  }
}

/**
 * Safe wrapper for potentially dangerous operations
 */
export function safeExecute<T>(
  operation: () => T,
  fallback: T,
  errorHandler?: (error: Error) => void,
): T {
  try {
    return operation()
  }
  catch (error) {
    if (errorHandler && error instanceof Error) {
      errorHandler(error)
    }
    return fallback
  }
}

/**
 * Async version of safe wrapper
 */
export async function safeExecuteAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorHandler?: (error: Error) => void,
): Promise<T> {
  try {
    return await operation()
  }
  catch (error) {
    if (errorHandler && error instanceof Error) {
      errorHandler(error)
    }
    return fallback
  }
}

/**
 * Validation utilities
 */
export const validators = {
  /**
   * Validate file path is safe and doesn't escape the allowed directory
   * @param filePath - The file path to validate
   * @param allowedDir - Optional allowed directory (defaults to cwd)
   * @returns true if the path is safe
   */
  isValidFilePath(filePath: string, allowedDir?: string): boolean {
    // Normalize the path to handle different separators
    const normalizedPath = filePath.replace(/\\/g, '/')

    // Check for null bytes (can bypass security checks)
    if (normalizedPath.includes('\0')) {
      return false
    }

    // Check for path traversal attempts in various forms
    if (normalizedPath.includes('../')
      || normalizedPath.includes('..\\')
      || normalizedPath === '..'
      || normalizedPath.startsWith('../')
      || normalizedPath.endsWith('/..')
      || normalizedPath.includes('/..\\')
      || normalizedPath.includes('\\../')
    ) {
      return false
    }

    // Check for protocol handlers that could be exploited
    const protocolPattern = /^[a-z][a-z0-9+.-]*:/i
    if (protocolPattern.test(normalizedPath)) {
      return false
    }

    // If allowedDir is provided, validate the resolved path is within it
    if (allowedDir) {
      const resolvedPath = path.resolve(allowedDir, filePath)
      const normalizedAllowedDir = path.resolve(allowedDir)

      // Ensure the resolved path starts with the allowed directory
      if (!resolvedPath.startsWith(normalizedAllowedDir + path.sep)
        && resolvedPath !== normalizedAllowedDir) {
        return false
      }
    }

    return true
  },

  /**
   * Validate template variable name
   */
  isValidVariableName(name: string): boolean {
    // Must be valid JavaScript identifier
    return /^[a-z_$][\w$]*$/i.test(name)
  },

  /**
   * Validate directive name
   */
  isValidDirectiveName(name: string): boolean {
    // Must be alphanumeric with optional hyphens/underscores
    return /^[a-z][\w-]*$/i.test(name)
  },

  /**
   * Check if string contains potentially malicious content
   */
  isSafeContent(content: string): boolean {
    const dangerousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi, // Event handlers
    ]

    return !dangerousPatterns.some(pattern => pattern.test(content))
  },
}

// =============================================================================
// Directive Parameter Sanitization
// =============================================================================

/**
 * Options for parameter sanitization
 */
export interface SanitizeOptions {
  /** Allow HTML in parameter values (default: false) */
  allowHtml?: boolean
  /** Maximum length for string parameters (default: 10000) */
  maxLength?: number
  /** Allow special characters (default: true for most, false for paths) */
  allowSpecialChars?: boolean
  /** Custom sanitization function */
  customSanitizer?: (value: string) => string
}

/**
 * Result of parameter sanitization
 */
export interface SanitizedParam {
  /** Sanitized value */
  value: string
  /** Whether the value was modified */
  modified: boolean
  /** Warnings generated during sanitization */
  warnings: string[]
}

/**
 * Sanitize a directive parameter value
 *
 * @param param - The parameter to sanitize
 * @param options - Sanitization options
 * @returns Sanitized parameter with metadata
 *
 * @example
 * ```typescript
 * const result = sanitizeDirectiveParam('<script>alert(1)</script>')
 * // result.value = '&lt;script&gt;alert(1)&lt;/script&gt;'
 * // result.modified = true
 * // result.warnings = ['HTML content was escaped']
 * ```
 */
export function sanitizeDirectiveParam(param: string, options: SanitizeOptions = {}): SanitizedParam {
  const {
    allowHtml = false,
    maxLength = 10000,
    allowSpecialChars = true,
    customSanitizer,
  } = options

  const warnings: string[] = []
  let value = param
  let modified = false

  // Apply custom sanitizer first if provided
  if (customSanitizer) {
    const customResult = customSanitizer(value)
    if (customResult !== value) {
      value = customResult
      modified = true
    }
  }

  // Check for null bytes
  if (value.includes('\0')) {
    value = value.replace(/\0/g, '')
    modified = true
    warnings.push('Null bytes removed from parameter')
  }

  // Truncate if too long
  if (value.length > maxLength) {
    value = value.substring(0, maxLength)
    modified = true
    warnings.push(`Parameter truncated to ${maxLength} characters`)
  }

  // Escape HTML if not allowed
  if (!allowHtml && /<[^>]+>/.test(value)) {
    value = escapeHtml(value)
    modified = true
    warnings.push('HTML content was escaped')
  }

  // Remove dangerous patterns
  const dangerousPatterns = [
    { pattern: /javascript:/gi, replacement: '', name: 'javascript: URI' },
    { pattern: /vbscript:/gi, replacement: '', name: 'vbscript: URI' },
    { pattern: /data:text\/html/gi, replacement: '', name: 'data:text/html URI' },
  ]

  for (const { pattern, replacement, name } of dangerousPatterns) {
    if (pattern.test(value)) {
      value = value.replace(pattern, replacement)
      modified = true
      warnings.push(`Removed ${name} from parameter`)
    }
  }

  // Remove special characters if not allowed
  if (!allowSpecialChars) {
    const originalValue = value
    // Remove ASCII control characters (0x00-0x1F and 0x7F)
    // Using character code range instead of hex escapes to avoid lint issues
    value = value.split('').filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 0x20 && code !== 0x7F
    }).join('')
    if (value !== originalValue) {
      modified = true
      warnings.push('Control characters removed')
    }
  }

  return { value, modified, warnings }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }
  return str.replace(/[&<>"']/g, char => htmlEntities[char] || char)
}

/**
 * Sanitize a file path parameter
 *
 * @param filePath - The file path to sanitize
 * @param baseDir - Optional base directory to restrict paths to
 * @returns Sanitized path or null if path is invalid
 */
export function sanitizeFilePath(filePath: string, baseDir?: string): string | null {
  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '')

  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/')

  // Remove protocol handlers
  sanitized = sanitized.replace(/^[a-z][a-z0-9+.-]*:/i, '')

  // Remove path traversal attempts
  while (sanitized.includes('../') || sanitized.includes('./')) {
    sanitized = sanitized.replace(/\.\.\//g, '').replace(/\.\//g, '')
  }

  // Validate the path is safe
  if (!validators.isValidFilePath(sanitized, baseDir)) {
    return null
  }

  return sanitized
}

/**
 * Sanitize an expression parameter (used in @if, @foreach, etc.)
 *
 * @param expr - The expression to sanitize
 * @returns Sanitized expression with metadata
 */
export function sanitizeExpression(expr: string): SanitizedParam {
  const warnings: string[] = []
  let value = expr.trim()
  let modified = value !== expr

  // Remove potentially dangerous patterns in expressions
  const dangerousExprPatterns = [
    { pattern: /\beval\s*\(/gi, name: 'eval()' },
    { pattern: /\bFunction\s*\(/gi, name: 'Function()' },
    { pattern: /\bsetTimeout\s*\(/gi, name: 'setTimeout()' },
    { pattern: /\bsetInterval\s*\(/gi, name: 'setInterval()' },
    { pattern: /\bimport\s*\(/gi, name: 'dynamic import()' },
    { pattern: /\brequire\s*\(/gi, name: 'require()' },
    { pattern: /\b__proto__\b/gi, name: '__proto__' },
    { pattern: /\bconstructor\b/gi, name: 'constructor' },
    { pattern: /\bprototype\b/gi, name: 'prototype' },
  ]

  for (const { pattern, name } of dangerousExprPatterns) {
    if (pattern.test(value)) {
      warnings.push(`Potentially dangerous pattern detected: ${name}`)
      // Don't remove, just warn - these might be legitimate in some contexts
    }
  }

  // Remove null bytes
  if (value.includes('\0')) {
    value = value.replace(/\0/g, '')
    modified = true
    warnings.push('Null bytes removed from expression')
  }

  return { value, modified, warnings }
}

/**
 * Sanitize multiple directive parameters at once
 *
 * @param params - Array of parameters to sanitize
 * @param options - Sanitization options for all parameters
 * @returns Array of sanitized parameters
 */
export function sanitizeDirectiveParams(params: string[], options: SanitizeOptions = {}): SanitizedParam[] {
  return params.map(param => sanitizeDirectiveParam(param, options))
}

/**
 * Validate and sanitize component props
 *
 * @param props - Props object to sanitize
 * @returns Sanitized props with any dangerous values escaped
 */
export function sanitizeComponentProps(props: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(props)) {
    // Validate key is a valid identifier
    if (!validators.isValidVariableName(key)) {
      continue // Skip invalid keys
    }

    // Sanitize based on value type
    if (typeof value === 'string') {
      const result = sanitizeDirectiveParam(value)
      sanitized[key] = result.value
    }
    else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeDirectiveParam(item).value : item,
      )
    }
    else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeComponentProps(value)
    }
    else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Error recovery strategies
 *
 * NOTE: Auto-recovery is opt-in via configuration.
 * Use configureErrorHandling({ enableAutoRecovery: true }) to enable.
 * Recovery attempts are logged as warnings when logRecoveryWarnings is true.
 */
export const errorRecovery = {
  /**
   * Check if auto-recovery is enabled
   */
  isEnabled(): boolean {
    return currentErrorConfig.enableAutoRecovery
  },

  /**
   * Attempt to fix common template syntax errors
   *
   * WARNING: This can mask real issues. Only use in development.
   * Enable via configureErrorHandling({ enableAutoRecovery: true })
   *
   * @returns Object with fixed template and list of applied fixes
   */
  fixCommonSyntaxErrors(template: string): { fixed: string, fixes: string[] } {
    // Return unchanged if recovery is disabled
    if (!currentErrorConfig.enableAutoRecovery) {
      return { fixed: template, fixes: [] }
    }

    let fixed = template
    const fixes: string[] = []

    // Fix unmatched braces
    const openBraces = (fixed.match(/\{\{/g) || []).length
    const closeBraces = (fixed.match(/\}\}/g) || []).length

    if (openBraces > closeBraces) {
      const missing = openBraces - closeBraces
      fixed += '}}'.repeat(missing)
      fixes.push(`Added ${missing} missing closing braces '}}'`)
    }

    // Fix unclosed directives (basic attempt)
    const unclosedDirectives = ['if', 'foreach', 'for', 'switch', 'section']
    for (const directive of unclosedDirectives) {
      const openCount = (fixed.match(new RegExp(`@${directive}\\b`, 'g')) || []).length
      const closeCount = (fixed.match(new RegExp(`@end${directive}\\b`, 'g')) || []).length

      if (openCount > closeCount) {
        const missing = openCount - closeCount
        for (let i = 0; i < missing; i++) {
          fixed += `\n@end${directive}`
        }
        fixes.push(`Added ${missing} missing @end${directive}`)
      }
    }

    // Log warnings if fixes were applied
    if (fixes.length > 0 && currentErrorConfig.logRecoveryWarnings) {
      console.warn('[stx] Auto-recovery applied fixes:')
      fixes.forEach(fix => console.warn(`  - ${fix}`))
      console.warn('  Consider fixing these issues in your template.')
    }

    return { fixed, fixes }
  },

  /**
   * Create fallback content for failed template sections
   */
  createFallbackContent(sectionType: string, error: Error): string {
    return `<!-- ${sectionType} failed: ${error.message} -->`
  },
}

/**
 * Error logger configuration options
 */
export interface ErrorLoggerOptions {
  /** Maximum number of errors to keep in memory (default: 1000) */
  maxErrors?: number
  /** Enable file logging */
  enableFileLogging?: boolean
  /** Path to log file (default: '.stx/errors.log') */
  logFilePath?: string
  /** Log format: 'json' for structured logs, 'text' for human-readable (default: 'json') */
  logFormat?: 'json' | 'text'
  /** Maximum log file size in bytes before rotation (default: 10MB) */
  maxFileSize?: number
  /** Number of rotated log files to keep (default: 5) */
  maxLogFiles?: number
  /** Minimum error level to log to file: 'all', 'error', 'warning' (default: 'all') */
  minLevel?: 'all' | 'error' | 'warning'
}

/**
 * Error log entry structure
 */
export interface ErrorLogEntry {
  timestamp: Date
  error: Error
  context?: any
  level?: 'error' | 'warning' | 'info'
}

/**
 * Error logging and monitoring with optional file persistence
 */
export class ErrorLogger {
  private errors: ErrorLogEntry[] = []
  private maxErrors: number
  private enableFileLogging: boolean
  private logFilePath: string
  private logFormat: 'json' | 'text'
  private maxFileSize: number
  private maxLogFiles: number
  private minLevel: 'all' | 'error' | 'warning'
  private writeQueue: Promise<void> = Promise.resolve()

  constructor(options: ErrorLoggerOptions = {}) {
    this.maxErrors = options.maxErrors ?? 1000
    this.enableFileLogging = options.enableFileLogging ?? false
    this.logFilePath = options.logFilePath ?? '.stx/errors.log'
    this.logFormat = options.logFormat ?? 'json'
    this.maxFileSize = options.maxFileSize ?? 10 * 1024 * 1024 // 10MB
    this.maxLogFiles = options.maxLogFiles ?? 5
    this.minLevel = options.minLevel ?? 'all'
  }

  /**
   * Configure the error logger
   */
  configure(options: ErrorLoggerOptions): void {
    if (options.maxErrors !== undefined)
      this.maxErrors = options.maxErrors
    if (options.enableFileLogging !== undefined)
      this.enableFileLogging = options.enableFileLogging
    if (options.logFilePath !== undefined)
      this.logFilePath = options.logFilePath
    if (options.logFormat !== undefined)
      this.logFormat = options.logFormat
    if (options.maxFileSize !== undefined)
      this.maxFileSize = options.maxFileSize
    if (options.maxLogFiles !== undefined)
      this.maxLogFiles = options.maxLogFiles
    if (options.minLevel !== undefined)
      this.minLevel = options.minLevel
  }

  /**
   * Log an error with optional context
   */
  log(error: Error, context?: any, level: 'error' | 'warning' | 'info' = 'error'): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      error,
      context,
      level,
    }

    this.errors.push(entry)

    // Keep only recent errors in memory
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Write to file if enabled
    if (this.enableFileLogging && this.shouldLog(level)) {
      this.writeToFile(entry)
    }
  }

  /**
   * Check if error level should be logged based on minLevel setting
   */
  private shouldLog(level: 'error' | 'warning' | 'info'): boolean {
    if (this.minLevel === 'all')
      return true
    if (this.minLevel === 'warning')
      return level === 'error' || level === 'warning'
    if (this.minLevel === 'error')
      return level === 'error'
    return true
  }

  /**
   * Format an error entry for logging
   */
  private formatEntry(entry: ErrorLogEntry): string {
    if (this.logFormat === 'json') {
      return JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: entry.level || 'error',
        type: entry.error.constructor.name,
        message: entry.error.message,
        stack: entry.error.stack,
        context: entry.context,
      })
    }

    // Text format
    const lines = [
      `[${entry.timestamp.toISOString()}] [${(entry.level || 'error').toUpperCase()}] ${entry.error.constructor.name}: ${entry.error.message}`,
    ]
    if (entry.error.stack) {
      lines.push(`  Stack: ${entry.error.stack.split('\n').slice(1).join('\n  ')}`)
    }
    if (entry.context) {
      lines.push(`  Context: ${JSON.stringify(entry.context)}`)
    }
    return lines.join('\n')
  }

  /**
   * Write error entry to file (async, non-blocking)
   */
  private writeToFile(entry: ErrorLogEntry): void {
    // Queue writes to avoid race conditions
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        const fs = await import('node:fs')
        const path = await import('node:path')

        // Ensure directory exists
        const dir = path.dirname(this.logFilePath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        // Check file size and rotate if needed
        await this.rotateIfNeeded(fs, path)

        // Append to log file
        const logLine = `${this.formatEntry(entry)}\n`
        fs.appendFileSync(this.logFilePath, logLine, 'utf-8')
      }
      catch (err) {
        // Silently fail - don't let logging errors break the application
        if (process.env.STX_DEBUG === 'true') {
          console.error('Failed to write to error log:', err)
        }
      }
    })
  }

  /**
   * Rotate log files if current file exceeds max size
   */
  private async rotateIfNeeded(fs: typeof import('node:fs'), _path: typeof import('node:path')): Promise<void> {
    try {
      if (!fs.existsSync(this.logFilePath))
        return

      const stats = fs.statSync(this.logFilePath)
      if (stats.size < this.maxFileSize)
        return

      // Rotate files: errors.log.4 -> delete, errors.log.3 -> .4, etc.
      for (let i = this.maxLogFiles - 1; i >= 1; i--) {
        const oldPath = `${this.logFilePath}.${i}`
        const newPath = `${this.logFilePath}.${i + 1}`
        if (fs.existsSync(oldPath)) {
          if (i === this.maxLogFiles - 1) {
            fs.unlinkSync(oldPath) // Delete oldest
          }
          else {
            fs.renameSync(oldPath, newPath)
          }
        }
      }

      // Rotate current file
      fs.renameSync(this.logFilePath, `${this.logFilePath}.1`)
    }
    catch (err) {
      // Silently fail rotation errors
      if (process.env.STX_DEBUG === 'true') {
        console.error('Failed to rotate error logs:', err)
      }
    }
  }

  /**
   * Get recent errors from memory
   */
  getRecentErrors(limit = 10): ErrorLogEntry[] {
    return this.errors.slice(-limit)
  }

  /**
   * Get errors filtered by type
   */
  getErrorsByType(errorType: string): ErrorLogEntry[] {
    return this.errors.filter(item => item.error.constructor.name === errorType)
  }

  /**
   * Get errors filtered by level
   */
  getErrorsByLevel(level: 'error' | 'warning' | 'info'): ErrorLogEntry[] {
    return this.errors.filter(item => item.level === level)
  }

  /**
   * Clear all errors from memory
   */
  clear(): void {
    this.errors.length = 0
  }

  /**
   * Clear log file
   */
  async clearLogFile(): Promise<void> {
    try {
      const fs = await import('node:fs')
      if (fs.existsSync(this.logFilePath)) {
        fs.writeFileSync(this.logFilePath, '', 'utf-8')
      }
    }
    catch (err) {
      if (process.env.STX_DEBUG === 'true') {
        console.error('Failed to clear error log:', err)
      }
    }
  }

  /**
   * Get error statistics
   */
  getStats(): { total: number, byType: Record<string, number>, byLevel: Record<string, number> } {
    const byType: Record<string, number> = {}
    const byLevel: Record<string, number> = { error: 0, warning: 0, info: 0 }

    for (const item of this.errors) {
      const type = item.error.constructor.name
      byType[type] = (byType[type] || 0) + 1
      const level = item.level || 'error'
      byLevel[level] = (byLevel[level] || 0) + 1
    }

    return {
      total: this.errors.length,
      byType,
      byLevel,
    }
  }

  /**
   * Export errors to a file (for debugging/reporting)
   */
  async exportToFile(filePath: string, format: 'json' | 'text' = 'json'): Promise<void> {
    const fs = await import('node:fs')
    const path = await import('node:path')

    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (format === 'json') {
      const data = this.errors.map(entry => ({
        timestamp: entry.timestamp.toISOString(),
        level: entry.level || 'error',
        type: entry.error.constructor.name,
        message: entry.error.message,
        stack: entry.error.stack,
        context: entry.context,
      }))
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    }
    else {
      const lines = this.errors.map(entry => this.formatEntry(entry))
      fs.writeFileSync(filePath, lines.join('\n\n'), 'utf-8')
    }
  }

  /**
   * Wait for all pending writes to complete
   */
  async flush(): Promise<void> {
    await this.writeQueue
  }
}

// Global error logger instance
export const errorLogger: ErrorLogger = new ErrorLogger()

/**
 * Development mode helpers
 */
export const devHelpers = {
  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.stx_DEBUG === 'true'
  },

  /**
   * Log detailed error information in development
   */
  logDetailedError(error: Error, context?: any): void {
    if (!this.isDevelopment())
      return

    console.error('=== stx Detailed Error ===')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    if (context) {
      console.error('Context:', context)
    }
    console.error('========================')
  },

  /**
   * Create detailed error report for debugging
   */
  createErrorReport(error: Error, context?: any): string {
    const report = [
      '=== stx Error Report ===',
      `Time: ${new Date().toISOString()}`,
      `Error: ${error.message}`,
      `Type: ${error.constructor.name}`,
      `Stack: ${error.stack}`,
    ]

    if (context) {
      report.push(`Context: ${JSON.stringify(context, null, 2)}`)
    }

    report.push('========================')
    return report.join('\n')
  },
}
