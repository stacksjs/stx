/**
 * Module for processing form-related directives.
 *
 * Provides directives for building accessible, validated forms:
 * - `@csrf` - CSRF token hidden input
 * - `@method('PUT')` - HTTP method spoofing
 * - `@form` / `@endform` - Form wrapper with auto CSRF
 * - `@input`, `@textarea`, `@select` - Form controls with validation
 * - `@checkbox`, `@radio` - Check inputs with state binding
 * - `@file` - File upload input with accept and multiple support
 * - `@label` - Associated labels
 * - `@error` / `@enderror` - Validation error display
 * - `@validate` - Add validation rules with HTML5 attributes
 *
 * ## File Upload Example
 *
 * ```html
 * @file('avatar', { accept: 'image/*' })
 * @file('documents', { accept: '.pdf,.doc,.docx', multiple: true })
 * ```
 *
 * ## Validation Rules
 *
 * Built-in validation rules:
 * - `required` - Field must have a value
 * - `email` - Must be valid email format
 * - `url` - Must be valid URL
 * - `numeric` - Must be a number
 * - `integer` - Must be an integer
 * - `alpha` - Letters only
 * - `alphanumeric` - Letters and numbers only
 * - `min:n` - Minimum length/value
 * - `max:n` - Maximum length/value
 * - `confirmed` - Must match `{field}_confirmation`
 * - `in:a,b,c` - Must be one of the values
 * - `notIn:a,b,c` - Must not be one of the values
 * - `regex:pattern` - Must match regex
 * - `date` - Must be valid date
 * - `before:date` - Must be before date
 * - `after:date` - Must be after date
 *
 * ## Configuration
 *
 * CSS class names can be customized via `stx.config.ts`:
 * ```typescript
 * export default {
 *   forms: {
 *     classes: {
 *       input: 'my-input',
 *       inputError: 'my-input--error',
 *       // ...
 *     }
 *   }
 * }
 * ```
 */
import type { StxOptions } from './types'
import crypto from 'node:crypto'
import { isExpressionSafe, safeEvaluate } from './safe-evaluator'

// =============================================================================
// Configuration
// =============================================================================

/**
 * Default CSS class names for form elements.
 * Based on Bootstrap conventions but fully customizable.
 */
export interface FormClassConfig {
  /** Class for text inputs, textareas, and selects (default: 'form-control') */
  input: string
  /** Class added to inputs with validation errors (default: 'is-invalid') */
  inputError: string
  /** Class for checkboxes and radios (default: 'form-check-input') */
  checkInput: string
  /** Class for labels (default: 'form-label') */
  label: string
  /** Class for error message containers (default: 'invalid-feedback') */
  errorFeedback: string
}

/**
 * Default form class configuration (Bootstrap-compatible)
 */
export const defaultFormClasses: FormClassConfig = {
  input: 'form-control',
  inputError: 'is-invalid',
  checkInput: 'form-check-input',
  label: 'form-label',
  errorFeedback: 'invalid-feedback',
}

/**
 * Get merged form class configuration from options
 */
function getFormClasses(options: StxOptions): FormClassConfig {
  return {
    ...defaultFormClasses,
    ...(options.forms?.classes as Partial<FormClassConfig>),
  }
}

/**
 * Build class string with error state handling.
 *
 * @param existingClass - Class from user attributes
 * @param defaultClass - Default class to use if no existing class
 * @param hasError - Whether the field has a validation error
 * @param errorClass - Class to add when there's an error
 * @returns Combined class string
 */
function buildClassString(
  existingClass: string,
  defaultClass: string,
  hasError: boolean,
  errorClass: string,
): string {
  const baseClass = existingClass || defaultClass
  return hasError ? `${baseClass} ${errorClass}` : baseClass
}

// =============================================================================
// CSRF Token Generation
// =============================================================================

/**
 * Generate a cryptographically secure random ID for CSRF tokens.
 * Uses crypto.randomUUID() for security instead of Math.random().
 */
function genId(): string {
  return crypto.randomUUID()
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Process all form-related directives.
 *
 * Processing order:
 * 1. Validation setup (@validate - generates HTML5 attributes)
 * 2. Basic directives (@csrf, @method)
 * 3. Form input directives (@form, @input, @textarea, etc.)
 * 4. Error display directives (@error)
 */
export function processForms(
  template: string,
  context: Record<string, any>,
  _filePath: string,
  options: StxOptions,
): string {
  const classes = getFormClasses(options)
  let output = template

  // Process @validate directive first (generates HTML5 validation attributes)
  output = processValidateDirective(output, context)

  // Process basic form directives (@csrf, @method)
  output = processBasicFormDirectives(output, context)

  // Process form input directives (@form, @input, @textarea, etc)
  output = processFormInputDirectives(output, context, classes)

  // Process form validation directives (@error)
  output = processErrorDirective(output, context, classes)

  return output
}

/**
 * Process basic form directives (@csrf, @method)
 */
export function processBasicFormDirectives(template: string, context: Record<string, any>): string {
  let result = template

  // Process @csrf directive
  result = result.replace(/@csrf/g, () => {
    // Generate a token if not provided
    if (!context.csrf || typeof context.csrf !== 'object') {
      const token = genId()
      context.csrf = { token }
    }

    // Check if field is provided directly
    if (context.csrf.field) {
      return context.csrf.field
    }

    // Use token if available
    if (context.csrf.token) {
      return `<input type="hidden" name="_token" value="${context.csrf.token}">`
    }

    // Default fallback with empty token
    return '<input type="hidden" name="_token" value="">'
  })

  // Process @method directive
  result = result.replace(/@method\(['"]([^'"]+)['"]\)/g, (match, method) => {
    // Method spoofing for non-GET/POST methods
    if (method && ['PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      return `<input type="hidden" name="_method" value="${method.toUpperCase()}">`
    }

    // Return unchanged if not a supported method
    return match
  })

  return result
}

// =============================================================================
// Form Input Directives
// =============================================================================

/**
 * Process form input directives.
 * Handles @form, @input, @textarea, @select, @checkbox, @radio, @label.
 */
export function processFormInputDirectives(
  template: string,
  context: Record<string, any>,
  classes: FormClassConfig = defaultFormClasses,
): string {
  let result = template

  // Process @form directive
  result = result.replace(
    /@form\(\s*(?:(?:'([^']+)'|"([^"]+)")\s*)?(?:,\s*(?:'([^']+)'|"([^"]+)")?)?\s*(?:,\s*\{([^}]+)\}\s*)?\)/g,
    (_match, singleQuoteMethod, doubleQuoteMethod, singleQuoteAction, doubleQuoteAction, attributes = '') => {
      const method = singleQuoteMethod || doubleQuoteMethod || 'POST'
      const action = singleQuoteAction || doubleQuoteAction || ''

      const attrs = parseAttributes(attributes)
      const methodStr = method.toUpperCase()
      const htmlMethod = ['GET', 'POST'].includes(methodStr) ? methodStr : 'POST'

      let formHtml = `<form method="${htmlMethod}" action="${action}"${attrs ? ` ${attrs}` : ''}>`

      // Add CSRF token for all forms
      formHtml += `\n  ${processBasicFormDirectives('@csrf', context)}`

      // Add method spoofing for non-GET/POST methods
      if (!['GET', 'POST'].includes(methodStr)) {
        formHtml += `\n  ${processBasicFormDirectives(`@method('${methodStr}')`, context)}`
      }

      return formHtml
    },
  )

  // Close form tag
  result = result.replace(/@endform/g, '</form>')

  // Process @input directive
  result = result.replace(
    /@input\(\s*(?:'([^']+)'|"([^"]+)")\s*(?:,\s*(?:(?:'([^']*)'|"([^"]*)")\s*)?)?(?:,\s*\{([^}]+)\})?\s*\)/g,
    (_match, singleQuoteName, doubleQuoteName, singleQuoteValue, doubleQuoteValue, attributes = '') => {
      const name = singleQuoteName || doubleQuoteName || ''
      const value = singleQuoteValue || doubleQuoteValue || ''

      const attrs = parseAttributes(attributes)
      const oldValue = getOldValue(name, context) || (value || '')

      // Get type from attributes or default to text
      const typeMatch = attrs.match(/type=['"]([^'"]+)['"]/i)
      const type = typeMatch ? typeMatch[1] : 'text'

      // Check if this field has an error and build class string
      const hasError = hasFieldError(name, context)
      const classMatch = attrs.match(/class=['"]([^'"]+)['"]/i)
      const className = buildClassString(classMatch ? classMatch[1] : '', classes.input, hasError, classes.inputError)

      // Remove existing class and type to avoid duplication
      let attrsWithoutClassAndType = attrs.replace(/class=['"][^'"]+['"]/i, '')
      attrsWithoutClassAndType = attrsWithoutClassAndType.replace(/type=['"][^'"]+['"]/i, '')

      return `<input type="${type}" name="${name}" value="${oldValue}" class="${className}"${attrsWithoutClassAndType ? ` ${attrsWithoutClassAndType}` : ''}>`
    },
  )

  // Process @textarea directive
  result = result.replace(
    /@textarea\(\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]+)\})?\)([\s\S]*?)@endtextarea/g,
    (_match, name, attributes = '', content = '') => {
      const attrs = parseAttributes(attributes)
      const oldValue = getOldValue(name, context) || content.trim()

      // Check if this field has an error and build class string
      const hasError = hasFieldError(name, context)
      const classMatch = attrs.match(/class=['"]([^'"]+)['"]/i)
      const className = buildClassString(classMatch ? classMatch[1] : '', classes.input, hasError, classes.inputError)

      // Remove existing class to avoid duplication
      const attrsWithoutClass = attrs.replace(/class=['"][^'"]+['"]/i, '')

      return `<textarea name="${name}" class="${className}"${attrsWithoutClass ? ` ${attrsWithoutClass}` : ''}>${oldValue}</textarea>`
    },
  )

  // Process @select directive
  result = result.replace(
    /@select\(\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]+)\})?\)([\s\S]*?)@endselect/g,
    (_match, name, attributes = '', content) => {
      const attrs = parseAttributes(attributes)
      const oldValue = getOldValue(name, context)

      // Check if this field has an error and build class string
      const hasError = hasFieldError(name, context)
      const classMatch = attrs.match(/class=['"]([^'"]+)['"]/i)
      const className = buildClassString(classMatch ? classMatch[1] : '', classes.input, hasError, classes.inputError)

      // Remove existing class to avoid duplication
      const attrsWithoutClass = attrs.replace(/class=['"][^'"]+['"]/i, '')

      // Mark options as selected if they match the old value
      let processedContent = content
      if (oldValue !== undefined) {
        processedContent = content.replace(
          /(<option[^>]*value=['"]([^'"]+)['"][^>]*>)/gi,
          (optionMatch: string, optionTag: string, optionValue: string) => {
            // Handle both string and array old values
            const isSelected = Array.isArray(oldValue)
              ? oldValue.includes(optionValue)
              : oldValue === optionValue

            if (isSelected && !optionTag.includes('selected')) {
              return optionTag.replace(/(<option)/, '$1 selected')
            }
            return optionMatch
          },
        )
      }

      return `<select name="${name}" class="${className}"${attrsWithoutClass ? ` ${attrsWithoutClass}` : ''}>${processedContent}</select>`
    },
  )

  // Process @checkbox directive
  result = result.replace(
    /@checkbox\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?(?:,\s*\{([^}]+)\})?\)/g,
    (_match, name, value = '1', attributes = '') => {
      const attrs = parseAttributes(attributes)
      const oldValues = getOldValue(name, context)

      // Check if checkbox should be checked
      const isChecked = oldValues !== undefined && (
        Array.isArray(oldValues)
          ? oldValues.includes(value)
          : oldValues === value || oldValues === true
      )

      // Parse existing class attribute
      const classMatch = attrs.match(/class=['"]([^'"]+)['"]/i)
      const className = classMatch ? classMatch[1] : classes.checkInput

      // Remove existing class to avoid duplication
      const attrsWithoutClass = attrs.replace(/class=['"][^'"]+['"]/i, '')

      return `<input type="checkbox" name="${name}" value="${value}" class="${className}"${isChecked ? ' checked' : ''}${attrsWithoutClass ? ` ${attrsWithoutClass}` : ''}>`
    },
  )

  // Process @radio directive
  result = result.replace(
    /@radio\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]+)\})?\)/g,
    (_match, name, value, attributes = '') => {
      const attrs = parseAttributes(attributes)
      const oldValue = getOldValue(name, context)

      // Check if radio should be checked
      const isChecked = oldValue !== undefined && oldValue === value

      // Parse existing class attribute
      const classMatch = attrs.match(/class=['"]([^'"]+)['"]/i)
      const className = classMatch ? classMatch[1] : classes.checkInput

      // Remove existing class to avoid duplication
      const attrsWithoutClass = attrs.replace(/class=['"][^'"]+['"]/i, '')

      return `<input type="radio" name="${name}" value="${value}" class="${className}"${isChecked ? ' checked' : ''}${attrsWithoutClass ? ` ${attrsWithoutClass}` : ''}>`
    },
  )

  // Process @file directive
  result = result.replace(
    /@file\(\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]+)\})?\)/g,
    (_match, name, attributes = '') => {
      const attrs = parseAttributes(attributes)

      // Extract accept attribute for file types
      const acceptMatch = attrs.match(/accept=['"]([^'"]+)['"]/i)
      const accept = acceptMatch ? acceptMatch[1] : ''

      // Extract multiple attribute
      const isMultiple = attrs.includes('multiple')

      // Check if this field has an error and build class string
      const hasError = hasFieldError(name, context)
      const classMatch = attrs.match(/class=['"]([^'"]+)['"]/i)
      const className = buildClassString(classMatch ? classMatch[1] : '', classes.input, hasError, classes.inputError)

      // Remove handled attributes to avoid duplication
      const attrsWithoutHandled = attrs
        .replace(/class=['"][^'"]+['"]/gi, '')
        .replace(/accept=['"][^'"]+['"]/gi, '')
        .replace(/\bmultiple\b/gi, '')
        .trim()

      // Build the file input element
      const parts = [
        `<input type="file" name="${name}"`,
        `class="${className}"`,
      ]

      if (accept) {
        parts.push(`accept="${accept}"`)
      }

      if (isMultiple) {
        parts.push('multiple')
      }

      if (attrsWithoutHandled) {
        parts.push(attrsWithoutHandled)
      }

      return `${parts.join(' ')}>`
    },
  )

  // Process @label directive
  result = result.replace(
    /@label\(\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]+)\})?\)([\s\S]*?)@endlabel/g,
    (_match, forAttr, attributes = '', content) => {
      const attrs = parseAttributes(attributes)

      // Parse existing class attribute
      const classMatch = attrs.match(/class=['"]([^'"]+)['"]/i)
      const className = classMatch ? classMatch[1] : classes.label

      // Remove existing class to avoid duplication
      const attrsWithoutClass = attrs.replace(/class=['"][^'"]+['"]/i, '')

      return `<label for="${forAttr}" class="${className}"${attrsWithoutClass ? ` ${attrsWithoutClass}` : ''}>${content}</label>`
    },
  )

  return result
}

// =============================================================================
// Validation Directives
// =============================================================================

/**
 * Process @error directive for form validation.
 * Renders content only when the specified field has validation errors.
 *
 * @example
 * ```html
 * @error('email')
 *   <span class="error">{{ $message }}</span>
 * @enderror
 * ```
 */
export function processErrorDirective(
  template: string,
  context: Record<string, any>,
  _classes: FormClassConfig = defaultFormClasses,
): string {
  // Process @error('field') directives
  return template.replace(/@error\(['"]([^'"]+)['"]\)([\s\S]*?)@enderror/g, (match, field, content) => {
    try {
      // Check if errors object exists and has the specified field
      if (hasFieldError(field, context)) {
        // Replace any expressions in the content with actual values
        return content.replace(/\{\{([^}]+)\}\}/g, (_: string, expr: string) => {
          try {
            // Simple expression evaluation for error messages
            if (expr.trim() === '$message' || expr.trim() === 'message') {
              return getErrorMessage(field, context)
            }

            // Handle expressions with errors.first() call
            if (expr.trim().includes('errors.first') || expr.trim().includes('$errors.first')) {
              // Extract the message using the errors.first method
              if (typeof context.errors?.first === 'function') {
                return context.errors.first(field)
              }
              return getErrorMessage(field, context)
            }

            // For other expressions, try to evaluate them using safe evaluation
            const trimmedExpr = expr.trim()
            if (isExpressionSafe(trimmedExpr)) {
              const result = safeEvaluate(trimmedExpr, context)
              return result !== undefined ? String(result) : trimmedExpr
            }
            return trimmedExpr
          }
          catch {
            return expr
          }
        })
      }

      // No error for this field, return empty
      return ''
    }
    catch (error) {
      console.error(`Error processing @error directive:`, error)
      return match // Return unchanged if error
    }
  })
}

/**
 * Helper function to check if a field has an error
 */
function hasFieldError(field: string, context: Record<string, any>): boolean {
  if (!context.errors)
    return false

  // Handle Laravel-style validation errors
  if (typeof context.errors.has === 'function') {
    return context.errors.has(field)
  }

  // Handle simple object of errors
  if (typeof context.errors === 'object') {
    return Object.prototype.hasOwnProperty.call(context.errors, field)
  }

  return false
}

/**
 * Helper function to get error message for a field
 */
function getErrorMessage(field: string, context: Record<string, any>): string {
  if (!context.errors)
    return ''

  // Handle Laravel-style validation errors
  if (typeof context.errors.get === 'function') {
    return context.errors.get(field)
  }

  // Handle simple object of errors
  if (typeof context.errors === 'object' && Object.prototype.hasOwnProperty.call(context.errors, field)) {
    const error = context.errors[field]
    return Array.isArray(error) ? error[0] : String(error)
  }

  return ''
}

/**
 * Helper function to get old value for a field
 */
function getOldValue(field: string, context: Record<string, any>): any {
  // Handle array notation for checkboxes
  let value

  // Handle Laravel-style old input
  if (context.old && typeof context.old === 'function') {
    return context.old(field)
  }

  // Handle old as object
  if (context.old && typeof context.old === 'object') {
    return context.old[field]
  }

  // For array notation (e.g. colors[]), check the base name (colors) in context
  if (field.endsWith('[]')) {
    const baseName = field.slice(0, -2)
    value = context[baseName]
    if (value !== undefined) {
      return value
    }
  }

  // Handle direct value from context
  return context[field]
}

/**
 * Helper function to parse attributes string to HTML attributes string
 */
function parseAttributes(attributesStr: string): string {
  if (!attributesStr.trim())
    return ''

  const attrs: string[] = []
  // Match key:value pairs with proper handling of quoted values and commas
  const attrRegex = /([\w-]+)\s*:\s*(['"]?)([^,'"]*)\2(?:,|$)/g

  let match: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((match = attrRegex.exec(attributesStr)) !== null) {
    const [, name, , value] = match
    attrs.push(`${name}="${value.trim()}"`)
  }

  return attrs.join(' ')
}

// =============================================================================
// Validation System
// =============================================================================

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Rule name (e.g., 'required', 'email', 'min') */
  name: string
  /** Rule parameters (e.g., min:5 → params = ['5']) */
  params?: string[]
  /** Custom error message */
  message?: string
}

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  field: string
  valid: boolean
  errors: string[]
}

/**
 * Built-in validation rules
 */
const validationRules: Record<string, (value: any, params: string[], field: string) => string | null> = {
  /** Field must have a value */
  required: (value, _params, field) => {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return `The ${field} field is required.`
    }
    return null
  },

  /** Field must be a valid email */
  email: (value, _params, field) => {
    if (!value)
      return null // Let required handle empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(value))) {
      return `The ${field} field must be a valid email address.`
    }
    return null
  },

  /** Field must have minimum length/value */
  min: (value, params, field) => {
    if (!value)
      return null
    const min = Number(params[0])
    if (typeof value === 'string' && value.length < min) {
      return `The ${field} field must be at least ${min} characters.`
    }
    if (typeof value === 'number' && value < min) {
      return `The ${field} field must be at least ${min}.`
    }
    if (Array.isArray(value) && value.length < min) {
      return `The ${field} field must have at least ${min} items.`
    }
    return null
  },

  /** Field must have maximum length/value */
  max: (value, params, field) => {
    if (!value)
      return null
    const max = Number(params[0])
    if (typeof value === 'string' && value.length > max) {
      return `The ${field} field must not exceed ${max} characters.`
    }
    if (typeof value === 'number' && value > max) {
      return `The ${field} field must not exceed ${max}.`
    }
    if (Array.isArray(value) && value.length > max) {
      return `The ${field} field must not have more than ${max} items.`
    }
    return null
  },

  /** Field must match another field */
  confirmed: (value, params, field) => {
    // params[0] should be the confirmation field value passed during validation
    if (params[0] !== undefined && value !== params[0]) {
      return `The ${field} confirmation does not match.`
    }
    return null
  },

  /** Field must be numeric */
  numeric: (value, _params, field) => {
    if (!value)
      return null
    if (Number.isNaN(Number(value))) {
      return `The ${field} field must be a number.`
    }
    return null
  },

  /** Field must be an integer */
  integer: (value, _params, field) => {
    if (!value)
      return null
    if (!Number.isInteger(Number(value))) {
      return `The ${field} field must be an integer.`
    }
    return null
  },

  /** Field must be alphabetic */
  alpha: (value, _params, field) => {
    if (!value)
      return null
    if (!/^[a-z]+$/i.test(String(value))) {
      return `The ${field} field must only contain letters.`
    }
    return null
  },

  /** Field must be alphanumeric */
  alphanumeric: (value, _params, field) => {
    if (!value)
      return null
    if (!/^[a-z0-9]+$/i.test(String(value))) {
      return `The ${field} field must only contain letters and numbers.`
    }
    return null
  },

  /** Field must be a valid URL */
  url: (value, _params, field) => {
    if (!value)
      return null
    try {
      // URL constructor throws on invalid URLs
      const _url = new URL(String(value))
      return _url ? null : null // Use _url to avoid lint error
    }
    catch {
      return `The ${field} field must be a valid URL.`
    }
  },

  /** Field must match a regex pattern */
  regex: (value, params, field) => {
    if (!value)
      return null
    try {
      const pattern = new RegExp(params[0])
      if (!pattern.test(String(value))) {
        return `The ${field} field format is invalid.`
      }
      return null
    }
    catch {
      return `The ${field} field has an invalid validation pattern.`
    }
  },

  /** Field must be in a list of values */
  in: (value, params, field) => {
    if (!value)
      return null
    if (!params.includes(String(value))) {
      return `The ${field} field must be one of: ${params.join(', ')}.`
    }
    return null
  },

  /** Field must not be in a list of values */
  notIn: (value, params, field) => {
    if (!value)
      return null
    if (params.includes(String(value))) {
      return `The ${field} field must not be: ${params.join(', ')}.`
    }
    return null
  },

  /** Field must be a valid date */
  date: (value, _params, field) => {
    if (!value)
      return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return `The ${field} field must be a valid date.`
    }
    return null
  },

  /** Field must be before a date */
  before: (value, params, field) => {
    if (!value)
      return null
    const date = new Date(value)
    const beforeDate = new Date(params[0])
    if (date >= beforeDate) {
      return `The ${field} field must be before ${params[0]}.`
    }
    return null
  },

  /** Field must be after a date */
  after: (value, params, field) => {
    if (!value)
      return null
    const date = new Date(value)
    const afterDate = new Date(params[0])
    if (date <= afterDate) {
      return `The ${field} field must be after ${params[0]}.`
    }
    return null
  },
}

/**
 * Register a custom validation rule.
 *
 * @param name - Rule name
 * @param validator - Validation function returning error message or null
 *
 * @example
 * ```typescript
 * registerValidationRule('phone', (value, params, field) => {
 *   if (!/^\+?[\d\s-]+$/.test(value)) {
 *     return `The ${field} field must be a valid phone number.`
 *   }
 *   return null
 * })
 * ```
 */
export function registerValidationRule(
  name: string,
  validator: (value: any, params: string[], field: string) => string | null,
): void {
  validationRules[name] = validator
}

/**
 * Parse a validation rule string into a ValidationRule object.
 *
 * @param ruleStr - Rule string (e.g., 'min:5', 'required', 'in:a,b,c')
 * @returns Parsed validation rule
 */
function parseValidationRule(ruleStr: string): ValidationRule {
  const [name, ...paramParts] = ruleStr.split(':')
  const params = paramParts.length > 0 ? paramParts.join(':').split(',') : []
  return { name: name.trim(), params }
}

/**
 * Validate a single field value against rules.
 *
 * @param field - Field name
 * @param value - Field value
 * @param rules - Pipe-separated rules (e.g., 'required|email|max:255')
 * @param context - Context for accessing other field values (for confirmed rule)
 * @returns Validation result
 */
export function validateField(
  field: string,
  value: any,
  rules: string,
  context: Record<string, any> = {},
): FieldValidationResult {
  const errors: string[] = []
  const ruleList = rules.split('|').map(r => r.trim()).filter(Boolean)

  for (const ruleStr of ruleList) {
    const rule = parseValidationRule(ruleStr)
    const validator = validationRules[rule.name]

    if (!validator) {
      console.warn(`Unknown validation rule: ${rule.name}`)
      continue
    }

    // Special handling for 'confirmed' rule - get confirmation field value
    if (rule.name === 'confirmed') {
      const confirmField = `${field}_confirmation`
      rule.params = [context[confirmField]]
    }

    const error = validator(value, rule.params || [], field)
    if (error) {
      errors.push(rule.message || error)
    }
  }

  return {
    field,
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate multiple fields.
 *
 * @param data - Object with field values
 * @param rules - Object mapping field names to rule strings
 * @returns Object with errors per field (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateFields(
 *   { email: 'test', password: '123' },
 *   { email: 'required|email', password: 'required|min:8' }
 * )
 * // => { email: ['The email field must be a valid email address.'], password: ['The password field must be at least 8 characters.'] }
 * ```
 */
export function validateFields(
  data: Record<string, any>,
  rules: Record<string, string>,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {}

  for (const [field, fieldRules] of Object.entries(rules)) {
    const result = validateField(field, data[field], fieldRules, data)
    if (!result.valid) {
      errors[field] = result.errors
    }
  }

  return errors
}

/**
 * Process @validate directive.
 * Adds validation attributes to the next form element.
 *
 * Usage:
 * ```html
 * @validate('email', 'required|email|max:255')
 * @input('email')
 *
 * @validate('password', 'required|min:8', { message: 'Password too short' })
 * @input('password', '', { type: 'password' })
 * ```
 */
export function processValidateDirective(
  template: string,
  _context: Record<string, any>,
): string {
  // Process @validate directive - adds HTML5 validation attributes
  return template.replace(
    /@validate\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]*)\})?\s*\)/g,
    (_match, field, rules, _options) => {
      const ruleList = rules.split('|').map((r: string) => r.trim())
      const attrs: string[] = []

      for (const ruleStr of ruleList) {
        const rule = parseValidationRule(ruleStr)

        // Map validation rules to HTML5 attributes
        switch (rule.name) {
          case 'required':
            attrs.push('required')
            break
          case 'email':
            attrs.push('type="email"')
            break
          case 'url':
            attrs.push('type="url"')
            break
          case 'numeric':
          case 'integer':
            attrs.push('type="number"')
            if (rule.name === 'integer') {
              attrs.push('step="1"')
            }
            break
          case 'min':
            if (rule.params?.[0]) {
              attrs.push(`minlength="${rule.params[0]}"`)
            }
            break
          case 'max':
            if (rule.params?.[0]) {
              attrs.push(`maxlength="${rule.params[0]}"`)
            }
            break
          case 'regex':
            if (rule.params?.[0]) {
              attrs.push(`pattern="${rule.params[0]}"`)
            }
            break
        }
      }

      // Return a data attribute with the rules and HTML5 attrs as a comment
      // This allows the following input to pick up these attributes
      return `<!-- @validate:${field}:${rules} -->${attrs.length > 0 ? `<!-- attrs:${attrs.join(' ')} -->` : ''}`
    },
  )
}

// =============================================================================
// Enhanced Validation System
// =============================================================================

/**
 * Enhanced validation rule definition with HTML5 support
 */
export interface EnhancedValidationRule {
  /** Rule name */
  name: string
  /** Validation function - returns true if valid, error message if invalid */
  validate: (value: unknown, params: string[], allValues: Record<string, unknown>) => true | string
  /** HTML5 attribute generator */
  toHtml5?: (params: string[]) => string[]
  /** Default error message with {{param}} placeholders */
  message: string
}

/**
 * Enhanced validation rules registry with full validation support
 */
export const enhancedValidationRules: Record<string, EnhancedValidationRule> = {
  required: {
    name: 'required',
    validate: (value) => {
      if (value === null || value === undefined || value === '')
        return 'This field is required'
      if (Array.isArray(value) && value.length === 0)
        return 'This field is required'
      return true
    },
    toHtml5: () => ['required'],
    message: 'This field is required',
  },

  email: {
    name: 'email',
    validate: (value) => {
      if (!value)
        return true // Use required rule for empty check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(String(value)) || 'Please enter a valid email address'
    },
    toHtml5: () => ['type="email"'],
    message: 'Please enter a valid email address',
  },

  url: {
    name: 'url',
    validate: (value) => {
      if (!value)
        return true
      try {
        const url = new URL(String(value))
        return url.protocol.startsWith('http') || 'Please enter a valid URL'
      }
      catch {
        return 'Please enter a valid URL'
      }
    },
    toHtml5: () => ['type="url"'],
    message: 'Please enter a valid URL',
  },

  numeric: {
    name: 'numeric',
    validate: (value) => {
      if (!value)
        return true
      return !Number.isNaN(Number(value)) || 'Please enter a number'
    },
    toHtml5: () => ['type="number"'],
    message: 'Please enter a number',
  },

  integer: {
    name: 'integer',
    validate: (value) => {
      if (!value)
        return true
      const num = Number(value)
      return (Number.isInteger(num)) || 'Please enter a whole number'
    },
    toHtml5: () => ['type="number"', 'step="1"'],
    message: 'Please enter a whole number',
  },

  alpha: {
    name: 'alpha',
    validate: (value) => {
      if (!value)
        return true
      return /^[a-z]+$/i.test(String(value)) || 'Please enter only letters'
    },
    toHtml5: () => ['pattern="[a-zA-Z]+"'],
    message: 'Please enter only letters',
  },

  alphanumeric: {
    name: 'alphanumeric',
    validate: (value) => {
      if (!value)
        return true
      return /^[a-z0-9]+$/i.test(String(value)) || 'Please enter only letters and numbers'
    },
    toHtml5: () => ['pattern="[a-zA-Z0-9]+"'],
    message: 'Please enter only letters and numbers',
  },

  min: {
    name: 'min',
    validate: (value, params) => {
      if (!value)
        return true
      const min = Number(params[0])
      if (typeof value === 'string')
        return value.length >= min || `Must be at least ${min} characters`
      if (typeof value === 'number')
        return value >= min || `Must be at least ${min}`
      if (Array.isArray(value))
        return value.length >= min || `Must have at least ${min} items`
      return true
    },
    toHtml5: params => [`minlength="${params[0]}"`, `min="${params[0]}"`],
    message: 'Must be at least {{param}} characters',
  },

  max: {
    name: 'max',
    validate: (value, params) => {
      if (!value)
        return true
      const max = Number(params[0])
      if (typeof value === 'string')
        return value.length <= max || `Must be no more than ${max} characters`
      if (typeof value === 'number')
        return value <= max || `Must be no more than ${max}`
      if (Array.isArray(value))
        return value.length <= max || `Must have no more than ${max} items`
      return true
    },
    toHtml5: params => [`maxlength="${params[0]}"`, `max="${params[0]}"`],
    message: 'Must be no more than {{param}} characters',
  },

  between: {
    name: 'between',
    validate: (value, params) => {
      if (!value)
        return true
      const [min, max] = params.map(Number)
      if (typeof value === 'string')
        return (value.length >= min && value.length <= max) || `Must be between ${min} and ${max} characters`
      if (typeof value === 'number')
        return (value >= min && value <= max) || `Must be between ${min} and ${max}`
      return true
    },
    toHtml5: params => [`minlength="${params[0]}"`, `maxlength="${params[1]}"`],
    message: 'Must be between {{min}} and {{max}}',
  },

  confirmed: {
    name: 'confirmed',
    validate: (value, _params, allValues) => {
      // Find the confirmation field (assumes fieldName_confirmation naming)
      const fieldNames = Object.keys(allValues)
      for (const key of fieldNames) {
        if (key.endsWith('_confirmation') && allValues[key] === value)
          return true
      }
      return 'Confirmation does not match'
    },
    message: 'Confirmation does not match',
  },

  in: {
    name: 'in',
    validate: (value, params) => {
      if (!value)
        return true
      return params.includes(String(value)) || `Must be one of: ${params.join(', ')}`
    },
    message: 'Must be one of: {{values}}',
  },

  notIn: {
    name: 'notIn',
    validate: (value, params) => {
      if (!value)
        return true
      return !params.includes(String(value)) || `Must not be: ${params.join(', ')}`
    },
    message: 'Must not be: {{values}}',
  },

  regex: {
    name: 'regex',
    validate: (value, params) => {
      if (!value)
        return true
      try {
        const regex = new RegExp(params[0])
        return regex.test(String(value)) || 'Invalid format'
      }
      catch {
        return 'Invalid format'
      }
    },
    toHtml5: params => [`pattern="${params[0]}"`],
    message: 'Invalid format',
  },

  date: {
    name: 'date',
    validate: (value) => {
      if (!value)
        return true
      const date = new Date(String(value))
      return !Number.isNaN(date.getTime()) || 'Please enter a valid date'
    },
    toHtml5: () => ['type="date"'],
    message: 'Please enter a valid date',
  },

  before: {
    name: 'before',
    validate: (value, params) => {
      if (!value)
        return true
      const inputDate = new Date(String(value))
      const beforeDate = new Date(params[0])
      return inputDate < beforeDate || `Must be before ${params[0]}`
    },
    toHtml5: params => [`max="${params[0]}"`],
    message: 'Must be before {{date}}',
  },

  after: {
    name: 'after',
    validate: (value, params) => {
      if (!value)
        return true
      const inputDate = new Date(String(value))
      const afterDate = new Date(params[0])
      return inputDate > afterDate || `Must be after ${params[0]}`
    },
    toHtml5: params => [`min="${params[0]}"`],
    message: 'Must be after {{date}}',
  },

  size: {
    name: 'size',
    validate: (value, params) => {
      if (!value)
        return true
      const size = Number(params[0])
      if (typeof value === 'string')
        return value.length === size || `Must be exactly ${size} characters`
      if (Array.isArray(value))
        return value.length === size || `Must have exactly ${size} items`
      return true
    },
    message: 'Must be exactly {{size}}',
  },

  phone: {
    name: 'phone',
    validate: (value) => {
      if (!value)
        return true
      // Basic international phone regex
      const phoneRegex = /^\+?\(?\d{1,4}\)?[-\s./\d]*$/
      return phoneRegex.test(String(value)) || 'Please enter a valid phone number'
    },
    toHtml5: () => ['type="tel"', 'pattern="\\+?\\(?\\d{1,4}\\)?[-\\s./\\d]*"'],
    message: 'Please enter a valid phone number',
  },
}

/**
 * Register a custom enhanced validation rule
 */
export function registerEnhancedValidationRule(rule: EnhancedValidationRule): void {
  enhancedValidationRules[rule.name] = rule
}

/**
 * Validate a single value against enhanced rules
 */
export function validateValueEnhanced(
  value: unknown,
  rules: string,
  allValues: Record<string, unknown> = {},
): { valid: boolean, errors: string[] } {
  const errors: string[] = []
  const ruleList = rules.split('|').map(r => r.trim())

  for (const ruleStr of ruleList) {
    const parsed = parseValidationRule(ruleStr)
    const ruleDef = enhancedValidationRules[parsed.name]

    if (!ruleDef) {
      console.warn(`Unknown validation rule: ${parsed.name}`)
      continue
    }

    const result = ruleDef.validate(value, parsed.params || [], allValues)
    if (result !== true) {
      errors.push(result)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate multiple values with enhanced validation
 */
export function validateFormEnhanced(
  values: Record<string, unknown>,
  rules: Record<string, string>,
): { valid: boolean, errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {}
  let valid = true

  for (const [field, fieldRules] of Object.entries(rules)) {
    const result = validateValueEnhanced(values[field], fieldRules, values)
    if (!result.valid) {
      valid = false
      errors[field] = result.errors
    }
  }

  return { valid, errors }
}

/**
 * Generate client-side validation script for a form
 */
export function generateValidationScript(formId: string, rules: Record<string, string>): string {
  const rulesJson = JSON.stringify(rules)

  return `
<script>
(function() {
  const form = document.getElementById('${formId}');
  if (!form) return;

  const rules = ${rulesJson};
  const validators = {
    required: (v) => v !== null && v !== undefined && v !== '' ? true : 'This field is required',
    email: (v) => !v || /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v) ? true : 'Please enter a valid email',
    url: (v) => { if (!v) return true; try { new URL(v); return true; } catch { return 'Please enter a valid URL'; } },
    numeric: (v) => !v || !isNaN(Number(v)) ? true : 'Please enter a number',
    integer: (v) => !v || Number.isInteger(Number(v)) ? true : 'Please enter a whole number',
    min: (v, p) => !v || (typeof v === 'string' ? v.length >= p : v >= p) ? true : 'Too short/small',
    max: (v, p) => !v || (typeof v === 'string' ? v.length <= p : v <= p) ? true : 'Too long/large',
    regex: (v, p) => !v || new RegExp(p).test(v) ? true : 'Invalid format',
  };

  form.addEventListener('submit', function(e) {
    let valid = true;
    const errors = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      const input = form.querySelector('[name="' + field + '"]');
      if (!input) continue;

      const value = input.value;
      const ruleList = fieldRules.split('|');

      for (const rule of ruleList) {
        const [name, param] = rule.split(':');
        const validator = validators[name];
        if (validator) {
          const result = validator(value, param);
          if (result !== true) {
            valid = false;
            errors[field] = errors[field] || [];
            errors[field].push(result);
            input.classList.add('is-invalid');
            break;
          }
        }
      }
    }

    if (!valid) {
      e.preventDefault();
      console.log('Validation errors:', errors);
    }
  });
})();
</script>`.trim()
}
