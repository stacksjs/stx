/**
 * Error Codes and Localized Messages
 *
 * Provides numeric error codes for programmatic error handling
 * and localized error message templates.
 *
 * @module errors/codes
 */

// =============================================================================
// Error Message Templates
// =============================================================================

/**
 * Error message template with placeholder support
 * Placeholders use {{name}} syntax
 */
export interface ErrorMessageTemplate {
  message: string
  help?: string
}

/**
 * Localized error messages by error code
 */
export type ErrorMessages = Record<number, ErrorMessageTemplate>

/**
 * Default English error messages
 */
const defaultErrorMessages: ErrorMessages = {
  // Syntax errors (1000-1099)
  1001: { message: 'Unclosed directive: {{directive}}', help: 'Make sure to close the directive with the appropriate end tag' },
  1002: { message: 'Unclosed expression at position {{position}}', help: 'Check for missing closing braces }}' },
  1003: { message: 'Invalid directive syntax: {{directive}}', help: 'Review the directive documentation for correct syntax' },
  1004: { message: 'Malformed expression: {{expression}}', help: 'Check for syntax errors in your expression' },
  1005: { message: 'Unexpected token: {{token}}', help: 'Remove or fix the unexpected token' },

  // Runtime errors (1100-1199)
  1101: { message: 'Undefined variable: {{variable}}', help: 'Make sure the variable is defined in the template context' },
  1102: { message: 'Type error: {{details}}', help: 'Check that you are using the correct types' },
  1103: { message: 'Evaluation error: {{details}}', help: 'Review the expression for errors' },
  1104: { message: 'Infinite loop detected in {{location}}', help: 'Check your loop conditions' },
  1105: { message: 'Circular reference detected: {{path}}', help: 'Remove the circular dependency' },

  // Security errors (1200-1299)
  1201: { message: 'Unsafe expression blocked: {{expression}}', help: 'This expression contains potentially dangerous code' },
  1202: { message: 'Path traversal attempt blocked: {{path}}', help: 'Use only relative paths within allowed directories' },
  1203: { message: 'Potential XSS attempt blocked', help: 'Sanitize user input before rendering' },
  1204: { message: 'Code injection attempt blocked: {{code}}', help: 'Avoid executing dynamic code' },
  1205: { message: 'Prohibited DOM API usage: {{api}}', help: 'Use STX.useRefs(), STX.useRef(), STX.el() and other STX helpers instead of direct DOM manipulation' },

  // File errors (1300-1399)
  1301: { message: 'File not found: {{path}}', help: 'Check that the file exists and the path is correct' },
  1302: { message: 'Error reading file: {{path}}', help: 'Check file permissions and encoding' },
  1303: { message: 'Invalid file path: {{path}}', help: 'Use a valid file path' },
  1304: { message: 'Permission denied: {{path}}', help: 'Check file permissions' },

  // Configuration errors (1400-1499)
  1401: { message: 'Invalid configuration: {{details}}', help: 'Review your stx.config.ts file' },
  1402: { message: 'Missing required configuration: {{key}}', help: 'Add the required configuration option' },
  1403: { message: 'Deprecated configuration: {{key}}', help: 'Update to the new configuration format' },

  // Component errors (1500-1599)
  1501: { message: 'Component not found: {{name}}', help: 'Check that the component exists in your components directory' },
  1502: { message: 'Invalid props for component {{name}}: {{details}}', help: 'Check the component prop requirements' },
  1503: { message: 'Error rendering component {{name}}: {{details}}', help: 'Check the component template for errors' },

  // Expression errors (1600-1699)
  1601: { message: 'Filter not found: {{filter}}', help: 'Register the filter or check the filter name' },
  1602: { message: 'Invalid arguments for filter {{filter}}: {{details}}', help: 'Check the filter documentation for correct arguments' },
  1603: { message: 'Expression evaluation timed out', help: 'Simplify the expression or increase the timeout' },
}

/**
 * Custom localized error messages
 */
let customErrorMessages: ErrorMessages = {}

/**
 * Current locale for error messages
 */
let currentLocale = 'en'

/**
 * Set the locale for error messages
 */
export function setErrorLocale(locale: string): void {
  currentLocale = locale
}

/**
 * Get the current error message locale
 */
export function getErrorLocale(): string {
  return currentLocale
}

/**
 * Register custom error messages for a locale
 * This allows overriding default messages or adding translations
 */
export function registerErrorMessages(messages: ErrorMessages): void {
  customErrorMessages = { ...customErrorMessages, ...messages }
}

/**
 * Clear custom error messages
 */
export function clearErrorMessages(): void {
  customErrorMessages = {}
}

/**
 * Get an error message by code, with placeholder substitution
 */
export function getErrorMessage(code: number, params: Record<string, string> = {}): ErrorMessageTemplate {
  const template = customErrorMessages[code] || defaultErrorMessages[code] || {
    message: `Unknown error (code: ${code})`,
  }

  // Substitute placeholders
  let message = template.message
  let help = template.help

  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{{${key}}}`
    message = message.replace(new RegExp(placeholder, 'g'), value)
    if (help) {
      help = help.replace(new RegExp(placeholder, 'g'), value)
    }
  }

  return { message, help }
}

/**
 * Format an error with localized message
 */
export function formatLocalizedError(code: number, params: Record<string, string> = {}): string {
  const { message, help } = getErrorMessage(code, params)
  return help ? `${message}\n  Help: ${help}` : message
}

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
  DOM_API_VIOLATION: 1205,

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
    if (value === code) {
      return name
    }
  }
  return undefined
}
