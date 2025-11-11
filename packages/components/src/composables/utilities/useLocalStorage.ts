// Reactive localStorage hook

export interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string
  deserializer?: (value: string) => T
  onError?: (error: Error) => void
}

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
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue

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
