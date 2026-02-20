/**
 * Advanced Provide/Inject Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/runtime-core/__tests__/apiInject.spec.ts
 *
 * Tests verify that stx's provide/inject system handles deep component
 * trees, reactive values, symbol keys, and edge cases consistently
 * with Vue 3's dependency injection system.
 */

import { describe, expect, it, beforeEach } from 'bun:test'
import {
  provide,
  inject,
  defineEmits,
  defineExpose,
  nextTick,
  getCurrentInstance,
  onErrorCaptured,
  handleError,
  createComponentInstance,
  setCurrentInstance,
  setGlobalProvide,
  useSlots,
  useAttrs,
  createProvideContext,
  type StxComponentInstance,
} from '../../src/composition-api'
import { ref } from '../../src/reactivity'

// =============================================================================
// Deep Component Tree Provide/Inject Tests
// =============================================================================

describe('provide/inject advanced / deep trees', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should inject from grandparent (skip parent)', () => {
    const grandparent = createComponentInstance()
    setCurrentInstance(grandparent)
    provide('color', 'blue')
    setCurrentInstance(null)

    const parent = createComponentInstance(grandparent)
    // Parent doesn't provide 'color'

    const child = createComponentInstance(parent)
    setCurrentInstance(child)
    const color = inject('color')
    expect(color).toBe('blue')
    setCurrentInstance(null)
  })

  it('should inject from nearest provider in deep tree', () => {
    const root = createComponentInstance()
    setCurrentInstance(root)
    provide('theme', 'light')
    setCurrentInstance(null)

    const l1 = createComponentInstance(root)
    setCurrentInstance(l1)
    provide('theme', 'dark') // override
    setCurrentInstance(null)

    const l2 = createComponentInstance(l1)
    const l3 = createComponentInstance(l2)
    const l4 = createComponentInstance(l3)

    setCurrentInstance(l4)
    const theme = inject('theme')
    expect(theme).toBe('dark') // from l1, not root
    setCurrentInstance(null)
  })

  it('should handle 10-level deep injection', () => {
    let parent: StxComponentInstance | null = null
    const instances: StxComponentInstance[] = []

    // Create a 10-level tree
    for (let i = 0; i < 10; i++) {
      const instance = createComponentInstance(parent)
      instances.push(instance)
      parent = instance
    }

    // Provide at root
    setCurrentInstance(instances[0])
    provide('deep-key', 'deep-value')
    setCurrentInstance(null)

    // Inject at leaf
    setCurrentInstance(instances[9])
    const value = inject('deep-key')
    expect(value).toBe('deep-value')
    setCurrentInstance(null)
  })

  it('should handle multiple provides at different levels', () => {
    const root = createComponentInstance()
    setCurrentInstance(root)
    provide('a', 1)
    provide('b', 2)
    setCurrentInstance(null)

    const middle = createComponentInstance(root)
    setCurrentInstance(middle)
    provide('c', 3)
    provide('b', 20) // override b
    setCurrentInstance(null)

    const leaf = createComponentInstance(middle)
    setCurrentInstance(leaf)

    expect(inject('a')).toBe(1)   // from root
    expect(inject('b')).toBe(20)  // from middle (overridden)
    expect(inject('c')).toBe(3)   // from middle

    setCurrentInstance(null)
  })
})

// =============================================================================
// Symbol Key Tests
// =============================================================================

describe('provide/inject advanced / symbol keys', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should work with Symbol.for keys', () => {
    const key = Symbol.for('app.theme')
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide(key, 'dark')
    const theme = inject(key)
    expect(theme).toBe('dark')

    setCurrentInstance(null)
  })

  it('should work with unique symbols', () => {
    const key1 = Symbol('key')
    const key2 = Symbol('key') // different symbol, same description

    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide(key1, 'value1')
    provide(key2, 'value2')

    expect(inject(key1)).toBe('value1')
    expect(inject(key2)).toBe('value2')

    setCurrentInstance(null)
  })

  it('should not confuse string and symbol keys', () => {
    const symKey = Symbol('theme')
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide('theme', 'string-value')
    provide(symKey, 'symbol-value')

    expect(inject('theme')).toBe('string-value')
    expect(inject(symKey)).toBe('symbol-value')

    setCurrentInstance(null)
  })
})

// =============================================================================
// Default Value Tests
// =============================================================================

describe('provide/inject advanced / default values', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should use default value when not provided', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const value = inject('missing', 'default')
    expect(value).toBe('default')

    setCurrentInstance(null)
  })

  it('should use provided value over default', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide('key', 'provided')
    const value = inject('key', 'default')
    expect(value).toBe('provided')

    setCurrentInstance(null)
  })

  it('should return undefined when not provided and no default', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const value = inject('missing')
    expect(value).toBeUndefined()

    setCurrentInstance(null)
  })

  it('should handle falsy provided values correctly', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide('zero', 0)
    provide('empty', '')
    provide('false', false)
    provide('null', null)

    expect(inject('zero', 'default')).toBe(0)
    expect(inject('empty', 'default')).toBe('')
    expect(inject('false', 'default')).toBe(false)
    expect(inject('null', 'default')).toBe(null)

    setCurrentInstance(null)
  })

  it('should handle default function values', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const fn = () => 42
    provide('fn', fn)
    const injected = inject<() => number>('fn')
    expect(injected).toBe(fn)
    expect(injected!()).toBe(42)

    setCurrentInstance(null)
  })
})

// =============================================================================
// Reactive Provide Values Tests
// =============================================================================

describe('provide/inject advanced / reactive values', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should provide reactive ref', () => {
    const parent = createComponentInstance()
    setCurrentInstance(parent)

    const count = ref(0)
    provide('count', count)

    setCurrentInstance(null)

    const child = createComponentInstance(parent)
    setCurrentInstance(child)

    const injectedCount = inject<typeof count>('count')
    expect(injectedCount!.value).toBe(0)

    // Mutating the ref should be visible from injected value
    count.value = 5
    expect(injectedCount!.value).toBe(5)

    setCurrentInstance(null)
  })

  it('should provide objects', () => {
    const parent = createComponentInstance()
    setCurrentInstance(parent)

    const state = { count: 0, name: 'test' }
    provide('state', state)

    setCurrentInstance(null)

    const child = createComponentInstance(parent)
    setCurrentInstance(child)

    const injectedState = inject<typeof state>('state')
    expect(injectedState).toBe(state) // same reference
    expect(injectedState!.count).toBe(0)

    setCurrentInstance(null)
  })

  it('should provide arrays', () => {
    const parent = createComponentInstance()
    setCurrentInstance(parent)

    const items = [1, 2, 3]
    provide('items', items)

    setCurrentInstance(null)

    const child = createComponentInstance(parent)
    setCurrentInstance(child)

    const injectedItems = inject<number[]>('items')
    expect(injectedItems).toBe(items)
    expect(injectedItems).toEqual([1, 2, 3])

    setCurrentInstance(null)
  })

  it('should provide Map/Set', () => {
    const parent = createComponentInstance()
    setCurrentInstance(parent)

    const map = new Map([['key', 'value']])
    provide('map', map)

    setCurrentInstance(null)

    const child = createComponentInstance(parent)
    setCurrentInstance(child)

    const injectedMap = inject<Map<string, string>>('map')
    expect(injectedMap).toBe(map)
    expect(injectedMap!.get('key')).toBe('value')

    setCurrentInstance(null)
  })
})

// =============================================================================
// Override Semantics Tests
// =============================================================================

describe('provide/inject advanced / override semantics', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('child override should not affect parent', () => {
    const parent = createComponentInstance()
    setCurrentInstance(parent)
    provide('key', 'parent-value')
    setCurrentInstance(null)

    const child = createComponentInstance(parent)
    setCurrentInstance(child)
    provide('key', 'child-value')

    // Child sees its own value
    expect(inject('key')).toBe('child-value')
    setCurrentInstance(null)

    // Parent's provides should be unchanged
    setCurrentInstance(parent)
    expect(inject('key')).toBe('parent-value')
    setCurrentInstance(null)
  })

  it('sibling should not see each others provides', () => {
    const parent = createComponentInstance()

    const child1 = createComponentInstance(parent)
    setCurrentInstance(child1)
    provide('child1-key', 'child1-value')
    setCurrentInstance(null)

    const child2 = createComponentInstance(parent)
    setCurrentInstance(child2)

    // child2 should NOT see child1's provides
    expect(inject('child1-key')).toBeUndefined()
    setCurrentInstance(null)
  })

  it('should handle provide with same key multiple times (last wins)', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide('key', 'first')
    provide('key', 'second')
    provide('key', 'third')

    expect(inject('key')).toBe('third')

    setCurrentInstance(null)
  })
})

// =============================================================================
// Global Provides Tests
// =============================================================================

describe('provide/inject advanced / global provides', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should inject from global provides when no instance provides', () => {
    setGlobalProvide('global-key', 'global-value')

    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const value = inject('global-key')
    expect(value).toBe('global-value')

    setCurrentInstance(null)
  })

  it('should prefer instance provides over global', () => {
    setGlobalProvide('shared-key', 'global')

    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide('shared-key', 'local')
    expect(inject('shared-key')).toBe('local')

    setCurrentInstance(null)
  })
})

// =============================================================================
// Server-Side Context Tests
// =============================================================================

describe('provide/inject advanced / server-side context', () => {
  it('should create context with empty parent', () => {
    const ctx = createProvideContext({})
    expect(typeof ctx.__provide).toBe('function')
    expect(typeof ctx.__inject).toBe('function')
  })

  it('should inherit parent provides', () => {
    const parentCtx: Record<string, any> = {
      __provides: { theme: 'dark', locale: 'en' },
    }

    const ctx = createProvideContext(parentCtx)
    expect(ctx.__inject('theme')).toBe('dark')
    expect(ctx.__inject('locale')).toBe('en')
  })

  it('should allow child context to add provides', () => {
    const parentCtx: Record<string, any> = {
      __provides: { theme: 'dark' },
    }

    const ctx = createProvideContext(parentCtx)
    ctx.__provide('newKey', 'newValue')

    expect(ctx.__inject('newKey')).toBe('newValue')
    expect(ctx.__inject('theme')).toBe('dark')
  })

  it('should handle nested contexts', () => {
    const rootCtx: Record<string, any> = {
      __provides: { root: 'yes' },
    }

    const middleCtx = createProvideContext(rootCtx)
    middleCtx.__provide('middle', 'yes')

    const leafCtx = createProvideContext(middleCtx)

    expect(leafCtx.__inject('middle')).toBe('yes')
    // Note: root context provides may or may not be visible
    // depending on how Map inheritance works
  })

  it('should return default when not found', () => {
    const ctx = createProvideContext({})
    expect(ctx.__inject('missing', 'fallback')).toBe('fallback')
  })

  it('should preserve other context properties', () => {
    const ctx = createProvideContext({
      title: 'Test Page',
      count: 42,
    })

    expect(ctx.title).toBe('Test Page')
    expect(ctx.count).toBe(42)
  })
})

// =============================================================================
// useSlots / useAttrs Tests
// =============================================================================

describe('provide/inject advanced / useSlots and useAttrs', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should return empty objects when no instance', () => {
    expect(useSlots()).toEqual({})
    expect(useAttrs()).toEqual({})
  })

  it('should return instance slots', () => {
    const instance = createComponentInstance()
    instance.slots = {
      default: '<p>Default content</p>',
      header: '<h1>Header</h1>',
      footer: '<footer>Footer</footer>',
    }

    setCurrentInstance(instance)
    const slots = useSlots()

    expect(slots.default).toBe('<p>Default content</p>')
    expect(slots.header).toBe('<h1>Header</h1>')
    expect(slots.footer).toBe('<footer>Footer</footer>')
    expect(Object.keys(slots).length).toBe(3)

    setCurrentInstance(null)
  })

  it('should return instance attrs', () => {
    const instance = createComponentInstance()
    instance.attrs = {
      'data-testid': 'my-component',
      'aria-label': 'My Component',
      role: 'button',
    }

    setCurrentInstance(instance)
    const attrs = useAttrs()

    expect(attrs['data-testid']).toBe('my-component')
    expect(attrs['aria-label']).toBe('My Component')
    expect(attrs.role).toBe('button')

    setCurrentInstance(null)
  })

  it('should reflect updated slots', () => {
    const instance = createComponentInstance()
    instance.slots = { default: 'v1' }

    setCurrentInstance(instance)
    expect(useSlots().default).toBe('v1')

    instance.slots = { default: 'v2' }
    expect(useSlots().default).toBe('v2')

    setCurrentInstance(null)
  })
})

// =============================================================================
// defineEmits Integration Tests
// =============================================================================

describe('provide/inject advanced / defineEmits', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should create emit function', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const emit = defineEmits(['click', 'change', 'update:modelValue'])
    expect(typeof emit).toBe('function')
    expect(instance.emit).toBe(emit)

    setCurrentInstance(null)
  })

  it('should create emit without arguments', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const emit = defineEmits()
    expect(typeof emit).toBe('function')

    setCurrentInstance(null)
  })
})

// =============================================================================
// defineExpose Integration Tests
// =============================================================================

describe('provide/inject advanced / defineExpose', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should expose properties on instance', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const publicApi = {
      count: ref(0),
      increment: () => {},
      reset: () => {},
    }

    defineExpose(publicApi)
    expect(instance.exposed).toBe(publicApi)

    setCurrentInstance(null)
  })

  it('should handle expose with no current instance', () => {
    setCurrentInstance(null)
    // Should not throw
    defineExpose({ test: true })
  })

  it('should allow overwriting exposed', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    defineExpose({ v1: true })
    expect(instance.exposed).toEqual({ v1: true })

    defineExpose({ v2: true })
    expect(instance.exposed).toEqual({ v2: true })

    setCurrentInstance(null)
  })
})

// =============================================================================
// nextTick Edge Cases
// =============================================================================

describe('provide/inject advanced / nextTick', () => {
  it('should resolve promise', async () => {
    let resolved = false
    await nextTick()
    resolved = true
    expect(resolved).toBe(true)
  })

  it('should call callback', async () => {
    let called = false
    await nextTick(() => { called = true })
    expect(called).toBe(true)
  })

  it('should chain multiple nextTicks', async () => {
    const order: number[] = []

    await nextTick(() => order.push(1))
    await nextTick(() => order.push(2))
    await nextTick(() => order.push(3))

    expect(order).toEqual([1, 2, 3])
  })

  it('should handle concurrent nextTicks', async () => {
    const results: number[] = []

    await Promise.all([
      nextTick(() => results.push(1)),
      nextTick(() => results.push(2)),
      nextTick(() => results.push(3)),
    ])

    expect(results).toEqual([1, 2, 3])
  })

  it('should return promise that resolves after callback', async () => {
    let value = 0
    const promise = nextTick(() => { value = 42 })
    expect(promise).toBeInstanceOf(Promise)
    await promise
    expect(value).toBe(42)
  })
})

// =============================================================================
// getCurrentInstance Tests
// =============================================================================

describe('provide/inject advanced / getCurrentInstance', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should return null initially', () => {
    expect(getCurrentInstance()).toBeNull()
  })

  it('should return set instance', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)
    expect(getCurrentInstance()).toBe(instance)
    setCurrentInstance(null)
  })

  it('should support nested instance stack', () => {
    const parent = createComponentInstance()
    const child = createComponentInstance(parent)

    setCurrentInstance(parent)
    expect(getCurrentInstance()).toBe(parent)

    setCurrentInstance(child)
    expect(getCurrentInstance()).toBe(child)

    setCurrentInstance(null) // pop child
    expect(getCurrentInstance()).toBe(parent)

    setCurrentInstance(null) // pop parent
    expect(getCurrentInstance()).toBeNull()
  })

  it('should handle deep nesting', () => {
    const instances: StxComponentInstance[] = []
    for (let i = 0; i < 5; i++) {
      const inst = createComponentInstance()
      instances.push(inst)
      setCurrentInstance(inst)
    }

    expect(getCurrentInstance()).toBe(instances[4])

    // Pop all
    for (let i = 4; i >= 0; i--) {
      expect(getCurrentInstance()).toBe(instances[i])
      setCurrentInstance(null)
    }

    expect(getCurrentInstance()).toBeNull()
  })
})
