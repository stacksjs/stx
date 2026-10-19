export { default as ChoiceChips } from './ChoiceChips.stx'

/** One chip. A bare string is its own value and label. */
export interface ChoiceChipOption {
  value: string
  label?: string
  /** Drawn after the label when above zero ("Unread 3"). */
  count?: number
  disabled?: boolean
}

/**
 * One choice from a row of pills that scrolls sideways, for more choices than
 * a segmented control holds. The same source renders on the web and on a
 * native host.
 */
export interface ChoiceChipsProps {
  /** The chosen value. Use `v-model:value`, or `:value` with `@change`. */
  value?: string
  options: Array<string | ChoiceChipOption>
  /** What the choices are of, read before them. */
  label?: string
  /** Names the row; each chip is `<testID>-<value>`. */
  testID?: string
  className?: string
  onChange?: (value: string) => void
}
