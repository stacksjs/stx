/**
 * Advanced Reactivity Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/reactivity/__tests__/reactive.spec.ts
 * - vue-core/packages/reactivity/__tests__/effect.spec.ts
 * - vue-core/packages/reactivity/__tests__/computed.spec.ts
 * - vue-core/packages/reactivity/__tests__/collections/Map.spec.ts
 * - vue-core/packages/reactivity/__tests__/collections/Set.spec.ts
 *
 * Tests verify advanced reactivity patterns: reactive+effect integration,
 * complex computed chains, non-plain object handling, and edge cases.
 */

import { describe, expect, it } from 'bun:test'
import {
  ref,
  reactive,
  computed,
  watchEffect,
  watch,
} from '../../src/reactivity'

// =============================================================================
// Reactive + watchEffect Integration Tests
// =============================================================================

describe('reactive advanced / reactive + watchEffect', () => {
  it('should track reactive property reads in watchEffect', () => {
    const state = reactive({ count: 0, name: 'test' })
    let dummy = -1

    watchEffect(() => {
      dummy = state.count
    })

    expect(dummy).toBe(0)
    state.count = 5
    expect(dummy).toBe(5)
  })

  it('should track nested reactive properties', () => {
    const state = reactive({
      user: {
        profile: {
          name: 'Alice',
        },
      },
    })
    let name = ''

    watchEffect(() => {
      name = state.user.profile.name
    })

    expect(name).toBe('Alice')
    state.user.profile.name = 'Bob'
    expect(name).toBe('Bob')
  })

  it('should track multiple reactive properties', () => {
    const state = reactive({ a: 1, b: 2, c: 3 })
    let sum = 0

    watchEffect(() => {
      sum = state.a + state.b + state.c
    })

    expect(sum).toBe(6)
    state.a = 10
    expect(sum).toBe(15)
    state.b = 20
    expect(sum).toBe(33)
  })

  it('should handle reactive array replacement', () => {
    const state = reactive({ items: [1, 2, 3] })
    let length = 0

    watchEffect(() => {
      length = state.items.length
    })

    expect(length).toBe(3)
    // Replacing the array reference triggers the effect
    state.items = [1, 2, 3, 4]
    expect(length).toBe(4)
  })

  it('should handle reactive top-level array', () => {
    const arr = reactive([1, 2, 3])
    // Direct operations on reactive arrays work
    arr.push(4)
    expect(arr).toEqual([1, 2, 3, 4])
    expect(arr.length).toBe(4)
  })

  it('should handle reactive property deletion', () => {
    const state = reactive<Record<string, any>>({ key: 'value' })
    let val: string | undefined

    watchEffect(() => {
      val = state.key
    })

    expect(val).toBe('value')
    delete state.key
    expect(val).toBeUndefined()
  })

  it('should handle reactive property addition', () => {
    const state = reactive<Record<string, any>>({})
    let val: string | undefined

    watchEffect(() => {
      val = state.newProp
    })

    expect(val).toBeUndefined()
    state.newProp = 'hello'
    // Property addition works because the watchEffect read state.newProp
    // (getting undefined) which subscribed it to the 'newProp' key.
    // When the property is set, the subscriber fires and re-runs the effect.
    expect(val).toBe('hello')
  })
})

// =============================================================================
// Computed Edge Cases
// =============================================================================

describe('reactive advanced / computed edge cases', () => {
  it('should handle computed that depends on another computed', () => {
    const a = ref(1)
    const b = computed(() => a.value + 1)
    const c = computed(() => b.value * 2)

    expect(c.value).toBe(4)
    a.value = 5
    expect(b.value).toBe(6)
    expect(c.value).toBe(12)
  })

  it('should handle diamond dependency pattern', () => {
    const a = ref(1)
    const b = computed(() => a.value * 2)
    const c = computed(() => a.value * 3)
    const d = computed(() => b.value + c.value)

    expect(d.value).toBe(5) // 2 + 3
    a.value = 2
    expect(d.value).toBe(10) // 4 + 6
  })

  it('should handle long computed chains', () => {
    const base = ref(1)
    const c1 = computed(() => base.value + 1)
    const c2 = computed(() => c1.value + 1)
    const c3 = computed(() => c2.value + 1)
    const c4 = computed(() => c3.value + 1)
    const c5 = computed(() => c4.value + 1)

    expect(c5.value).toBe(6)
    base.value = 10
    expect(c5.value).toBe(15)
  })

  it('should not recompute when dependency has not changed', () => {
    const a = ref(1)
    let computeCount = 0

    const c = computed(() => {
      computeCount++
      return a.value > 0 ? 'positive' : 'non-positive'
    })

    expect(c.value).toBe('positive')
    const afterFirst = computeCount // 1 (initial computation)

    // Same value access without dependency change should be cached
    expect(c.value).toBe('positive')
    expect(computeCount).toBe(afterFirst) // no recomputation

    // Changing dependency triggers recomputation, even if result is same
    a.value = 5
    expect(c.value).toBe('positive')
    expect(computeCount).toBeGreaterThan(afterFirst) // did recompute
  })

  it('should handle computed returning objects', () => {
    const items = ref([1, 2, 3, 4, 5])
    const filtered = computed(() => items.value.filter(x => x > 2))

    expect(filtered.value).toEqual([3, 4, 5])
    items.value = [1, 2, 3, 4, 5, 6, 7]
    expect(filtered.value).toEqual([3, 4, 5, 6, 7])
  })

  it('should handle computed with conditional branches', () => {
    const toggle = ref(true)
    const a = ref('yes')
    const b = ref('no')

    const result = computed(() => toggle.value ? a.value : b.value)

    expect(result.value).toBe('yes')

    toggle.value = false
    expect(result.value).toBe('no')

    b.value = 'nope'
    expect(result.value).toBe('nope')

    // Changing a should NOT trigger recompute since toggle is false
    // (in Vue, this is handled by effect tracking; in stx it depends
    // on the initial tracking)
  })

  it('should handle computed returning null/undefined', () => {
    const a = ref<string | null>('hello')
    const c = computed(() => a.value)

    expect(c.value).toBe('hello')
    a.value = null
    expect(c.value).toBeNull()
    a.value = undefined as any
    expect(c.value).toBeUndefined()
  })

  it('should handle computed with complex transformations', () => {
    const users = ref([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
    ])

    const sorted = computed(() =>
      [...users.value].sort((a, b) => a.age - b.age),
    )

    const names = computed(() =>
      sorted.value.map(u => u.name),
    )

    expect(names.value).toEqual(['Bob', 'Alice', 'Charlie'])

    users.value = [
      ...users.value,
      { name: 'Diana', age: 20 },
    ]

    expect(names.value).toEqual(['Diana', 'Bob', 'Alice', 'Charlie'])
  })
})

// =============================================================================
// Non-Plain Object Handling
// =============================================================================

describe('reactive advanced / non-plain objects', () => {
  it('should preserve Date objects', () => {
    const date = new Date('2024-01-01')
    const state = reactive({ created: date })
    expect(state.created).toBe(date)
    expect(state.created instanceof Date).toBe(true)
    expect(state.created.getFullYear()).toBe(2024)
  })

  it('should preserve RegExp objects', () => {
    const regex = /test/gi
    const state = reactive({ pattern: regex })
    expect(state.pattern).toBe(regex)
    expect(state.pattern instanceof RegExp).toBe(true)
    expect(state.pattern.test('TEST')).toBe(true)
  })

  it('should preserve Map objects', () => {
    const map = new Map([['key', 'value']])
    const state = reactive({ data: map })
    expect(state.data).toBe(map)
    expect(state.data instanceof Map).toBe(true)
    expect(state.data.get('key')).toBe('value')
  })

  it('should preserve Set objects', () => {
    const set = new Set([1, 2, 3])
    const state = reactive({ items: set })
    expect(state.items).toBe(set)
    expect(state.items instanceof Set).toBe(true)
    expect(state.items.has(2)).toBe(true)
  })

  it('should preserve Error objects', () => {
    const error = new Error('test')
    const state = reactive({ error })
    expect(state.error).toBe(error)
    expect(state.error instanceof Error).toBe(true)
    expect(state.error.message).toBe('test')
  })

  it('should preserve Promise objects', () => {
    const promise = Promise.resolve(42)
    const state = reactive({ pending: promise })
    expect(state.pending).toBe(promise)
    expect(state.pending instanceof Promise).toBe(true)
  })

  it('should make plain nested objects reactive', () => {
    const state = reactive({
      nested: { value: 1 },
    })

    // Plain objects should be proxied
    expect(state.nested.value).toBe(1)
    state.nested.value = 2
    expect(state.nested.value).toBe(2)
  })

  it('should handle null prototype objects', () => {
    const nullProto = Object.create(null)
    nullProto.key = 'value'
    const state = reactive({ data: nullProto })
    expect(state.data.key).toBe('value')
  })

  it('should handle mixed nested types', () => {
    const date = new Date()
    const state = reactive({
      user: {
        name: 'Alice',
        created: date,
        settings: {
          theme: 'dark',
        },
      },
    })

    expect(state.user.name).toBe('Alice')
    expect(state.user.created).toBe(date) // Date preserved
    expect(state.user.settings.theme).toBe('dark')

    state.user.name = 'Bob'
    expect(state.user.name).toBe('Bob')

    state.user.settings.theme = 'light'
    expect(state.user.settings.theme).toBe('light')
  })
})

// =============================================================================
// Reactive Array Tests
// =============================================================================

describe('reactive advanced / arrays', () => {
  it('should handle push/pop/shift/unshift', () => {
    const arr = reactive([1, 2, 3])

    arr.push(4)
    expect(arr).toEqual([1, 2, 3, 4])

    arr.pop()
    expect(arr).toEqual([1, 2, 3])

    arr.shift()
    expect(arr).toEqual([2, 3])

    arr.unshift(0)
    expect(arr).toEqual([0, 2, 3])
  })

  it('should handle splice', () => {
    const arr = reactive([1, 2, 3, 4, 5])
    arr.splice(1, 2)
    expect(arr).toEqual([1, 4, 5])

    arr.splice(1, 0, 2, 3)
    expect(arr).toEqual([1, 2, 3, 4, 5])
  })

  it('should handle sort', () => {
    const arr = reactive([3, 1, 2])
    arr.sort()
    expect(arr).toEqual([1, 2, 3])
  })

  it('should handle reverse', () => {
    const arr = reactive([1, 2, 3])
    arr.reverse()
    expect(arr).toEqual([3, 2, 1])
  })

  it('should handle map/filter/reduce on reactive arrays', () => {
    const arr = reactive([1, 2, 3, 4, 5])

    const doubled = arr.map(x => x * 2)
    expect(doubled).toEqual([2, 4, 6, 8, 10])

    const even = arr.filter(x => x % 2 === 0)
    expect(even).toEqual([2, 4])

    const sum = arr.reduce((acc, x) => acc + x, 0)
    expect(sum).toBe(15)
  })

  it('should handle nested arrays', () => {
    const state = reactive({
      matrix: [[1, 2], [3, 4]],
    })

    expect(state.matrix[0][0]).toBe(1)
    state.matrix[0][0] = 10
    expect(state.matrix[0][0]).toBe(10)
  })

  it('should handle length changes', () => {
    const arr = reactive([1, 2, 3])
    arr.length = 1
    expect(arr).toEqual([1])
  })

  it('should handle array of objects', () => {
    const arr = reactive([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])

    expect(arr[0].name).toBe('Alice')
    arr[0].name = 'Alicia'
    expect(arr[0].name).toBe('Alicia')

    arr.push({ id: 3, name: 'Charlie' })
    expect(arr.length).toBe(3)
    expect(arr[2].name).toBe('Charlie')
  })
})

// =============================================================================
// Ref Edge Cases
// =============================================================================

describe('reactive advanced / ref edge cases', () => {
  it('should handle rapid value changes', () => {
    const a = ref(0)
    const values: number[] = []

    a.subscribe((v) => values.push(v))

    for (let i = 1; i <= 100; i++) {
      a.value = i
    }

    expect(values.length).toBe(100)
    expect(values[0]).toBe(1)
    expect(values[99]).toBe(100)
  })

  it('should handle ref of ref-like objects', () => {
    const inner = { value: 42 }
    const outer = ref(inner)

    expect(outer.value.value).toBe(42)
    outer.value = { value: 100 }
    expect(outer.value.value).toBe(100)
  })

  it('should handle undefined to value transitions', () => {
    const a = ref<string | undefined>(undefined)
    const values: Array<string | undefined> = []

    a.subscribe((v) => values.push(v))

    a.value = 'hello'
    a.value = undefined
    a.value = 'world'

    expect(values).toEqual(['hello', undefined, 'world'])
  })

  it('should handle various falsy values', () => {
    const a = ref<any>(null)
    const values: any[] = []

    a.subscribe((v) => values.push(v))

    a.value = 0
    a.value = ''
    a.value = false
    a.value = undefined

    expect(values).toEqual([0, '', false, undefined])
  })

  it('should handle symbol values', () => {
    const sym1 = Symbol('test1')
    const sym2 = Symbol('test2')
    const a = ref(sym1)

    expect(a.value).toBe(sym1)
    a.value = sym2
    expect(a.value).toBe(sym2)
  })

  it('should handle bigint values', () => {
    const a = ref(BigInt(1))
    expect(a.value).toBe(BigInt(1))
    a.value = BigInt(999)
    expect(a.value).toBe(BigInt(999))
  })
})

// =============================================================================
// Watch Edge Cases
// =============================================================================

describe('reactive advanced / watch edge cases', () => {
  it('should handle watching a ref that changes to same type', () => {
    const count = ref(0)
    const changes: number[] = []

    watch(count, (val) => {
      changes.push(val)
    }, { flush: 'sync' })

    count.value = 1
    count.value = 2
    count.value = 3

    expect(changes).toEqual([1, 2, 3])
  })

  it('should handle watching with deep option on objects', () => {
    const obj = ref({ nested: { count: 0 } })
    const changes: any[] = []

    watch(obj, (val) => {
      changes.push(JSON.parse(JSON.stringify(val)))
    }, { flush: 'sync', deep: true })

    obj.value = { nested: { count: 1 } }
    expect(changes.length).toBe(1)
    expect(changes[0]).toEqual({ nested: { count: 1 } })
  })

  it('should handle immediate + sync watch', () => {
    const count = ref(42)
    const values: number[] = []

    watch(count, (val) => {
      values.push(val)
    }, { immediate: true, flush: 'sync' })

    expect(values).toEqual([42])

    count.value = 100
    expect(values).toEqual([42, 100])
  })

  it('should handle unwatch and rewatch', () => {
    const count = ref(0)
    let calls = 0

    const unwatch = watch(count, () => {
      calls++
    }, { flush: 'sync' })

    count.value = 1
    expect(calls).toBe(1)

    unwatch()
    count.value = 2
    expect(calls).toBe(1)

    // Re-watch
    let calls2 = 0
    watch(count, () => {
      calls2++
    }, { flush: 'sync' })

    count.value = 3
    expect(calls2).toBe(1)
    expect(calls).toBe(1) // original still unwatched
  })
})

// =============================================================================
// Reactive Object Comparison Tests
// =============================================================================

describe('reactive advanced / object identity', () => {
  it('reactive proxy should not equal original', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
  })

  it('should maintain property descriptor behavior', () => {
    const observed = reactive({ a: 1, b: 2 })
    expect(Object.keys(observed)).toEqual(['a', 'b'])
    expect('a' in observed).toBe(true)
    expect('c' in observed).toBe(false)
  })

  it('should support hasOwnProperty', () => {
    const observed = reactive({ a: 1 })
    expect(Object.prototype.hasOwnProperty.call(observed, 'a')).toBe(true)
    expect(Object.prototype.hasOwnProperty.call(observed, 'b')).toBe(false)
  })

  it('should support JSON.stringify', () => {
    const observed = reactive({ a: 1, b: [2, 3], c: { d: 4 } })
    const json = JSON.stringify(observed)
    expect(JSON.parse(json)).toEqual({ a: 1, b: [2, 3], c: { d: 4 } })
  })

  it('should support Object.assign', () => {
    const observed = reactive({ a: 1 })
    Object.assign(observed, { b: 2, c: 3 })
    expect(observed.a).toBe(1)
    expect((observed as any).b).toBe(2)
    expect((observed as any).c).toBe(3)
  })

  it('should support spread operator for reading', () => {
    const observed = reactive({ a: 1, b: 2 })
    const copy = { ...observed }
    expect(copy).toEqual({ a: 1, b: 2 })
  })

  it('should support Array.isArray on reactive arrays', () => {
    const arr = reactive([1, 2, 3])
    expect(Array.isArray(arr)).toBe(true)
  })

  it('should support typeof on reactive objects', () => {
    const obj = reactive({ a: 1 })
    expect(typeof obj).toBe('object')
  })
})

// =============================================================================
// Stress Tests
// =============================================================================

describe('reactive advanced / stress tests', () => {
  it('should handle many refs with subscribers', () => {
    const refs = Array.from({ length: 100 }, (_, i) => ref(i))
    const sums: number[] = []

    const total = computed(() =>
      refs.reduce((acc, r) => acc + r.value, 0),
    )

    expect(total.value).toBe(4950) // sum of 0..99

    refs[0].value = 100
    expect(total.value).toBe(5050)
  })

  it('should handle deeply nested reactive objects', () => {
    let nested: any = { value: 'deep' }
    for (let i = 0; i < 10; i++) {
      nested = { child: nested }
    }

    const state = reactive(nested)
    let current: any = state
    for (let i = 0; i < 10; i++) {
      current = current.child
    }
    expect(current.value).toBe('deep')
  })

  it('should handle computed chains with 10 levels', () => {
    const base = ref(1)
    let prev: any = base

    const chain: any[] = []
    for (let i = 0; i < 10; i++) {
      const dep = prev
      const c = computed(() => dep.value + 1)
      chain.push(c)
      prev = c
    }

    expect(chain[9].value).toBe(11)
    base.value = 10
    expect(chain[9].value).toBe(20)
  })
})
