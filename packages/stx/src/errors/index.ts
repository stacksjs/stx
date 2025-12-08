/**
 * Error Handling Module
 *
 * Provides comprehensive error handling utilities for the stx framework.
 *
 * @module errors
 */

// Error codes and localization
export {
  clearErrorMessages,
  type ErrorCode,
  ErrorCodes,
  type ErrorMessages,
  type ErrorMessageTemplate,
  formatLocalizedError,
  getErrorCodeName,
  getErrorLocale,
  getErrorMessage,
  registerErrorMessages,
  setErrorLocale,
} from './codes'

// Error formatting
export {
  consoleError,
  createEnhancedError,
  type ErrorMessageOptions,
  type ErrorOutputFormat,
  formatError,
  inlineError,
  safeExecute,
  safeExecuteAsync,
  type StandardizedError,
} from './formatter'

// Logger and recovery
export {
  devHelpers,
  type ErrorLogEntry,
  ErrorLogger,
  errorLogger,
  type ErrorLoggerOptions,
  errorRecovery,
} from './logger'

// Sanitization
export {
  sanitizeComponentProps,
  sanitizeDirectiveParam,
  sanitizeDirectiveParams,
  type SanitizedParam,
  sanitizeExpression,
  sanitizeFilePath,
  type SanitizeOptions,
  validators,
} from './sanitizer'

// Error types and classes
export {
  configureErrorHandling,
  type ErrorConfig,
  type ErrorContext,
  formatFilePath,
  getErrorConfig,
  resetErrorConfig,
  StxError,
  StxFileError,
  StxRuntimeError,
  StxSecurityError,
  StxSyntaxError,
} from './types'
