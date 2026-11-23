export { default as DateTimePicker } from './DateTimePicker.stx'
export * from './date-time'
import type { DateTimeSelection, DateTimeValue } from './date-time'

export interface DateTimePickerProps {
  value?: DateTimeValue
  /** IANA workspace timezone. Defaults to UTC, never the server's timezone. */
  timeZone?: string
  locale?: string
  minDate?: DateTimeValue
  maxDate?: DateTimeValue
  /** App-owned recommendation shown as “Next best time” when supplied. */
  suggestedTime?: DateTimeValue
  /** Positive divisor of 60; defaults to one minute. */
  minuteStep?: number
  disabled?: boolean
  clearable?: boolean
  label?: string
  placeholder?: string
  className?: string
  onChange?: (selection: DateTimeSelection) => void
  onOpen?: () => void
  onClose?: () => void
}
