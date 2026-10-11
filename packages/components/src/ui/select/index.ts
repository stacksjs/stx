export { default as Select } from './Select.stx'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps {
  /** Two-way with `v-model:value`; `change` is still emitted. */
  value?: string | number
  onChange?: (value: string | number) => void
  /**
   * Static or bound from client data; re-renders when the list changes. A
   * bare string or number is its own value and label. Options may also be
   * passed as `<option>` children.
   */
  options?: Array<SelectOption | string | number>
  /** `''` renders no placeholder option. */
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  error?: boolean
  label?: string
  helperText?: string
  required?: boolean
  className?: string
}
