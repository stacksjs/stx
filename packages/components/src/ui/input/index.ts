import type { PropSchema, ValidationResult } from '../../utils/prop-validation'
import { createPropValidator, PropTypes } from '../../utils/prop-validation'

export { default as EmailInput } from './EmailInput.stx'
export { default as NumberInput } from './NumberInput.stx'
export { default as PasswordInput } from './PasswordInput.stx'
export { default as SearchInput } from './SearchInput.stx'
export { default as TextInput } from './TextInput.stx'

export interface BaseInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  error?: boolean
  label?: string
  helperText?: string
  required?: boolean
  className?: string
  inputClassName?: string
}

/** The text-like input types `TextInput` renders; anything else is served as `text`. */
export type TextInputType = 'text' | 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'url' | 'tel' | 'color' | 'search' | 'email' | 'number' | 'password'

export interface TextInputProps extends BaseInputProps {
  type?: TextInputType
  leftIcon?: string
  rightIcon?: string
  clearable?: boolean
  maxLength?: number
  maxlength?: number
  minLength?: number
  minlength?: number
  showCount?: boolean
  /** date, time, datetime-local, month, week and number only. */
  min?: string | number
  /** date, time, datetime-local, month, week and number only. */
  max?: string | number
  /** date, time, datetime-local, month, week and number only; `'any'` allowed. */
  step?: string | number
  /** text, search, url, tel, email and password only. */
  pattern?: string
  /** The id of a `<datalist>`; every type but password. */
  list?: string
  /** The HTML `size` attribute (width in characters); `size` is sm / md / lg. */
  htmlSize?: number
  autofocus?: boolean
}

export interface EmailInputProps extends Omit<BaseInputProps, 'placeholder'> {
  placeholder?: string
}

export interface PasswordInputProps extends Omit<BaseInputProps, 'placeholder'> {
  placeholder?: string
  showStrength?: boolean
}

export interface NumberInputProps extends BaseInputProps {
  min?: number
  max?: number
  step?: number
  showControls?: boolean
}

export interface SearchInputProps extends Omit<BaseInputProps, 'placeholder'> {
  placeholder?: string
  onSearch?: (value: string) => void
  loading?: boolean
}

/**
 * Base input prop validation schema
 */
const baseInputPropSchema: PropSchema = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.boolean,
  readonly: PropTypes.boolean,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  error: PropTypes.boolean,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.boolean,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
}

/**
 * TextInput prop validation schema
 */
export const textInputPropSchema: PropSchema = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.boolean,
  readonly: PropTypes.boolean,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  error: PropTypes.boolean,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.boolean,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  leftIcon: PropTypes.string,
  rightIcon: PropTypes.string,
  clearable: PropTypes.boolean,
  maxLength: PropTypes.number,
  showCount: PropTypes.boolean,
  type: PropTypes.oneOf(['text', 'date', 'time', 'datetime-local', 'month', 'week', 'url', 'tel', 'color', 'search', 'email', 'number', 'password']),
  pattern: PropTypes.string,
  list: PropTypes.string,
  minLength: PropTypes.number,
  htmlSize: PropTypes.number,
  autofocus: PropTypes.boolean,
}

/**
 * NumberInput prop validation schema
 */
export const numberInputPropSchema: PropSchema = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.boolean,
  readonly: PropTypes.boolean,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  error: PropTypes.boolean,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.boolean,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  showControls: PropTypes.boolean,
}

/**
 * PasswordInput prop validation schema
 */
const passwordInputPropSchema: PropSchema = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.boolean,
  readonly: PropTypes.boolean,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  error: PropTypes.boolean,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.boolean,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  showStrength: PropTypes.boolean,
}

/**
 * SearchInput prop validation schema
 */
const searchInputPropSchema: PropSchema = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.boolean,
  readonly: PropTypes.boolean,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  error: PropTypes.boolean,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.boolean,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  onSearch: PropTypes.func,
  loading: PropTypes.boolean,
}

/**
 * Validate TextInput component props
 */
export const validateTextInputProps: (props: Record<string, unknown>) => ValidationResult = createPropValidator('TextInput', textInputPropSchema)

/**
 * Validate EmailInput component props
 */
export const validateEmailInputProps: (props: Record<string, unknown>) => ValidationResult = createPropValidator('EmailInput', baseInputPropSchema)

/**
 * Validate PasswordInput component props
 */
export const validatePasswordInputProps: (props: Record<string, unknown>) => ValidationResult = createPropValidator('PasswordInput', passwordInputPropSchema)

/**
 * Validate NumberInput component props
 */
export const validateNumberInputProps: (props: Record<string, unknown>) => ValidationResult = createPropValidator('NumberInput', numberInputPropSchema)

/**
 * Validate SearchInput component props
 */
export const validateSearchInputProps: (props: Record<string, unknown>) => ValidationResult = createPropValidator('SearchInput', searchInputPropSchema)
