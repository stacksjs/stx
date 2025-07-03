# TypeScript Integration

STX is built with TypeScript and provides first-class TypeScript support. This guide covers TypeScript integration features and best practices.

## Setup

### Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "jsx": "preserve",
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM"],
    "types": ["stx"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.stx"]
}
```

## Component Types

### Props Definition

```typescript
interface Props {
  message: string
  count?: number
  items: string[]
  callback: (id: number) => void
}

const props = defineProps<Props>()
```

### Events

```typescript
interface Emits {
  (event: 'change', value: string): void
  (event: 'update', id: number, value: any): void
}

const emit = defineEmits<Emits>()
```

### Component Type Declaration

```typescript
import type { Component } from 'stx'

interface MyComponentProps {
  title: string
  onSubmit: () => void
}

const MyComponent: Component<MyComponentProps> = {
  // component implementation
}
```

## State Management

### Reactive Types

```typescript
interface User {
  id: number
  name: string
  email: string
}

const user = ref<User>({
  id: 1,
  name: 'John',
  email: 'john@example.com'
})
```

### Computed Properties

```typescript
interface FullName {
  first: string
  last: string
}

const fullName = computed<string>(() => {
  return `${first.value} ${last.value}`
})
```

## Template Type Checking

### Template Refs

```typescript
const inputRef = ref<HTMLInputElement>()
const componentRef = ref<InstanceType<typeof MyComponent>>()
```

### Event Handlers

```typescript
function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
}
```

## Custom Types

### Global Types

```typescript
// types.d.ts
declare global {
  interface Window {
    myAPI: MyAPIInterface
  }
}
```

### Module Augmentation

```typescript
// stx-extensions.d.ts
import 'stx'

declare module 'stx' {
  interface ComponentCustomProperties {
    $api: MyAPIInterface
  }
}
```

## Utilities

### Type Helpers

```typescript
type Nullable<T> = T | null
type Optional<T> = T | undefined
type PropType<T> = T | null | undefined
```

### Type Guards

```typescript
function isUser(value: any): value is User {
  return value && 
    typeof value === 'object' && 
    'id' in value &&
    'name' in value
}
```

## Best Practices

1. Enable strict mode in TypeScript configuration
2. Use explicit type annotations for complex objects
3. Leverage type inference when possible
4. Document public APIs with JSDoc comments
5. Use type guards for runtime type checking

## Common Patterns

### Generic Components

```typescript
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => JSX.Element
}

function List<T>(props: ListProps<T>) {
  return (
    <ul>
      {props.items.map(props.renderItem)}
    </ul>
  )
}
```

## Related Topics

- [Component API](/api/component)
- [State Management](/api/state)
- [Configuration](/api/config)
