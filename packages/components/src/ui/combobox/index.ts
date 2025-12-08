export { default as Combobox } from './Combobox.stx'
export { default as ComboboxButton } from './ComboboxButton.stx'
export { default as ComboboxInput } from './ComboboxInput.stx'
export { default as ComboboxOption } from './ComboboxOption.stx'
export { default as ComboboxOptions } from './ComboboxOptions.stx'

export interface ComboboxProps {
  value?: any
  onChange?: (value: any) => void
  className?: string
  as?: string
}

export interface ComboboxInputProps {
  displayValue?: any
  onChange?: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export interface ComboboxButtonProps {
  className?: string
  as?: string
}

export interface ComboboxOptionsProps {
  className?: string
  as?: string
  static?: boolean
}

export interface ComboboxOptionProps {
  value: any
  disabled?: boolean
  className?: string
  as?: string
  currentValue?: any
  onChange?: (value: any) => void
}
