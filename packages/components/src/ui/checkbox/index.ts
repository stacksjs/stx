export { default as Checkbox } from './Checkbox.stx'

export interface CheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  indeterminate?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
  error?: boolean
  required?: boolean
  value?: string
  name?: string
  className?: string
}
