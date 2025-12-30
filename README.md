![Social Card of stx](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]

# stx

A modern templating framework with Laravel Blade-like syntax, Vue-style Single File Components, and Bun-powered performance.

## Features

- **Single File Components** - Standard `<script>` and `<style>` tags
- **Blade Directives** - `@if`, `@foreach`, `@component`, `@layout`, and more
- **Client Reactivity** - Vue-like `ref`, `reactive`, `watch`, `onMounted`
- **200K+ Icons** - Built-in Iconify integration
- **Zero Config** - Works out of the box

## Quick Start

```bash
bun add bun-plugin-stx
```

```toml
# bunfig.toml
preload = ["bun-plugin-stx"]
```

## Single File Components

STX uses a familiar structure with `<script>`, `<style>`, and template:

```html
<!-- components/greeting.stx -->
<script>
  const name = 'World'
  const time = new Date().toLocaleTimeString()
</script>

<div class="greeting">
  <h1>Hello, {{ name }}!</h1>
  <p>Current time: {{ time }}</p>
</div>

<style>
  .greeting {
    padding: 2rem;
    background: #f5f5f5;
  }
</style>
```

Variables in `<script>` are automatically available in the template.

## Components

Use `@component` to include components:

```html
<!-- pages/home.stx -->
@component('header')

<main>
  @component('user-card', { name: 'John', role: 'Admin' })
</main>

@component('footer')
```

Components receive props directly:

```html
<!-- components/user-card.stx -->
<div class="card">
  <h3>{{ name }}</h3>
  <span>{{ role }}</span>
</div>
```

## Layouts

Use `@layout` to wrap pages with common structure:

```html
<!-- layouts/default.stx -->
<!DOCTYPE html>
<html>
<head>
  <title>{{ title || 'My App' }}</title>
</head>
<body>
  @component('navbar')

  <main>
    {{ slot }}
  </main>

  @component('footer')
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

`{{ slot }}` is equivalent to `@yield('content')`.

## Client-Side Reactivity

Use `<script client>` for browser-side JavaScript with Vue-like reactivity:

```html
<script client>
  import { ref, onMounted, watch } from 'stx'

  const count = ref(0)
  const users = ref([])

  onMounted(async () => {
    users.value = await fetch('/api/users').then(r => r.json())
  })

  watch(count, (newVal, oldVal) => {
    console.log(`Count: ${oldVal} -> ${newVal}`)
  })
</script>

<button onclick="count.value++">Count: <span id="count">0</span></button>
```

### Available Imports

```javascript
import {
  // Reactive state
  ref,           // ref(0) - access via .value
  reactive,      // reactive({}) - direct property access
  computed,      // computed(() => x.value * 2)

  // Watch
  watch,         // watch(source, callback)
  watchEffect,   // watchEffect(() => { ... })

  // Lifecycle
  onMounted,     // After DOM insertion
  onUnmounted,   // Before removal (cleanup)
  onBeforeMount,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount
} from 'stx'
```

## Template Directives

### Conditionals

```html
@if(user.isAdmin)
  <div>Admin Panel</div>
@elseif(user.isEditor)
  <div>Editor Tools</div>
@else
  <div>User View</div>
@endif
```

### Loops

```html
@foreach(items as item)
  <li>{{ item.name }}</li>
@endforeach

@for(let i = 0; i < 5; i++)
  <li>Item {{ i }}</li>
@endfor
```

### Raw HTML

```html
{!! trustedHtmlContent !!}
```

## Complete Example

```html
<!-- components/todo-list.stx -->
<script>
  const title = 'My Todos'
</script>

<script client>
  import { ref, onMounted } from 'stx'

  const todos = ref([])
  const newTodo = ref('')

  onMounted(async () => {
    todos.value = await fetch('/api/todos').then(r => r.json())
  })

  function addTodo() {
    if (newTodo.value.trim()) {
      todos.value.push({ id: Date.now(), text: newTodo.value, done: false })
      newTodo.value = ''
    }
  }

  function toggleTodo(id) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) todo.done = !todo.done
  }
</script>

<div class="todo-app">
  <h1>{{ title }}</h1>

  <form onsubmit="event.preventDefault(); addTodo()">
    <input type="text" id="newTodo" placeholder="Add todo..." />
    <button type="submit">Add</button>
  </form>

  <ul id="todoList"></ul>
</div>

<style>
  .todo-app {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
  }
  .done {
    text-decoration: line-through;
    opacity: 0.6;
  }
</style>
```

## Icons

200K+ icons via Iconify:

```html
<HomeIcon size="24" />
<SearchIcon size="20" color="#333" />
<SettingsIcon size="24" className="nav-icon" />
```

```bash
# Generate icon packages
bun stx iconify list
bun stx iconify generate material-symbols
```

## Documentation

- [Full Documentation](https://stx.sh)
- [API Reference](./docs/api/)
- [Examples](./docs/examples.md)

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
