/**
 * Voide Store System
 *
 * A lightweight reactive store implementation based on STX's state-management.
 * Designed to work in the browser with localStorage persistence.
 */

export type Subscriber<T> = (value: T, previousValue: T | undefined) => void
export type Unsubscribe = () => void

export interface StoreOptions<T> {
  name?: string
  persist?: {
    key?: string
    storage?: 'local' | 'session'
    debounce?: number
  }
  onChange?: (value: T, prev: T | undefined) => void
}

export interface Store<T> {
  get: () => T
  set: (value: T | ((prev: T) => T)) => void
  update: (partial: Partial<T> | ((prev: T) => Partial<T>)) => void
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe
  reset: () => void
  name?: string
}

/**
 * Create a reactive store
 */
export function createStore<T extends object>(
  initialValue: T,
  options: StoreOptions<T> = {}
): Store<T> {
  const { name, persist, onChange } = options

  let currentValue = { ...initialValue }
  const subscribers = new Set<Subscriber<T>>()
  let persistTimeout: ReturnType<typeof setTimeout> | null = null

  // Load persisted value
  if (persist && typeof window !== 'undefined') {
    const storage = persist.storage === 'session' ? sessionStorage : localStorage
    const key = persist.key || `voide:${name || 'store'}`

    try {
      const stored = storage.getItem(key)
      if (stored) {
        currentValue = { ...initialValue, ...JSON.parse(stored) }
      }
    } catch {
      // Invalid stored value, use initial
    }
  }

  // Persist value to storage
  const persistValue = (value: T) => {
    if (!persist || typeof window === 'undefined') return

    const storage = persist.storage === 'session' ? sessionStorage : localStorage
    const key = persist.key || `voide:${name || 'store'}`

    if (persist.debounce) {
      if (persistTimeout) clearTimeout(persistTimeout)
      persistTimeout = setTimeout(() => {
        storage.setItem(key, JSON.stringify(value))
      }, persist.debounce)
    } else {
      storage.setItem(key, JSON.stringify(value))
    }
  }

  // Notify all subscribers
  const notify = (newValue: T, prevValue: T | undefined) => {
    for (const subscriber of subscribers) {
      try {
        subscriber(newValue, prevValue)
      } catch (error) {
        console.error('[voide-store] Subscriber error:', error)
      }
    }
    if (onChange) {
      onChange(newValue, prevValue)
    }
  }

  const store: Store<T> = {
    get: () => currentValue,

    set: (value) => {
      const prevValue = currentValue
      const newValue = typeof value === 'function'
        ? (value as (prev: T) => T)(currentValue)
        : value

      if (newValue !== prevValue) {
        currentValue = newValue
        persistValue(newValue)
        notify(newValue, prevValue)
      }
    },

    update: (partial) => {
      const prevValue = currentValue
      const updates = typeof partial === 'function'
        ? (partial as (prev: T) => Partial<T>)(currentValue)
        : partial

      const newValue = { ...currentValue, ...updates }
      currentValue = newValue
      persistValue(newValue)
      notify(newValue, prevValue)
    },

    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      // Call immediately with current value
      subscriber(currentValue, undefined)
      return () => {
        subscribers.delete(subscriber)
      }
    },

    reset: () => {
      const prevValue = currentValue
      currentValue = { ...initialValue }
      persistValue(currentValue)
      notify(currentValue, prevValue)
    },

    name
  }

  return store
}

/**
 * Create a computed store that derives from other stores
 */
export function computed<T, S extends Store<any>[]>(
  stores: S,
  compute: (...values: { [K in keyof S]: S[K] extends Store<infer V> ? V : never }) => T
): { get: () => T; subscribe: (subscriber: Subscriber<T>) => Unsubscribe } {
  const getValues = () => stores.map(s => s.get()) as any
  let currentValue = compute(...getValues())
  const subscribers = new Set<Subscriber<T>>()

  // Subscribe to all source stores
  for (const sourceStore of stores) {
    sourceStore.subscribe(() => {
      const newValue = compute(...getValues())
      if (newValue !== currentValue) {
        const prevValue = currentValue
        currentValue = newValue
        for (const subscriber of subscribers) {
          subscriber(newValue, prevValue)
        }
      }
    })
  }

  return {
    get: () => currentValue,
    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      return () => subscribers.delete(subscriber)
    }
  }
}
