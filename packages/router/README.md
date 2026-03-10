![Social Card of stx](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]

# stx-router

File-based router for STX — `.stx` template discovery, nested layouts, typed route params, middleware, and client-side SPA navigation.

## Installation

```bash
bun add stx-router
```

## Features

- **File-based routing** — scans `pages/` for `.stx` files and builds a route table automatically
- **Dynamic params** — `[id].stx` becomes `:id`, `[[slug]].stx` becomes optional, `[...path].stx` becomes catch-all
- **Nested layouts** — `_layout.stx` files are resolved up the directory tree
- **Named routes** — Laravel-style `route('users.show', { id: 1 })` URL generation
- **Middleware** — Nuxt-like navigation middleware with `navigateTo` / `abortNavigation`
- **Client SPA navigation** — built-in script with View Transitions API, prefetching, and cache
- **Type generation** — auto-generates `.stx/route-types.d.ts` from discovered routes

## Usage

### File-Based Router

```typescript
import { createRouter } from 'stx-router'

// Scan pages/ directory and build route table
const router = createRouter('./my-app', {
  pagesDir: 'pages',
  extensions: ['.stx'],
  layouts: true,
})

// Match a URL
const match = router.match('/blog/hello-world')
// => { route: { pattern: '/blog/:slug', filePath: 'pages/blog/[slug].stx', ... }, params: { slug: 'hello-world' } }
```

### Route Matching

```typescript
import { filePathToPattern, patternToRegex, matchRoute } from 'stx-router'

// Convert file path to URL pattern
filePathToPattern('pages/blog/[slug].stx', 'pages')
// => '/blog/:slug'

// Convert pattern to regex
const { regex, params } = patternToRegex('/blog/:slug')

// Match against routes
const result = matchRoute('/blog/hello', routes)
```

### Named Routes

```typescript
import { defineRoutes, route } from 'stx-router'

defineRoutes({
  'home': '/',
  'users.show': '/users/:id',
  'posts.index': '/blog',
})

route('users.show', { id: 42 })
// => '/users/42'

route('users.show', { id: 42, tab: 'posts' })
// => '/users/42?tab=posts'
```

### Middleware

```typescript
import { defineMiddleware, navigateTo, abortNavigation } from 'stx-router'

// Auth guard
const authMiddleware = defineMiddleware(
  (context) => {
    const token = context.cookies.get('auth_token')
    if (!token) {
      return navigateTo('/login', { redirectCode: 302 })
    }
  },
  { mode: 'server' },
)

// Role check
const adminMiddleware = defineMiddleware((context) => {
  if (!context.state.isAdmin) {
    return abortNavigation({ statusCode: 403, message: 'Forbidden' })
  }
})
```

### Middleware Registry

```typescript
import {
  registerMiddleware,
  runMiddleware,
  createMiddlewareContext,
  createRouteLocation,
  loadMiddlewareFromDirectory,
} from 'stx-router'

// Register middleware
registerMiddleware('auth', authMiddleware)

// Auto-discover middleware from directory
await loadMiddlewareFromDirectory('./my-app', 'middleware')

// Run middleware pipeline
const to = createRouteLocation('/dashboard', {}, {})
const context = createMiddlewareContext(to, null, request)
const result = await runMiddleware(['auth', 'admin'], context)

if (!result.passed) {
  // Handle redirect or abort
}
```

### Nested Layouts

```typescript
import { resolveLayoutChain } from 'stx-router'

// Given:
// pages/_layout.stx          (root layout)
// pages/admin/_layout.stx    (admin layout)
// pages/admin/users.stx

resolveLayoutChain('pages/admin/users.stx', 'pages')
// => ['pages/_layout.stx', 'pages/admin/_layout.stx']
```

### Client-Side SPA Navigation

```typescript
import { getRouterScript } from 'stx-router'

// Get the client-side SPA router script
const script = getRouterScript()

// Inject into HTML — provides:
// - Click interception for internal links
// - History API navigation with popstate
// - View Transitions API support
// - Page prefetching on hover
// - Response caching
// - Active link class management
// - Loading indicator
```

### Route Type Generation

```typescript
import { generateRouteTypes } from 'stx-router'

// Generate TypeScript declarations from routes
generateRouteTypes(routes, '.stx')
// => writes .stx/route-types.d.ts
```

### Error Pages

```typescript
import { findErrorPage } from 'stx-router'

// Find error page template
findErrorPage('pages', 404)
// => 'pages/404.stx' (or 'pages/error.stx' as fallback)
```

## API

| Export | Category | Description |
| ------ | -------- | ----------- |
| `Router` | File Router | Class that scans pages directory and builds route table |
| `createRouter(baseDir, config?)` | File Router | Factory for `Router` |
| `findErrorPage(pagesDir, statusCode)` | File Router | Find error template (404.stx, error.stx) |
| `formatRoutes(routes, baseDir)` | File Router | Pretty-print route table |
| `filePathToPattern(filePath, pagesDir)` | Pattern Matching | Convert file path to URL pattern |
| `patternToRegex(pattern)` | Pattern Matching | Convert URL pattern to regex with named params |
| `matchRoute(pathname, routes)` | Pattern Matching | Match URL against route table |
| `defineRoute(name, path, params?)` | Named Routes | Register a named route |
| `defineRoutes(definitions)` | Named Routes | Register multiple named routes |
| `route(name, params?, absolute?)` | Named Routes | Generate URL from named route |
| `setAppUrl(url)` | Named Routes | Set base URL for absolute route generation |
| `resetRoutes()` | Named Routes | Clear all registered routes |
| `defineMiddleware(handler, options?)` | Middleware | Create middleware definition |
| `registerMiddleware(name, middleware)` | Middleware | Add to global registry |
| `getMiddleware(name)` | Middleware | Get middleware by name |
| `hasMiddleware(name)` | Middleware | Check if middleware exists |
| `clearMiddleware()` | Middleware | Clear registry |
| `getMiddlewareNames()` | Middleware | List registered names |
| `loadMiddlewareFromDirectory(baseDir, dir?)` | Middleware | Auto-discover middleware files |
| `runMiddleware(names, context)` | Middleware | Execute middleware pipeline |
| `createMiddlewareContext(to, from, request?)` | Middleware | Build middleware context |
| `createRouteLocation(pathname, params, meta, search?)` | Middleware | Build route location |
| `navigateTo(path, options?)` | Middleware | Create redirect result |
| `abortNavigation(error)` | Middleware | Create abort result |
| `createServerCookieManager(request, headers)` | Middleware | Server-side cookie manager |
| `createClientCookieManager()` | Middleware | Client-side cookie manager |
| `createStorageManager()` | Middleware | localStorage wrapper |
| `resolveLayoutChain(routeFilePath, pagesDir)` | Layouts | Collect `_layout.stx` files up directory tree |
| `generateRouteTypes(routes, outputDir)` | Codegen | Write `.stx/route-types.d.ts` |
| `getRouterScript()` | Client | Get client-side SPA navigation script |

## Documentation

- [Full Documentation](https://stx.sh)

## License

MIT

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/stx-router?style=flat-square
[npm-version-href]: https://npmjs.com/package/stx-router
[npm-downloads-src]: https://img.shields.io/npm/dm/stx-router?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/stx-router
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/stx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/stx/actions?query=workflow%3Aci
