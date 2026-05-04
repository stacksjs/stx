# Middleware

stx ships a Laravel-style route middleware pipeline for the dev server and SSR mode. Pages declare which gates they need via `definePageMeta`, and the server runs them before rendering. Two middleware names — `auth` and `guest` — are bundled and need zero registration for the most common app shape.

The same pipeline runs during SPA navigation (initial-render and client-side route changes both go through the same handlers), so a gated page is gated everywhere.

## Defining a Handler

A handler either passes through (returns `void` / `null` / `undefined`) or terminates the pipeline by returning a `Response`.

```ts
import type { MiddlewareHandler } from '@stacksjs/bun-plugin-stx'

const requireAdmin: MiddlewareHandler = (req, ctx) => {
  if (ctx.cookies['role'] !== 'admin')
    return ctx.redirect('/login')
  return null  // pass through
}
```

### `MiddlewareContext`

```ts
interface MiddlewareContext {
  /** Current URL pathname, e.g. `/host/dashboard`. */
  path: string

  /** Parsed URL — useful for query strings, hash, etc. */
  url: URL

  /** Path params extracted from a dynamic segment, e.g. `{ id: 'tesla-…' }`. */
  params: Record<string, string>

  /** Cookies already parsed from the request. */
  cookies: Record<string, string>

  /** Build a 302 to `to`, preserving the original target as `?next=…`. */
  redirect: (to: string, status?: number) => Response
}
```

The redirect helper preserves the original URL via `?next=...`, so login flows can bounce users back where they were:

```ts
// Hit /dashboard while logged out → 302 /login?next=/dashboard
// After login, read ?next and navigate there
```

## Registration

Middleware is registered when starting the dev server or via the bun plugin's `serve()`:

```ts
import { serve } from '@stacksjs/bun-plugin-stx'

serve({
  pagesDir: 'pages',
  middleware: {
    auth: (req, ctx) => ctx.cookies['session'] ? null : ctx.redirect('/login'),
    requireAdmin,
    rateLimit: (req, ctx) => { /* ... */ },
  },

  /** Names that run on every request, before per-page middleware. */
  globalMiddleware: ['rateLimit'],

  /** Aliases — pages declaring `middleware: ['web']` expand to ['session', 'csrf']. */
  middlewareGroups: {
    web: ['session', 'csrf'],
    api: ['rateLimit', 'cors'],
  },
})
```

## Declaring Per-Page Middleware

Add `definePageMeta` to the page's `<script server>` block:

```html
<!-- pages/dashboard.stx -->
<script server>
  definePageMeta({
    middleware: ['auth', 'verified'],
  })
</script>

<h1>Dashboard</h1>
```

The plugin scans page files at startup and stamps the metadata into its route table — the regex parse runs once, so the request hot path is just an O(1) lookup + chain run.

### Order of Execution

1. **Global middleware** (`globalMiddleware` array, in order).
2. **Page middleware** (`definePageMeta({ middleware })`, in order; group names expand recursively).

Each handler can short-circuit the chain by returning a `Response`. If every handler passes through, the page renders.

## Parameterized Middleware

Append colon-separated args to the name: `'auth:admin,owner'` invokes the `auth` handler with `args = ['admin', 'owner']`. Same shape as Laravel's `handle($request, $next, ...$args)`.

```ts
serve({
  middleware: {
    role: (req, ctx, ...allowedRoles) => {
      const userRole = ctx.cookies['role']
      if (!allowedRoles.includes(userRole))
        return ctx.redirect('/forbidden')
      return null
    },
  },
})
```

```html
<script server>
  definePageMeta({
    middleware: ['role:admin,owner'],
  })
</script>
```

## Dynamic Routes

Path params from dynamic segments (e.g. `pages/book/[id].stx`) are exposed via `ctx.params`:

```ts
const ownerOnly: MiddlewareHandler = (req, ctx) => {
  // ctx.params.id is the matched [id] segment
  if (!isOwnerOf(ctx.cookies['user'], ctx.params.id))
    return ctx.redirect('/')
  return null
}
```

## Bundled `auth` and `guest` Handlers

These two names are wired by default — you don't need to register them. They cover the most common shape: gate authed pages → `/login`, redirect logged-in users away from `/login` → `/`.

```html
<!-- pages/dashboard.stx — only logged-in users -->
<script server>
  definePageMeta({ middleware: ['auth'] })
</script>

<!-- pages/login.stx — only logged-out users -->
<script server>
  definePageMeta({ middleware: ['guest'] })
</script>
```

### Configuring `auth` / `guest`

```ts
serve({
  auth: {
    cookieName: 'auth-token',     // default — cookie that signals "logged in"
    redirectTo: '/login',         // default — where unauthed users get sent
    home: '/',                    // default — where authed users hitting /login get sent
    protectedPaths: ['/admin'],   // extra prefixes to gate without definePageMeta
  },
})
```

`protectedPaths` is useful for proxied paths or static files served by `routes` that don't have their own `<script server>` block.

Pass `auth: false` to opt out of the bundled middleware entirely (your own `auth` / `guest` registration in `middleware` then takes over without conflict).

## SSG Build Middleware

The same handlers run during static-site generation (SSG) builds — see [Route Guard Middleware (SSG)](../features/site-builder.md) — so a page declaring `middleware: ['auth']` becomes a generated redirect page (`<meta http-equiv="refresh">`) at build time. Returning a redirect response from a handler in SSG mode synthesizes the redirect page; `abort` (returning `null` from a special signal) skips the page entirely.

## Examples

### Auth Gate

```ts
serve({
  middleware: {
    auth: (req, ctx) => {
      const session = ctx.cookies['session']
      if (!session) return ctx.redirect('/login')
      return null
    },
  },
})
```

```html
<script server>
  definePageMeta({ middleware: ['auth'] })
</script>
```

### Role Check

```ts
serve({
  middleware: {
    role: (req, ctx, ...roles) => {
      const userRole = ctx.cookies['role']
      if (!roles.includes(userRole)) return new Response('Forbidden', { status: 403 })
      return null
    },
  },
})
```

```html
<script server>
  definePageMeta({ middleware: ['role:admin,editor'] })
</script>
```

### Maintenance Mode

```ts
serve({
  globalMiddleware: ['maintenance'],
  middleware: {
    maintenance: (req, ctx) => {
      if (process.env.MAINTENANCE === '1' && ctx.path !== '/maintenance')
        return ctx.redirect('/maintenance')
      return null
    },
  },
})
```

### Rate Limit

```ts
const counts = new Map<string, { n: number; resetAt: number }>()

serve({
  globalMiddleware: ['rateLimit'],
  middleware: {
    rateLimit: (req, ctx) => {
      const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
      const now = Date.now()
      const bucket = counts.get(ip) ?? { n: 0, resetAt: now + 60_000 }
      if (now > bucket.resetAt) { bucket.n = 0; bucket.resetAt = now + 60_000 }
      bucket.n++
      counts.set(ip, bucket)
      if (bucket.n > 100) return new Response('Too Many Requests', { status: 429 })
      return null
    },
  },
})
```
