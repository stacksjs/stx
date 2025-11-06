# Caching API Reference

This document covers stx's built-in caching system for optimizing template rendering performance.

## Overview

stx provides a sophisticated caching system that:
- Caches compiled templates in memory and on disk
- Tracks template dependencies automatically
- Invalidates cache when templates or dependencies change
- Supports versioned caching for safe deployments
- Provides both file-based and memory-based caching

## Configuration

### Basic Setup

```typescript
// stx.config.ts
export default {
  cache: true,
  cachePath: '.stx/cache',
  cacheVersion: '1.0.0'
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cache` | `boolean` | `false` | Enable/disable caching |
| `cachePath` | `string` | `.stx/cache` | Directory for cache files |
| `cacheVersion` | `string` | `1.0.0` | Cache version for invalidation |

## Cache Types

### Memory Cache

Fast in-memory cache for compiled templates during runtime.

```typescript
import { templateCache } from '@stacksjs/stx/caching'

// Check if template is cached
const isCached = templateCache.has('/path/to/template.stx')

// Get cached template
const cached = templateCache.get('/path/to/template.stx')

// Clear specific template
templateCache.delete('/path/to/template.stx')

// Clear all cache
templateCache.clear()

// Get cache size
const size = templateCache.size
```

### Disk Cache

Persistent cache stored on disk for cross-session persistence.

**Cache Structure:**
```
.stx/cache/
├── abc123def456.html        # Cached template output
├── abc123def456.meta.json   # Cache metadata
├── fed654cba321.html
└── fed654cba321.meta.json
```

**Metadata Format:**
```json
{
  "sourcePath": "/path/to/template.stx",
  "mtime": 1696789012345,
  "dependencies": [
    "/path/to/layout.stx",
    "/path/to/component.stx"
  ],
  "cacheVersion": "1.0.0",
  "generatedAt": 1696789012345
}
```

## API Functions

### checkCache()

Check if a cached version exists and is valid.

```typescript
import { checkCache } from '@stacksjs/stx/caching'

const cached = await checkCache('/path/to/template.stx', {
  cache: true,
  cachePath: '.stx/cache',
  cacheVersion: '1.0.0'
})

if (cached) {
  console.log('Using cached version')
  return cached
}

// Cache miss - need to regenerate
```

**Parameters:**
- `filePath` (string): Path to the template file
- `options` (StxOptions): Configuration options

**Returns:** `Promise<string | null>` - Cached content or null if invalid

**Cache Validation:**
- Checks if cache files exist
- Verifies cache version matches
- Validates source file hasn't been modified
- Checks all dependencies for modifications

### cacheTemplate()

Store a processed template in cache.

```typescript
import { cacheTemplate } from '@stacksjs/stx/caching'

const output = '<html>...</html>'
const dependencies = new Set([
  '/path/to/layout.stx',
  '/path/to/component.stx'
])

await cacheTemplate(
  '/path/to/template.stx',
  output,
  dependencies,
  {
    cache: true,
    cachePath: '.stx/cache',
    cacheVersion: '1.0.0'
  }
)
```

**Parameters:**
- `filePath` (string): Path to the template file
- `output` (string): Processed template output
- `dependencies` (Set\<string\>): Set of dependency file paths
- `options` (StxOptions): Configuration options

**Returns:** `Promise<void>`

### hashFilePath()

Generate a hash for cache file names.

```typescript
import { hashFilePath } from '@stacksjs/stx/caching'

const hash = hashFilePath('/path/to/template.stx')
console.log(hash) // "abc123def456" (16 characters)
```

**Parameters:**
- `filePath` (string): Path to hash

**Returns:** `string` - 16-character hash

## Cache Invalidation

### Automatic Invalidation

Cache is automatically invalidated when:

1. **Source file modified**: Template file timestamp changes
2. **Dependencies modified**: Any included file changes
3. **Version mismatch**: `cacheVersion` changes
4. **Missing dependencies**: A dependency file is deleted

### Manual Invalidation

```typescript
import { templateCache } from '@stacksjs/stx/caching'
import fs from 'node:fs'

// Clear memory cache
templateCache.clear()

// Clear disk cache
await fs.promises.rm('.stx/cache', { recursive: true })
```

### Versioned Invalidation

Update `cacheVersion` to invalidate all cache:

```typescript
// stx.config.ts
export default {
  cache: true,
  cachePath: '.stx/cache',
  cacheVersion: '2.0.0' // Increment version
}
```

## Dependency Tracking

stx automatically tracks dependencies:

### Template Dependencies

```stx
<!-- main.stx -->
@extends('layouts/app.stx')

@section('content')
  @include('partials/header.stx')
  @include('partials/footer.stx')
@endsection
```

**Dependencies tracked:**
- `layouts/app.stx`
- `partials/header.stx`
- `partials/footer.stx`

### Component Dependencies

```stx
<script>
  export const items = ['a', 'b', 'c'];
</script>

<my-card title="Hello" />
<user-profile :user="currentUser" />
```

**Dependencies tracked:**
- `components/my-card.stx`
- `components/user-profile.stx`

### Markdown Dependencies

```stx
@markdown-file('content.md')
@markdown-file('docs/intro.md')
```

**Dependencies tracked:**
- `content.md`
- `docs/intro.md`

## Performance Best Practices

### 1. Enable Caching in Production

```typescript
// stx.config.ts
export default {
  cache: process.env.NODE_ENV === 'production',
  cachePath: '.stx/cache'
}
```

### 2. Use Cache Warming

Pre-generate cache during build:

```typescript
import { processTemplate } from '@stacksjs/stx'

const templates = [
  'pages/home.stx',
  'pages/about.stx',
  'pages/contact.stx'
]

for (const template of templates) {
  await processTemplate(template, {}, {
    cache: true,
    cachePath: '.stx/cache'
  })
}
```

### 3. Optimize Cache Path

Use SSD for faster cache I/O:

```typescript
export default {
  cache: true,
  cachePath: '/tmp/stx-cache' // Faster temp directory
}
```

### 4. Monitor Cache Size

```typescript
import { templateCache } from '@stacksjs/stx/caching'
import fs from 'node:fs'

// Memory cache size
console.log(`Memory cache: ${templateCache.size} templates`)

// Disk cache size
const cacheDir = '.stx/cache'
const files = await fs.promises.readdir(cacheDir)
console.log(`Disk cache: ${files.length} files`)
```

### 5. Clear Stale Cache

Set up periodic cache cleanup:

```typescript
import fs from 'node:fs'
import path from 'node:path'

async function clearStaleCache(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
  const cacheDir = '.stx/cache'
  const files = await fs.promises.readdir(cacheDir)
  const now = Date.now()

  for (const file of files) {
    const filePath = path.join(cacheDir, file)
    const stats = await fs.promises.stat(filePath)

    if (now - stats.mtime.getTime() > maxAge) {
      await fs.promises.unlink(filePath)
    }
  }
}

// Run cleanup weekly
clearStaleCache()
```

## Cache Strategies

### Development Strategy

Disable caching for hot reload:

```typescript
// stx.config.ts
export default {
  cache: false // Always regenerate in dev
}
```

### Production Strategy

Enable caching with version control:

```typescript
// stx.config.ts
import pkg from './package.json'

export default {
  cache: true,
  cachePath: '.stx/cache',
  cacheVersion: pkg.version // Use package version
}
```

### Hybrid Strategy

Memory cache in dev, disk cache in production:

```typescript
// stx.config.ts
const isDev = process.env.NODE_ENV !== 'production'

export default {
  cache: true,
  cachePath: isDev ? ':memory:' : '.stx/cache',
  cacheVersion: isDev ? 'dev' : process.env.CACHE_VERSION
}
```

## Examples

### Basic Cache Usage

```typescript
import { processTemplate } from '@stacksjs/stx'

// First render (cache miss)
const output1 = await processTemplate('template.stx', {}, {
  cache: true,
  cachePath: '.stx/cache'
})
// Takes: ~50ms

// Second render (cache hit)
const output2 = await processTemplate('template.stx', {}, {
  cache: true,
  cachePath: '.stx/cache'
})
// Takes: ~2ms ⚡
```

### Cache with Dependencies

```typescript
// layout.stx
<!DOCTYPE html>
<html>
<body>
  @yield('content')
</body>
</html>

// page.stx
@extends('layout.stx')

@section('content')
  @include('header.stx')
  <main>Content</main>
@endsection

// Dependencies: layout.stx, header.stx
// Cache invalidates if ANY dependency changes
```

### Manual Cache Control

```typescript
import { checkCache, cacheTemplate, templateCache } from '@stacksjs/stx/caching'

// Custom cache logic
async function renderWithCache(templatePath: string, context: any) {
  // Check cache
  const cached = await checkCache(templatePath, { cache: true })
  if (cached) {
    return cached
  }

  // Render template
  const output = await render(templatePath, context)

  // Store in cache
  await cacheTemplate(templatePath, output, new Set(), { cache: true })

  return output
}
```

## Debugging Cache

### Enable Cache Logging

```typescript
// stx.config.ts
export default {
  cache: true,
  debug: true, // Log cache hits/misses
  cachePath: '.stx/cache'
}
```

### Inspect Cache Files

```bash
# List cache files
ls -lh .stx/cache/

# View cache metadata
cat .stx/cache/abc123def456.meta.json | jq

# View cached output
cat .stx/cache/abc123def456.html
```

### Monitor Cache Performance

```typescript
import { performance } from 'node:perf_hooks'

const start = performance.now()
const output = await processTemplate('template.stx', {}, { cache: true })
const duration = performance.now() - start

console.log(`Render time: ${duration.toFixed(2)}ms`)
```

## See Also

- [Performance](/features/performance) - Performance optimization guide
- [Configuration](/guide/config) - stx configuration options
- [Build Process](/guide/build) - Build and optimization
- [Deployment](/guide/deployment) - Production deployment strategies
