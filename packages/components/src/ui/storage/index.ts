// Storage utilities for localStorage and sessionStorage

export interface StorageOptions {
  expire?: number // Expiration in milliseconds
  namespace?: string // Prefix for keys
  encrypt?: boolean // Encrypt data (basic XOR encryption)
  compress?: boolean // Compress large objects
}

type StorageWatchCallback = (newValue: any, oldValue: any, key: string) => void

export class StorageManager {
  private storage: globalThis.Storage
  private namespace: string
  private watchers: Map<string, Set<StorageWatchCallback>> = new Map()
  private encryptionKey = 'stx-storage-key' // Simple encryption key

  constructor(type: 'local' | 'session' = 'local', namespace = '') {
    this.storage = type === 'local' ? globalThis.localStorage : globalThis.sessionStorage
    this.namespace = namespace

    // Listen for storage events from other tabs/windows
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent.bind(this))
    }
  }

  private handleStorageEvent(event: StorageEvent): void {
    if (!event.key)
      return

    const key = this.namespace && event.key.startsWith(`${this.namespace}:`)
      ? event.key.slice(this.namespace.length + 1)
      : event.key

    const callbacks = this.watchers.get(key)
    if (callbacks) {
      const oldValue = event.oldValue ? JSON.parse(event.oldValue).value : null
      const newValue = event.newValue ? JSON.parse(event.newValue).value : null
      callbacks.forEach(callback => callback(newValue, oldValue, key))
    }
  }

  private encrypt(data: string): string {
    // Simple XOR encryption (not cryptographically secure, just obfuscation)
    let result = ''
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length))
    }
    return btoa(result) // Base64 encode
  }

  private decrypt(data: string): string {
    try {
      const decoded = atob(data) // Base64 decode
      let result = ''
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length))
      }
      return result
    }
    catch {
      return data // Return as-is if decryption fails
    }
  }

  private compress(data: string): string {
    // Simple LZ-based compression for large strings
    if (data.length < 100)
      return data // Don't compress small strings

    const dict: Record<string, number> = {}
    let dictSize = 256
    const result: number[] = []
    let w = ''

    for (let i = 0; i < data.length; i++) {
      const c = data.charAt(i)
      const wc = w + c

      if (dict[wc] !== undefined) {
        w = wc
      }
      else {
        result.push(w.length > 1 ? dict[w] : w.charCodeAt(0))
        dict[wc] = dictSize++
        w = c
      }
    }

    if (w !== '') {
      result.push(w.length > 1 ? dict[w] : w.charCodeAt(0))
    }

    return JSON.stringify(result)
  }

  private decompress(data: string): string {
    try {
      const compressed = JSON.parse(data)
      if (!Array.isArray(compressed))
        return data

      const dict: Record<number, string> = {}
      let dictSize = 256
      let w = String.fromCharCode(compressed[0])
      let result = w

      for (let i = 1; i < compressed.length; i++) {
        const k = compressed[i]
        let entry: string

        if (dict[k] !== undefined) {
          entry = dict[k]
        }
        else if (k === dictSize) {
          entry = w + w.charAt(0)
        }
        else {
          return data // Decompression failed
        }

        result += entry
        dict[dictSize++] = w + entry.charAt(0)
        w = entry
      }

      return result
    }
    catch {
      return data // Return as-is if decompression fails
    }
  }

  private getKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key
  }

  set(key: string, value: any, options?: StorageOptions): void {
    const fullKey = this.getKey(key)
    const oldValue = this.get(key)

    const data = {
      value,
      timestamp: Date.now(),
      expire: options?.expire,
      encrypted: options?.encrypt || false,
      compressed: options?.compress || false,
    }

    try {
      let serialized = JSON.stringify(data)

      // Compress if enabled
      if (options?.compress) {
        serialized = this.compress(serialized)
      }

      // Encrypt if enabled
      if (options?.encrypt) {
        serialized = this.encrypt(serialized)
      }

      this.storage.setItem(fullKey, serialized)

      // Notify watchers
      this.notifyWatchers(key, value, oldValue)
    }
    catch (error) {
      console.error('Storage set error:', error)
    }
  }

  get<T = any>(key: string): T | null {
    const fullKey = this.getKey(key)

    try {
      let item = this.storage.getItem(fullKey)
      if (!item)
        return null

      // Try to decrypt if it looks encrypted (base64)
      if (item.match(/^[A-Z0-9+/]+=*$/i)) {
        try {
          item = this.decrypt(item)
        }
        catch {
          // Not encrypted, continue
        }
      }

      // Try to decompress if it looks compressed (starts with [)
      if (item.startsWith('[')) {
        try {
          item = this.decompress(item)
        }
        catch {
          // Not compressed, continue
        }
      }

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

  watch(key: string, callback: StorageWatchCallback): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set())
    }

    this.watchers.get(key)!.add(callback)

    // Return unwatch function
    return () => {
      const callbacks = this.watchers.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.watchers.delete(key)
        }
      }
    }
  }

  private notifyWatchers(key: string, newValue: any, oldValue: any): void {
    const callbacks = this.watchers.get(key)
    if (callbacks) {
      callbacks.forEach(callback => callback(newValue, oldValue, key))
    }
  }

  remove(key: string): void {
    const fullKey = this.getKey(key)
    const oldValue = this.get(key)
    this.storage.removeItem(fullKey)

    // Notify watchers
    this.notifyWatchers(key, null, oldValue)
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

  // Get storage quota information (if available)
  getQuota(): { usage: number, quota: number, percentage: number } | null {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      // Use async/await pattern but return promise
      return null // This would need to be async, but keeping sync API
    }

    // Fallback: estimate based on current data
    try {
      let totalSize = 0
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key) {
          const value = this.storage.getItem(key) || ''
          totalSize += key.length + value.length
        }
      }

      // Typical localStorage quota is 5-10MB
      const estimatedQuota = 5 * 1024 * 1024 // 5MB
      return {
        usage: totalSize * 2, // Multiply by 2 for UTF-16 encoding
        quota: estimatedQuota,
        percentage: (totalSize * 2 / estimatedQuota) * 100,
      }
    }
    catch {
      return null
    }
  }

  // Batch operations
  setMany(items: Record<string, any>, options?: StorageOptions): void {
    Object.entries(items).forEach(([key, value]) => {
      this.set(key, value, options)
    })
  }

  getMany<T = any>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {}
    keys.forEach((key) => {
      result[key] = this.get<T>(key)
    })
    return result
  }

  removeMany(keys: string[]): void {
    keys.forEach(key => this.remove(key))
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
