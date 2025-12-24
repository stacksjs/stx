/**
 * useStorage - Reactive localStorage/sessionStorage composable
 */

export type StorageType = 'local' | 'session'

export interface UseStorageOptions<T> {
  storage?: StorageType
  default?: T
  mergeDefaults?: boolean
  listenToStorageChanges?: boolean
}

export interface StorageRef<T> {
  value: T
  get: () => T
  set: (value: T) => void
  remove: () => void
  subscribe: (callback: (value: T, prev: T | undefined) => void) => () => void
}

export function useStorage<T>(
  key: string,
  defaultValue: T,
  options: UseStorageOptions<T> = {}
): StorageRef<T> {
  const {
    storage = 'local',
    mergeDefaults = false,
    listenToStorageChanges = true,
  } = options

  const subscribers = new Set<(value: T, prev: T | undefined) => void>()
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
      const parsed = JSON.parse(raw)
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
        store.setItem(key, JSON.stringify(value))
      }
    } catch (e) {
      console.warn(`[useStorage] Failed to write key "${key}":`, e)
    }
  }

  let currentValue = read()

  const notify = (newValue: T, prevValue: T | undefined) => {
    for (const callback of subscribers) {
      try { callback(newValue, prevValue) } catch (e) { console.error('[useStorage]', e) }
    }
  }

  if (isClient && listenToStorageChanges) {
    window.addEventListener('storage', (event) => {
      if (event.key === key && event.storageArea === getStorage()) {
        const prevValue = currentValue
        currentValue = event.newValue ? JSON.parse(event.newValue) : defaultValue
        notify(currentValue, prevValue)
      }
    })
  }

  const ref: StorageRef<T> = {
    get value() { return currentValue },
    set value(newValue: T) {
      const prevValue = currentValue
      currentValue = newValue
      write(newValue)
      notify(newValue, prevValue)
    },
    get: () => currentValue,
    set: (value: T) => { ref.value = value },
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
      callback(currentValue, undefined)
      return () => subscribers.delete(callback)
    },
  }

  return ref
}

export function useLocalStorage<T>(key: string, defaultValue: T, options?: Omit<UseStorageOptions<T>, 'storage'>) {
  return useStorage(key, defaultValue, { ...options, storage: 'local' })
}

export function useSessionStorage<T>(key: string, defaultValue: T, options?: Omit<UseStorageOptions<T>, 'storage'>) {
  return useStorage(key, defaultValue, { ...options, storage: 'session' })
}

export function clearStorage(type: StorageType = 'local'): void {
  if (typeof window === 'undefined') return
  const storage = type === 'session' ? sessionStorage : localStorage
  storage.clear()
}

export function getStorageKeys(type: StorageType = 'local'): string[] {
  if (typeof window === 'undefined') return []
  const storage = type === 'session' ? sessionStorage : localStorage
  return Object.keys(storage)
}
