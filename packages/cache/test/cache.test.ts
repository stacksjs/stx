import { afterEach, describe, expect, test } from 'bun:test'
import { createCache } from '../src'
import type { Cache } from '../src'

describe('createCache', () => {
  let cache: Cache

  afterEach(async () => {
    if (cache)
      await cache.flush()
  })

  test('creates cache with default memory driver', async () => {
    cache = createCache()
    await cache.set('key', 'value')
    expect(await cache.get('key')).toBe('value')
  })

  test('creates cache with explicit memory driver', async () => {
    cache = createCache({ driver: 'memory' })
    await cache.set('key', 42)
    expect(await cache.get('key')).toBe(42)
  })

  test('creates cache with sqlite driver', async () => {
    cache = createCache({ driver: 'sqlite' })
    await cache.set('key', 'sqlite-value')
    expect(await cache.get('key')).toBe('sqlite-value')
  })
})

describe('remember', () => {
  let cache: Cache

  afterEach(async () => {
    if (cache)
      await cache.flush()
  })

  test('calls factory on cache miss', async () => {
    cache = createCache()
    let called = 0
    const result = await cache.remember('key', 3600, async () => {
      called++
      return 'computed'
    })
    expect(result).toBe('computed')
    expect(called).toBe(1)
  })

  test('returns cached value on hit (factory not called)', async () => {
    cache = createCache()
    await cache.set('key', 'existing')
    let called = 0
    const result = await cache.remember('key', 3600, async () => {
      called++
      return 'computed'
    })
    expect(result).toBe('existing')
    expect(called).toBe(0)
  })

  test('caches the factory result', async () => {
    cache = createCache()
    let called = 0
    await cache.remember('key', 3600, async () => {
      called++
      return 'first'
    })
    const result = await cache.remember('key', 3600, async () => {
      called++
      return 'second'
    })
    expect(result).toBe('first')
    expect(called).toBe(1)
  })
})

describe('tags', () => {
  let cache: Cache

  afterEach(async () => {
    if (cache)
      await cache.flush()
  })

  test('tagged cache set and get', async () => {
    cache = createCache()
    const tagged = cache.tags('posts')
    await tagged.set('post:1', { title: 'Hello' })
    expect(await tagged.get('post:1')).toEqual({ title: 'Hello' })
  })

  test('flushTag removes only tagged keys', async () => {
    cache = createCache()

    // Set an untagged value
    await cache.set('untagged', 'keep')

    // Set tagged values
    const tagged = cache.tags('posts')
    await tagged.set('post:1', 'a')
    await tagged.set('post:2', 'b')

    // Flush the tag
    await tagged.flushTag('posts')

    // Tagged values gone
    expect(await cache.get('post:1')).toBeNull()
    expect(await cache.get('post:2')).toBeNull()

    // Untagged value still exists
    expect(await cache.get('untagged')).toBe('keep')
  })

  test('flush on tagged cache flushes all active tags', async () => {
    cache = createCache()
    const tagged = cache.tags('a', 'b')
    await tagged.set('key1', 'val1')
    await tagged.set('key2', 'val2')
    await tagged.flush()
    expect(await cache.get('key1')).toBeNull()
    expect(await cache.get('key2')).toBeNull()
  })
})
