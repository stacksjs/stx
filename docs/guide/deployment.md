# Deployment

This guide covers everything you need to know about deploying your STX application to production.

## Build Process

### Production Build

Create a production build of your application:

```bash
# Build for production
bun run build

# Preview production build locally
bun run preview
```

The build process:
1. Compiles templates and components
2. Bundles assets and dependencies
3. Optimizes for production
4. Generates static files

### Build Configuration

Configure your build in `stx.config.ts`:

```ts
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  build: {
    // Output directory
    outDir: 'dist',
    
    // Enable minification
    minify: true,
    
    // Generate sourcemaps
    sourcemap: false,
    
    // Custom rollup options
    rollupOptions: {
      external: ['some-external-dependency'],
      output: {
        manualChunks: {
          vendor: ['lodash', 'axios'],
          components: ['./src/components/']
        }
      }
    },
    
    // Asset handling
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    
    // CSS options
    cssCodeSplit: true,
    cssMinify: true
  }
})
```

## Hosting Options

### Static Hosting

Deploy to static hosting platforms:

1. **Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

2. **Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

3. **GitHub Pages**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: oven-sh/setup-bun@v1
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

For server-side rendering or API integration:

1. **Docker**
```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
```

2. **PM2**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server.js --name stx-app
```

## Environment Configuration

### Environment Variables

Create environment-specific files:

```bash
.env                # Default
.env.development   # Development
.env.production    # Production
.env.local         # Local overrides (git-ignored)
```

Example `.env.production`:
```bash
NODE_ENV=production
API_URL=https://api.example.com
CACHE_ENABLED=true
```

Access in code:
```ts
const apiUrl = process.env.API_URL
```

### Runtime Configuration

Create runtime config (`config/runtime.ts`):

```ts
export default {
  api: {
    baseUrl: process.env.API_URL,
    timeout: 5000
  },
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    duration: 3600
  },
  features: {
    analytics: true,
    feedback: false
  }
}
```

## CI/CD Setup

### GitHub Actions

Create comprehensive CI/CD pipeline:

```yaml
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
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Run tests
        run: bun test
      - name: Run type check
        run: bun run typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Build
        run: bun run build
      - name: Upload artifacts
        uses: actions/upload-artifact@v2
        with:
          name: dist
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v2
        with:
          name: dist
      - name: Deploy to production
        run: |
          # Add your deployment commands here
```

### GitLab CI

Example `.gitlab-ci.yml`:

```yaml
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
    - bun run typecheck

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
    - echo "Deploying application..."
    # Add deployment commands
  only:
    - main
```

## Performance Optimization

### Production Optimizations

1. **Enable Compression**
```ts
// server.ts
import compression from 'compression'

app.use(compression())
```

2. **Cache Control**
```ts
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000')
  next()
})
```

3. **Preload Critical Assets**
```stx
<link rel="preload" href="/assets/main.js" as="script">
<link rel="preload" href="/assets/main.css" as="style">
```

### Monitoring

1. **Error Tracking**
```ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})
```

2. **Performance Monitoring**
```ts
import { metrics } from '@stacksjs/stx/monitoring'

metrics.track('page_load', {
  duration: performance.now() - startTime
})
```

## Security Considerations

1. **Headers**
```ts
import helmet from 'helmet'

app.use(helmet())
```

2. **CORS**
```ts
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  methods: ['GET', 'POST'],
  credentials: true
}))
```

3. **Content Security Policy**
```ts
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  }
}))
```

## Next Steps

- Learn about [Testing](/features/testing)
- Explore [State Management](/features/state)
- Check out [Security](/features/security)
- Review [Monitoring](/features/monitoring) 