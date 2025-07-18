# Performance

STX is built for speed and provides comprehensive performance optimization features. This page covers all performance capabilities and optimization strategies available in the STX ecosystem.

## Runtime Performance

### Fast Template Compilation

STX compiles templates to highly optimized JavaScript:

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
import { renderStream } from '@stx/core'

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
import { render } from '@stx/core' // Only imports what's used
import { component } from '@stx/components' // Tree-shaken automatically

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
import { performanceMonitor } from '@stx/monitoring'

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
import { benchmark } from '@stx/testing'

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

```typescript
// Service worker for caching
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open('api-cache').then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            // Serve from cache
            fetch(event.request).then(fetchResponse => {
              cache.put(event.request, fetchResponse.clone())
            })
            return response
          }
          
          // Fetch and cache
          return fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone())
            return fetchResponse
          })
        })
      })
    )
  }
})
```

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
// ❌ Slow
for (let i = 0; i < items.length; i++) {
  processItem(items[i])
}

// ✅ Fast
const length = items.length
for (let i = 0; i < length; i++) {
  processItem(items[i])
}

// ✅ Even faster for simple operations
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

## Related Resources

- [Performance Guide](/guide/performance) - Comprehensive performance guide
- [Build Guide](/guide/build) - Build optimization strategies
- [Monitoring Guide](/guide/monitoring) - Performance monitoring setup
- [Deployment Guide](/guide/deployment) - Production performance optimization 