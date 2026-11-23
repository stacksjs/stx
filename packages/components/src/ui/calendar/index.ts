export { default as Calendar } from './Calendar.stx'

export interface CalendarProps {
  value?: Date | string | null
  onChange?: (date: Date) => void
  minDate?: Date | string | null
  maxDate?: Date | string | null
  disabledDates?: Date[]
  locale?: string
  firstDayOfWeek?: number // 0 = Sunday, 1 = Monday, etc.
  showToday?: boolean
  highlightToday?: boolean
  className?: string
}
