export { default as Checkbox } from './Checkbox.stx'

export interface CheckboxProps {
  /** Use the host browser's native switch while retaining checkbox semantics. */
  appearance?: 'checkbox' | 'switch'
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
