/**
 * Error Types and Classes
 *
 * Custom error classes for better error classification and handling.
 *
 * @module errors/types
 */

import type { ErrorCode } from './codes'
import path from 'node:path'
import process from 'node:process'
import { ErrorCodes } from './codes'

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
export function formatFilePath(filePath: string): string {
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
 * Base STX error class
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
    this.numericCode = numericCode || ErrorCodes.EVALUATION_ERROR // Default to generic runtime error
    // Format file path based on configuration
    if (this.filePath) {
      this.filePath = formatFilePath(this.filePath)
    }
  }
}

/**
 * Syntax error in template
 */
export class StxSyntaxError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string, numericCode?: ErrorCode) {
    super(message, 'stx_SYNTAX_ERROR', filePath, line, column, context, numericCode || ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
    this.name = 'StxSyntaxError'
  }
}

/**
 * Runtime error during template processing
 */
export class StxRuntimeError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string, numericCode?: ErrorCode) {
    super(message, 'stx_RUNTIME_ERROR', filePath, line, column, context, numericCode || ErrorCodes.EVALUATION_ERROR)
    this.name = 'StxRuntimeError'
  }
}

/**
 * Security-related error
 */
export class StxSecurityError extends StxError {
  constructor(message: string, filePath?: string, line?: number, column?: number, context?: string, numericCode?: ErrorCode) {
    super(message, 'stx_SECURITY_ERROR', filePath, line, column, context, numericCode || ErrorCodes.UNSAFE_EXPRESSION)
    this.name = 'StxSecurityError'
  }
}

/**
 * File operation error
 */
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
