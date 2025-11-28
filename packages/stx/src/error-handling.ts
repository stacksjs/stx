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
 * Error logging and monitoring
 */
export class ErrorLogger {
  private errors: Array<{ timestamp: Date, error: Error, context?: any }> = []
  private maxErrors = 1000

  log(error: Error, context?: any): void {
    this.errors.push({
      timestamp: new Date(),
      error,
      context,
    })

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }
  }

  getRecentErrors(limit = 10): Array<{ timestamp: Date, error: Error, context?: any }> {
    return this.errors.slice(-limit)
  }

  getErrorsByType(errorType: string): Array<{ timestamp: Date, error: Error, context?: any }> {
    return this.errors.filter(item => item.error.constructor.name === errorType)
  }

  clear(): void {
    this.errors.length = 0
  }

  getStats(): { total: number, byType: Record<string, number> } {
    const byType: Record<string, number> = {}

    for (const item of this.errors) {
      const type = item.error.constructor.name
      byType[type] = (byType[type] || 0) + 1
    }

    return {
      total: this.errors.length,
      byType,
    }
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
