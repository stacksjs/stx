/**
 * STX Form Validation
 *
 * A simple, chainable form validation API.
 *
 * @example
 * ```typescript
 * import { defineForm, v } from 'stx'
 *
 * const form = defineForm({
 *   email: v.required().email(),
 *   password: v.required().min(8),
 *   age: v.number().between(18, 100)
 * })
 * ```
 */

// =============================================================================
// Types
// =============================================================================

type ValidatorFn = (value: unknown, formValues?: Record<string, unknown>) => true | string
type AsyncValidatorFn = (value: unknown, formValues?: Record<string, unknown>) => Promise<true | string>

interface ValidatorRule {
  name: string
  validate: ValidatorFn | AsyncValidatorFn
  message: string
  async?: boolean
}

interface FieldState {
  value: unknown
  errors: string[]
  touched: boolean
  dirty: boolean
  valid: boolean
  validating: boolean
}

interface FormState<T extends Record<string, Validator>> {
  values: { [K in keyof T]: unknown }
  errors: { [K in keyof T]: string[] }
  touched: { [K in keyof T]: boolean }
  dirty: { [K in keyof T]: boolean }
  isValid: boolean
  isValidating: boolean
  isDirty: boolean
  validate: () => Promise<boolean>
  validateField: (field: keyof T) => Promise<boolean>
  reset: () => void
  setValues: (values: Partial<{ [K in keyof T]: unknown }>) => void
  setFieldValue: (field: keyof T, value: unknown) => void
  setFieldTouched: (field: keyof T, touched?: boolean) => void
  getFieldState: (field: keyof T) => FieldState
  handleSubmit: (onSubmit: (values: { [K in keyof T]: unknown }) => void | Promise<void>) => (e?: Event) => Promise<void>
}

// =============================================================================
// Validator Class
// =============================================================================

class Validator {
  private rules: ValidatorRule[] = []
  private defaultValue: unknown = ''

  private addRule(rule: ValidatorRule): Validator {
    const next = new Validator()
    next.rules = [...this.rules, rule]
    next.defaultValue = this.defaultValue
    return next
  }

  // ---------------------------------------------------------------------------
  // Core Validators
  // ---------------------------------------------------------------------------

  /** Field is required */
  required(message = 'This field is required'): Validator {
    return this.addRule({
      name: 'required',
      message,
      validate: (value) => {
        if (value === null || value === undefined) return message
        if (typeof value === 'string' && value.trim() === '') return message
        if (Array.isArray(value) && value.length === 0) return message
        return true
      }
    })
  }

  // ---------------------------------------------------------------------------
  // String Validators
  // ---------------------------------------------------------------------------

  /** Must be a valid email */
  email(message = 'Please enter a valid email'): Validator {
    return this.addRule({
      name: 'email',
      message,
      validate: (value) => {
        if (!value) return true // Let required() handle empty
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return pattern.test(String(value)) || message
      }
    })
  }

  /** Must be a valid URL */
  url(message = 'Please enter a valid URL'): Validator {
    return this.addRule({
      name: 'url',
      message,
      validate: (value) => {
        if (!value) return true
        try {
          new URL(String(value))
          return true
        }
        catch {
          return message
        }
      }
    })
  }

  /** Minimum length */
  min(length: number, message?: string): Validator {
    const msg = message || `Must be at least ${length} characters`
    return this.addRule({
      name: 'min',
      message: msg,
      validate: (value) => {
        if (!value) return true
        return String(value).length >= length || msg
      }
    })
  }

  /** Maximum length */
  max(length: number, message?: string): Validator {
    const msg = message || `Must be no more than ${length} characters`
    return this.addRule({
      name: 'max',
      message: msg,
      validate: (value) => {
        if (!value) return true
        return String(value).length <= length || msg
      }
    })
  }

  /** Length between min and max */
  length(min: number, max: number, message?: string): Validator {
    const msg = message || `Must be between ${min} and ${max} characters`
    return this.addRule({
      name: 'length',
      message: msg,
      validate: (value) => {
        if (!value) return true
        const len = String(value).length
        return (len >= min && len <= max) || msg
      }
    })
  }

  /** Must match a regex pattern */
  pattern(regex: RegExp, message = 'Invalid format'): Validator {
    return this.addRule({
      name: 'pattern',
      message,
      validate: (value) => {
        if (!value) return true
        return regex.test(String(value)) || message
      }
    })
  }

  /** Must contain uppercase letter */
  hasUppercase(message = 'Must contain an uppercase letter'): Validator {
    return this.pattern(/[A-Z]/, message)
  }

  /** Must contain lowercase letter */
  hasLowercase(message = 'Must contain a lowercase letter'): Validator {
    return this.pattern(/[a-z]/, message)
  }

  /** Must contain a number */
  hasNumber(message = 'Must contain a number'): Validator {
    return this.pattern(/\d/, message)
  }

  /** Must contain a special character */
  hasSpecial(message = 'Must contain a special character'): Validator {
    return this.pattern(/[!@#$%^&*(),.?":{}|<>]/, message)
  }

  /** Only alphanumeric characters */
  alphanumeric(message = 'Only letters and numbers allowed'): Validator {
    return this.pattern(/^[a-zA-Z0-9]+$/, message)
  }

  /** Must start with a letter */
  startsWithLetter(message = 'Must start with a letter'): Validator {
    return this.pattern(/^[a-zA-Z]/, message)
  }

  /** No spaces allowed */
  noSpaces(message = 'Spaces are not allowed'): Validator {
    return this.addRule({
      name: 'noSpaces',
      message,
      validate: (value) => {
        if (!value) return true
        return !String(value).includes(' ') || message
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Number Validators
  // ---------------------------------------------------------------------------

  /** Must be a number */
  number(message = 'Must be a number'): Validator {
    const next = this.addRule({
      name: 'number',
      message,
      validate: (value) => {
        if (!value && value !== 0) return true
        return !Number.isNaN(Number(value)) || message
      }
    })
    next.defaultValue = 0
    return next
  }

  /** Must be an integer */
  integer(message = 'Must be a whole number'): Validator {
    return this.addRule({
      name: 'integer',
      message,
      validate: (value) => {
        if (!value && value !== 0) return true
        return Number.isInteger(Number(value)) || message
      }
    })
  }

  /** Must be positive */
  positive(message = 'Must be a positive number'): Validator {
    return this.addRule({
      name: 'positive',
      message,
      validate: (value) => {
        if (!value && value !== 0) return true
        return Number(value) > 0 || message
      }
    })
  }

  /** Must be negative */
  negative(message = 'Must be a negative number'): Validator {
    return this.addRule({
      name: 'negative',
      message,
      validate: (value) => {
        if (!value && value !== 0) return true
        return Number(value) < 0 || message
      }
    })
  }

  /** Minimum value */
  minValue(min: number, message?: string): Validator {
    const msg = message || `Must be at least ${min}`
    return this.addRule({
      name: 'minValue',
      message: msg,
      validate: (value) => {
        if (!value && value !== 0) return true
        return Number(value) >= min || msg
      }
    })
  }

  /** Maximum value */
  maxValue(max: number, message?: string): Validator {
    const msg = message || `Must be no more than ${max}`
    return this.addRule({
      name: 'maxValue',
      message: msg,
      validate: (value) => {
        if (!value && value !== 0) return true
        return Number(value) <= max || msg
      }
    })
  }

  /** Value between min and max */
  between(min: number, max: number, message?: string): Validator {
    const msg = message || `Must be between ${min} and ${max}`
    return this.addRule({
      name: 'between',
      message: msg,
      validate: (value) => {
        if (!value && value !== 0) return true
        const num = Number(value)
        return (num >= min && num <= max) || msg
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Comparison Validators
  // ---------------------------------------------------------------------------

  /** Must match another field's value */
  matches(fieldName: string, message?: string): Validator {
    const msg = message || `Must match ${fieldName}`
    return this.addRule({
      name: 'matches',
      message: msg,
      validate: (value, formValues) => {
        if (!formValues) return true
        return value === formValues[fieldName] || msg
      }
    })
  }

  /** Must be one of the given values */
  oneOf(values: unknown[], message?: string): Validator {
    const msg = message || `Must be one of: ${values.join(', ')}`
    return this.addRule({
      name: 'oneOf',
      message: msg,
      validate: (value) => {
        if (!value) return true
        return values.includes(value) || msg
      }
    })
  }

  /** Must not be one of the given values */
  notOneOf(values: unknown[], message?: string): Validator {
    const msg = message || `Cannot be one of: ${values.join(', ')}`
    return this.addRule({
      name: 'notOneOf',
      message: msg,
      validate: (value) => {
        if (!value) return true
        return !values.includes(value) || msg
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Date Validators
  // ---------------------------------------------------------------------------

  /** Must be a valid date */
  date(message = 'Must be a valid date'): Validator {
    return this.addRule({
      name: 'date',
      message,
      validate: (value) => {
        if (!value) return true
        const date = new Date(String(value))
        return !Number.isNaN(date.getTime()) || message
      }
    })
  }

  /** Must be before a date */
  before(date: Date | string, message?: string): Validator {
    const targetDate = new Date(date)
    const msg = message || `Must be before ${targetDate.toLocaleDateString()}`
    return this.addRule({
      name: 'before',
      message: msg,
      validate: (value) => {
        if (!value) return true
        return new Date(String(value)) < targetDate || msg
      }
    })
  }

  /** Must be after a date */
  after(date: Date | string, message?: string): Validator {
    const targetDate = new Date(date)
    const msg = message || `Must be after ${targetDate.toLocaleDateString()}`
    return this.addRule({
      name: 'after',
      message: msg,
      validate: (value) => {
        if (!value) return true
        return new Date(String(value)) > targetDate || msg
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Custom Validators
  // ---------------------------------------------------------------------------

  /** Custom validation function */
  custom(fn: ValidatorFn, message = 'Invalid value'): Validator {
    return this.addRule({
      name: 'custom',
      message,
      validate: fn
    })
  }

  /** Async custom validation (e.g., API check) */
  async(fn: AsyncValidatorFn, message = 'Invalid value'): Validator {
    return this.addRule({
      name: 'async',
      message,
      async: true,
      validate: fn
    })
  }

  /** Conditional validation */
  when(
    condition: (value: unknown, formValues: Record<string, unknown>) => boolean,
    thenValidator: Validator
  ): Validator {
    const next = new Validator()
    next.rules = [...this.rules]
    next.defaultValue = this.defaultValue

    // Add conditional rules
    for (const rule of thenValidator.getRules()) {
      next.rules.push({
        ...rule,
        validate: (value, formValues) => {
          if (!condition(value, formValues || {})) return true
          return rule.validate(value, formValues)
        }
      })
    }

    return next
  }

  // ---------------------------------------------------------------------------
  // Internal Methods
  // ---------------------------------------------------------------------------

  /** Get all rules */
  getRules(): ValidatorRule[] {
    return this.rules
  }

  /** Get default value for this validator */
  getDefaultValue(): unknown {
    return this.defaultValue
  }

  /** Set default value */
  default(value: unknown): Validator {
    const next = new Validator()
    next.rules = [...this.rules]
    next.defaultValue = value
    return next
  }

  /** Validate a value */
  async validate(value: unknown, formValues?: Record<string, unknown>): Promise<string[]> {
    const errors: string[] = []

    for (const rule of this.rules) {
      const result = await rule.validate(value, formValues)
      if (result !== true) {
        errors.push(result)
      }
    }

    return errors
  }

  /** Validate synchronously (ignores async rules) */
  validateSync(value: unknown, formValues?: Record<string, unknown>): string[] {
    const errors: string[] = []

    for (const rule of this.rules) {
      if (rule.async) continue
      const result = rule.validate(value, formValues) as true | string
      if (result !== true) {
        errors.push(result)
      }
    }

    return errors
  }
}

// =============================================================================
// Validator Entry Point
// =============================================================================

/**
 * Starting point for building validation rules.
 *
 * @example
 * ```typescript
 * v.required().email()
 * v.required().min(8).hasUppercase()
 * v.number().between(1, 100)
 * ```
 */
export const v = new Validator()

// =============================================================================
// Form Definition
// =============================================================================

/**
 * Define a form with validation schema.
 *
 * @example
 * ```typescript
 * const form = defineForm({
 *   email: v.required().email(),
 *   password: v.required().min(8),
 *   age: v.number().between(18, 100)
 * })
 *
 * // Access form state
 * form.values.email
 * form.errors.email
 * form.isValid
 *
 * // Validate
 * await form.validate()
 *
 * // Handle submit
 * form.handleSubmit((values) => {
 *   console.log(values)
 * })
 * ```
 */
export function defineForm<T extends Record<string, Validator>>(
  schema: T,
  initialValues?: Partial<{ [K in keyof T]: unknown }>
): FormState<T> {
  const fields = Object.keys(schema) as (keyof T)[]

  // Initialize state
  const values = {} as { [K in keyof T]: unknown }
  const errors = {} as { [K in keyof T]: string[] }
  const touched = {} as { [K in keyof T]: boolean }
  const dirty = {} as { [K in keyof T]: boolean }
  const validating = {} as { [K in keyof T]: boolean }

  for (const field of fields) {
    values[field] = initialValues?.[field] ?? schema[field].getDefaultValue()
    errors[field] = []
    touched[field] = false
    dirty[field] = false
    validating[field] = false
  }

  let isValidating = false

  // Validate a single field
  async function validateField(field: keyof T): Promise<boolean> {
    validating[field] = true
    const fieldErrors = await schema[field].validate(values[field], values as Record<string, unknown>)
    errors[field] = fieldErrors
    validating[field] = false
    return fieldErrors.length === 0
  }

  // Validate all fields
  async function validate(): Promise<boolean> {
    isValidating = true
    const results = await Promise.all(fields.map(validateField))
    isValidating = false
    return results.every(Boolean)
  }

  // Reset form to initial state
  function reset(): void {
    for (const field of fields) {
      values[field] = initialValues?.[field] ?? schema[field].getDefaultValue()
      errors[field] = []
      touched[field] = false
      dirty[field] = false
    }
  }

  // Set multiple values
  function setValues(newValues: Partial<{ [K in keyof T]: unknown }>): void {
    for (const field of fields) {
      if (field in newValues) {
        values[field] = newValues[field]
        dirty[field] = true
      }
    }
  }

  // Set a single field value
  function setFieldValue(field: keyof T, value: unknown): void {
    values[field] = value
    dirty[field] = true
  }

  // Set field touched state
  function setFieldTouched(field: keyof T, isTouched = true): void {
    touched[field] = isTouched
    if (isTouched) {
      validateField(field)
    }
  }

  // Get field state
  function getFieldState(field: keyof T): FieldState {
    return {
      value: values[field],
      errors: errors[field],
      touched: touched[field],
      dirty: dirty[field],
      valid: errors[field].length === 0,
      validating: validating[field]
    }
  }

  // Handle form submission
  function handleSubmit(
    onSubmit: (values: { [K in keyof T]: unknown }) => void | Promise<void>
  ): (e?: Event) => Promise<void> {
    return async (e?: Event) => {
      e?.preventDefault?.()

      // Mark all fields as touched
      for (const field of fields) {
        touched[field] = true
      }

      const valid = await validate()
      if (valid) {
        await onSubmit(values)
      }
    }
  }

  // Create reactive form state
  const form: FormState<T> = {
    values,
    errors,
    touched,
    dirty,
    get isValid() {
      return fields.every(f => errors[f].length === 0)
    },
    get isValidating() {
      return isValidating || fields.some(f => validating[f])
    },
    get isDirty() {
      return fields.some(f => dirty[f])
    },
    validate,
    validateField,
    reset,
    setValues,
    setFieldValue,
    setFieldTouched,
    getFieldState,
    handleSubmit
  }

  return form
}

// =============================================================================
// Directive Processing
// =============================================================================

/**
 * Process @error directive in templates
 *
 * @example
 * ```html
 * @error(form.email)
 *   <span class="text-red-500">{{ message }}</span>
 * @enderror
 * ```
 */
export function processErrorDirective(
  content: string,
  context: Record<string, unknown>,
  _filePath?: string
): string {
  // Match @error(form.field) ... @enderror
  const errorRegex = /@error\s*\(\s*([^)]+)\s*\)([\s\S]*?)@enderror/g

  return content.replace(errorRegex, (_, fieldPath, body) => {
    try {
      // Parse the field path (e.g., "form.email" or "loginForm.password")
      const parts = fieldPath.trim().split('.')
      let current: unknown = context

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part]
        } else {
          return '' // Field not found, return empty
        }
      }

      // Check if we have errors
      const errors = current as string[] | undefined
      if (!errors || !Array.isArray(errors) || errors.length === 0) {
        return '' // No errors, return empty
      }

      // Render the body for each error
      return errors
        .map((message) => {
          return body.replace(/\{\{\s*message\s*\}\}/g, message)
        })
        .join('\n')
    } catch {
      return '' // Error processing, return empty
    }
  })
}

/**
 * Process @errors directive (shows all errors for a field)
 *
 * @example
 * ```html
 * @errors(form.password)
 *   <li>{{ message }}</li>
 * @enderrors
 * ```
 */
export function processErrorsDirective(
  content: string,
  context: Record<string, unknown>,
  _filePath?: string
): string {
  // Match @errors(form.field) ... @enderrors
  const errorsRegex = /@errors\s*\(\s*([^)]+)\s*\)([\s\S]*?)@enderrors/g

  return content.replace(errorsRegex, (_, fieldPath, body) => {
    try {
      const parts = fieldPath.trim().split('.')
      let current: unknown = context

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part]
        } else {
          return ''
        }
      }

      const errors = current as string[] | undefined
      if (!errors || !Array.isArray(errors) || errors.length === 0) {
        return ''
      }

      return errors
        .map((message) => body.replace(/\{\{\s*message\s*\}\}/g, message))
        .join('\n')
    } catch {
      return ''
    }
  })
}

/**
 * Process @hasErrors directive (conditional block if field has errors)
 *
 * @example
 * ```html
 * @hasErrors(form.email)
 *   <div class="error-container">
 *     ...
 *   </div>
 * @endhasErrors
 * ```
 */
export function processHasErrorsDirective(
  content: string,
  context: Record<string, unknown>,
  _filePath?: string
): string {
  const hasErrorsRegex = /@hasErrors\s*\(\s*([^)]+)\s*\)([\s\S]*?)@endhasErrors/g

  return content.replace(hasErrorsRegex, (_, fieldPath, body) => {
    try {
      const parts = fieldPath.trim().split('.')
      let current: unknown = context

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part]
        } else {
          return ''
        }
      }

      const errors = current as string[] | undefined
      if (!errors || !Array.isArray(errors) || errors.length === 0) {
        return ''
      }

      return body
    } catch {
      return ''
    }
  })
}

/**
 * Process all form validation directives
 */
export function processFormValidationDirectives(
  content: string,
  context: Record<string, unknown>,
  filePath?: string
): string {
  let result = content
  result = processErrorDirective(result, context, filePath)
  result = processErrorsDirective(result, context, filePath)
  result = processHasErrorsDirective(result, context, filePath)
  return result
}

// =============================================================================
// Re-exports
// =============================================================================

export { Validator }
export type { ValidatorFn, AsyncValidatorFn, ValidatorRule, FieldState, FormState }
