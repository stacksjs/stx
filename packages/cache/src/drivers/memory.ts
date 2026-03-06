import type { CacheDriver } from '../types'

interface CacheEntry {
  value: unknown
  expiresAt: number | null
  createdAt: number
}

export class MemoryDriver implements CacheDriver {
  private store = new Map<string, CacheEntry>()
  private maxSize: number
  private defaultTTL: number | undefined

  constructor(maxSize = 1000, defaultTTL?: number) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry)
      return null

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Evict oldest if at capacity and key is new
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      this.evictOldest()
    }

    const effectiveTTL = ttl ?? this.defaultTTL

    this.store.set(key, {
      value,
      expiresAt: effectiveTTL ? Date.now() + effectiveTTL * 1000 : null,
      createdAt: Date.now(),
    })
  }

  async has(key: string): Promise<boolean> {
    const result = await this.get(key)
    return result !== null
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async flush(): Promise<void> {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.store) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey)
      this.store.delete(oldestKey)
  }
}
