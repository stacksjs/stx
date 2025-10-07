# Components

stx components are reusable UI elements that encapsulate template, logic, and styling. This guide covers everything you need to know about creating and using components.

## Component Basics

### Component Structure

A basic component consists of:

1. TypeScript interfaces (optional)
2. Component definition
3. Template
4. Styles (optional)

```stx
@ts
interface ButtonProps {
  type?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}
@endts

@component('Button', {
  props: {
    type: 'primary',
    size: 'md',
    disabled: false
  }
})
  <button
    class="btn btn-{{ type }} btn-{{ size }}"
    :disabled="disabled"
  >
    <slot></slot>
  </button>

  <style>
    .btn {
      @apply rounded font-medium;
    }
    .btn-primary {
      @apply bg-blue-500 text-white;
    }
    .btn-secondary {
      @apply bg-gray-500 text-white;
    }
  </style>
@endcomponent
```

### Using Components

Import and use components in your templates:

```stx
@import { Button } from '../components/Button'

<div class="actions">
  <Button
    type="primary"
    size="lg"
    @click="handleClick"
  >
    Click Me
  </Button>
</div>
```

## Component Features

### Props

Define and validate component props:

```stx
@ts
interface CardProps {
  title: string
  subtitle?: string
  image?: string
  loading?: boolean
}
@endts

@component('Card', {
  props: {
    title: '',
    subtitle: undefined,
    image: undefined,
    loading: false
  },
  // Prop validation
  propValidators: {
    title: (value) => value.length > 0,
    image: (value) => value?.startsWith('http')
  }
})
  <div class="card">
    @if(loading)
      <loading-spinner />
    @else
      @if(image)
        <img :src="image" :alt="title" />
      @endif

      <div class="card-content">
        <h2>{{ title }}</h2>
        @if(subtitle)
          <p>{{ subtitle }}</p>
        @endif
        <slot></slot>
      </div>
    @endif
  </div>
@endcomponent
```

### Slots

Use slots to inject content into components:

```stx
@component('Panel')
  <div class="panel">
    <!-- Default slot -->
    <slot></slot>

    <!-- Named slots -->
    <slot name="header"></slot>
    <slot name="footer"></slot>

    <!-- Slots with fallback content -->
    <slot name="empty">
      <p>No content available</p>
    </slot>
  </div>
@endcomponent

<!-- Usage -->
<Panel>
  @slot('header')
    <h2>Panel Title</h2>
  @endslot

  <p>Main content goes here</p>

  @slot('footer')
    <button>Close</button>
  @endslot
</Panel>
```

### Events

Emit and handle component events:

```stx
@component('SearchInput', {
  props: {
    placeholder: 'Search...'
  }
})
  <div class="search">
    <input
      type="text"
      :placeholder="placeholder"
      @input="handleInput"
    />
    <button @click="handleClear">Clear</button>
  </div>

  @ts
  function handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value
    $emit('search', value)
  }

  function handleClear() {
    $emit('clear')
  }
  @endts
@endcomponent

<!-- Usage -->
<SearchInput
  @search="onSearch"
  @clear="onClear"
/>
```

### Lifecycle Hooks

Use lifecycle hooks to run code at specific times:

```stx
@component('DataFetcher')
  @ts
  let data: any[] = []
  let loading = true
  let error: Error | null = null

  // Called when component is mounted
  onMounted(async () => {
    try {
      data = await fetchData()
    } catch (e) {
      error = e
    } finally {
      loading = false
    }
  })

  // Called before component is unmounted
  onUnmounted(() => {
    // Cleanup
  })

  // Called when props change
  onPropsChanged((newProps, oldProps) => {
    // Handle prop changes
  })
  @endts

  <div class="data-fetcher">
    @if(loading)
      <loading-spinner />
    @elseif(error)
      <error-message :error="error" />
    @else
      <data-display :items="data" />
    @endif
  </div>
@endcomponent
```

### State Management

Manage component state:

```stx
@component('Counter')
  @ts
  let count = 0

  // Computed property
  const isEven = computed(() => count % 2 === 0)

  // Methods
  function increment() {
    count++
  }

  function decrement() {
    count--
  }

  // Watch for changes
  watch(count, (newValue, oldValue) => {
    console.log(`Count changed from ${oldValue} to ${newValue}`)
  })
  @endts

  <div class="counter">
    <button @click="decrement">-</button>
    <span>{{ count }}</span>
    <button @click="increment">+</button>
    <p>Count is {{ isEven ? 'even' : 'odd' }}</p>
  </div>
@endcomponent
```

## Advanced Features

### Async Components

Load components asynchronously:

```stx
@component('AsyncComponent')
  @async
    @loading
      <loading-spinner />
    @error
      <error-message :error="error" />
    @success
      <!-- Heavy component content -->
    @endasync
@endcomponent
```

### Error Boundaries

Handle component errors:

```stx
@component('ErrorBoundary')
  @errorBoundary
    @error
      <div class="error">
        <h3>Something went wrong</h3>
        <p>{{ error.message }}</p>
        <button @click="retry">Retry</button>
      </div>
    @else
      <slot></slot>
    @enderror
  @enderrorBoundary
@endcomponent
```

### Component Composition

Compose components together:

```stx
@component('UserProfile')
  @ts
  interface Props {
    userId: string
  }
  @endts

  <div class="profile">
    <ErrorBoundary>
      <AsyncComponent>
        <UserInfo :id="userId" />
        <UserStats :id="userId" />
        <UserPosts :id="userId" />
      </AsyncComponent>
    </ErrorBoundary>
  </div>
@endcomponent
```

## Best Practices

1. **Component Design**
   - Keep components focused and single-purpose
   - Use TypeScript interfaces for props
   - Document component APIs
   - Follow naming conventions

2. **Performance**
   - Use async components for large components
   - Implement proper cleanup in `onUnmounted`
   - Optimize re-renders with `memo`
   - Use lazy loading when appropriate

3. **State Management**
   - Keep state as local as possible
   - Use computed properties for derived state
   - Watch for side effects
   - Consider global state for app-wide data

4. **Testing**
   - Write unit tests for components
   - Test edge cases and error states
   - Test component events
   - Test async behavior

## Component Organization

Recommended file structure:

```
components/
├── common/
│   ├── Button.stx
│   ├── Card.stx
│   └── Input.stx
├── layout/
│   ├── Header.stx
│   └── Footer.stx
├── features/
│   ├── UserProfile.stx
│   └── SearchBar.stx
└── pages/
    ├── Home.stx
    └── About.stx
```

## Next Steps

- Learn about [Template Syntax](/features/templates)
- Explore [Directives](/features/directives)
- Understand [TypeScript Integration](/features/typescript)
- Check out [Component Testing](/advanced/testing)
