# Configuration

_This is just an example of the ts-starter docs._

The Reverse Proxy can be configured using a `reverse-proxy.config.ts` _(or `reverse-proxy.config.js`)_ file and it will be automatically loaded when running the `reverse-proxy` command.

```ts
// reverse-proxy.config.{ts,js}
import type { ReverseProxyOptions } from '@stacksjs/rpx'
import os from 'node:os'
import path from 'node:path'

const config: ReverseProxyOptions = {
  /**
   * The from URL to proxy from.
   * Default: localhost:5173
   */
  from: 'localhost:5173',

  /**
   * The to URL to proxy to.
   * Default: stacks.localhost
   */
  to: 'stacks.localhost',

  /**
   * The HTTPS settings.
   * Default: true
   * If set to false, the proxy will use HTTP.
   * If set to true, the proxy will use HTTPS.
   * If set to an object, the proxy will use HTTPS with the provided settings.
   */
  https: {
    domain: 'stacks.localhost',
    hostCertCN: 'stacks.localhost',
    caCertPath: path.join(os.homedir(), '.stacks', 'ssl', `stacks.localhost.ca.crt`),
    certPath: path.join(os.homedir(), '.stacks', 'ssl', `stacks.localhost.crt`),
    keyPath: path.join(os.homedir(), '.stacks', 'ssl', `stacks.localhost.crt.key`),
    altNameIPs: ['127.0.0.1'],
    altNameURIs: ['localhost'],
    organizationName: 'stacksjs.org',
    countryName: 'US',
    stateName: 'California',
    localityName: 'Playa Vista',
    commonName: 'stacks.localhost',
    validityDays: 180,
    verbose: false,
  },

  /**
   * The verbose setting.
   * Default: false
   * If set to true, the proxy will log more information.
   */
  verbose: false,
}

export default config
```

_Then run:_

```bash
./rpx start
```

To learn more, head over to the [documentation](https://reverse-proxy.sh/).

STX can be configured using a `stx.config.ts` file in your project root. This guide covers all available configuration options and their usage.

## Basic Configuration

A minimal configuration file looks like this:

```ts
// stx.config.ts
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  // Project name
  name: 'my-stx-app',

  // Project root directory
  root: '.',

  // Build output directory
  outDir: 'dist',

  // Development server options
  server: {
    port: 3000,
    host: 'localhost'
  }
})
```

## Full Configuration Reference

Here's a complete configuration file with all available options:

```ts
import { defineConfig } from '@stacksjs/stx'

export default defineConfig({
  // Project name
  name: 'my-stx-app',

  // Project root directory
  root: '.',

  // Build output directory
  outDir: 'dist',

  // Source directory
  srcDir: 'src',

  // Public assets directory
  publicDir: 'public',

  // Base public path
  base: '/',

  // Development server configuration
  server: {
    port: 3000,
    host: 'localhost',
    https: false,
    open: true, // Open browser on server start
    cors: true, // Enable CORS
    hmr: true,  // Hot Module Replacement
  },

  // Build configuration
  build: {
    target: 'esnext',
    minify: true,
    sourcemap: true,
    // Custom build options
    rollupOptions: {
      // Rollup-specific options
    }
  },

  // Feature flags
  features: {
    typescript: true,   // Enable TypeScript support
    streaming: true,    // Enable streaming rendering
    components: true,   // Enable component system
    devtools: true,     // Enable DevTools in development
  },

  // Template configuration
  template: {
    // Default template engine options
    engine: 'stx',
    // Template file extension
    extension: '.stx',
    // Global template data
    data: {
      site: {
        title: 'My STX App',
        description: 'Built with STX'
      }
    }
  },

  // Plugin system
  plugins: [
    // Add your plugins here
  ],

  // Optimization options
  optimize: {
    minify: true,
    treeshake: true,
    splitting: true
  },

  // Development tools
  devtools: {
    enabled: true,
    port: 9090
  },

  // TypeScript configuration
  typescript: {
    // TypeScript compiler options
    compilerOptions: {
      strict: true,
      target: 'esnext',
      module: 'esnext'
    }
  }
})
```

## Configuration Options

### Project Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `package.json name` | Project name |
| `root` | `string` | `.` | Project root directory |
| `srcDir` | `string` | `src` | Source directory |
| `outDir` | `string` | `dist` | Build output directory |
| `publicDir` | `string` | `public` | Public assets directory |
| `base` | `string` | `/` | Public base path |

### Server Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `server.port` | `number` | `3000` | Development server port |
| `server.host` | `string` | `localhost` | Development server host |
| `server.https` | `boolean` | `false` | Enable HTTPS |
| `server.open` | `boolean` | `true` | Open browser on start |
| `server.cors` | `boolean` | `true` | Enable CORS |
| `server.hmr` | `boolean` | `true` | Hot Module Replacement |

### Build Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `build.target` | `string` | `esnext` | Build target |
| `build.minify` | `boolean` | `true` | Minify output |
| `build.sourcemap` | `boolean` | `true` | Generate sourcemaps |

### Feature Flags

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `features.typescript` | `boolean` | `true` | TypeScript support |
| `features.streaming` | `boolean` | `true` | Streaming rendering |
| `features.components` | `boolean` | `true` | Component system |
| `features.devtools` | `boolean` | `true` | DevTools support |

## Environment Variables

STX also supports environment variables for configuration. Create a `.env` file in your project root:

```bash
# .env
STX_PORT=3000
STX_HOST=localhost
STX_PUBLIC_DIR=public
```

Environment variables take precedence over configuration file values.

## TypeScript Configuration

STX works best with TypeScript. Here's a recommended `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["@stacksjs/stx/types"]
  },
  "include": ["src/**/*.ts", "src/**/*.stx"],
  "exclude": ["node_modules", "dist"]
}
```

## Plugin System

STX supports plugins for extending functionality:

```ts
import { defineConfig } from '@stacksjs/stx'
import unocss from '@unocss/stx'
import markdown from '@stacksjs/stx-markdown'

export default defineConfig({
  plugins: [
    unocss(),
    markdown({
      // Plugin options
    })
  ]
})
```

## Next Steps

- Learn about [Template Syntax](/features/templates)
- Explore [Component Configuration](/features/components)
- Check out [Plugin Development](/advanced/plugins)
