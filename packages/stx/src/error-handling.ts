/**
 * Error Handling Module
 *
 * This module has been refactored into smaller, more focused files.
 * All exports are re-exported from the errors/ directory.
 *
 * @module error-handling
 * @see ./errors/codes.ts - Error codes and localized messages
 * @see ./errors/types.ts - Error classes and configuration
 * @see ./errors/formatter.ts - Error formatting utilities
 * @see ./errors/sanitizer.ts - Parameter sanitization
 * @see ./errors/logger.ts - Error logging and recovery
 */

export * from './errors'
