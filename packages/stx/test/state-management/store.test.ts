import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearStores,
  createStore,
  getStore,
  getStoreNames,
  hasStore,
} from '../../src/state-management'

describe('createStore', () => {
  afterEach(() => {
    clearStores()
  })

  it('should create a store with initial value', () => {
    const store = createStore(0)
    expect(store.get()).toBe(0)
  })

  it('should create a store with object value', () => {
    const store = createStore({ count: 0, name: 'test' })
    expect(store.get()).toEqual({ count: 0, name: 'test' })
  })

  it('should set a new value', () => {
    const store = createStore(0)
    store.set(5)
    expect(store.get()).toBe(5)
  })

  it('should set with updater function', () => {
    const store = createStore(10)
    store.set(prev => prev + 5)
    expect(store.get()).toBe(15)
  })

  it('should notify subscribers on change', () => {
    const store = createStore(0)
    const values: number[] = []

    store.subscribe((value) => {
      values.push(value)
    })

    store.set(1)
    store.set(2)
    store.set(3)

    expect(values).toEqual([1, 2, 3])
  })

  it('should provide previous value to subscribers', () => {
    const store = createStore(0)
    let prev: number | undefined

    store.subscribe((_value, previousValue) => {
      prev = previousValue
    })

    store.set(10)
    expect(prev).toBe(0)

    store.set(20)
    expect(prev).toBe(10)
  })

  it('should not notify if value is equal', () => {
    const store = createStore(5)
    let notifyCount = 0

    store.subscribe(() => {
      notifyCount++
    })

    store.set(5) // Same value
    store.set(5) // Same value again

    expect(notifyCount).toBe(0)
  })

  it('should unsubscribe correctly', () => {
    const store = createStore(0)
    let notified = false

    const unsub = store.subscribe(() => {
      notified = true
    })

    unsub()
    store.set(10)

    expect(notified).toBe(false)
  })

  it('should update partial state for objects', () => {
    const store = createStore({ name: 'Alice', age: 30 })
    store.update({ age: 31 })

    expect(store.get()).toEqual({ name: 'Alice', age: 31 })
  })

  it('should update with updater function', () => {
    const store = createStore({ count: 0 })
    store.update(prev => ({ count: prev.count + 1 }))

    expect(store.get()).toEqual({ count: 1 })
  })

  it('should throw when updating non-object store', () => {
    const store = createStore(5)

    expect(() => {
      store.update({} as any)
    }).toThrow('update() can only be used with object stores')
  })

  it('should reset to initial value', () => {
    const store = createStore({ count: 0 })
    store.set({ count: 100 })
    store.reset()

    expect(store.get()).toEqual({ count: 0 })
  })

  it('should have optional name', () => {
    const unnamed = createStore(0)
    const named = createStore(0, { name: 'counter' })

    expect(unnamed.name).toBeUndefined()
    expect(named.name).toBe('counter')
  })

  it('should destroy store correctly', () => {
    const store = createStore(0, { name: 'destroyable' })
    let notified = false

    store.subscribe(() => {
      notified = true
    })

    store.destroy()

    // Should not notify after destroy
    store.set(10)
    expect(notified).toBe(false)

    // Should be removed from registry
    expect(hasStore('destroyable')).toBe(false)
  })
})

describe('store registry', () => {
  afterEach(() => {
    clearStores()
  })

  it('should register named store', () => {
    createStore(0, { name: 'counter' })
    expect(hasStore('counter')).toBe(true)
  })

  it('should not register unnamed store', () => {
    createStore(0)
    expect(getStoreNames()).toEqual([])
  })

  it('should get registered store', () => {
    const store = createStore(42, { name: 'answer' })
    const retrieved = getStore<number>('answer')

    expect(retrieved).toBe(store)
    expect(retrieved?.get()).toBe(42)
  })

  it('should return undefined for non-existent store', () => {
    expect(getStore('missing')).toBeUndefined()
  })

  it('should list all store names', () => {
    createStore(0, { name: 'a' })
    createStore(0, { name: 'b' })
    createStore(0, { name: 'c' })

    const names = getStoreNames()
    expect(names).toContain('a')
    expect(names).toContain('b')
    expect(names).toContain('c')
  })

  it('should clear all stores', () => {
    createStore(0, { name: 'a' })
    createStore(0, { name: 'b' })

    clearStores()

    expect(getStoreNames()).toEqual([])
    expect(hasStore('a')).toBe(false)
    expect(hasStore('b')).toBe(false)
  })
})

describe('store with custom equality', () => {
  afterEach(() => {
    clearStores()
  })

  it('should use custom equality function', () => {
    const store = createStore(
      { id: 1, name: 'test' },
      {
        equals: (a, b) => a.id === b.id, // Only compare by id
      },
    )

    let notified = false
    store.subscribe(() => {
      notified = true
    })

    // Same id, different name - should not notify
    store.set({ id: 1, name: 'changed' })
    expect(notified).toBe(false)

    // Different id - should notify
    store.set({ id: 2, name: 'changed' })
    expect(notified).toBe(true)
  })
})
