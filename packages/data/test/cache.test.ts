import { afterEach, describe, expect, test } from 'bun:test'
import { clearDataCache, getCached, invalidateCache, setCached, staleWhileRevalidate } from '../src/cache'

describe('data cache', () => {
  afterEach(() => {
    clearDataCache()
  })

  test('stores and retrieves cached values', () => {
    setCached('key', { name: 'test' }, 60000)
    expect(getCached('key')).toEqual({ name: 'test' })
  })

  test('returns null for missing keys', () => {
    expect(getCached('missing')).toBeNull()
  })

  test('expires entries based on TTL', () => {
    setCached('key', 'value', 0) // TTL of 0ms = immediately expired
    // Wait a tick for the timestamp to age
    expect(getCached('key')).toBeNull()
  })

  test('invalidates specific keys', () => {
    setCached('a', 1, 60000)
    setCached('b', 2, 60000)
    invalidateCache('a')
    expect(getCached('a')).toBeNull()
    expect(getCached('b')).toBe(2)
  })

  test('clears all cache entries', () => {
    setCached('a', 1, 60000)
    setCached('b', 2, 60000)
    clearDataCache()
    expect(getCached('a')).toBeNull()
    expect(getCached('b')).toBeNull()
  })
})

describe('staleWhileRevalidate', () => {
  afterEach(() => {
    clearDataCache()
  })

  test('fetches fresh data on cache miss', async () => {
    const result = await staleWhileRevalidate('key', async () => 42, 60000)
    expect(result).toBe(42)
  })

  test('returns stale data and revalidates in background', async () => {
    setCached('key', 'old', 60000)
    let fetchCount = 0
    const result = await staleWhileRevalidate('key', async () => {
      fetchCount++
      return 'new'
    }, 60000)

    expect(result).toBe('old')
    // Give background revalidation time to complete
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(fetchCount).toBe(1)
    expect(getCached('key')).toBe('new')
  })
})
