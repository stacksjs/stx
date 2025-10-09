# Programmatic Documentation Example

This example demonstrates how to use stx programmatically to build a VitePress-like documentation system.

## Overview

This example shows:
- How to use the `serve()` API from `@stacksjs/stx`
- How to create middleware for wrapping content in layouts
- How to handle configuration files
- How to automatically process `.md` and `.stx` files
- How to build navigation and sidebars from configuration

## Project Structure

```
programmatic-docs/
├── index.ts                  # Main server implementation
├── bunPress.config.ts        # Configuration file (example)
├── docs/                     # Documentation content
│   ├── index.md             # Homepage
│   └── guide/
│       └── intro.md         # Guide pages
└── README.md                # This file
```

## Running the Example

1. Install dependencies:
```bash
bun install
```

2. Run the server:
```bash
bun run index.ts
```

3. Open your browser to `http://localhost:3000`

## How It Works

### 1. Server Setup

The example uses the `serve()` function from `@stacksjs/stx`:

```typescript
import { serve } from '@stacksjs/stx'

const { server, url, stop } = await serve({
  port: 3000,
  root: './docs',
  watch: true,
  middleware: [layoutMiddleware],
  stxOptions: {
    markdown: {
      syntaxHighlighting: {
        enabled: true,
        serverSide: true,
        defaultTheme: 'github-dark',
      },
    },
  },
})
```

### 2. Middleware for Layouts

Content is wrapped in a documentation layout using middleware:

```typescript
const layoutMiddleware = createMiddleware(async (request, next) => {
  const response = await next()
  const content = await response.text()
  const wrappedContent = wrapInLayout(content, docsConfig, url.pathname)

  return new Response(wrappedContent, {
    headers: { 'Content-Type': 'text/html' },
  })
})
```

### 3. Configuration-Driven Navigation

The sidebar and navigation are generated from a configuration object:

```typescript
const docsConfig = {
  title: 'My Documentation',
  nav: [
    { text: 'Home', link: '/' },
    { text: 'Guide', link: '/guide/' },
  ],
  sidebar: [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/guide/intro' },
      ],
    },
  ],
}
```

### 4. Automatic File Processing

- `.md` files are processed with frontmatter support and syntax highlighting
- `.stx` files are processed with full directive support
- Files are automatically cached and reloaded on changes (with `watch: true`)

## API Reference

### `serve(options)`

Start a server that processes stx and markdown files.

**Options:**
- `port` - Server port (default: 3000)
- `root` - Root directory to serve from (default: '.')
- `watch` - Enable file watching (default: true)
- `stxOptions` - stx processing options
- `middleware` - Array of middleware functions
- `routes` - Custom route handlers
- `onRequest` - Custom request handler
- `on404` - 404 handler
- `onError` - Error handler

**Returns:**
```typescript
{
  server: Server,      // Bun server instance
  url: string,         // Server URL
  stop: () => void     // Function to stop server
}
```

### `createMiddleware(handler)`

Create a middleware function.

```typescript
const myMiddleware = createMiddleware(async (request, next) => {
  // Do something before
  const response = await next()
  // Do something after
  return response
})
```

### `createRoute(handler)`

Create a route handler.

```typescript
const myRoute = createRoute(async (request) => {
  return new Response('Hello!')
})
```

## Building for BunPress

This example can be adapted for a full BunPress implementation:

1. **Config Loader**: Load `bunPress.config.ts` automatically
2. **Auto-Discovery**: Scan `docs/` for files and generate sidebar
3. **Theme System**: Allow customizable themes
4. **Build Command**: Generate static HTML files
5. **Hot Reload**: WebSocket-based hot reloading

## Features Demonstrated

✅ Programmatic server API
✅ Middleware support
✅ Custom layouts
✅ Configuration-driven navigation
✅ Markdown with frontmatter
✅ Syntax highlighting
✅ File watching and hot reload
✅ Error handling
✅ 404 pages

## Next Steps

To build a complete BunPress system, you would:

1. Load config from `bunPress.config.ts`
2. Scan content directory for files
3. Generate navigation from file structure
4. Add search functionality
5. Add theme customization
6. Add build command for static generation

## Using with bun-plugin-stx

You can also use `bun-plugin-stx` for build-time processing:

```typescript
import stxPlugin from 'bun-plugin-stx'

await Bun.build({
  entrypoints: ['./docs/**/*.stx', './docs/**/*.md'],
  outdir: './dist',
  plugins: [stxPlugin],
})
```

This will process all stx and markdown files and output HTML.

## See Also

- [stx Documentation](../../docs/)
- [API Reference](../../docs/api/)
- [stx Package](../../packages/stx/)
- [Bun Plugin](../../packages/bun-plugin/)
