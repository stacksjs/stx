# Utilities

STX provides a comprehensive set of utility functions to help you build applications more efficiently. This guide covers all built-in utilities and their usage.

## Core Utilities

### Type Checking

```typescript
import { isRef, isReactive, isProxy } from 'stx'

// Check if a value is a ref
console.log(isRef(someValue))

// Check if an object is reactive
console.log(isReactive(someObject))

// Check if a value is a proxy
console.log(isProxy(someValue))
```

### Reactivity Utilities

```typescript
import { unref, toRef, toRefs, toRaw } from 'stx'

// Get the raw value of a ref
const rawValue = unref(someRef)

// Convert a property to a ref
const nameRef = toRef(props, 'name')

// Convert all properties to refs
const refs = toRefs(props)

// Get the raw object from a reactive proxy
const rawObject = toRaw(reactiveObject)
```

## DOM Utilities

### Element References

```typescript
import { nextTick } from 'stx'

// Wait for DOM updates
await nextTick()

// Get element reference
const el = ref<HTMLElement>()
onMounted(() => {
  console.log(el.value.offsetHeight)
})
```

### Event Handling

```typescript
import { onClickOutside, onKeyStroke } from '@stx/use'

// Handle click outside
onClickOutside(elementRef, (event) => {
  console.log('Clicked outside')
})

// Handle key press
onKeyStroke('Escape', (event) => {
  console.log('Escape pressed')
})
```

## Array Utilities

```typescript
import { remove, unique, shuffle } from '@stx/utils'

// Remove item from array
remove(array, item)

// Get unique items
const uniqueItems = unique(array)

// Shuffle array
const shuffled = shuffle(array)
```

## Object Utilities

```typescript
import { merge, clone, pick, omit } from '@stx/utils'

// Deep merge objects
const merged = merge(obj1, obj2)

// Deep clone object
const cloned = clone(object)

// Pick specific properties
const picked = pick(object, ['prop1', 'prop2'])

// Omit specific properties
const omitted = omit(object, ['prop1', 'prop2'])
```

## String Utilities

```typescript
import { capitalize, slugify, truncate } from '@stx/utils'

// Capitalize string
const capitalized = capitalize('hello') // 'Hello'

// Create URL-friendly slug
const slug = slugify('Hello World') // 'hello-world'

// Truncate string
const truncated = truncate('Long text...', 10) // 'Long text...'
```

## Date Utilities

```typescript
import { formatDate, parseDate, addDays } from '@stx/utils'

// Format date
const formatted = formatDate(new Date(), 'YYYY-MM-DD')

// Parse date string
const date = parseDate('2023-01-01')

// Add days to date
const newDate = addDays(date, 5)
```

## Async Utilities

```typescript
import { sleep, retry, debounce, throttle } from '@stx/utils'

// Sleep for duration
await sleep(1000)

// Retry function
const result = await retry(async () => {
  // async operation
}, { attempts: 3 })

// Debounce function
const debouncedFn = debounce(() => {
  // function logic
}, 300)

// Throttle function
const throttledFn = throttle(() => {
  // function logic
}, 300)
```

## URL Utilities

```typescript
import { parseQuery, stringifyQuery } from '@stx/utils'

// Parse query string
const params = parseQuery('?foo=bar&baz=qux')

// Create query string
const query = stringifyQuery({ foo: 'bar', baz: 'qux' })
```

## Best Practices

1. Import only needed utilities to reduce bundle size
2. Use TypeScript for better type safety
3. Consider creating custom utility functions for repeated operations
4. Document custom utilities
5. Test utilities thoroughly

## Related Topics

- [Component API](/api/component)
- [TypeScript Integration](/api/typescript)
- [Configuration](/api/config)
