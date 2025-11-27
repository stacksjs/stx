/**
 * Module for processing form-related directives.
 *
 * Provides directives for building accessible, validated forms:
 * - `@csrf` - CSRF token hidden input
 * - `@method('PUT')` - HTTP method spoofing
 * - `@form` / `@endform` - Form wrapper with auto CSRF
 * - `@input`, `@textarea`, `@select` - Form controls with validation
 * - `@checkbox`, `@radio` - Check inputs with state binding
 * - `@label` - Associated labels
 * - `@error` / `@enderror` - Validation error display
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
 * 1. Basic directives (@csrf, @method)
 * 2. Form input directives (@form, @input, @textarea, etc.)
 * 3. Validation directives (@error)
 */
export function processForms(
  template: string,
  context: Record<string, any>,
  _filePath: string,
  options: StxOptions,
): string {
  const classes = getFormClasses(options)
  let output = template

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

            // For other expressions, try to evaluate them
            // eslint-disable-next-line no-new-func
            const evalFn = new Function(...Object.keys(context), `
              try { return ${expr.trim()}; } catch (e) { return '${expr.trim()}'; }
            `)
            return evalFn(...Object.values(context))
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
