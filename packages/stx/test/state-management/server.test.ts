import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearStores,
  createStore,
  generateHydrationScript,
  getStore,
  hydrateStores,
  serializeStores,
  useStore,
} from '../../src/state-management'

describe('serializeStores', () => {
  afterEach(() => {
    clearStores()
  })

  it('should serialize all registered stores', () => {
    createStore(42, { name: 'counter' })
    createStore({ name: 'Alice' }, { name: 'user' })

    const serialized = serializeStores()
    const parsed = JSON.parse(serialized)

    expect(parsed.counter).toBe(42)
    expect(parsed.user).toEqual({ name: 'Alice' })
  })

  it('should return empty object for no stores', () => {
    const serialized = serializeStores()
    expect(serialized).toBe('{}')
  })
})

describe('hydrateStores', () => {
  afterEach(() => {
    clearStores()
  })

  it('should hydrate existing stores', () => {
    createStore(0, { name: 'counter' })
    createStore({ name: '' }, { name: 'user' })

    const serialized = JSON.stringify({
      counter: 100,
      user: { name: 'Bob' },
    })

    hydrateStores(serialized)

    expect(getStore<number>('counter')?.get()).toBe(100)
    expect(getStore<{ name: string }>('user')?.get()).toEqual({ name: 'Bob' })
  })

  it('should ignore non-existent stores', () => {
    createStore(0, { name: 'existing' })

    const serialized = JSON.stringify({
      existing: 50,
      nonexistent: 999,
    })

    hydrateStores(serialized)

    expect(getStore<number>('existing')?.get()).toBe(50)
    expect(getStore('nonexistent')).toBeUndefined()
  })

  it('should handle invalid JSON gracefully', () => {
    createStore(42, { name: 'safe' })

    // Should not throw
    hydrateStores('invalid json {{{')

    // Store should be unchanged
    expect(getStore<number>('safe')?.get()).toBe(42)
  })
})

describe('generateHydrationScript', () => {
  afterEach(() => {
    clearStores()
  })

  it('should generate script tag with store state', () => {
    createStore(10, { name: 'count' })

    const script = generateHydrationScript()

    expect(script).toContain('<script>')
    expect(script).toContain('</script>')
    expect(script).toContain('window.__STX_STORE_STATE__')
    expect(script).toContain('"count":10')
  })

  it('should include hydration callback', () => {
    createStore(0, { name: 'test' })

    const script = generateHydrationScript()

    expect(script).toContain('__STX_HYDRATE_STORES__')
  })
})

describe('useStore', () => {
  afterEach(() => {
    clearStores()
  })

  it('should get store value by name', () => {
    createStore({ message: 'Hello' }, { name: 'greeting' })

    const value = useStore<{ message: string }>('greeting')
    expect(value).toEqual({ message: 'Hello' })
  })

  it('should get store value from store instance', () => {
    const store = createStore(42)

    const value = useStore(store)
    expect(value).toBe(42)
  })

  it('should throw for non-existent store name', () => {
    expect(() => {
      useStore('missing')
    }).toThrow('Store "missing" not found')
  })
})
