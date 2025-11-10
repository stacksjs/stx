// Storage utilities for localStorage and sessionStorage

export interface StorageOptions {
  expire?: number // Expiration in milliseconds
  namespace?: string // Prefix for keys
}

export class StorageManager {
  private storage: globalThis.Storage
  private namespace: string

  constructor(type: 'local' | 'session' = 'local', namespace = '') {
    this.storage = type === 'local' ? globalThis.localStorage : globalThis.sessionStorage
    this.namespace = namespace
  }

  private getKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key
  }

  set(key: string, value: any, options?: StorageOptions): void {
    const fullKey = this.getKey(key)
    const data = {
      value,
      timestamp: Date.now(),
      expire: options?.expire,
    }

    try {
      this.storage.setItem(fullKey, JSON.stringify(data))
    }
    catch (error) {
      console.error('Storage set error:', error)
    }
  }

  get<T = any>(key: string): T | null {
    const fullKey = this.getKey(key)

    try {
      const item = this.storage.getItem(fullKey)
      if (!item)
        return null

      const data = JSON.parse(item)

      // Check expiration
      if (data.expire && Date.now() - data.timestamp > data.expire) {
        this.remove(key)
        return null
      }

      return data.value as T
    }
    catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  }

  remove(key: string): void {
    const fullKey = this.getKey(key)
    this.storage.removeItem(fullKey)
  }

  clear(): void {
    if (this.namespace) {
      // Clear only namespaced items
      const keys = this.keys()
      keys.forEach(key => this.remove(key))
    }
    else {
      this.storage.clear()
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  keys(): string[] {
    const allKeys = Object.keys(this.storage)

    if (this.namespace) {
      const prefix = `${this.namespace}:`
      return allKeys
        .filter(key => key.startsWith(prefix))
        .map(key => key.slice(prefix.length))
    }

    return allKeys
  }

  size(): number {
    return this.keys().length
  }
}

// Convenience exports
export const storage: {
  local: StorageManager
  session: StorageManager
} = {
  local: new StorageManager('local'),
  session: new StorageManager('session'),
}

export function createStorage(type: 'local' | 'session' = 'local', namespace?: string): StorageManager {
  return new StorageManager(type, namespace)
}
