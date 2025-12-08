/**
 * Error Logger and Recovery
 *
 * Provides error logging, recovery strategies, and development helpers.
 *
 * @module errors/logger
 */

import process from 'node:process'
import { getErrorConfig } from './types'

// =============================================================================
// Error Recovery
// =============================================================================

/**
 * Error recovery strategies
 *
 * NOTE: Auto-recovery is opt-in via configuration.
 * Use configureErrorHandling({ enableAutoRecovery: true }) to enable.
 */
export const errorRecovery = {
  /**
   * Check if auto-recovery is enabled
   */
  isEnabled(): boolean {
    return getErrorConfig().enableAutoRecovery
  },

  /**
   * Attempt to fix common template syntax errors
   *
   * WARNING: This can mask real issues. Only use in development.
   */
  fixCommonSyntaxErrors(template: string): { fixed: string, fixes: string[] } {
    const config = getErrorConfig()

    // Return unchanged if recovery is disabled
    if (!config.enableAutoRecovery) {
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
    if (fixes.length > 0 && config.logRecoveryWarnings) {
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

// =============================================================================
// Error Logger
// =============================================================================

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
  context?: unknown
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
    if (options.maxErrors !== undefined) {
      this.maxErrors = options.maxErrors
    }
    if (options.enableFileLogging !== undefined) {
      this.enableFileLogging = options.enableFileLogging
    }
    if (options.logFilePath !== undefined) {
      this.logFilePath = options.logFilePath
    }
    if (options.logFormat !== undefined) {
      this.logFormat = options.logFormat
    }
    if (options.maxFileSize !== undefined) {
      this.maxFileSize = options.maxFileSize
    }
    if (options.maxLogFiles !== undefined) {
      this.maxLogFiles = options.maxLogFiles
    }
    if (options.minLevel !== undefined) {
      this.minLevel = options.minLevel
    }
  }

  /**
   * Log an error with optional context
   */
  log(error: Error, context?: unknown, level: 'error' | 'warning' | 'info' = 'error'): void {
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
    if (this.minLevel === 'all') {
      return true
    }
    if (this.minLevel === 'warning') {
      return level === 'error' || level === 'warning'
    }
    if (this.minLevel === 'error') {
      return level === 'error'
    }
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
        const nodePath = await import('node:path')

        // Ensure directory exists
        const dir = nodePath.dirname(this.logFilePath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        // Check file size and rotate if needed
        await this.rotateIfNeeded(fs)

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
  private async rotateIfNeeded(fs: typeof import('node:fs')): Promise<void> {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return
      }

      const stats = fs.statSync(this.logFilePath)
      if (stats.size < this.maxFileSize) {
        return
      }

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
    const nodePath = await import('node:path')

    // Ensure directory exists
    const dir = nodePath.dirname(filePath)
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

// =============================================================================
// Development Helpers
// =============================================================================

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
  logDetailedError(error: Error, context?: unknown): void {
    if (!this.isDevelopment()) {
      return
    }

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
  createErrorReport(error: Error, context?: unknown): string {
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
