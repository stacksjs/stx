# Performance Optimization

STX is built with performance in mind, but there are several techniques and best practices you can use to further optimize your application. This guide covers various performance optimization strategies.

## Build Optimization

### Tree Shaking

STX automatically performs tree shaking to eliminate unused code:

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

## Best Practices

1. **Build Optimization**
   - Enable tree shaking
   - Use code splitting
   - Optimize assets
   - Configure proper chunks

2. **Component Design**
   - Use lazy loading
   - Implement virtual scrolling
   - Cache expensive computations
   - Optimize re-renders

3. **State Management**
   - Use shallow reactivity
   - Batch updates
   - Implement proper caching
   - Monitor performance

4. **Asset Loading**
   - Optimize images
   - Use proper formats
   - Implement lazy loading
   - Configure caching

## Next Steps

- Learn about [Testing](/advanced/testing)
- Explore [Deployment](/advanced/deployment)
- Understand [Security](/advanced/security)
- Check out [Monitoring](/advanced/monitoring) 