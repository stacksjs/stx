![Social Card of stx](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]

# stx

A modern templating engine with Vue-like Single File Components, Laravel Blade directives, and Bun-powered performance.

## Features

- **Vue-like SFC** - `<script>`, `<template>`, `<style>` structure
- **Auto-imported Components** - Use `<Card />` directly, no imports needed
- **Two-way Binding** - `x-model` and `x-text` for reactive forms
- **Blade Directives** - `@if`, `@foreach`, `@layout`, `@section`
- **Props & Slots** - Pass data and content to components
- **200K+ Icons** - Built-in Iconify integration
- **Custom Directives** - Extend with your own directives

## Quick Start

```bash
bun add bun-plugin-stx
```

```toml
# bunfig.toml
preload = ["bun-plugin-stx"]
```

## Single File Components

STX components use a Vue-like structure:

```html
<!-- components/Greeting.stx -->
<script server>
// Server-side only - used for SSR, stripped from output
const name = props.name || 'World'
const time = new Date().toLocaleTimeString()
</script>

<template>
  <div class="greeting">
    <h1>Hello, {{ name }}!</h1>
    <p>Current time: {{ time }}</p>
    <slot />
  </div>
</template>

<style>
.greeting {
  padding: 2rem;
  background: #f5f5f5;
}
</style>
```

### Script Types

| Type | Behavior |
|------|----------|
| `<script server>` | SSR only - extracted for variables, stripped from output |
| `<script client>` | Client only - preserved for browser, skips server evaluation |
| `<script>` | Both - runs on server AND preserved for client |

## Components

Components in `components/` are auto-imported using PascalCase:

```html
<!-- pages/home.stx -->
<Header />

<main>
  <UserCard name="John" role="Admin" />
  <Card title="Welcome">
    <p>This goes into the slot!</p>
  </Card>
</main>

<Footer />
```

### Props

Pass data to components via attributes:

```html
<!-- String prop -->
<Card title="Hello" />

<!-- Expression binding with : -->
<Card :count="items.length" :active="isActive" />

<!-- Mustache interpolation -->
<Card title="{{ userName }}" />
```

Access props in components:

```html
<script server>
const title = props.title || 'Default'
const count = props.count || 0
</script>

<template>
  <h1>{{ title }}</h1>
  <p>Count: {{ count }}</p>
</template>
```

### Slots

Use `<slot />` to inject content:

```html
<!-- components/Card.stx -->
<template>
  <div class="card">
    <h2>{{ props.title }}</h2>
    <slot />
  </div>
</template>
```

```html
<!-- Usage -->
<Card title="News">
  <p>This content appears in the slot!</p>
</Card>
```

### Explicit Imports

For components outside `components/`, use `@import`:

```html
@import('layouts/Sidebar')
@import('shared/Button', 'shared/Modal')

<Sidebar />
<Button label="Click me" />
```

## Layouts

Wrap pages with common structure using `@layout`:

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

```html
<!-- pages/about.stx -->
@layout('default')

@section('content')
  <h1>About Us</h1>
  <p>Welcome to our site.</p>
@endsection
```

## Two-Way Binding (x-element)

For reactive forms, use x-element directives:

```html
<div x-data="{ message: '', count: 0 }">
  <!-- Two-way binding -->
  <input x-model="message" placeholder="Type here..." />

  <!-- Reactive display -->
  <p>You typed: <span x-text="message"></span></p>

  <!-- Event handling -->
  <button @click="count++">Increment</button>
  <button @click="count--">Decrement</button>
  <span x-text="count"></span>
</div>
```

| Directive | Purpose |
|-----------|---------|
| `x-data` | Define reactive scope |
| `x-model` | Two-way binding for inputs |
| `x-text` | Reactive text content |
| `@click` | Event handling |

## Template Directives

### Conditionals

```html
@if (user.isAdmin)
  <AdminPanel />
@elseif (user.isEditor)
  <EditorTools />
@else
  <UserView />
@endif
```

### Loops

```html
@foreach (items as item)
  <li>{{ item.name }}</li>
@endforeach

@for (let i = 0; i < 5; i++)
  <li>Item {{ i }}</li>
@endfor
```

### Auth Guards

```html
@auth
  <p>Welcome back, {{ user.name }}!</p>
@endauth

@guest
  <a href="/login">Please log in</a>
@endguest
```

### Output

```html
<!-- Escaped (safe) -->
{{ userInput }}

<!-- Raw HTML (trusted content only) -->
{!! trustedHtml !!}
```

## Custom Directives

Register custom directives in your build:

```typescript
import { stxPlugin, type CustomDirective } from 'bun-plugin-stx'

const uppercase: CustomDirective = {
  name: 'uppercase',
  handler: (content, params) => params[0]?.toUpperCase() || content.toUpperCase()
}

const wrap: CustomDirective = {
  name: 'wrap',
  hasEndTag: true,
  handler: (content, params) => `<div class="${params[0] || 'wrapper'}">${content}</div>`
}

Bun.build({
  entrypoints: ['./src/index.stx'],
  plugins: [stxPlugin({
    customDirectives: [uppercase, wrap]
  })]
})
```

```html
<!-- Usage -->
<p>@uppercase('hello world')</p>

@wrap('container')
  <p>Wrapped content</p>
@endwrap
```

## Icons

200K+ icons via Iconify:

```html
<HomeIcon size="24" />
<SearchIcon size="20" color="#333" />
```

```bash
bun stx iconify list
bun stx iconify generate material-symbols
```

## Complete Example

```html
<!-- components/TodoApp.stx -->
<script server>
const title = props.title || 'My Todos'
</script>

<template>
  <div class="todo-app" x-data="{ todos: [], newTodo: '' }">
    <h1>{{ title }}</h1>

    <form @submit.prevent="todos.push({ text: newTodo, done: false }); newTodo = ''">
      <input x-model="newTodo" placeholder="Add todo..." />
      <button type="submit">Add</button>
    </form>

    @if (initialTodos)
      <ul>
        @foreach (initialTodos as todo)
          <li>{{ todo.text }}</li>
        @endforeach
      </ul>
    @endif
  </div>
</template>

<style>
.todo-app {
  max-width: 400px;
  margin: 0 auto;
}
</style>
```

## Documentation

- [Full Documentation](https://stx.sh)
- [Syntax Highlighting Guide](./docs/STX_SYNTAX_HIGHLIGHTING.md)
- [Examples](./examples/)

## Testing

```bash
bun test
```

## License

MIT

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@stacksjs/stx?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stacksjs/stx
[npm-downloads-src]: https://img.shields.io/npm/dm/@stacksjs/stx?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@stacksjs/stx
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/stx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/stx/actions?query=workflow%3Aci
