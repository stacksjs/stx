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

export interface FormHelpers {
  setErrors: (errors: Record<string, string>) => void
  setValues: (values: Record<string, any>) => void
  resetForm: () => void
}

export interface FormProps {
  action?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  validationSchema?: ValidationSchema
  initialValues?: Record<string, any>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  onSubmit?: (values: Record<string, any>, helpers: FormHelpers) => void | Promise<void>
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
