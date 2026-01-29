import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
  state,
  derived,
  effect,
  batch,
  isSignal,
  untrack,
  peek,
  onMount,
  onDestroy,
  generateSignalsRuntime,
  generateSignalsRuntimeDev,
} from '../../src/signals'

describe('STX Signals - Core Primitives', () => {
  describe('state()', () => {
    it('should create a signal with initial value', () => {
      const count = state(0)
      expect(count()).toBe(0)
    })

    it('should update value with set()', () => {
      const count = state(0)
      count.set(5)
      expect(count()).toBe(5)
    })

    it('should update value with update()', () => {
      const count = state(10)
      count.update(n => n + 5)
      expect(count()).toBe(15)
    })

    it('should work with different types', () => {
      const str = state('hello')
      const arr = state([1, 2, 3])
      const obj = state({ name: 'test' })
      const bool = state(true)

      expect(str()).toBe('hello')
      expect(arr()).toEqual([1, 2, 3])
      expect(obj()).toEqual({ name: 'test' })
      expect(bool()).toBe(true)
    })

    it('should support subscribe()', () => {
      const count = state(0)
      let lastValue = -1
      let prevValue = -1

      const unsubscribe = count.subscribe((value, prev) => {
        lastValue = value
        prevValue = prev
      })

      count.set(5)
      expect(lastValue).toBe(5)
      expect(prevValue).toBe(0)

      count.set(10)
      expect(lastValue).toBe(10)
      expect(prevValue).toBe(5)

      unsubscribe()
      count.set(20)
      expect(lastValue).toBe(10) // Should not update after unsubscribe
    })

    it('should not trigger updates for same value', () => {
      const count = state(5)
      let updateCount = 0

      count.subscribe(() => {
        updateCount++
      })

      count.set(5) // Same value
      expect(updateCount).toBe(0)

      count.set(10) // Different value
      expect(updateCount).toBe(1)
    })

    it('should be identifiable as a signal', () => {
      const count = state(0)
      expect(isSignal(count)).toBe(true)
      expect(isSignal(() => 0)).toBe(false)
      expect(isSignal(5)).toBe(false)
    })
  })

  describe('derived()', () => {
    it('should compute value from other signals', () => {
      const count = state(5)
      const doubled = derived(() => count() * 2)

      expect(doubled()).toBe(10)
    })

    it('should update when dependencies change', () => {
      const firstName = state('John')
      const lastName = state('Doe')
      const fullName = derived(() => `${firstName()} ${lastName()}`)

      expect(fullName()).toBe('John Doe')

      firstName.set('Jane')
      expect(fullName()).toBe('Jane Doe')

      lastName.set('Smith')
      expect(fullName()).toBe('Jane Smith')
    })

    it('should handle multiple dependencies', () => {
      const a = state(1)
      const b = state(2)
      const c = state(3)
      const sum = derived(() => a() + b() + c())

      expect(sum()).toBe(6)

      a.set(10)
      expect(sum()).toBe(15)
    })

    it('should handle nested derived signals', () => {
      const base = state(2)
      const doubled = derived(() => base() * 2)
      const quadrupled = derived(() => doubled() * 2)

      expect(quadrupled()).toBe(8)

      base.set(5)
      expect(doubled()).toBe(10)
      expect(quadrupled()).toBe(20)
    })

    it('should cache computed value', () => {
      let computeCount = 0
      const count = state(5)
      const expensive = derived(() => {
        computeCount++
        return count() * 2
      })

      // First access computes
      expect(expensive()).toBe(10)
      expect(computeCount).toBe(1)

      // Second access uses cache
      expect(expensive()).toBe(10)
      expect(computeCount).toBe(1)

      // Change dependency invalidates cache
      count.set(10)
      expect(expensive()).toBe(20)
      expect(computeCount).toBe(2)
    })
  })

  describe('effect()', () => {
    it('should run immediately by default', () => {
      let ran = false
      effect(() => {
        ran = true
      })
      expect(ran).toBe(true)
    })

    it('should track dependencies and re-run', () => {
      const count = state(0)
      let effectCount = 0

      effect(() => {
        count() // Access to track
        effectCount++
      })

      expect(effectCount).toBe(1)

      count.set(1)
      expect(effectCount).toBe(2)

      count.set(2)
      expect(effectCount).toBe(3)
    })

    it('should return cleanup function', () => {
      const count = state(0)
      let effectCount = 0

      const cleanup = effect(() => {
        count()
        effectCount++
      })

      expect(effectCount).toBe(1)

      cleanup()
      count.set(1)
      expect(effectCount).toBe(1) // Should not run after cleanup
    })

    it('should call cleanup function from effect', () => {
      const count = state(0)
      let cleanupCalled = false

      effect(() => {
        count()
        return () => {
          cleanupCalled = true
        }
      })

      expect(cleanupCalled).toBe(false)

      count.set(1) // This should trigger cleanup of previous effect
      expect(cleanupCalled).toBe(true)
    })

    it('should support immediate: false option', () => {
      let ran = false
      effect(() => {
        ran = true
      }, { immediate: false })
      expect(ran).toBe(false)
    })
  })

  describe('batch()', () => {
    it('should batch multiple updates', () => {
      const a = state(1)
      const b = state(2)
      let effectCount = 0

      effect(() => {
        a()
        b()
        effectCount++
      })

      expect(effectCount).toBe(1)

      batch(() => {
        a.set(10)
        b.set(20)
      })

      // Should only trigger effect once after batch
      expect(effectCount).toBe(2)
    })

    it('should work with nested batches', () => {
      const count = state(0)
      let effectCount = 0

      effect(() => {
        count()
        effectCount++
      })

      expect(effectCount).toBe(1)

      batch(() => {
        count.set(1)
        batch(() => {
          count.set(2)
        })
        count.set(3)
      })

      expect(effectCount).toBe(2)
      expect(count()).toBe(3)
    })
  })

  describe('untrack()', () => {
    it('should not track dependencies inside untrack', () => {
      const tracked = state(0)
      const untracked = state(0)
      let effectCount = 0

      effect(() => {
        tracked()
        untrack(() => untracked())
        effectCount++
      })

      expect(effectCount).toBe(1)

      // Tracked dependency should trigger effect
      tracked.set(1)
      expect(effectCount).toBe(2)

      // Untracked dependency should NOT trigger effect
      untracked.set(1)
      expect(effectCount).toBe(2)
    })
  })

  describe('peek()', () => {
    it('should read value without tracking', () => {
      const count = state(5)
      let effectCount = 0

      effect(() => {
        peek(count)
        effectCount++
      })

      expect(effectCount).toBe(1)

      count.set(10)
      expect(effectCount).toBe(1) // Should not re-run
    })
  })
})

describe('STX Signals - Lifecycle', () => {
  it('should register mount callbacks', () => {
    let mounted = false
    onMount(() => {
      mounted = true
    })
    // Note: callbacks are stored but not automatically called
    // They're called by the runtime when component mounts
    expect(mounted).toBe(false)
  })

  it('should register destroy callbacks', () => {
    let destroyed = false
    onDestroy(() => {
      destroyed = true
    })
    expect(destroyed).toBe(false)
  })
})

describe('STX Signals - Runtime Generation', () => {
  it('should generate production runtime', () => {
    const runtime = generateSignalsRuntime()
    expect(runtime).toBeDefined()
    expect(typeof runtime).toBe('string')
    expect(runtime.length).toBeGreaterThan(0)
  })

  it('should generate development runtime', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toBeDefined()
    expect(typeof runtime).toBe('string')
    expect(runtime).toContain('STX Signals Runtime')
  })

  it('should include all core functions in runtime', () => {
    const runtime = generateSignalsRuntimeDev()

    // Core functions
    expect(runtime).toContain('function state(')
    expect(runtime).toContain('function derived(')
    expect(runtime).toContain('function effect(')
    expect(runtime).toContain('function batch(')

    // Lifecycle
    expect(runtime).toContain('onMount')
    expect(runtime).toContain('onDestroy')

    // Template processing
    expect(runtime).toContain('processElement')
    expect(runtime).toContain('@if')
    expect(runtime).toContain('@for')
    expect(runtime).toContain('@show')
    expect(runtime).toContain('@model')
  })

  it('should expose stx on window', () => {
    const runtime = generateSignalsRuntimeDev()
    expect(runtime).toContain('window.stx')
  })
})
