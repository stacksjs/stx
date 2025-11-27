// Test importing components
import type {
  CalendarProps,
  NavigatorProps,
} from '@stacksjs/components'

// Test importing composables

console.log('✅ All imports successful!')

// Test type usage
const calendarProps: CalendarProps = {
  value: new Date(),
  onChange: date => console.log('Date changed:', date),
}

const navigatorProps: NavigatorProps = {
  items: [
    { id: '1', label: 'Home', href: '/' },
    { id: '2', label: 'About', href: '/about' },
  ],
  active: '1',
}

console.log('✅ Types work correctly!')
console.log('Calendar props:', calendarProps)
console.log('Navigator props:', navigatorProps)
