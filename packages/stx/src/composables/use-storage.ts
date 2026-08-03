/**
 * useStorage - Reactive localStorage/sessionStorage composable
 *
 * Similar to Nuxt's useStorage but for STX applications.
 * Provides a reactive, type-safe wrapper around Web Storage APIs.
 *
 * Two shapes live here, deliberately:
 *
 *   - `useLocalStorage` / `useSessionStorage` return a **Signal** — the same
 *     shape the ambient `stx.d.ts` declares and the same shape a
 *     `<script client>` block gets from `window.stx`. One identifier, one
 *     contract, whichever way it is imported (stacksjs/stx#1797).
 *   - `useStorage` returns a **StorageRef** — `.value`, `.get()`, `.remove()`,
 *     `.subscribe()`, custom serializers. It is genuinely a different, richer
 *     thing, so it keeps its own name and shape.
 *
 * Parity with the runtime implementation is pinned by
 * `test/composables/use-storage-parity.test.ts`, following the precedent
 * #1710 set for `useCookie`.
 */
import type { Signal } from '../signals-api'
import { effect, state } from '../signals-api'

export type StorageType = 'local' | 'session'

export interface UseStorageOptions<T> {
  /** Storage type: 'local' or 'session' */
  storage?: StorageType
  /** Default value if key doesn't exist */
  default?: T
  /** Custom serializer */
  serializer?: {
    read: (value: string) => T
    write: (value: T) => string
  }
  /** Merge default with stored value (for objects) */
  mergeDefaults?: boolean
  /** Listen for storage changes from other tabs */
  listenToStorageChanges?: boolean
}

export interface StorageRef<T> {
  /** Current value */
  value: T
  /** Get the current value */
  get: () => T
  /** Set a new value */
  set: (value: T) => void
  /** Remove from storage */
  remove: () => void
  /** Subscribe to changes */
  subscribe: (callback: (value: T, prev: T | undefined) => void) => () => void
}

const defaultSerializer = {
  read: <T>(value: string): T => {
    try {
      return JSON.parse(value)
    }
catch {
      return value as unknown as T
    }
  },
  write: <T>(value: T): string => {
    return JSON.stringify(value)
  },
}

/**
 * Create a reactive storage reference
 *
 * @example
 * ```ts
 * // Simple usage
 * const theme = useStorage('theme', 'light')
 * theme.value = 'dark' // Automatically persists
 *
 * // With options
 * const user = useStorage<User>('user', null, {
 *   storage: 'session',
 *   mergeDefaults: true
 * })
 *
 * // Subscribe to changes
 * theme.subscribe((newValue) => console.log('Theme changed:', newValue))
 * ```
 */
export function useStorage<T>(
  key: string,
  defaultValue: T,
  options: UseStorageOptions<T> = {}
): StorageRef<T> {
  const {
    storage = 'local',
    serializer = defaultSerializer,
    mergeDefaults = false,
    listenToStorageChanges = true,
  } = options

  const subscribers = new Set<(value: T, prev: T | undefined) => void>()

  // SSR safety check
  const isClient = typeof window !== 'undefined'

  const getStorage = (): Storage | null => {
    if (!isClient) return null
    return storage === 'session' ? sessionStorage : localStorage
  }

  const read = (): T => {
    const store = getStorage()
    if (!store) return defaultValue

    try {
      const raw = store.getItem(key)
      if (raw === null) return defaultValue

      const parsed = serializer.read(raw)

      if (mergeDefaults && typeof defaultValue === 'object' && defaultValue !== null) {
        return { ...defaultValue, ...parsed }
      }

      return parsed
    }
catch {
      return defaultValue
    }
  }

  const write = (value: T): void => {
    const store = getStorage()
    if (!store) return

    try {
      if (value === null || value === undefined) {
        store.removeItem(key)
      }
else {
        store.setItem(key, serializer.write(value))
      }
    }
catch (e) {
      console.warn(`[useStorage] Failed to write key "${key}":`, e)
    }
  }

  let currentValue = read()

  const notify = (newValue: T, prevValue: T | undefined) => {
    for (const callback of subscribers) {
      try {
        callback(newValue, prevValue)
      }
catch (e) {
        console.error('[useStorage] Subscriber error:', e)
      }
    }
  }

  // Listen for storage changes from other tabs. The handler is hoisted to
  // a named binding so it can be removed on scope teardown (stacksjs/stx#1718
  // — previously this was an inline closure and `addEventListener` had no
  // pair, leaking one listener per useStorage() call across HMR and across
  // repeated scope creation). The cleanup is best-effort: when called inside
  // a signals-runtime scope (`<script client>`), `onDestroy` is available on
  // globalThis and we wire the removal; outside that context (raw module
  // imports from tests/SSR) the listener stays until the document is gone,
  // which is fine because there's no scope to leak into.
  if (isClient && listenToStorageChanges) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === getStorage()) {
        const prevValue = currentValue
        // Guarded like read() above (stacksjs/stx#1793): the default serializer
        // swallows its own parse errors, but a custom one can throw — and here
        // that throw lands inside a window listener, fired by a different tab
        // at an arbitrary later time, with a stack pointing at the runtime
        // rather than at the consumer. Keep the last good value on failure.
        try {
          currentValue = event.newValue ? serializer.read(event.newValue) : defaultValue
        }
        catch (e) {
          console.warn(`[useStorage] Failed to read key "${key}" from a cross-tab update:`, e)
          return
        }
        notify(currentValue, prevValue)
      }
    }
    window.addEventListener('storage', onStorage)

    // eslint-disable-next-line ts/no-explicit-any
    const maybeOnDestroy = (globalThis as any).onDestroy
    if (typeof maybeOnDestroy === 'function')
      maybeOnDestroy(() => window.removeEventListener('storage', onStorage))
  }

  const ref: StorageRef<T> = {
    get value() {
      return currentValue
    },
    set value(newValue: T) {
      const prevValue = currentValue
      currentValue = newValue
      write(newValue)
      notify(newValue, prevValue)
    },
    get: () => currentValue,
    set: (value: T) => {
      ref.value = value
    },
    remove: () => {
      const store = getStorage()
      if (store) {
        store.removeItem(key)
        const prevValue = currentValue
        currentValue = defaultValue
        notify(defaultValue, prevValue)
      }
    },
    subscribe: (callback) => {
      subscribers.add(callback)
      // Immediately call with current value
      callback(currentValue, undefined)
      return () => subscribers.delete(callback)
    },
  }

  return ref
}

/**
 * Reactive storage binding shared by useLocalStorage / useSessionStorage.
 *
 * Mirrors the runtime implementation in `signals.ts` exactly — `state()` seeded
 * from storage, an `effect()` that persists every change, and a `storage`
 * listener filtered by both key and storageArea. The runtime is the canonical
 * contract; this file follows it (stacksjs/stx#1797).
 */
function storageSignal<T>(
  storageType: StorageType,
  label: string,
  key: string,
  defaultValue: T,
  options: Omit<UseStorageOptions<T>, 'storage'> = {},
): Signal<T> {
  const {
    serializer = defaultSerializer,
    mergeDefaults = false,
    listenToStorageChanges = true,
  } = options

  const isClient = typeof window !== 'undefined'
  const getStorage = (): Storage | null => {
    if (!isClient)
      return null
    return storageType === 'session' ? sessionStorage : localStorage
  }

  const parse = (raw: string | null): T => {
    if (raw === null || raw === undefined)
      return defaultValue
    try {
      const parsed = serializer.read(raw) as T
      if (mergeDefaults && typeof defaultValue === 'object' && defaultValue !== null)
        return { ...defaultValue, ...parsed }
      return parsed
    }
    catch (e) {
      console.warn(`[${label}] Failed to read key "${key}":`, e)
      return defaultValue
    }
  }

  const read = (): T => {
    const store = getStorage()
    if (!store)
      return defaultValue
    try {
      return parse(store.getItem(key))
    }
    catch (e) {
      console.warn(`[${label}] Cannot read "${key}":`, e)
      return defaultValue
    }
  }

  const signal = state<T>(read())

  effect(() => {
    const value = signal()
    const store = getStorage()
    if (!store)
      return
    try {
      if (value === null || value === undefined)
        store.removeItem(key)
      else
        store.setItem(key, serializer.write(value))
    }
    catch (e) {
      console.warn(`[${label}] Cannot persist "${key}":`, e)
    }
  })

  if (isClient && listenToStorageChanges) {
    // Named binding so it can be removed on scope teardown (#1718). The
    // storageArea filter stops a sessionStorage write to the same key name
    // from clobbering a localStorage signal, and vice versa; synthetic events
    // (tests) leave it null and are still accepted.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key)
        return
      if (event.storageArea && event.storageArea !== getStorage())
        return
      signal.set(parse(event.newValue))
    }
    window.addEventListener('storage', onStorage)

    // eslint-disable-next-line ts/no-explicit-any
    const maybeOnDestroy = (globalThis as any).onDestroy
    if (typeof maybeOnDestroy === 'function')
      maybeOnDestroy(() => window.removeEventListener('storage', onStorage))
  }

  return signal
}

/**
 * Reactive localStorage binding. Returns a Signal: `s()` reads, `s.set(v)`
 * writes and persists.
 *
 * The same shape the ambient `stx.d.ts` declares and the same shape a
 * `<script client>` block gets from `window.stx` — one identifier, one
 * contract, whichever way it's imported (stacksjs/stx#1797). It used to return
 * a `StorageRef` here and a signal there, so `.value` worked or silently
 * yielded `undefined` depending on which entry point resolved.
 *
 * For the richer object API — `.value`, `.remove()`, `.subscribe()`, custom
 * serializers — use {@link useStorage}, which is unchanged.
 */
export function useLocalStorage<T>(key: string, defaultValue: T, options?: Omit<UseStorageOptions<T>, 'storage'>): Signal<T> {
  return storageSignal('local', 'useLocalStorage', key, defaultValue, options)
}

/**
 * Reactive sessionStorage binding. Returns a Signal — see {@link useLocalStorage}.
 */
export function useSessionStorage<T>(key: string, defaultValue: T, options?: Omit<UseStorageOptions<T>, 'storage'>): Signal<T> {
  return storageSignal('session', 'useSessionStorage', key, defaultValue, options)
}

/**
 * Clear all items from storage
 */
export function clearStorage(type: StorageType = 'local'): void {
  if (typeof window === 'undefined') return
  const storage = type === 'session' ? sessionStorage : localStorage
  storage.clear()
}

/**
 * Get all keys from storage
 */
export function getStorageKeys(type: StorageType = 'local'): string[] {
  if (typeof window === 'undefined') return []
  const storage = type === 'session' ? sessionStorage : localStorage
  return Object.keys(storage)
}

/**
 * Get storage size in bytes (approximate)
 */
export function getStorageSize(type: StorageType = 'local'): number {
  if (typeof window === 'undefined') return 0
  const storage = type === 'session' ? sessionStorage : localStorage
  let size = 0
  for (const key in storage) {
    if (Object.prototype.hasOwnProperty.call(storage, key)) {
      size += (key.length + (storage.getItem(key)?.length || 0)) * 2 // UTF-16 = 2 bytes per char
    }
  }
  return size
}
