import process from 'node:process'

/**
 * Custom error types for better error classification
 */
export class StxError extends Error {
  constructor(
    message: string,
    public code: string,
    public filePath?: string,
    public line?: number,
    public column?: number,
    public context?: string,
  ) {
    super(message)
    this.name = 'StxError'
  }
}

export class StxSyntaxError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string) {
    super(message, 'STX_SYNTAX_ERROR', filePath, line, column, context)
    this.name = 'StxSyntaxError'
  }
}

export class StxRuntimeError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string) {
    super(message, 'STX_RUNTIME_ERROR', filePath, line, column, context)
    this.name = 'StxRuntimeError'
  }
}

export class StxSecurityError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string) {
    super(message, 'STX_SECURITY_ERROR', filePath, line, column, context)
    this.name = 'StxSecurityError'
  }
}

export class StxFileError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string) {
    super(message, 'STX_FILE_ERROR', filePath, line, column, context)
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
   * Validate file path is safe
   */
  isValidFilePath(filePath: string): boolean {
    // Check for path traversal attempts
    if (filePath.includes('../') || filePath.includes('..\\')) {
      return false
    }

    // Check for absolute paths that might escape sandboxing
    if (filePath.startsWith('/') && !filePath.startsWith(process.cwd())) {
      return false
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
 */
export const errorRecovery = {
  /**
   * Attempt to fix common template syntax errors
   */
  fixCommonSyntaxErrors(template: string): string {
    let fixed = template

    // Fix unmatched braces
    const openBraces = (fixed.match(/\{\{/g) || []).length
    const closeBraces = (fixed.match(/\}\}/g) || []).length

    if (openBraces > closeBraces) {
      fixed += ' '.repeat(openBraces - closeBraces).replace(/ /g, '}}')
    }

    // Fix unclosed directives (basic attempt)
    const unclosedDirectives = ['if', 'foreach', 'for', 'switch', 'section']
    for (const directive of unclosedDirectives) {
      const openCount = (fixed.match(new RegExp(`@${directive}\\b`, 'g')) || []).length
      const closeCount = (fixed.match(new RegExp(`@end${directive}\\b`, 'g')) || []).length

      if (openCount > closeCount) {
        fixed += `\n@end${directive}`
      }
    }

    return fixed
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
export const errorLogger = new ErrorLogger()

/**
 * Development mode helpers
 */
export const devHelpers = {
  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.STX_DEBUG === 'true'
  },

  /**
   * Log detailed error information in development
   */
  logDetailedError(error: Error, context?: any): void {
    if (!this.isDevelopment())
      return

    console.error('=== STX Detailed Error ===')
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
      '=== STX Error Report ===',
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
