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

export interface TextInputProps extends BaseInputProps {
  leftIcon?: string
  rightIcon?: string
  clearable?: boolean
  maxLength?: number
  showCount?: boolean
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
const baseInputPropSchema = {
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
export const textInputPropSchema = {
  ...baseInputPropSchema,
  leftIcon: PropTypes.string,
  rightIcon: PropTypes.string,
  clearable: PropTypes.boolean,
  maxLength: PropTypes.number,
  showCount: PropTypes.boolean,
}

/**
 * NumberInput prop validation schema
 */
export const numberInputPropSchema = {
  ...baseInputPropSchema,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  showControls: PropTypes.boolean,
}

/**
 * Validate TextInput component props
 */
export const validateTextInputProps = createPropValidator('TextInput', textInputPropSchema)

/**
 * Validate EmailInput component props
 */
export const validateEmailInputProps = createPropValidator('EmailInput', baseInputPropSchema)

/**
 * Validate PasswordInput component props
 */
export const validatePasswordInputProps = createPropValidator('PasswordInput', {
  ...baseInputPropSchema,
  showStrength: PropTypes.boolean,
})

/**
 * Validate NumberInput component props
 */
export const validateNumberInputProps = createPropValidator('NumberInput', numberInputPropSchema)

/**
 * Validate SearchInput component props
 */
export const validateSearchInputProps = createPropValidator('SearchInput', {
  ...baseInputPropSchema,
  onSearch: PropTypes.func,
  loading: PropTypes.boolean,
})
