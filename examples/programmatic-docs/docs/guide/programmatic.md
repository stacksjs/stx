---
title: "Building BunPress"
description: "Build your own VitePress-like documentation system"
---

# Building BunPress with stx

Learn how to build BunPress - a VitePress-like documentation system using stx programmatically.

## Overview

BunPress is a documentation system that:
- Serves markdown files with frontmatter
- Auto-generates navigation from config
- Provides hot reload during development
- Supports custom themes and layouts
- Can build static sites

## Step 1: Setup

Create your project structure:

```
bunpress/
├── docs/                # Your markdown files
│   ├── index.md
│   └── guide/
│       └── intro.md
├── bunpress.config.ts   # Configuration
├── index.ts             # Server implementation
└── package.json
```

## Step 2: Configuration

Create `bunpress.config.ts`:

```typescript
export default {
  title: 'My Documentation',
  description: 'Documentation built with BunPress',

  // Navigation menu
  nav: [
    { text: 'Home', link: '/' },
    { text: 'Guide', link: '/guide/' },
    { text: 'API', link: '/api/' },
  ],

  // Sidebar configuration
  sidebar: [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/guide/intro' },
        { text: 'Installation', link: '/guide/install' },
      ],
    },
  ],

  // Server options
  server: {
    port: 3000,
    watch: true,
  },

  // Markdown options
  markdown: {
    syntaxHighlighting: {
      enabled: true,
      serverSide: true,
      defaultTheme: 'github-dark',
    },
  },
}
```

## Step 3: Load Configuration

Create a config loader:

```typescript
export async function loadConfig(configPath = './bunpress.config.ts') {
  try {
    const module = await import(configPath)
    return module.default
  } catch (error) {
    console.warn('No config found, using defaults')
    return {
      title: 'Documentation',
      server: { port: 3000, watch: true },
    }
  }
}
```

## Step 4: Generate Navigation

Auto-generate sidebar from files:

```typescript
import fs from 'node:fs'
import path from 'node:path'
import { readMarkdownFile } from '@stacksjs/stx'

export async function generateSidebar(contentDir: string) {
  const sidebar = []

  async function scan(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        const items = await scan(fullPath)
        if (items.length > 0) {
          sidebar.push({
            text: entry.name,
            items
          })
        }
      } else if (entry.name.endsWith('.md')) {
        // Get title from frontmatter
        const { data } = await readMarkdownFile(fullPath)
        const link = fullPath.replace(contentDir, '').replace('.md', '')

        sidebar.push({
          text: data.title || entry.name.replace('.md', ''),
          link
        })
      }
    }

    return sidebar
  }

  return scan(contentDir)
}
```

## Step 5: Create Layout

Build a layout wrapper:

```typescript
export function createLayout(content: string, config: any, currentPath: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <style>
    body {
      font-family: -apple-system, system-ui, sans-serif;
      margin: 0;
      display: grid;
      grid-template-columns: 250px 1fr;
    }
    .sidebar {
      background: #f6f6f7;
      padding: 2rem 1rem;
      height: 100vh;
      overflow-y: auto;
    }
    .sidebar a {
      display: block;
      padding: 0.5rem;
      color: #333;
      text-decoration: none;
    }
    .sidebar a.active {
      color: #0066cc;
      font-weight: 600;
    }
    .main {
      padding: 2rem 4rem;
      max-width: 900px;
    }
  </style>
</head>
<body>
  <aside class="sidebar">
    ${buildSidebar(config.sidebar, currentPath)}
  </aside>
  <main class="main">
    ${content}
  </main>
</body>
</html>`
}

function buildSidebar(items: any[], currentPath: string) {
  return items.map(item => {
    if (item.items) {
      return `
        <div>
          <strong>${item.text}</strong>
          ${buildSidebar(item.items, currentPath)}
        </div>
      `
    }
    const isActive = item.link === currentPath
    return `<a href="${item.link}" class="${isActive ? 'active' : ''}">${item.text}</a>`
  }).join('')
}
```

## Step 6: Start Server

Use stx's serve API with middleware:

```typescript
import { serve, createMiddleware } from '@stacksjs/stx'

const config = await loadConfig()
const sidebar = await generateSidebar('./docs')

// Layout middleware
const layoutMiddleware = createMiddleware(async (request, next) => {
  const response = await next()
  const content = await response.text()
  const url = new URL(request.url)

  const html = createLayout(content, { ...config, sidebar }, url.pathname)

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  })
})

// Start server
const { server, url } = await serve({
  port: config.server.port,
  root: './docs',
  watch: config.server.watch,
  middleware: [layoutMiddleware],
  stxOptions: {
    markdown: config.markdown
  }
})

console.log(`📚 BunPress running at ${url}`)
```

## Step 7: Add Search (Optional)

Add simple search functionality:

```typescript
import { createRoute } from '@stacksjs/stx'

const searchRoute = createRoute(async (request) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')

  // Search through markdown files
  const results = await searchDocs(query)

  return Response.json(results)
})

// Add to serve options
serve({
  // ...
  routes: {
    '/api/search': searchRoute
  }
})
```

## Step 8: Build Static Site (Optional)

Generate static HTML files:

```typescript
import stxPlugin from 'bun-plugin-stx'

export async function build(config: any) {
  const files = glob('./docs/**/*.md')

  for (const file of files) {
    await Bun.build({
      entrypoints: [file],
      outdir: './dist',
      plugins: [stxPlugin],
    })
  }

  console.log('✅ Build complete!')
}
```

## Complete Example

The full working example is in this directory (`examples/programmatic-docs`). Run it:

```bash
cd examples/programmatic-docs
bun run index.ts
```

Open [http://localhost:3000](http://localhost:3000) to see your BunPress documentation!

## Next Steps

- Add custom themes
- Implement full-text search
- Add i18n support
- Create CLI tool
- Add deployment scripts

## See Also

- [Programmatic API](/guide/programmatic-usage) - Full API reference
- [Serve API](/api/serve) - Server API documentation
- [Markdown API](/api/markdown) - Markdown processing
