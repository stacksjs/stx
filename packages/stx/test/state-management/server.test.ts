import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearStores,
  createStore,
  useStore,
} from '../../src/state-management'

// serializeStores / hydrateStores / generateHydrationScript were removed as dead
// SSR-hydration code (stacksjs/stx#1868 Ask 3) — nothing called them — so their
// tests went with them. useStore below is live and stays.

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
