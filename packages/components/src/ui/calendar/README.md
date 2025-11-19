# Calendar Component

A fully-featured calendar/date picker component with support for date selection, range constraints, and localization.

## Features

- ✅ Date selection with visual feedback
- ✅ Month/year navigation
- ✅ Min/max date constraints
- ✅ Disabled dates support
- ✅ Localization support
- ✅ Configurable first day of week
- ✅ Today button for quick navigation
- ✅ Today highlighting
- ✅ Dark mode support
- ✅ Accessible with ARIA labels
- ✅ Keyboard navigation ready

## Usage

### Basic Calendar

```stx
<script>
import { Calendar } from '@stacksjs/components'

let selectedDate = new Date()

function handleDateChange(date) {
  selectedDate = date
  console.log('Selected date:', date)
}
</script>

<Calendar value={selectedDate} onChange={handleDateChange} />
```

### With Date Constraints

```stx
<script>
import { Calendar } from '@stacksjs/components'

const today = new Date()
const minDate = new Date(today.getFullYear(), today.getMonth(), 1) // First day of month
const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0) // Last day of month

let selectedDate = today
</script>

<Calendar
  value={selectedDate}
  minDate={minDate}
  maxDate={maxDate}
  onChange={(date) => selectedDate = date}
/>
```

### With Disabled Dates

```stx
<script>
import { Calendar } from '@stacksjs/components'

const disabledDates = [
  new Date(2024, 11, 25), // Christmas
  new Date(2024, 0, 1),   // New Year's Day
]

let selectedDate = new Date()
</script>

<Calendar
  value={selectedDate}
  disabledDates={disabledDates}
  onChange={(date) => selectedDate = date}
/>
```

### Localized Calendar

```stx
<script>
import { Calendar } from '@stacksjs/components'

let selectedDate = new Date()
</script>

<!-- Spanish calendar starting on Monday -->
<Calendar
  value={selectedDate}
  locale="es-ES"
  firstDayOfWeek={1}
  onChange={(date) => selectedDate = date}
/>
```

### Without Today Button

```stx
<script>
import { Calendar } from '@stacksjs/components'

let selectedDate = new Date()
</script>

<Calendar
  value={selectedDate}
  showToday={false}
  highlightToday={false}
  onChange={(date) => selectedDate = date}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `Date` | `new Date()` | Currently selected date |
| `onChange` | `(date: Date) => void` | - | Callback when a date is selected |
| `minDate` | `Date` | - | Minimum selectable date |
| `maxDate` | `Date` | - | Maximum selectable date |
| `disabledDates` | `Date[]` | `[]` | Array of dates that cannot be selected |
| `locale` | `string` | `'en-US'` | Locale for month/day names (e.g., 'en-US', 'es-ES', 'fr-FR') |
| `firstDayOfWeek` | `number` | `0` | First day of week (0 = Sunday, 1 = Monday, etc.) |
| `showToday` | `boolean` | `true` | Show "Today" button |
| `highlightToday` | `boolean` | `true` | Highlight today's date with a border |
| `className` | `string` | `''` | Additional CSS classes |

## Examples

### Date Range Selector (Start Date)

```stx
<script>
import { Calendar } from '@stacksjs/components'

let startDate = null
let endDate = null

function handleStartDateChange(date) {
  startDate = date
  if (endDate && date > endDate) {
    endDate = null
  }
}
</script>

<div>
  <h3>Select Start Date</h3>
  <Calendar
    value={startDate}
    maxDate={endDate}
    onChange={handleStartDateChange}
  />
</div>
```

### Meeting Scheduler (Exclude Weekends)

```stx
<script>
import { Calendar } from '@stacksjs/components'

function getNextNDays(n) {
  const dates = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }
  return dates
}

function getWeekends(days) {
  return days.filter(date => date.getDay() === 0 || date.getDay() === 6)
}

const next60Days = getNextNDays(60)
const weekends = getWeekends(next60Days)

let meetingDate = null
</script>

<Calendar
  value={meetingDate}
  minDate={new Date()}
  disabledDates={weekends}
  onChange={(date) => meetingDate = date}
/>
```

### Birthday Picker

```stx
<script>
import { Calendar } from '@stacksjs/components'

const today = new Date()
const minDate = new Date(today.getFullYear() - 120, 0, 1) // 120 years ago
const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()) // 18+ only

let birthday = null
</script>

<Calendar
  value={birthday}
  minDate={minDate}
  maxDate={maxDate}
  onChange={(date) => birthday = date}
/>
```

## Styling

The calendar uses utility-first CSS classes and supports dark mode out of the box. You can customize the appearance by passing additional classes:

```stx
<Calendar
  className="border-2 border-gray-300 shadow-xl"
  value={selectedDate}
  onChange={handleChange}
/>
```

### Key Classes

- Container: `bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4`
- Selected date: `bg-blue-600 text-white`
- Today: `border-2 border-blue-600` (when not selected)
- Disabled: `opacity-50 cursor-not-allowed`
- Hover: `hover:bg-gray-100 dark:hover:bg-gray-700`

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support (ready for enhancement)
- Disabled dates are properly marked with `disabled` attribute
- Clear visual indicators for selected and current dates

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript features
- CSS Grid
- CSS custom properties (for dark mode)

## Related Components

- **DatePicker**: Combines Calendar with an input field
- **DateRangePicker**: Select start and end dates
- **TimePicker**: Select time values
- **DateTimePicker**: Combines date and time selection
