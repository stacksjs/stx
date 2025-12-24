/**
 * useStorage - Reactive localStorage/sessionStorage composable
 *
 * Similar to Nuxt's useStorage but for STX applications.
 * Provides a reactive, type-safe wrapper around Web Storage APIs.
 */

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
    } catch {
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
    } catch {
      return defaultValue
    }
  }

  const write = (value: T): void => {
    const store = getStorage()
    if (!store) return

    try {
      if (value === null || value === undefined) {
        store.removeItem(key)
      } else {
        store.setItem(key, serializer.write(value))
      }
    } catch (e) {
      console.warn(`[useStorage] Failed to write key "${key}":`, e)
    }
  }

  let currentValue = read()

  const notify = (newValue: T, prevValue: T | undefined) => {
    for (const callback of subscribers) {
      try {
        callback(newValue, prevValue)
      } catch (e) {
        console.error('[useStorage] Subscriber error:', e)
      }
    }
  }

  // Listen for storage changes from other tabs
  if (isClient && listenToStorageChanges) {
    window.addEventListener('storage', (event) => {
      if (event.key === key && event.storageArea === getStorage()) {
        const prevValue = currentValue
        currentValue = event.newValue ? serializer.read(event.newValue) : defaultValue
        notify(currentValue, prevValue)
      }
    })
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
 * Shorthand for useStorage with localStorage
 */
export function useLocalStorage<T>(key: string, defaultValue: T, options?: Omit<UseStorageOptions<T>, 'storage'>) {
  return useStorage(key, defaultValue, { ...options, storage: 'local' })
}

/**
 * Shorthand for useStorage with sessionStorage
 */
export function useSessionStorage<T>(key: string, defaultValue: T, options?: Omit<UseStorageOptions<T>, 'storage'>) {
  return useStorage(key, defaultValue, { ...options, storage: 'session' })
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
