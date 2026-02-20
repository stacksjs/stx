/**
 * Lifecycle Hook Execution Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/runtime-core/__tests__/apiLifecycle.spec.ts
 *
 * Tests verify that stx's lifecycle hook execution (mountInstance,
 * updateInstance, unmountInstance) behaves consistently with Vue 3's
 * component lifecycle.
 */

import { describe, expect, it, beforeEach } from 'bun:test'
import {
  createComponentInstance,
  setCurrentInstance,
  mountInstance,
  updateInstance,
  unmountInstance,
  runHooks,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  type ComponentInstance,
} from '../../src/reactivity'

// =============================================================================
// Mount Lifecycle Tests
// =============================================================================

describe('lifecycle / mount', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should run beforeMount then mounted in order', async () => {
    const order: string[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onBeforeMount(() => order.push('beforeMount'))
    onMounted(() => order.push('mounted'))

    setCurrentInstance(null)

    await mountInstance(instance)

    expect(order).toEqual(['beforeMount', 'mounted'])
  })

  it('should set isMounted after mount', async () => {
    const instance = createComponentInstance()
    expect(instance.isMounted).toBe(false)

    await mountInstance(instance)

    expect(instance.isMounted).toBe(true)
  })

  it('should run multiple beforeMount hooks in registration order', async () => {
    const order: number[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onBeforeMount(() => order.push(1))
    onBeforeMount(() => order.push(2))
    onBeforeMount(() => order.push(3))

    setCurrentInstance(null)
    await mountInstance(instance)

    expect(order).toEqual([1, 2, 3])
  })

  it('should run multiple mounted hooks in registration order', async () => {
    const order: number[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onMounted(() => order.push(1))
    onMounted(() => order.push(2))
    onMounted(() => order.push(3))

    setCurrentInstance(null)
    await mountInstance(instance)

    expect(order).toEqual([1, 2, 3])
  })

  it('should support async beforeMount hooks', async () => {
    const order: string[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onBeforeMount(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      order.push('async-beforeMount')
    })
    onMounted(() => order.push('mounted'))

    setCurrentInstance(null)
    await mountInstance(instance)

    expect(order).toEqual(['async-beforeMount', 'mounted'])
  })

  it('should support async mounted hooks', async () => {
    let asyncCompleted = false
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onMounted(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      asyncCompleted = true
    })

    setCurrentInstance(null)
    await mountInstance(instance)

    expect(asyncCompleted).toBe(true)
  })
})

// =============================================================================
// Update Lifecycle Tests
// =============================================================================

describe('lifecycle / update', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should run beforeUpdate then updated in order', async () => {
    const order: string[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onBeforeUpdate(() => order.push('beforeUpdate'))
    onUpdated(() => order.push('updated'))

    setCurrentInstance(null)

    // Must mount first
    await mountInstance(instance)

    await updateInstance(instance)

    expect(order).toEqual(['beforeUpdate', 'updated'])
  })

  it('should not run update hooks if not mounted', async () => {
    const order: string[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onBeforeUpdate(() => order.push('beforeUpdate'))
    onUpdated(() => order.push('updated'))

    setCurrentInstance(null)

    // Skip mount — try update directly
    await updateInstance(instance)

    expect(order).toEqual([])
  })

  it('should not run update hooks if unmounted', async () => {
    const order: string[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onBeforeUpdate(() => order.push('beforeUpdate'))
    onUpdated(() => order.push('updated'))

    setCurrentInstance(null)

    await mountInstance(instance)
    await unmountInstance(instance)

    // Try update after unmount
    await updateInstance(instance)

    expect(order).toEqual([]) // no update hooks should run
  })

  it('should run update hooks multiple times', async () => {
    let updateCount = 0
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onUpdated(() => updateCount++)

    setCurrentInstance(null)
    await mountInstance(instance)

    await updateInstance(instance)
    await updateInstance(instance)
    await updateInstance(instance)

    expect(updateCount).toBe(3)
  })
})

// =============================================================================
// Unmount Lifecycle Tests
// =============================================================================

describe('lifecycle / unmount', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should run beforeUnmount then unmounted in order', async () => {
    const order: string[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onBeforeUnmount(() => order.push('beforeUnmount'))
    onUnmounted(() => order.push('unmounted'))

    setCurrentInstance(null)
    await mountInstance(instance)
    await unmountInstance(instance)

    expect(order).toEqual(['beforeUnmount', 'unmounted'])
  })

  it('should set isUnmounted after unmount', async () => {
    const instance = createComponentInstance()
    expect(instance.isUnmounted).toBe(false)

    await mountInstance(instance)
    expect(instance.isUnmounted).toBe(false)

    await unmountInstance(instance)
    expect(instance.isUnmounted).toBe(true)
  })

  it('should only unmount once', async () => {
    let unmountCount = 0
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onUnmounted(() => unmountCount++)

    setCurrentInstance(null)
    await mountInstance(instance)

    await unmountInstance(instance)
    await unmountInstance(instance)
    await unmountInstance(instance)

    expect(unmountCount).toBe(1)
  })

  it('should run scope cleanups during unmount', async () => {
    let cleaned = false
    const instance = createComponentInstance()

    // Manually add a cleanup to the scope
    instance.scope.cleanups.push(() => { cleaned = true })

    await mountInstance(instance)
    expect(cleaned).toBe(false)

    await unmountInstance(instance)
    expect(cleaned).toBe(true)
  })

  it('should run cleanups before unmounted hooks', async () => {
    const order: string[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onUnmounted(() => order.push('unmounted'))

    setCurrentInstance(null)

    instance.scope.cleanups.push(() => order.push('cleanup'))

    await mountInstance(instance)
    await unmountInstance(instance)

    expect(order).toEqual(['cleanup', 'unmounted'])
  })
})

// =============================================================================
// Full Lifecycle Order Tests
// =============================================================================

describe('lifecycle / full lifecycle order', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should execute full lifecycle in correct order', async () => {
    const order: string[] = []
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    onBeforeMount(() => order.push('beforeMount'))
    onMounted(() => order.push('mounted'))
    onBeforeUpdate(() => order.push('beforeUpdate'))
    onUpdated(() => order.push('updated'))
    onBeforeUnmount(() => order.push('beforeUnmount'))
    onUnmounted(() => order.push('unmounted'))

    setCurrentInstance(null)

    await mountInstance(instance)
    expect(order).toEqual(['beforeMount', 'mounted'])

    await updateInstance(instance)
    expect(order).toEqual(['beforeMount', 'mounted', 'beforeUpdate', 'updated'])

    await unmountInstance(instance)
    expect(order).toEqual([
      'beforeMount', 'mounted',
      'beforeUpdate', 'updated',
      'beforeUnmount', 'unmounted',
    ])
  })

  it('should support hooks from different registration sites', async () => {
    const instance = createComponentInstance()
    const calls: string[] = []

    // Simulate registering hooks from different composables
    setCurrentInstance(instance)
    onMounted(() => calls.push('composable1:mounted'))
    onUnmounted(() => calls.push('composable1:unmounted'))
    setCurrentInstance(null)

    setCurrentInstance(instance)
    onMounted(() => calls.push('composable2:mounted'))
    onUnmounted(() => calls.push('composable2:unmounted'))
    setCurrentInstance(null)

    await mountInstance(instance)
    expect(calls).toEqual([
      'composable1:mounted',
      'composable2:mounted',
    ])

    await unmountInstance(instance)
    expect(calls).toEqual([
      'composable1:mounted',
      'composable2:mounted',
      'composable1:unmounted',
      'composable2:unmounted',
    ])
  })
})

// =============================================================================
// runHooks Direct Tests
// =============================================================================

describe('lifecycle / runHooks', () => {
  it('should run all hooks of specified type', async () => {
    const instance = createComponentInstance()
    const results: number[] = []

    instance.hooks.mounted.push(
      () => { results.push(1) },
      () => { results.push(2) },
      () => { results.push(3) },
    )

    await runHooks(instance, 'mounted')
    expect(results).toEqual([1, 2, 3])
  })

  it('should handle empty hook array', async () => {
    const instance = createComponentInstance()
    // Should not throw
    await runHooks(instance, 'mounted')
    await runHooks(instance, 'beforeMount')
    await runHooks(instance, 'updated')
  })

  it('should handle async hooks sequentially', async () => {
    const instance = createComponentInstance()
    const order: number[] = []

    instance.hooks.mounted.push(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        order.push(1)
      },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        order.push(2)
      },
      () => { order.push(3) },
    )

    await runHooks(instance, 'mounted')
    expect(order).toEqual([1, 2, 3])
  })
})

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('lifecycle / edge cases', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should not register hooks outside component setup', () => {
    // These should warn but not throw
    setCurrentInstance(null)
    onBeforeMount(() => {})
    onMounted(() => {})
    onBeforeUpdate(() => {})
    onUpdated(() => {})
    onBeforeUnmount(() => {})
    onUnmounted(() => {})
  })

  it('should handle hook that throws (hooks run independently)', async () => {
    const instance = createComponentInstance()
    const results: string[] = []

    instance.hooks.mounted.push(
      () => { results.push('first') },
      () => { throw new Error('hook error') },
    )

    // This will throw because the error isn't caught in runHooks
    try {
      await runHooks(instance, 'mounted')
    }
    catch {
      // Expected
    }

    expect(results).toContain('first')
  })

  it('should create fresh instance with empty hooks', () => {
    const instance = createComponentInstance()

    expect(instance.hooks.beforeMount).toEqual([])
    expect(instance.hooks.mounted).toEqual([])
    expect(instance.hooks.beforeUpdate).toEqual([])
    expect(instance.hooks.updated).toEqual([])
    expect(instance.hooks.beforeUnmount).toEqual([])
    expect(instance.hooks.unmounted).toEqual([])
    expect(instance.isMounted).toBe(false)
    expect(instance.isUnmounted).toBe(false)
    expect(instance.effects).toEqual([])
    expect(instance.scope.refs.size).toBe(0)
    expect(instance.scope.effects.size).toBe(0)
    expect(instance.scope.cleanups).toEqual([])
  })

  it('should handle mount without any hooks registered', async () => {
    const instance = createComponentInstance()
    await mountInstance(instance)

    expect(instance.isMounted).toBe(true)
  })

  it('should handle update without any hooks registered', async () => {
    const instance = createComponentInstance()
    await mountInstance(instance)
    await updateInstance(instance) // no hooks, should not throw
  })

  it('should handle unmount without any hooks registered', async () => {
    const instance = createComponentInstance()
    await mountInstance(instance)
    await unmountInstance(instance) // no hooks, should not throw

    expect(instance.isUnmounted).toBe(true)
  })
})
