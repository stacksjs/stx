# Components

stx components are reusable UI elements that encapsulate template, logic, and styling. This guide covers everything you need to know about creating and using components.

> **Looking for the component library?** See the [Component Library reference](../api/component-library.md) for the engine builtins / `@stacksjs/components` split, the JSX-tag syntax, and an index of all shipped components.

## Component Basics

### Component Structure

A `.stx` component file has up to three parts:

1. `<script server>` — server-side prop normalization and class string assembly
2. The template HTML
3. `<script client>` — client-side reactivity (signals, event handlers, exposed methods)

```html
<!-- components/MyButton.stx -->
<script server>
  export const variant = $props.variant || 'primary'
  export const size = $props.size || 'md'
  export const disabled = !!$props.disabled
  export const buttonClass = `btn btn-${variant} btn-${size}`
</script>

<button
  class="{{ buttonClass }}"
  @if(disabled)disabled@endif
  @click="onClick($event)"
>
  <slot />
</button>

<script client>
  const emit = defineEmits(['click'])
  const disabled = {{ disabled }}

  function onClick(event) {
    if (disabled) return
    emit('click', event)
  }
</script>
```

Drop the file into your `componentsDir` (default `components/`) and it's auto-registered. The file name (PascalCase) becomes the tag.

### Using Components

The canonical syntax is JSX tags. No imports — components are resolved by tag name from `componentsDir` and the engine builtins.

```html
<div class="actions">
  <MyButton variant="primary" @click="save()">Save</MyButton>
  <MyButton variant="secondary" @click="cancel()">Cancel</MyButton>
  <MyButton variant="danger" :disabled="isDeleting" @click="del()">Delete</MyButton>
</div>
```

Static props pass strings (`variant="primary"`). Dynamic props bind expressions (`:disabled="isDeleting"`). Event listeners use `@event` (`@click="save()"`).

### `@component` Directive

The Blade-style directive form is the other equally first-class way to invoke a component. It pairs naturally with the rest of the `@`-prefixed server directives (`@if`, `@foreach`, `@include`, etc.) and is the easiest way to pass props that don't fit cleanly into HTML attributes (functions, deeply nested objects):

```html
@component('MyButton', {
  variant: 'primary',
  onClick: () => save(),
})
  Save
@endcomponent
```

Both forms compile to the same thing. Use whichever fits the call site.

```stx
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
        <img x-src="image" x-alt="title" />
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

### Typed component contracts

For a Vue-3-style typed contract, declare props/emits/slots with the
`define*` macros inside `<script server>` (SSR) or `<script>` (client). They are
globally available — no import needed.

```stx
<script server>
interface Props {
  src: string            // required
  alt?: string           // optional
  count?: number         // optional
  fallback?: string      // optional
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', payload: { value: string }): void
}

interface Slots {
  default: () => unknown
  header?: (props: { title: string }) => unknown
}

// Typed props. Pair with withDefaults for default values.
const props = withDefaults(defineProps<Props>(), {
  alt: '',
  count: 0,
  fallback: '/images/default.svg',
})

const emit = defineEmits<Emits>()
const slots = defineSlots<Slots>()
</script>

<img src="{{ props.src }}" alt="{{ props.alt }}" data-count="{{ props.count }}">
```

| Macro | Returns | Use it for |
|---|---|---|
| `defineProps<T>()` | the props object, typed as `T` | reading props with autocomplete + type-checked access |
| `withDefaults(defineProps<T>(), { … })` | `T` with defaults filled in | default values that survive type narrowing |
| `defineProps<T>({ key: { default } })` | `T` with options-style defaults | Vue runtime-options form (equivalent to `withDefaults`) |
| `defineEmits<E>()` | a typed `emit(event, payload)` fn | emitting events the parent listens to via `@event` |
| `defineSlots<S>()` | the live slots map, typed as `S` | branching on which slots the caller provided |

**Defaults never collapse falsy values.** A default is applied **only when the
prop is `undefined`** — a passed `0`, `false`, or `''` is a real value and is
kept. This holds identically on the server and the client, so there is no
hydration mismatch:

```stx
<!-- caller -->
<Counter :count="0" />

<script server>
// props.count is 0 — NOT the 99 default. `$props.count || 99` would wrongly
// collapse it to 99; defineProps/withDefaults do not.
const props = withDefaults(defineProps<{ count?: number }>(), { count: 99 })
</script>
```

> Compile-time call-site validation (turning `<SafeImage src={123} />` into a
> TS error via a generated `.d.ts`) is tracked separately as a build-tooling
> phase — the macros above give you the typed authoring surface and the
> runtime-correct defaults today.

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
      x-placeholder="placeholder"
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
