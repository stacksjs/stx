import { describe, expect, test } from 'bun:test'
import { boundedCache } from '../src/serve'

/**
 * The cache behind the generated Crosswind CSS.
 *
 * It is keyed by the *rendered page's* class set, not by the template's - a
 * page carrying `search-state-open` and one carrying `search-state-closed` are
 * two entries. On a public site being walked by a crawler that is effectively
 * an unlimited number of keys, each holding a stylesheet, and the map that
 * held them only ever grew: one deployed server went from 230MB to 2.1GB in an
 * hour of ordinary traffic and was throttled by the kernel into answering
 * nothing while still reporting itself healthy.
 *
 * So what is pinned here is that it forgets, and that it forgets the right
 * one: an LRU that evicts something still in use is a cache that costs memory
 * and never hits.
 */
describe('a cache that forgets', () => {
  test('keeps what it is given, up to its limit', () => {
    const cache = boundedCache<string>(3)

    for (const key of ['a', 'b', 'c'])
      cache.remember(key, `css:${key}`)

    expect(cache.size).toBe(3)
    expect(cache.read('a')).toBe('css:a')
  })

  test('evicts the coldest entry rather than growing', () => {
    const cache = boundedCache<string>(3)

    for (const key of ['a', 'b', 'c', 'd'])
      cache.remember(key, `css:${key}`)

    expect(cache.size).toBe(3)
    expect(cache.read('a')).toBeUndefined()
    expect(cache.read('d')).toBe('css:d')
  })

  test('a read is what keeps an entry warm', () => {
    // The difference between an LRU and a queue, and the difference between a
    // cache that hits on a busy site and one that does not: the page rendered
    // on every request must not be evicted by the long tail behind it.
    const cache = boundedCache<string>(3)

    for (const key of ['a', 'b', 'c'])
      cache.remember(key, `css:${key}`)

    expect(cache.read('a')).toBe('css:a')
    cache.remember('d', 'css:d')

    expect(cache.read('a')).toBe('css:a')
    expect(cache.read('b')).toBeUndefined()
  })

  test('holds no more than it was asked to, however much is written', () => {
    const cache = boundedCache<string>(50)

    for (let i = 0; i < 5000; i++)
      cache.remember(`class-set-${i}`, 'x'.repeat(64))

    expect(cache.size).toBe(50)
  })

  test('a nonsense limit still holds something', () => {
    // Zero would evict what was just written, so every read misses and the
    // cache costs memory and time to hold nothing.
    const cache = boundedCache<string>(0)

    cache.remember('a', 'css:a')

    expect(cache.read('a')).toBe('css:a')
  })

  test('and it can still be emptied, which is what the watcher does', () => {
    const cache = boundedCache<string>(10)

    cache.remember('a', 'css:a')
    cache.clear()

    expect(cache.size).toBe(0)
    expect(cache.read('a')).toBeUndefined()
  })
})
