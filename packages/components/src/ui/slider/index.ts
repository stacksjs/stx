export * from './core'
export { default as Slider } from './Slider.stx'

export interface SliderProps {
  /** The value. `v-model:value` follows the knob as it moves. */
  value?: number
  /** Default 0. */
  min?: number
  /** Default 100. */
  max?: number
  /** The distance between two values it can hold. Default 1; 0 for any value. */
  step?: number
  /** Tick marks under the track: a count spread evenly, or `true` for one a step. */
  ticks?: number | boolean
  disabled?: boolean
  /** The accessible name. Left out inside a `<SettingsRow>`, the row's label names it. */
  label?: string
  /** An Iconify class drawn at the low end. */
  minIcon?: string
  /** An Iconify class drawn at the high end. */
  maxIcon?: string
  /** What the filled part is drawn with. Default `neutral`. */
  tint?: 'accent' | 'neutral'
  /** A CSS length. Default as wide as it is allowed to be, or 220px in a settings row. */
  width?: string
  /** Submits the value in a form under this name. */
  name?: string
  id?: string
  className?: string
  /** While it moves. */
  onInput?: (value: number) => void
  /** When it is let go, or a key moved it. */
  onChange?: (value: number) => void
}
