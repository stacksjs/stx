# Plugin Development

STX provides a comprehensive plugin system that allows you to extend the framework's functionality. This guide covers how to create, distribute, and maintain STX plugins.

## Plugin Architecture

### Basic Plugin Structure

```typescript
export interface MyPluginOptions {
  enabled?: boolean
  apiKey?: string
  customSettings?: Record<string, any>
}

export class MyPlugin {
  constructor(private options: MyPluginOptions = {}) {}
  
  install(app: STXApp) {
    // Plugin initialization logic
    app.provide('myPlugin', this)
    app.config.globalProperties.$myPlugin = this
  }
  
  async initialize() {
    // Setup logic
  }
  
  destroy() {
    // Cleanup logic
  }
}

export default MyPlugin
```

### Plugin Registration

```typescript
import { createApp } from '@stx/core'
import MyPlugin from './plugins/my-plugin'

const app = createApp()

app.use(MyPlugin, {
  enabled: true,
  apiKey: process.env.MY_PLUGIN_API_KEY
})
```

## Plugin Types

### Compiler Plugins

```typescript
export function createTransformerPlugin(options: TransformerOptions) {
  return {
    name: 'custom-transformer',
    transform(code: string, id: string) {
      if (id.endsWith('.stx')) {
        return code.replace(options.transformPattern, options.replacement)
      }
      return null
    }
  }
}
```

### Runtime Plugins

```typescript
export class StateManagerPlugin {
  private store = new Map()
  
  install(app: STXApp) {
    app.provide('state', {
      get: (key: string) => this.store.get(key),
      set: (key: string, value: any) => this.store.set(key, value),
      delete: (key: string) => this.store.delete(key)
    })
  }
}
```

## Plugin Distribution

### NPM Package Structure

```json
{
  "name": "@stx/my-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "@stx/core": "^2.0.0"
  },
  "keywords": ["stx", "plugin", "my-plugin"]
}
```

### TypeScript Definitions

```typescript
declare module '@stx/core' {
  interface ComponentCustomProperties {
    $myPlugin: MyPlugin
  }
  
  interface GlobalComponents {
    MyComponent: typeof MyComponent
  }
}
```

## Testing Plugins

### Unit Testing

```typescript
import { test, expect } from 'bun:test'
import { createApp } from '@stx/core'
import MyPlugin from '../src'

test('plugin installs correctly', () => {
  const app = createApp()
  
  expect(() => {
    app.use(MyPlugin, { enabled: true })
  }).not.toThrow()
  
  expect(app.config.globalProperties.$myPlugin).toBeDefined()
})
```

## Plugin Ecosystem

### Official Plugins

- `@stx/router` - Client-side routing
- `@stx/state` - State management
- `@stx/i18n` - Internationalization
- `@stx/analytics` - Analytics integration
- `@stx/auth` - Authentication

### Community Guidelines

Guidelines for community plugin development:

1. Follow semantic versioning
2. Include comprehensive tests
3. Provide TypeScript definitions
4. Document API and usage examples
5. Follow STX coding standards

## Related Resources

- [Plugin API Reference](/api/plugins) - Complete plugin API documentation
- [Component Development](/guide/components) - Building components for plugins
- [State Management](/guide/state) - Integrating with STX state
- [Configuration Guide](/guide/config) - Plugin configuration patterns 