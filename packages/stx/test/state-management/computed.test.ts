import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearStores,
  computed,
  createMemoizedSelector,
  createSelector,
  createStore,
} from '../../src/state-management'

describe('computed', () => {
  afterEach(() => {
    clearStores()
  })

  it('should create a computed value from one store', () => {
    const count = createStore(5)
    const doubled = computed([count] as const, (c: number) => c * 2)

    expect(doubled.get()).toBe(10)
  })

  it('should update when source store changes', () => {
    const count = createStore(5)
    const doubled = computed([count] as const, (c: number) => c * 2)

    count.set(10)
    expect(doubled.get()).toBe(20)
  })

  it('should combine multiple stores', () => {
    const a = createStore(10)
    const b = createStore(20)
    const sum = computed([a, b] as const, (aVal: number, bVal: number) => aVal + bVal)

    expect(sum.get()).toBe(30)

    a.set(15)
    expect(sum.get()).toBe(35)

    b.set(25)
    expect(sum.get()).toBe(40)
  })

  it('should notify subscribers when computed value changes', () => {
    const count = createStore(1)
    const doubled = computed([count] as const, (c: number) => c * 2)

    const values: number[] = []
    doubled.subscribe(value => values.push(value))

    count.set(2)
    count.set(3)

    expect(values).toEqual([4, 6])
  })

  it('should not notify when computed value is the same', () => {
    const count = createStore(2)
    // Always returns 'even' or 'odd'
    const parity = computed([count] as const, (c: number) => (c % 2 === 0 ? 'even' : 'odd'))

    let notifyCount = 0
    parity.subscribe(() => {
      notifyCount++
    })

    count.set(4) // Still 'even'
    count.set(6) // Still 'even'

    expect(notifyCount).toBe(0)

    count.set(3) // Now 'odd'
    expect(notifyCount).toBe(1)
  })

  it('should throw when trying to set computed', () => {
    const count = createStore(5)
    const doubled = computed([count] as const, (c: number) => c * 2)

    expect(() => {
      doubled.set(10)
    }).toThrow('Cannot set a computed store')
  })

  it('should throw when trying to update computed', () => {
    const count = createStore(5)
    const doubled = computed([count] as const, (c: number) => c * 2)

    expect(() => {
      doubled.update({} as any)
    }).toThrow('Cannot update a computed store')
  })

  it('should throw when trying to reset computed', () => {
    const count = createStore(5)
    const doubled = computed([count] as const, (c: number) => c * 2)

    expect(() => {
      doubled.reset()
    }).toThrow('Cannot reset a computed store')
  })

  it('should cleanup subscriptions on destroy', () => {
    const count = createStore(5)
    const doubled = computed([count] as const, (c: number) => c * 2)

    let notified = false
    doubled.subscribe(() => {
      notified = true
    })

    doubled.destroy()
    count.set(10)

    expect(notified).toBe(false)
  })
})

describe('createSelector', () => {
  afterEach(() => {
    clearStores()
  })

  it('should create a selector from a store', () => {
    const user = createStore({ name: 'Alice', age: 30 })
    const name = createSelector(user, u => u.name)

    expect(name.get()).toBe('Alice')
  })

  it('should update when source changes', () => {
    const user = createStore({ name: 'Alice', age: 30 })
    const name = createSelector(user, u => u.name)

    user.update({ name: 'Bob' })
    expect(name.get()).toBe('Bob')
  })
})

describe('createMemoizedSelector', () => {
  afterEach(() => {
    clearStores()
  })

  it('should memoize selector results', () => {
    let computeCount = 0
    const store = createStore({ items: [1, 2, 3], filter: 'all' })

    const filtered = createMemoizedSelector(
      store,
      (state) => {
        computeCount++
        return state.items.filter(x => x > 0)
      },
      state => [state.items], // Only recompute when items change
    )

    // Initial computation
    filtered.get()
    expect(computeCount).toBe(1)

    // Filter changes, but items don't - should not recompute
    store.update({ filter: 'active' })
    filtered.get()
    expect(computeCount).toBe(1)

    // Items change - should recompute
    store.update({ items: [1, 2, 3, 4] })
    filtered.get()
    expect(computeCount).toBe(2)
  })
})
