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
    @yield('content')
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

### Multiple Yields
```html
<!-- Layout -->
<head>
  @yield('head')
</head>
<body>
  @yield('content')
  @yield('scripts')
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
