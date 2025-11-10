export { default as Listbox } from './Listbox.stx'
export { default as ListboxButton } from './ListboxButton.stx'
export { default as ListboxOptions } from './ListboxOptions.stx'
export { default as ListboxOption } from './ListboxOption.stx'
export { default as ListboxLabel } from './ListboxLabel.stx'

export interface ListboxProps {
  value?: any
  onChange?: (value: any) => void
  multiple?: boolean
  className?: string
  as?: string
}

export interface ListboxButtonProps {
  className?: string
  as?: string
  disabled?: boolean
}

export interface ListboxOptionsProps {
  className?: string
  as?: string
  static?: boolean
}

export interface ListboxOptionProps {
  value: any
  disabled?: boolean
  className?: string
  as?: string
  currentValue?: any
  onChange?: (value: any) => void
}

export interface ListboxLabelProps {
  className?: string
  as?: string
}
