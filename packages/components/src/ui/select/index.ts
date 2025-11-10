export { default as Select } from './Select.stx'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps {
  value?: string | number
  onChange?: (value: string | number) => void
  options?: SelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  error?: boolean
  label?: string
  helperText?: string
  required?: boolean
  className?: string
}
