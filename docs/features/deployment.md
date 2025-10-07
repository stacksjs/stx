# Deployment

stx provides multiple deployment options and strategies to help you ship your applications to production efficiently and reliably.

## Deployment Targets

### Static Site Generation

Deploy stx applications as static sites:

```bash
# Build for static deployment
bun run build:static

# Deploy to various platforms
bun run deploy:netlify
bun run deploy:vercel
bun run deploy:github-pages
```

### Server-Side Rendering

Deploy with full SSR capabilities:

```bash
# Build for SSR
bun run build:ssr

# Start production server
bun run start:prod
```

### Edge Computing

Deploy to edge environments:

```typescript
// edge-config.ts
export default {
  runtime: 'edge',
  regions: ['us-east-1', 'eu-west-1'],
  caching: {
    ttl: 3600,
    staleWhileRevalidate: true
  }
}
```

## Platform Integrations

### Vercel

```json
{
  "functions": {
    "app/api/*.ts": {
      "runtime": "bun"
    }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/app" }
  ]
}
```

### Netlify

```toml
[build]
  command = "bun run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  BUN_VERSION = "1.0.0"
```

### Docker

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
```

## Build Optimization

### Code Splitting

```typescript
// Dynamic imports for code splitting
const LazyComponent = lazy(() => import('./LazyComponent.stx'))

// Route-based splitting
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard.stx')
  }
]
```

### Bundle Analysis

```bash
# Analyze bundle size
bun run build:analyze

# Generate bundle report
bun run bundle:report
```

## Environment Configuration

### Environment Variables

```typescript
// .env.production
NODE_ENV=production
API_URL=https://api.example.com
CDN_URL=https://cdn.example.com
ENABLE_ANALYTICS=true
```

### Config Management

```typescript
// config/production.ts
export default {
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },
  cache: {
    ttl: 86400,
    redis: process.env.REDIS_URL
  },
  logging: {
    level: 'info',
    format: 'json'
  }
}
```

## Monitoring and Health Checks

### Health Endpoints

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  })
})
```

### Performance Monitoring

```typescript
// Performance metrics
import { metrics } from '@stx/monitoring'

metrics.counter('requests_total').inc()
metrics.histogram('request_duration').observe(duration)
```

## Security

### HTTPS Configuration

```typescript
// HTTPS setup
const options = {
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem')
}

https.createServer(options, app).listen(443)
```

### Security Headers

```typescript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}))
```

## Related Resources

- [Build Guide](/guide/build) - Build system configuration
- [Performance Guide](/guide/performance) - Performance optimization
- [Security Guide](/guide/security) - Security best practices
- [Monitoring Guide](/guide/monitoring) - Application monitoring
