# Introduction to `stx`

`stx` is a high-performance Blade-like template engine for Bun. It combines familiar Laravel Blade syntax with the speed of Bun's runtime, delivering exceptional performance for server-side templating.

## What is `stx`?

`stx` is a Bun plugin that processes `.stx` template files with Laravel Blade-inspired syntax. It allows you to:

- Write templates with clean, Blade-like directives (`@if`, `@foreach`, `@component`, etc.)
- Use JavaScript/TypeScript directly in your templates
- Import and serve `.stx` files as HTML
- Process templates at build time or runtime
- Leverage Bun's performance for fast template processing

## Why `stx`?

### ⚡ Performance-Optimized

`stx` packages consistently outperform industry-standard alternatives:

**Markdown Parser:**

- **2.89x faster** than `markdown-it` on small documents
- **1.96x faster** than `markdown-it` on medium documents
- **1.45x faster** than `markdown-it` on large documents

**HTML Sanitizer:**

- **1.7-72.4x faster** than competitors on safe HTML
- **1.95-145.6x faster** on XSS attack vectors
- **1.88-37.2x faster** on large documents

[View detailed benchmarks](/features/benchmarks)

### 🦋 Familiar Syntax

If you know Laravel Blade, you already know `stx`:

```html
@if (user.isAdmin)
  <admin-panel />
@else
  <user-panel />
@endif

@foreach (items as item)
  <li>{{ item.name }}</li>
@endforeach
```

### 🚀 Built for Bun

Optimized specifically for Bun's runtime:

- Fast template compilation
- Efficient module loading
- Direct integration with Bun's bundler
- No complex build configuration needed

### 🎯 Developer Experience

- Familiar Blade-like syntax
- Hot reload with dev server
- TypeScript support for template data
- VSCode extension with syntax highlighting
- Comprehensive CLI tools
- Built-in accessibility checking

## Quick Example

Here's a complete stx template:

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
  <script>
    // Define template data
    export const title = "My App"
    export const user = {
      name: "John Doe",
      isAdmin: true
    }
    export const items = [
      { id: 1, name: "Apple" },
      { id: 2, name: "Banana" },
      { id: 3, name: "Cherry" }
    ]
  </script>
</head>
<body>
  <h1>Welcome, {{ user.name }}!</h1>

  @if (user.isAdmin)
    <div class="admin-badge">Administrator</div>
  @endif

  <ul>
    @foreach (items as item)
      <li data-id="{{ item.id }}">{{ item.name }}</li>
    @endforeach
  </ul>
</body>
</html>
```

## Core Directives

### Conditionals

```html
@if (condition)
  <!-- content -->
@elseif (otherCondition)
  <!-- content -->
@else
  <!-- content -->
@endif
```

### Loops

```html
<!-- Foreach loop -->
@foreach (items as item)
  <div>{{ item }}</div>
@endforeach

<!-- For loop -->
@for (let i = 0; i < 10; i++)
  <div>{{ i }}</div>
@endfor
```

### Includes

```html
@include('partials/header')
@include('partials/nav', { active: 'home' })
```

### Markdown

```html
@markdown
# Heading

This is **markdown** content.
@endmarkdown
```

### Authentication

```html
@auth
  <user-menu />
@endauth

@guest
  <login-button />
@endguest
```

## Key Features

### 📦 Modular Packages

`stx` is built from high-performance packages:

```sh
# Use individual packages
bun add @stacksjs/markdown      # Fast markdown parser
bun add @stacksjs/sanitizer     # Secure HTML sanitizer

# Or use the full template engine
bun add bun-plugin-stx
```

### 🌐 Internationalization

Built-in i18n support with YAML/JSON translations:

```html
<h1>@translate('welcome')</h1>
<p>{{ 'greeting' | t({ name: user.name }) }}</p>
```

### ♿ Accessibility

Automatic accessibility checking and helpers:

```html
@a11y(check)
  <button>Click me</button>
@enda11y

@screenReader
  This text is only for screen readers
@endscreenReader
```

### 🎨 Animation

Built-in animation directives:

```html
@transition(fade, 300ms)
  <div>Animated content</div>
@endtransition

@motion(slideIn, { delay: 100 })
  <card />
@endmotion
```

### 🔍 SEO

SEO helpers and metadata:

```html
@meta(title, "Page Title")
@meta(description, "Page description")
@meta(og:image, "/preview.jpg")

@structuredData({
  "@type": "Article",
  "headline": title
})
```

### 🧩 Web Components

Convert stx templates to Web Components:

```ts
// stx.config.ts
export default {
  webComponents: {
    enabled: true,
    components: [
      {
        name: 'MyButton',
        tag: 'my-button',
        file: 'components/button.stx'
      }
    ]
  }
}
```

### 📊 Performance Monitoring

Built-in performance tracking:

```sh
# Analyze template performance
stx analyze templates/**/*.stx

# Show performance stats
stx perf
```

## Architecture Highlights

`stx` achieves exceptional performance through:

- **Flat token stream**: Efficient parsing with minimal allocations
- **Position-based parsing**: Reduces string operations
- **Optimized escaping**: Fast-path for common cases
- **Bun-native optimizations**: Leverages Bun's fast APIs
- **Smart caching**: Caches compiled templates

## Use Cases

`stx` is perfect for:

- **Server-side rendering** - Fast HTML generation with Bun
- **Static site generation** - Build-time template processing
- **Email templates** - Dynamic email content
- **Documentation** - Markdown + templates
- **Component libraries** - Web Components from templates
- **Prototyping** - Rapid development with familiar syntax

## Getting Started

Ready to build with `stx`?

1. **[Installation](/guide/install)** - Set up `stx` in minutes
2. **[Quick Start](/guide/usage)** - Learn template syntax
3. **[Directives](/guide/directives)** - Master all directives
4. **[Examples](/examples)** - See real-world patterns

## Community & Support

Join the `stx` community:

- [Discord Server](https://discord.gg/stacksjs) - Get help and share ideas
- [GitHub](https://github.com/stacksjs/stx) - Report issues and contribute
- [Twitter](https://twitter.com/stacksjs) - Stay updated
- [Best Practices](/guide/best-practices) - Learn from the community

## Open Source

`stx` is MIT licensed and built by contributors from around the world. We welcome contributions of all kinds.

**Sponsors:**

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Next Steps

- Explore [Performance benchmarks](/features/benchmarks)
- Learn about [Configuration options](/guide/config)
- Understand [Security features](/guide/security)
- Browse the [CLI commands](/api/cli)
