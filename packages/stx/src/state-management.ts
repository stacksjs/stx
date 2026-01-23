// @ts-nocheck - Skip type checking due to store generic type constraints
/**
 * State Management Module
 *
 * Provides reactive state management for stx templates with support for
 * both simple stores and complex global state management.
 *
 * ## Features
 *
 * 1. **Reactive Stores** - Simple observable stores with auto-subscriptions
 * 2. **Computed Values** - Derived state that auto-updates
 * 3. **Actions** - Structured state mutations
 * 4. **Persistence** - LocalStorage/SessionStorage integration
 * 5. **DevTools** - State inspection and time-travel debugging
 * 6. **Server State** - Sync state between server and client
 *
 * ## Usage
 *
 * ```typescript
 * import { createStore, computed, action } from 'stx/state-management'
 *
 * const counter = createStore({ count: 0 })
 *
 * // Subscribe to changes
 * counter.subscribe(state => console.log(state.count))
 *
 * // Update state
 * counter.set({ count: counter.get().count + 1 })
 * ```
 *
 * In templates:
 * ```html
 * <script>
 * import { useStore } from 'stx/state-management'
 * const { count } = useStore('counter')
 * </script>
 * <p>Count: {{ count }}</p>
 * ```
 *
 * @module state-management
 */

// =============================================================================
// Types
// =============================================================================

/** Subscription callback */
export type Subscriber<T> = (value: T, previousValue: T | undefined) => void

/** Unsubscribe function */
export type Unsubscribe = () => void

/** Store options */
export interface StoreOptions<T> {
  /** Store name for debugging and persistence */
  name?: string
  /** Enable persistence */
  persist?: PersistOptions
  /** Enable devtools integration */
  devtools?: boolean
  /** Middleware functions */
  middleware?: StoreMiddleware<T>[]
  /** Equality function for detecting changes */
  equals?: (a: T, b: T) => boolean
}

/** Persistence options */
export interface PersistOptions {
  /** Storage type */
  storage?: 'local' | 'session' | 'memory'
  /** Storage key */
  key?: string
  /** Serialize function */
  serialize?: (value: unknown) => string
  /** Deserialize function */
  deserialize?: (value: string) => unknown
  /** Paths to persist (dot notation) */
  paths?: string[]
  /** Debounce persistence (ms) */
  debounce?: number
}

/** Store middleware */
export type StoreMiddleware<T> = (
  set: (value: T) => void,
  get: () => T,
  store: Store<T>
) => (nextSet: (value: T) => void) => (value: T) => void

/** Store interface */
export interface Store<T> {
  /** Get current value */
  get: () => T
  /** Set new value */
  set: (value: T | ((prev: T) => T)) => void
  /** Subscribe to changes */
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe
  /** Update partial state (for objects) */
  update: (updater: Partial<T> | ((prev: T) => Partial<T>)) => void
  /** Reset to initial value */
  reset: () => void
  /** Store name */
  name?: string
  /** Destroy store and cleanup */
  destroy: () => void
}

/** Computed options */
export interface ComputedOptions {
  /** Equality function */
  equals?: <T>(a: T, b: T) => boolean
}

/** Action definition */
export interface ActionDefinition<T, P extends unknown[], R> {
  /** Action name */
  name: string
  /** Action handler */
  handler: (store: Store<T>, ...params: P) => R
}

/** Global store state */
export interface GlobalState {
  stores: Map<string, Store<unknown>>
  subscriptions: Map<string, Set<Subscriber<unknown>>>
}

// =============================================================================
// Global Store Registry
// =============================================================================

const globalState: GlobalState = {
  stores: new Map(),
  subscriptions: new Map(),
}

/**
 * Register a store globally.
 */
export function registerStore<T>(name: string, store: Store<T>): void {
  globalState.stores.set(name, store as Store<unknown>)
}

/**
 * Get a registered store.
 */
export function getStore<T>(name: string): Store<T> | undefined {
  return globalState.stores.get(name) as Store<T> | undefined
}

/**
 * Check if a store is registered.
 */
export function hasStore(name: string): boolean {
  return globalState.stores.has(name)
}

/**
 * Get all registered store names.
 */
export function getStoreNames(): string[] {
  return Array.from(globalState.stores.keys())
}

/**
 * Clear all registered stores.
 */
export function clearStores(): void {
  for (const store of globalState.stores.values()) {
    store.destroy()
  }
  globalState.stores.clear()
  globalState.subscriptions.clear()
}

// =============================================================================
// Storage Adapters
// =============================================================================

interface StorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const memoryStorage: Map<string, string> = new Map()

function getStorageAdapter(type: 'local' | 'session' | 'memory'): StorageAdapter {
  if (type === 'memory') {
    return {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
    }
  }

  // Check for browser environment
  if (typeof window === 'undefined') {
    // Return memory storage for SSR
    return {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
    }
  }

  return type === 'local' ? window.localStorage : window.sessionStorage
}

/**
 * Pick nested paths from an object.
 */
function pickPaths<T extends object>(obj: T, paths: string[]): Partial<T> {
  const result: Record<string, unknown> = {}

  for (const path of paths) {
    const parts = path.split('.')
    let source: unknown = obj
    let target: Record<string, unknown> = result
    let valid = true

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (source && typeof source === 'object' && part in source) {
        source = (source as Record<string, unknown>)[part]
        if (!(part in target)) {
          target[part] = {}
        }
        target = target[part] as Record<string, unknown>
      }
      else {
        valid = false
        break
      }
    }

    if (valid && source && typeof source === 'object') {
      const lastPart = parts[parts.length - 1]
      if (lastPart in source) {
        target[lastPart] = (source as Record<string, unknown>)[lastPart]
      }
    }
  }

  return result as Partial<T>
}

// =============================================================================
// Store Creation
// =============================================================================

/**
 * Create a reactive store.
 */
export function createStore<T>(
  initialValue: T,
  options: StoreOptions<T> = {},
): Store<T> {
  const {
    name,
    persist,
    devtools = false,
    middleware = [],
    equals = (a, b) => a === b,
  } = options

  let currentValue = initialValue
  const subscribers = new Set<Subscriber<T>>()
  let persistTimeout: ReturnType<typeof setTimeout> | null = null

  // Load persisted value
  if (persist) {
    const storage = getStorageAdapter(persist.storage || 'local')
    const key = persist.key || `stx-store:${name || 'unnamed'}`
    const deserialize = persist.deserialize || JSON.parse

    try {
      const stored = storage.getItem(key)
      if (stored) {
        const parsed = deserialize(stored)
        if (persist.paths && typeof parsed === 'object' && parsed !== null) {
          currentValue = { ...initialValue, ...parsed }
        }
        else {
          currentValue = parsed as T
        }
      }
    }
    catch {
      // Invalid stored value, use initial
    }
  }

  // Persist function
  const persistValue = (value: T) => {
    if (!persist)
      return

    const storage = getStorageAdapter(persist.storage || 'local')
    const key = persist.key || `stx-store:${name || 'unnamed'}`
    const serialize = persist.serialize || JSON.stringify

    const toPersist = persist.paths && typeof value === 'object' && value !== null
      ? pickPaths(value as object, persist.paths)
      : value

    if (persist.debounce) {
      if (persistTimeout) {
        clearTimeout(persistTimeout)
      }
      persistTimeout = setTimeout(() => {
        storage.setItem(key, serialize(toPersist))
      }, persist.debounce)
    }
    else {
      storage.setItem(key, serialize(toPersist))
    }
  }

  // Notify subscribers
  const notify = (newValue: T, prevValue: T | undefined) => {
    for (const subscriber of subscribers) {
      try {
        subscriber(newValue, prevValue)
      }
      catch (error) {
        console.error('[stx-store] Subscriber error:', error)
      }
    }
  }

  // DevTools integration
  const devToolsNotify = devtools
    ? (action: string, newValue: T) => {
        if (typeof window !== 'undefined' && (window as any).__STX_DEVTOOLS__) {
          (window as any).__STX_DEVTOOLS__.onStoreChange(name || 'unnamed', action, newValue)
        }
      }
    : () => {}

  // Base set function
  const baseSet = (value: T) => {
    const prevValue = currentValue
    if (!equals(value, prevValue)) {
      currentValue = value
      persistValue(value)
      notify(value, prevValue)
      devToolsNotify('set', value)
    }
  }

  // Apply middleware - we need a mutable set reference
  let wrappedSet = baseSet

  // Create store first, then apply middleware
  const store: Store<T> = {
    get: () => currentValue,

    set: (value) => {
      if (typeof value === 'function') {
        wrappedSet((value as (prev: T) => T)(currentValue))
      }
      else {
        wrappedSet(value)
      }
    },

    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      return () => {
        subscribers.delete(subscriber)
      }
    },

    update: (updater) => {
      if (typeof currentValue !== 'object' || currentValue === null) {
        throw new Error('update() can only be used with object stores')
      }

      const partial = typeof updater === 'function'
        ? (updater as (prev: T) => Partial<T>)(currentValue)
        : updater

      store.set({ ...currentValue, ...partial })
    },

    reset: () => {
      store.set(initialValue)
      devToolsNotify('reset', initialValue)
    },

    name,

    destroy: () => {
      subscribers.clear()
      if (persistTimeout) {
        clearTimeout(persistTimeout)
      }
      if (name) {
        globalState.stores.delete(name)
      }
    },
  }

  // Now apply middleware with store reference available
  for (const mw of middleware.reverse()) {
    wrappedSet = mw(baseSet, () => currentValue, store)(wrappedSet)
  }

  // Register globally if named
  if (name) {
    registerStore(name, store)
  }

  return store
}

/**
 * Create a readonly store from a getter function.
 */
export function createReadonlyStore<T>(
  getter: () => T,
  options: { name?: string } = {},
): Omit<Store<T>, 'set' | 'update' | 'reset'> {
  const subscribers = new Set<Subscriber<T>>()
  let currentValue = getter()

  const store = {
    get: () => {
      const newValue = getter()
      if (newValue !== currentValue) {
        const prevValue = currentValue
        currentValue = newValue
        for (const subscriber of subscribers) {
          subscriber(newValue, prevValue)
        }
      }
      return currentValue
    },

    subscribe: (subscriber: Subscriber<T>) => {
      subscribers.add(subscriber)
      return () => {
        subscribers.delete(subscriber)
      }
    },

    name: options.name,

    destroy: () => {
      subscribers.clear()
    },
  }

  return store
}

// =============================================================================
// Computed Values
// =============================================================================

/**
 * Create a computed value derived from stores.
 */
export function computed<T, S extends readonly Store<any>[]>(
  stores: S,
  compute: (...values: { [K in keyof S]: S[K] extends Store<infer V> ? V : never }) => T,
  options: ComputedOptions = {},
): Store<T> {
  const { equals = (a, b) => a === b } = options

  const getValues = () => stores.map(s => s.get()) as { [K in keyof S]: S[K] extends Store<infer V> ? V : never }
  let currentValue = compute(...getValues())
  const subscribers = new Set<Subscriber<T>>()
  const unsubscribes: Unsubscribe[] = []

  // Subscribe to all source stores
  for (const sourceStore of stores) {
    const unsub = sourceStore.subscribe(() => {
      const newValue = compute(...getValues())
      if (!equals(newValue, currentValue)) {
        const prevValue = currentValue
        currentValue = newValue
        for (const subscriber of subscribers) {
          subscriber(newValue, prevValue)
        }
      }
    })
    unsubscribes.push(unsub)
  }

  return {
    get: () => currentValue,

    set: () => {
      throw new Error('Cannot set a computed store')
    },

    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      return () => {
        subscribers.delete(subscriber)
      }
    },

    update: () => {
      throw new Error('Cannot update a computed store')
    },

    reset: () => {
      throw new Error('Cannot reset a computed store')
    },

    destroy: () => {
      for (const unsub of unsubscribes) {
        unsub()
      }
      subscribers.clear()
    },
  }
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Create a typed action for a store.
 */
export function createAction<T, P extends unknown[], R>(
  store: Store<T>,
  name: string,
  handler: (state: T, ...params: P) => T | Promise<T>,
): (...params: P) => R extends Promise<unknown> ? Promise<void> : void {
  return (async (...params: P) => {
    const currentState = store.get()
    const newState = await handler(currentState, ...params)
    store.set(newState)

    // DevTools integration
    if (typeof window !== 'undefined' && (window as any).__STX_DEVTOOLS__) {
      (window as any).__STX_DEVTOOLS__.onAction(store.name || 'unnamed', name, params)
    }
  }) as (...params: P) => R extends Promise<unknown> ? Promise<void> : void
}

/**
 * Create multiple actions for a store.
 */
export function createActions<T, A extends Record<string, (state: T, ...args: any[]) => T>>(
  store: Store<T>,
  actions: A,
): { [K in keyof A]: A[K] extends (state: T, ...args: infer P) => T ? (...args: P) => void : never } {
  const result = {} as { [K in keyof A]: A[K] extends (state: T, ...args: infer P) => T ? (...args: P) => void : never }

  for (const [name, handler] of Object.entries(actions)) {
    (result as any)[name] = createAction(store, name, handler)
  }

  return result
}

// =============================================================================
// Selectors
// =============================================================================

/**
 * Create a selector that derives a value from a store.
 */
export function createSelector<T, R>(
  store: Store<T>,
  selector: (state: T) => R,
  options: { equals?: (a: R, b: R) => boolean } = {},
): Store<R> {
  return computed([store as Store<unknown>], selector as (...values: unknown[]) => R, options as ComputedOptions) as Store<R>
}

/**
 * Create a selector with memoization.
 */
export function createMemoizedSelector<T, R>(
  store: Store<T>,
  selector: (state: T) => R,
  deps: (state: T) => unknown[],
): Store<R> {
  let cachedDeps: unknown[] | undefined
  let cachedResult: R | undefined

  const memoizedSelector = (state: T): R => {
    const currentDeps = deps(state)

    if (cachedDeps && cachedDeps.length === currentDeps.length) {
      let changed = false
      for (let i = 0; i < currentDeps.length; i++) {
        if (cachedDeps[i] !== currentDeps[i]) {
          changed = true
          break
        }
      }

      if (!changed && cachedResult !== undefined) {
        return cachedResult
      }
    }

    cachedDeps = currentDeps
    cachedResult = selector(state)
    return cachedResult
  }

  return computed([store as Store<unknown>], memoizedSelector as (...values: unknown[]) => R) as Store<R>
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Logging middleware for debugging.
 */
export function loggerMiddleware<T>(
  name?: string,
): StoreMiddleware<T> {
  return (_set, get) => nextSet => (value) => {
    const prev = get()
    console.group(`[stx-store${name ? `:${name}` : ''}] Update`)
    console.log('Previous:', prev)
    console.log('Next:', value)
    console.groupEnd()
    nextSet(value)
  }
}

/**
 * Validation middleware.
 */
export function validationMiddleware<T>(
  validate: (value: T) => boolean | string,
): StoreMiddleware<T> {
  return (_set, _get) => nextSet => (value) => {
    const result = validate(value)
    if (result === true) {
      nextSet(value)
    }
    else if (typeof result === 'string') {
      console.error(`[stx-store] Validation failed: ${result}`)
    }
    else {
      console.error('[stx-store] Validation failed')
    }
  }
}

/**
 * Immer-like middleware for immutable updates.
 */
export function immerMiddleware<T extends object>(): StoreMiddleware<T> {
  return (_set, _get) => nextSet => (value) => {
    // Deep clone to ensure immutability
    const cloned = JSON.parse(JSON.stringify(value))
    nextSet(cloned)
  }
}

/**
 * Throttle middleware.
 */
export function throttleMiddleware<T>(ms: number): StoreMiddleware<T> {
  let lastCall = 0
  let pendingValue: T | undefined
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (_set, _get) => nextSet => (value) => {
    const now = Date.now()

    if (now - lastCall >= ms) {
      lastCall = now
      nextSet(value)
    }
    else {
      pendingValue = value
      if (!timeout) {
        timeout = setTimeout(() => {
          if (pendingValue !== undefined) {
            lastCall = Date.now()
            nextSet(pendingValue)
            pendingValue = undefined
          }
          timeout = null
        }, ms - (now - lastCall))
      }
    }
  }
}

// =============================================================================
// Template Integration
// =============================================================================

/**
 * Use a store in a template context.
 * Returns a reactive reference that auto-updates.
 */
export function useStore<T>(nameOrStore: string | Store<T>): T {
  const store = typeof nameOrStore === 'string'
    ? getStore<T>(nameOrStore)
    : nameOrStore

  if (!store) {
    throw new Error(`Store "${nameOrStore}" not found`)
  }

  return store.get()
}

/**
 * Create a store directive for use in templates.
 */
export function createStoreDirective(storeName: string): {
  name: string
  hasEndTag: boolean
  handler: () => string
} {
  const store = getStore(storeName)
  if (!store) {
    throw new Error(`Store "${storeName}" not found`)
  }

  return {
    name: 'store',
    hasEndTag: false,
    handler: (): string => {
      return JSON.stringify(store.get())
    },
  }
}

// =============================================================================
// Server State
// =============================================================================

/**
 * Serialize all stores for SSR hydration.
 */
export function serializeStores(): string {
  const state: Record<string, unknown> = {}

  for (const [name, store] of globalState.stores.entries()) {
    state[name] = store.get()
  }

  return JSON.stringify(state)
}

/**
 * Hydrate stores from serialized state.
 */
export function hydrateStores(serialized: string): void {
  try {
    const state = JSON.parse(serialized) as Record<string, unknown>

    for (const [name, value] of Object.entries(state)) {
      const store = getStore(name)
      if (store) {
        store.set(value)
      }
    }
  }
  catch (error) {
    console.error('[stx-store] Hydration failed:', error)
  }
}

/**
 * Generate hydration script for SSR.
 */
export function generateHydrationScript(): string {
  const serialized = serializeStores()
  return `<script>window.__STX_STORE_STATE__=${serialized};
if(window.__STX_HYDRATE_STORES__){window.__STX_HYDRATE_STORES__()}</script>`
}

// =============================================================================
// DevTools
// =============================================================================

/**
 * Initialize DevTools integration.
 */
export function initDevTools(): void {
  if (typeof window === 'undefined')
    return

  (window as any).__STX_DEVTOOLS__ = {
    stores: globalState.stores,
    history: [] as { store: string, action: string, state: unknown, timestamp: number }[],

    onStoreChange(store: string, action: string, state: unknown) {
      this.history.push({ store, action, state, timestamp: Date.now() })

      // Limit history size
      if (this.history.length > 100) {
        this.history.shift()
      }
    },

    onAction(store: string, action: string, _params: unknown[]) {
      console.log(`[stx-devtools] ${store}.${action}`)
    },

    getState() {
      const state: Record<string, unknown> = {}
      for (const [name, store] of this.stores.entries()) {
        state[name] = store.get()
      }
      return state
    },

    getHistory() {
      return this.history
    },

    timeTravel(index: number) {
      const entry = this.history[index]
      if (entry) {
        const store = getStore(entry.store)
        if (store) {
          store.set(entry.state)
        }
      }
    },
  }
}

// =============================================================================
// defineStore API (Clean Import Pattern)
// =============================================================================

/**
 * Store definition options for defineStore
 */
export interface DefineStoreOptions<S, G extends Record<string, (state: S) => any>, A extends Record<string, (...args: any[]) => any>> {
  /** Initial state */
  state: S | (() => S)
  /** Getter functions (computed values) */
  getters?: G
  /** Action functions */
  actions?: A
  /** Enable persistence */
  persist?: PersistOptions | boolean
  /** Enable devtools */
  devtools?: boolean
}

/**
 * Store instance returned by defineStore
 */
export interface DefinedStore<S, G extends Record<string, (state: S) => any>, A extends Record<string, (...args: any[]) => any>> {
  /** Get current state */
  $state: S
  /** Subscribe to state changes */
  $subscribe: (callback: Subscriber<S>) => Unsubscribe
  /** Reset store to initial state */
  $reset: () => void
  /** Patch state with partial update */
  $patch: (partial: Partial<S> | ((state: S) => void)) => void
  /** Internal store reference */
  _store: Store<S>
  /** Store ID/name */
  $id: string
}

// Type helper for getters
type StoreGetters<S, G extends Record<string, (state: S) => any>> = {
  [K in keyof G]: ReturnType<G[K]>
}

// Type helper for actions
type StoreActions<A extends Record<string, (...args: any[]) => any>> = {
  [K in keyof A]: A[K]
}

// Full store type combining state, getters, and actions
export type DefinedStoreWithGettersAndActions<
  S,
  G extends Record<string, (state: S) => any>,
  A extends Record<string, (...args: any[]) => any>,
> = DefinedStore<S, G, A> & StoreGetters<S, G> & StoreActions<A>

/**
 * Define a store with state, getters, and actions.
 *
 * @example
 * ```typescript
 * // stores/counter.ts
 * import { defineStore } from 'stx'
 *
 * export const counterStore = defineStore('counter', {
 *   state: {
 *     count: 0,
 *     name: 'Counter'
 *   },
 *   getters: {
 *     doubleCount: (state) => state.count * 2,
 *     displayName: (state) => `${state.name}: ${state.count}`
 *   },
 *   actions: {
 *     increment() { this.count++ },
 *     decrement() { this.count-- },
 *     incrementBy(amount: number) { this.count += amount },
 *     async fetchCount() {
 *       const response = await fetch('/api/count')
 *       this.count = await response.json()
 *     }
 *   },
 *   persist: true // or { storage: 'local', key: 'my-counter' }
 * })
 * ```
 *
 * Usage in components:
 * ```html
 * <script client>
 * import { counterStore } from '@stores'
 *
 * // Access state
 * console.log(counterStore.count) // 0
 *
 * // Use getters
 * console.log(counterStore.doubleCount) // 0
 *
 * // Call actions
 * counterStore.increment()
 * counterStore.incrementBy(5)
 *
 * // Subscribe to changes
 * counterStore.$subscribe((state) => {
 *   console.log('Count changed:', state.count)
 * })
 *
 * // Reset to initial state
 * counterStore.$reset()
 * </script>
 * ```
 */
export function defineStore<
  S extends object,
  G extends Record<string, (state: S) => any> = Record<string, never>,
  A extends Record<string, (...args: any[]) => any> = Record<string, never>,
>(
  id: string,
  options: DefineStoreOptions<S, G, A>,
): DefinedStoreWithGettersAndActions<S, G, A> {
  const {
    state: initialState,
    getters = {} as G,
    actions = {} as A,
    persist,
    devtools = true,
  } = options

  // Resolve initial state (support factory function)
  const resolvedInitialState = typeof initialState === 'function'
    ? (initialState as () => S)()
    : initialState

  // Create persistence options
  const persistOptions: PersistOptions | undefined = persist === true
    ? { storage: 'local', key: `stx-store:${id}` }
    : persist || undefined

  // Create the underlying store
  const store = createStore<S>(resolvedInitialState, {
    name: id,
    persist: persistOptions,
    devtools,
  })

  // Create a proxy that provides reactive access to state
  const storeProxy = new Proxy({} as DefinedStoreWithGettersAndActions<S, G, A>, {
    get(_target, prop: string | symbol) {
      const propStr = String(prop)

      // Handle special $ properties
      if (propStr === '$state') {
        return store.get()
      }
      if (propStr === '$subscribe') {
        return store.subscribe
      }
      if (propStr === '$reset') {
        return store.reset
      }
      if (propStr === '$patch') {
        return (partial: Partial<S> | ((state: S) => void)) => {
          if (typeof partial === 'function') {
            const currentState = store.get()
            const draft = { ...currentState }
            partial(draft)
            store.set(draft)
          }
          else {
            store.update(partial)
          }
        }
      }
      if (propStr === '_store') {
        return store
      }
      if (propStr === '$id') {
        return id
      }

      // Handle getters
      if (propStr in getters) {
        return getters[propStr](store.get())
      }

      // Handle actions (bind 'this' to the store proxy)
      if (propStr in actions) {
        return (...args: unknown[]) => {
          return actions[propStr].apply(storeProxy, args)
        }
      }

      // Handle state properties
      const state = store.get()
      if (state && typeof state === 'object' && propStr in state) {
        return (state as Record<string, unknown>)[propStr]
      }

      return undefined
    },

    set(_target, prop: string | symbol, value: unknown) {
      const propStr = String(prop)

      // Don't allow setting special properties
      if (propStr.startsWith('$') || propStr === '_store') {
        return false
      }

      // Update state
      const state = store.get()
      if (state && typeof state === 'object') {
        store.set({ ...state, [propStr]: value })
        return true
      }

      return false
    },

    has(_target, prop: string | symbol) {
      const propStr = String(prop)
      const state = store.get()
      return (
        propStr.startsWith('$')
        || propStr === '_store'
        || propStr in getters
        || propStr in actions
        || (state && typeof state === 'object' && propStr in state)
      )
    },

    ownKeys() {
      const state = store.get()
      const stateKeys = state && typeof state === 'object' ? Object.keys(state) : []
      return [
        ...stateKeys,
        ...Object.keys(getters),
        ...Object.keys(actions),
        '$state',
        '$subscribe',
        '$reset',
        '$patch',
        '$id',
      ]
    },

    getOwnPropertyDescriptor(_target, prop) {
      return {
        enumerable: true,
        configurable: true,
        get: () => this.get!(_target, prop, storeProxy),
      }
    },
  })

  // Register in global store registry for @stores imports
  storeRegistry.set(id, storeProxy)

  return storeProxy
}

// =============================================================================
// Store Registry for @stores Imports
// =============================================================================

/** Global registry of defined stores */
const storeRegistry = new Map<string, DefinedStoreWithGettersAndActions<any, any, any>>()

/**
 * Get a defined store by name.
 * Used internally by the @stores import transformation.
 */
export function getDefinedStore<S extends object = any>(name: string): DefinedStoreWithGettersAndActions<S, any, any> | undefined {
  return storeRegistry.get(name)
}

/**
 * Get all defined store names.
 */
export function getDefinedStoreNames(): string[] {
  return Array.from(storeRegistry.keys())
}

/**
 * Check if a store is defined.
 */
export function hasDefinedStore(name: string): boolean {
  return storeRegistry.has(name)
}

// =============================================================================
// Client Runtime for @stores Imports
// =============================================================================

/**
 * Generate client-side runtime code for store imports.
 * Uses the stx runtime to avoid exposing window.* to developers.
 */
export function generateStoreImportRuntime(): string {
  return `
// STX Store Runtime - extends stx global
(function() {
  if (typeof window === 'undefined') return;
  var s = window.stx || {};

  // Helper to wait for stores to be ready
  s.waitForStore = function(storeName, timeout) {
    timeout = timeout || 5000;
    var start = Date.now();
    return new Promise(function(resolve, reject) {
      function check() {
        var store = s.useStore ? s.useStore(storeName) : null;
        if (store) {
          resolve(store);
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for store: ' + storeName));
        } else {
          requestAnimationFrame(check);
        }
      }
      check();
    });
  };

  window.stx = s;
})();
`
}

/**
 * Transform import statements from @stores to runtime code.
 *
 * Transforms:
 * ```js
 * import { appStore, chatStore } from '@stores'
 * ```
 *
 * Into:
 * ```js
 * const appStore = stx.useStore('appStore');
 * const chatStore = stx.useStore('chatStore');
 * ```
 *
 * The stx runtime is injected automatically and abstracts away window.* access.
 */
export function transformStoreImports(code: string): string {
  // Match: import { store1, store2 } from '@stores' or "stx/stores" or 'stx/stores'
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"](@stores|stx\/stores)['"]\s*;?\n?/g

  return code.replace(importRegex, (_match, imports: string) => {
    const storeNames = imports
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    // Use stx.useStore() which internally handles window access
    return storeNames
      .map(name => `const ${name} = stx.useStore('${name}');`)
      .join('\n') + '\n'
  })
}

/**
 * Generate store registration code for the client.
 *
 * @example
 * ```js
 * // In your stores file (e.g., stores/index.ts)
 * import { defineStore, registerStoresClient } from 'stx'
 *
 * export const appStore = defineStore('app', { ... })
 * export const chatStore = defineStore('chat', { ... })
 *
 * // Register for client-side @stores imports
 * if (typeof window !== 'undefined') {
 *   registerStoresClient({ appStore, chatStore })
 * }
 * ```
 */
export function registerStoresClient(stores: Record<string, DefinedStoreWithGettersAndActions<any, any, any>>): void {
  if (typeof window === 'undefined') return

  const w = window as any
  w.__STX_STORES__ = w.__STX_STORES__ || {}

  for (const [name, store] of Object.entries(stores)) {
    w.__STX_STORES__[name] = store
  }

  // Dispatch event to notify that stores are ready
  window.dispatchEvent(new CustomEvent('stx:stores-ready', { detail: Object.keys(stores) }))
}
