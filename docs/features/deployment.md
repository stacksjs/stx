# Deployment

This guide covers everything you need to know about deploying STX applications to production environments.

## Build Process

### Production Build

Create a production build of your STX application:

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

The build process:
1. Compiles templates
2. Bundles assets
3. Optimizes for production
4. Generates static files

### Build Configuration

Configure your production build in `stx.config.ts`:

```ts
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  build: {
    // Output directory
    outDir: 'dist',

    // Public base path
    base: '/',

    // Minification
    minify: true,

    // Source maps
    sourcemap: false,

    // Asset handling
    assetsInlineLimit: 4096,
    cssCodeSplit: true,

    // Chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['lodash', 'axios'],
          components: ['./src/components/'],
          utils: ['./src/utils/']
        }
      }
    },

    // Environment variables
    env: {
      API_URL: 'https://api.example.com'
    }
  }
})
```

### Environment Variables

Set up environment variables for different environments:

```bash
# .env
NODE_ENV=development
API_URL=http://localhost:3000

# .env.production
NODE_ENV=production
API_URL=https://api.example.com

# .env.staging
NODE_ENV=staging
API_URL=https://staging-api.example.com
```

Access environment variables in your code:

```ts
const apiUrl = process.env.API_URL
const isDev = process.env.NODE_ENV === 'development'
```

## Hosting Options

### Static Hosting

Deploy to static hosting services:

1. **Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configuration (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "bun run build",
        "outputDirectory": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

2. **Netlify**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

Configuration (`netlify.toml`):
```toml
[build]
  command = "bun run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. **GitHub Pages**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Build
        run: bun run build
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Server Deployment

Deploy to a Node.js server:

1. **PM2**

```bash
# Install PM2
npm i -g pm2

# Start application
pm2 start ecosystem.config.js
```

Configuration (`ecosystem.config.js`):
```js
module.exports = {
  apps: [{
    name: 'stx-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

2. **Docker**

```dockerfile
# Dockerfile
FROM oven/bun:latest

WORKDIR /app

# Copy files
COPY package.json bun.lockb ./
COPY . .

# Install dependencies
RUN bun install

# Build
RUN bun run build

# Start server
CMD ["bun", "run", "start"]
```

Docker Compose:
```yaml
# docker-compose.yml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_URL=https://api.example.com
```

## CI/CD Setup

### GitHub Actions

Set up continuous deployment:

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Run tests
        run: bun test
        
      - name: Build
        run: bun run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        uses: some-deployment-action@v1
        with:
          token: ${{ secrets.DEPLOY_TOKEN }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
image: oven/bun:latest

stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - bun install
    - bun test

build:
  stage: build
  script:
    - bun install
    - bun run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - echo "Deploying..."
    # Add deployment steps
  only:
    - main
```

## Performance Optimization

### Caching

Set up proper caching headers:

```nginx
# nginx.conf
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
    
    # Cache API responses
    location /api/ {
        proxy_pass http://api-server;
        proxy_cache my_cache;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
        proxy_cache_valid 200 60m;
    }
}
```

### CDN Integration

Use a CDN for static assets:

```ts
// stx.config.ts
export default defineConfig({
  build: {
    // CDN URL for assets
    base: 'https://cdn.example.com/',
    
    // Asset handling
    assetsDir: 'assets',
    
    // Generate asset manifest
    manifest: true
  }
})
```

### Compression

Enable compression:

```nginx
# nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 10240;
gzip_proxied expired no-cache no-store private auth;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;
gzip_disable "MSIE [1-6]\.";
```

## Monitoring

### Error Tracking

Set up error tracking:

```ts
// src/utils/errorTracking.ts
import * as Sentry from '@sentry/browser'

export function setupErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0
    })
  }
}
```

### Performance Monitoring

Monitor application performance:

```ts
// src/utils/monitoring.ts
import { init as initApm } from '@elastic/apm-rum'

export function setupMonitoring() {
  if (process.env.NODE_ENV === 'production') {
    initApm({
      serviceName: 'my-stx-app',
      serverUrl: process.env.APM_SERVER_URL,
      environment: process.env.NODE_ENV
    })
  }
}
```

## Best Practices

1. **Build Process**
   - Optimize assets
   - Enable minification
   - Configure chunking
   - Set up source maps

2. **Deployment**
   - Use CI/CD pipelines
   - Implement staging
   - Configure monitoring
   - Set up rollbacks

3. **Performance**
   - Enable caching
   - Use CDN
   - Optimize loading
   - Monitor metrics

4. **Security**
   - Secure headers
   - Environment variables
   - Access control
   - Regular updates

## Next Steps

- Learn about [Security](/advanced/security)
- Explore [Monitoring](/advanced/monitoring)
- Understand [Scaling](/advanced/scaling)
- Check out [Maintenance](/advanced/maintenance) 