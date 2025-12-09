/**
 * Plugin System for stx
 *
 * Provides a robust plugin architecture with lifecycle hooks for extending
 * the template processing pipeline.
 *
 * ## Plugin Lifecycle
 *
 * Plugins can hook into various stages of template processing:
 *
 * 1. **beforeProcess** - Before any directive processing begins
 * 2. **afterParse** - After template is parsed but before directives run
 * 3. **beforeDirective** - Before each directive type is processed
 * 4. **afterDirective** - After each directive type is processed
 * 5. **beforeRender** - Before final output is generated
 * 6. **afterRender** - After final output is generated
 * 7. **onError** - When an error occurs during processing
 *
 * ## Example Plugin
 *
 * ```typescript
 * const myPlugin: StxPlugin = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *
 *   beforeProcess({ template, context }) {
 *     // Add global variables
 *     context.myPluginData = { initialized: true }
 *     return { template, context }
 *   },
 *
 *   registerDirectives() {
 *     return [{
 *       name: 'myDirective',
 *       handler: (content, params) => content.toUpperCase(),
 *       hasEndTag: true
 *     }]
 *   }
 * }
 * ```
 *
 * @module plugin-system
 */

import type { CustomDirective, StxOptions } from './types'

// =============================================================================
// Plugin Types
// =============================================================================

/**
 * Context passed to lifecycle hooks
 */
export interface PluginContext {
  /** Current template content */
  template: string
  /** Template context/variables */
  context: Record<string, unknown>
  /** Source file path */
  filePath: string
  /** Stx options */
  options: StxOptions
  /** Dependencies tracked during processing */
  dependencies: Set<string>
  /** Metadata for plugin communication */
  metadata: Record<string, unknown>
}

/**
 * Result from a lifecycle hook
 */
export interface PluginHookResult {
  /** Modified template (optional) */
  template?: string
  /** Modified context (optional) */
  context?: Record<string, unknown>
  /** Whether to skip further processing (optional) */
  skip?: boolean
  /** Additional metadata to pass along */
  metadata?: Record<string, unknown>
}

/**
 * Error context passed to onError hook
 */
export interface PluginErrorContext extends PluginContext {
  /** The error that occurred */
  error: Error
  /** Phase where error occurred */
  phase: string
  /** Directive being processed (if applicable) */
  directive?: string
}

/**
 * Directive type identifier for beforeDirective/afterDirective hooks
 */
export type DirectivePhase =
  | 'comments'
  | 'escaped'
  | 'stacks'
  | 'layouts'
  | 'includes'
  | 'js'
  | 'ts'
  | 'custom'
  | 'components'
  | 'animation'
  | 'routes'
  | 'auth'
  | 'csrf'
  | 'method'
  | 'loops'
  | 'conditionals'
  | 'forms'
  | 'markdown'
  | 'i18n'
  | 'a11y'
  | 'seo'
  | 'expressions'

/**
 * Plugin definition interface
 */
export interface StxPlugin {
  /** Unique plugin name */
  name: string

  /** Plugin version (semver) */
  version?: string

  /** Plugin description */
  description?: string

  /** Plugin dependencies (other plugin names) */
  dependencies?: string[]

  /** Order priority (lower runs first, default: 100) */
  priority?: number

  // =========================================================================
  // Lifecycle Hooks
  // =========================================================================

  /**
   * Called before any template processing begins.
   * Use this to initialize plugin state or modify the initial template.
   */
  beforeProcess?: (ctx: PluginContext) => PluginHookResult | Promise<PluginHookResult> | void

  /**
   * Called after the template is parsed but before directives are processed.
   * Useful for template analysis or pre-processing.
   */
  afterParse?: (ctx: PluginContext) => PluginHookResult | Promise<PluginHookResult> | void

  /**
   * Called before a specific directive type is processed.
   * @param phase - The directive phase being processed
   * @param ctx - Plugin context
   */
  beforeDirective?: (phase: DirectivePhase, ctx: PluginContext) => PluginHookResult | Promise<PluginHookResult> | void

  /**
   * Called after a specific directive type is processed.
   * @param phase - The directive phase that was processed
   * @param ctx - Plugin context
   */
  afterDirective?: (phase: DirectivePhase, ctx: PluginContext) => PluginHookResult | Promise<PluginHookResult> | void

  /**
   * Called before the final render output is generated.
   */
  beforeRender?: (ctx: PluginContext) => PluginHookResult | Promise<PluginHookResult> | void

  /**
   * Called after the final render output is generated.
   */
  afterRender?: (ctx: PluginContext) => PluginHookResult | Promise<PluginHookResult> | void

  /**
   * Called when an error occurs during processing.
   * Can return a recovery template or rethrow the error.
   */
  onError?: (ctx: PluginErrorContext) => PluginHookResult | Promise<PluginHookResult> | void

  // =========================================================================
  // Extension Methods
  // =========================================================================

  /**
   * Register custom directives provided by this plugin.
   * Called during plugin initialization.
   */
  registerDirectives?: () => CustomDirective[]

  /**
   * Register custom expression filters.
   * Called during plugin initialization.
   */
  registerFilters?: () => Record<string, (value: unknown, ...args: unknown[]) => unknown>

  /**
   * Called when the plugin is registered.
   * Use for one-time initialization.
   */
  onRegister?: (options: StxOptions) => void | Promise<void>

  /**
   * Called when the plugin is unregistered.
   * Use for cleanup.
   */
  onUnregister?: () => void | Promise<void>
}

// =============================================================================
// Plugin Manager
// =============================================================================

/**
 * Plugin manager that handles registration, lifecycle, and execution
 */
export class PluginManager {
  private plugins: Map<string, StxPlugin> = new Map()
  private sortedPlugins: StxPlugin[] = []
  private initialized = false

  /**
   * Register a plugin
   */
  async register(plugin: StxPlugin, options: StxOptions): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`)
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin "${plugin.name}" depends on "${dep}" which is not registered`)
        }
      }
    }

    // Register the plugin
    this.plugins.set(plugin.name, plugin)

    // Call onRegister hook
    if (plugin.onRegister) {
      await plugin.onRegister(options)
    }

    // Re-sort plugins by priority
    this.sortPlugins()
  }

  /**
   * Unregister a plugin
   */
  async unregister(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      return false
    }

    // Check if other plugins depend on this one
    for (const [otherName, otherPlugin] of this.plugins) {
      if (otherPlugin.dependencies?.includes(name)) {
        throw new Error(`Cannot unregister "${name}" because "${otherName}" depends on it`)
      }
    }

    // Call onUnregister hook
    if (plugin.onUnregister) {
      await plugin.onUnregister()
    }

    this.plugins.delete(name)
    this.sortPlugins()
    return true
  }

  /**
   * Get a registered plugin by name
   */
  get(name: string): StxPlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * Get all registered plugins (sorted by priority)
   */
  getAll(): StxPlugin[] {
    return [...this.sortedPlugins]
  }

  /**
   * Get all custom directives from all plugins
   */
  getAllDirectives(): CustomDirective[] {
    const directives: CustomDirective[] = []
    for (const plugin of this.sortedPlugins) {
      if (plugin.registerDirectives) {
        directives.push(...plugin.registerDirectives())
      }
    }
    return directives
  }

  /**
   * Get all filters from all plugins
   */
  getAllFilters(): Record<string, (value: unknown, ...args: unknown[]) => unknown> {
    const filters: Record<string, (value: unknown, ...args: unknown[]) => unknown> = {}
    for (const plugin of this.sortedPlugins) {
      if (plugin.registerFilters) {
        Object.assign(filters, plugin.registerFilters())
      }
    }
    return filters
  }

  // =========================================================================
  // Lifecycle Execution
  // =========================================================================

  /**
   * Run beforeProcess hooks on all plugins
   */
  async runBeforeProcess(ctx: PluginContext): Promise<PluginContext> {
    return this.runHooks('beforeProcess', ctx)
  }

  /**
   * Run afterParse hooks on all plugins
   */
  async runAfterParse(ctx: PluginContext): Promise<PluginContext> {
    return this.runHooks('afterParse', ctx)
  }

  /**
   * Run beforeDirective hooks on all plugins
   */
  async runBeforeDirective(phase: DirectivePhase, ctx: PluginContext): Promise<PluginContext> {
    return this.runDirectiveHooks('beforeDirective', phase, ctx)
  }

  /**
   * Run afterDirective hooks on all plugins
   */
  async runAfterDirective(phase: DirectivePhase, ctx: PluginContext): Promise<PluginContext> {
    return this.runDirectiveHooks('afterDirective', phase, ctx)
  }

  /**
   * Run beforeRender hooks on all plugins
   */
  async runBeforeRender(ctx: PluginContext): Promise<PluginContext> {
    return this.runHooks('beforeRender', ctx)
  }

  /**
   * Run afterRender hooks on all plugins
   */
  async runAfterRender(ctx: PluginContext): Promise<PluginContext> {
    return this.runHooks('afterRender', ctx)
  }

  /**
   * Run onError hooks on all plugins
   */
  async runOnError(ctx: PluginErrorContext): Promise<PluginContext | null> {
    for (const plugin of this.sortedPlugins) {
      if (plugin.onError) {
        try {
          const result = await plugin.onError(ctx)
          if (result) {
            // Apply modifications
            if (result.template !== undefined) {
              ctx.template = result.template
            }
            if (result.context) {
              ctx.context = { ...ctx.context, ...result.context }
            }
            if (result.metadata) {
              ctx.metadata = { ...ctx.metadata, ...result.metadata }
            }
            // If plugin handled the error, return the modified context
            if (result.skip) {
              return ctx
            }
          }
        }
        catch (hookError) {
          console.error(`Error in plugin "${plugin.name}" onError hook:`, hookError)
        }
      }
    }
    return null
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private sortPlugins(): void {
    this.sortedPlugins = Array.from(this.plugins.values()).sort(
      (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
    )
  }

  private async runHooks(
    hookName: 'beforeProcess' | 'afterParse' | 'beforeRender' | 'afterRender',
    ctx: PluginContext,
  ): Promise<PluginContext> {
    const currentCtx = { ...ctx }

    for (const plugin of this.sortedPlugins) {
      const hook = plugin[hookName]
      if (hook) {
        try {
          const result = await hook(currentCtx)
          if (result) {
            if (result.template !== undefined) {
              currentCtx.template = result.template
            }
            if (result.context) {
              currentCtx.context = { ...currentCtx.context, ...result.context }
            }
            if (result.metadata) {
              currentCtx.metadata = { ...currentCtx.metadata, ...result.metadata }
            }
            if (result.skip) {
              break
            }
          }
        }
        catch (error) {
          console.error(`Error in plugin "${plugin.name}" ${hookName} hook:`, error)
        }
      }
    }

    return currentCtx
  }

  private async runDirectiveHooks(
    hookName: 'beforeDirective' | 'afterDirective',
    phase: DirectivePhase,
    ctx: PluginContext,
  ): Promise<PluginContext> {
    const currentCtx = { ...ctx }

    for (const plugin of this.sortedPlugins) {
      const hook = plugin[hookName]
      if (hook) {
        try {
          const result = await hook(phase, currentCtx)
          if (result) {
            if (result.template !== undefined) {
              currentCtx.template = result.template
            }
            if (result.context) {
              currentCtx.context = { ...currentCtx.context, ...result.context }
            }
            if (result.metadata) {
              currentCtx.metadata = { ...currentCtx.metadata, ...result.metadata }
            }
            if (result.skip) {
              break
            }
          }
        }
        catch (error) {
          console.error(`Error in plugin "${plugin.name}" ${hookName} hook:`, error)
        }
      }
    }

    return currentCtx
  }
}

// =============================================================================
// Global Plugin Manager Instance
// =============================================================================

/**
 * Global plugin manager instance
 */
export const pluginManager: PluginManager = new PluginManager()

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a plugin with type safety
 */
export function definePlugin(plugin: StxPlugin): StxPlugin {
  return plugin
}

/**
 * Create a simple directive plugin
 */
export function createDirectivePlugin(
  name: string,
  directives: CustomDirective[],
  options: Partial<Omit<StxPlugin, 'name' | 'registerDirectives'>> = {},
): StxPlugin {
  return {
    name,
    ...options,
    registerDirectives: () => directives,
  }
}

/**
 * Create a simple filter plugin
 */
export function createFilterPlugin(
  name: string,
  filters: Record<string, (value: unknown, ...args: unknown[]) => unknown>,
  options: Partial<Omit<StxPlugin, 'name' | 'registerFilters'>> = {},
): StxPlugin {
  return {
    name,
    ...options,
    registerFilters: () => filters,
  }
}

// =============================================================================
// Built-in Plugins
// =============================================================================

/**
 * Debug plugin that logs all lifecycle events
 */
export const debugPlugin: StxPlugin = definePlugin({
  name: 'stx-debug',
  version: '1.0.0',
  description: 'Logs all plugin lifecycle events for debugging',
  priority: 0, // Run first

  beforeProcess(ctx) {
    console.log('[stx-debug] beforeProcess:', ctx.filePath)
  },

  afterParse(ctx) {
    console.log('[stx-debug] afterParse:', ctx.template.length, 'chars')
  },

  beforeDirective(phase, _ctx) {
    console.log('[stx-debug] beforeDirective:', phase)
  },

  afterDirective(phase, _ctx) {
    console.log('[stx-debug] afterDirective:', phase)
  },

  beforeRender(_ctx) {
    console.log('[stx-debug] beforeRender')
  },

  afterRender(ctx) {
    console.log('[stx-debug] afterRender:', ctx.template.length, 'chars')
  },

  onError(ctx) {
    console.error('[stx-debug] onError:', ctx.error.message, 'in phase:', ctx.phase)
  },
})

/**
 * Timing plugin that measures processing time
 */
export const timingPlugin: StxPlugin = definePlugin({
  name: 'stx-timing',
  version: '1.0.0',
  description: 'Measures template processing time',
  priority: 1,

  beforeProcess(ctx) {
    ctx.metadata.startTime = performance.now()
  },

  afterRender(ctx) {
    const startTime = ctx.metadata.startTime as number
    if (startTime) {
      const duration = performance.now() - startTime
      console.log(`[stx-timing] Processing took ${duration.toFixed(2)}ms`)
    }
  },
})

/**
 * Variables plugin that adds common variables to context
 */
export function createVariablesPlugin(
  variables: Record<string, unknown>,
): StxPlugin {
  return definePlugin({
    name: 'stx-variables',
    version: '1.0.0',
    description: 'Adds predefined variables to template context',

    beforeProcess(ctx) {
      return {
        context: { ...ctx.context, ...variables },
      }
    },
  })
}
