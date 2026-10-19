export { default as SegmentedControl } from './SegmentedControl.stx'

/** One choice. A bare string is its own value and label. */
export interface SegmentedControlOption {
  value: string
  label?: string
  /** What a reader hears when the label alone is not enough ("3" -> "3 days"). */
  accessibilityLabel?: string
  disabled?: boolean
}

/**
 * A few mutually exclusive choices in one track, the chosen one raised. The
 * same source renders on the web and on a native host; on a phone the chosen
 * segment is announced as selected.
 */
export interface SegmentedControlProps {
  /** The chosen value. Use `v-model:value`, or `:value` with `@change`. */
  value?: string
  options: Array<string | SegmentedControlOption>
  /** What the choices are of ("Period", "Show"), read before them. */
  label?: string
  /** Fill the width, segments sharing it equally. */
  stretch?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  /** Names the group; each segment is `<testID>-<value>`. */
  testID?: string
  className?: string
  onChange?: (value: string) => void
}
