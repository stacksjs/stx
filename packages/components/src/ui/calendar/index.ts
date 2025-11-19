export { default as Calendar } from './Calendar.stx'

export interface CalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[]
  locale?: string
  firstDayOfWeek?: number // 0 = Sunday, 1 = Monday, etc.
  showToday?: boolean
  highlightToday?: boolean
  className?: string
}
