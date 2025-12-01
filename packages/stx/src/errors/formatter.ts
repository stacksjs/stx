/**
 * Error Formatting Utilities
 *
 * Provides standardized error message formatting for different output formats.
 *
 * @module errors/formatter
 */

import type { ErrorCode } from './codes'
import type { ErrorContext } from './types'
import { getErrorCodeName } from './codes'
import { formatFilePath } from './types'

// =============================================================================
// Types
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

// =============================================================================
// Main Formatter
// =============================================================================

/**
 * Create a standardized error message in any format
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
      formatted = formatErrorAsHtml(data)
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
  _offset?: number,
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
  if (template && data.line) {
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
function formatErrorAsHtml(data: StandardizedError['data']): string {
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
  _offset?: number,
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
  if (template && data.line) {
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

// =============================================================================
// Helper Functions
// =============================================================================

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

// =============================================================================
// Quick Helpers
// =============================================================================

/**
 * Quick helper for creating inline error messages (for template output)
 */
export function inlineError(type: string, message: string, code?: ErrorCode): string {
  return formatError({ type, message, code, format: 'html' }).formatted
}

/**
 * Quick helper for creating console error messages
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

// =============================================================================
// Safe Execution Wrappers
// =============================================================================

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
