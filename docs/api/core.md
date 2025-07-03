# Core API Reference

This document provides detailed information about STX's core APIs, including template syntax, directives, and runtime functions.

## Template Syntax

### Variables and Expressions

```stx
<!-- Basic variable output -->
{{ variable }}

<!-- JavaScript expressions -->
{{ user.name.toUpperCase() }}
{{ items.length > 0 ? 'Items available' : 'No items' }}

<!-- Escaped content -->
{{{ rawHtml }}}
```

### Directives

#### Conditional Rendering

```stx
<!-- If conditions -->
@if(condition)
  <p>Rendered when true</p>
@elseif(otherCondition)
  <p>Alternative condition</p>
@else
  <p>Rendered when false</p>
@endif

<!-- Unless directive -->
@unless(condition)
  <p>Rendered when false</p>
@endunless

<!-- Switch statements -->
@switch(value)
  @case('a')
    <p>Case A</p>
    @break
  @case('b')
    <p>Case B</p>
    @break
  @default
    <p>Default case</p>
@endswitch
```

#### Loops

```stx
<!-- For loops -->
@for(item of items)
  <div>{{ item }}</div>
@endfor

<!-- While loops -->
@while(condition)
  <div>Looping...</div>
@endwhile

<!-- Each loops with index -->
@each(item, index of items)
  <div>{{ index }}: {{ item }}</div>
@endeach

<!-- Loop controls -->
@for(item of items)
  @if(item.hidden)
    @continue
  @endif
  
  @if(item.last)
    @break
  @endif
  
  <div>{{ item.name }}</div>
@endfor
```

#### Layout Control

```stx
<!-- Extending layouts -->
@extends('layouts/main')

<!-- Defining sections -->
@section('title')
  Page Title
@endsection

<!-- Yielding content -->
@yield('content')

<!-- Including partials -->
@include('partials/header')

<!-- Including with data -->
@include('partials/card', { title: 'Card Title' })
```

## Runtime API

### Component Definition

```ts
interface ComponentOptions {
  name?: string
  props?: Record<string, PropOptions>
  emits?: string[]
  setup?: SetupFunction
}

function defineComponent(options: ComponentOptions): Component
```

Example:
```ts
const MyComponent = defineComponent({
  name: 'MyComponent',
  props: {
    title: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    // Component logic
  }
})
```

### Reactivity

```ts
// Create reactive state
const state = reactive({
  count: 0,
  user: null
})

// Create ref
const count = ref(0)

// Computed properties
const doubled = computed(() => count.value * 2)

// Watch for changes
watch(count, (newValue, oldValue) => {
  console.log('Count changed:', newValue)
})

// Watch multiple sources
watchEffect(() => {
  console.log('Count is:', count.value)
  console.log('Doubled is:', doubled.value)
})
```

### Lifecycle Hooks

```ts
// Component setup
onMounted(() => {
  // Called after component is mounted
})

onUpdated(() => {
  // Called after component updates
})

onUnmounted(() => {
  // Called before component is unmounted
})

onErrorCaptured((err, instance, info) => {
  // Handle component errors
  return false // Prevent error propagation
})
```

### Context and Injection

```ts
// Provide value to descendants
provide('key', value)

// Inject value from ancestor
const value = inject('key')

// Inject with default
const value = inject('key', defaultValue)

// Inject function
const getValue = inject('getter', () => defaultValue)
```

## Plugin API

### Plugin Definition

```ts
interface Plugin {
  install(app: App, ...options: any[]): void
}

// Create plugin
const MyPlugin: Plugin = {
  install(app, options) {
    // Add global properties
    app.config.globalProperties.$myPlugin = {
      // Plugin methods
    }
    
    // Add global directive
    app.directive('my-directive', {
      // Directive hooks
    })
    
    // Register global component
    app.component('MyComponent', MyComponent)
  }
}

// Use plugin
app.use(MyPlugin, { /* options */ })
```

### Custom Directives

```ts
// Directive definition
const myDirective = {
  mounted(el, binding) {
    // Access value: binding.value
    // Access argument: binding.arg
    // Access modifiers: binding.modifiers
  },
  
  updated(el, binding) {
    // Handle updates
  }
}

// Register globally
app.directive('my-directive', myDirective)

// Usage in template
<div v-my-directive:arg.mod="value">
```

## Router API

### Router Configuration

```ts
import { createRouter } from '@stacksjs/stx/router'

const router = createRouter({
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/users/:id',
      component: UserProfile,
      props: true
    },
    {
      path: '/admin',
      component: Admin,
      meta: { requiresAuth: true }
    }
  ]
})
```

### Navigation Guards

```ts
// Global guards
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }
})

router.afterEach((to, from) => {
  // Track page view
})

// Route-specific guards
{
  path: '/profile',
  component: Profile,
  beforeEnter: (to, from) => {
    // Guard logic
  }
}
```

## State Management

### Store Definition

```ts
import { createStore } from '@stacksjs/stx/store'

const store = createStore({
  state: {
    count: 0,
    user: null
  },
  
  getters: {
    doubleCount: state => state.count * 2
  },
  
  actions: {
    increment(state) {
      state.count++
    },
    
    async fetchUser(state, id) {
      state.user = await api.getUser(id)
    }
  }
})
```

### Store Usage

```ts
// In components
const { state, getters, actions } = store

// Access state
console.log(state.count)

// Use getters
console.log(getters.doubleCount)

// Call actions
actions.increment()
await actions.fetchUser(1)
```

## Next Steps

- Check out [Component API](/api/components)
- Learn about [Helper Functions](/api/helpers)
- Explore [Configuration API](/api/config)
- Review [Plugin Development](/api/plugins) 