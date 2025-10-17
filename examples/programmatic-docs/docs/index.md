---
title: "Welcome to stx Documentation"
description: "Learn how to build fast, modern web applications with stx"
---

# Welcome to stx Documentation

stx is a powerful templating engine for Bun that brings Laravel Blade-inspired syntax to JavaScript/TypeScript projects.

## Quick Example

```stx
<script>
  module.exports = {
    title: "Hello World",
    items: ['Apple', 'Banana', 'Cherry']
  };
</script>

<h1>{{ title }}</h1>

<ul>
  @foreach(items as item)
    <li>{{ item }}</li>
  @endforeach
</ul>
```

## Features

- **Laravel Blade-like syntax** - Familiar directives like `@if`, `@foreach`, `@for`
- **Markdown support** - Native markdown rendering with frontmatter
- **Server-side rendering** - Execute JavaScript/TypeScript on the server
- **Component system** - Reusable, composable components
- **i18n support** - Built-in internationalization
- **Fast** - Built on Bun for maximum performance

## Getting Started

Check out our [Installation Guide](/guide/install) to get started with stx.

Or jump straight to the [Quick Start](/guide/quickstart) tutorial.
