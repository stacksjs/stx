# Performance

stx is built for speed and provides comprehensive performance optimization features. This page covers all performance capabilities and optimization strategies available in the stx ecosystem.

## Markdown Parser Performance

The `@stacksjs/ts-markdown` package implements a high-performance markdown parser built specifically for Bun. The parser uses a flat token stream architecture inspired by markdown-it, combined with aggressive optimization techniques.

### Benchmark Results

Performance comparison against popular markdown parsers:

| Document Size | @stacksjs/ts-markdown | markdown-it | Speedup |
|--------------|-------------------|-------------|---------|
| Small (< 1KB) | 324B ops/sec | 112B ops/sec | 2.89x |
| Medium (~3KB) | 34.7B ops/sec | 17.7B ops/sec | 1.96x |
| Large (~50KB) | 1.81B ops/sec | 1.25B ops/sec | 1.45x |

### Architecture

The parser achieves this performance through several key design decisions:

- **Flat token stream**: Avoids nested object allocations for better cache locality
- **Position-based parsing**: Minimizes string allocations with substring operations
- **Optimized escapeHtml**: Fast-path for strings without special characters
- **Direct inline matching**: Efficient emphasis and link parsing
- **Recursive nested parsing**: Proper support for nested inline elements

### Usage

```typescript
import { parseMarkdown } from '@stacksjs/ts-markdown'

const html = parseMarkdown('# Hello **world**')
// <h1 id="hello-world">Hello <strong>world</strong></h1>
```

The parser supports GitHub Flavored Markdown (GFM) including tables, task lists, and strikethrough text.

## Page render admission

`bun-plugin-stx/serve` limits each server to four active page renders and 32 waiting requests by default. This bounds overlapping template contexts while server scripts await data. API responses returned by `onRequest` and static assets remain outside the render gate.

```typescript
import { serve } from 'bun-plugin-stx/serve'

await serve({
  patterns: ['resources/views'],
  renderConcurrency: 4,
  renderQueueLimit: 32,
  renderQueueTimeoutMs: 15_000,
})
```

A full queue or expired wait returns `503` with `Retry-After: 1` and `Cache-Control: no-store`. A disconnected queued request is removed before its script starts. A disconnected active request keeps its slot until its script finishes; otherwise repeated disconnects could create unlimited background work. All three options accept finite integers; concurrency and wait must be positive, and a zero queue limit refuses new renders immediately when busy. Each server owns its own capacity and executes queued scripts with their original request context.

Prefetch and prerender requests render as background work: at most half the slots, a smaller share of the queue, and every waiting navigation served first. An application can put its own traffic in that class too, for requests it can name but should not refuse, such as signed-out visits to pages its `robots.txt` tells crawlers not to walk:

```typescript
await serve({
  patterns: ['resources/views'],
  renderPriority: request => isCrawlablePath(request) && !isSignedIn(request) ? 'background' : undefined,
  renderBackgroundConcurrency: 1,
  renderBackgroundQueueLimit: 8,
  renderBackgroundRetryAfterSeconds: 30,
})
```

`renderPriority` can only lower a request, never move one ahead of navigation, and a resolver that throws or rejects leaves the request where it was. It may return a promise, which is what checking a session against a store takes. The background limits are clamped to the renderer's own, and a refused background request is told to wait `renderBackgroundRetryAfterSeconds` (default 1) rather than coming straight back. Page scripts share one thread, so a background slot bounds how much of the renderer that traffic can hold; it does not make a CPU-heavy page free.

To see what the renderer is doing, ask it to say so in the log:

```typescript
await serve({
  patterns: ['resources/views'],
  renderReport: { slowMs: 2000, intervalMs: 60_000 },
})
```

Each render that runs longer than `slowMs` is named as it finishes: `[stx] slow render 2412ms /o/r/blob/main/x.ts (background, waited 830ms)`. Once every `intervalMs` that had traffic, one line totals each class: renders, failures, refusals on arrival, waits that ran out, run time at p50 and p95, the longest wait and the slowest path. A quiet interval prints nothing, paths never include the query string, and with `renderReport` unset nothing is recorded.

## Runtime Performance

### Fast Template Compilation

stx compiles templates to highly optimized JavaScript:

```typescript
// Compile-time optimization
const template = compile(`
  @foreach(items as item)
    <div class="item">{{ item.name }}</div>
  @endforeach
`)

// Generates optimized code
function render(context) {
  let html = ''
  for (const item of context.items) {
    html += `<div class="item">${escape(item.name)}</div>`
  }
  return html
}
```

### Efficient Rendering

```typescript
// Streaming rendering for large datasets
import { renderStream } from '@stacksjs/core'

const stream = renderStream(template, {
  items: largeDataset,
  chunkSize: 100
})

// Progressive rendering
stream.on('chunk', (html) => {
  response.write(html)
})
```

### Memory Management

```typescript
// Automatic memory pooling
const pool = createTemplatePool({
  maxSize: 1000,
  ttl: 300000 // 5 minutes
})

// Efficient component recycling
const component = pool.get('Button')
component.render(props)
pool.release(component)
```

## Build-time Optimization

### Code Splitting

```typescript
// Automatic route-based splitting
const routes = [
  {
    path: '/dashboard',
    component: () => import('./Dashboard.stx')
  },
  {
    path: '/profile',
    component: () => import('./Profile.stx')
  }
]

// Component-level splitting
const HeavyComponent = lazy(() => import('./HeavyComponent.stx'))
```

### Tree Shaking

```typescript
// Dead code elimination
import { render } from '@stacksjs/core' // Only imports what's used
import { component } from '@stacksjs/components' // Tree-shaken automatically

// Bundle analysis
bun run build:analyze
```

### Asset Optimization

```typescript
// Image optimization
const optimizedImage = `
  <img
    src="{{ image.src }}"
    srcset="{{ image.srcset }}"
    sizes="(max-width: 768px) 100vw, 50vw"
    loading="lazy"
    decoding="async"
  />
`

// CSS optimization
const styles = css`
  .button {
    /* Critical CSS inlined */
    display: inline-block;
    padding: 8px 16px;
  }
`
```

## Caching Strategies

### Template Caching

```typescript
// In-memory template caching
const cache = createCache({
  strategy: 'lru',
  maxSize: 10000,
  ttl: 3600000 // 1 hour
})

// Redis-based distributed caching
const distributedCache = createRedisCache({
  host: 'redis.example.com',
  keyPrefix: 'stx:templates:'
})
```

### Component Caching

```typescript
// Memoized components
const MemoizedCard = memo(Card, {
  shouldUpdate: (prevProps, nextProps) => {
    return prevProps.data.id !== nextProps.data.id
  }
})

// Cache by props
@cache({
  key: (props) => `user-${props.userId}`,
  ttl: 300 // 5 minutes
})
function UserProfile({ userId }) {
  // Expensive computation
  const user = await fetchUserData(userId)
  return render(userTemplate, { user })
}
```

### HTTP Caching

```typescript
// Cache headers optimization
app.use(cacheHeaders({
  '/static': { maxAge: 31536000 }, // 1 year
  '/api': { maxAge: 300 }, // 5 minutes
  '/': { maxAge: 0, mustRevalidate: true }
}))

// CDN optimization
const cdnConfig = {
  enabled: true,
  provider: 'cloudflare',
  purgeOnDeploy: true,
  headers: {
    'Cache-Control': 'public, max-age=31536000',
    'CDN-Cache-Control': 'public, max-age=86400'
  }
}
```

## Database Performance

### Query Optimization

```typescript
// Efficient data loading
const users = await db.users
  .select(['id', 'name', 'email']) // Only select needed fields
  .where('active', true)
  .limit(100)
  .offset(page * 100)

// N+1 query prevention
const usersWithPosts = await db.users
  .with('posts') // Eager loading
  .where('active', true)
```

### Connection Pooling

```typescript
// Database connection pool
const pool = createPool({
  host: 'localhost',
  database: 'stx_app',
  user: 'stx_user',
  password: process.env.DB_PASSWORD,
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000
})
```

## Frontend Performance

### Client-side Optimization

```typescript
// Preload critical resources
preload('/api/user', { as: 'fetch' })
preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2' })

// Intersection Observer for lazy loading
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadComponent(entry.target)
      observer.unobserve(entry.target)
    }
  })
})
```

### Bundle Optimization

```typescript
// Webpack bundle optimization
export default {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all'
        }
      }
    }
  }
}
```

## Performance Monitoring

### Core Web Vitals

```typescript
// Track performance metrics
import { performanceMonitor } from '@stacksjs/monitoring'

performanceMonitor.track({
  // Largest Contentful Paint
  onLCP: (metric) => {
    analytics.track('LCP', { value: metric.value })
  },

  // First Input Delay
  onFID: (metric) => {
    analytics.track('FID', { value: metric.value })
  },

  // Cumulative Layout Shift
  onCLS: (metric) => {
    analytics.track('CLS', { value: metric.value })
  }
})
```

### Custom Performance Metrics

```typescript
// Custom timing measurements
const renderTimer = performance.mark('render-start')
await renderComponent()
performance.mark('render-end')
performance.measure('component-render', 'render-start', 'render-end')

// Memory usage tracking
const memoryUsage = performance.memory
analytics.track('memory-usage', {
  used: memoryUsage.usedJSHeapSize,
  total: memoryUsage.totalJSHeapSize
})
```

## Performance Testing

### Load Testing

```typescript
// Artillery load testing
export default {
  config: {
    target: 'http://localhost:3000',
    phases: [
      { duration: 60, arrivalRate: 10 },
      { duration: 120, arrivalRate: 50 },
      { duration: 60, arrivalRate: 100 }
    ]
  },
  scenarios: [
    {
      name: 'Homepage load test',
      requests: [
        { get: { url: '/' } },
        { get: { url: '/api/users' } }
      ]
    }
  ]
}
```

### Benchmarking

```typescript
// Performance benchmarks
import { benchmark } from '@stacksjs/testing'

benchmark('template rendering', async () => {
  const html = render(complexTemplate, largeDataset)
  return html
}, {
  iterations: 1000,
  warmup: 100
})

benchmark('component mounting', async () => {
  const component = new Component(props)
  await component.mount()
  component.unmount()
}, {
  iterations: 500
})
```

## Advanced Optimization

### Service Workers

For a server-rendered STX app, configure the app offline worker rather than
adding a second worker that caches API answers without accounting for the
signed-in user:

```typescript
import type { StxOptions } from '@stacksjs/stx'

export default {
  offline: {
    enabled: true,
    registerOn: ['/m', '/login'], // Optional app entry prefixes; defaults to every page
    pages: ['/m', '/m/calendar'],
    apiPrefix: '/api/',
    networkTimeoutMs: 1500,
    precacheTimeoutMs: 10000,
    precacheQuietMs: 1500,
    fallback: '/m',
  },
} satisfies StxOptions
```

The server integration must serve `generateOfflineWorker(config.offline,
buildId, literalPagePaths)` at `OFFLINE_WORKER_PATH` (`/_stx/sw.js`) with scope `/`; rendered
pages register it automatically when `offline.enabled` is true. Use the same
offline configuration and build identifier when rendering pages and serving
the worker.

The built-in file servers supply their literal page paths automatically.
Custom hosts pass all literal routes in the optional third argument, including
pages outside the precache. This gives `/workouts/library` precedence over
`/workouts/:id`, without downloading the library during installation. A slow
or offline library visit cannot show a workout shell or replace the reusable
workout shell in the cache.

Use `registerOn` when marketing pages share the app's host. Registration and
background installation wait until a matching app entry, including SPA
navigation. Prefixes match whole path segments, so `/m` includes `/m/calendar`
and excludes `/marketing`. Existing offline caches and account isolation keep
their normal behavior.

Installation fetches each listed page and its router fragment, then the linked
stylesheets and scripts. Each page is a render on the server, so they are
fetched one at a time, in the order listed, and each only after the page's own
requests have been quiet for `precacheQuietMs` (default 1500, `0` to start each
at once; it never waits more than 30 seconds). After an answer that took over
two seconds the worker pauses as long as it took, and on 503, 408 or 429 it
waits (as `Retry-After` says, or 1, 2 then 4 seconds) and tries three more
times before moving on. A page already kept for this build is not fetched
again, so an installation the browser cut short resumes where it stopped.
Linked stylesheets and scripts download at most two at once, leaving
connection capacity for navigation. Each background request has a
`precacheTimeoutMs` budget covering its response body as well as its headers;
a stalled download is aborted and does not prevent the remaining files from
being attempted. Failed files can still be requested normally by the page.
This budget does not cancel foreground navigation or API reads.

`networkTimeoutMs` controls when a foreground read falls back to an available
cached copy. Pages are kept per build, and API answers per bearer token.
Requests and API responses marked `no-store` are not retained. Only declare
`staticPages` for account-independent HTML shells. On sign-out, call the
offline composable's `clearOfflineData()` to remove retained account data.

### Edge Computing

```typescript
// Edge function optimization
export default {
  runtime: 'edge',
  regions: ['iad1', 'sfo1'],
  cache: {
    maxAge: 3600,
    staleWhileRevalidate: 86400
  }
}

// Geographic content delivery
const userLocation = request.geo.country
const localizedContent = await getLocalizedContent(userLocation)
```

## Best Practices

### Code Optimization

```typescript
// Efficient loops
// Slow
for (let i = 0; i < items.length; i++) {
  processItem(items[i])
}

// Fast
const length = items.length
for (let i = 0; i < length; i++) {
  processItem(items[i])
}

// Even faster for simple operations
items.forEach(processItem)
```

### Memory Optimization

```typescript
// Object pooling
const objectPool = {
  objects: [],
  get() {
    return this.objects.pop() || {}
  },
  release(obj) {
    // Clear object properties
    Object.keys(obj).forEach(key => delete obj[key])
    this.objects.push(obj)
  }
}
```

## Deferred hydration scripts

A static page can paint its server-rendered content while its scripts download.
Use the native `deferScripts` pass after shared asset and island extraction:

```ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { deferScripts } from '@stacksjs/stx/build-defer-scripts'

const result = deferScripts(html)
mkdirSync('dist/_stx', { recursive: true })
for (const asset of result.assets)
  writeFileSync(`dist/_stx/${asset.filename}`, asset.contents)
writeFileSync('dist/index.html', result.html)
```

The runtime and its dependent classic setup scripts are deferred together and
execute in document order. Inert islands, template content, modules, asynchronous
scripts and native appearance bootstraps retain their semantics. Scripts that
must run during parsing opt out with `stx-inline`. The pass is idempotent and
returns content-addressed assets without writing files itself.

For dynamic serving, set `deferScripts: true` in `stx.config.ts` (or Stacks'
`config/ui.ts`). The renderer registers ordered setup and island chunks in its
native immutable asset store, preserving pre-paint preferences. The server can
then deliver the same optimization without a static build or a custom gateway
response transform. Generated `public/_stx` images are excluded from source
image encoding so prepared variants are not encoded a second time.

Use `inlineGeneratedCssBytes` in the same config to keep small generated
utility stylesheets in the HTML during serving. The limit measures UTF-8
bytes before compression. Larger stylesheets keep their cacheable asset URL.

For dynamic serving, `externalizePageSetup: true` puts large synchronous page
setup code at the existing immutable `/_stx/modules.*.js` endpoint. Each page
keeps its own server-to-client data in the HTML, so pages can reuse the same
asset while initializing with different values. Supply authored templates
and pass request data through the server-to-client bridge. Scripts whose
bodies changed during template processing stay inline. Static builds and
CSP-enabled renders keep their existing script handling. Served documents
using a shared setup keep script execution ordered, including when
`deferScripts` is enabled.

Mark a render-critical stylesheet `<style stx-inline>` to keep it in HTML through
both shared and repeated asset extraction. This avoids a first-paint stylesheet
request without changing the treatment of other stylesheets.

## Loading the runtime on the first island

An island (`client="interaction"`, `"visible"`, `"idle"` or `"media:…"` on a
component tag) defers its own setup, but the page still loads the signals
runtime from its head, because the runtime is what hydrates islands. On a page
whose only reactive content is islands, set `lazyIslandRuntime: true` in
`stx.config.ts` and the served document loads no runtime until one of them is
triggered:

```ts
export default {
  lazyIslandRuntime: true,
}
```

```html
<!-- Server HTML, native popovers and links: no runtime needed. -->
<nav>
  <button popovertarget="menu">Menu</button>
  <div id="menu" popover>…</div>
  <!-- The one reactive control wakes the runtime when it is reached for. -->
  <ThemeSwitch client="interaction" />
</nav>
```

The runtime and the page's bundles are served as inert `type="stx/lazy"` tags
with a small loader. The loader arms each island's own trigger; the first to
fire loads the scripts in their written order, starts the runtime and hands the
island over to it. Each island's setup is a cached file fetched at the same
moment. A click that reaches an island before it has hydrated is held and
pressed again afterwards, so the first tap is not lost and a submit button does
not post its form unhandled.

A document qualifies only when everything that needs the runtime is inside an
island: no eager component script, no page script that uses the runtime, and
no reactive attribute (`:if`, `@click`, `x-cloak`, …) outside an island. Any
other document is served exactly as before. `lazyIslandRuntime(html).reason`
names the first thing that kept a document eager.

Write an island so that its server HTML is right before it hydrates:

- Give reactive text and attributes a static value beside the binding
  (`<span :text="label">{{ serverLabel }}</span>`,
  `aria-label="{{ name }}" :aria-label="liveName"`). `:if` and `:show` content
  stays hidden until the island hydrates.
- A field typed into before hydration keeps its text: the model adopts it.
- A component nested in an island hydrates with the island.
- Navigation from such a page to one that needs the runtime is a full page
  load until an island has loaded it; links in a native popover can opt out of
  the router with `data-stx-no-router` so the page load closes the menu.

## Related Resources

- [Performance Guide](/guide/performance) - Comprehensive performance guide
- [Build Guide](/guide/build) - Build optimization strategies
- [Monitoring Guide](/guide/monitoring) - Performance monitoring setup
- [Deployment Guide](/guide/deployment) - Production performance optimization
