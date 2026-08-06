import type { PropSchema, ValidationResult } from '../../utils/prop-validation'
import { createPropValidator, PropTypes } from '../../utils/prop-validation'

export { default as Form } from './Form.stx'

export interface FieldSchema {
  required?: boolean
  requiredMessage?: string
  minLength?: number
  minLengthMessage?: string
  maxLength?: number
  maxLengthMessage?: string
  pattern?: RegExp
  patternMessage?: string
  validate?: (value: any, values: Record<string, any>) => string | null | undefined
}

export interface ValidationSchema {
  [fieldName: string]: FieldSchema
}

/**
 * Passed as the second argument of the `submit` event.
 *
 * These names are the ones the component actually exposes. Before #1874 the type
 * named `setValues` and `resetForm` while the component implemented `setErrors`
 * and `reset` and had no `setValues` at all, so destructuring this shape gave you
 * two undefined functions.
 */
export interface FormHelpers {
  setErrors: (errors: Record<string, string>) => void
  setValues: (values: Record<string, any>) => void
  resetForm: (form?: HTMLFormElement) => void
}

export interface FormProps {
  action?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  validationSchema?: ValidationSchema
  /** Seeds the form's values, fills gaps in the submitted payload, and is what resetForm() restores to. */
  initialValues?: Record<string, any>
  /** Validate a field as it is typed into. Delegated from the form's `input` event. */
  validateOnChange?: boolean
  /** Validate a field when it loses focus. Delegated from the form's `focusout` event. */
  validateOnBlur?: boolean
  /**
   * Bound as the `submit` EVENT, not as a callback prop: `<Form @submit="…">`.
   * Receives (values, helpers). stx components communicate upward through
   * defineEmits, so there is no prop-callback channel to pass a function down.
   */
  onSubmit?: (values: Record<string, any>, helpers: FormHelpers) => void | Promise<void>
  /** Bound as the `error` EVENT: `<Form @error="…">`. Receives the error map. */
  onError?: (errors: Record<string, string> | Error) => void
  className?: string
}

export interface FieldProps {
  name: string
  value: any
  error?: string
  touched?: boolean
  onChange: (event: Event) => void
  onBlur: (event: Event) => void
}

/**
 * Form prop validation schema
 */
export const formPropSchema: PropSchema = {
  action: PropTypes.string,
  method: PropTypes.oneOf(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  validationSchema: PropTypes.object,
  initialValues: PropTypes.object,
  validateOnChange: PropTypes.boolean,
  validateOnBlur: PropTypes.boolean,
  onSubmit: PropTypes.func,
  onError: PropTypes.func,
  className: PropTypes.string,
}

/**
 * Validate Form component props
 */
export const validateFormProps: (props: Record<string, any>) => ValidationResult = createPropValidator('Form', formPropSchema)
