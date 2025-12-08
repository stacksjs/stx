import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearStores,
  createStore,
  immerMiddleware,
  throttleMiddleware,
  validationMiddleware,
} from '../../src/state-management'

describe('validationMiddleware', () => {
  afterEach(() => {
    clearStores()
  })

  it('should allow valid values', () => {
    const store = createStore(0, {
      middleware: [
        validationMiddleware(value => value >= 0),
      ],
    })

    store.set(10)
    expect(store.get()).toBe(10)
  })

  it('should reject invalid values', () => {
    const store = createStore(0, {
      middleware: [
        validationMiddleware(value => value >= 0),
      ],
    })

    store.set(-5)
    // Should not change
    expect(store.get()).toBe(0)
  })

  it('should accept error message string', () => {
    const store = createStore(0, {
      middleware: [
        validationMiddleware(value =>
          value >= 0 ? true : 'Value must be non-negative',
        ),
      ],
    })

    store.set(-5)
    expect(store.get()).toBe(0)
  })
})

describe('immerMiddleware', () => {
  afterEach(() => {
    clearStores()
  })

  it('should deep clone values', () => {
    const original = { nested: { value: 1 } }
    const store = createStore(original, {
      middleware: [immerMiddleware()],
    })

    const newValue = { nested: { value: 2 } }
    store.set(newValue)

    // Values should be equal but not same reference
    expect(store.get()).toEqual({ nested: { value: 2 } })
    expect(store.get()).not.toBe(newValue)
    expect(store.get().nested).not.toBe(newValue.nested)
  })
})

describe('throttleMiddleware', () => {
  afterEach(() => {
    clearStores()
  })

  it('should throttle updates', async () => {
    const values: number[] = []
    const store = createStore(0, {
      middleware: [throttleMiddleware(50)],
    })

    store.subscribe(value => values.push(value))

    // Rapid updates
    store.set(1)
    store.set(2)
    store.set(3)

    // First update should go through immediately
    expect(values).toEqual([1])

    // Wait for throttle period
    await new Promise(resolve => setTimeout(resolve, 60))

    // Last value should be applied
    expect(values).toContain(3)
  })

  it('should allow updates after throttle period', async () => {
    const store = createStore(0, {
      middleware: [throttleMiddleware(20)],
    })

    store.set(1)
    expect(store.get()).toBe(1)

    await new Promise(resolve => setTimeout(resolve, 30))

    store.set(2)
    expect(store.get()).toBe(2)
  })
})

describe('middleware chaining', () => {
  afterEach(() => {
    clearStores()
  })

  it('should apply multiple middleware in order', () => {
    const order: string[] = []

    const middleware1 = () => (nextSet: any) => (value: any) => {
      order.push('mw1-before')
      nextSet(value)
      order.push('mw1-after')
    }

    const middleware2 = () => (nextSet: any) => (value: any) => {
      order.push('mw2-before')
      nextSet(value)
      order.push('mw2-after')
    }

    const store = createStore(0, {
      middleware: [middleware1, middleware2],
    })

    store.set(1)

    // Middleware array is reversed, so middleware1 is applied last (outermost)
    // meaning middleware1 runs first
    expect(order).toEqual(['mw1-before', 'mw2-before', 'mw2-after', 'mw1-after'])
  })
})
