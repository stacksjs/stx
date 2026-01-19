---
title: Getting Started
description: Get started with STX templating engine
---

# Getting Started

STX is a modern templating engine with Vue-like Single File Components, Laravel Blade directives, and Bun-powered performance.

## Prerequisites

Ensure you have [Bun](https://bun.sh) installed:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation

Install the STX Bun plugin:

```bash
bun add bun-plugin-stx
```

## Configuration

Add STX to your Bun configuration:

```toml
# bunfig.toml
preload = ["bun-plugin-stx"]
```

Or configure programmatically:

```typescript
import { stxPlugin } from 'bun-plugin-stx'

await Bun.build({
  entrypoints: ['./src/index.stx'],
  plugins: [stxPlugin()],
})
```

## Your First Component

Create a simple STX component:

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
  </div>
</template>

<style>
.greeting {
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
}
</style>
```

## Project Structure

A typical STX project structure:

```
my-project/
  components/           # Auto-imported components
    Header.stx
    Footer.stx
    Card.stx
  layouts/              # Layout templates
    default.stx
    blog.stx
  pages/                # Page templates
    index.stx
    about.stx
  stx.config.ts         # Configuration file
  bunfig.toml           # Bun configuration
```

## Using Components

Components in `components/` are auto-imported by PascalCase name:

```html
<!-- pages/home.stx -->
<Header />

<main>
  <Card title="Welcome">
    <p>Content goes here!</p>
  </Card>
</main>

<Footer />
```

## Development Server

Start the development server:

```bash
stx serve pages/ --port 3000
```

Or use the CLI:

```bash
bunx stx dev
```

## Building for Production

Build your templates:

```typescript
import { stxPlugin } from 'bun-plugin-stx'

await Bun.build({
  entrypoints: ['./pages/index.stx'],
  outdir: './dist',
  plugins: [stxPlugin({
    componentsDir: './components',
    layoutsDir: './layouts',
  })],
})
```

## What's Next?

- Learn about [Components](/guide/components) and Single File Components
- Explore [Directives](/guide/directives) like `@if`, `@foreach`, and `x-model`
- Understand [Props and Slots](/guide/props-slots) for component composition
- Discover [200K+ Icons](/guide/icons) built into STX

::: tip Stacks Integration
STX is part of the [Stacks](https://stacksjs.org) framework ecosystem. When using Stacks, STX is automatically configured for your views and components.
:::
