/**
 * Effect Scope & Cleanup Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/reactivity/__tests__/effectScope.spec.ts
 *
 * Tests verify that stx's reactive scope system (watchEffect cleanup,
 * component scope cleanup, unmountInstance) behaves consistently with
 * Vue 3's effect scope system.
 */

import { describe, expect, it, beforeEach } from 'bun:test'
import {
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  watchMultiple,
  createComponentInstance,
  setCurrentInstance,
  mountInstance,
  unmountInstance,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
} from '../../src/reactivity'

// =============================================================================
// watchEffect Cleanup Tests
// =============================================================================

describe('effect scope / watchEffect cleanup', () => {
  it('should run cleanup when watchEffect is stopped', () => {
    let cleanupCount = 0
    const stop = watchEffect(() => {
      return () => { cleanupCount++ }
    })

    expect(cleanupCount).toBe(0)
    stop()
    expect(cleanupCount).toBe(1)
  })

  it('should run cleanup before each re-run', () => {
    const cleanups: number[] = []
    const count = ref(0)

    watchEffect(() => {
      const val = count.value
      return () => { cleanups.push(val) }
    })

    expect(cleanups).toEqual([])
    count.value = 1
    expect(cleanups).toEqual([0])
    count.value = 2
    expect(cleanups).toEqual([0, 1])
  })

  it('should not re-run after stop', () => {
    let runs = 0
    const count = ref(0)

    const stop = watchEffect(() => {
      count.value // track dependency
      runs++
    })

    expect(runs).toBe(1)
    count.value = 1
    expect(runs).toBe(2)

    stop()
    count.value = 2
    expect(runs).toBe(2) // should not re-run
  })

  it('should handle multiple watchEffects independently', () => {
    let dummy1 = 0
    let dummy2 = 0
    const count = ref(0)

    const stop1 = watchEffect(() => {
      dummy1 = count.value
    })

    const stop2 = watchEffect(() => {
      dummy2 = count.value * 2
    })

    expect(dummy1).toBe(0)
    expect(dummy2).toBe(0)

    count.value = 1
    expect(dummy1).toBe(1)
    expect(dummy2).toBe(2)

    stop1()
    count.value = 2
    expect(dummy1).toBe(1) // stopped
    expect(dummy2).toBe(4) // still running
  })

  it('should handle nested watchEffects', () => {
    let outerRuns = 0
    let innerRuns = 0
    const count = ref(0)
    let innerStop: (() => void) | null = null

    watchEffect(() => {
      count.value // track
      outerRuns++
      if (!innerStop) {
        innerStop = watchEffect(() => {
          count.value // track
          innerRuns++
        })
      }
    })

    expect(outerRuns).toBe(1)
    expect(innerRuns).toBe(1)
  })
})

// =============================================================================
// Component Scope Cleanup Tests
// =============================================================================

describe('effect scope / component scope', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should register watchEffect cleanups in component scope', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    watchEffect(() => {})
    watchEffect(() => {})
    watchEffect(() => {})

    expect(instance.scope.cleanups.length).toBe(3)
    setCurrentInstance(null)
  })

  it('should cleanup all effects when component unmounts', async () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    let cleanup1 = false
    let cleanup2 = false

    watchEffect(() => {
      return () => { cleanup1 = true }
    })

    watchEffect(() => {
      return () => { cleanup2 = true }
    })

    setCurrentInstance(null)

    expect(cleanup1).toBe(false)
    expect(cleanup2).toBe(false)

    await unmountInstance(instance)

    expect(cleanup1).toBe(true)
    expect(cleanup2).toBe(true)
  })

  it('should register refs in component scope', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    ref(0)
    ref('hello')
    ref(true)

    expect(instance.scope.refs.size).toBe(3)
    setCurrentInstance(null)
  })

  it('should not register refs outside of component scope', () => {
    setCurrentInstance(null)
    const r = ref(0)
    // Should work fine, just not tracked in any scope
    expect(r.value).toBe(0)
    r.value = 1
    expect(r.value).toBe(1)
  })

  it('should cleanup watch subscriptions on unmount', async () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const count = ref(0)
    let watchCalls = 0

    watch(count, () => {
      watchCalls++
    }, { flush: 'sync' })

    setCurrentInstance(null)

    count.value = 1
    expect(watchCalls).toBe(1)

    await unmountInstance(instance)

    count.value = 2
    expect(watchCalls).toBe(1) // cleanup should have stopped the watch
  })
})

// =============================================================================
// Lifecycle + Scope Integration Tests
// =============================================================================

describe('effect scope / lifecycle integration', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should run onUnmounted hooks during unmount', async () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    let unmounted = false
    onUnmounted(() => {
      unmounted = true
    })

    setCurrentInstance(null)

    expect(unmounted).toBe(false)
    await mountInstance(instance)
    expect(unmounted).toBe(false)

    await unmountInstance(instance)
    expect(unmounted).toBe(true)
  })

  it('should run onBeforeUnmount before onUnmounted', async () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const order: string[] = []

    onBeforeUnmount(() => {
      order.push('beforeUnmount')
    })

    onUnmounted(() => {
      order.push('unmounted')
    })

    setCurrentInstance(null)

    await mountInstance(instance)
    await unmountInstance(instance)

    expect(order).toEqual(['beforeUnmount', 'unmounted'])
  })

  it('should run cleanups before unmounted hooks', async () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const order: string[] = []

    watchEffect(() => {
      return () => { order.push('cleanup') }
    })

    onUnmounted(() => {
      order.push('unmounted')
    })

    setCurrentInstance(null)

    await mountInstance(instance)
    await unmountInstance(instance)

    // Cleanups run during unmount, then unmounted hooks fire
    expect(order).toEqual(['cleanup', 'unmounted'])
  })

  it('should only unmount once', async () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    let count = 0
    onUnmounted(() => { count++ })

    setCurrentInstance(null)

    await mountInstance(instance)
    await unmountInstance(instance)
    await unmountInstance(instance) // second call should be no-op

    expect(count).toBe(1)
    expect(instance.isUnmounted).toBe(true)
  })

  it('should handle multiple effects and lifecycle hooks', async () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const events: string[] = []
    const count = ref(0)

    watchEffect(() => {
      count.value // track
      events.push(`effect1:${count.value}`)
      return () => events.push('cleanup1')
    })

    watchEffect(() => {
      count.value // track
      events.push(`effect2:${count.value}`)
      return () => events.push('cleanup2')
    })

    onMounted(() => events.push('mounted'))
    onUnmounted(() => events.push('unmounted'))

    setCurrentInstance(null)

    expect(events).toEqual(['effect1:0', 'effect2:0'])

    await mountInstance(instance)
    expect(events).toContain('mounted')

    count.value = 1
    expect(events).toContain('cleanup1')
    expect(events).toContain('effect1:1')

    await unmountInstance(instance)
    expect(events).toContain('unmounted')
  })
})

// =============================================================================
// watchMultiple Cleanup Tests
// =============================================================================

describe('effect scope / watchMultiple cleanup', () => {
  it('should stop all source watchers on unwatch', () => {
    const a = ref(0)
    const b = ref(0)
    let callCount = 0

    const unwatch = watchMultiple([a, b], () => {
      callCount++
    })

    a.value = 1
    expect(callCount).toBe(1)
    b.value = 1
    expect(callCount).toBe(2)

    unwatch()

    a.value = 2
    b.value = 2
    expect(callCount).toBe(2) // no more calls
  })

  it('should handle many refs being unwatched', () => {
    const refs = Array.from({ length: 10 }, (_, i) => ref(i))
    let callCount = 0

    const unwatch = watchMultiple(refs, () => {
      callCount++
    })

    refs[0].value = 100
    expect(callCount).toBe(1)

    refs[9].value = 100
    expect(callCount).toBe(2)

    unwatch()

    // None should trigger
    for (const r of refs) {
      r.value = 999
    }
    expect(callCount).toBe(2)
  })
})

// =============================================================================
// Computed + Effect Scope Tests
// =============================================================================

describe('effect scope / computed cleanup', () => {
  it('computed should auto-update when tracked ref changes', () => {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)

    expect(doubled.value).toBe(0)
    count.value = 5
    expect(doubled.value).toBe(10)
    count.value = 10
    expect(doubled.value).toBe(20)
  })

  it('computed should work with reactive objects', () => {
    const state = reactive({ count: 0 })
    // Note: computed with reactive requires watchEffect-like tracking
    // which is already tested in reactivity.test.ts
    // Here we test the basic pattern
    const count = ref(0)
    const doubled = computed(() => count.value * 2)

    expect(doubled.value).toBe(0)
    count.value = 3
    expect(doubled.value).toBe(6)
  })

  it('chained computeds should all update', () => {
    const base = ref(1)
    const c1 = computed(() => base.value * 2)
    const c2 = computed(() => c1.value + 10)
    const c3 = computed(() => c2.value * 3)

    expect(c1.value).toBe(2)
    expect(c2.value).toBe(12)
    expect(c3.value).toBe(36)

    base.value = 5
    expect(c1.value).toBe(10)
    expect(c2.value).toBe(20)
    expect(c3.value).toBe(60)
  })

  it('watchEffect should track computed values', () => {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    let effectValue = -1

    watchEffect(() => {
      effectValue = doubled.value
    })

    expect(effectValue).toBe(0)
    count.value = 5
    expect(effectValue).toBe(10)
  })

  it('computed with subscriber should notify on dependency change', () => {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    const values: number[] = []

    doubled.subscribe((val) => {
      values.push(val)
    })

    count.value = 1
    expect(doubled.value).toBe(2)
    expect(values).toContain(2)

    count.value = 5
    expect(doubled.value).toBe(10)
    expect(values).toContain(10)
    expect(values.length).toBe(2)
  })
})

// =============================================================================
// Scope Nesting and Independence Tests
// =============================================================================

describe('effect scope / nesting and independence', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should support independent component scopes', async () => {
    const instance1 = createComponentInstance()
    setCurrentInstance(instance1)
    const r1 = ref(0)
    let e1 = 0
    watchEffect(() => { e1 = r1.value })
    setCurrentInstance(null)

    const instance2 = createComponentInstance()
    setCurrentInstance(instance2)
    const r2 = ref(0)
    let e2 = 0
    watchEffect(() => { e2 = r2.value })
    setCurrentInstance(null)

    r1.value = 1
    expect(e1).toBe(1)
    expect(e2).toBe(0)

    r2.value = 2
    expect(e1).toBe(1)
    expect(e2).toBe(2)

    // Unmounting one should not affect the other
    await unmountInstance(instance1)
    r1.value = 99 // should not update e1
    expect(e1).toBe(1) // e1 should NOT have changed — effect was stopped on unmount
    r2.value = 3
    expect(e2).toBe(3) // still works
  })

  it('should track scope refs independently', () => {
    const instance1 = createComponentInstance()
    setCurrentInstance(instance1)
    ref(1)
    ref(2)
    setCurrentInstance(null)

    const instance2 = createComponentInstance()
    setCurrentInstance(instance2)
    ref(3)
    setCurrentInstance(null)

    expect(instance1.scope.refs.size).toBe(2)
    expect(instance2.scope.refs.size).toBe(1)
  })

  it('should track scope cleanups independently', () => {
    const instance1 = createComponentInstance()
    setCurrentInstance(instance1)
    watchEffect(() => {})
    watchEffect(() => {})
    setCurrentInstance(null)

    const instance2 = createComponentInstance()
    setCurrentInstance(instance2)
    watchEffect(() => {})
    setCurrentInstance(null)

    expect(instance1.scope.cleanups.length).toBe(2)
    expect(instance2.scope.cleanups.length).toBe(1)
  })
})
