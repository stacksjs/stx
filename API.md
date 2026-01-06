# STX API Reference

A comprehensive reference for all STX templating syntax, directives, and APIs.

## Table of Contents

- [Single File Components (SFC)](#single-file-components-sfc)
- [Script Types](#script-types)
- [Template Expressions](#template-expressions)
- [Components](#components)
- [Props & Slots](#props--slots)
- [Layouts & Sections](#layouts--sections)
- [Directives](#directives)
  - [Conditionals](#conditionals)
  - [Loops](#loops)
  - [Auth Guards](#auth-guards)
  - [Environment](#environment)
  - [Includes & Partials](#includes--partials)
  - [Stack & Push](#stack--push)
  - [Forms](#forms)
  - [SEO](#seo)
- [Two-Way Binding (x-element)](#two-way-binding-x-element)
- [Event Handling](#event-handling)
- [Icons](#icons)
- [Custom Directives](#custom-directives)
- [Configuration](#configuration)
- [State Management](#state-management)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Refs (DOM References)](#refs-dom-references)
- [Transitions](#transitions)
- [Deferred Loading (@defer)](#deferred-loading-defer)
- [Teleport (@teleport)](#teleport-teleport)
- [Suggested Future Syntax](#suggested-future-syntax)

---

## Single File Components (SFC)

STX uses Vue-like Single File Components with `<script>`, `<template>`, and `<style>` sections.

```html
<!-- components/MyComponent.stx -->
<script server>
// Server-side only - extracted for SSR, stripped from output
const title = props.title || 'Default Title'
const count = props.count || 0
</script>

<template>
  <div class="card">
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <slot />
  </div>
</template>

<style>
.card {
  padding: 1rem;
  border: 1px solid #ccc;
}
</style>

<script client>
// Client-side only - preserved for browser execution
(() => {
  console.log('Component mounted');
})();
</script>
```

---

## Script Types

| Type | Behavior |
|------|----------|
| `<script server>` | SSR only - variables extracted, script stripped from output |
| `<script client>` | Client only - preserved for browser, skips server evaluation |
| `<script>` | Both - runs on server AND preserved for client |

### Server Script
```html
<script server>
// Runs during SSR, variables available in template
const user = await fetchUser()
const posts = await getPosts(user.id)
</script>
```

### Client Script
```html
<script client>
// Only runs in browser, never evaluated on server
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded');
});
</script>
```

---

## Template Expressions

### Escaped Output (Safe)
```html
{{ variable }}
{{ user.name }}
{{ items.length }}
{{ formatDate(date) }}
```

### Raw HTML Output (Unescaped)
```html
{!! trustedHtml !!}
{!! markdown(content) !!}
```

---

## Components

Components in `components/` are auto-imported using PascalCase naming.

### Usage
```html
<!-- Auto-imported from components/UserCard.stx -->
<UserCard name="John" role="Admin" />

<!-- With slot content -->
<Card title="Welcome">
  <p>This content goes into the slot!</p>
</Card>

<!-- Nested in folders: components/forms/Input.stx -->
<FormsInput type="email" />
```

### Explicit Imports
```html
@import('layouts/Sidebar')
@import('shared/Button', 'shared/Modal')

<Sidebar />
<Button label="Click me" />
```

---

## Props & Slots

### Passing Props
```html
<!-- String prop -->
<Card title="Hello" />

<!-- Expression binding with : -->
<Card :count="items.length" :active="isActive" />

<!-- Mustache interpolation -->
<Card title="{{ userName }}" />

<!-- Boolean props -->
<Button disabled />
<Modal :visible="showModal" />
```

### Accessing Props in Components
```html
<script server>
// Via props object
const title = props.title || 'Default'
const count = props.count || 0

// Destructured (also works)
const { name, email } = props
</script>

<template>
  <h1>{{ title }}</h1>
  <p>{{ props.description }}</p>
</template>
```

### Slots
```html
<!-- Default slot -->
<template>
  <div class="wrapper">
    <slot />
  </div>
</template>

<!-- With default content -->
<template>
  <div class="wrapper">
    <slot>Default content if no slot provided</slot>
  </div>
</template>
```

---

## Layouts & Sections

### Defining a Layout
```html
<!-- layouts/default.stx -->
<!DOCTYPE html>
<html>
<head>
  <title>{{ title || 'My App' }}</title>
</head>
<body>
  <Header />
  <main>
    @slot('content')
  </main>
  <Footer />
</body>
</html>
```

### Using a Layout
```html
<!-- pages/about.stx -->
@layout('default')

@section('content')
  <h1>About Us</h1>
  <p>Welcome to our site.</p>
@endsection
```

### Multiple Slots
```html
<!-- Layout -->
<head>
  @slot('head')
</head>
<body>
  @slot('content')
  @slot('scripts')
</body>

<!-- Page -->
@layout('default')

@section('head')
  <link rel="stylesheet" href="/custom.css">
@endsection

@section('content')
  <h1>Page Content</h1>
@endsection

@section('scripts')
  <script src="/custom.js"></script>
@endsection
```

---

## Directives

### Conditionals

#### @if / @elseif / @else
```html
@if (user.isAdmin)
  <AdminPanel />
@elseif (user.isEditor)
  <EditorTools />
@else
  <UserView />
@endif
```

#### @unless
```html
@unless (user.isGuest)
  <UserDashboard />
@endunless
```

#### @isset / @empty
```html
@isset (user.avatar)
  <img src="{{ user.avatar }}" />
@endisset

@empty (notifications)
  <p>No notifications</p>
@endempty
```

### Loops

#### @foreach
```html
@foreach (items as item)
  <li>{{ item.name }}</li>
@endforeach

<!-- With index -->
@foreach (items as item, index)
  <li>{{ index }}: {{ item.name }}</li>
@endforeach

<!-- With key-value -->
@foreach (object as key, value)
  <dt>{{ key }}</dt>
  <dd>{{ value }}</dd>
@endforeach
```

#### @for
```html
@for (let i = 0; i < 5; i++)
  <li>Item {{ i }}</li>
@endfor
```

#### @while
```html
@while (condition)
  <p>Still true...</p>
@endwhile
```

#### @forelse
```html
@forelse (users as user)
  <li>{{ user.name }}</li>
@empty
  <li>No users found</li>
@endforelse
```

### Auth Guards

```html
@auth
  <p>Welcome back, {{ user.name }}!</p>
  <LogoutButton />
@endauth

@guest
  <a href="/login">Please log in</a>
@endguest

<!-- With specific guard -->
@auth('admin')
  <AdminControls />
@endauth
```

### Environment

```html
@env('production')
  <Analytics />
@endenv

@env('local', 'development')
  <DebugBar />
@endenv
```

### Includes & Partials

```html
<!-- Basic include -->
@include('partials/header')

<!-- With data -->
@include('partials/user-card', { user: currentUser, showAvatar: true })

<!-- Conditional include -->
@includeIf('partials/optional')

<!-- Include when condition is true -->
@includeWhen(user.isAdmin, 'partials/admin-tools')

<!-- Include first existing -->
@includeFirst(['custom/header', 'default/header'])
```

### Stack & Push

```html
<!-- In layout: define a stack -->
@stack('scripts')
@stack('styles')

<!-- In components/pages: push to stack -->
@push('scripts')
  <script src="/component-specific.js"></script>
@endpush

@push('styles')
  <link rel="stylesheet" href="/component.css">
@endpush

<!-- Prepend to stack -->
@prepend('scripts')
  <script src="/load-first.js"></script>
@endprepend
```

### @once

```html
<!-- Only renders once even if component is used multiple times -->
@once
  <script src="/shared-library.js"></script>
@endonce
```

### Forms

#### @csrf
```html
<form method="POST">
  @csrf
  <!-- Generates: <input type="hidden" name="_token" value="..."> -->
</form>
```

#### @method
```html
<form method="POST">
  @method('PUT')
  <!-- Generates: <input type="hidden" name="_method" value="PUT"> -->
</form>
```

#### @error
```html
<input name="email" type="email">
@error('email')
  <span class="error">{{ message }}</span>
@enderror
```

### SEO

```html
@meta('description', 'Page description here')
@meta('keywords', 'stx, templating, framework')

@seo({
  title: 'Page Title',
  description: 'Page description',
  image: '/og-image.jpg',
  type: 'article'
})
```

---

## Two-Way Binding (x-element)

STX includes a lightweight reactivity system for client-side interactivity.

### x-data
Define a reactive scope:
```html
<div x-data="{ count: 0, message: '' }">
  <!-- Reactive content here -->
</div>
```

### x-model
Two-way binding for form inputs:
```html
<div x-data="{ email: '', password: '' }">
  <input x-model="email" type="email" placeholder="Email">
  <input x-model="password" type="password" placeholder="Password">
  <p>Email: <span x-text="email"></span></p>
</div>
```

### x-text
Reactive text content:
```html
<div x-data="{ count: 0 }">
  <span x-text="count"></span>
  <button @click="count++">Increment</button>
</div>
```

---

## Event Handling

### @click
```html
<button @click="handleClick()">Click me</button>
<button @click="count++">Increment</button>
<button @click="visible = !visible">Toggle</button>
```

### Other Events
```html
<input @input="handleInput($event)">
<input @change="handleChange($event)">
<form @submit="handleSubmit($event)">
<div @mouseover="isHovered = true" @mouseout="isHovered = false">
```

### Event Modifiers
```html
<!-- Prevent default -->
<form @submit.prevent="handleSubmit()">

<!-- Stop propagation -->
<button @click.stop="handleClick()">

<!-- Once only -->
<button @click.once="initOnce()">

<!-- Key modifiers -->
<input @keyup.enter="submit()">
<input @keyup.escape="cancel()">
```

---

## Icons

STX integrates with Iconify for 200K+ icons.

### Usage
```html
<HomeIcon size="24" />
<SearchIcon size="20" color="#333" />
<UserIcon size="32" class="text-blue-500" />
```

### CLI Commands
```bash
# List available icon collections
stx iconify list

# Generate icon package for a collection
stx iconify generate material-symbols
stx iconify generate heroicons
```

---

## Custom Directives

### Registering Custom Directives

```typescript
import { stxPlugin, type CustomDirective } from 'bun-plugin-stx'

// Simple directive
const uppercase: CustomDirective = {
  name: 'uppercase',
  handler: (content, params) => params[0]?.toUpperCase() || content.toUpperCase()
}

// Block directive with end tag
const wrap: CustomDirective = {
  name: 'wrap',
  hasEndTag: true,
  handler: (content, params) => `<div class="${params[0] || 'wrapper'}">${content}</div>`
}

// Async directive
const fetch: CustomDirective = {
  name: 'fetch',
  async: true,
  handler: async (content, params) => {
    const response = await fetch(params[0])
    return await response.text()
  }
}

Bun.build({
  entrypoints: ['./src/index.stx'],
  plugins: [stxPlugin({
    customDirectives: [uppercase, wrap, fetch]
  })]
})
```

### Using Custom Directives
```html
<!-- Inline directive -->
<p>@uppercase('hello world')</p>
<!-- Output: HELLO WORLD -->

<!-- Block directive -->
@wrap('container')
  <p>Wrapped content</p>
@endwrap
<!-- Output: <div class="container"><p>Wrapped content</p></div> -->
```

---

## Configuration

### stx.config.ts

```typescript
import type { StxConfig } from '@stacksjs/stx'

const config: StxConfig = {
  // Directory configuration
  pagesDir: 'pages',
  componentsDir: 'components',
  layoutsDir: 'layouts',
  partialsDir: 'partials',
  publicDir: 'public',

  // Default layout for pages
  defaultLayout: 'default',

  // Caching
  cache: process.env.NODE_ENV === 'production',
  cachePath: '.stx/cache',

  // Debug mode
  debug: process.env.NODE_ENV !== 'production',

  // Accessibility
  a11y: {
    enabled: true,
    level: 'AA', // 'A', 'AA', or 'AAA'
  },

  // SEO
  seo: {
    enabled: true,
    socialPreview: true,
    defaultConfig: {
      title: 'My App',
      description: 'App description',
    },
  },

  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
    directory: 'locales',
  },

  // Custom directives
  customDirectives: [],

  // Middleware
  middleware: {
    before: [],
    after: [],
  },
}

export default config
```

---

## State Management

STX provides a clean, Pinia-inspired state management system with reactive stores.

### Defining Stores

Create stores in a dedicated file (e.g., `stores/index.ts`):

```typescript
// stores/index.ts
import { defineStore, registerStoresClient } from 'stx'

// Define a store with state, getters, and actions
export const counterStore = defineStore('counter', {
  state: {
    count: 0,
    name: 'My Counter'
  },

  getters: {
    doubleCount: (state) => state.count * 2,
    displayName: (state) => `${state.name}: ${state.count}`
  },

  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    incrementBy(amount: number) {
      this.count += amount
    },
    async fetchCount() {
      const response = await fetch('/api/count')
      this.count = await response.json()
    }
  },

  // Optional: persist to localStorage
  persist: true
})

export const appStore = defineStore('app', {
  state: {
    isLoading: false,
    user: null as { name: string; email: string } | null,
    theme: 'dark'
  },

  getters: {
    isAuthenticated: (state) => state.user !== null
  },

  actions: {
    setUser(user: { name: string; email: string } | null) {
      this.user = user
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
    }
  },

  persist: {
    storage: 'local',
    key: 'my-app-state'
  }
})

// Register stores for client-side @stores imports
if (typeof window !== 'undefined') {
  registerStoresClient({ counterStore, appStore })
}
```

### Using Stores in Components

Import stores using the clean `@stores` syntax:

```html
<script client>
import { counterStore, appStore } from '@stores'

// Access state directly
console.log(counterStore.count)        // 0
console.log(appStore.theme)            // 'dark'

// Use getters
console.log(counterStore.doubleCount)  // 0
console.log(appStore.isAuthenticated)  // false

// Call actions
counterStore.increment()
counterStore.incrementBy(5)
appStore.toggleTheme()

// Direct state mutation
counterStore.count = 10
appStore.theme = 'light'

// Subscribe to changes
counterStore.$subscribe((state, prevState) => {
  console.log('Count changed:', prevState?.count, '->', state.count)
})

// Patch multiple values at once
appStore.$patch({
  isLoading: true,
  theme: 'dark'
})

// Or with a function
appStore.$patch((state) => {
  state.isLoading = false
  state.user = { name: 'John', email: 'john@example.com' }
})

// Reset to initial state
counterStore.$reset()
</script>

<template>
  <div>
    <p>Count: {{ counterStore.count }}</p>
    <p>Double: {{ counterStore.doubleCount }}</p>
    <button @click="counterStore.increment()">+</button>
    <button @click="counterStore.decrement()">-</button>
  </div>
</template>
```

### Store API Reference

| Property/Method | Description |
|----------------|-------------|
| `store.property` | Access state property directly |
| `store.getter` | Access computed getter |
| `store.action()` | Call an action |
| `store.$state` | Get full state snapshot |
| `store.$subscribe(callback)` | Subscribe to state changes |
| `store.$patch(partial)` | Update multiple state properties |
| `store.$reset()` | Reset to initial state |
| `store.$id` | Get store ID/name |

### Persistence Options

```typescript
// Simple persistence (localStorage with auto key)
persist: true

// Custom persistence
persist: {
  storage: 'local',     // 'local' | 'session' | 'memory'
  key: 'my-custom-key'  // Custom storage key
}
```

### Loading Stores in HTML

Include your stores before other scripts:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Load store runtime -->
  <script src="/js/stores.js"></script>
</head>
<body>
  <!-- Your app content -->
  <script client>
  import { appStore } from '@stores'
  // Stores are immediately available
  console.log(appStore.theme)
  </script>
</body>
</html>
```

### Waiting for Stores

If you need to ensure a store is loaded:

```html
<script client>
import { waitForStore } from 'stx'

// Wait for store with timeout
const appStore = await waitForStore('app', 5000)
console.log(appStore.theme)
</script>
```

### TypeScript Support

Stores are fully typed:

```typescript
import { defineStore } from 'stx'

interface User {
  id: number
  name: string
  email: string
}

interface AppState {
  user: User | null
  isLoading: boolean
  errors: string[]
}

export const appStore = defineStore('app', {
  state: {
    user: null,
    isLoading: false,
    errors: []
  } as AppState,

  getters: {
    isAuthenticated: (state): boolean => state.user !== null,
    errorCount: (state): number => state.errors.length
  },

  actions: {
    async login(email: string, password: string): Promise<void> {
      this.isLoading = true
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        })
        this.user = await response.json()
      } catch (e) {
        this.errors.push('Login failed')
      } finally {
        this.isLoading = false
      }
    },

    logout(): void {
      this.user = null
    }
  }
})
```

---

## Lifecycle Hooks

Vue-inspired lifecycle hooks for managing component setup, cleanup, and updates.

### onMount

Called when the component is mounted to the DOM. Perfect for DOM manipulation, event listeners, and subscriptions.

```html
<script client>
import { onMount } from 'stx'

onMount(() => {
  console.log('Component mounted!')

  // Set up event listener
  const handler = () => console.log('clicked')
  document.addEventListener('click', handler)

  // Return cleanup function (called on unmount)
  return () => {
    document.removeEventListener('click', handler)
  }
})
</script>
```

### onDestroy

Called when the component is removed from the DOM. Use for cleanup.

```html
<script client>
import { onMount, onDestroy } from 'stx'

onMount(() => {
  const interval = setInterval(() => {
    console.log('tick')
  }, 1000)

  // Can also register cleanup in onMount's return
  onDestroy(() => {
    clearInterval(interval)
  })
})
</script>
```

### onUpdate

Called when the component updates (re-renders).

```html
<script client>
import { onUpdate } from 'stx'

onUpdate(() => {
  console.log('Component updated!')
})
</script>
```

### Aliases

| Hook | Alias |
|------|-------|
| `onMount` | `onMounted` |
| `onDestroy` | `onUnmounted` |
| `onUpdate` | `onUpdated` |

### Full Example

```html
<script client>
import { onMount, onDestroy, onUpdate } from 'stx'
import { appStore } from '@stores'

onMount(() => {
  console.log('Chat component mounted')

  // Subscribe to store
  const unsubscribe = appStore.$subscribe((state) => {
    console.log('App state changed:', state)
  })

  // WebSocket connection
  const ws = new WebSocket('wss://api.example.com/chat')
  ws.onmessage = (e) => handleMessage(JSON.parse(e.data))

  // Cleanup
  return () => {
    unsubscribe()
    ws.close()
  }
})

onUpdate(() => {
  // Scroll to bottom when new messages arrive
  const container = document.getElementById('messages')
  container?.scrollTo(0, container.scrollHeight)
})
</script>
```

---

## Refs (DOM References)

Direct references to DOM elements, similar to Vue's `ref` or React's `useRef`.

### Creating Refs

```html
<script client>
import { ref, onMount } from 'stx'

// Create a ref
const inputRef = ref<HTMLInputElement>()

onMount(() => {
  // Access the DOM element
  inputRef.value?.focus()
})
</script>
```

### Binding Refs

Use the `@ref` attribute to bind an element to a ref:

```html
<template>
  <input type="text" @ref="inputRef" placeholder="Auto-focused" />
  <button @click="inputRef.value?.select()">Select All</button>
</template>

<script client>
import { ref, onMount } from 'stx'

const inputRef = ref<HTMLInputElement>()

onMount(() => {
  // Focus input on mount
  inputRef.value?.focus()
})
</script>
```

### Multiple Refs

```html
<template>
  <form @ref="formRef">
    <input @ref="emailRef" type="email" />
    <input @ref="passwordRef" type="password" />
    <button type="submit">Login</button>
  </form>
</template>

<script client>
import { ref, onMount } from 'stx'

const formRef = ref<HTMLFormElement>()
const emailRef = ref<HTMLInputElement>()
const passwordRef = ref<HTMLInputElement>()

onMount(() => {
  formRef.value?.addEventListener('submit', (e) => {
    e.preventDefault()
    console.log('Email:', emailRef.value?.value)
    console.log('Password:', passwordRef.value?.value)
  })
})
</script>
```

### Ref API

| Property | Description |
|----------|-------------|
| `ref.value` | The DOM element (or null if not bound) |
| `ref.current` | Alias for `ref.value` |

---

## Transitions

CSS-based enter/leave transitions for elements, inspired by Vue's transition system.

### Basic Usage

```html
@transition(name: 'fade')
  @if (visible)
    <div class="modal">Modal Content</div>
  @endif
@endtransition
```

### Transition Options

| Option | Description | Default |
|--------|-------------|---------|
| `name` | CSS class prefix | `'stx'` |
| `duration` | Duration in ms | `300` |
| `mode` | `'in-out'`, `'out-in'`, or `'default'` | `'default'` |

```html
@transition(name: 'slide-up', duration: 500, mode: 'out-in')
  @if (currentTab === 'home')
    <HomeTab />
  @elseif (currentTab === 'settings')
    <SettingsTab />
  @endif
@endtransition
```

### Attribute Syntax

For simpler cases, use the attribute syntax:

```html
<div @transition.fade="isVisible">Fading content</div>
<div @transition.slide-up.500="isOpen">Sliding content</div>
```

### CSS Classes

STX applies these CSS classes during transitions:

**Enter Transition:**
| Class | When Applied |
|-------|--------------|
| `{name}-enter-from` | Initial state before entering |
| `{name}-enter-active` | Active state during enter |
| `{name}-enter-to` | Final state after entering |

**Leave Transition:**
| Class | When Applied |
|-------|--------------|
| `{name}-leave-from` | Initial state before leaving |
| `{name}-leave-active` | Active state during leave |
| `{name}-leave-to` | Final state after leaving |

### Built-in Transitions

STX includes these ready-to-use transitions:

```css
/* Available transition names */
fade        /* Opacity fade */
slide-up    /* Slide from bottom */
slide-down  /* Slide from top */
slide-left  /* Slide from right */
slide-right /* Slide from left */
scale       /* Scale from 90% */
scale-up    /* Scale from 50% */
bounce      /* Bouncy scale */
flip        /* 3D flip */
zoom        /* Zoom from 0 */
collapse    /* Height collapse */
```

### Custom Transition CSS

Define your own transitions:

```css
/* Custom 'swing' transition */
.swing-enter-from,
.swing-leave-to {
  opacity: 0;
  transform: translateX(-100%) rotate(-30deg);
}

.swing-enter-active,
.swing-leave-active {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.swing-enter-to,
.swing-leave-from {
  opacity: 1;
  transform: translateX(0) rotate(0);
}
```

```html
@transition(name: 'swing')
  @if (showMenu)
    <nav class="menu">...</nav>
  @endif
@endtransition
```

### JavaScript Transition Hooks

For programmatic control:

```html
<script client>
// Enter transition
STX.transition.enter(element, {
  name: 'fade',
  duration: 300
})

// Leave transition (returns Promise)
await STX.transition.leave(element, {
  name: 'slide-up',
  duration: 500
})

// Toggle with transition
STX.transition.toggle(element, isVisible, {
  name: 'scale'
})
</script>
```

### Modal Example

```html
<template>
  <button @click="showModal = true">Open Modal</button>

  @transition(name: 'fade')
    @if (showModal)
      <div class="modal-overlay" @click.self="showModal = false">
        @transition(name: 'scale')
          <div class="modal-content">
            <h2>Modal Title</h2>
            <p>Modal content goes here...</p>
            <button @click="showModal = false">Close</button>
          </div>
        @endtransition
      </div>
    @endif
  @endtransition
</template>

<style>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
}
</style>
```

---

## Deferred Loading (@defer)

Lazy load content based on various triggers for better performance.

### Basic Usage
```html
@defer(on: 'visible')
  <HeavyComponent />
@placeholder
  <Skeleton />
@loading
  <Spinner />
@error
  <div>Failed to load</div>
@enddefer
```

### Triggers

| Trigger | Description |
|---------|-------------|
| `visible` | Loads when element enters viewport (IntersectionObserver) |
| `idle` | Loads when browser is idle (requestIdleCallback) |
| `interaction` | Loads on first click, focus, or touch |
| `hover` | Loads on mouse hover or focus |
| `timer(ms)` | Loads after specified milliseconds |
| `immediate` | Loads immediately but async (default) |

### Examples

```html
<!-- Load on scroll into view -->
@defer(on: 'visible')
  <ImageGallery :images="images" />
@placeholder
  <div class="skeleton h-64"></div>
@enddefer

<!-- Load on hover (prefetch-like) -->
@defer(on: 'hover')
  <PreviewCard :data="data" />
@placeholder
  <span>Hover to preview</span>
@enddefer

<!-- Load after 2 seconds -->
@defer(on: 'timer(2000)')
  <AnalyticsWidget />
@loading
  <div class="spinner"></div>
@enddefer

<!-- Load when browser is idle -->
@defer(on: 'idle')
  <RecommendationsPanel />
@enddefer
```

---

## Teleport (@teleport)

Move content to a different location in the DOM. Useful for modals, tooltips, and notifications that need to escape their parent's stacking context.

### Basic Usage
```html
@teleport('#modals')
  <div class="modal">
    <h2>Modal Title</h2>
    <p>Modal content here</p>
  </div>
@endteleport

<!-- Target element somewhere in the document -->
<div id="modals"></div>
```

### With Disabled State
```html
@teleport('#modals', disabled: isInline)
  <div class="modal">
    Renders inline when isInline is true
  </div>
@endteleport
```

### Common Patterns

```html
<!-- Modal with teleport -->
<button @click="showModal = true">Open Modal</button>

@teleport('#modal-container')
  <div class="modal-overlay" x-show="showModal">
    <div class="modal">
      <h2>{{ modalTitle }}</h2>
      <slot />
      <button @click="showModal = false">Close</button>
    </div>
  </div>
@endteleport

<!-- Tooltip teleported to body -->
@teleport('body')
  <div class="tooltip" :style="tooltipPosition">
    {{ tooltipText }}
  </div>
@endteleport

<!-- Notification toast -->
@teleport('#notifications')
  <div class="toast toast-success">
    {{ message }}
  </div>
@endteleport
```

### Events

```javascript
// Listen for teleport completion
document.addEventListener('teleport:mounted', (e) => {
  console.log('Teleported from:', e.detail.sourceId);
  console.log('Teleported to:', e.detail.target);
});
```

---

## Suggested Future Syntax

The following are proposed additions that align with STX's design philosophy:

### Async Data Fetching
```html
<!-- Declarative data fetching -->
@fetch(url="/api/users" as="users")
  @foreach (users as user)
    <UserCard :user="user" />
  @endforeach
@endfetch

<!-- With loading/error states -->
@fetch(url="/api/posts" as="posts")
  @loading
    <Spinner />
  @endloading

  @error
    <ErrorMessage :error="error" />
  @enderror

  @success
    <PostList :posts="posts" />
  @endsuccess
@endfetch
```

### Transitions & Animations
```html
<!-- Declarative transitions -->
@transition('fade')
  <Modal :visible="showModal" />
@endtransition

<!-- Named transitions -->
@transition('slide-up', { duration: 300 })
  <Notification :show="hasNotification" />
@endtransition
```

### Deferred Loading
```html
<!-- Lazy load component -->
@defer
  <HeavyComponent />
@placeholder
  <Skeleton />
@enddefer

<!-- With conditions -->
@defer(on="visible")
  <BelowFoldContent />
@enddefer

@defer(on="idle")
  <Analytics />
@enddefer

@defer(on="interaction")
  <Comments />
@enddefer
```

### Suspense Boundaries
```html
@suspense
  <AsyncComponent />
@fallback
  <Loading />
@endsuspense
```

### Portals / Teleport
```html
<!-- Render content elsewhere in DOM -->
@teleport('#modal-container')
  <Modal :show="isOpen">
    <p>Modal content</p>
  </Modal>
@endteleport
```

### Fragments
```html
<!-- Return multiple root elements -->
@fragment
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
@endfragment
```

### Memoization
```html
<!-- Cache expensive renders -->
@memo(key="user-{{ user.id }}")
  <ExpensiveUserProfile :user="user" />
@endmemo
```

### Error Boundaries
```html
@catch
  <RiskyComponent />
@error
  <p>Something went wrong: {{ error.message }}</p>
@endcatch
```

### Debug Helpers
```html
<!-- Development only -->
@debug(user)
<!-- Outputs formatted variable dump -->

@breakpoint
<!-- Pauses execution in dev tools -->
```

### Streaming / Partial Hydration
```html
<!-- Stream content as it becomes available -->
@stream
  <SlowComponent />
@endstream

<!-- Selective hydration -->
@hydrate(on="visible")
  <InteractiveWidget />
@endhydrate

@static
  <StaticContent />
@endstatic
```

### Type-Safe Props
```html
<script server>
// TypeScript-style prop definitions
interface Props {
  title: string
  count?: number
  items: Array<{ id: number; name: string }>
}

const { title, count = 0, items }: Props = props
</script>
```

### Inline Styles with Variables
```html
@style(vars={ primaryColor: theme.primary, spacing: '1rem' })
  .card {
    background: var(--primaryColor);
    padding: var(--spacing);
  }
@endstyle
```

### Content Security
```html
<!-- Sanitize user content -->
@safe(userContent)

<!-- Trust content explicitly -->
@trusted(adminContent)
```

---

## CLI Commands

```bash
# Development server
stx dev [directory] --port 3000

# Build for production
stx build

# Preview production build
stx preview

# Initialize new project
stx init

# Generate documentation
stx docs --format html

# Icon management
stx iconify list
stx iconify generate <collection>
```

---

## File-Based Routing

STX uses file-based routing in the `pages/` directory:

| File | Route |
|------|-------|
| `pages/index.stx` | `/` |
| `pages/about.stx` | `/about` |
| `pages/blog/index.stx` | `/blog` |
| `pages/blog/[slug].stx` | `/blog/:slug` (dynamic) |
| `pages/users/[id]/posts.stx` | `/users/:id/posts` |
| `pages/[...catchAll].stx` | `/*` (catch-all) |

---

*For more details, see the [full documentation](https://stx.sh).*
