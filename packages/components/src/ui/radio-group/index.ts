export { default as RadioGroup } from './RadioGroup.stx'
export { default as RadioGroupLabel } from './RadioGroupLabel.stx'
export { default as RadioGroupOption } from './RadioGroupOption.stx'
export { default as RadioGroupDescription } from './RadioGroupDescription.stx'

export interface RadioGroupProps {
  value?: any
  onChange?: (value: any) => void
  className?: string
  as?: string
}

export interface RadioGroupLabelProps {
  className?: string
  as?: string
}

export interface RadioGroupOptionProps {
  value: any
  disabled?: boolean
  className?: string
  as?: string
  currentValue?: any
  onChange?: (value: any) => void
}

export interface RadioGroupDescriptionProps {
  className?: string
  as?: string
}
