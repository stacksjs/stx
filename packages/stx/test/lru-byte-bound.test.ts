/**
 * A cache holding rendered output is bounded in bytes, not only in entries
 * (stacksjs/stx#1945).
 *
 * `LRUCache` counted entries, which describes a footprint only while entries
 * are about one size. That held while the fragment cache took all-server
 * components -- a row, a section -- and stopped holding when a component
 * carrying a client island became eligible, because its output is tens of
 * kilobytes. 2000 of those is not a number an OOM-sensitive host can budget
 * for, and #1945 is a memory report: answering it with an unbounded cache
 * would be answering it with a larger version of the problem.
 */

import { describe, expect, it } from 'bun:test'
import { LRUCache } from '../src/performance-utils'

const sizeOf = (value: string): number => value.length

describe('LRUCache byte bounding', () => {
  it('counts entries only, when given no budget', () => {
    // Every other cache in the codebase relies on this, so the default must
    // not change shape.
    const cache = new LRUCache<string, string>(2)
    cache.set('a', 'x'.repeat(1_000_000))
    cache.set('b', 'y'.repeat(1_000_000))
    expect(cache.get('a')).toBeDefined()
    expect(cache.byteSize).toBe(0)
  })

  it('evicts to stay under the budget', () => {
    const cache = new LRUCache<string, string>(100, { maxBytes: 300, sizeOf })
    cache.set('a', 'a'.repeat(100))
    cache.set('b', 'b'.repeat(100))
    cache.set('c', 'c'.repeat(100))
    expect(cache.byteSize).toBe(300)

    cache.set('d', 'd'.repeat(100))

    // 'a' is the oldest, so it makes room rather than the budget being blown.
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('d')).toBeDefined()
    expect(cache.byteSize).toBe(300)
  })

  it('keeps the byte count honest across overwrite and delete', () => {
    // A stale count is worse than no count: it would evict a healthy cache
    // down to nothing, or stop evicting a bloated one.
    const cache = new LRUCache<string, string>(100, { maxBytes: 1000, sizeOf })
    cache.set('a', 'a'.repeat(100))
    expect(cache.byteSize).toBe(100)

    cache.set('a', 'a'.repeat(250))
    expect(cache.byteSize).toBe(250)

    cache.delete('a')
    expect(cache.byteSize).toBe(0)

    cache.set('b', 'b'.repeat(40))
    cache.clear()
    expect(cache.byteSize).toBe(0)
    expect(cache.get('b')).toBeUndefined()
  })

  it('declines a value larger than the whole budget', () => {
    // Storing it would evict everything and still not fit, leaving a cache
    // that holds one useless entry and misses on all the ones it just dropped.
    const cache = new LRUCache<string, string>(100, { maxBytes: 500, sizeOf })
    cache.set('keep', 'k'.repeat(200))
    cache.set('huge', 'h'.repeat(5000))

    expect(cache.get('huge')).toBeUndefined()
    expect(cache.get('keep')).toBeDefined()
    expect(cache.byteSize).toBe(200)
  })

  it('still honours the entry count when that binds first', () => {
    const cache = new LRUCache<string, string>(2, { maxBytes: 10_000, sizeOf })
    cache.set('a', 'a')
    cache.set('b', 'b')
    cache.set('c', 'c')

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('c')).toBeDefined()
    expect(cache.byteSize).toBe(2)
  })

  it('promotes on read, so eviction drops the least recently USED', () => {
    const cache = new LRUCache<string, string>(100, { maxBytes: 300, sizeOf })
    cache.set('a', 'a'.repeat(100))
    cache.set('b', 'b'.repeat(100))
    cache.set('c', 'c'.repeat(100))

    cache.get('a')                    // 'a' is now the most recent
    cache.set('d', 'd'.repeat(100))

    expect(cache.get('a')).toBeDefined()
    expect(cache.get('b')).toBeUndefined()
  })
})
