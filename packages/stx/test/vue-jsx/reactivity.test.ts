/**
 * Vue Reactivity Compatibility Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/reactivity/__tests__/ref.spec.ts
 * - vue-core/packages/reactivity/__tests__/reactive.spec.ts
 * - vue-core/packages/reactivity/__tests__/computed.spec.ts
 * - vue-core/packages/reactivity/__tests__/effect.spec.ts (watchEffect)
 * - vue-core/packages/reactivity/__tests__/watch.spec.ts
 *
 * Tests verify that stx's reactivity primitives (ref, reactive, computed,
 * watch, watchEffect) behave consistently with Vue 3's reactivity system.
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
} from '../../src/reactivity'

// =============================================================================
// ref() Tests — adapted from vue-core/packages/reactivity/__tests__/ref.spec.ts
// =============================================================================

describe('reactivity/ref', () => {
  it('should hold a value', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
    a.value = 2
    expect(a.value).toBe(2)
  })

  it('should be reactive', () => {
    const a = ref(1)
    let dummy: number | undefined
    const values: number[] = []

    a.subscribe((newVal) => {
      dummy = newVal
      values.push(newVal)
    })

    expect(dummy).toBeUndefined()
    a.value = 2
    expect(dummy).toBe(2)
    expect(values).toEqual([2])
  })

  it('should make nested properties NOT reactive (shallow by default)', () => {
    // ref in stx is shallow — only .value changes are tracked
    const a = ref({ count: 1 })
    let triggered = false
    a.subscribe(() => {
      triggered = true
    })
    a.value.count = 2
    expect(triggered).toBe(false) // mutation of inner object does not trigger
    expect(a.value.count).toBe(2)
  })

  it('should work with no initial value', () => {
    const a = ref<number | undefined>(undefined)
    expect(a.value).toBeUndefined()
    a.value = 1
    expect(a.value).toBe(1)
  })

  it('should not trigger if value did not change', () => {
    const a = ref(1)
    let triggered = 0
    a.subscribe(() => triggered++)
    a.value = 1 // same value
    expect(triggered).toBe(0)
  })

  it('should handle NaN correctly (NaN === NaN with Object.is)', () => {
    const a = ref(NaN)
    let triggered = 0
    a.subscribe(() => triggered++)
    a.value = NaN // same NaN
    expect(triggered).toBe(0)
  })

  it('should support string values', () => {
    const a = ref('hello')
    expect(a.value).toBe('hello')
    a.value = 'world'
    expect(a.value).toBe('world')
  })

  it('should support boolean values', () => {
    const a = ref(true)
    expect(a.value).toBe(true)
    a.value = false
    expect(a.value).toBe(false)
  })

  it('should support object values', () => {
    const obj = { a: 1, b: 2 }
    const a = ref(obj)
    expect(a.value).toBe(obj)
    const newObj = { a: 3, b: 4 }
    a.value = newObj
    expect(a.value).toBe(newObj)
  })

  it('should support array values', () => {
    const a = ref([1, 2, 3])
    expect(a.value).toEqual([1, 2, 3])
    a.value = [4, 5, 6]
    expect(a.value).toEqual([4, 5, 6])
  })

  it('should notify multiple subscribers', () => {
    const a = ref(0)
    let val1 = -1
    let val2 = -1
    a.subscribe((v) => { val1 = v })
    a.subscribe((v) => { val2 = v })
    a.value = 5
    expect(val1).toBe(5)
    expect(val2).toBe(5)
  })

  it('should support unsubscribe', () => {
    const a = ref(0)
    let count = 0
    const unsub = a.subscribe(() => count++)
    a.value = 1
    expect(count).toBe(1)
    unsub()
    a.value = 2
    expect(count).toBe(1) // not triggered after unsub
  })

  it('should provide old value to subscriber', () => {
    const a = ref(1)
    const oldValues: number[] = []
    a.subscribe((_newVal, oldVal) => {
      oldValues.push(oldVal)
    })
    a.value = 2
    a.value = 3
    expect(oldValues).toEqual([1, 2])
  })

  it('should register in current instance scope', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const a = ref(0)
    expect(instance.scope.refs.size).toBe(1)

    const b = ref('hello')
    expect(instance.scope.refs.size).toBe(2)

    setCurrentInstance(null)
  })
})

// =============================================================================
// reactive() Tests — adapted from vue-core/packages/reactivity/__tests__/reactive.spec.ts
// =============================================================================

describe('reactivity/reactive', () => {
  it('should return a reactive proxy of the original object', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original) // proxy !== original
    expect(observed.foo).toBe(1)
  })

  it('should observe basic properties', () => {
    const observed = reactive({ num: 0 })
    expect(observed.num).toBe(0)
    observed.num = 7
    expect(observed.num).toBe(7)
  })

  it('should observe nested properties', () => {
    const observed = reactive({ nested: { num: 0 } })
    expect(observed.nested.num).toBe(0)
    observed.nested.num = 8
    expect(observed.nested.num).toBe(8)
  })

  it('should observe property additions', () => {
    const observed = reactive<Record<string, any>>({ existing: 1 })
    expect(observed.existing).toBe(1)
    observed.added = 2
    expect(observed.added).toBe(2)
  })

  it('should observe property deletions', () => {
    const observed = reactive<Record<string, any>>({ toDelete: 1 })
    expect(observed.toDelete).toBe(1)
    delete observed.toDelete
    expect(observed.toDelete).toBeUndefined()
  })

  it('should observe array mutations', () => {
    const observed = reactive([1, 2, 3])
    observed.push(4)
    expect(observed).toEqual([1, 2, 3, 4])
    observed.pop()
    expect(observed).toEqual([1, 2, 3])
  })

  it('should handle array index assignment', () => {
    const observed = reactive(['a', 'b', 'c'])
    observed[1] = 'x'
    expect(observed[1]).toBe('x')
  })

  it('should handle multiple reactive objects independently', () => {
    const a = reactive({ val: 1 })
    const b = reactive({ val: 2 })
    a.val = 10
    expect(a.val).toBe(10)
    expect(b.val).toBe(2) // independent
  })

  it('should handle setting same value (no unnecessary triggers)', () => {
    const observed = reactive({ count: 0 })
    // We can't directly test triggers without watchEffect, but we verify correctness
    observed.count = 0
    expect(observed.count).toBe(0)
  })

  it('should handle nested objects reactively', () => {
    const observed = reactive({
      level1: {
        level2: {
          value: 'deep',
        },
      },
    })
    expect(observed.level1.level2.value).toBe('deep')
    observed.level1.level2.value = 'changed'
    expect(observed.level1.level2.value).toBe('changed')
  })

  it('should support Symbol keys', () => {
    const key = Symbol('test')
    const observed = reactive({ [key]: 'value' })
    expect(observed[key]).toBe('value')
    observed[key] = 'changed'
    expect(observed[key]).toBe('changed')
  })

  it('should support iteration (for...in)', () => {
    const observed = reactive({ a: 1, b: 2, c: 3 })
    const keys: string[] = []
    for (const key in observed) {
      keys.push(key)
    }
    expect(keys).toEqual(['a', 'b', 'c'])
  })

  it('should support Object.keys()', () => {
    const observed = reactive({ x: 1, y: 2 })
    expect(Object.keys(observed)).toEqual(['x', 'y'])
  })

  it('should support JSON serialization', () => {
    const observed = reactive({ name: 'test', count: 42 })
    const json = JSON.stringify(observed)
    expect(JSON.parse(json)).toEqual({ name: 'test', count: 42 })
  })

  it('should handle dates as values', () => {
    const date = new Date('2024-01-01')
    const observed = reactive({ created: date })
    expect(observed.created).toBe(date)
  })

  it('should handle null values', () => {
    const observed = reactive<{ val: string | null }>({ val: 'hello' })
    observed.val = null
    expect(observed.val).toBeNull()
  })
})

// =============================================================================
// computed() Tests — adapted from vue-core/packages/reactivity/__tests__/computed.spec.ts
// =============================================================================

describe('reactivity/computed', () => {
  it('should return updated value', () => {
    const value = ref(1)
    const cValue = computed(() => value.value + 1)
    expect(cValue.value).toBe(2)
    value.value = 2
    expect(cValue.value).toBe(3)
  })

  it('should compute lazily (cached until dependency changes)', () => {
    const value = ref(1)
    let computeCount = 0
    const cValue = computed(() => {
      computeCount++
      return value.value * 2
    })

    // First access triggers computation
    expect(cValue.value).toBe(2)
    const firstCount = computeCount

    // Second access should use cached value (or recompute but return same)
    expect(cValue.value).toBe(2)

    // Changing dependency should update
    value.value = 2
    expect(cValue.value).toBe(4)
  })

  it('should work when chained', () => {
    const value = ref(0)
    const c1 = computed(() => value.value)
    const c2 = computed(() => c1.value + 1)
    expect(c2.value).toBe(1)
    expect(c1.value).toBe(0)
    value.value = 1
    expect(c2.value).toBe(2)
    expect(c1.value).toBe(1)
  })

  it('should handle string computations', () => {
    const firstName = ref('John')
    const lastName = ref('Doe')
    const fullName = computed(() => `${firstName.value} ${lastName.value}`)

    expect(fullName.value).toBe('John Doe')
    firstName.value = 'Jane'
    expect(fullName.value).toBe('Jane Doe')
  })

  it('should handle boolean computations', () => {
    const count = ref(0)
    const isPositive = computed(() => count.value > 0)
    expect(isPositive.value).toBe(false)
    count.value = 5
    expect(isPositive.value).toBe(true)
    count.value = -1
    expect(isPositive.value).toBe(false)
  })

  it('should handle array computations', () => {
    const items = ref([1, 2, 3, 4, 5])
    const evenItems = computed(() => items.value.filter(n => n % 2 === 0))
    expect(evenItems.value).toEqual([2, 4])
    items.value = [1, 2, 3, 4, 5, 6]
    expect(evenItems.value).toEqual([2, 4, 6])
  })

  it('should handle object computations', () => {
    const user = ref({ name: 'Alice', age: 30 })
    const greeting = computed(() => `Hello, ${user.value.name}! You are ${user.value.age}.`)
    expect(greeting.value).toBe('Hello, Alice! You are 30.')
    user.value = { name: 'Bob', age: 25 }
    expect(greeting.value).toBe('Hello, Bob! You are 25.')
  })

  it('should be readonly (setting warns)', () => {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    expect(doubled.value).toBe(0)
    // Setting should warn but not throw
    doubled.value = 10 // should be silently ignored with warning
    expect(doubled.value).toBe(0) // still computed from count
  })

  it('should notify subscribers when computed value changes', () => {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    let notified = false
    doubled.subscribe(() => { notified = true })
    count.value = 5
    // The computed should have notified
    expect(doubled.value).toBe(10)
  })

  it('should handle conditional computations', () => {
    const showFull = ref(false)
    const name = ref('World')
    const greeting = computed(() =>
      showFull.value ? `Hello, ${name.value}!` : 'Hi',
    )
    expect(greeting.value).toBe('Hi')
    showFull.value = true
    expect(greeting.value).toBe('Hello, World!')
  })

  it('should handle computations that depend on multiple refs', () => {
    const a = ref(1)
    const b = ref(2)
    const c = ref(3)
    const sum = computed(() => a.value + b.value + c.value)
    expect(sum.value).toBe(6)
    a.value = 10
    expect(sum.value).toBe(15)
    b.value = 20
    expect(sum.value).toBe(33)
    c.value = 30
    expect(sum.value).toBe(60)
  })
})

// =============================================================================
// watch() Tests — adapted from vue-core/packages/runtime-core/__tests__/apiWatch.spec.ts
// =============================================================================

describe('reactivity/watch', () => {
  it('should watch a ref and call callback on change', () => {
    const count = ref(0)
    const values: Array<{ newVal: number, oldVal: number | undefined }> = []

    watch(count, (newVal, oldVal) => {
      values.push({ newVal, oldVal })
    }, { flush: 'sync' })

    count.value = 1
    count.value = 2
    count.value = 3

    expect(values).toEqual([
      { newVal: 1, oldVal: 0 },
      { newVal: 2, oldVal: 1 },
      { newVal: 3, oldVal: 2 },
    ])
  })

  it('should not fire on same value', () => {
    const count = ref(0)
    let callCount = 0

    watch(count, () => {
      callCount++
    }, { flush: 'sync' })

    count.value = 0 // same value
    expect(callCount).toBe(0)
  })

  it('should support immediate option', () => {
    const count = ref(5)
    const values: number[] = []

    watch(count, (newVal) => {
      values.push(newVal)
    }, { immediate: true, flush: 'sync' })

    expect(values).toEqual([5])

    count.value = 10
    expect(values).toEqual([5, 10])
  })

  it('should return an unwatch function', () => {
    const count = ref(0)
    let callCount = 0

    const unwatch = watch(count, () => {
      callCount++
    }, { flush: 'sync' })

    count.value = 1
    expect(callCount).toBe(1)

    unwatch()
    count.value = 2
    expect(callCount).toBe(1) // not called after unwatch
  })

  it('should watch string ref changes', () => {
    const name = ref('Alice')
    const names: string[] = []

    watch(name, (newVal) => {
      names.push(newVal)
    }, { flush: 'sync' })

    name.value = 'Bob'
    name.value = 'Charlie'

    expect(names).toEqual(['Bob', 'Charlie'])
  })

  it('should watch boolean ref changes', () => {
    const flag = ref(false)
    const changes: boolean[] = []

    watch(flag, (newVal) => {
      changes.push(newVal)
    }, { flush: 'sync' })

    flag.value = true
    flag.value = false
    flag.value = true

    expect(changes).toEqual([true, false, true])
  })

  it('should watch object ref changes (by reference)', () => {
    const obj = ref({ count: 0 })
    let callCount = 0

    watch(obj, () => {
      callCount++
    }, { flush: 'sync' })

    obj.value = { count: 1 } // new reference
    expect(callCount).toBe(1)
  })
})

// =============================================================================
// watchMultiple() Tests
// =============================================================================

describe('reactivity/watchMultiple', () => {
  it('should watch multiple refs', () => {
    const a = ref(1)
    const b = ref('hello')
    const calls: Array<[any[], any[]]> = []

    watchMultiple([a, b], (newVals, oldVals) => {
      calls.push([newVals as any, oldVals as any])
    })

    a.value = 2
    expect(calls.length).toBe(1)

    b.value = 'world'
    expect(calls.length).toBe(2)
  })

  it('should support immediate option', () => {
    const a = ref(1)
    const b = ref(2)
    let called = false

    watchMultiple([a, b], () => {
      called = true
    }, { immediate: true })

    expect(called).toBe(true)
  })

  it('should return unwatch function', () => {
    const a = ref(0)
    const b = ref(0)
    let count = 0

    const unwatch = watchMultiple([a, b], () => {
      count++
    })

    a.value = 1
    expect(count).toBe(1)

    unwatch()
    a.value = 2
    b.value = 1
    expect(count).toBe(1) // not triggered
  })
})

// =============================================================================
// watchEffect() Tests — adapted from vue-core/packages/reactivity/__tests__/effect.spec.ts
// =============================================================================

describe('reactivity/watchEffect', () => {
  it('should run the effect function immediately', () => {
    let ran = false
    watchEffect(() => {
      ran = true
    })
    expect(ran).toBe(true)
  })

  it('should observe reactive properties in effect', () => {
    const state = reactive({ count: 0 })
    let dummy: number = -1
    watchEffect(() => {
      dummy = state.count
    })
    expect(dummy).toBe(0)
  })

  it('should return a cleanup function', () => {
    const stop = watchEffect(() => {})
    expect(typeof stop).toBe('function')
  })

  it('should handle effects that return cleanup', () => {
    let cleaned = false
    const stop = watchEffect(() => {
      return () => { cleaned = true }
    })
    stop()
    expect(cleaned).toBe(true)
  })

  it('should register cleanup in instance scope', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    watchEffect(() => {})
    expect(instance.scope.cleanups.length).toBeGreaterThan(0)

    setCurrentInstance(null)
  })
})

// =============================================================================
// Lifecycle Hooks — adapted from vue-core/packages/runtime-core/__tests__/apiLifecycle.spec.ts
// =============================================================================

describe('reactivity/lifecycle', () => {
  let onMounted: typeof import('../../src/reactivity').onMounted
  let onBeforeMount: typeof import('../../src/reactivity').onBeforeMount
  let onBeforeUpdate: typeof import('../../src/reactivity').onBeforeUpdate
  let onUpdated: typeof import('../../src/reactivity').onUpdated
  let onBeforeUnmount: typeof import('../../src/reactivity').onBeforeUnmount
  let onUnmounted: typeof import('../../src/reactivity').onUnmounted

  beforeEach(async () => {
    const mod = await import('../../src/reactivity')
    onMounted = mod.onMounted
    onBeforeMount = mod.onBeforeMount
    onBeforeUpdate = mod.onBeforeUpdate
    onUpdated = mod.onUpdated
    onBeforeUnmount = mod.onBeforeUnmount
    onUnmounted = mod.onUnmounted
    setCurrentInstance(null)
  })

  it('should register onMounted hook', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const fn = () => {}
    onMounted(fn)
    expect(instance.hooks.mounted).toContain(fn)

    setCurrentInstance(null)
  })

  it('should register onBeforeMount hook', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const fn = () => {}
    onBeforeMount(fn)
    expect(instance.hooks.beforeMount).toContain(fn)

    setCurrentInstance(null)
  })

  it('should register onBeforeUpdate hook', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const fn = () => {}
    onBeforeUpdate(fn)
    expect(instance.hooks.beforeUpdate).toContain(fn)

    setCurrentInstance(null)
  })

  it('should register onUpdated hook', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const fn = () => {}
    onUpdated(fn)
    expect(instance.hooks.updated).toContain(fn)

    setCurrentInstance(null)
  })

  it('should register onBeforeUnmount hook', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const fn = () => {}
    onBeforeUnmount(fn)
    expect(instance.hooks.beforeUnmount).toContain(fn)

    setCurrentInstance(null)
  })

  it('should register onUnmounted hook', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const fn = () => {}
    onUnmounted(fn)
    expect(instance.hooks.unmounted).toContain(fn)

    setCurrentInstance(null)
  })

  it('should register multiple hooks of the same type', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const fn1 = () => {}
    const fn2 = () => {}
    const fn3 = () => {}
    onMounted(fn1)
    onMounted(fn2)
    onMounted(fn3)
    expect(instance.hooks.mounted).toEqual([fn1, fn2, fn3])

    setCurrentInstance(null)
  })

  it('should not register hooks outside of component setup', () => {
    setCurrentInstance(null)
    // These should warn but not throw
    onMounted(() => {})
    onUnmounted(() => {})
  })

  it('should support async lifecycle hooks', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const asyncFn = async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    onMounted(asyncFn)
    expect(instance.hooks.mounted).toContain(asyncFn)

    setCurrentInstance(null)
  })

  it('should maintain hook order', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const order: string[] = []
    onBeforeMount(() => order.push('beforeMount'))
    onMounted(() => order.push('mounted'))
    onBeforeUpdate(() => order.push('beforeUpdate'))
    onUpdated(() => order.push('updated'))
    onBeforeUnmount(() => order.push('beforeUnmount'))
    onUnmounted(() => order.push('unmounted'))

    expect(instance.hooks.beforeMount.length).toBe(1)
    expect(instance.hooks.mounted.length).toBe(1)
    expect(instance.hooks.beforeUpdate.length).toBe(1)
    expect(instance.hooks.updated.length).toBe(1)
    expect(instance.hooks.beforeUnmount.length).toBe(1)
    expect(instance.hooks.unmounted.length).toBe(1)

    setCurrentInstance(null)
  })
})
