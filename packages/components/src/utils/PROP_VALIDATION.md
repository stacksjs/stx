# Prop Validation System

A comprehensive runtime prop validation system for component development with clear, actionable error messages.

## Features

- **Development-only warnings** - Zero runtime cost in production
- **TypeScript integration** - Works alongside TypeScript for compile-time checks
- **Clear error messages** - Actionable warnings with specific values and expected types
- **Extensive validators** - 20+ built-in validators for common use cases
- **Composable schemas** - Build complex validation schemas from simple validators
- **Custom validators** - Easy to create custom validation logic

## Installation

The prop validation utilities are included in `@stacksjs/components`:

```ts
import { validateProps, PropTypes } from '@stacksjs/components'
```

## Basic Usage

### Define a Schema

```ts
import { PropTypes } from '@stacksjs/components'

const buttonPropSchema = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.boolean,
  onClick: PropTypes.func.required, // Mark as required
}
```

### Validate Props

```ts
import { validateProps } from '@stacksjs/components'

function Button(props) {
  // Validate props (only warns in development)
  validateProps('Button', props, buttonPropSchema)

  // ... rest of component
}
```

### Using createPropValidator

For reusable validators:

```ts
import { createPropValidator, PropTypes } from '@stacksjs/components'

const validateButtonProps = createPropValidator('Button', {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.boolean,
  onClick: PropTypes.func.required,
})

// In component
function Button(props) {
  validateButtonProps(props)
  // ... rest of component
}
```

## Available Validators

### Primitive Types

```ts
PropTypes.string      // String type
PropTypes.number      // Number type (excludes NaN)
PropTypes.boolean     // Boolean type
PropTypes.func        // Function type
PropTypes.object      // Object type (excludes arrays and null)
PropTypes.array       // Array type
PropTypes.any         // Any type (always passes)
```

### Enum Validators

```ts
// Value must be one of the specified options
PropTypes.oneOf(['sm', 'md', 'lg'])
PropTypes.oneOf([1, 2, 3])

// Value must match one of the specified types
PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number
])
```

### Array Validators

```ts
// Array of specific type
PropTypes.arrayOf(PropTypes.string)
PropTypes.arrayOf(PropTypes.number)

// Array of objects with specific shape
PropTypes.arrayOf(
  PropTypes.shape({
    id: PropTypes.number.required,
    name: PropTypes.string.required
  })
)
```

### Object Validators

```ts
// Object with specific shape
PropTypes.shape({
  name: PropTypes.string.required,
  age: PropTypes.number,
  email: PropTypes.email,
  address: PropTypes.shape({
    street: PropTypes.string,
    city: PropTypes.string.required
  })
})

// Instance of a class
PropTypes.instanceOf(Date)
PropTypes.instanceOf(HTMLElement)
```

### Number Validators

```ts
// Minimum value
PropTypes.min(0)

// Maximum value
PropTypes.max(100)

// Range
PropTypes.range(0, 100)
```

### String Validators

```ts
// Pattern matching
PropTypes.pattern(/^[A-Z]{3}$/)

// Email validation
PropTypes.email

// URL validation
PropTypes.url
```

### Custom Validators

```ts
// Custom validation function
PropTypes.custom(
  (value) => value > 0 && value < 100,
  'Value must be between 0 and 100'
)

// Custom with dynamic error message
PropTypes.custom(
  (value, propName, componentName) => typeof value === 'string' && value.length > 5,
  (value, propName, componentName) =>
    `Prop \`${propName}\` in \`${componentName}\` must be a string longer than 5 characters`
)
```

## Required Props

Mark any validator as required:

```ts
const schema = {
  name: PropTypes.string.required,
  age: PropTypes.number.required,
  email: PropTypes.email.required,
  onClick: PropTypes.func.required
}
```

## Complex Examples

### Form Input Validation

```ts
const inputPropSchema = {
  value: PropTypes.string,
  onChange: PropTypes.func.required,
  placeholder: PropTypes.string,
  disabled: PropTypes.boolean,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  error: PropTypes.boolean,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.boolean,
  maxLength: PropTypes.range(1, 1000),
  pattern: PropTypes.instanceOf(RegExp)
}
```

### User Object Validation

```ts
const userPropSchema = {
  user: PropTypes.shape({
    id: PropTypes.number.required,
    name: PropTypes.string.required,
    email: PropTypes.email.required,
    age: PropTypes.range(0, 150),
    address: PropTypes.shape({
      street: PropTypes.string,
      city: PropTypes.string.required,
      zipCode: PropTypes.pattern(/^\d{5}$/)
    }),
    roles: PropTypes.arrayOf(
      PropTypes.oneOf(['admin', 'user', 'guest'])
    )
  }).required
}
```

### Complex Component Props

```ts
const dataPropSchema = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).required,
      label: PropTypes.string.required,
      value: PropTypes.any,
      disabled: PropTypes.boolean,
      metadata: PropTypes.object
    })
  ).required,
  selectedId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  onSelect: PropTypes.func.required,
  multiSelect: PropTypes.boolean,
  maxSelections: PropTypes.custom(
    (value) => typeof value === 'number' && value > 0,
    'maxSelections must be a positive number'
  )
}
```

## Validation Options

```ts
validateProps('Component', props, schema, {
  // Throw error instead of warning (default: false)
  throwOnError: true,

  // Disable console warnings (default: true in dev)
  logWarnings: false
})
```

## Helper Functions

### assertProp

Assert a value matches a validator (throws on failure):

```ts
import { assertProp, PropTypes } from '@stacksjs/components'

function processUser(user: unknown) {
  // Throws if user doesn't match shape
  assertProp(user, PropTypes.shape({
    id: PropTypes.number.required,
    name: PropTypes.string.required
  }), 'user')

  // TypeScript now knows user has the correct shape
  console.log(user.id, user.name)
}
```

### warnProp

Warn if prop doesn't match validator (non-throwing):

```ts
import { warnProp, PropTypes } from '@stacksjs/components'

function logValue(value: unknown) {
  // Only warns in development, doesn't throw
  warnProp(value, PropTypes.string, 'value')

  console.log(value)
}
```

## Error Messages

The validation system provides clear, actionable error messages:

```
⚠️  Prop validation failed for `Button`
  Invalid prop `variant` of value `large` supplied to `Button`, expected one of ["primary", "secondary", "outline", "ghost", "danger"].
  Required prop `onClick` was not specified in `Button`.
```

## Production Behavior

- All validation is **completely skipped in production** builds
- Zero runtime overhead
- No console warnings
- `validateProps()`, `assertProp()`, and `warnProp()` become no-ops

## TypeScript Integration

Prop validation works alongside TypeScript:

```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick: (event: Event) => void
}

const buttonPropSchema = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.boolean,
  onClick: PropTypes.func.required
}

function Button(props: ButtonProps) {
  // TypeScript provides compile-time checking
  // PropTypes provides runtime checking in development
  validateProps('Button', props, buttonPropSchema)

  // ...
}
```

## Best Practices

### 1. Define schemas separately

```ts
// schemas/button.ts
export const buttonPropSchema = {
  variant: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  onClick: PropTypes.func.required
}

// components/Button.ts
import { buttonPropSchema } from '../schemas/button'
```

### 2. Reuse base schemas

```ts
const baseInputSchema = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.boolean,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
}

const textInputSchema = {
  ...baseInputSchema,
  maxLength: PropTypes.number,
  placeholder: PropTypes.string
}

const numberInputSchema = {
  ...baseInputSchema,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number
}
```

### 3. Create component-specific validators

```ts
// ui/button/index.ts
import { createPropValidator, PropTypes } from '@stacksjs/components'

export const validateButtonProps = createPropValidator('Button', {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  onClick: PropTypes.func.required
})

// Export for use in other files
export { validateButtonProps }
```

### 4. Use custom validators for complex logic

```ts
const isPowerOfTwo = PropTypes.custom(
  (value) => typeof value === 'number' && (value & (value - 1)) === 0,
  'Value must be a power of 2'
)

const isEven = PropTypes.custom(
  (value) => typeof value === 'number' && value % 2 === 0,
  'Value must be an even number'
)
```

## Migration from React PropTypes

If you're familiar with React's PropTypes, this system follows a similar API:

```ts
// React PropTypes
Component.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  onClick: PropTypes.func.isRequired
}

// @stacksjs/components
const componentPropSchema = {
  name: PropTypes.string.required,
  age: PropTypes.number,
  onClick: PropTypes.func.required
}
validateProps('Component', props, componentPropSchema)
```

Key differences:
- Use `.required` instead of `.isRequired`
- Validation is a separate function call, not a static property
- Validation only runs in development mode

## Examples in the Library

Several components in the library already use prop validation:

- **Button** - `src/ui/button/index.ts`
- **TextInput** - `src/ui/input/index.ts`
- **NumberInput** - `src/ui/input/index.ts`
- **Form** - `src/ui/form/index.ts`

Check these files for real-world examples of prop validation in action.
