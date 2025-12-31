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
- **Client Scripts** - `<script client>` for browser-side JavaScript
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

## Client Scripts

Use `<script client>` for browser-side JavaScript:

```html
<script client>
  let count = 0

  document.getElementById('increment').addEventListener('click', () => {
    count++
    document.getElementById('count').textContent = count
  })
</script>

<button id="increment">Count: <span id="count">0</span></button>
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
  let todos = []

  async function init() {
    todos = await fetch('/api/todos').then(r => r.json())
    render()
  }

  function addTodo() {
    const input = document.getElementById('newTodo')
    if (input.value.trim()) {
      todos.push({ id: Date.now(), text: input.value, done: false })
      input.value = ''
      render()
    }
  }

  function toggleTodo(id) {
    const todo = todos.find(t => t.id === id)
    if (todo) todo.done = !todo.done
    render()
  }

  function render() {
    document.getElementById('todoList').innerHTML = todos
      .map(t => `<li class="${t.done ? 'done' : ''}" onclick="toggleTodo(${t.id})">${t.text}</li>`)
      .join('')
  }

  init()
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
