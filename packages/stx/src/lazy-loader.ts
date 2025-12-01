/**
 * Lazy Loading for Directive Processors
 *
 * Provides lazy loading capabilities for directive processors to reduce
 * initial load time and memory usage.
 *
 * ## Features
 *
 * - On-demand loading of directive processors
 * - Module caching to prevent re-imports
 * - Support for both sync and async loading
 * - Automatic dependency resolution
 *
 * ## Usage
 *
 * ```typescript
 * const loader = new LazyLoader()
 *
 * // Register lazy directive
 * loader.register('markdown', () => import('./markdown'))
 *
 * // Load when needed
 * const markdown = await loader.load('markdown')
 * ```
 *
 * @module lazy-loader
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Module loader function
 */
export type ModuleLoader<T = unknown> = () => Promise<T> | T

/**
 * Module status
 */
export type ModuleStatus = 'pending' | 'loading' | 'loaded' | 'error'

/**
 * Registered module info
 */
interface ModuleInfo<T> {
  /** Module loader function */
  loader: ModuleLoader<T>
  /** Loading status */
  status: ModuleStatus
  /** Loaded module (if loaded) */
  module?: T
  /** Loading promise (if loading) */
  promise?: Promise<T>
  /** Error (if failed) */
  error?: Error
  /** Dependencies */
  dependencies?: string[]
  /** Load count (for analytics) */
  loadCount: number
  /** Load time in ms */
  loadTime?: number
}

/**
 * Lazy loader options
 */
export interface LazyLoaderOptions {
  /** Enable preloading of common modules */
  preload?: string[]
  /** Timeout for module loading (ms) */
  timeout?: number
  /** Enable debug logging */
  debug?: boolean
  /** Error handler */
  onError?: (name: string, error: Error) => void
}

// =============================================================================
// Lazy Loader
// =============================================================================

/**
 * Lazy loader for directive processors
 */
export class LazyLoader<T = unknown> {
  private modules: Map<string, ModuleInfo<T>> = new Map()
  private options: LazyLoaderOptions

  constructor(options: LazyLoaderOptions = {}) {
    this.options = {
      timeout: 10000,
      debug: false,
      ...options,
    }
  }

  /**
   * Register a module for lazy loading
   */
  register(
    name: string,
    loader: ModuleLoader<T>,
    dependencies?: string[],
  ): void {
    this.modules.set(name, {
      loader,
      status: 'pending',
      dependencies,
      loadCount: 0,
    })

    if (this.options.debug) {
      console.log(`[LazyLoader] Registered: ${name}`)
    }
  }

  /**
   * Register multiple modules at once
   */
  registerAll(modules: Record<string, ModuleLoader<T>>): void {
    for (const [name, loader] of Object.entries(modules)) {
      this.register(name, loader)
    }
  }

  /**
   * Check if a module is registered
   */
  has(name: string): boolean {
    return this.modules.has(name)
  }

  /**
   * Get module status
   */
  getStatus(name: string): ModuleStatus | null {
    return this.modules.get(name)?.status ?? null
  }

  /**
   * Check if a module is loaded
   */
  isLoaded(name: string): boolean {
    return this.getStatus(name) === 'loaded'
  }

  /**
   * Load a module
   */
  async load(name: string): Promise<T> {
    const info = this.modules.get(name)

    if (!info) {
      throw new Error(`Module "${name}" is not registered`)
    }

    // Return cached module
    if (info.status === 'loaded' && info.module !== undefined) {
      info.loadCount++
      return info.module
    }

    // Wait for ongoing load
    if (info.status === 'loading' && info.promise) {
      return info.promise
    }

    // Re-throw previous error
    if (info.status === 'error' && info.error) {
      throw info.error
    }

    // Load dependencies first
    if (info.dependencies) {
      await this.loadAll(info.dependencies)
    }

    // Start loading
    info.status = 'loading'
    const startTime = performance.now()

    info.promise = this.loadWithTimeout(name, info.loader)
      .then((module) => {
        info.module = module
        info.status = 'loaded'
        info.loadCount++
        info.loadTime = performance.now() - startTime

        if (this.options.debug) {
          console.log(`[LazyLoader] Loaded: ${name} (${info.loadTime.toFixed(2)}ms)`)
        }

        return module
      })
      .catch((error) => {
        info.status = 'error'
        info.error = error

        if (this.options.onError) {
          this.options.onError(name, error)
        }

        if (this.options.debug) {
          console.error(`[LazyLoader] Error loading ${name}:`, error)
        }

        throw error
      })

    return info.promise
  }

  /**
   * Load multiple modules
   */
  async loadAll(names: string[]): Promise<T[]> {
    return Promise.all(names.map(name => this.load(name)))
  }

  /**
   * Load a module synchronously (must be already loaded)
   */
  loadSync(name: string): T {
    const info = this.modules.get(name)

    if (!info) {
      throw new Error(`Module "${name}" is not registered`)
    }

    if (info.status !== 'loaded' || info.module === undefined) {
      throw new Error(`Module "${name}" is not loaded. Use async load() first.`)
    }

    info.loadCount++
    return info.module
  }

  /**
   * Preload modules in the background
   */
  preload(names: string[]): Promise<void> {
    return Promise.all(
      names.map(name => this.load(name).catch(() => { /* ignore preload errors */ })),
    ).then(() => { /* void return */ })
  }

  /**
   * Unload a module (free memory)
   */
  unload(name: string): boolean {
    const info = this.modules.get(name)
    if (!info) {
      return false
    }

    info.status = 'pending'
    info.module = undefined
    info.promise = undefined
    info.error = undefined

    if (this.options.debug) {
      console.log(`[LazyLoader] Unloaded: ${name}`)
    }

    return true
  }

  /**
   * Unload all modules
   */
  unloadAll(): void {
    for (const name of this.modules.keys()) {
      this.unload(name)
    }
  }

  /**
   * Get statistics about loaded modules
   */
  getStats(): {
    registered: number
    loaded: number
    pending: number
    errors: number
    totalLoadTime: number
    modules: Array<{
      name: string
      status: ModuleStatus
      loadCount: number
      loadTime?: number
    }>
  } {
    let loaded = 0
    let pending = 0
    let errors = 0
    let totalLoadTime = 0
    const modules: Array<{
      name: string
      status: ModuleStatus
      loadCount: number
      loadTime?: number
    }> = []

    for (const [name, info] of this.modules) {
      switch (info.status) {
        case 'loaded':
          loaded++
          break
        case 'pending':
          pending++
          break
        case 'error':
          errors++
          break
      }

      if (info.loadTime) {
        totalLoadTime += info.loadTime
      }

      modules.push({
        name,
        status: info.status,
        loadCount: info.loadCount,
        loadTime: info.loadTime,
      })
    }

    return {
      registered: this.modules.size,
      loaded,
      pending,
      errors,
      totalLoadTime,
      modules,
    }
  }

  private async loadWithTimeout(name: string, loader: ModuleLoader<T>): Promise<T> {
    const timeout = this.options.timeout || 10000

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Module "${name}" loading timed out after ${timeout}ms`))
      }, timeout)

      Promise.resolve(loader())
        .then((module) => {
          clearTimeout(timer)
          resolve(module)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }
}

// =============================================================================
// Directive Lazy Loader
// =============================================================================

/**
 * Directive processor interface
 */
export interface DirectiveProcessor {
  /** Process directive content */
  process: (content: string, params?: string, context?: Record<string, unknown>) => string | Promise<string>
  /** Directive name */
  name?: string
  /** Whether directive has an end tag */
  hasEndTag?: boolean
}

/**
 * Lazy loader specifically for directive processors
 */
export class DirectiveLoaderRegistry {
  private loader: LazyLoader<DirectiveProcessor | { default: DirectiveProcessor }>
  private directiveMap: Map<string, string> = new Map()

  constructor(options: LazyLoaderOptions = {}) {
    this.loader = new LazyLoader(options)
  }

  /**
   * Register a directive with its module loader
   */
  registerDirective(
    directiveName: string,
    moduleName: string,
    loader: ModuleLoader<DirectiveProcessor | { default: DirectiveProcessor }>,
  ): void {
    this.directiveMap.set(directiveName, moduleName)
    if (!this.loader.has(moduleName)) {
      this.loader.register(moduleName, loader)
    }
  }

  /**
   * Get a directive processor
   */
  async getProcessor(directiveName: string): Promise<DirectiveProcessor | null> {
    const moduleName = this.directiveMap.get(directiveName)
    if (!moduleName) {
      return null
    }

    const module = await this.loader.load(moduleName)

    // Handle both default export and direct export
    if ('default' in module && module.default) {
      return module.default
    }
    return module as DirectiveProcessor
  }

  /**
   * Check if a directive is registered
   */
  hasDirective(directiveName: string): boolean {
    return this.directiveMap.has(directiveName)
  }

  /**
   * Get all registered directive names
   */
  getDirectiveNames(): string[] {
    return Array.from(this.directiveMap.keys())
  }

  /**
   * Preload directives
   */
  async preloadDirectives(directiveNames: string[]): Promise<void> {
    const moduleNames = directiveNames
      .map(name => this.directiveMap.get(name))
      .filter((name): name is string => name !== undefined)

    await this.loader.preload([...new Set(moduleNames)])
  }
}

// =============================================================================
// Default Directive Registry
// =============================================================================

/**
 * Default lazy-loaded directive registry
 */
export function createDirectiveRegistry(): DirectiveLoaderRegistry {
  const registry = new DirectiveLoaderRegistry()

  // Register core directives with lazy loading
  // These would be loaded on-demand when first used

  registry.registerDirective('markdown', 'markdown', () =>
    import('./markdown').then(m => ({
      process: m.processMarkdown,
      name: 'markdown',
      hasEndTag: true,
    })))

  registry.registerDirective('translate', 'i18n', () =>
    import('./i18n').then(m => ({
      process: (content, params, ctx) => {
        const key = params || content.trim()
        return m.getTranslation(key, ctx as Record<string, unknown>)
      },
      name: 'translate',
      hasEndTag: false,
    })))

  registry.registerDirective('a11y', 'a11y', () =>
    import('./a11y').then(m => ({
      process: (content) => {
        const result = m.checkA11y(content)
        // In debug mode, could add comments about issues
        return content + (result.issues.length > 0 ? `<!-- A11y: ${result.issues.length} issues -->` : '')
      },
      name: 'a11y',
      hasEndTag: true,
    })))

  return registry
}

// =============================================================================
// Global Instances
// =============================================================================

/**
 * Global lazy loader instance
 */
export const globalLoader = new LazyLoader()

/**
 * Global directive registry
 */
export const directiveRegistry = createDirectiveRegistry()

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a lazy module that loads on first access
 */
export function createLazyModule<T>(loader: ModuleLoader<T>): {
  get: () => Promise<T>
  isLoaded: () => boolean
  preload: () => Promise<void>
} {
  let module: T | undefined
  let loading: Promise<T> | undefined
  let loaded = false

  return {
    async get() {
      if (loaded && module !== undefined) {
        return module
      }

      if (loading) {
        return loading
      }

      loading = Promise.resolve(loader()).then((m) => {
        module = m
        loaded = true
        return m
      })

      return loading
    },

    isLoaded() {
      return loaded
    },

    async preload() {
      await this.get()
    },
  }
}

/**
 * Batch load multiple modules with progress callback
 */
export async function batchLoad<T>(
  loader: LazyLoader<T>,
  names: string[],
  onProgress?: (loaded: number, total: number, name: string) => void,
): Promise<Map<string, T>> {
  const results = new Map<string, T>()
  const total = names.length

  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    try {
      const module = await loader.load(name)
      results.set(name, module)
    }
    catch {
      // Continue loading other modules
    }

    if (onProgress) {
      onProgress(i + 1, total, name)
    }
  }

  return results
}
