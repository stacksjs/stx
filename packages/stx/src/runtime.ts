// @ts-nocheck - Skip type checking due to generic type constraints
/**
 * STX Runtime - Clean APIs that hide window internals
 *
 * This module provides the public API for accessing stx runtime state.
 * All window.* access is abstracted away so developers never see it.
 *
 * @example
 * ```ts
 * import { useStore, useRouteParams, useMiddlewareState } from 'stx'
 *
 * const store = useStore('appStore')
 * const params = useRouteParams()
 * const state = useMiddlewareState()
 * ```
 */

// Internal window state keys (hidden from developers)
const STX_STORES_KEY = '__STX_STORES__'
const STX_ROUTE_PARAMS_KEY = '__STX_ROUTE_PARAMS__'
const STX_MIDDLEWARE_STATE_KEY = '__STX_MIDDLEWARE_STATE__'
const STX_HYDRATE_STORES_KEY = '__STX_HYDRATE_STORES__'
const STX_STORE_STATE_KEY = '__STX_STORE_STATE__'

/**
 * Type-safe window access helper
 */
function getGlobal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  return (window as Record<string, unknown>)[key] as T ?? defaultValue
}

function setGlobal(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  ;(window as Record<string, unknown>)[key] = value
}

// =============================================================================
// Store Access
// =============================================================================

export interface StoreRef<T = unknown> {
  /** Current state */
  state: T
  /** Get current state */
  getState: () => T
  /** Update state */
  setState: (updater: Partial<T> | ((state: T) => Partial<T>)) => void
  /** Subscribe to changes */
  subscribe: (listener: (state: T) => void) => () => void
  /** Reset to initial state */
  reset: () => void
}

/**
 * Get a store by name
 *
 * @example
 * ```ts
 * const appStore = useStore('appStore')
 * console.log(appStore.state.count)
 *
 * appStore.setState({ count: appStore.state.count + 1 })
 * ```
 */
export function useStore<T = unknown>(name: string): StoreRef<T> | null {
  const stores = getGlobal<Record<string, StoreRef<T>>>(STX_STORES_KEY, {})
  return stores[name] ?? null
}

/**
 * Get a store, throwing if not found
 */
export function useStoreOrThrow<T = unknown>(name: string): StoreRef<T> {
  const store = useStore<T>(name)
  if (!store) {
    throw new Error(`Store "${name}" not found. Make sure it's defined with defineStore().`)
  }
  return store
}

/**
 * Check if a store exists
 */
export function hasStore(name: string): boolean {
  const stores = getGlobal<Record<string, unknown>>(STX_STORES_KEY, {})
  return name in stores
}

/**
 * Get all store names
 */
export function getStoreNames(): string[] {
  const stores = getGlobal<Record<string, unknown>>(STX_STORES_KEY, {})
  return Object.keys(stores)
}

/**
 * Wait for a store to be ready (for async initialization)
 */
export function waitForStore<T = unknown>(name: string, timeout = 5000): Promise<StoreRef<T>> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const check = () => {
      const store = useStore<T>(name)
      if (store) {
        resolve(store)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for store "${name}"`))
      } else {
        requestAnimationFrame(check)
      }
    }

    check()
  })
}

// =============================================================================
// Route Params
// =============================================================================

export interface RouteParams {
  [key: string]: string
}

/**
 * Get current route parameters
 *
 * @example
 * ```ts
 * // URL: /users/123
 * const params = useRouteParams()
 * console.log(params.id) // '123'
 * ```
 */
export function useRouteParams(): RouteParams {
  return getGlobal<RouteParams>(STX_ROUTE_PARAMS_KEY, {})
}

/**
 * Get a specific route parameter
 *
 * @example
 * ```ts
 * const userId = useRouteParam('id')
 * ```
 */
export function useRouteParam(name: string): string | undefined {
  const params = useRouteParams()
  return params[name]
}

/**
 * Get a route parameter or throw if missing
 */
export function useRouteParamOrThrow(name: string): string {
  const value = useRouteParam(name)
  if (value === undefined) {
    throw new Error(`Route parameter "${name}" not found`)
  }
  return value
}

// =============================================================================
// Middleware State
// =============================================================================

export interface MiddlewareState {
  [key: string]: unknown
}

/**
 * Get state passed from middleware
 *
 * @example
 * ```ts
 * // In middleware:
 * ctx.state.user = { id: 1, name: 'John' }
 *
 * // In component:
 * const state = useMiddlewareState()
 * console.log(state.user)
 * ```
 */
export function useMiddlewareState<T = MiddlewareState>(): T {
  return getGlobal<T>(STX_MIDDLEWARE_STATE_KEY, {} as T)
}

/**
 * Get a specific middleware state value
 */
export function useMiddlewareValue<T = unknown>(key: string): T | undefined {
  const state = useMiddlewareState()
  return (state as Record<string, T>)[key]
}

// =============================================================================
// Hydration (Internal - for framework use)
// =============================================================================

/**
 * @internal
 * Initialize the store registry
 */
export function initStoreRegistry(): void {
  if (typeof window === 'undefined') return

  const existing = getGlobal<Record<string, unknown>>(STX_STORES_KEY, null)
  if (!existing) {
    setGlobal(STX_STORES_KEY, {})
  }
}

/**
 * @internal
 * Register a store in the registry
 */
export function registerStore(name: string, store: StoreRef): void {
  const stores = getGlobal<Record<string, StoreRef>>(STX_STORES_KEY, {})
  stores[name] = store
  setGlobal(STX_STORES_KEY, stores)
}

/**
 * @internal
 * Get serialized store state for hydration
 */
export function getHydratedStoreState(): Record<string, unknown> | null {
  return getGlobal<Record<string, unknown> | null>(STX_STORE_STATE_KEY, null)
}

/**
 * @internal
 * Set route params (called by router)
 */
export function setRouteParams(params: RouteParams): void {
  setGlobal(STX_ROUTE_PARAMS_KEY, params)
}

/**
 * @internal
 * Set middleware state (called by middleware runner)
 */
export function setMiddlewareState(state: MiddlewareState): void {
  setGlobal(STX_MIDDLEWARE_STATE_KEY, state)
}

// =============================================================================
// SSR Detection
// =============================================================================

/**
 * Check if running on the server
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Check if running on the client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Run callback only on client
 *
 * @example
 * ```ts
 * onClient(() => {
 *   document.title = 'Hello'
 * })
 * ```
 */
export function onClient(callback: () => void): void {
  if (isClient()) {
    callback()
  }
}

/**
 * Run callback only on server
 */
export function onServer(callback: () => void): void {
  if (isServer()) {
    callback()
  }
}
