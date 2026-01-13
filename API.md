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

## Scoped Slots

Scoped slots allow parent components to receive data from child components via slot props.

### Named Slots

Basic named slots for content distribution:

```html
<!-- Card.stx (Child Component) -->
<div class="card">
  <header>
    <slot name="header">Default Header</slot>
  </header>
  <main>
    <slot />  <!-- Default slot -->
  </main>
  <footer>
    <slot name="footer" />
  </footer>
</div>

<!-- Parent Usage -->
<Card>
  <template #header>
    <h1>Custom Title</h1>
  </template>

  <p>This goes in the default slot</p>

  <template #footer>
    <button>Submit</button>
  </template>
</Card>
```

### Scoped Slots with Props

Pass data from child to parent via slot props:

```html
<!-- DataTable.stx (Child Component) -->
<script>
const items = props.items || []
</script>

<table>
  <tbody>
    @foreach (items as item, index)
      <tr>
        <slot name="row" :item="item" :index="index">
          <!-- Default content if no slot provided -->
          <td>{{ item }}</td>
        </slot>
      </tr>
    @endforeach
  </tbody>
</table>

<!-- Parent Usage -->
<DataTable :items="users">
  <template #row="{ item, index }">
    <td>{{ index + 1 }}</td>
    <td>{{ item.name }}</td>
    <td>{{ item.email }}</td>
    <td>
      <button @click="editUser(item.id)">Edit</button>
    </td>
  </template>
</DataTable>
```

### Slot Syntax Variants

```html
<!-- Hash syntax (recommended) -->
<template #header>...</template>
<template #row="{ item }">...</template>

<!-- v-slot syntax (Vue compatible) -->
<template v-slot:header>...</template>
<template v-slot:row="{ item }">...</template>

<!-- slot attribute (legacy) -->
<template slot="header">...</template>
```

### Default Slot Content

Provide fallback content when no slot is provided:

```html
<!-- Button.stx -->
<button class="btn">
  <slot>Click Me</slot>  <!-- "Click Me" is the default -->
</button>

<!-- Usage -->
<Button>Submit</Button>    <!-- Shows "Submit" -->
<Button />                 <!-- Shows "Click Me" -->
```

---

## Provide/Inject (Dependency Injection)

Provide/Inject allows ancestor components to pass data to any descendant without prop drilling.

### Basic Usage

```html
<!-- Parent.stx -->
<script>
import { provide } from 'stx'

const theme = 'dark'
const user = { name: 'John', role: 'admin' }

// Provide values to all descendants
provide('theme', theme)
provide('user', user)
</script>

<div class="app">
  <Header />
  <Content />
  <Footer />
</div>
```

```html
<!-- DeepNestedChild.stx (any descendant) -->
<script>
import { inject } from 'stx'

// Inject values from any ancestor
const theme = inject('theme')
const user = inject('user')
</script>

<div class="{{ theme === 'dark' ? 'bg-gray-900' : 'bg-white' }}">
  <p>Welcome, {{ user.name }}!</p>
</div>
```

### Default Values

Provide fallback values when injection is not found:

```html
<script>
import { inject } from 'stx'

// With default value
const theme = inject('theme', 'light')
const locale = inject('locale', 'en-US')
</script>
```

### Typed Injection Keys

Use typed keys for better type safety:

```html
<script>
import { createInjectionKey, provide, inject } from 'stx'

// Create a typed injection key
const ThemeKey = createInjectionKey<'light' | 'dark'>('theme')

// Provider
provide(ThemeKey, 'dark')

// Consumer (type-safe)
const theme = inject(ThemeKey) // Type: 'light' | 'dark' | undefined
</script>
```

### Reactive Injection

Inject reactive state that updates descendants:

```html
<!-- Provider.stx -->
<script>
import { provide, ref } from 'stx'

const count = ref(0)
provide('count', count)

function increment() {
  count.value++
}
</script>

<!-- Consumer.stx -->
<script>
import { inject, watch } from 'stx'

const count = inject('count')

watch(count, (newVal) => {
  console.log('Count changed:', newVal)
})
</script>

<p>Count: {{ count.value }}</p>
```

### Common Patterns

```html
<!-- Theme Provider -->
<script>
import { provide, ref } from 'stx'

const theme = ref('light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

provide('theme', { theme, toggleTheme })
</script>

<!-- Consuming component -->
<script>
import { inject } from 'stx'

const { theme, toggleTheme } = inject('theme')
</script>

<button @click="toggleTheme">
  Switch to {{ theme.value === 'light' ? 'Dark' : 'Light' }} Mode
</button>
```

---

## Error Boundaries

Error boundaries catch JavaScript errors anywhere in their child component tree and display a fallback UI instead of crashing the entire application.

### Basic Usage

```html
@errorBoundary
  <RiskyComponent />
@fallback
  <div class="error-state">
    <p>Something went wrong</p>
    <button @click="$retry()">Retry</button>
  </div>
@enderrorBoundary
```

### With Options

```html
@errorBoundary(id: 'user-section', logErrors: false)
  <UserProfile :id="userId" />
  <UserActivity :id="userId" />
@fallback
  <div class="error-fallback">
    <h3>Failed to load user data</h3>
    <button @click="$retry()">Try Again</button>
  </div>
@enderrorBoundary
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | auto-generated | Custom ID for error tracking |
| `logErrors` | `boolean` | `true` | Whether to log errors to console |

### Retry Functionality

The `$retry()` function resets the error boundary and re-renders the content:

```html
@errorBoundary
  <DataGrid :data="largeDataset" />
@fallback
  <div class="error-ui">
    <span class="icon">⚠️</span>
    <h4>Data failed to load</h4>
    <p>Check your connection and try again.</p>
    <button @click="$retry()">Retry</button>
  </div>
@enderrorBoundary
```

### Nested Error Boundaries

Error boundaries can be nested for granular error handling:

```html
@errorBoundary(id: 'page')
  <Header />

  @errorBoundary(id: 'sidebar')
    <Sidebar />
  @fallback
    <div>Sidebar unavailable</div>
  @enderrorBoundary

  @errorBoundary(id: 'main-content')
    <MainContent />
  @fallback
    <div>Content failed to load</div>
  @enderrorBoundary

  <Footer />
@fallback
  <div>Page crashed. Please refresh.</div>
@enderrorBoundary
```

### SSR Error Handling

For server-side rendering, use the programmatic API:

```typescript
import { withErrorBoundary } from 'stx'

const html = await withErrorBoundary(
  async () => renderComponent(props),
  '<div>Failed to render</div>',
  (error) => console.error('Render error:', error)
)
```

### Programmatic API

Create error boundaries programmatically:

```html
<script client>
// Access error boundary state
const boundary = window.STX.errorBoundaries['eb-123-abc']

// Check if error occurred
if (boundary.hasError()) {
  console.log('Error:', boundary.getError())
}

// Programmatically show fallback
boundary.showFallback(new Error('Custom error'))

// Programmatically retry
boundary.retry()
</script>
```

### Event Handling

Listen for error boundary events:

```html
<script client>
document.addEventListener('stx:error', (e) => {
  const { error, boundaryId } = e.detail
  // Report to error tracking service
  errorTracker.report(error, { boundaryId })
})

document.addEventListener('stx:retry', (e) => {
  const { boundaryId } = e.detail
  console.log(`Boundary ${boundaryId} retrying...`)
})
</script>
```

### Error Boundary CSS

Default styles are included, but can be customized:

```css
/* Custom error fallback styling */
.stx-error-boundary-fallback {
  padding: 2rem;
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  border: 2px solid #ef4444;
  border-radius: 12px;
  text-align: center;
}

.stx-error-boundary-fallback button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.stx-error-boundary-fallback button:hover {
  background: #dc2626;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .stx-error-boundary-fallback {
    background: linear-gradient(135deg, #450a0a, #7f1d1d);
    color: #fecaca;
  }
}
```

---

## Async Components (@async)

Lazy load components with loading and error states.

### Basic Usage

```html
@async(component: 'HeavyChart')
  <div class="loading">
    <div class="stx-async-spinner"></div>
    <p>Loading chart...</p>
  </div>
@error
  <div class="error">
    <p>Failed to load chart</p>
    <button onclick="$retry()">Retry</button>
  </div>
@endasync
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `component` | `string` | required | Component path or name to load |
| `timeout` | `number` | `30000` | Timeout in milliseconds |
| `delay` | `number` | `200` | Delay before showing loading state |
| `retries` | `number` | `0` | Number of retry attempts on failure |
| `suspensible` | `boolean` | `true` | Whether to notify parent Suspense boundary |

### With All Options

```html
@async(component: 'Dashboard', timeout: 10000, delay: 100, retries: 3)
  <DashboardSkeleton />
@error
  <div class="error-state">
    <h4>Dashboard failed to load</h4>
    <p data-error-message></p>
    <button onclick="$retry()">Try Again</button>
  </div>
@endasync
```

### Programmatic API

```typescript
import { defineAsyncComponent } from 'stx'

// Simple async component
const AsyncChart = defineAsyncComponent(() => import('./Chart.stx'))

// With full options
const AsyncDashboard = defineAsyncComponent({
  loader: () => import('./Dashboard.stx'),
  loadingComponent: '<div class="skeleton"></div>',
  errorComponent: '<div class="error">Failed</div>',
  delay: 200,
  timeout: 10000,
  onLoadStart: () => console.log('Loading...'),
  onLoadEnd: () => console.log('Loaded!'),
  onError: (error, retry, fail, attempts) => {
    if (attempts < 3) retry()
    else fail()
  }
})
```

### Client-Side Loading

```html
<script client>
// Load a component dynamically
await STX.loadComponent('HeavyWidget', '#widget-container', {
  loading: '<div class="spinner"></div>',
  error: '<div class="error">Failed to load</div>',
  onLoad: () => console.log('Widget loaded'),
  onError: (err) => console.error(err)
})
</script>
```

### Events

```html
<script client>
// Listen for async component events
document.addEventListener('stx:async:loaded', (e) => {
  console.log('Component loaded:', e.detail.component)
})

document.addEventListener('stx:async:error', (e) => {
  console.error('Load failed:', e.detail.error)
})
</script>
```

---

## Suspense

Coordinate async loading across component trees, showing a single fallback until all async children resolve.

### Basic Usage

```html
@suspense
  <UserProfile :id="userId" />
  <UserActivity :id="userId" />
  <UserStats :id="userId" />
@fallback
  <PageSkeleton />
@endsuspense
```

### With Timeout

```html
@suspense(timeout: 10000)
  @async(component: 'Header')
    <HeaderSkeleton />
  @endasync

  @async(component: 'Sidebar')
    <SidebarSkeleton />
  @endasync

  @async(component: 'MainContent')
    <ContentSkeleton />
  @endasync
@fallback
  <FullPageLoader />
@endsuspense
```

### Nested Suspense

```html
@suspense(id: 'page')
  <Header />

  @suspense(id: 'content')
    @async(component: 'ArticleList')
      <ArticleListSkeleton />
    @endasync
  @fallback
    <ContentLoader />
  @endsuspense

  <Footer />
@fallback
  <PageLoader />
@endsuspense
```

### Events

```html
<script client>
// All async children resolved
document.addEventListener('stx:suspense:resolved', (e) => {
  console.log('Suspense resolved:', e.detail.suspenseId)
})

// Timeout occurred
document.addEventListener('stx:suspense:timeout', (e) => {
  console.log('Pending components:', e.detail.pending)
})

// Child failed to load
document.addEventListener('stx:suspense:error', (e) => {
  console.error('Child failed:', e.detail.childId, e.detail.error)
})
</script>
```

### Programmatic API

```html
<script client>
// Wait for all suspense boundaries to resolve
await STX.suspense.waitForAll()
console.log('All content loaded!')

// Access specific boundary
const boundary = STX.suspense.boundaries['suspense-1-abc']
console.log('Status:', boundary.getStatus())
console.log('Pending:', boundary.getPending())
boundary.reset() // Reset and reload
</script>
```

### SSR Streaming

```typescript
import { createSSRSuspense, renderSSRSuspense } from 'stx'

// Create suspense boundaries for streaming
const boundaries = [
  createSSRSuspense('header', renderHeader(), '<HeaderSkeleton />'),
  createSSRSuspense('content', renderContent(), '<ContentSkeleton />'),
]

// Render with streaming
const { initial, streaming } = await renderSSRSuspense(boundaries)

// Send initial HTML with fallbacks
res.write(initial)

// Stream resolved content as it becomes available
for await (const chunk of streaming) {
  res.write(chunk)
}

res.end()
```

---

## Keep-Alive

Cache component instances to preserve state when toggling visibility.

### Basic Usage

```html
@keepAlive
  @if (currentTab === 'settings')
    <SettingsPanel />
  @elseif (currentTab === 'profile')
    <ProfilePanel />
  @elseif (currentTab === 'activity')
    <ActivityPanel />
  @endif
@endkeepAlive
```

### With Options

```html
@keepAlive(max: 5, include: 'Settings,Profile', exclude: 'Debug')
  <component :is="currentComponent" />
@endkeepAlive
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max` | `number` | `10` | Maximum cached instances (LRU eviction) |
| `include` | `string` | - | Comma-separated component names to cache |
| `exclude` | `string` | - | Comma-separated component names to NOT cache |
| `id` | `string` | auto | Custom cache ID |

### Tab Navigation Example

```html
<script>
let activeTab = 'home'
</script>

<nav>
  <button @click="activeTab = 'home'" class="{{ activeTab === 'home' ? 'active' : '' }}">
    Home
  </button>
  <button @click="activeTab = 'search'" class="{{ activeTab === 'search' ? 'active' : '' }}">
    Search
  </button>
  <button @click="activeTab = 'settings'" class="{{ activeTab === 'settings' ? 'active' : '' }}">
    Settings
  </button>
</nav>

@keepAlive(max: 3)
  @if (activeTab === 'home')
    <HomePage />
  @elseif (activeTab === 'search')
    <SearchPage />  <!-- Form state preserved! -->
  @elseif (activeTab === 'settings')
    <SettingsPage />
  @endif
@endkeepAlive
```

### Preserving Scroll Position

```html
<!-- Add data-keep-scroll to scrollable elements -->
<div class="scrollable-list" data-keep-scroll="main-list">
  @foreach (items as item)
    <ListItem :item="item" />
  @endforeach
</div>
```

### Preserving Form State

```html
<!-- Form values are automatically preserved -->
<form>
  <input name="search" type="text" />
  <select name="filter">
    <option value="all">All</option>
    <option value="active">Active</option>
  </select>
  <input type="checkbox" name="showArchived" />
</form>

<!-- For custom state, use data-keep-state -->
<div data-keep-state="counter" data-state-value="{{ count }}">
  Count: {{ count }}
</div>
```

### Lifecycle Hooks

```html
<script client>
import { onActivated, onDeactivated } from 'stx'

// Called when restored from cache
onActivated((detail) => {
  console.log('Component activated:', detail.key)
  console.log('Was cached at:', new Date(detail.cachedAt))
  // Refresh data if needed
  fetchLatestData()
})

// Called when being cached
onDeactivated((detail) => {
  console.log('Component deactivated:', detail.key)
  // Cleanup if needed
  pauseAnimations()
})
</script>
```

### Programmatic API

```html
<script client>
// Access keep-alive instance
const keepAlive = STX.keepAlive.instances['keep-alive-1-abc']

// Check cache
console.log('Cached keys:', keepAlive.getCacheKeys())
console.log('Cache size:', keepAlive.getCacheSize())

// Check if component is cached
if (keepAlive.isCached('SettingsPanel')) {
  console.log('Settings are cached')
}

// Clear specific component
keepAlive.clear('SettingsPanel')

// Clear all cached components
keepAlive.clear()

// Global utilities
STX.keepAlive.clearAll() // Clear all keep-alive caches
STX.keepAlive.getTotalCached() // Get total cached count
</script>
```

### Events

```html
<script client>
// Component restored from cache
document.addEventListener('stx:activated', (e) => {
  console.log('Activated:', e.detail.key)
})

// Component cached
document.addEventListener('stx:deactivated', (e) => {
  console.log('Deactivated:', e.detail.key)
})
</script>
```

---

## TypeScript Props

Type-safe component props with runtime validation.

### Basic Usage

```html
<script>
import { defineProps } from 'stx'

// Simple typed props
const props = defineProps<{
  title: string
  count: number
  items: string[]
}>()
</script>

<h1>{{ props.title }}</h1>
<p>Count: {{ props.count }}</p>
```

### With Validation and Defaults

```html
<script>
import { defineProps } from 'stx'

const props = defineProps<{
  title: string
  count?: number
  status: 'active' | 'inactive'
  items?: string[]
}>({
  title: { required: true },
  count: { default: 0 },
  status: {
    default: 'active',
    validator: (v) => ['active', 'inactive'].includes(v)
  },
  items: { default: () => [] }
})
</script>
```

### Prop Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | `Constructor` | Expected type (String, Number, Boolean, Array, Object, etc.) |
| `required` | `boolean` | Whether the prop is required |
| `default` | `T \| () => T` | Default value (use function for objects/arrays) |
| `validator` | `(value) => boolean` | Custom validation function |
| `description` | `string` | Documentation description |

### With Defaults Helper

```html
<script>
import { defineProps, withDefaults } from 'stx'

const props = withDefaults(defineProps<{
  title: string
  count?: number
  items?: string[]
}>(), {
  count: 0,
  items: () => []
})
</script>
```

### Prop Helper Functions

```typescript
import { prop, required, optional, validated, oneOf, arrayOf } from 'stx'

const props = defineProps({
  // Required string
  name: required(String),

  // Optional with default
  count: optional(0, Number),

  // With custom validator
  email: validated(
    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { type: String, required: true }
  ),

  // One of specific values
  status: oneOf(['active', 'inactive', 'pending'] as const),

  // Array of specific type
  tags: arrayOf(String, { default: () => [] })
})
```

### Runtime Validation

```html
<script>
import { definePropsWithValidation } from 'stx'

const { props, validation } = definePropsWithValidation({
  title: { type: String, required: true },
  count: { type: Number, default: 0 }
}, {
  componentName: 'MyComponent',
  throwOnError: false,  // Don't throw, just log warnings
  logWarnings: true
})

if (!validation.valid) {
  console.error('Prop errors:', validation.errors)
}
</script>
```

### Define Emits (Events)

```html
<script>
import { defineEmits } from 'stx'

const emit = defineEmits<{
  'update:value': string
  'submit': { data: FormData }
  'close': void
}>()

function handleSubmit(data: FormData) {
  emit('submit', { data })
}

function handleClose() {
  emit('close', undefined)
}
</script>

<button @click="handleClose">Close</button>
```

### Define Expose

Expose methods/properties to parent components:

```html
<script>
import { defineExpose, ref } from 'stx'

const inputRef = ref<HTMLInputElement>()
const internalValue = ref('')

defineExpose({
  focus: () => inputRef.value?.focus(),
  reset: () => { internalValue.value = '' },
  getValue: () => internalValue.value
})
</script>

<input @ref="inputRef" :value="internalValue" />
```

Parent can access exposed methods:

```html
<script>
const childRef = ref()

function focusChild() {
  childRef.value?.focus()
}
</script>

<MyInput @ref="childRef" />
<button @click="focusChild">Focus Input</button>
```

---

## DevTools

Debug and inspect STX applications with built-in developer tools.

### Enabling DevTools

```html
<script>
import { enableDevTools } from 'stx'

// Enable in development
if (process.env.NODE_ENV === 'development') {
  enableDevTools({
    maxEvents: 1000,      // Max events in timeline
    maxPerformance: 500   // Max performance records
  })
}
</script>
```

### DevTools Panel

When enabled, a DevTools panel appears in the bottom-right corner with tabs:

- **Components** - Component tree with props and state
- **Stores** - Store state and mutation history
- **Events** - Event timeline

### Component Registration

Components are automatically tracked when using `registerComponent`:

```typescript
import { registerComponent, updateComponentState } from 'stx'

// Register a component
const componentId = registerComponent(
  'MyComponent',        // Component name
  element,              // DOM element
  { title: 'Hello' },   // Props
  { count: 0 },         // State
  'src/MyComponent.stx' // File path (optional)
)

// Update state
updateComponentState(componentId, { count: 1 })
```

### Store Integration

Stores are automatically tracked when using `defineStore`:

```typescript
import { registerStore, recordStoreMutation } from 'stx'

// Register a store
registerStore('userStore', { name: '', email: '' }, {}, ['login', 'logout'])

// Record mutations
recordStoreMutation('userStore', 'name', '', 'John', 'state')
```

### Console API

Access DevTools from the browser console:

```javascript
// Get all components
__STX_DEVTOOLS__.getComponents()

// Get specific component
__STX_DEVTOOLS__.getComponent('stx-1')

// Log component tree
__STX_DEVTOOLS__.logComponentTree()

// Get all stores
__STX_DEVTOOLS__.getStores()

// Log store state
__STX_DEVTOOLS__.logStoreState('userStore')

// Get event timeline
__STX_DEVTOOLS__.getEvents()

// Get performance metrics
__STX_DEVTOOLS__.getPerformance()
```

### Component Inspection

```javascript
// Select and highlight a component
__STX_DEVTOOLS__.selectComponent('stx-1')

// Inspect element to find its component
__STX_DEVTOOLS__.inspectElement(document.querySelector('.my-component'))

// Highlight without selecting
__STX_DEVTOOLS__.highlightComponent('stx-1')

// Clear highlight
__STX_DEVTOOLS__.clearHighlight()
```

### Time Travel Debugging

Navigate through store mutation history:

```javascript
// View store history
const store = __STX_DEVTOOLS__.getStore('userStore')
console.log(store.history)

// Time travel to previous state
__STX_DEVTOOLS__.timeTravel(5, 'userStore') // Go to index 5 in history
```

### Performance Measurement

```typescript
import { measurePerformance, measurePerformanceAsync } from 'stx'

// Measure sync function
const result = measurePerformance('heavyCalculation', () => {
  return computeExpensiveValue()
}, componentId)

// Measure async function
const data = await measurePerformanceAsync('fetchData', async () => {
  return await fetch('/api/data').then(r => r.json())
}, componentId)
```

### Custom Events

Record custom events in the timeline:

```typescript
import { recordEvent } from 'stx'

recordEvent({
  timestamp: Date.now(),
  type: 'user:action',
  componentId: 'stx-1',
  payload: { action: 'clicked', target: 'submit-button' }
})
```

### Keyboard Shortcuts

When DevTools panel is open:

| Key | Action |
|-----|--------|
| Click header | Toggle panel open/closed |
| Click component | Select and highlight component |

### Disabling DevTools

```typescript
import { disableDevTools } from 'stx'

// Disable DevTools (e.g., in production)
disableDevTools()
```

### Best Practices

1. **Only enable in development** - DevTools adds overhead
2. **Use component names** - Makes debugging easier
3. **Register stores** - For full state visibility
4. **Record custom events** - Track user interactions
5. **Use performance measurement** - Find bottlenecks

---

## Custom Directives API

Create your own directives to extend STX's template syntax.

### Define a Simple Directive

```typescript
import { defineDirective } from 'stx'

// Transform directive - modifies content
const uppercase = defineDirective({
  name: 'uppercase',
  description: 'Convert content to uppercase',
  transform: (content) => content.toUpperCase()
})

// Usage: @uppercase Hello World @enduppercase
// Output: HELLO WORLD
```

### Directive with Parameters

```typescript
const highlight = defineDirective({
  name: 'highlight',
  defaults: { color: 'yellow', padding: '0.2em' },
  transform: (content, { color, padding }) =>
    `<mark style="background: ${color}; padding: ${padding}">${content}</mark>`
})

// Usage: @highlight(color: 'lime') Important text @endhighlight
```

### Directive with Validation

```typescript
const truncate = defineDirective({
  name: 'truncate',
  defaults: { length: 100, suffix: '...' },
  validate: ({ length }) => {
    if (length <= 0) return 'Length must be positive'
    return true
  },
  transform: (content, { length, suffix }) =>
    content.length > length
      ? content.slice(0, length) + suffix
      : content
})
```

### Client-Side Directive

```typescript
const tooltip = defineDirective({
  name: 'tooltip',
  transform: (content, { text }) =>
    `<span class="tooltip" data-tip="${text}">${content}</span>`,
  css: () => `
    .tooltip { position: relative; cursor: help; }
    .tooltip::after {
      content: attr(data-tip);
      position: absolute;
      bottom: 100%;
      background: #333;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .tooltip:hover::after { opacity: 1; }
  `,
  client: {
    mounted(el, { value }) {
      el.setAttribute('data-tip', value)
    },
    updated(el, { value }) {
      el.setAttribute('data-tip', value)
    }
  }
})
```

### Built-in Directives

STX includes several built-in directives:

| Directive | Description | Example |
|-----------|-------------|---------|
| `@uppercase` | Convert to uppercase | `@uppercase text @enduppercase` |
| `@lowercase` | Convert to lowercase | `@lowercase TEXT @endlowercase` |
| `@capitalize` | Capitalize first letter | `@capitalize hello @endcapitalize` |
| `@trim` | Remove whitespace | `@trim  text  @endtrim` |
| `@truncate(length, suffix)` | Truncate text | `@truncate(50, '...') long text @endtruncate` |
| `@highlight(color)` | Highlight text | `@highlight(color: 'yellow') text @endhighlight` |
| `@badge(variant)` | Create a badge | `@badge(variant: 'success') New @endbadge` |
| `@code` | Inline code style | `@code const x = 1 @endcode` |
| `@tooltip(text)` | Add tooltip | `@tooltip(text: 'Help') Hover me @endtooltip` |
| `@clipboard` | Copy button | `@clipboard npm install stx @endclipboard` |
| `@currency(amount, currency)` | Format currency | `@currency(amount: 99.99, currency: 'USD')` |
| `@number(value, decimals)` | Format number | `@number(value: 1234.5, decimals: 2)` |
| `@pluralize(count, singular)` | Pluralize | `@pluralize(count: 5, singular: 'item')` |

### Register Custom Directive

```typescript
import { registerDirective } from 'stx'

registerDirective({
  name: 'myDirective',
  hasEndTag: true,
  transform: (content, params, context) => {
    // Access template context
    const user = context.user
    return `<div data-user="${user?.name}">${content}</div>`
  }
})
```

---

## Plugin System

Extend STX with reusable plugins.

### Define a Plugin

```typescript
import { definePlugin } from 'stx'

const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My awesome plugin',

  // Called when plugin is registered
  onRegister(options) {
    console.log('Plugin registered with options:', options)
  },

  // Add directives
  registerDirectives() {
    return [
      {
        name: 'myDirective',
        handler: (content) => content.toUpperCase(),
        hasEndTag: true
      }
    ]
  },

  // Add expression filters
  registerFilters() {
    return {
      reverse: (value) => String(value).split('').reverse().join('')
    }
  },

  // Lifecycle hooks
  beforeProcess({ template, context }) {
    context.pluginData = { initialized: true }
    return { context }
  },

  afterRender({ template }) {
    return { template: template + '<!-- Rendered by my-plugin -->' }
  }
})
```

### Use a Plugin

```typescript
import { pluginManager } from 'stx'

// Register plugin
await pluginManager.register(myPlugin, stxOptions)

// Check if registered
pluginManager.has('my-plugin') // true

// Get plugin
const plugin = pluginManager.get('my-plugin')

// Unregister
await pluginManager.unregister('my-plugin')
```

### Plugin Lifecycle Hooks

| Hook | When Called | Use Case |
|------|-------------|----------|
| `onRegister` | Plugin is registered | Initialize state |
| `beforeProcess` | Before template processing | Add global variables |
| `afterParse` | After parsing, before directives | Template analysis |
| `beforeDirective` | Before each directive phase | Modify behavior |
| `afterDirective` | After each directive phase | Post-process |
| `beforeRender` | Before final output | Last modifications |
| `afterRender` | After final output | Add wrappers/scripts |
| `onError` | On processing error | Error recovery |
| `onUnregister` | Plugin is removed | Cleanup |

### Built-in Plugins

```typescript
import { debugPlugin, timingPlugin, createVariablesPlugin } from 'stx'

// Debug plugin - logs lifecycle events
await pluginManager.register(debugPlugin, options)

// Timing plugin - measures processing time
await pluginManager.register(timingPlugin, options)

// Variables plugin - adds global variables
const varsPlugin = createVariablesPlugin({
  appName: 'My App',
  version: '1.0.0'
})
await pluginManager.register(varsPlugin, options)
```

### Plugin Dependencies

```typescript
const childPlugin = definePlugin({
  name: 'child-plugin',
  dependencies: ['parent-plugin'], // Must be registered first

  onRegister() {
    // parent-plugin is guaranteed to be available
  }
})
```

### Create Directive Plugin

```typescript
import { createDirectivePlugin } from 'stx'

const textPlugin = createDirectivePlugin('text-utils', [
  {
    name: 'reverse',
    handler: (content) => content.split('').reverse().join(''),
    hasEndTag: true
  },
  {
    name: 'repeat',
    handler: (content, [times]) => content.repeat(Number(times) || 1),
    hasEndTag: true
  }
])
```

---

## Testing Utilities

Test STX components with a Vue Test Utils-like API.

### Render a Template

```typescript
import { render } from 'stx/testing'

const { html, container } = await render('<h1>{{ title }}</h1>', {
  context: { title: 'Hello World' }
})

expect(html).toContain('Hello World')
expect(container.querySelector('h1')?.textContent).toBe('Hello World')
```

### Mount a Component

```typescript
import { mount } from 'stx/testing'

const wrapper = await mount('<Button @click="onClick">Click me</Button>', {
  props: { disabled: false },
  context: { onClick: vi.fn() }
})

// Query elements
expect(wrapper.find('button')).toBeTruthy()
expect(wrapper.text()).toContain('Click me')

// Check attributes
expect(wrapper.attributes('disabled')).toBeNull()
expect(wrapper.classes()).not.toContain('disabled')
```

### Fire Events

```typescript
import { mount, fireEvent } from 'stx/testing'

const wrapper = await mount('<input type="text" @input="onInput" />', {
  context: { onInput: vi.fn() }
})

// Fire input event
await fireEvent.input(wrapper.find('input'), 'hello')

// Fire click event
await fireEvent.click(wrapper.find('button'))

// Fire keyboard event
await fireEvent.keyDown(wrapper.find('input'), 'Enter')

// Fire custom event
await fireEvent.custom(wrapper.element, 'my-event', { detail: { foo: 'bar' } })
```

### Check Emitted Events

```typescript
const wrapper = await mount('<Button @click="$emit(\'clicked\', data)" />')

await wrapper.trigger('click')

// Check if event was emitted
expect(wrapper.emitted('clicked')).toBeDefined()
expect(wrapper.emitted('clicked')).toHaveLength(1)

// Check event payload
const [[payload]] = wrapper.emitted('clicked')!
expect(payload).toEqual({ data: 'value' })
```

### Set Props and Data

```typescript
const wrapper = await mount('<Counter :count="count" />', {
  props: { count: 0 }
})

expect(wrapper.text()).toContain('0')

// Update props
await wrapper.setProps({ count: 5 })
expect(wrapper.text()).toContain('5')

// Update data
await wrapper.setData({ internalCount: 10 })
```

### Form Testing

```typescript
const wrapper = await mount(`
  <form @submit="onSubmit">
    <input name="email" type="email" />
    <input name="remember" type="checkbox" />
    <button type="submit">Submit</button>
  </form>
`)

// Set input value
await wrapper.find('input[name="email"]')?.setValue('test@example.com')

// Check checkbox
await wrapper.find('input[name="remember"]')?.setValue(true)

// Submit form
await fireEvent.submit(wrapper.find('form'))
```

### Wait for Conditions

```typescript
import { waitFor, waitForElement, flushPromises } from 'stx/testing'

// Wait for element to appear
const element = await waitForElement(wrapper, '.loaded', { timeout: 1000 })

// Wait for condition
await waitFor(() => wrapper.text().includes('Loaded'))

// Flush pending promises
await flushPromises()

// Wait for next tick
await wrapper.vm.$nextTick()
```

### Mock Functions

```typescript
import { createMockFn } from 'stx/testing'

const mockFn = createMockFn()

mockFn('arg1', 'arg2')

expect(mockFn.mock.calls).toHaveLength(1)
expect(mockFn.mock.calls[0]).toEqual(['arg1', 'arg2'])

// With implementation
mockFn.mockImplementation((a, b) => a + b)
expect(mockFn(1, 2)).toBe(3)

// With return value
mockFn.mockReturnValue(42)
expect(mockFn()).toBe(42)
```

### Custom Matchers

```typescript
import { matchers } from 'stx/testing'

// Check text content
expect(matchers.toContainText(wrapper, 'Hello')).toBe(true)

// Check class
expect(matchers.toHaveClass(wrapper, 'active')).toBe(true)

// Check attribute
expect(matchers.toHaveAttribute(wrapper, 'disabled')).toBe(false)
expect(matchers.toHaveAttribute(wrapper, 'type', 'button')).toBe(true)

// Check visibility
expect(matchers.toBeVisible(wrapper)).toBe(true)

// Check existence
expect(matchers.toExist(wrapper.find('.item'))).toBe(true)

// Check emitted events
expect(matchers.toHaveEmitted(wrapper, 'click')).toBe(true)
expect(matchers.toHaveEmitted(wrapper, 'click', 2)).toBe(true) // emitted twice
expect(matchers.toHaveEmittedWith(wrapper, 'submit', { data: 'value' })).toBe(true)
```

### Test Setup and Cleanup

```typescript
import { createTestContext, cleanup } from 'stx/testing'

describe('MyComponent', () => {
  let ctx: ReturnType<typeof createTestContext>

  beforeEach(() => {
    ctx = createTestContext({
      props: { title: 'Test' },
      context: { user: { name: 'John' } },
      mocks: { fetchData: vi.fn() }
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('works', async () => {
    const wrapper = await mount('<MyComponent :title="title" />', ctx)
    // ...
  })
})
```

### Snapshot Testing

```typescript
it('matches snapshot', async () => {
  const wrapper = await mount('<Card title="Hello" />')
  expect(wrapper.html()).toMatchSnapshot()
})
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

## Virtual Scrolling

Efficiently render large lists using windowing/virtualization.

### @virtualList

Renders only visible items for optimal performance:

```html
<script server>
const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  description: `Description for item ${i}`
}))
</script>

@virtualList(items, { itemHeight: 50, containerHeight: 400, overscan: 3 })
  <div class="item">
    <strong>{{ item.name }}</strong>
    <p>{{ item.description }}</p>
  </div>
@endvirtualList
```

### @virtualGrid

Grid virtualization for image galleries or card layouts:

```html
@virtualGrid(products, { columns: 4, rowHeight: 200, containerHeight: 600, gap: 16 })
  <div class="product-card">
    <img src="{{ item.image }}" alt="{{ item.name }}" />
    <h3>{{ item.name }}</h3>
    <span>${{ item.price }}</span>
  </div>
@endvirtualGrid
```

### @infiniteList

Virtual list with infinite scroll support:

```html
@infiniteList(posts, { itemHeight: 100, containerHeight: 500, threshold: 200 })
  <article class="post">
    <h2>{{ item.title }}</h2>
    <p>{{ item.excerpt }}</p>
  </article>
@loading
  <div class="loading-spinner">Loading more posts...</div>
@endinfiniteList
```

### Virtual List Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `itemHeight` | number | required | Height of each item in pixels |
| `containerHeight` | number | required | Height of the scroll container |
| `overscan` | number | 3 | Buffer items outside viewport |
| `keyProperty` | string | 'id' | Property to use as key |
| `dynamicHeight` | boolean | false | Enable variable item heights |
| `containerClass` | string | '' | CSS class for container |
| `itemClass` | string | '' | CSS class for each item |

### JavaScript API

```typescript
import { createVirtualList, useVirtualList } from 'stx'

// Create virtual list instance
const list = createVirtualList(items, {
  itemHeight: 50,
  containerHeight: 400
})

// Get visible items
const { visibleItems, startIndex, endIndex } = list.getState()

// Scroll to specific item
list.scrollToIndex(500)

// Hook for reactive virtual list
const { visibleItems, containerProps, itemProps, scrollToIndex } = useVirtualList(
  () => items,
  { itemHeight: 50, containerHeight: 400 }
)
```

---

## Partial Hydration (Islands Architecture)

Selectively hydrate interactive components while leaving static content as plain HTML.

### Hydration Strategies

#### @client:load

Hydrate immediately on page load:

```html
@client:load
  <InteractiveWidget />
@endclient
```

#### @client:idle

Hydrate when browser is idle (uses `requestIdleCallback`):

```html
@client:idle(priority: 'high', timeout: 2000)
  <ChatWidget />
@endclient
```

#### @client:visible

Hydrate when component enters viewport (uses `IntersectionObserver`):

```html
@client:visible(rootMargin: '100px', threshold: 0.1)
  <ImageCarousel :images="images" />
@endclient
```

#### @client:media

Hydrate when media query matches:

```html
@client:media(media: '(min-width: 768px)')
  <DesktopNavigation />
@endclient
```

#### @client:hover

Hydrate on first hover or focus:

```html
@client:hover
  <Tooltip content="More info..." />
@endclient
```

#### @client:event

Hydrate on custom event:

```html
@client:event(event: 'user:authenticated')
  <UserDashboard />
@endclient
```

#### @client:only

Client-side only rendering (no SSR):

```html
@client:only
  <BrowserOnlyComponent />
@endclient
```

### Static Content

Mark content as static (never hydrates):

```html
@static
  <footer>
    <p>Copyright 2025 My Company</p>
  </footer>
@endstatic
```

### JavaScript API

```typescript
import {
  hydrateIsland,
  hydrateByStrategy,
  hydrateAll,
  isHydrated,
  onHydrated
} from 'stx'

// Manually hydrate an island
hydrateIsland('island-abc123')

// Hydrate all islands with a specific strategy
hydrateByStrategy('visible')

// Hydrate all pending islands
hydrateAll()

// Check if hydrated
if (isHydrated('island-abc123')) {
  console.log('Island is interactive')
}

// Wait for hydration
await onHydrated('island-abc123')
```

---

## Computed Properties & Reactivity

Full reactivity system with computed properties and watchers.

### ref()

Create reactive references:

```typescript
import { ref } from 'stx'

const count = ref(0)
console.log(count.value) // 0

count.value++
console.log(count.value) // 1

// Subscribe to changes
const unsubscribe = count.subscribe((newValue) => {
  console.log('Count changed:', newValue)
})
```

### computed()

Create computed properties with automatic dependency tracking:

```typescript
import { ref, computed } from 'stx'

const firstName = ref('John')
const lastName = ref('Doe')

// Read-only computed
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
console.log(fullName.value) // 'John Doe'

firstName.value = 'Jane'
console.log(fullName.value) // 'Jane Doe'

// Writable computed
const fullNameWritable = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value) => {
    const [first, last] = value.split(' ')
    firstName.value = first
    lastName.value = last
  }
})

fullNameWritable.value = 'Alice Smith'
console.log(firstName.value) // 'Alice'
```

### watch()

Watch reactive sources:

```typescript
import { ref, watch } from 'stx'

const count = ref(0)

// Basic watch
const stop = watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})

// With options
watch(count, (newValue) => {
  console.log('Count:', newValue)
}, {
  immediate: true,  // Run immediately
  deep: true,       // Deep watch objects
  once: true,       // Stop after first change
  flush: 'post'     // Timing: 'pre' | 'post' | 'sync'
})

// Stop watching
stop()

// Pause/resume
stop.pause()
stop.resume()
```

### watchEffect()

Auto-tracking effect:

```typescript
import { ref, watchEffect } from 'stx'

const count = ref(0)
const multiplier = ref(2)

// Automatically tracks dependencies
const stop = watchEffect(() => {
  console.log(`Result: ${count.value * multiplier.value}`)
})

count.value = 5      // Logs: "Result: 10"
multiplier.value = 3 // Logs: "Result: 15"
```

### watchMultiple()

Watch multiple sources:

```typescript
import { ref, watchMultiple } from 'stx'

const firstName = ref('John')
const lastName = ref('Doe')

watchMultiple([firstName, lastName], ([first, last], [oldFirst, oldLast]) => {
  console.log(`Name changed from ${oldFirst} ${oldLast} to ${first} ${last}`)
})
```

### Debounced & Throttled Computed

```typescript
import { ref, debouncedComputed, throttledComputed } from 'stx'

const searchQuery = ref('')

// Debounced - wait for 300ms of no changes
const debouncedSearch = debouncedComputed(
  () => searchQuery.value.toLowerCase(),
  300
)

// Throttled - update at most every 100ms
const throttledSearch = throttledComputed(
  () => searchQuery.value.toLowerCase(),
  100
)
```

### Template Directives

```html
<!-- Define computed in template -->
@computed(fullName, firstName + ' ' + lastName)

<h1>{{ fullName }}</h1>

<!-- Watch with handler -->
@watch(count)
  function(newValue) {
    console.log('Count is now:', newValue);
  }
@endwatch
```

### Utility Functions

```typescript
import { isRef, unref, toRefs, shallowRef } from 'stx'

// Check if value is a ref
isRef(count) // true

// Unwrap ref (returns value if ref, otherwise returns as-is)
unref(count) // 0
unref(5)     // 5

// Convert object properties to refs
const state = { count: 0, name: 'test' }
const { count, name } = toRefs(state)

// Shallow ref (doesn't make nested objects reactive)
const data = shallowRef({ nested: { value: 1 } })
```

---

*For more details, see the [full documentation](https://stx.sh).*
