export { default as RadioGroup } from './RadioGroup.stx'
export { default as RadioGroupDescription } from './RadioGroupDescription.stx'
export { default as RadioGroupLabel } from './RadioGroupLabel.stx'
export { default as RadioGroupOption } from './RadioGroupOption.stx'

export interface RadioGroupProps {
  value?: any
  onChange?: (value: any) => void
  className?: string
  as?: string
  /** `'mac'` draws Mac radio buttons from the `--stx-mac-*` tokens. Child options take it too. */
  variant?: 'mac'
}

export interface RadioGroupLabelProps {
  className?: string
  as?: string
}

export interface RadioGroupOptionProps {
  value: any
  disabled?: boolean
  /** `'mac'` draws the Mac radio button; set it on the group as well. */
  variant?: 'mac'
  className?: string
  as?: string
  currentValue?: any
  onChange?: (value: any) => void
}

export interface RadioGroupDescriptionProps {
  className?: string
  as?: string
}
