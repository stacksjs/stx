/**
 * Reactive localStorage hook with cross-tab synchronization
 *
 * @example
 * ```ts
 * const { value, setValue, removeValue } = useLocalStorage('user', { name: 'John' })
 *
 * setValue({ name: 'Jane' })
 * setValue(prev => ({ ...prev, age: 30 }))
 * removeValue()
 * ```
 */

/**
 * Options for useLocalStorage hook
 */
export interface UseLocalStorageOptions<T> {
  /** Custom serializer function (defaults to JSON.stringify) */
  serializer?: (value: T) => string
  /** Custom deserializer function (defaults to JSON.parse) */
  deserializer?: (value: string) => T
  /** Error handler function */
  onError?: (error: Error) => void
}

/**
 * Hook for reactive localStorage with cross-tab sync
 *
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @param options - Configuration options
 * @returns Object with value, setValue, and removeValue
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): {
    value: T
    setValue: (newValue: T | ((prev: T) => T)) => void
    removeValue: () => void
  } {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError = console.error,
  } = options

  // Get initial value from storage
  let storedValue: T = initialValue

  try {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        storedValue = deserializer(item)
      }
    }
  }
  catch (error) {
    onError(error as Error)
  }

  let value = storedValue
  const listeners = new Set<(newValue: T) => void>()

  // Set value
  function setValue(newValue: T | ((prev: T) => T)) {
    try {
      // Allow value to be a function for same API as useState
      const valueToStore = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue

      value = valueToStore

      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serializer(valueToStore))
      }

      // Notify listeners
      listeners.forEach(listener => listener(valueToStore))
    }
    catch (error) {
      onError(error as Error)
    }
  }

  // Remove value
  function removeValue() {
    try {
      value = initialValue

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }

      // Notify listeners
      listeners.forEach(listener => listener(initialValue))
    }
    catch (error) {
      onError(error as Error)
    }
  }

  // Listen for storage events (changes from other tabs/windows)
  if (typeof window !== 'undefined') {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = deserializer(event.newValue)
          value = newValue
          listeners.forEach(listener => listener(newValue))
        }
        catch (error) {
          onError(error as Error)
        }
      }
      else if (event.key === key && event.newValue === null) {
        value = initialValue
        listeners.forEach(listener => listener(initialValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
  }

  return {
    value,
    setValue,
    removeValue,
  }
}
