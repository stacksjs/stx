/**
 * STX App API
 *
 * Vue-compatible createApp() pattern for initializing stx applications.
 * Supports app.use(), app.provide(), app.component(), app.directive(), and app.mount().
 *
 * @module app
 */

import type { CustomDirective } from './types'
import { setGlobalProvide } from './composition-api'

// =============================================================================
// Types
// =============================================================================

/** A Vue-compatible plugin with install method */
export interface StxAppPlugin {
  install: (app: StxApp, ...options: any[]) => void
}

/** Plugin can be an object with install() or a plain function */
export type StxPluginInput = StxAppPlugin | ((app: StxApp, ...options: any[]) => void)

/** The stx application instance */
export interface StxApp {
  /** Install a plugin */
  use(plugin: StxPluginInput, ...options: any[]): StxApp
  /** Provide a value globally to all components */
  provide<T>(key: string | symbol, value: T): StxApp
  /** Register a global component */
  component(name: string, definition?: any): StxApp | any
  /** Register a global custom directive */
  directive(name: string, definition?: CustomDirective | Record<string, any>): StxApp | any
  /** Mount the application */
  mount(rootContainer?: string | Element): StxApp
  /** Unmount the application */
  unmount(): void
  /** Application configuration */
  config: StxAppConfig
  /** Internal: registered global components */
  _components: Map<string, any>
  /** Internal: registered global directives */
  _directives: Map<string, any>
  /** Internal: installed plugins */
  _installedPlugins: Set<StxPluginInput>
}

/** Application configuration */
export interface StxAppConfig {
  /** Global error handler */
  errorHandler?: (error: Error, instance: any, info: string) => void
  /** Global warning handler */
  warnHandler?: (msg: string, instance: any, trace: string) => void
  /** Global properties available in all components */
  globalProperties: Record<string, any>
  /** Performance tracking */
  performance: boolean
  /** Component compiler options */
  compilerOptions: {
    /** Custom element tag pattern */
    isCustomElement?: (tag: string) => boolean
    /** Whitespace handling */
    whitespace?: 'condense' | 'preserve'
  }
}

// =============================================================================
// createApp()
// =============================================================================

/**
 * Create an stx application instance.
 *
 * ```ts
 * import { createApp } from '@stacksjs/stx'
 *
 * const app = createApp()
 *
 * app.use(myPlugin)
 * app.provide('theme', 'dark')
 * app.component('MyButton', MyButton)
 * app.mount('#app')
 * ```
 *
 * @param rootComponent - Optional root component definition
 * @param rootProps - Optional props for the root component
 */
export function createApp(_rootComponent?: any, _rootProps?: Record<string, any>): StxApp {
  const installedPlugins = new Set<StxPluginInput>()
  const components = new Map<string, any>()
  const directives = new Map<string, any>()

  const config: StxAppConfig = {
    globalProperties: {},
    performance: false,
    compilerOptions: {},
  }

  const app: StxApp = {
    config,
    _components: components,
    _directives: directives,
    _installedPlugins: installedPlugins,

    use(plugin: StxPluginInput, ...options: any[]) {
      if (installedPlugins.has(plugin)) {
        return app
      }

      installedPlugins.add(plugin)

      if (typeof plugin === 'function') {
        plugin(app, ...options)
      }
      else if (typeof plugin.install === 'function') {
        plugin.install(app, ...options)
      }

      return app
    },

    provide<T>(key: string | symbol, value: T) {
      setGlobalProvide(key, value)
      return app
    },

    component(name: string, definition?: any) {
      if (!definition) {
        return components.get(name)
      }
      components.set(name, definition)
      return app
    },

    directive(name: string, definition?: any) {
      if (!definition) {
        return directives.get(name)
      }
      directives.set(name, definition)
      return app
    },

    mount(_rootContainer?: string | Element) {
      // Client-side: initialize the app runtime
      if (typeof document !== 'undefined') {
        // Inject global properties
        const globalObj = (globalThis as any).__stx_globals || ((globalThis as any).__stx_globals = {})
        Object.assign(globalObj, config.globalProperties)

        // Remove v-cloak from all elements
        document.querySelectorAll('[v-cloak]').forEach((el) => {
          el.removeAttribute('v-cloak')
        })
      }

      return app
    },

    unmount() {
      // Cleanup
      components.clear()
      directives.clear()
      installedPlugins.clear()
    },
  }

  return app
}
