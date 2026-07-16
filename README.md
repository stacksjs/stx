![Social Card of stx](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]

# stx

A modern templating engine with Vue-like Single File Components, Laravel Blade directives, and Bun-powered performance.

## Features

- **Vue-like SFC** - `<script>`, `<template>`, `<style>` structure
- **Auto-imported Components** - Use your `<Card />` directly, no imports needed
- **Reactive Signals** - `state()`, `derived()`, `effect()` for fine-grained reactivity
- **Blade Directives** - `@if`, `@foreach`, `@layout`, `@section`, and 40+ more
- **Expression Filters** - `{{ price | currency }}` with 30+ built-in filters
- **Props & Slots** - Pass data and content to components
- **Form Directives** - `@form`, `@input`, `@select`, `@csrf` with validation
- **SEO & Sitemap** - `@seo`, `@meta`, `@structuredData` with auto-injection
- **PWA Support** - Service worker, manifest, and offline page generation
- **Web Component Libraries** - Compile `.stx` design systems to progressive custom elements with CSS-first rendering, SSR/Declarative Shadow DOM, CEM, JSX types, and ESM bundles
- **200K+ Icons** - Built-in Iconify integration
- **Crosswind CSS** - Utility-first CSS framework integration
- **Native Desktop** - Build desktop apps with `stx dev --native`
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

The `export` keyword is optional in `<script>` tags. All top-level declarations are automatically available to the template:

```html
<script>
const title = 'Hello'           // auto-available
export const count = 42         // also works
function greet(name) {          // auto-available
  return `Hi, ${name}!`
}
</script>

<h1>{{ title }}</h1>
<p>{{ greet('Alice') }}</p>
```

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

Use `<slot />` to inject content into components:

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

## Layouts

Wrap pages with common structure:

```html
<!-- layouts/default.stx -->
<!DOCTYPE html>
<html>
<head>
  <title>{{ title || 'My App' }}</title>
</head>
<body>
  <Header />
  <main>@yield('content')</main>
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

## Template Directives

### Conditionals

```html
@if(user.isAdmin)
  <AdminPanel />
@elseif(user.isEditor)
  <EditorTools />
@else
  <UserView />
@endif

@unless(isAuthenticated)
  <LoginPrompt />
@endunless

@switch(user.role)
  @case('admin')
    <AdminBadge />
    @break
  @case('editor')
    <EditorBadge />
    @break
  @default
    <UserBadge />
@endswitch
```

### Loops

```html
@foreach(items as item)
  <li>{{ item.name }}</li>
@endforeach

@foreach(users as index => user)
  <tr>
    <td>{{ index + 1 }}</td>
    <td>{{ user.name }}</td>
  </tr>
@endforeach

@forelse(notifications as notice)
  <div>{{ notice.message }}</div>
@empty
  <p>No notifications.</p>
@endforelse

@for(let i = 0; i < 5; i++)
  <li>Item {{ i }}</li>
@endfor
```

Loop control with `@break` and `@continue`:

```html
@foreach(items as item)
  @continue(item.hidden)
  @break(item.isLast)
  <li>{{ item.name }}</li>
@endforeach
```

### Expressions & Filters

```html
<!-- Escaped output (safe) -->
{{ userInput }}

<!-- Raw HTML (trusted content only) -->
{!! trustedHtml !!}

<!-- Filters -->
{{ name | uppercase }}
{{ price | currency }}
{{ bio | truncate:100 }}
{{ items | length }}
{{ created | date:'medium' }}

<!-- Chained filters -->
{{ description | stripTags | truncate:200 | capitalize }}
```

Built-in filters: `uppercase`, `lowercase`, `capitalize`, `truncate`, `replace`, `stripTags`, `number`, `currency`, `fmt`, `abs`, `round`, `join`, `first`, `last`, `length`, `reverse`, `slice`, `escape`, `json`, `default`, `urlencode`, `pluralize`, `date`, `translate`.

### Auth Guards

```html
@auth
  <p>Welcome back, {{ user.name }}!</p>
@endauth

@guest
  <a href="/login">Please log in</a>
@endguest

@can('edit-posts')
  <button>Edit</button>
@endcan
```

### Other Directives

```html
@isset(title)
  <h1>{{ title }}</h1>
@endisset

@empty(items)
  <p>Nothing here.</p>
@endempty

@env('production')
  <script src="/analytics.js"></script>
@endenv

{{-- This is a comment and won't appear in output --}}
```

## Forms

Built-in form directives with CSRF protection, validation, and old value preservation:

```html
@form('POST', '/register')
  @input('name', '', { placeholder: 'Full Name' })
  @error('name')
    <span class="error">{{ $message }}</span>
  @enderror

  @input('email', '', { type: 'email', placeholder: 'Email' })

  @textarea('bio')Write about yourself@endtextarea

  @select('country')
    <option value="us">United States</option>
    <option value="uk">United Kingdom</option>
  @endselect

  @checkbox('agree', '1')
  @radio('plan', 'free')
  @radio('plan', 'pro')

  <button type="submit">Register</button>
@endform
```

`@csrf` is automatically included in `@form`. For manual forms, add `@csrf` and `@method('PUT')` for non-POST methods.

## SEO

```html
@seo({
  title: 'Product Name - My Store',
  description: 'High quality product description.',
  canonical: 'https://mystore.com/product/1',
  openGraph: {
    type: 'product',
    image: 'https://mystore.com/img/product.jpg',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mystore',
  },
})

@meta('author', 'John Doe')

@structuredData({
  "@type": "Product",
  "name": "Widget",
  "description": "A great widget",
  "offers": { "@type": "Offer", "price": "29.99" }
})
```

Programmatic sitemap and robots.txt generation:

```typescript
import { generateSitemap, generateRobotsTxt } from '@stacksjs/stx'

const sitemap = generateSitemap([
  { loc: '/', priority: 1.0 },
  { loc: '/about', priority: 0.8 },
  { loc: '/blog', changefreq: 'daily' },
], { baseUrl: 'https://example.com' })

const robots = generateRobotsTxt({
  rules: [{ userAgent: '*', allow: ['/'], disallow: ['/admin'] }],
  sitemap: 'https://example.com/sitemap.xml',
})
```

## Signals (Reactivity)

Fine-grained reactivity with `state()`, `derived()`, and `effect()`:

```html
<script>
const count = state(0)
const doubled = derived(() => count() * 2)

effect(() => {
  console.log('Count changed:', count())
})
</script>

<template>
  <p>Count: {{ count() }}</p>
  <p>Doubled: {{ doubled() }}</p>
  <button @click="count.set(count() + 1)">Increment</button>
</template>
```

## Custom Directives

```typescript
import { stxPlugin, type CustomDirective } from 'bun-plugin-stx'

const uppercase: CustomDirective = {
  name: 'uppercase',
  handler: (content, params) => params[0]?.toUpperCase() || content.toUpperCase(),
}

const wrap: CustomDirective = {
  name: 'wrap',
  hasEndTag: true,
  handler: (content, params) => `<div class="${params[0] || 'wrapper'}">${content}</div>`,
}

Bun.build({
  entrypoints: ['./src/index.stx'],
  plugins: [stxPlugin({ customDirectives: [uppercase, wrap] })],
})
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

## VS Code Extension

The stx VS Code extension provides full IDE support:

- Syntax highlighting for `.stx` files
- TypeScript IntelliSense inside `<script>` blocks
- Autocomplete for 250+ directives
- Hover documentation for directives and variables
- Go-to-definition for templates and components
- Real-time diagnostics (unclosed directives, missing templates)
- Crosswind CSS utility class previews, color decorations, and sorting
- Code folding, document links, and semantic tokens

The extension also exports all its features as a library for building custom plugins:

```typescript
import {
  createHoverProvider,
  createCompletionProvider,
  VirtualTsDocumentProvider,
  ComponentRegistry,
  activateCrosswind,
} from 'vscode-stacks'
```

## Packages

| Package | Description |
|---------|-------------|
| [`stx`](./packages/stx) | Core template processing engine |
| [`bun-plugin-stx`](./packages/bun-plugin) | Bun plugin for `.stx` file processing |
| [`vscode-stacks`](./packages/vscode) | VS Code extension with TypeScript support |
| [`@stacksjs/desktop`](./packages/desktop) | Native desktop app framework (via Craft) |
| [`@stacksjs/markdown`](./packages/markdown) | Markdown parsing with frontmatter |
| [`@stacksjs/sanitizer`](./packages/sanitizer) | HTML/XSS sanitization |
| [`stx-devtools`](./packages/devtools) | Development tooling |

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build all packages
bun run build

# Lint
bun run lint
```

## Documentation

- [Full Documentation](https://stx.stacksjs.com)
- [Examples](./examples/)

## License

MIT

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@stacksjs/stx?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stacksjs/stx
[npm-downloads-src]: https://img.shields.io/npm/dm/@stacksjs/stx?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@stacksjs/stx
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/stx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/stx/actions?query=workflow%3Aci
