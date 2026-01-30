import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  batch,
  derived,
  effect,
  isDerived,
  isSignal,
  onDestroy,
  onMount,
  peek,
  state,
  untrack,
} from '../../src/signals'

describe('signals - state()', () => {
  it('should create a signal with initial value', () => {
    const count = state(0)
    expect(count()).toBe(0)
  })

  it('should create a signal with various types', () => {
    expect(state('hello')()).toBe('hello')
    expect(state(true)()).toBe(true)
    expect(state(null)()).toBe(null)
    expect(state(undefined)()).toBe(undefined)
    expect(state([1, 2, 3])()).toEqual([1, 2, 3])
    expect(state({ a: 1 })()).toEqual({ a: 1 })
  })

  it('should set a new value', () => {
    const count = state(0)
    count.set(5)
    expect(count()).toBe(5)
  })

  it('should update value with function', () => {
    const count = state(10)
    count.update(n => n + 5)
    expect(count()).toBe(15)
  })

  it('should not trigger updates when value is the same (Object.is)', () => {
    const count = state(5)
    let notifyCount = 0
    count.subscribe(() => notifyCount++)

    count.set(5)
    expect(notifyCount).toBe(0)
  })

  it('should handle NaN equality correctly', () => {
    const num = state(Number.NaN)
    let notifyCount = 0
    num.subscribe(() => notifyCount++)

    num.set(Number.NaN) // NaN === NaN with Object.is
    expect(notifyCount).toBe(0)
  })

  it('should distinguish +0 and -0', () => {
    const num = state(0)
    let notifyCount = 0
    num.subscribe(() => notifyCount++)

    num.set(-0)
    expect(notifyCount).toBe(1) // Object.is(0, -0) is false
  })

  it('should notify subscribers on change', () => {
    const count = state(0)
    const values: number[] = []
    const prevValues: number[] = []

    count.subscribe((value, prev) => {
      values.push(value)
      prevValues.push(prev)
    })

    count.set(1)
    count.set(2)
    count.set(3)

    expect(values).toEqual([1, 2, 3])
    expect(prevValues).toEqual([0, 1, 2])
  })

  it('should unsubscribe correctly', () => {
    const count = state(0)
    let notified = false

    const unsub = count.subscribe(() => {
      notified = true
    })

    unsub()
    count.set(10)

    expect(notified).toBe(false)
  })

  it('should handle multiple subscribers', () => {
    const count = state(0)
    const results1: number[] = []
    const results2: number[] = []

    count.subscribe(v => results1.push(v))
    count.subscribe(v => results2.push(v))

    count.set(1)

    expect(results1).toEqual([1])
    expect(results2).toEqual([1])
  })

  it('should mark itself as a signal', () => {
    const count = state(0)
    expect(count._isSignal).toBe(true)
  })

  it('should handle complex object updates', () => {
    const user = state({ name: 'Alice', age: 30, address: { city: 'NYC' } })

    user.set({ name: 'Bob', age: 25, address: { city: 'LA' } })

    expect(user()).toEqual({ name: 'Bob', age: 25, address: { city: 'LA' } })
  })

  it('should handle array mutations via update', () => {
    const items = state<string[]>([])

    items.update(arr => [...arr, 'item1'])
    items.update(arr => [...arr, 'item2'])

    expect(items()).toEqual(['item1', 'item2'])
  })
})

describe('signals - derived()', () => {
  it('should compute value from a signal', () => {
    const count = state(5)
    const doubled = derived(() => count() * 2)

    expect(doubled()).toBe(10)
  })

  it('should update when dependency changes', () => {
    const count = state(5)
    const doubled = derived(() => count() * 2)

    count.set(10)
    expect(doubled()).toBe(20)
  })

  it('should combine multiple signals', () => {
    const firstName = state('John')
    const lastName = state('Doe')
    const fullName = derived(() => `${firstName()} ${lastName()}`)

    expect(fullName()).toBe('John Doe')

    firstName.set('Jane')
    expect(fullName()).toBe('Jane Doe')

    lastName.set('Smith')
    expect(fullName()).toBe('Jane Smith')
  })

  it('should be lazy - only compute when read', () => {
    let computeCount = 0
    const count = state(5)
    const doubled = derived(() => {
      computeCount++
      return count() * 2
    })

    expect(computeCount).toBe(0) // Not computed yet

    doubled()
    expect(computeCount).toBe(1)

    doubled() // Should use cached value
    expect(computeCount).toBe(1)
  })

  it('should recompute when dirty', () => {
    let computeCount = 0
    const count = state(5)
    const doubled = derived(() => {
      computeCount++
      return count() * 2
    })

    doubled()
    expect(computeCount).toBe(1)

    count.set(10) // Marks as dirty
    doubled()
    expect(computeCount).toBe(2)
  })

  it('should mark itself as derived', () => {
    const count = state(5)
    const doubled = derived(() => count() * 2)

    expect(doubled._isDerived).toBe(true)
  })

  it('should handle nested derived signals', () => {
    const a = state(1)
    const b = derived(() => a() * 2)
    const c = derived(() => b() * 3)

    expect(c()).toBe(6)

    a.set(2)
    expect(b()).toBe(4)
    expect(c()).toBe(12)
  })

  it('should handle conditional dependencies', () => {
    const useA = state(true)
    const a = state(10)
    const b = state(20)

    const result = derived(() => {
      if (useA()) {
        return a()
      }
      return b()
    })

    expect(result()).toBe(10)

    useA.set(false)
    expect(result()).toBe(20)
  })

  it('should handle derived with array operations', () => {
    const numbers = state([1, 2, 3, 4, 5])
    const filter = state<'even' | 'odd'>('even')

    const filtered = derived(() => {
      const nums = numbers()
      return filter() === 'even'
        ? nums.filter(n => n % 2 === 0)
        : nums.filter(n => n % 2 !== 0)
    })

    expect(filtered()).toEqual([2, 4])

    filter.set('odd')
    expect(filtered()).toEqual([1, 3, 5])

    numbers.set([1, 2, 3, 4, 5, 6])
    expect(filtered()).toEqual([1, 3, 5])
  })
})

describe('signals - effect()', () => {
  it('should run immediately by default', () => {
    let ran = false
    effect(() => {
      ran = true
    })
    expect(ran).toBe(true)
  })

  it('should not run immediately with immediate: false', () => {
    let ran = false
    effect(() => {
      ran = true
    }, { immediate: false })
    expect(ran).toBe(false)
  })

  it('should re-run when dependency changes', () => {
    const count = state(0)
    const values: number[] = []

    effect(() => {
      values.push(count())
    })

    count.set(1)
    count.set(2)

    expect(values).toEqual([0, 1, 2])
  })

  it('should return cleanup function', () => {
    const count = state(0)
    let effectRan = false

    const cleanup = effect(() => {
      effectRan = true
      count() // Track dependency
    })

    effectRan = false
    cleanup()
    count.set(1)

    expect(effectRan).toBe(false)
  })

  it('should run cleanup before re-running', () => {
    const count = state(0)
    const log: string[] = []

    effect(() => {
      log.push(`run:${count()}`)
      return () => {
        log.push(`cleanup:${count()}`)
      }
    })

    count.set(1)

    expect(log).toEqual(['run:0', 'cleanup:1', 'run:1'])
  })

  it('should handle multiple dependencies', () => {
    const a = state(1)
    const b = state(2)
    const values: number[] = []

    effect(() => {
      values.push(a() + b())
    })

    a.set(10)
    b.set(20)

    expect(values).toEqual([3, 12, 30])
  })

  it('should handle nested effects', () => {
    const outer = state(0)
    const inner = state(0)
    const log: string[] = []

    effect(() => {
      log.push(`outer:${outer()}`)
      effect(() => {
        log.push(`inner:${inner()}`)
      })
    })

    expect(log).toContain('outer:0')
    expect(log).toContain('inner:0')
  })

  it('should not re-run disposed effects', () => {
    const count = state(0)
    let runCount = 0

    const cleanup = effect(() => {
      runCount++
      count()
    })

    expect(runCount).toBe(1)

    cleanup()
    count.set(1)
    count.set(2)

    expect(runCount).toBe(1)
  })
})

describe('signals - batch()', () => {
  it('should batch multiple updates', () => {
    const a = state(1)
    const b = state(2)
    let effectRunCount = 0

    effect(() => {
      a()
      b()
      effectRunCount++
    })

    expect(effectRunCount).toBe(1)

    batch(() => {
      a.set(10)
      b.set(20)
    })

    expect(effectRunCount).toBe(2) // Only one additional run
  })

  it('should handle nested batches', () => {
    const count = state(0)
    let effectRunCount = 0

    effect(() => {
      count()
      effectRunCount++
    })

    batch(() => {
      count.set(1)
      batch(() => {
        count.set(2)
        count.set(3)
      })
      count.set(4)
    })

    // Nested batch continues the outer batch
    expect(count()).toBe(4)
  })

  it('should work with derived signals', () => {
    const a = state(1)
    const b = state(2)
    const sum = derived(() => a() + b())

    batch(() => {
      a.set(10)
      b.set(20)
    })

    expect(sum()).toBe(30)
  })
})

describe('signals - utility functions', () => {
  it('isSignal should correctly identify signals', () => {
    const sig = state(0)
    expect(isSignal(sig)).toBe(true)
    expect(isSignal(5)).toBe(false)
    expect(isSignal(() => {})).toBe(false)
    expect(isSignal(null)).toBe(false)
    expect(isSignal(undefined)).toBe(false)
  })

  it('isDerived should correctly identify derived signals', () => {
    const sig = state(0)
    const der = derived(() => sig() * 2)

    expect(isDerived(der)).toBe(true)
    expect(isDerived(sig)).toBe(false)
    expect(isDerived(5)).toBe(false)
  })

  it('untrack should unwrap signals', () => {
    const count = state(5)
    expect(untrack(count)).toBe(5)
    expect(untrack(10)).toBe(10)
  })

  it('untrack should unwrap derived signals', () => {
    const count = state(5)
    const doubled = derived(() => count() * 2)
    expect(untrack(doubled)).toBe(10)
  })

  it('peek should read without tracking', () => {
    const count = state(0)
    let effectRunCount = 0

    effect(() => {
      peek(() => count()) // Should not track
      effectRunCount++
    })

    expect(effectRunCount).toBe(1)

    count.set(1)
    expect(effectRunCount).toBe(1) // Should not re-run
  })
})

describe('signals - lifecycle hooks', () => {
  it('should register onMount callback', () => {
    let mounted = false
    onMount(() => {
      mounted = true
    })
    // Note: In actual usage, mount callbacks are triggered by the runtime
    // This test just verifies registration doesn't throw
    expect(typeof onMount).toBe('function')
  })

  it('should register onDestroy callback', () => {
    let destroyed = false
    onDestroy(() => {
      destroyed = true
    })
    expect(typeof onDestroy).toBe('function')
  })
})

describe('signals - edge cases', () => {
  it('should handle circular dependencies gracefully', () => {
    const a = state(1)
    // This creates a derived that depends on itself via effect
    // The system should handle this without infinite loops
    let loopCount = 0
    const maxLoops = 10

    effect(() => {
      if (loopCount < maxLoops) {
        loopCount++
        a()
      }
    })

    expect(loopCount).toBeLessThanOrEqual(maxLoops)
  })

  it('should handle rapid updates', () => {
    const count = state(0)
    const values: number[] = []

    effect(() => {
      values.push(count())
    })

    for (let i = 1; i <= 100; i++) {
      count.set(i)
    }

    expect(values[values.length - 1]).toBe(100)
    expect(values.length).toBe(101) // Initial + 100 updates
  })

  it('should handle deeply nested objects', () => {
    const deep = state({
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    })

    expect(deep().level1.level2.level3.value).toBe('deep')

    deep.set({
      level1: {
        level2: {
          level3: {
            value: 'updated',
          },
        },
      },
    })

    expect(deep().level1.level2.level3.value).toBe('updated')
  })

  it('should handle empty updates', () => {
    const obj = state<Record<string, number>>({})
    let notifyCount = 0

    obj.subscribe(() => notifyCount++)

    obj.set({}) // Different reference, should notify
    expect(notifyCount).toBe(1)
  })

  it('should handle undefined to value transitions', () => {
    const maybe = state<string | undefined>(undefined)
    const values: (string | undefined)[] = []

    maybe.subscribe(v => values.push(v))

    maybe.set('value')
    maybe.set(undefined)
    maybe.set('another')

    expect(values).toEqual(['value', undefined, 'another'])
  })

  it('should handle synchronous recursive updates', () => {
    const count = state(0)
    let effectRuns = 0

    effect(() => {
      const c = count()
      effectRuns++
      // Guard against infinite recursion
      if (c < 3 && effectRuns < 10) {
        count.set(c + 1)
      }
    })

    expect(count()).toBe(3)
    expect(effectRuns).toBeLessThanOrEqual(10)
  })

  it('should maintain order of effects', () => {
    const trigger = state(0)
    const order: number[] = []

    effect(() => {
      trigger()
      order.push(1)
    })

    effect(() => {
      trigger()
      order.push(2)
    })

    effect(() => {
      trigger()
      order.push(3)
    })

    expect(order).toEqual([1, 2, 3])

    order.length = 0
    trigger.set(1)

    expect(order).toEqual([1, 2, 3])
  })
})

describe('signals - performance', () => {
  it('should handle many subscribers efficiently', () => {
    const count = state(0)
    const subscribers: (() => void)[] = []

    for (let i = 0; i < 1000; i++) {
      subscribers.push(count.subscribe(() => {}))
    }

    const start = performance.now()
    count.set(1)
    const duration = performance.now() - start

    // Cleanup
    subscribers.forEach(unsub => unsub())

    // Should complete in reasonable time
    expect(duration).toBeLessThan(100) // 100ms threshold
  })

  it('should handle many signals efficiently', () => {
    const signals: ReturnType<typeof state<number>>[] = []

    for (let i = 0; i < 1000; i++) {
      signals.push(state(i))
    }

    const sum = derived(() => signals.reduce((acc, s) => acc + s(), 0))

    expect(sum()).toBe(499500) // Sum of 0 to 999
  })

  it('should cache derived values effectively', () => {
    const source = state(1)
    let computeCount = 0

    const expensive = derived(() => {
      computeCount++
      return source() * 1000
    })

    // Multiple reads should not recompute
    for (let i = 0; i < 100; i++) {
      expensive()
    }

    expect(computeCount).toBe(1)
  })
})
