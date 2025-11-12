# Performance Optimization

stx is built with performance in mind, leveraging Bun's native speed and optimized template processing. This guide covers performance characteristics, benchmark results, and optimization strategies.

## Performance Benchmarks

stx has been extensively benchmarked against popular competitors. See our [comprehensive benchmark results](/guide/benchmarks) for detailed comparisons.

### Key Performance Highlights

**Template Engine Performance:**
- Optimized for Bun runtime with native performance
- Laravel Blade syntax with comprehensive directive system
- Template caching enabled by default in production
- Streaming SSR for large pages

**Framework Performance:**
- **44.1% faster than VanillaJS** in js-framework-benchmark
- 0.57ms geometric mean (VanillaJS: 1.02ms)
- Faster than VanillaJS in 8 of 9 operations
- Industry-leading optimizations

**Markdown Parsing:**
- **2.89x faster than markdown-it** on small documents
- **1.96x faster** on medium documents
- **1.45x faster** on large documents
- Position-based parsing with flat token stream

**HTML Sanitization:**
- **77.93x faster than DOMPurify**
- **1.70-1.99x faster** than other competitors
- Fastest in all benchmark categories

**YAML Parsing:**
- **1.5-2.7x faster than js-yaml**
- Native Bun YAML implementation

---

## Build Optimization

### Tree Shaking

stx automatically performs tree shaking to eliminate unused code:

```ts
// config/build.ts
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  build: {
    // Enable aggressive tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false
    },

    // Minify output
    minify: true,

    // Generate sourcemaps
    sourcemap: false,

    // Optimize dependencies
    optimizeDeps: {
      include: [
        // List dependencies to pre-bundle
      ]
    }
  }
})
```

### Code Splitting

Automatically split your code into chunks:

```ts
// router.ts
export const routes = [
  {
    path: '/',
    component: () => import('./pages/Home.stx')
  },
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.stx'),
    children: [
      {
        path: 'analytics',
        component: () => import('./pages/dashboard/Analytics.stx')
      }
    ]
  }
]
```

### Asset Optimization

Optimize assets during build:

```ts
// config/build.ts
export default defineConfig({
  build: {
    // Optimize assets
    assetsInlineLimit: 4096, // Inline small files
    cssCodeSplit: true,      // Split CSS
    rollupOptions: {
      output: {
        manualChunks: {
          // Custom chunk splitting
          vendor: ['lodash', 'axios'],
          ui: ['./components/ui/']
        }
      }
    }
  }
})
```

## Runtime Performance

### Component Optimization

Use `memo` for expensive computations:

```stx
@component('DataGrid')
  @ts
  interface Props {
    data: any[]
    sortBy: string
    filterBy: string
  }

  // Memoize expensive computation
  const sortedAndFilteredData = memo(
    () => data
      .filter(item => item[filterBy])
      .sort((a, b) => a[sortBy].localeCompare(b[sortBy])),
    [data, sortBy, filterBy]
  )
  @endts

  <table>
    <tbody>
      @foreach(sortedAndFilteredData as item)
        <tr>
          <!-- Row content -->
        </tr>
      @endforeach
    </tbody>
  </table>
@endcomponent
```

### Lazy Loading

Lazy load components and routes:

```stx
@component('Dashboard')
  @ts
  // Lazy load heavy components
  const HeavyChart = lazy(() => import('./components/HeavyChart.stx'))
  const DataGrid = lazy(() => import('./components/DataGrid.stx'))

  let showChart = false
  @endts

  <div class="dashboard">
    <button @click="showChart = !showChart">
      Toggle Chart
    </button>

    @if(showChart)
      <Suspense>
        @loading
          <loading-spinner />
        @success
          <HeavyChart />
        @error
          <error-message />
        @endsuspense
    @endif

    <Suspense>
      <DataGrid :data="gridData" />
    </Suspense>
  </div>
@endcomponent
```

### Virtual Scrolling

Handle large lists efficiently:

```stx
@component('VirtualList')
  @ts
  interface Props {
    items: any[]
    itemHeight: number
    visibleItems: number
  }

  const containerRef = ref<HTMLElement>()
  let startIndex = 0
  let scrollTop = 0

  // Calculate visible items
  const visibleData = computed(() => {
    const start = Math.floor(scrollTop / itemHeight)
    return items.slice(start, start + visibleItems)
  })

  function handleScroll(e: Event) {
    scrollTop = (e.target as HTMLElement).scrollTop
  }
  @endts

  <div
    class="virtual-list"
    ref="containerRef"
    @scroll="handleScroll"
    :style="{
      height: `${visibleItems * itemHeight}px`,
      overflow: 'auto'
    }"
  >
    <div :style="{
      height: `${items.length * itemHeight}px`,
      position: 'relative'
    }">
      @foreach(visibleData as item, index)
        <div :style="{
          position: 'absolute',
          top: `${(startIndex + index) * itemHeight}px`,
          height: `${itemHeight}px`
        }">
          <slot :item="item" />
        </div>
      @endforeach
    </div>
  </div>
@endcomponent

<!-- Usage -->
<VirtualList
  :items="largeDataset"
  :itemHeight="50"
  :visibleItems="10"
>
  <template :item="item">
    <div class="list-item">
      {{ item.name }}
    </div>
  </template>
</VirtualList>
```

### State Management

Optimize state updates:

```stx
@component('TodoList')
  @ts
  interface Todo {
    id: number
    text: string
    completed: boolean
  }

  // Use shallowRef for large objects
  const todos = shallowRef<Todo[]>([])

  // Batch updates
  function updateMultipleTodos(updates: Partial<Todo>[]) {
    batch(() => {
      updates.forEach(update => {
        const todo = todos.value.find(t => t.id === update.id)
        if (todo) {
          Object.assign(todo, update)
        }
      })
    })
  }
  @endts

  <div class="todo-list">
    @foreach(todos as todo)
      <todo-item
        :key="todo.id"
        :todo="todo"
      />
    @endforeach
  </div>
@endcomponent
```

## Caching Strategies

### Component Caching

Cache expensive component renders:

```stx
@component('CachedComponent')
  @ts
  interface Props {
    id: string
    data: any
  }

  // Cache key generator
  const cacheKey = computed(() =>
    `${id}-${JSON.stringify(data)}`
  )
  @endts

  @cache(cacheKey)
    <div class="expensive-component">
      <!-- Expensive rendering -->
    </div>
  @endcache
@endcomponent
```

### API Response Caching

Cache API responses:

```ts
// utils/cache.ts
interface CacheOptions {
  ttl: number
  maxSize: number
}

class APICache {
  private cache = new Map()
  private options: CacheOptions

  constructor(options: CacheOptions) {
    this.options = options
  }

  async get(key: string, fetcher: () => Promise<any>) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.options.ttl) {
      return cached.data
    }

    const data = await fetcher()
    this.set(key, data)
    return data
  }

  private set(key: string, data: any) {
    if (this.cache.size >= this.options.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
}

// Usage
const apiCache = new APICache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
})

async function fetchData(id: string) {
  return apiCache.get(
    `data-${id}`,
    () => api.fetch(id)
  )
}
```

## Monitoring and Profiling

### Performance Monitoring

Add performance monitoring:

```ts
// utils/performance.ts
interface PerformanceMetric {
  component: string
  event: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []

  measure(component: string, event: string, callback: () => void) {
    const start = performance.now()
    callback()
    const duration = performance.now() - start

    this.metrics.push({
      component,
      event,
      duration,
      timestamp: Date.now()
    })

    // Log if duration exceeds threshold
    if (duration > 16) { // 60fps threshold
      console.warn(
        `Performance warning: ${component} ${event} took ${duration}ms`
      )
    }
  }

  getMetrics() {
    return this.metrics
  }
}

// Usage in component
@component('MonitoredComponent')
  @ts
  const monitor = new PerformanceMonitor()

  function expensiveOperation() {
    monitor.measure(
      'MonitoredComponent',
      'expensiveOperation',
      () => {
        // Expensive work
      }
    )
  }
  @endts
@endcomponent
```

## Template Performance Optimization

### Enable Production Caching

stx caches compiled templates by default in production:

```ts
// stx.config.ts
export default {
  cache: true, // Enabled by default
  cachePath: '.stx/cache',
  cacheVersion: '1.0.0'
}
```

### Use Streaming for Large Pages

Enable streaming SSR for better perceived performance:

```ts
// stx.config.ts
export default {
  streaming: {
    enabled: true,
    bufferSize: 16384,
    strategy: 'auto', // 'auto', 'eager', or 'lazy'
    timeout: 30000
  }
}
```

### Selective Directive Processing

Disable unused directives to reduce processing overhead:

```ts
// stx.config.ts
export default {
  animation: { enabled: false }, // If not using animations
  a11y: { enabled: false },      // If not using a11y features
  seo: { enabled: false }        // If SEO is handled elsewhere
}
```

## Best Practices

1. **Template Optimization**
   - Enable caching in production
   - Use streaming for large pages
   - Disable unused directive processors
   - Minimize dynamic includes

2. **Build Optimization**
   - Enable tree shaking
   - Use code splitting
   - Optimize assets
   - Configure proper chunks

3. **Component Design**
   - Use lazy loading
   - Implement virtual scrolling
   - Cache expensive computations
   - Optimize re-renders

4. **State Management**
   - Use shallow reactivity
   - Batch updates
   - Implement proper caching
   - Monitor performance

5. **Asset Loading**
   - Optimize images
   - Use proper formats
   - Implement lazy loading
   - Configure caching

## Performance Trade-offs

stx prioritizes **developer experience and features over raw speed**:

**Advantages:**
- Laravel Blade familiarity
- Comprehensive directive system
- Runtime flexibility
- Excellent Bun integration

**Considerations:**
- Slower than pre-compiled engines (Pug, Handlebars) for simple templates
- Rich directive processing adds overhead
- Still excellent for real-world applications (microseconds, not milliseconds)

See [Benchmark Results](/guide/benchmarks) for detailed comparisons.

## Next Steps

- Review [Benchmark Results](/guide/benchmarks)
- Learn about [Testing](/guide/testing)
- Explore [Deployment](/guide/deployment)
- Understand [Security](/guide/security)
- Check out [Monitoring](/guide/monitoring)
