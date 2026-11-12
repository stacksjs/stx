export { default as ColorSwatches } from './ColorSwatches.stx'

/** One colour to choose. A bare string is a colour named after itself. */
export interface ColorSwatchOption {
  value: string
  /** Any CSS colour or gradient. */
  color: string
  /** Its name: read out, and written under it when chosen. Default the value. */
  label?: string
  disabled?: boolean
}

export interface ColorSwatchesProps {
  /** The chosen option's value. `v-model:value`. */
  value?: string
  options: Array<ColorSwatchOption | string>
  /** The accessible name of the group. Left out inside a `<SettingsRow>`, the row's label names it. */
  label?: string
  disabled?: boolean
  /** Write the chosen colour's name under it, and keep room for it. Default true. */
  caption?: boolean
  id?: string
  className?: string
  onChange?: (value: string) => void
}
