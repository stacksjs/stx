# Monitoring

This guide covers monitoring and observability features in stx to help you track performance, errors, and user behavior.

## Performance Monitoring

### Basic Metrics

Track basic performance metrics:

```ts
import { metrics } from '@stacksjs/stx/monitoring'

// Track page load time
metrics.track('page_load', {
  duration: performance.now() - startTime,
  route: window.location.pathname
})

// Track component render time
@component('HeavyComponent')
  @ts
  onMounted(() => {
    metrics.track('component_render', {
      component: 'HeavyComponent',
      duration: performance.now() - mountStart
    })
  })
  @endts
@endcomponent
```

### Custom Metrics

Create custom performance metrics:

```ts
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    metrics.track('custom_metric', {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      entryType: entry.entryType
    })
  })
})

performanceObserver.observe({
  entryTypes: ['measure', 'resource', 'navigation']
})
```

## Error Tracking

### Error Monitoring

Set up error tracking:

```ts
import * as Sentry from '@sentry/browser'

// Initialize error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing()
  ]
})

// Track errors in components
@component('ErrorBoundary')
  @ts
  onErrorCaptured((error, instance, info) => {
    Sentry.captureException(error, {
      extra: {
        componentName: instance.$options.name,
        errorInfo: info
      }
    })
    return false // Stop error propagation
  })
  @endts

  <slot></slot>
@endcomponent
```

### Custom Error Handling

Implement custom error handling:

```ts
class ErrorTracker {
  private errors: Error[] = []

  track(error: Error, context?: any) {
    this.errors.push(error)

    // Send to monitoring service
    metrics.track('error', {
      message: error.message,
      stack: error.stack,
      context
    })
  }

  getRecentErrors() {
    return this.errors.slice(-10)
  }
}

const errorTracker = new ErrorTracker()

// Usage in components
@component('Form')
  @ts
  async function submitForm() {
    try {
      await api.submit(formData)
    } catch (error) {
      errorTracker.track(error, { form: 'user-registration' })
    }
  }
  @endts
@endcomponent
```

## User Analytics

### Event Tracking

Track user interactions:

```ts
import { analytics } from '@stacksjs/stx/analytics'

// Track page views
analytics.pageView({
  path: window.location.pathname,
  title: document.title
})

// Track user events
@component('Button')
  @ts
  function handleClick() {
    analytics.track('button_click', {
      buttonId: props.id,
      buttonText: props.text,
      page: window.location.pathname
    })
  }
  @endts

  <button @click="handleClick">
    <slot></slot>
  </button>
@endcomponent
```

### User Session Tracking

Monitor user sessions:

```ts
const sessionTracker = {
  start() {
    analytics.track('session_start', {
      timestamp: Date.now(),
      referrer: document.referrer,
      userAgent: navigator.userAgent
    })
  },

  end() {
    analytics.track('session_end', {
      duration: this.getSessionDuration(),
      pagesViewed: this.getPagesViewed()
    })
  },

  trackPageView() {
    analytics.track('page_view', {
      path: window.location.pathname,
      timestamp: Date.now()
    })
  }
}
```

## Real-time Monitoring

### WebSocket Monitoring

Monitor WebSocket connections:

```ts
@component('RealtimeMonitor')
  @ts
  interface ConnectionMetrics {
    connected: boolean
    latency: number
    messageCount: number
  }

  const metrics: ConnectionMetrics = reactive({
    connected: false,
    latency: 0,
    messageCount: 0
  })

  function trackConnection(socket: WebSocket) {
    socket.addEventListener('open', () => {
      metrics.connected = true
      analytics.track('websocket_connected')
    })

    socket.addEventListener('close', () => {
      metrics.connected = false
      analytics.track('websocket_disconnected')
    })

    // Track latency
    setInterval(() => {
      const start = Date.now()
      socket.send('ping')
      socket.once('pong', () => {
        metrics.latency = Date.now() - start
      })
    }, 30000)
  }
  @endts
@endcomponent
```

### API Monitoring

Track API performance:

```ts
import axios from 'axios'

const api = axios.create()

// Add monitoring interceptor
api.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() }
  return config
})

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime

    metrics.track('api_request', {
      endpoint: response.config.url,
      method: response.config.method,
      duration,
      status: response.status
    })

    return response
  },
  (error) => {
    metrics.track('api_error', {
      endpoint: error.config.url,
      method: error.config.method,
      status: error.response?.status,
      error: error.message
    })

    return Promise.reject(error)
  }
)
```

## Dashboard Integration

### Metrics Dashboard

Create a metrics dashboard:

```stx
@component('MetricsDashboard')
  @ts
  const metrics = ref({
    pageViews: 0,
    activeUsers: 0,
    errorRate: 0,
    avgLoadTime: 0
  })

  onMounted(async () => {
    // Fetch metrics
    const data = await fetchMetrics()
    metrics.value = data
  })
  @endts

  <div class="dashboard">
    <metric-card
      title="Page Views"
      :value="metrics.pageViews"
      trend="+5.2%"
    />
    <metric-card
      title="Active Users"
      :value="metrics.activeUsers"
      trend="+2.1%"
    />
    <metric-card
      title="Error Rate"
      :value="metrics.errorRate"
      trend="-0.5%"
    />
    <metric-card
      title="Avg Load Time"
      :value="metrics.avgLoadTime"
      trend="-12.3%"
    />
  </div>
@endcomponent
```

## Best Practices

1. **Performance Monitoring**
   - Track key metrics
   - Set up alerts
   - Monitor trends
   - Measure user experience

2. **Error Tracking**
   - Capture all errors
   - Add context
   - Set up notifications
   - Track error rates

3. **Analytics**
   - Track important events
   - Monitor user behavior
   - Measure engagement
   - Analyze patterns

4. **Real-time Monitoring**
   - Monitor connections
   - Track latency
   - Set up heartbeats
   - Alert on issues

## Next Steps

- Learn about [Testing](/features/testing)
- Explore [Deployment](/features/deployment)
- Check out [Performance](/features/performance)
- Review [Security](/features/security)
