export { default as DateRangePicker } from './DateRangePicker.stx'

/** A chosen span, as `change` reports it. */
export interface DateRange {
  start: Date | null
  end: Date | null
  /** The preset in days when one was clicked, null for a hand-picked range. */
  preset: number | null
}

export interface DateRangePickerProps {
  start?: Date | string
  end?: Date | string
  /** Preset spans in days. Defaults to `[7, 30, 90]`. */
  presets?: number[]
  placeholder?: string
  locale?: string
  minDate?: Date | string
  maxDate?: Date | string
  align?: 'left' | 'right'
  disabled?: boolean
  className?: string
  onChange?: (range: DateRange) => void
  onOpen?: () => void
  onClose?: () => void
}
