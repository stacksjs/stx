/**
 * Runtime prop validation utilities for component development
 *
 * Provides development-only warnings for invalid prop values with clear,
 * actionable error messages.
 *
 * @example
 * ```ts
 * import { validateProps, PropTypes } from '@stacksjs/components'
 *
 * // Define prop schema
 * const schema = {
 *   size: PropTypes.oneOf(['sm', 'md', 'lg']),
 *   count: PropTypes.number.required,
 *   onClick: PropTypes.func,
 *   user: PropTypes.shape({
 *     name: PropTypes.string.required,
 *     age: PropTypes.number
 *   })
 * }
 *
 * // Validate props
 * validateProps('Button', props, schema)
 * ```
 */

/**
 * Environment check - only validate in development
 */
const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

/**
 * Prop validator function type
 */
export interface PropValidator<T = any> {
  /** Validator function */
  validate: (value: any, propName: string, componentName: string) => boolean
  /** Error message generator */
  message: (value: any, propName: string, componentName: string) => string
  /** Whether this prop is required */
  isRequired?: boolean
}

/**
 * Base validator class
 */
class Validator<T = any> implements PropValidator<T> {
  constructor(
    public validate: (value: any, propName: string, componentName: string) => boolean,
    public message: (value: any, propName: string, componentName: string) => string,
    public isRequired = false,
  ) {}

  /**
   * Mark this validator as required
   */
  get required(): Validator<T> {
    return new Validator(this.validate, this.message, true)
  }
}

/**
 * PropTypes - collection of common validators
 */
export const PropTypes = {
  /**
   * String type validator
   */
  string: new Validator(
    value => typeof value === 'string',
    (value, propName, componentName) =>
      `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected \`string\`.`,
  ),

  /**
   * Number type validator
   */
  number: new Validator(
    value => typeof value === 'number' && !Number.isNaN(value),
    (value, propName, componentName) =>
      `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected \`number\`.`,
  ),

  /**
   * Boolean type validator
   */
  boolean: new Validator(
    value => typeof value === 'boolean',
    (value, propName, componentName) =>
      `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected \`boolean\`.`,
  ),

  /**
   * Function type validator
   */
  func: new Validator(
    value => typeof value === 'function',
    (value, propName, componentName) =>
      `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected \`function\`.`,
  ),

  /**
   * Object type validator
   */
  object: new Validator(
    value => typeof value === 'object' && value !== null && !Array.isArray(value),
    (value, propName, componentName) =>
      `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected \`object\`.`,
  ),

  /**
   * Array type validator
   */
  array: new Validator(
    value => Array.isArray(value),
    (value, propName, componentName) =>
      `Invalid prop \`${propName}\` of type \`${typeof value}\` supplied to \`${componentName}\`, expected \`array\`.`,
  ),

  /**
   * Any type validator (always passes)
   */
  any: new Validator(
    () => true,
    () => '',
  ),

  /**
   * OneOf validator - value must be one of specified options
   *
   * @param validValues - Array of valid values
   */
  oneOf<T>(validValues: T[]): Validator<T> {
    return new Validator(
      value => validValues.includes(value),
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` of value \`${value}\` supplied to \`${componentName}\`, expected one of [${validValues.map(v => JSON.stringify(v)).join(', ')}].`,
    )
  },

  /**
   * OneOfType validator - value must match one of specified types
   *
   * @param validators - Array of validators
   */
  oneOfType(validators: Validator[]): Validator {
    return new Validator(
      (value, propName, componentName) =>
        validators.some(v => v.validate(value, propName, componentName)),
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`, expected one of the specified types.`,
    )
  },

  /**
   * ArrayOf validator - all array elements must match type
   *
   * @param validator - Validator for array elements
   */
  arrayOf(validator: Validator): Validator {
    return new Validator(
      (value, propName, componentName) => {
        if (!Array.isArray(value))
          return false
        return value.every((item, index) => validator.validate(item, `${propName}[${index}]`, componentName))
      },
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`, expected array of specified type.`,
    )
  },

  /**
   * Shape validator - object must match specified shape
   *
   * @param shape - Object shape definition
   */
  shape(shape: Record<string, Validator>): Validator {
    return new Validator(
      (value, propName, componentName) => {
        if (typeof value !== 'object' || value === null || Array.isArray(value))
          return false

        // Check all required fields
        for (const [key, validator] of Object.entries(shape)) {
          if (validator.isRequired && !(key in value))
            return false

          if (key in value && !validator.validate(value[key], `${propName}.${key}`, componentName))
            return false
        }

        return true
      },
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`, expected object matching specified shape.`,
    )
  },

  /**
   * InstanceOf validator - value must be instance of class
   *
   * @param expectedClass - Expected class constructor
   */
  instanceOf<T>(expectedClass: new (...args: any[]) => T): Validator<T> {
    return new Validator(
      value => value instanceof expectedClass,
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`, expected instance of \`${expectedClass.name}\`.`,
    )
  },

  /**
   * Custom validator
   *
   * @param validatorFn - Custom validation function
   * @param errorMessage - Error message or message generator
   */
  custom(
    validatorFn: (value: any, propName: string, componentName: string) => boolean,
    errorMessage: string | ((value: any, propName: string, componentName: string) => string),
  ): Validator {
    const messageGenerator = typeof errorMessage === 'string'
      ? () => errorMessage
      : errorMessage

    return new Validator(validatorFn, messageGenerator)
  },

  /**
   * Min validator for numbers
   *
   * @param min - Minimum value (inclusive)
   */
  min(min: number): Validator<number> {
    return new Validator(
      value => typeof value === 'number' && value >= min,
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` of value \`${value}\` supplied to \`${componentName}\`, expected value >= ${min}.`,
    )
  },

  /**
   * Max validator for numbers
   *
   * @param max - Maximum value (inclusive)
   */
  max(max: number): Validator<number> {
    return new Validator(
      value => typeof value === 'number' && value <= max,
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` of value \`${value}\` supplied to \`${componentName}\`, expected value <= ${max}.`,
    )
  },

  /**
   * Range validator for numbers
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   */
  range(min: number, max: number): Validator<number> {
    return new Validator(
      value => typeof value === 'number' && value >= min && value <= max,
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` of value \`${value}\` supplied to \`${componentName}\`, expected value between ${min} and ${max}.`,
    )
  },

  /**
   * Pattern validator for strings
   *
   * @param pattern - Regular expression pattern
   */
  pattern(pattern: RegExp): Validator<string> {
    return new Validator(
      value => typeof value === 'string' && pattern.test(value),
      (value, propName, componentName) =>
        `Invalid prop \`${propName}\` of value \`${value}\` supplied to \`${componentName}\`, expected value matching pattern ${pattern}.`,
    )
  },

  /**
   * Email validator
   */
  email: new Validator(
    value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    (value, propName, componentName) =>
      `Invalid prop \`${propName}\` of value \`${value}\` supplied to \`${componentName}\`, expected valid email address.`,
  ),

  /**
   * URL validator
   */
  url: new Validator(
    (value) => {
      if (typeof value !== 'string')
        return false
      try {
        new URL(value)
        return true
      }
      catch {
        return false
      }
    },
    (value, propName, componentName) =>
      `Invalid prop \`${propName}\` of value \`${value}\` supplied to \`${componentName}\`, expected valid URL.`,
  ),
}

/**
 * Prop schema definition
 */
export type PropSchema = Record<string, Validator>

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean
  /** Array of error messages */
  errors: string[]
}

/**
 * Validate props against schema
 *
 * @param componentName - Name of component being validated
 * @param props - Props object to validate
 * @param schema - Prop schema definition
 * @param options - Validation options
 * @returns Validation result
 */
export function validateProps(
  componentName: string,
  props: Record<string, any>,
  schema: PropSchema,
  options: {
    /** Whether to throw on validation failure (default: false) */
    throwOnError?: boolean
    /** Whether to log warnings to console (default: true in dev) */
    logWarnings?: boolean
  } = {},
): ValidationResult {
  const { throwOnError = false, logWarnings = isDevelopment } = options
  const errors: string[] = []

  // Skip validation in production
  if (!isDevelopment) {
    return { valid: true, errors: [] }
  }

  // Check each prop in schema
  for (const [propName, validator] of Object.entries(schema)) {
    const propValue = props[propName]
    const isUndefined = propValue === undefined

    // Check required props
    if (validator.isRequired && isUndefined) {
      const error = `Required prop \`${propName}\` was not specified in \`${componentName}\`.`
      errors.push(error)
      continue
    }

    // Skip validation if prop is undefined and not required
    if (isUndefined)
      continue

    // Run validator
    if (!validator.validate(propValue, propName, componentName)) {
      const error = validator.message(propValue, propName, componentName)
      errors.push(error)
    }
  }

  // Handle errors
  if (errors.length > 0) {
    if (logWarnings) {
      console.group(`⚠️  Prop validation failed for \`${componentName}\``)
      errors.forEach(error => console.warn(error))
      console.groupEnd()
    }

    if (throwOnError) {
      throw new Error(`Prop validation failed for \`${componentName}\`:\n${errors.join('\n')}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create a prop validator function for a component
 *
 * @param componentName - Name of component
 * @param schema - Prop schema definition
 * @returns Validator function
 *
 * @example
 * ```ts
 * const validateButtonProps = createPropValidator('Button', {
 *   size: PropTypes.oneOf(['sm', 'md', 'lg']),
 *   disabled: PropTypes.boolean,
 *   onClick: PropTypes.func.required
 * })
 *
 * // In component
 * validateButtonProps(props)
 * ```
 */
export function createPropValidator(
  componentName: string,
  schema: PropSchema,
  options?: { throwOnError?: boolean, logWarnings?: boolean },
) {
  return (props: Record<string, any>) => validateProps(componentName, props, schema, options)
}

/**
 * Assert that a value matches a validator
 *
 * @param value - Value to validate
 * @param validator - Validator to use
 * @param name - Name for error messages
 * @throws Error if validation fails
 */
export function assertProp<T>(value: any, validator: Validator<T>, name = 'value'): asserts value is T {
  if (!isDevelopment)
    return

  if (!validator.validate(value, name, 'assertion')) {
    throw new Error(validator.message(value, name, 'assertion'))
  }
}

/**
 * Warn if prop doesn't match validator (non-throwing)
 *
 * @param value - Value to validate
 * @param validator - Validator to use
 * @param name - Name for warning messages
 */
export function warnProp(value: any, validator: Validator, name = 'value'): void {
  if (!isDevelopment)
    return

  if (!validator.validate(value, name, 'warning')) {
    console.warn(validator.message(value, name, 'warning'))
  }
}
