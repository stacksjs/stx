import type { ComponentInstance, KeepAlive } from '../../src/utils/keep-alive'
import { beforeEach, describe, expect, it } from 'bun:test'
import {

  createComponentPool,
  createKeepAlive,
  createLRUCache,
  createStateManager,

} from '../../src/utils/keep-alive'

describe('KeepAlive', () => {
  let keepAlive: KeepAlive

  beforeEach(() => {
    keepAlive = createKeepAlive({ max: 5 })
  })

  describe('createKeepAlive', () => {
    it('should create a KeepAlive manager', () => {
      expect(keepAlive).toBeDefined()
      expect(typeof keepAlive.cache).toBe('function')
      expect(typeof keepAlive.get).toBe('function')
      expect(typeof keepAlive.has).toBe('function')
    })

    it('should have initial size of 0', () => {
      expect(keepAlive.size()).toBe(0)
    })
  })

  describe('cache', () => {
    it('should cache a component instance', () => {
      const instance: ComponentInstance = {
        id: 'comp-1',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }

      const cached = keepAlive.cache('comp-1', instance)

      expect(cached).toBeDefined()
      expect(cached.id).toBe('comp-1')
      expect(keepAlive.size()).toBe(1)
    })

    it('should preserve component state', () => {
      const instance: ComponentInstance = {
        id: 'comp-1',
        type: 'button',
        state: { count: 5, name: 'test' },
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }

      keepAlive.cache('comp-1', instance)
      const cached = keepAlive.get('comp-1')

      expect(cached?.state).toEqual({ count: 5, name: 'test' })
    })

    it('should call onMount hook when caching', () => {
      let mounted = false

      const instance: ComponentInstance = {
        id: 'comp-1',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }

      keepAlive.cache('comp-1', instance, {
        onMount: () => { mounted = true },
      })

      expect(mounted).toBe(true)
    })

    it('should respect max size and evict LRU', () => {
      const ka = createKeepAlive({ max: 3 })

      // Cache 3 components
      for (let i = 1; i <= 3; i++) {
        ka.cache(`comp-${i}`, {
          id: `comp-${i}`,
          type: 'button',
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
        })
      }

      expect(ka.size()).toBe(3)

      // Cache 4th component (should evict first)
      ka.cache('comp-4', {
        id: 'comp-4',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      })

      expect(ka.size()).toBe(3)
      expect(ka.has('comp-1')).toBe(false) // Evicted (LRU)
      expect(ka.has('comp-4')).toBe(true) // New one
    })
  })

  describe('get', () => {
    it('should retrieve cached component', () => {
      const instance: ComponentInstance = {
        id: 'comp-1',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }

      keepAlive.cache('comp-1', instance)
      const retrieved = keepAlive.get('comp-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('comp-1')
    })

    it('should return null for non-existent key', () => {
      const retrieved = keepAlive.get('non-existent')
      expect(retrieved).toBeNull()
    })

    it('should update LRU order on access', () => {
      const ka = createKeepAlive({ max: 3 })

      // Cache 3 components
      ka.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      ka.cache('comp-2', { id: 'comp-2', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      ka.cache('comp-3', { id: 'comp-3', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })

      // Access comp-1 (moves to end - most recently used)
      ka.get('comp-1')

      // Cache 4th component (should evict comp-2, not comp-1)
      ka.cache('comp-4', { id: 'comp-4', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })

      expect(ka.has('comp-1')).toBe(true) // Still cached (was accessed)
      expect(ka.has('comp-2')).toBe(false) // Evicted (LRU)
    })
  })

  describe('has', () => {
    it('should return true for cached component', () => {
      keepAlive.cache('comp-1', {
        id: 'comp-1',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      })

      expect(keepAlive.has('comp-1')).toBe(true)
    })

    it('should return false for non-cached component', () => {
      expect(keepAlive.has('non-existent')).toBe(false)
    })
  })

  describe('remove', () => {
    it('should remove cached component', () => {
      keepAlive.cache('comp-1', {
        id: 'comp-1',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      })

      expect(keepAlive.has('comp-1')).toBe(true)

      const removed = keepAlive.remove('comp-1')

      expect(removed).toBe(true)
      expect(keepAlive.has('comp-1')).toBe(false)
    })

    it('should call onUnmount hook when removing', () => {
      let unmounted = false

      keepAlive.cache('comp-1', {
        id: 'comp-1',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }, {
        onUnmount: () => { unmounted = true },
      })

      keepAlive.remove('comp-1')

      expect(unmounted).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear all cached components', () => {
      keepAlive.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      keepAlive.cache('comp-2', { id: 'comp-2', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      keepAlive.cache('comp-3', { id: 'comp-3', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })

      expect(keepAlive.size()).toBe(3)

      keepAlive.clear()

      expect(keepAlive.size()).toBe(0)
    })

    it('should call onUnmount hooks for all components', () => {
      let unmountCount = 0

      keepAlive.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() }, {
        onUnmount: () => { unmountCount++ },
      })
      keepAlive.cache('comp-2', { id: 'comp-2', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() }, {
        onUnmount: () => { unmountCount++ },
      })

      keepAlive.clear()

      expect(unmountCount).toBe(2)
    })
  })

  describe('prune', () => {
    it('should prune expired entries', async () => {
      const ka = createKeepAlive({ max: 5, ttl: 100 }) // 100ms TTL

      ka.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })

      expect(ka.size()).toBe(1)

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150))

      const pruned = ka.prune()

      expect(pruned).toBeGreaterThan(0)
      expect(ka.size()).toBe(0)
    })

    it('should prune excess entries when over max', () => {
      const ka = createKeepAlive({ max: 2 })

      ka.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      ka.cache('comp-2', { id: 'comp-2', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      ka.cache('comp-3', { id: 'comp-3', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })

      // Should have evicted automatically, but test explicit prune
      expect(ka.size()).toBe(2)
    })
  })

  describe('activate/deactivate', () => {
    it('should activate cached component', () => {
      let activated = false

      keepAlive.cache('comp-1', {
        id: 'comp-1',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }, {
        onActivate: () => { activated = true },
      })

      const instance = keepAlive.activate('comp-1')

      expect(instance).toBeDefined()
      expect(activated).toBe(true)
    })

    it('should deactivate component', () => {
      let deactivated = false

      keepAlive.cache('comp-1', {
        id: 'comp-1',
        type: 'button',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }, {
        onDeactivate: () => { deactivated = true },
      })

      const success = keepAlive.deactivate('comp-1')

      expect(success).toBe(true)
      expect(deactivated).toBe(true)
    })

    it('should save state on deactivate', () => {
      keepAlive.cache('comp-1', {
        id: 'comp-1',
        type: 'button',
        state: { count: 0 },
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }, {
        onSave: instance => ({ count: 10 }),
      })

      keepAlive.deactivate('comp-1')

      const instance = keepAlive.get('comp-1')
      expect(instance?.state).toEqual({ count: 10 })
    })

    it('should restore state on activate', () => {
      let restored = false
      let restoredState: any = null

      keepAlive.cache('comp-1', {
        id: 'comp-1',
        type: 'button',
        state: { count: 5 },
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      }, {
        onRestore: (instance, state) => {
          restored = true
          restoredState = state
        },
      })

      keepAlive.activate('comp-1')

      expect(restored).toBe(true)
      expect(restoredState).toEqual({ count: 5 })
    })
  })

  describe('getStats', () => {
    it('should return cache statistics', () => {
      keepAlive.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      keepAlive.get('comp-1') // Hit
      keepAlive.get('comp-2') // Miss

      const stats = keepAlive.getStats()

      expect(stats.size).toBe(1)
      expect(stats.max).toBe(5)
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(0.5)
      expect(stats.keys).toEqual(['comp-1'])
    })
  })

  describe('include/exclude', () => {
    it('should include only specified types', () => {
      const ka = createKeepAlive({
        max: 5,
        include: ['button', 'input'],
      })

      ka.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      ka.cache('comp-2', { id: 'comp-2', type: 'div', createdAt: Date.now(), lastAccessedAt: Date.now() })

      expect(ka.has('comp-1')).toBe(true) // Included
      expect(ka.has('comp-2')).toBe(false) // Not included
    })

    it('should exclude specified types', () => {
      const ka = createKeepAlive({
        max: 5,
        exclude: ['div'],
      })

      ka.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      ka.cache('comp-2', { id: 'comp-2', type: 'div', createdAt: Date.now(), lastAccessedAt: Date.now() })

      expect(ka.has('comp-1')).toBe(true) // Not excluded
      expect(ka.has('comp-2')).toBe(false) // Excluded
    })

    it('should support regex patterns', () => {
      const ka = createKeepAlive({
        max: 5,
        include: /^user-/,
      })

      ka.cache('comp-1', { id: 'comp-1', type: 'user-profile', createdAt: Date.now(), lastAccessedAt: Date.now() })
      ka.cache('comp-2', { id: 'comp-2', type: 'admin-panel', createdAt: Date.now(), lastAccessedAt: Date.now() })

      expect(ka.has('comp-1')).toBe(true) // Matches pattern
      expect(ka.has('comp-2')).toBe(false) // Doesn't match
    })
  })

  describe('keys', () => {
    it('should return all cached keys', () => {
      keepAlive.cache('comp-1', { id: 'comp-1', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })
      keepAlive.cache('comp-2', { id: 'comp-2', type: 'button', createdAt: Date.now(), lastAccessedAt: Date.now() })

      const keys = keepAlive.keys()

      expect(keys).toContain('comp-1')
      expect(keys).toContain('comp-2')
      expect(keys.length).toBe(2)
    })
  })
})

describe('createLRUCache', () => {
  it('should create an LRU cache', () => {
    const cache = createLRUCache<string>(3)

    expect(cache).toBeDefined()
    expect(cache.size).toBe(0)
  })

  it('should set and get values', () => {
    const cache = createLRUCache<string>(3)

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    expect(cache.get('key1')).toBe('value1')
    expect(cache.get('key2')).toBe('value2')
  })

  it('should evict least recently used', () => {
    const cache = createLRUCache<string>(3)

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.set('key3', 'value3')

    // All 3 cached
    expect(cache.size).toBe(3)

    // Add 4th (should evict key1)
    cache.set('key4', 'value4')

    expect(cache.size).toBe(3)
    expect(cache.has('key1')).toBe(false) // Evicted
    expect(cache.has('key4')).toBe(true)
  })

  it('should update LRU order on get', () => {
    const cache = createLRUCache<string>(3)

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.set('key3', 'value3')

    // Access key1 (moves to end)
    cache.get('key1')

    // Add 4th (should evict key2, not key1)
    cache.set('key4', 'value4')

    expect(cache.has('key1')).toBe(true) // Still there
    expect(cache.has('key2')).toBe(false) // Evicted
  })

  it('should delete keys', () => {
    const cache = createLRUCache<string>(3)

    cache.set('key1', 'value1')
    expect(cache.has('key1')).toBe(true)

    cache.delete('key1')
    expect(cache.has('key1')).toBe(false)
  })

  it('should clear all entries', () => {
    const cache = createLRUCache<string>(3)

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    expect(cache.size).toBe(2)

    cache.clear()

    expect(cache.size).toBe(0)
  })

  it('should return all keys', () => {
    const cache = createLRUCache<string>(3)

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    const keys = cache.keys()

    expect(keys).toContain('key1')
    expect(keys).toContain('key2')
  })

  it('should return all values', () => {
    const cache = createLRUCache<string>(3)

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    const values = cache.values()

    expect(values).toContain('value1')
    expect(values).toContain('value2')
  })

  it('should iterate over entries', () => {
    const cache = createLRUCache<string>(3)

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    let count = 0
    cache.forEach((value, key) => {
      expect(typeof value).toBe('string')
      expect(typeof key).toBe('string')
      count++
    })

    expect(count).toBe(2)
  })
})

describe('createStateManager', () => {
  it('should create a state manager', () => {
    const manager = createStateManager()

    expect(manager).toBeDefined()
    expect(typeof manager.save).toBe('function')
    expect(typeof manager.restore).toBe('function')
  })

  it('should save and restore state', () => {
    const manager = createStateManager()

    manager.save('comp-1', { count: 5, name: 'test' })

    const state = manager.restore('comp-1')

    expect(state).toEqual({ count: 5, name: 'test' })
  })

  it('should return null for non-existent state', () => {
    const manager = createStateManager()

    const state = manager.restore('non-existent')

    expect(state).toBeNull()
  })

  it('should deep clone state to prevent mutations', () => {
    const manager = createStateManager()

    const original = { count: 5, nested: { value: 10 } }
    manager.save('comp-1', original)

    // Mutate original
    original.count = 100
    original.nested.value = 200

    // Restored should be unchanged
    const state = manager.restore('comp-1')
    expect(state).toEqual({ count: 5, nested: { value: 10 } })
  })

  it('should check if state exists', () => {
    const manager = createStateManager()

    manager.save('comp-1', { count: 5 })

    expect(manager.has('comp-1')).toBe(true)
    expect(manager.has('comp-2')).toBe(false)
  })

  it('should remove saved state', () => {
    const manager = createStateManager()

    manager.save('comp-1', { count: 5 })
    expect(manager.has('comp-1')).toBe(true)

    manager.remove('comp-1')
    expect(manager.has('comp-1')).toBe(false)
  })

  it('should clear all states', () => {
    const manager = createStateManager()

    manager.save('comp-1', { count: 5 })
    manager.save('comp-2', { count: 10 })

    expect(manager.size).toBe(2)

    manager.clear()

    expect(manager.size).toBe(0)
  })

  it('should return all state keys', () => {
    const manager = createStateManager()

    manager.save('comp-1', { count: 5 })
    manager.save('comp-2', { count: 10 })

    const keys = manager.keys()

    expect(keys).toContain('comp-1')
    expect(keys).toContain('comp-2')
  })
})

describe('createComponentPool', () => {
  it('should create a component pool', () => {
    const pool = createComponentPool(() => ({ id: '', type: '' }))

    expect(pool).toBeDefined()
    expect(typeof pool.acquire).toBe('function')
    expect(typeof pool.release).toBe('function')
  })

  it('should acquire new instances', () => {
    let counter = 0
    const pool = createComponentPool(() => ({ id: `comp-${++counter}`, type: 'button' }))

    const instance1 = pool.acquire()
    const instance2 = pool.acquire()

    expect(instance1.id).toBe('comp-1')
    expect(instance2.id).toBe('comp-2')
  })

  it('should reuse released instances', () => {
    let counter = 0
    const pool = createComponentPool(() => ({ id: `comp-${++counter}`, type: 'button' }))

    const instance1 = pool.acquire()
    pool.release(instance1)

    const instance2 = pool.acquire()

    // Should get same instance back
    expect(instance2).toBe(instance1)
    expect(counter).toBe(1) // Only created once
  })

  it('should respect max size', () => {
    const pool = createComponentPool(
      () => ({ id: '', type: '' }),
      { maxSize: 2 },
    )

    const inst1 = pool.acquire()
    const inst2 = pool.acquire()
    const inst3 = pool.acquire()

    pool.release(inst1)
    pool.release(inst2)
    pool.release(inst3)

    // Pool should only hold 2
    expect(pool.size).toBe(2)
  })

  it('should reset instances on release', () => {
    const pool = createComponentPool(
      () => ({ id: '', type: '', count: 0 }),
      {
        reset: (instance) => {
          instance.id = ''
          instance.type = ''
          instance.count = 0
        },
      },
    )

    const instance = pool.acquire()
    instance.id = 'modified'
    instance.count = 100

    pool.release(instance)

    const reused = pool.acquire()
    expect(reused.id).toBe('')
    expect(reused.count).toBe(0)
  })

  it('should clear the pool', () => {
    const pool = createComponentPool(() => ({ id: '', type: '' }))

    const inst1 = pool.acquire()
    const inst2 = pool.acquire()

    pool.release(inst1)
    pool.release(inst2)

    expect(pool.size).toBe(2)

    pool.clear()

    expect(pool.size).toBe(0)
  })

  it('should return max size', () => {
    const pool = createComponentPool(
      () => ({ id: '', type: '' }),
      { maxSize: 50 },
    )

    expect(pool.maxSize).toBe(50)
  })
})
