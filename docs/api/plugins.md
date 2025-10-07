# Plugin Development API Reference

This document covers stx's plugin system API, including plugin creation, hooks, and integration points.

## Plugin Basics

### Plugin Structure

```ts
import { Plugin } from '@stacksjs/stx'

interface stxPlugin {
  // Required plugin name
  name: string

  // Plugin installation
  install: (app: App, options?: any) => void

  // Optional plugin configuration
  config?: PluginConfig

  // Optional plugin hooks
  hooks?: PluginHooks
}

// Basic plugin example
const MyPlugin: Plugin = {
  name: 'my-plugin',

  install(app, options) {
    // Plugin initialization code
  }
}
```

### Plugin Registration

```ts
import { createApp } from '@stacksjs/stx'
import MyPlugin from './my-plugin'

const app = createApp()

// Register plugin
app.use(MyPlugin)

// Register with options
app.use(MyPlugin, {
  option1: 'value1',
  option2: 'value2'
})

// Register multiple plugins
const plugins = [
  [MyPlugin, { /* options */ }],
  OtherPlugin
]

plugins.forEach(plugin => {
  Array.isArray(plugin)
    ? app.use(...plugin)
    : app.use(plugin)
})
```

## Plugin Features

### Global Properties

```ts
const MyPlugin: Plugin = {
  install(app) {
    // Add global properties
    app.config.globalProperties.$myHelper = {
      formatDate(date: Date) {
        return date.toLocaleDateString()
      },

      capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1)
      }
    }

    // Add global methods
    app.config.globalProperties.$notify = (message: string) => {
      // Show notification
    }
  }
}

// Usage in components
const MyComponent = defineComponent({
  setup() {
    const date = new Date()
    console.log(this.$myHelper.formatDate(date))
    this.$notify('Hello!')
  }
})
```

### Custom Directives

```ts
const MyPlugin: Plugin = {
  install(app) {
    // Register global directive
    app.directive('my-directive', {
      mounted(el, binding) {
        const { value, arg, modifiers } = binding

        // Directive logic
        el.style.color = value

        if (modifiers.bold) {
          el.style.fontWeight = 'bold'
        }
      },

      updated(el, binding) {
        // Update logic
      }
    })
  }
}

// Usage in template
<div v-my-directive:arg.bold="'red'">
  Styled text
</div>
```

### Component Registration

```ts
const MyPlugin: Plugin = {
  install(app) {
    // Register single component
    app.component('MyComponent', {
      // Component definition
    })

    // Register multiple components
    const components = {
      Button: { /* ... */ },
      Card: { /* ... */ },
      Modal: { /* ... */ }
    }

    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  }
}
```

## Plugin Hooks

### Lifecycle Hooks

```ts
const MyPlugin: Plugin = {
  install(app) {
    // Before app mount
    app.beforeMount(() => {
      console.log('App mounting...')
    })

    // After app mount
    app.mounted(() => {
      console.log('App mounted')
    })

    // Before app unmount
    app.beforeUnmount(() => {
      console.log('App unmounting...')
    })

    // After app unmount
    app.unmounted(() => {
      console.log('App unmounted')
    })
  }
}
```

### Custom Hooks

```ts
const MyPlugin: Plugin = {
  install(app) {
    const hooks = {
      beforeRoute: new Set<Function>(),
      afterRoute: new Set<Function>()
    }

    // Add hook methods
    app.config.globalProperties.$addHook = (name: string, fn: Function) => {
      hooks[name]?.add(fn)
    }

    app.config.globalProperties.$removeHook = (name: string, fn: Function) => {
      hooks[name]?.delete(fn)
    }

    // Execute hooks
    app.config.globalProperties.$executeHook = async (name: string, ...args: any[]) => {
      for (const fn of hooks[name] || []) {
        await fn(...args)
      }
    }
  }
}

// Usage
const MyComponent = defineComponent({
  mounted() {
    this.$addHook('beforeRoute', () => {
      // Hook logic
    })
  }
})
```

## Plugin Configuration

### Configuration Options

```ts
interface PluginConfig {
  // Plugin options
  options?: Record<string, any>

  // Default configuration
  defaults?: Record<string, any>

  // Validation rules
  rules?: Record<string, (value: any) => boolean>
}

const MyPlugin: Plugin = {
  name: 'my-plugin',

  config: {
    options: {
      theme: 'light',
      language: 'en'
    },

    defaults: {
      theme: 'light',
      language: 'en'
    },

    rules: {
      theme: value => ['light', 'dark'].includes(value),
      language: value => typeof value === 'string'
    }
  },

  install(app, options) {
    // Merge options with defaults
    const config = {
      ...this.config.defaults,
      ...options
    }

    // Validate configuration
    Object.entries(config).forEach(([key, value]) => {
      const validator = this.config.rules[key]
      if (validator && !validator(value)) {
        throw new Error(`Invalid ${key} value: ${value}`)
      }
    })

    // Use configuration
    app.config.globalProperties.$pluginConfig = config
  }
}
```

### Runtime Configuration

```ts
const MyPlugin: Plugin = {
  install(app, initialOptions) {
    let config = { ...initialOptions }

    // Add configuration methods
    app.config.globalProperties.$setPluginConfig = (options: Record<string, any>) => {
      config = {
        ...config,
        ...options
      }

      // Update plugin behavior
      updatePlugin(config)
    }

    app.config.globalProperties.$getPluginConfig = () => {
      return { ...config }
    }
  }
}

// Usage
const MyComponent = defineComponent({
  setup() {
    // Get config
    const config = this.$getPluginConfig()

    // Update config
    this.$setPluginConfig({
      theme: 'dark'
    })
  }
})
```

## Plugin Integration

### State Management

```ts
const MyPlugin: Plugin = {
  install(app) {
    // Create plugin store module
    const store = {
      state: {
        pluginData: null
      },

      mutations: {
        setPluginData(state, data) {
          state.pluginData = data
        }
      },

      actions: {
        async fetchPluginData({ commit }) {
          const data = await api.getData()
          commit('setPluginData', data)
        }
      }
    }

    // Register store module
    app.store.registerModule('myPlugin', store)
  }
}
```

### Router Integration

```ts
const MyPlugin: Plugin = {
  install(app) {
    // Add route guards
    app.router.beforeEach((to, from) => {
      // Route guard logic
    })

    // Add routes
    app.router.addRoute({
      path: '/plugin',
      component: PluginView
    })

    // Add route metadata
    app.router.beforeResolve((to) => {
      to.meta.pluginData = {
        // Route metadata
      }
    })
  }
}
```

### Event Handling

```ts
const MyPlugin: Plugin = {
  install(app) {
    // Create event bus
    const events = new Map()

    // Add event methods
    app.config.globalProperties.$on = (event: string, handler: Function) => {
      if (!events.has(event)) {
        events.set(event, new Set())
      }
      events.get(event).add(handler)
    }

    app.config.globalProperties.$emit = (event: string, ...args: any[]) => {
      if (events.has(event)) {
        events.get(event).forEach(handler => handler(...args))
      }
    }

    app.config.globalProperties.$off = (event: string, handler: Function) => {
      if (events.has(event)) {
        events.get(event).delete(handler)
      }
    }
  }
}

// Usage
const MyComponent = defineComponent({
  mounted() {
    this.$on('pluginEvent', (data) => {
      // Handle event
    })
  },

  methods: {
    triggerEvent() {
      this.$emit('pluginEvent', { /* data */ })
    }
  }
})
```

## Next Steps

- Explore [Core API](/api/core)
- Check out [Component API](/api/components)
- Learn about [Helper Functions](/api/helpers)
- Review [Router API](/api/router)
