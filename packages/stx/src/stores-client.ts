/**
 * STX Stores - Client Runtime
 *
 * This module provides the client-side store functionality for STX applications.
 * It enables clean imports like: import { appStore } from '@stores'
 *
 * @example
 * ```html
 * <!-- In your layout or main template -->
 * <script src="/js/stx-stores.js"></script>
 *
 * <!-- In your stores definition file -->
 * <script>
 * const { defineStore, registerStores } = window.STX;
 *
 * const appStore = defineStore('app', {
 *   state: { count: 0 },
 *   actions: {
 *     increment() { this.count++ }
 *   }
 * });
 *
 * registerStores({ appStore });
 * </script>
 *
 * <!-- In your components -->
 * <script client>
 * import { appStore } from '@stores'
 * appStore.increment()
 * </script>
 * ```
 */

// Type definitions
export interface Subscriber<T> {
  (value: T, previousValue?: T): void
}

export type Unsubscribe = () => void

export interface PersistOptions {
  storage?: 'local' | 'session' | 'memory'
  key?: string
}

export interface StoreOptions<S, G, A> {
  state: S | (() => S)
  getters?: G
  actions?: A
  persist?: PersistOptions | boolean
}

export interface Store<S> {
  /** Get full state snapshot */
  $state: S
  /** Subscribe to state changes */
  $subscribe: (callback: Subscriber<S>) => Unsubscribe
  /** Reset to initial state */
  $reset: () => void
  /** Patch state with partial update */
  $patch: (partial: Partial<S> | ((state: S) => void)) => void
  /** Store ID */
  $id: string
}

// Memory storage fallback
const memoryStorage = new Map<string, string>()

function getStorage(type: 'local' | 'session' | 'memory' = 'local') {
  if (type === 'memory' || typeof localStorage === 'undefined') {
    return {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
    }
  }
  return type === 'local' ? localStorage : sessionStorage
}

/**
 * Define a reactive store with state, getters, and actions.
 */
export function defineStore<
  S extends object,
  G extends Record<string, (state: S) => any> = Record<string, never>,
  A extends Record<string, (...args: any[]) => any> = Record<string, never>,
>(
  id: string,
  options: StoreOptions<S, G, A>,
): Store<S> & { [K in keyof G]: ReturnType<G[K]> } & { [K in keyof A]: A[K] } {
  const { state: initialState, getters = {} as G, actions = {} as A, persist } = options

  // Resolve initial state
  let currentState: S = typeof initialState === 'function'
    ? (initialState as () => S)()
    : { ...initialState }

  const subscribers = new Set<Subscriber<S>>()

  // Load persisted state
  if (persist) {
    const opts = persist === true ? { storage: 'local' as const, key: `stx:${id}` } : persist
    const storage = getStorage(opts.storage)
    const key = opts.key || `stx:${id}`

    try {
      const stored = storage.getItem(key)
      if (stored) {
        currentState = { ...currentState, ...JSON.parse(stored) }
      }
    }
    catch { /* ignore */ }
  }

  // Save to storage
  const persistState = () => {
    if (!persist) return
    const opts = persist === true ? { storage: 'local' as const, key: `stx:${id}` } : persist
    const storage = getStorage(opts.storage)
    const key = opts.key || `stx:${id}`
    storage.setItem(key, JSON.stringify(currentState))
  }

  // Notify subscribers
  const notify = (prev: S) => {
    for (const sub of subscribers) {
      try {
        sub(currentState, prev)
      }
      catch (e) {
        console.error(`[stx:${id}] Subscriber error:`, e)
      }
    }
  }

  // Initial state for reset
  const initialStateCopy = typeof initialState === 'function'
    ? (initialState as () => S)()
    : { ...initialState }

  // Create proxy for reactive state access
  const store = new Proxy({} as any, {
    get(_, prop: string) {
      // Special properties
      if (prop === '$state') return { ...currentState }
      if (prop === '$id') return id
      if (prop === '$subscribe') {
        return (callback: Subscriber<S>) => {
          subscribers.add(callback)
          return () => subscribers.delete(callback)
        }
      }
      if (prop === '$reset') {
        return () => {
          const prev = currentState
          currentState = { ...initialStateCopy }
          persistState()
          notify(prev)
        }
      }
      if (prop === '$patch') {
        return (partial: Partial<S> | ((state: S) => void)) => {
          const prev = currentState
          if (typeof partial === 'function') {
            const draft = { ...currentState }
            partial(draft)
            currentState = draft
          }
          else {
            currentState = { ...currentState, ...partial }
          }
          persistState()
          notify(prev)
        }
      }

      // Getters
      if (prop in getters) {
        return (getters as any)[prop](currentState)
      }

      // Actions (bind this to store)
      if (prop in actions) {
        return (...args: any[]) => (actions as any)[prop].apply(store, args)
      }

      // State properties
      if (prop in currentState) {
        return (currentState as any)[prop]
      }

      return undefined
    },

    set(_, prop: string, value) {
      if (prop.startsWith('$')) return false

      const prev = currentState
      currentState = { ...currentState, [prop]: value }
      persistState()
      notify(prev)
      return true
    },

    has(_, prop: string) {
      return prop.startsWith('$') || prop in getters || prop in actions || prop in currentState
    },
  })

  // Register globally
  if (typeof window !== 'undefined') {
    (window as any).__STX_STORES__ = (window as any).__STX_STORES__ || {}
    ;(window as any).__STX_STORES__[id] = store
  }

  return store
}

/**
 * Register multiple stores at once.
 */
export function registerStores(stores: Record<string, any>): void {
  if (typeof window === 'undefined') return

  const w = window as any
  w.__STX_STORES__ = w.__STX_STORES__ || {}

  for (const [name, store] of Object.entries(stores)) {
    w.__STX_STORES__[name] = store
  }

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('stx:stores-ready', { detail: Object.keys(stores) }))
}

/**
 * Get a store by name.
 */
export function getStore<T = any>(name: string): T | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as any).__STX_STORES__?.[name]
}

/**
 * Wait for a store to be available.
 */
export function waitForStore<T = any>(name: string, timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const store = getStore<T>(name)
    if (store) {
      resolve(store)
      return
    }

    const start = Date.now()
    const check = () => {
      const store = getStore<T>(name)
      if (store) {
        resolve(store)
      }
      else if (Date.now() - start > timeout) {
        reject(new Error(`Store "${name}" not found after ${timeout}ms`))
      }
      else {
        requestAnimationFrame(check)
      }
    }
    check()
  })
}

// Export to window for non-module usage
if (typeof window !== 'undefined') {
  (window as any).STX = {
    ...(window as any).STX,
    defineStore,
    registerStores,
    getStore,
    waitForStore,
  }
}
