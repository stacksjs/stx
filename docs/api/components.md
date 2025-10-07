# Component API Reference

This document details stx's component system API, including component creation, lifecycle, props, events, and more.

## Component Definition

### Basic Component

```ts
import { defineComponent } from '@stacksjs/stx'

const SimpleComponent = defineComponent({
  name: 'SimpleComponent',
  props: {
    message: String
  },
  setup(props) {
    return () => <div>{props.message}</div>
  }
})
```

### Component Options

```ts
interface ComponentOptions {
  // Component name (optional but recommended)
  name?: string

  // Component props
  props?: {
    [key: string]: PropOptions | Constructor
  }

  // Emitted events
  emits?: string[] | Record<string, EmitValidator>

  // Component setup function
  setup?: (
    props: Record<string, any>,
    context: SetupContext
  ) => RenderFunction | Record<string, any>

  // Component template (alternative to setup)
  template?: string

  // Component styles
  styles?: string | string[]

  // Component custom options
  [key: string]: any
}
```

## Props

### Prop Types

```ts
// Basic prop types
props: {
  title: String,
  count: Number,
  isActive: Boolean,
  items: Array,
  config: Object,
  callback: Function,
  size: {
    type: String,
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  }
}

// Advanced prop configuration
props: {
  // Required prop
  required: {
    type: String,
    required: true
  },

  // Prop with default
  withDefault: {
    type: Number,
    default: 0
  },

  // Object/Array default
  complex: {
    type: Object,
    default: () => ({
      key: 'value'
    })
  },

  // Custom validator
  validated: {
    type: Number,
    validator: (value: number) => value >= 0 && value <= 100
  }
}
```

### Prop Decorators

```ts
import { Prop } from '@stacksjs/stx'

class MyComponent {
  // Basic prop
  @Prop()
  message!: string

  // Required prop
  @Prop({ required: true })
  title!: string

  // Prop with default
  @Prop({ default: 0 })
  count!: number

  // Prop with validator
  @Prop({
    validator: (value: string) => ['a', 'b', 'c'].includes(value)
  })
  type!: string
}
```

## Events

### Event Declaration

```ts
// String array declaration
emits: ['change', 'update', 'select']

// Object declaration with validation
emits: {
  change: (value: any) => true,
  update: (id: number, value: string) => id > 0,
  select: (item: { id: number }) => Boolean(item?.id)
}
```

### Event Handling

```ts
const MyComponent = defineComponent({
  emits: ['change'],
  setup(props, { emit }) {
    // Emit event
    const handleClick = () => {
      emit('change', 'new value')
    }

    // Emit with multiple arguments
    const handleUpdate = () => {
      emit('update', 1, 'updated value')
    }

    return {
      handleClick,
      handleUpdate
    }
  }
})
```

## Lifecycle Hooks

```ts
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured
} from '@stacksjs/stx'

const MyComponent = defineComponent({
  setup() {
    // Before component is mounted
    onBeforeMount(() => {
      console.log('Before mount')
    })

    // After component is mounted
    onMounted(() => {
      console.log('Mounted')
    })

    // Before component updates
    onBeforeUpdate(() => {
      console.log('Before update')
    })

    // After component updates
    onUpdated(() => {
      console.log('Updated')
    })

    // Before component is unmounted
    onBeforeUnmount(() => {
      console.log('Before unmount')
    })

    // After component is unmounted
    onUnmounted(() => {
      console.log('Unmounted')
    })

    // When component errors
    onErrorCaptured((err, instance, info) => {
      console.error('Error:', err)
      return false // Prevent error propagation
    })
  }
})
```

## Component Composition

### Composables

```ts
// Define composable
function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const increment = () => {
    count.value++
  }

  const decrement = () => {
    count.value--
  }

  return {
    count,
    increment,
    decrement
  }
}

// Use in component
const MyComponent = defineComponent({
  setup() {
    const { count, increment, decrement } = useCounter(10)

    return {
      count,
      increment,
      decrement
    }
  }
})
```

### Slots

```ts
// Default slot
const MyComponent = defineComponent({
  setup() {
    return () => (
      <div class="wrapper">
        <slot />
      </div>
    )
  }
})

// Named slots
const MyComponent = defineComponent({
  setup() {
    return () => (
      <div class="layout">
        <header>
          <slot name="header" />
        </header>
        <main>
          <slot />
        </main>
        <footer>
          <slot name="footer" />
        </footer>
      </div>
    )
  }
})

// Scoped slots
const MyComponent = defineComponent({
  setup() {
    const items = ['A', 'B', 'C']

    return () => (
      <ul>
        {items.map(item => (
          <slot name="item" item={item} />
        ))}
      </ul>
    )
  }
})
```

## Component Styling

### Style Definition

```ts
// Inline styles
const MyComponent = defineComponent({
  styles: `
    .component {
      color: blue;
      padding: 1rem;
    }
  `
})

// Multiple style blocks
const MyComponent = defineComponent({
  styles: [
    `.primary { color: blue; }`,
    `.secondary { color: gray; }`
  ]
})

// Scoped styles
const MyComponent = defineComponent({
  styles: {
    scoped: true,
    css: `
      .button {
        background: #eee;
      }
    `
  }
})
```

### Dynamic Styling

```ts
const MyComponent = defineComponent({
  setup() {
    const color = ref('blue')
    const fontSize = ref('16px')

    // Dynamic inline styles
    const style = computed(() => ({
      color: color.value,
      fontSize: fontSize.value
    }))

    // Dynamic classes
    const classes = computed(() => ({
      active: isActive.value,
      disabled: !isEnabled.value
    }))

    return {
      style,
      classes
    }
  }
})
```

## Component Registration

### Global Registration

```ts
import { createApp } from '@stacksjs/stx'
import MyComponent from './MyComponent'

const app = createApp()

// Register single component
app.component('MyComponent', MyComponent)

// Register multiple components
const components = {
  MyComponent,
  OtherComponent
}

Object.entries(components).forEach(([name, component]) => {
  app.component(name, component)
})
```

### Local Registration

```ts
import MyComponent from './MyComponent'

const ParentComponent = defineComponent({
  components: {
    MyComponent
  }
})
```

## Component Patterns

### Higher-Order Components

```ts
// HOC factory
function withLoading(WrappedComponent) {
  return defineComponent({
    props: {
      loading: Boolean
    },
    setup(props) {
      return () => (
        props.loading
          ? <div class="loading">Loading...</div>
          : <WrappedComponent {...props} />
      )
    }
  })
}

// Usage
const MyComponentWithLoading = withLoading(MyComponent)
```

### Render Functions

```ts
const MyComponent = defineComponent({
  setup(props) {
    // JSX render function
    return () => (
      <div class="container">
        <header>{props.title}</header>
        <main>{props.content}</main>
      </div>
    )
  }
})

// h() render function
const MyComponent = defineComponent({
  setup(props) {
    return () => h('div', { class: 'container' }, [
      h('header', props.title),
      h('main', props.content)
    ])
  }
})
```

## Next Steps

- Explore [Core API](/api/core)
- Learn about [Helper Functions](/api/helpers)
- Check out [Router API](/api/router)
- Review [State Management](/api/state)
