# Server-Side Rendering

STX provides built-in support for server-side rendering (SSR) with streaming capabilities.

## Overview

Server-side rendering in STX:

- Executes `<script server>` blocks on the server
- Renders templates to HTML before sending to the client
- Supports async data fetching
- Enables streaming for better performance

## Basic SSR Setup

### Server Script

Use `<script server>` for server-only code:

```html
<script server>
// Runs only on the server
const users = await db.query('SELECT * FROM users')
const config = process.env.DATABASE_URL  // Safe to use
</script>

<template>
  <ul>
    @foreach (users as user)
      <li>{{ user.name }}</li>
    @endforeach
  </ul>
</template>
```

### Client Script

Use `<script client>` for browser-only code:

```html
<script client>
// Runs only in the browser
document.addEventListener('click', (e) => {
  console.log('Clicked:', e.target)
})
</script>
```

### Shared Script

Use `<script>` for code that runs in both environments:

```html
<script>
// Runs on server AND client
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
</script>
```

## Data Fetching

### Async Data Loading

```html
<script server>
// Async operations are fully supported
const [products, categories] = await Promise.all([
  fetch('https://api.example.com/products').then(r => r.json()),
  fetch('https://api.example.com/categories').then(r => r.json()),
])
</script>

<template>
  <nav>
    @foreach (categories as category)
      <a href="/category/{{ category.slug }}">{{ category.name }}</a>
    @endforeach
  </nav>

  <main>
    @foreach (products as product)
      <ProductCard :product="product" />
    @endforeach
  </main>
</template>
```

### Database Queries

```html
<script server>
import { db } from '../lib/database'

// Direct database access (safe on server)
const posts = await db.posts.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
})
</script>

<template>
  @foreach (posts as post)
    <article>
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt }}</p>
    </article>
  @endforeach
</template>
```

## Streaming SSR

### Enabling Streaming

STX supports streaming for progressive rendering:

```typescript
// server.ts
import { renderStream } from '@stacksjs/stx'

Bun.serve({
  async fetch(request) {
    const stream = await renderStream('./pages/index.stx', {
      data: { title: 'Home' }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/html' },
    })
  },
})
```

### Suspense-like Loading

```html
<script server>
// This data loads immediately
const header = await fetchHeaderData()
</script>

<template>
  <Header :data="header" />

  <!-- Content loads progressively -->
  <Suspense>
    <template #default>
      <MainContent />
    </template>
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

## Hydration

### Client-Side Hydration

STX hydrates server-rendered HTML on the client:

```html
<script server>
const initialCount = await fetchCount()
</script>

<script client>
// Hydrates with server-rendered state
const counter = document.getElementById('counter')
let count = parseInt(counter.dataset.count)

document.getElementById('increment').addEventListener('click', () => {
  count++
  counter.textContent = count
})
</script>

<template>
  <div>
    <span id="counter" data-count="{{ initialCount }}">{{ initialCount }}</span>
    <button id="increment">+</button>
  </div>
</template>
```

### X-Element Hydration

For reactive components, use x-element directives:

```html
<script server>
const initialItems = await fetchItems()
</script>

<template>
  <div x-data="{ items: {{ JSON.stringify(initialItems) }}, newItem: '' }">
    <ul>
      <template x-for="item in items">
        <li x-text="item.name"></li>
      </template>
    </ul>

    <input x-model="newItem" placeholder="Add item..." />
    <button @click="items.push({ name: newItem }); newItem = ''">Add</button>
  </div>
</template>
```

## SEO Optimization

### Meta Tags

```html
<script server>
const page = await fetchPage(props.slug)
</script>

<template>
  @seo({
    title: page.title,
    description: page.excerpt,
    image: page.ogImage,
    url: `https://example.com/${page.slug}`
  })

  <article>
    <h1>{{ page.title }}</h1>
    {!! page.content !!}
  </article>
</template>
```

### Structured Data

```html
<script server>
const product = await fetchProduct(props.id)

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  price: product.price,
}
</script>

<template>
  <script type="application/ld+json">
    {!! JSON.stringify(jsonLd) !!}
  </script>

  <ProductDisplay :product="product" />
</template>
```

## Error Handling

### Try-Catch in Server Scripts

```html
<script server>
let data = null
let error = null

try {
  data = await fetchData()
} catch (e) {
  error = e.message
  console.error('Failed to fetch data:', e)
}
</script>

<template>
  @if (error)
    <ErrorMessage message="{{ error }}" />
  @else
    <DataDisplay :data="data" />
  @endif
</template>
```

### Error Boundaries

```html
<!-- components/ErrorBoundary.stx -->
<script server>
let hasError = false
let errorMessage = ''

try {
  // Child rendering happens here
} catch (e) {
  hasError = true
  errorMessage = e.message
}
</script>

<template>
  @if (hasError)
    <div class="error-boundary">
      <h2>Something went wrong</h2>
      <p>{{ errorMessage }}</p>
      <button onclick="location.reload()">Retry</button>
    </div>
  @else
    <slot />
  @endif
</template>
```

## Caching

### Response Caching

```typescript
// server.ts
import { render } from '@stacksjs/stx'

const cache = new Map()

Bun.serve({
  async fetch(request) {
    const url = new URL(request.url)
    const cacheKey = url.pathname

    // Check cache
    if (cache.has(cacheKey)) {
      return new Response(cache.get(cacheKey), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Render and cache
    const html = await render(`./pages${url.pathname}.stx`)
    cache.set(cacheKey, html)

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  },
})
```

### Template Caching

Enable in configuration:

```typescript
// stx.config.ts
export default {
  cache: true,
  cachePath: '.stx/cache',
  cacheTTL: 3600000, // 1 hour
}
```

## Production Deployment

### Build for Production

```bash
# Build optimized templates
bun run build

# Start production server
NODE_ENV=production bun run start
```

### Environment Configuration

```typescript
// stx.config.ts
export default {
  // Disable debug in production
  debug: process.env.NODE_ENV !== 'production',

  // Enable caching in production
  cache: process.env.NODE_ENV === 'production',

  // Minify output
  minify: process.env.NODE_ENV === 'production',
}
```

## Performance Tips

1. **Use streaming** for large pages
2. **Cache aggressively** - templates and data
3. **Minimize server scripts** - move logic to shared modules
4. **Lazy load** non-critical components
5. **Preload data** for common routes

## Related

- [Getting Started](/guide/getting-started)
- [Components](/guide/components)
- [Desktop Integration](/guide/desktop)
