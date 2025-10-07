# Component API

The Component API is the core building block of stx applications. This guide covers all aspects of component creation and lifecycle management.

## Component Definition

### Basic Component

```typescript
export default {
  name: 'MyComponent',
  props: {
    message: String,
    count: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    // Component logic here
  }
}
```

### Composition API

```typescript
import { ref, computed } from 'stx'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)

    return {
      count,
      doubled
    }
  }
}
```

## Component Properties

### Props

```typescript
props: {
  title: String,
  likes: Number,
  isPublished: Boolean,
  commentIds: Array,
  author: Object,
  callback: Function,
  contactsPromise: Promise
}
```

### Computed Properties

```typescript
const fullName = computed(() => {
  return firstName.value + ' ' + lastName.value
})
```

### Methods

```typescript
function increment() {
  count.value++
}
```

## Lifecycle Hooks

```typescript
import { onMounted, onUpdated, onUnmounted } from 'stx'

export default {
  setup() {
    onMounted(() => {
      console.log('Component mounted')
    })

    onUpdated(() => {
      console.log('Component updated')
    })

    onUnmounted(() => {
      console.log('Component unmounted')
    })
  }
}
```

## Component Communication

### Events

```typescript
// Emitting events
const emit = defineEmits(['change', 'update'])
emit('change', newValue)

// Listening to events
<MyComponent @change="handleChange" />
```

### Provide/Inject

```typescript
// In parent
provide('key', value)

// In child
const injectedValue = inject('key')
```

## Component Patterns

### Composables

```typescript
// useCounter.ts
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  const decrement = () => count.value--

  return {
    count,
    increment,
    decrement
  }
}

// Component usage
const { count, increment } = useCounter()
```

### Slots

```typescript
<template>
  <div class="container">
    <slot>Default content</slot>
    <slot name="footer"></slot>
  </div>
</template>
```

## Best Practices

1. Use TypeScript for better type safety
2. Keep components focused and single-responsibility
3. Use composables for reusable logic
4. Properly type props and events
5. Document component APIs

## TypeScript Integration

```typescript
interface Props {
  message: string
  count?: number
}

defineProps<Props>()
```

## Related Topics

- [Template Syntax](/api/template-syntax)
- [State Management](/api/state)
- [TypeScript Integration](/api/typescript)
