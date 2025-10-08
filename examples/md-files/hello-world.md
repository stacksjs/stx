---
title: "Hello World - stx Markdown Demo"
description: "A simple hello world example using stx markdown templating"
author: "stx"
date: 2025-10-08
themeColor: "#FFFFFF"
---

# Hello, World

Welcome to the **stx** templating engine with Markdown support!

This page demonstrates how stx can render Markdown files with frontmatter data and template variables.

## What is stx?

stx is a fast and powerful templating engine for Bun that brings Laravel Blade-inspired syntax to JavaScript/TypeScript projects.

### Key Features

- **Laravel Blade-like syntax** - Familiar directives like `@if`, `@foreach`, `@for`
- **Markdown support** - Native markdown rendering with frontmatter
- **Server-side rendering** - Execute JavaScript/TypeScript on the server
- **Web Components** - Auto-generate custom elements
- **i18n support** - Built-in internationalization
- **Icon system** - 200,000+ icons from Iconify

## Code Example

Here's a simple example of stx syntax:

```html
<script>
  export const name = 'World';
  export const items = ['Apple', 'Banana', 'Cherry'];
</script>

<h1>Hello, {{ name }}!</h1>

<ul>
  @foreach (items as item)
    <li>{{ item }}</li>
  @endforeach
</ul>
```

## Getting Started

1. **Install stx**

   ```bash
   bun add bun-plugin-stx
   ```

2. **Create a template file**
   Create a `.stx` or `.md` file with your content

3. **Run the dev server**

   ```bash
   stx dev your-file.stx
   # or
   stx your-file.md
   ```

## Why Use stx?

> stx combines the simplicity of Blade templates with the performance of Bun, making it perfect for building fast, modern web applications.

### Benefits

- **Fast** - Built on Bun for maximum performance
- **Simple** - Intuitive Blade-like syntax
- **Powerful** - Full JavaScript/TypeScript support
- **Flexible** - Works with HTML, Markdown, and more

## Next Steps

Try editing this file and see the changes automatically reload!

You can also explore:

- [Component examples](/examples/components/)
- [Form handling](/examples/form-demo.stx)
- [Icon system](/examples/iconify/)

---

**Page rendered at:** ${new Date().toLocaleTimeString()}

**Theme Color:** <span style="color: {{ themeColor }}">{{ themeColor }}</span>
