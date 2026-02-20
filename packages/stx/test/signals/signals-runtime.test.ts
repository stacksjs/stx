import { describe, expect, it, beforeEach } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

/**
 * These tests evaluate the generated runtime code to verify it works correctly.
 * We simulate a browser-like environment and test the runtime functions.
 */
describe('STX Signals - Runtime Behavior', () => {
  let stx: any

  beforeEach(() => {
    // Create a minimal DOM-like environment
    const mockWindow: any = {
      stx: null,
    }

    const mockDocument = {
      readyState: 'complete',
      addEventListener: () => {},
      querySelectorAll: () => [],
    }

    // Evaluate the runtime in our mock environment
    const runtime = generateSignalsRuntimeDev()

    // Create a function that executes the runtime with our mocks
    const executeRuntime = new Function(
      'window',
      'document',
      'Node',
      runtime
    )

    // Mock Node constants
    const mockNode = {
      TEXT_NODE: 3,
      ELEMENT_NODE: 1,
    }

    executeRuntime(mockWindow, mockDocument, mockNode)
    stx = mockWindow.stx
  })

  describe('state() in runtime', () => {
    it('should create reactive state', () => {
      const count = stx.state(0)
      expect(count()).toBe(0)
    })

    it('should update with set()', () => {
      const count = stx.state(0)
      count.set(5)
      expect(count()).toBe(5)
    })

    it('should update with update()', () => {
      const count = stx.state(10)
      count.update((n: number) => n + 5)
      expect(count()).toBe(15)
    })

    it('should have _isSignal marker', () => {
      const count = stx.state(0)
      expect(count._isSignal).toBe(true)
    })

    it('should support subscribe()', () => {
      const count = stx.state(0)
      let lastValue = -1

      count.subscribe((value: number) => {
        lastValue = value
      })

      count.set(10)
      expect(lastValue).toBe(10)
    })
  })

  describe('derived() in runtime', () => {
    it('should compute from state', () => {
      const count = stx.state(5)
      const doubled = stx.derived(() => count() * 2)

      expect(doubled()).toBe(10)
    })

    it('should update when state changes', () => {
      const count = stx.state(5)
      const doubled = stx.derived(() => count() * 2)

      count.set(10)
      expect(doubled()).toBe(20)
    })

    it('should handle multiple dependencies', () => {
      const a = stx.state(1)
      const b = stx.state(2)
      const sum = stx.derived(() => a() + b())

      expect(sum()).toBe(3)

      a.set(10)
      expect(sum()).toBe(12)

      b.set(20)
      expect(sum()).toBe(30)
    })
  })

  describe('effect() in runtime', () => {
    it('should run immediately', () => {
      let ran = false
      stx.effect(() => {
        ran = true
      })
      expect(ran).toBe(true)
    })

    it('should re-run on state change', () => {
      const count = stx.state(0)
      let effectValue = -1

      stx.effect(() => {
        effectValue = count()
      })

      expect(effectValue).toBe(0)

      count.set(5)
      expect(effectValue).toBe(5)
    })

    it('should return cleanup function', () => {
      const count = stx.state(0)
      let effectCount = 0

      const cleanup = stx.effect(() => {
        count()
        effectCount++
      })

      expect(effectCount).toBe(1)

      cleanup()
      count.set(1)
      expect(effectCount).toBe(1)
    })
  })

  describe('batch() in runtime', () => {
    it('should batch updates', () => {
      const a = stx.state(0)
      const b = stx.state(0)
      let effectCount = 0

      stx.effect(() => {
        a()
        b()
        effectCount++
      })

      expect(effectCount).toBe(1)

      stx.batch(() => {
        a.set(1)
        b.set(2)
      })

      expect(effectCount).toBe(2)
    })
  })

  describe('isSignal() in runtime', () => {
    it('should identify signals', () => {
      const count = stx.state(0)
      expect(stx.isSignal(count)).toBe(true)
    })

    it('should return false for non-signals', () => {
      expect(stx.isSignal(() => 0)).toBe(false)
      expect(stx.isSignal(5)).toBe(false)
      expect(stx.isSignal(null)).toBe(false)
    })
  })

  describe('lifecycle hooks in runtime', () => {
    it('should have onMount function', () => {
      expect(typeof stx.onMount).toBe('function')
    })

    it('should have onDestroy function', () => {
      expect(typeof stx.onDestroy).toBe('function')
    })

    it('should store mount callbacks', () => {
      let called = false
      stx.onMount(() => {
        called = true
      })
      // Callback is stored, not immediately called
      expect(stx._mountCallbacks.length).toBeGreaterThan(0)
    })

    it('should store destroy callbacks', () => {
      stx.onDestroy(() => {})
      expect(stx._destroyCallbacks.length).toBeGreaterThan(0)
    })
  })

  describe('complex reactive scenarios', () => {
    it('should handle diamond dependency', () => {
      const source = stx.state(1)
      const left = stx.derived(() => source() * 2)
      const right = stx.derived(() => source() * 3)
      const bottom = stx.derived(() => left() + right())

      expect(bottom()).toBe(5) // 2 + 3

      source.set(2)
      expect(bottom()).toBe(10) // 4 + 6
    })

    it('should handle deep nesting', () => {
      const a = stx.state(1)
      const b = stx.derived(() => a() + 1)
      const c = stx.derived(() => b() + 1)
      const d = stx.derived(() => c() + 1)
      const e = stx.derived(() => d() + 1)

      expect(e()).toBe(5)

      a.set(10)
      expect(e()).toBe(14)
    })

    it('should handle array mutations', () => {
      const items = stx.state<string[]>([])
      const count = stx.derived(() => items().length)

      expect(count()).toBe(0)

      items.update((arr: string[]) => [...arr, 'item1'])
      expect(count()).toBe(1)

      items.update((arr: string[]) => [...arr, 'item2', 'item3'])
      expect(count()).toBe(3)
    })

    it('should handle object mutations', () => {
      const user = stx.state({ name: 'John', age: 30 })
      const description = stx.derived(() => `${user().name} is ${user().age}`)

      expect(description()).toBe('John is 30')

      user.set({ name: 'Jane', age: 25 })
      expect(description()).toBe('Jane is 25')
    })

    it('should handle conditional derived', () => {
      const condition = stx.state(true)
      const a = stx.state(10)
      const b = stx.state(20)
      const result = stx.derived(() => condition() ? a() : b())

      expect(result()).toBe(10)

      condition.set(false)
      expect(result()).toBe(20)

      b.set(30)
      expect(result()).toBe(30)
    })
  })
})
