![Social Card of stx](https://github.com/stacksjs/stx/blob/main/.github/art/cover.jpg)

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm downloads][npm-downloads-src]][npm-downloads-href]

# @stx/deploy

Deployment adapters for STX applications. Ship to Bun server, static hosting, or AWS CloudFront with a unified adapter interface.

## Installation

```bash
bun add @stx/deploy
```

## Usage

### Bun Server Adapter

Serve your built STX app with Bun's native HTTP server, including compression, caching, and TLS support.

```typescript
import { bunServerAdapter } from '@stx/deploy'

const adapter = bunServerAdapter({
  outputDir: './dist',
  port: 3000,
  hostname: '0.0.0.0',
  compress: true,
  headers: {
    'X-Powered-By': 'stx',
  },
})

await adapter.build({ entry: './src/index.ts', outputDir: './dist' })
await adapter.deploy({ outputDir: './dist' })
```

### Static Adapter

Export your app as static HTML/CSS/JS for deployment to any static hosting (Netlify, Vercel, Cloudflare Pages, etc.).

```typescript
import { staticAdapter } from '@stx/deploy'

const adapter = staticAdapter({
  outputDir: './dist',
  fallback: 'index.html', // SPA fallback
  netlifyRedirects: true,  // generate _redirects file
})

await adapter.build({ entry: './src/index.ts', outputDir: './dist' })
```

### Cloud Adapter (AWS)

Deploy to S3 + CloudFront with automatic CloudFormation stack management.

```typescript
import { cloudAdapter } from '@stx/deploy'

const adapter = cloudAdapter({
  region: 'us-east-1',
  stackName: 'my-stx-app',
  bucketName: 'my-stx-app-assets',
})

await adapter.deploy({ outputDir: './dist' })
```

### Custom Adapters

Implement the `DeployAdapter` interface to create your own deployment target.

```typescript
import { defineAdapter } from '@stx/deploy'

const myAdapter = defineAdapter({
  name: 'my-platform',

  async build(config) {
    // Build logic
    return { outputDir: config.outputDir, files: [] }
  },

  async deploy(config) {
    // Deploy logic
    return { success: true, url: 'https://my-app.example.com' }
  },
})
```

### Runtime Detection

Detect the current runtime environment and its capabilities.

```typescript
import { detectRuntime, isEdgeRuntime } from '@stx/deploy'

const runtime = detectRuntime()
// => { platform: 'bun', version: '1.x', capabilities: { ... } }

if (isEdgeRuntime()) {
  // Running on Cloudflare Workers, Deno Deploy, Vercel Edge, etc.
}
```

## API

| Export | Description |
| ------ | ----------- |
| `bunServerAdapter(config)` | Create a Bun HTTP server deployment adapter |
| `staticAdapter(config)` | Create a static file export adapter |
| `cloudAdapter(config)` | Create an AWS S3 + CloudFront adapter |
| `defineAdapter(adapter)` | Helper to define a custom adapter with type-checking |
| `detectRuntime()` | Detect current runtime platform and capabilities |
| `isEdgeRuntime()` | Check if running on an edge runtime |

## Documentation

- [Full Documentation](https://stx.sh)

## License

MIT

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@stx/deploy?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stx/deploy
[npm-downloads-src]: https://img.shields.io/npm/dm/@stx/deploy?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/@stx/deploy
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/stx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/stx/actions?query=workflow%3Aci
