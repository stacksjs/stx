import type { CacheEntry } from './types'

const dataCache = new Map<string, CacheEntry>()

export function getCached<T>(key: string): T | null {
  const entry = dataCache.get(key)
  if (!entry) return null

  const age = Date.now() - entry.timestamp
  if (entry.ttl === 0 || age > entry.ttl) {
    dataCache.delete(key)
    return null
  }

  return entry.value as T
}

export function setCached<T>(key: string, value: T, ttl: number): void {
  dataCache.set(key, {
    value,
    timestamp: Date.now(),
    ttl,
  })
}

export function invalidateCache(key: string): void {
  dataCache.delete(key)
}

export function clearDataCache(): void {
  dataCache.clear()
}

export async function staleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
): Promise<T> {
  const cached = getCached<T>(key)

  if (cached !== null) {
    // Revalidate in background
    fetcher().then(fresh => setCached(key, fresh, ttl)).catch(() => {})
    return cached
  }

  const fresh = await fetcher()
  setCached(key, fresh, ttl)
  return fresh
}
