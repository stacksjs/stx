/**
 * KeepAlive utilities for @stacksjs/components
 *
 * Provides component caching and state preservation with LRU (Least Recently Used)
 * cache strategy for optimizing component lifecycle management
 *
 * @example
 * ```ts
 * import { createKeepAlive } from '@stacksjs/components'
 *
 * // Create KeepAlive manager with max 10 components
 * const keepAlive = createKeepAlive({ max: 10 })
 *
 * // Cache component
 * const cached = keepAlive.cache('my-component', componentInstance, {
 *   state: { count: 0 },
 *   onActivate: (comp) => console.log('Component activated'),
 *   onDeactivate: (comp) => console.log('Component deactivated'),
 * })
 *
 * // Retrieve cached component
 * const instance = keepAlive.get('my-component')
 *
 * // Prune least recently used
 * keepAlive.prune()
 * ```
 */

/**
 * Component instance interface
 */
export interface ComponentInstance {
  /** Component ID */
  id: string
  /** Component type/name */
  type: string
  /** DOM element */
  element?: HTMLElement
  /** Component state */
  state?: Record<string, any>
  /** Custom component data */
  data?: Record<string, any>
  /** Lifecycle hooks */
  hooks?: ComponentHooks
  /** Timestamp when created */
  createdAt: number
  /** Timestamp when last accessed */
  lastAccessedAt: number
}

/**
 * Component lifecycle hooks
 */
export interface ComponentHooks {
  /** Called when component is mounted */
  onMount?: (instance: ComponentInstance) => void
  /** Called before component is unmounted */
  onUnmount?: (instance: ComponentInstance) => void
  /** Called when component is activated from cache */
  onActivate?: (instance: ComponentInstance) => void
  /** Called when component is deactivated to cache */
  onDeactivate?: (instance: ComponentInstance) => void
  /** Called when component state is restored */
  onRestore?: (instance: ComponentInstance, state: Record<string, any>) => void
  /** Called when component state is saved */
  onSave?: (instance: ComponentInstance) => Record<string, any>
}

/**
 * KeepAlive cache options
 */
export interface KeepAliveOptions {
  /** Maximum number of cached components (LRU eviction when exceeded) */
  max?: number
  /** Time to live for cached components in milliseconds (0 = no expiry) */
  ttl?: number
  /** Include/exclude patterns for component types */
  include?: RegExp | string[]
  /** Exclude patterns for component types */
  exclude?: RegExp | string[]
  /** Global hooks for all cached components */
  hooks?: ComponentHooks
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  /** Component instance */
  instance: ComponentInstance
  /** Access count */
  accessCount: number
  /** Creation timestamp */
  createdAt: number
  /** Last access timestamp */
  lastAccessedAt: number
  /** Expiry timestamp (if TTL set) */
  expiresAt?: number
}

/**
 * KeepAlive cache statistics
 */
export interface CacheStats {
  /** Total cache hits */
  hits: number
  /** Total cache misses */
  misses: number
  /** Current cache size */
  size: number
  /** Maximum cache size */
  max: number
  /** Hit rate (0-1) */
  hitRate: number
  /** Cache keys */
  keys: string[]
}

/**
 * KeepAlive manager interface
 */
export interface KeepAlive {
  /** Cache a component instance */
  cache: (key: string, instance: ComponentInstance, hooks?: ComponentHooks) => ComponentInstance
  /** Get cached component instance */
  get: (key: string) => ComponentInstance | null
  /** Check if key exists in cache */
  has: (key: string) => boolean
  /** Remove component from cache */
  remove: (key: string) => boolean
  /** Clear all cached components */
  clear: () => void
  /** Prune expired or least recently used components */
  prune: () => number
  /** Activate cached component */
  activate: (key: string) => ComponentInstance | null
  /** Deactivate component to cache */
  deactivate: (key: string) => boolean
  /** Get cache statistics */
  getStats: () => CacheStats
  /** Get all cached keys */
  keys: () => string[]
  /** Get cache size */
  size: () => number
}

/**
 * Create a KeepAlive manager
 *
 * Implements LRU (Least Recently Used) cache strategy for component instances
 *
 * @param options - KeepAlive configuration options
 * @returns KeepAlive manager instance
 *
 * @example
 * ```ts
 * const keepAlive = createKeepAlive({
 *   max: 10,
 *   ttl: 5 * 60 * 1000, // 5 minutes
 *   include: ['user-profile', 'dashboard'],
 *   hooks: {
 *     onActivate: (comp) => console.log(`Activated: ${comp.id}`),
 *     onDeactivate: (comp) => console.log(`Deactivated: ${comp.id}`),
 *   },
 * })
 * ```
 */
export function createKeepAlive(options: KeepAliveOptions = {}): KeepAlive {
  const {
    max = 10,
    ttl = 0,
    include,
    exclude,
    hooks: globalHooks,
    debug = false,
  } = options

  // Cache storage (Map maintains insertion order for LRU)
  const cache = new Map<string, CacheEntry>()

  // Statistics
  let hits = 0
  let misses = 0

  /**
   * Log debug message
   */
  function log(...args: any[]): void {
    if (debug) {
      console.log('[KeepAlive]', ...args)
    }
  }

  /**
   * Check if component type should be cached
   */
  function shouldCache(type: string): boolean {
    // Check exclude patterns first
    if (exclude) {
      if (exclude instanceof RegExp && exclude.test(type)) {
        return false
      }
      if (Array.isArray(exclude) && exclude.includes(type)) {
        return false
      }
    }

    // Check include patterns
    if (include) {
      if (include instanceof RegExp && !include.test(type)) {
        return false
      }
      if (Array.isArray(include) && !include.includes(type)) {
        return false
      }
    }

    return true
  }

  /**
   * Check if cache entry is expired
   */
  function isExpired(entry: CacheEntry): boolean {
    if (!ttl || !entry.expiresAt) {
      return false
    }
    return Date.now() > entry.expiresAt
  }

  /**
   * Update entry access time (for LRU)
   */
  function touch(key: string): void {
    const entry = cache.get(key)
    if (entry) {
      entry.lastAccessedAt = Date.now()
      entry.accessCount++
      entry.instance.lastAccessedAt = entry.lastAccessedAt

      // Move to end (most recently used)
      cache.delete(key)
      cache.set(key, entry)

      log(`Touched: ${key} (access count: ${entry.accessCount})`)
    }
  }

  /**
   * Evict least recently used entry
   */
  function evictLRU(): boolean {
    if (cache.size === 0) {
      return false
    }

    // First entry is least recently used (Map maintains insertion order)
    const firstKey = cache.keys().next().value
    const entry = cache.get(firstKey)

    if (entry) {
      log(`Evicting LRU: ${firstKey}`)

      // Call deactivate hook
      const hooks = entry.instance.hooks
      if (hooks?.onDeactivate) {
        hooks.onDeactivate(entry.instance)
      }
      if (globalHooks?.onDeactivate) {
        globalHooks.onDeactivate(entry.instance)
      }

      cache.delete(firstKey)
      return true
    }

    return false
  }

  /**
   * Cache a component instance
   */
  function cacheComponent(
    key: string,
    instance: ComponentInstance,
    hooks?: ComponentHooks,
  ): ComponentInstance {
    // Check if type should be cached
    if (!shouldCache(instance.type)) {
      log(`Type not cacheable: ${instance.type}`)
      return instance
    }

    // Check cache size limit
    if (cache.size >= max) {
      evictLRU()
    }

    const now = Date.now()

    // Create cache entry
    const entry: CacheEntry = {
      instance: {
        ...instance,
        hooks: hooks || instance.hooks,
        createdAt: instance.createdAt || now,
        lastAccessedAt: now,
      },
      accessCount: 0,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: ttl ? now + ttl : undefined,
    }

    cache.set(key, entry)

    log(`Cached: ${key} (size: ${cache.size}/${max})`)

    // Call cache hook
    if (hooks?.onMount) {
      hooks.onMount(entry.instance)
    }
    if (globalHooks?.onMount) {
      globalHooks.onMount(entry.instance)
    }

    return entry.instance
  }

  /**
   * Get cached component instance
   */
  function get(key: string): ComponentInstance | null {
    const entry = cache.get(key)

    if (!entry) {
      misses++
      log(`Miss: ${key}`)
      return null
    }

    // Check expiry
    if (isExpired(entry)) {
      log(`Expired: ${key}`)
      cache.delete(key)
      misses++
      return null
    }

    hits++
    touch(key)
    log(`Hit: ${key}`)

    return entry.instance
  }

  /**
   * Check if key exists in cache
   */
  function has(key: string): boolean {
    const entry = cache.get(key)
    if (!entry) {
      return false
    }
    if (isExpired(entry)) {
      cache.delete(key)
      return false
    }
    return true
  }

  /**
   * Remove component from cache
   */
  function remove(key: string): boolean {
    const entry = cache.get(key)

    if (!entry) {
      return false
    }

    log(`Removing: ${key}`)

    // Call unmount hook
    const hooks = entry.instance.hooks
    if (hooks?.onUnmount) {
      hooks.onUnmount(entry.instance)
    }
    if (globalHooks?.onUnmount) {
      globalHooks.onUnmount(entry.instance)
    }

    return cache.delete(key)
  }

  /**
   * Clear all cached components
   */
  function clear(): void {
    log('Clearing cache')

    // Call unmount hooks for all entries
    cache.forEach((entry) => {
      const hooks = entry.instance.hooks
      if (hooks?.onUnmount) {
        hooks.onUnmount(entry.instance)
      }
      if (globalHooks?.onUnmount) {
        globalHooks.onUnmount(entry.instance)
      }
    })

    cache.clear()
    hits = 0
    misses = 0
  }

  /**
   * Prune expired or excess entries
   */
  function prune(): number {
    let pruned = 0

    // Remove expired entries
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (isExpired(entry)) {
        log(`Pruning expired: ${key}`)
        remove(key)
        pruned++
      }
    }

    // Evict excess entries (LRU)
    while (cache.size > max) {
      if (evictLRU()) {
        pruned++
      }
      else {
        break
      }
    }

    if (pruned > 0) {
      log(`Pruned ${pruned} entries`)
    }

    return pruned
  }

  /**
   * Activate cached component
   */
  function activate(key: string): ComponentInstance | null {
    const instance = get(key)

    if (!instance) {
      return null
    }

    log(`Activating: ${key}`)

    // Call activate hook
    const hooks = instance.hooks
    if (hooks?.onActivate) {
      hooks.onActivate(instance)
    }
    if (globalHooks?.onActivate) {
      globalHooks.onActivate(instance)
    }

    // Restore state if saved
    if (instance.state && hooks?.onRestore) {
      hooks.onRestore(instance, instance.state)
    }

    return instance
  }

  /**
   * Deactivate component to cache
   */
  function deactivate(key: string): boolean {
    const entry = cache.get(key)

    if (!entry) {
      return false
    }

    log(`Deactivating: ${key}`)

    const instance = entry.instance
    const hooks = instance.hooks

    // Save state
    if (hooks?.onSave) {
      instance.state = hooks.onSave(instance)
    }

    // Call deactivate hook
    if (hooks?.onDeactivate) {
      hooks.onDeactivate(instance)
    }
    if (globalHooks?.onDeactivate) {
      globalHooks.onDeactivate(instance)
    }

    return true
  }

  /**
   * Get cache statistics
   */
  function getStats(): CacheStats {
    const total = hits + misses
    return {
      hits,
      misses,
      size: cache.size,
      max,
      hitRate: total > 0 ? hits / total : 0,
      keys: Array.from(cache.keys()),
    }
  }

  /**
   * Get all cached keys
   */
  function keys(): string[] {
    return Array.from(cache.keys())
  }

  /**
   * Get cache size
   */
  function size(): number {
    return cache.size
  }

  // Return KeepAlive manager
  return {
    cache: cacheComponent,
    get,
    has,
    remove,
    clear,
    prune,
    activate,
    deactivate,
    getStats,
    keys,
    size,
  }
}

/**
 * Create a simple LRU cache (without component-specific features)
 *
 * Generic LRU cache implementation for any type of data
 *
 * @param maxSize - Maximum number of items to cache
 * @returns LRU cache instance
 *
 * @example
 * ```ts
 * const cache = createLRUCache<string>(100)
 *
 * cache.set('key1', 'value1')
 * const value = cache.get('key1') // 'value1'
 * cache.has('key1') // true
 * ```
 */
export function createLRUCache<T = any>(maxSize: number) {
  const cache = new Map<string, T>()

  return {
    /**
     * Set a value in cache
     */
    set(key: string, value: T): void {
      // Delete and re-add to move to end
      if (cache.has(key)) {
        cache.delete(key)
      }

      cache.set(key, value)

      // Evict oldest if over max size
      if (cache.size > maxSize) {
        const firstKey = cache.keys().next().value
        cache.delete(firstKey)
      }
    },

    /**
     * Get a value from cache
     */
    get(key: string): T | undefined {
      if (!cache.has(key)) {
        return undefined
      }

      const value = cache.get(key)!

      // Move to end (most recently used)
      cache.delete(key)
      cache.set(key, value)

      return value
    },

    /**
     * Check if key exists
     */
    has(key: string): boolean {
      return cache.has(key)
    },

    /**
     * Delete a key
     */
    delete(key: string): boolean {
      return cache.delete(key)
    },

    /**
     * Clear all entries
     */
    clear(): void {
      cache.clear()
    },

    /**
     * Get cache size
     */
    get size(): number {
      return cache.size
    },

    /**
     * Get all keys
     */
    keys(): string[] {
      return Array.from(cache.keys())
    },

    /**
     * Get all values
     */
    values(): T[] {
      return Array.from(cache.values())
    },

    /**
     * Iterate over entries
     */
    forEach(callback: (value: T, key: string) => void): void {
      cache.forEach(callback)
    },
  }
}

/**
 * State manager for component state preservation
 *
 * Manages component state with automatic serialization/deserialization
 *
 * @example
 * ```ts
 * const stateManager = createStateManager()
 *
 * // Save state
 * stateManager.save('my-component', { count: 5 })
 *
 * // Restore state
 * const state = stateManager.restore('my-component')
 * console.log(state.count) // 5
 * ```
 */
export function createStateManager() {
  const states = new Map<string, Record<string, any>>()

  return {
    /**
     * Save component state
     */
    save(key: string, state: Record<string, any>): void {
      // Deep clone to avoid mutations
      states.set(key, JSON.parse(JSON.stringify(state)))
    },

    /**
     * Restore component state
     */
    restore(key: string): Record<string, any> | null {
      const state = states.get(key)
      return state ? JSON.parse(JSON.stringify(state)) : null
    },

    /**
     * Check if state exists
     */
    has(key: string): boolean {
      return states.has(key)
    },

    /**
     * Remove saved state
     */
    remove(key: string): boolean {
      return states.delete(key)
    },

    /**
     * Clear all saved states
     */
    clear(): void {
      states.clear()
    },

    /**
     * Get all state keys
     */
    keys(): string[] {
      return Array.from(states.keys())
    },

    /**
     * Get number of saved states
     */
    get size(): number {
      return states.size
    },
  }
}

/**
 * Create a component pool for object reuse
 *
 * Useful for frequently created/destroyed components to reduce GC pressure
 *
 * @param factory - Function to create new instances
 * @param options - Pool configuration
 * @returns Component pool
 *
 * @example
 * ```ts
 * const pool = createComponentPool(
 *   () => ({ id: '', type: '', state: {} }),
 *   { maxSize: 50 }
 * )
 *
 * const instance = pool.acquire()
 * // Use instance...
 * pool.release(instance)
 * ```
 */
export function createComponentPool<T>(
  factory: () => T,
  options: { maxSize?: number, reset?: (instance: T) => void } = {},
) {
  const { maxSize = 100, reset } = options
  const pool: T[] = []

  return {
    /**
     * Acquire instance from pool
     */
    acquire(): T {
      if (pool.length > 0) {
        return pool.pop()!
      }
      return factory()
    },

    /**
     * Release instance back to pool
     */
    release(instance: T): void {
      if (pool.length < maxSize) {
        if (reset) {
          reset(instance)
        }
        pool.push(instance)
      }
    },

    /**
     * Clear the pool
     */
    clear(): void {
      pool.length = 0
    },

    /**
     * Get pool size
     */
    get size(): number {
      return pool.length
    },

    /**
     * Get max pool size
     */
    get maxSize(): number {
      return maxSize
    },
  }
}
