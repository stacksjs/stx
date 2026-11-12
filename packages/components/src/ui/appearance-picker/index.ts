export { default as AppearancePicker } from './AppearancePicker.stx'

export type AppearanceChoice = 'light' | 'dark' | 'auto'

/** A choice to offer, renamed. A bare mode keeps its English name. */
export interface AppearanceOption {
  value: AppearanceChoice
  label?: string
}

export interface AppearancePickerProps {
  /** The choice. `v-model:value`. Default `auto`. */
  value?: AppearanceChoice
  /** Which choices to offer, in order, and what to call them. Default all three. */
  options?: Array<AppearanceOption | AppearanceChoice>
  /** The accessible name of the group. Left out inside a `<SettingsRow>`, the row's label names it. */
  label?: string
  disabled?: boolean
  id?: string
  className?: string
  onChange?: (value: AppearanceChoice) => void
}
