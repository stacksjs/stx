# Monitoring

STX provides comprehensive monitoring capabilities to help you observe, debug, and optimize your applications in production. This page covers all monitoring features and integrations available in the STX ecosystem.

## Application Monitoring

### Performance Metrics

Track key performance indicators:

```typescript
import { metrics } from '@stx/monitoring'

// Request metrics
metrics.counter('http_requests_total', {
  method: 'GET',
  status: '200',
  route: '/api/users'
}).inc()

// Response time tracking
const timer = metrics.histogram('http_request_duration_ms')
const end = timer.startTimer()
// ... handle request
end({ method: 'GET', route: '/api/users' })

// Memory usage
metrics.gauge('memory_usage_bytes').set(process.memoryUsage().heapUsed)
```

### Custom Metrics

```typescript
// Business metrics
const activeUsers = metrics.gauge('active_users_total')
const orderProcessed = metrics.counter('orders_processed_total')
const averageOrderValue = metrics.histogram('order_value_dollars')

// Track business events
orderProcessed.inc({ payment_method: 'stripe' })
averageOrderValue.observe(order.total)
activeUsers.set(await getActiveUserCount())
```

## Error Tracking

### Error Monitoring

```typescript
import { errorTracker } from '@stx/monitoring'

// Automatic error tracking
app.use(errorTracker.middleware({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.GIT_COMMIT
}))

// Manual error reporting
try {
  await riskyOperation()
} catch (error) {
  errorTracker.captureException(error, {
    user: { id: userId },
    extra: { operationId: 'risky-op-123' }
  })
}
```

### Error Context

```typescript
// Add breadcrumbs for debugging
errorTracker.addBreadcrumb({
  message: 'User clicked submit button',
  category: 'ui',
  level: 'info',
  data: { formData: sanitizedFormData }
})

// Set user context
errorTracker.setUser({
  id: user.id,
  email: user.email,
  role: user.role
})
```

## Logging

### Structured Logging

```typescript
import { logger } from '@stx/logging'

// Structured log entries
logger.info('User registration completed', {
  userId: user.id,
  email: user.email,
  registrationMethod: 'email',
  duration: performance.now() - startTime
})

// Error logging with context
logger.error('Payment processing failed', {
  orderId: order.id,
  paymentMethod: 'stripe',
  errorCode: 'card_declined',
  amount: order.total
})
```

### Log Aggregation

```typescript
// Configure log shipping
const logConfig = {
  transports: [
    new ElasticsearchTransport({
      level: 'info',
      index: 'stx-app-logs'
    }),
    new FileTransport({
      filename: 'app.log',
      level: 'debug'
    })
  ]
}
```

## Real-time Monitoring

### Live Dashboard

```typescript
import { dashboard } from '@stx/devtools'

// Enable development dashboard
if (process.env.NODE_ENV === 'development') {
  app.use('/devtools', dashboard({
    metrics: true,
    logs: true,
    performance: true,
    errors: true
  }))
}
```

### Health Checks

```typescript
// Health check endpoints
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      external_api: await checkExternalAPI()
    }
  }
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok')
  res.status(isHealthy ? 200 : 503).json(health)
})
```

## Profiling

### CPU Profiling

```typescript
import { profiler } from '@stx/monitoring'

// Profile specific operations
const profile = profiler.start('heavy-computation')
await heavyComputation()
profile.end()

// Continuous profiling
if (process.env.ENABLE_PROFILING) {
  profiler.startContinuous({
    samplingIntervalMicros: 1000,
    maxStackDepth: 64
  })
}
```

### Memory Profiling

```typescript
// Memory heap snapshots
const snapshot = profiler.takeHeapSnapshot()
await snapshot.export('/tmp/heap-snapshot.heapsnapshot')

// Memory leak detection
profiler.detectMemoryLeaks({
  threshold: 100 * 1024 * 1024, // 100MB
  interval: 60000 // Check every minute
})
```

## Distributed Tracing

### Request Tracing

```typescript
import { tracer } from '@stx/tracing'

// Automatic request tracing
app.use(tracer.middleware({
  serviceName: 'stx-api',
  version: process.env.APP_VERSION
}))

// Manual span creation
async function processOrder(orderId: string) {
  const span = tracer.startSpan('process-order')
  span.setTag('order.id', orderId)
  
  try {
    await validateOrder(orderId)
    await chargePayment(orderId)
    await updateInventory(orderId)
    span.setTag('order.status', 'completed')
  } catch (error) {
    span.setTag('error', true)
    span.log({ event: 'error', message: error.message })
    throw error
  } finally {
    span.finish()
  }
}
```

### Service Dependencies

```typescript
// Track external service calls
const httpSpan = tracer.startSpan('http-request')
httpSpan.setTag('http.method', 'POST')
httpSpan.setTag('http.url', 'https://api.payment.com/charge')

const response = await fetch('https://api.payment.com/charge', {
  method: 'POST',
  body: JSON.stringify(paymentData)
})

httpSpan.setTag('http.status_code', response.status)
httpSpan.finish()
```

## Alerting

### Alert Configuration

```typescript
import { alerts } from '@stx/monitoring'

// Response time alerts
alerts.create({
  name: 'High Response Time',
  condition: 'avg(http_request_duration_ms) > 500',
  duration: '5m',
  severity: 'warning',
  channels: ['slack', 'email']
})

// Error rate alerts
alerts.create({
  name: 'High Error Rate',
  condition: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.05',
  duration: '2m',
  severity: 'critical',
  channels: ['pagerduty', 'slack']
})
```

### Custom Alerts

```typescript
// Business metric alerts
alerts.create({
  name: 'Low Conversion Rate',
  condition: 'conversion_rate < 0.02',
  duration: '10m',
  severity: 'warning',
  description: 'Conversion rate has dropped below 2%'
})
```

## Integration

### Prometheus

```typescript
// Prometheus metrics endpoint
import { promClient } from '@stx/monitoring'

app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType)
  res.end(promClient.register.metrics())
})
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "STX Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [{
          "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
        }]
      }
    ]
  }
}
```

### Third-party Integrations

```typescript
// DataDog integration
import { datadog } from '@stx/monitoring'

datadog.configure({
  apiKey: process.env.DATADOG_API_KEY,
  service: 'stx-app',
  env: process.env.NODE_ENV
})

// New Relic integration
import { newrelic } from '@stx/monitoring'

newrelic.configure({
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  app_name: 'STX Application'
})
```

## Performance Monitoring

### Web Vitals

```typescript
// Track Core Web Vitals
import { webVitals } from '@stx/monitoring'

webVitals.track({
  onCLS: (metric) => logger.info('CLS', metric),
  onFID: (metric) => logger.info('FID', metric),
  onLCP: (metric) => logger.info('LCP', metric),
  onTTFB: (metric) => logger.info('TTFB', metric)
})
```

### Bundle Analysis

```typescript
// Bundle size monitoring
const bundleMetrics = {
  totalSize: getBundleSize(),
  gzippedSize: getGzippedSize(),
  chunks: getChunkSizes()
}

metrics.gauge('bundle_size_bytes').set(bundleMetrics.totalSize)
```

## Related Resources

- [Performance Guide](/guide/performance) - Performance optimization strategies
- [Build Guide](/guide/build) - Development tools and debugging
- [Deployment Guide](/guide/deployment) - Production monitoring setup
- [Security Guide](/guide/security) - Security monitoring and alerts 