export { default as TextInput } from './TextInput.stx'
export { default as EmailInput } from './EmailInput.stx'
export { default as PasswordInput } from './PasswordInput.stx'
export { default as NumberInput } from './NumberInput.stx'
export { default as SearchInput } from './SearchInput.stx'

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
