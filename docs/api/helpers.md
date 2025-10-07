# Helper Functions API Reference

This document covers stx's built-in helper functions for common tasks and utilities.

## String Helpers

### Text Manipulation

```ts
import { str } from '@stacksjs/stx/helpers'

// Case conversion
str.camelCase('hello-world')      // 'helloWorld'
str.kebabCase('helloWorld')       // 'hello-world'
str.snakeCase('hello world')      // 'hello_world'
str.pascalCase('hello_world')     // 'HelloWorld'
str.titleCase('hello world')      // 'Hello World'

// String operations
str.trim('  hello  ')            // 'hello'
str.truncate('long text', 5)     // 'long...'
str.pad('5', 3, '0')            // '005'
str.slug('Hello World!')         // 'hello-world'

// String checks
str.contains('hello', 'll')      // true
str.startsWith('hello', 'he')    // true
str.endsWith('hello', 'lo')      // true
str.isString(5)                  // false
```

### Template Strings

```ts
import { template } from '@stacksjs/stx/helpers'

// Basic templating
const greeting = template('Hello, ${name}!')
greeting({ name: 'John' })  // 'Hello, John!'

// Multiple variables
const message = template('${user} has ${count} messages')
message({ user: 'Alice', count: 5 })  // 'Alice has 5 messages'

// Conditional templates
const status = template('Status: ${online ? "Online" : "Offline"}')
status({ online: true })  // 'Status: Online'
```

## Array Helpers

### Array Operations

```ts
import { arr } from '@stacksjs/stx/helpers'

// Array manipulation
arr.chunk([1, 2, 3, 4], 2)     // [[1, 2], [3, 4]]
arr.flatten([[1, 2], [3, 4]])  // [1, 2, 3, 4]
arr.unique([1, 2, 2, 3])       // [1, 2, 3]
arr.shuffle([1, 2, 3])         // [2, 3, 1] (random order)

// Array operations
arr.first([1, 2, 3])           // 1
arr.last([1, 2, 3])            // 3
arr.take([1, 2, 3], 2)         // [1, 2]
arr.drop([1, 2, 3], 1)         // [2, 3]

// Array checks
arr.isEmpty([])                 // true
arr.includes([1, 2], 1)        // true
arr.isArray([])                // true
```

### Array Transformations

```ts
import { arr } from '@stacksjs/stx/helpers'

// Mapping and filtering
arr.map([1, 2, 3], x => x * 2)          // [2, 4, 6]
arr.filter([1, 2, 3], x => x > 1)       // [2, 3]
arr.reject([1, 2, 3], x => x > 1)       // [1]

// Reducing and aggregating
arr.sum([1, 2, 3])                      // 6
arr.avg([1, 2, 3])                      // 2
arr.min([1, 2, 3])                      // 1
arr.max([1, 2, 3])                      // 3

// Grouping and sorting
arr.groupBy(['one', 'two'], 'length')   // { 3: ['one', 'two'] }
arr.sortBy([{id: 2}, {id: 1}], 'id')    // [{id: 1}, {id: 2}]
```

## Object Helpers

### Object Manipulation

```ts
import { obj } from '@stacksjs/stx/helpers'

// Object operations
obj.get(object, 'path.to.value')        // Get nested value
obj.set(object, 'path.to.value', 5)     // Set nested value
obj.unset(object, 'path.to.value')      // Remove nested value
obj.pick(object, ['name', 'age'])       // Pick specific keys
obj.omit(object, ['password'])          // Omit specific keys

// Object transformation
obj.mapValues(object, value => value * 2)
obj.mapKeys(object, (value, key) => key.toUpperCase())
obj.transform(object, (result, value, key) => {
  result[key] = value * 2
})

// Object checks
obj.has(object, 'key')                  // true/false
obj.isEmpty(object)                     // true/false
obj.isObject(value)                     // true/false
```

### Object Merging

```ts
import { obj } from '@stacksjs/stx/helpers'

// Merge objects
obj.merge(obj1, obj2)                   // Shallow merge
obj.mergeDeep(obj1, obj2)               // Deep merge

// Clone objects
obj.clone(object)                       // Shallow clone
obj.cloneDeep(object)                   // Deep clone

// Defaults
obj.defaults(object, defaults)          // Set default values
obj.defaultsDeep(object, defaults)      // Set nested defaults
```

## Date Helpers

### Date Operations

```ts
import { date } from '@stacksjs/stx/helpers'

// Date creation
date.now()                              // Current date
date.today()                            // Start of today
date.tomorrow()                         // Start of tomorrow
date.yesterday()                        // Start of yesterday

// Date formatting
date.format('YYYY-MM-DD')              // '2024-01-01'
date.relative(pastDate)                 // '2 days ago'
date.calendar(someDate)                 // 'Today at 2:30 PM'

// Date manipulation
date.add(date, { days: 1 })            // Add time
date.subtract(date, { months: 1 })      // Subtract time
date.startOf('day', date)              // Start of period
date.endOf('month', date)              // End of period
```

### Date Checks

```ts
import { date } from '@stacksjs/stx/helpers'

// Date comparison
date.isBefore(date1, date2)            // true/false
date.isAfter(date1, date2)             // true/false
date.isSame(date1, date2)              // true/false
date.isBetween(date, start, end)       // true/false

// Date validation
date.isValid(date)                     // true/false
date.isWeekend(date)                   // true/false
date.isToday(date)                     // true/false
date.isPast(date)                      // true/false
date.isFuture(date)                    // true/false
```

## Number Helpers

### Number Operations

```ts
import { num } from '@stacksjs/stx/helpers'

// Number formatting
num.format(1234.5678)                  // '1,234.57'
num.currency(123.45)                   // '$123.45'
num.percent(0.1234)                    // '12.34%'
num.bytes(1234)                        // '1.23 KB'

// Number manipulation
num.clamp(number, min, max)            // Clamp between values
num.round(1.234, 2)                    // 1.23
num.floor(1.234)                       // 1
num.ceil(1.234)                        // 2
num.random(1, 10)                      // Random number
```

### Math Operations

```ts
import { math } from '@stacksjs/stx/helpers'

// Basic operations
math.sum([1, 2, 3])                    // 6
math.avg([1, 2, 3])                    // 2
math.min([1, 2, 3])                    // 1
math.max([1, 2, 3])                    // 3

// Advanced operations
math.factorial(5)                       // 120
math.gcd(12, 18)                       // 6
math.lcm(12, 18)                       // 36
math.isPrime(7)                        // true
```

## URL Helpers

### URL Manipulation

```ts
import { url } from '@stacksjs/stx/helpers'

// URL parsing
url.parse('https://example.com/path')   // URL object
url.getQuery('key')                     // Get query param
url.setQuery('key', 'value')           // Set query param
url.removeQuery('key')                  // Remove query param

// URL building
url.build({
  protocol: 'https',
  host: 'example.com',
  path: '/api',
  query: { id: 1 }
})                                     // 'https://example.com/api?id=1'

// URL checks
url.isValid('https://example.com')     // true
url.isAbsolute('/path')                // false
url.isRelative('../path')              // true
```

### Path Helpers

```ts
import { path } from '@stacksjs/stx/helpers'

// Path manipulation
path.join('path', 'to', 'file')        // 'path/to/file'
path.resolve('path', '../file')         // Absolute path
path.normalize('/path//to/file')        // '/path/to/file'
path.relative(from, to)                 // Relative path

// Path components
path.dirname('/path/to/file')          // '/path/to'
path.basename('/path/to/file.txt')     // 'file.txt'
path.extname('file.txt')               // '.txt'
```

## Validation Helpers

### Value Validation

```ts
import { validate } from '@stacksjs/stx/helpers'

// Type validation
validate.isString('test')               // true
validate.isNumber(123)                  // true
validate.isBoolean(true)               // true
validate.isDate(new Date())            // true
validate.isArray([])                   // true
validate.isObject({})                  // true

// Value validation
validate.required(value)               // true/false
validate.email('test@example.com')     // true/false
validate.url('https://example.com')    // true/false
validate.alpha('abc')                  // true/false
validate.numeric('123')                // true/false
```

### Schema Validation

```ts
import { schema } from '@stacksjs/stx/helpers'

// Define schema
const userSchema = schema.object({
  name: schema.string().required(),
  age: schema.number().min(18),
  email: schema.string().email(),
  roles: schema.array().of(schema.string())
})

// Validate data
const result = userSchema.validate({
  name: 'John',
  age: 25,
  email: 'john@example.com',
  roles: ['user', 'admin']
})

// Check validation
if (result.isValid) {
  // Use validated data
  console.log(result.data)
} else {
  // Handle validation errors
  console.error(result.errors)
}
```

## Next Steps

- Explore [Core API](/api/core)
- Check out [Component API](/api/components)
- Learn about [Router API](/api/router)
- Review [State Management](/api/state)
