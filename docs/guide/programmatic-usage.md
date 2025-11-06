# Using stx Programmatically

This guide explains how to use `@stacksjs/stx` and `bun-plugin-stx` programmatically to build documentation systems like VitePress/BunPress.

## Overview

Both packages are designed to work programmatically:

- **`@stacksjs/stx`** - Core templating engine with serve API
- **`bun-plugin-stx`** - Bun plugin for build-time processing

## Quick Start

### 1. Install

```bash
bun add @stacksjs/stx
```

### 2. Create a Server

```typescript
import { serve } from '@stacksjs/stx'

const { server, url } = await serve({
  port: 3000,
  root: './docs',
  watch: true,
})

console.log(`Server running at ${url}`)
```

### 3. Add Your Content

Create `.md` or `.stx` files in `./docs`:

```markdown
---
title: "My Page"
---

# Welcome

This is **markdown** with frontmatter support!
```

## Serve API

### Basic Usage

```typescript
import { serve, ServeOptions } from '@stacksjs/stx'

const options: ServeOptions = {
  port: 3000,
  root: './content',
  watch: true,
  stxOptions: {
    markdown: {
      syntaxHighlighting: {
        enabled: true,
        serverSide: true,
        defaultTheme: 'github-dark',
      },
    },
  },
}

const { server, url, stop } = await serve(options)
```

### Middleware

Add custom middleware to process requests:

```typescript
import { serve, createMiddleware } from '@stacksjs/stx'

// Add layout wrapper
const layoutMiddleware = createMiddleware(async (request, next) => {
  const response = await next()
  const content = await response.text()

  // Wrap in layout
  const wrappedContent = `
    <!DOCTYPE html>
    <html>
      <head><title>My Site</title></head>
      <body>
        <nav>Navigation here</nav>
        <main>${content}</main>
      </body>
    </html>
  `

  return new Response(wrappedContent, {
    headers: { 'Content-Type': 'text/html' },
  })
})

await serve({
  root: './docs',
  middleware: [layoutMiddleware],
})
```

### Custom Routes

Add custom route handlers:

```typescript
import { serve, createRoute } from '@stacksjs/stx'

await serve({
  root: './docs',
  routes: {
    '/api/search': createRoute(async (request) => {
      const query = new URL(request.url).searchParams.get('q')
      const results = await searchDocs(query)
      return Response.json(results)
    }),
  },
})
```

### Error Handling

Custom error and 404 handlers:

```typescript
await serve({
  root: './docs',
  on404: (request) => {
    return new Response('Page not found', { status: 404 })
  },
  onError: (error, request) => {
    console.error('Error:', error)
    return new Response(`Error: ${error.message}`, { status: 500 })
  },
})
```

## Configuration-Driven Documentation

### Load Config File

```typescript
// Load bunPress.config.ts
const configModule = await import('./bunPress.config.ts')
const config = configModule.default

// Use config
await serve({
  port: config.server?.port || 3000,
  root: config.contentDir || './docs',
  stxOptions: config.markdown,
})
```

### Generate Navigation from Config

```typescript
interface NavItem {
  text: string
  link: string
  items?: NavItem[]
}

function generateNav(nav: NavItem[]): string {
  return nav.map(item => {
    if (item.items) {
      return `<div class="dropdown">
        <span>${item.text}</span>
        <div class="dropdown-menu">
          ${generateNav(item.items)}
        </div>
      </div>`
    }
    return `<a href="${item.link}">${item.text}</a>`
  }).join('')
}
```

### Auto-Generate Sidebar from Files

```typescript
import fs from 'node:fs'
import path from 'node:path'

async function generateSidebar(dir: string): Promise<SidebarItem[]> {
  const items: SidebarItem[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      items.push({
        text: entry.name,
        items: await generateSidebar(path.join(dir, entry.name)),
      })
    } else if (entry.name.endsWith('.md')) {
      const { data } = await readMarkdownFile(path.join(dir, entry.name))
      items.push({
        text: data.title || entry.name.replace('.md', ''),
        link: `/${path.relative(contentDir, path.join(dir, entry.name)).replace('.md', '')}`,
      })
    }
  }

  return items
}
```

## Using bun-plugin-stx

For build-time processing:

```typescript
import stxPlugin from 'bun-plugin-stx'

// Build all stx/md files
await Bun.build({
  entrypoints: ['./docs/index.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
})
```

With custom config:

```typescript
await Bun.build({
  entrypoints: ['./docs/index.stx'],
  outdir: './dist',
  plugins: [stxPlugin],
  config: {
    stx: {
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
        },
      },
      cache: true,
      cachePath: '.stx/cache',
    },
  },
})
```

## Complete Example: BunPress-like System

```typescript
import { serve, createMiddleware } from '@stacksjs/stx'
import { readMarkdownFile } from '@stacksjs/stx'

// Load config
const config = await loadConfig('./bunPress.config.ts')

// Generate sidebar from files
const sidebar = await generateSidebar(config.contentDir)

// Layout middleware
const layout = createMiddleware(async (request, next) => {
  const response = await next()
  const content = await response.text()
  const url = new URL(request.url)

  return new Response(
    wrapInLayout(content, {
      title: config.title,
      nav: config.nav,
      sidebar,
      currentPath: url.pathname,
    }),
    { headers: response.headers },
  )
})

// Start server
const { server, url } = await serve({
  port: config.server.port,
  root: config.contentDir,
  middleware: [layout],
  stxOptions: config.markdown,
  watch: config.server.watch,
})

console.log(`📚 Documentation at ${url}`)
```

## Features Available

### Core Features

✅ Markdown processing with frontmatter
✅ Syntax highlighting (Shiki)
✅ stx template directives
✅ Component system
✅ i18n support
✅ Caching system
✅ Error handling
✅ File watching

### Programmatic Features

✅ Custom middleware
✅ Custom routes
✅ Configuration loading
✅ Auto-discovery
✅ Layout system
✅ Build-time processing

## API Reference

### `serve(options: ServeOptions)`

Start a development server.

**Options:**
- `port?: number` - Server port
- `root?: string` - Content directory
- `watch?: boolean` - Enable file watching
- `stxOptions?: StxOptions` - stx configuration
- `middleware?: Middleware[]` - Middleware functions
- `routes?: Record<string, RouteHandler>` - Custom routes
- `onRequest?: RequestHandler` - Custom request handler
- `on404?: NotFoundHandler` - 404 handler
- `onError?: ErrorHandler` - Error handler

**Returns:**
```typescript
{
  server: Server,
  url: string,
  stop: () => void
}
```

### `serveFile(filePath: string, options?)`

Serve a single file.

### `readMarkdownFile(filePath: string, options?)`

Read and process a markdown file.

**Returns:**
```typescript
{
  content: string,      // Rendered HTML
  data: object         // Frontmatter data
}
```

### `processDirectives(template, context, filePath, options, dependencies)`

Process stx directives in a template.

## Examples

See the [examples directory](https://github.com/stacksjs/stx/tree/main/examples) for complete working examples.

## Building BunPress

To build a complete BunPress system, combine these features:

1. **Config Loading** - Load `bunPress.config.ts`
2. **Auto-Discovery** - Scan content directory
3. **Navigation** - Generate from config/files
4. **Layouts** - Wrap content with middleware
5. **Search** - Add search route handler
6. **Build** - Use bun-plugin for static generation
7. **Deploy** - Serve static files or use edge functions

## Next Steps

- See [examples](https://github.com/stacksjs/stx/tree/main/examples) for full examples
- Check [API documentation](/api/index) for detailed reference
- Read [package source](https://github.com/stacksjs/stx/blob/main/packages/stx/src/serve.ts) for implementation details
