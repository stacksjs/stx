import { describe, expect, it, beforeEach } from 'bun:test'
import {
  provide,
  inject,
  defineEmits,
  defineExpose,
  nextTick,
  getCurrentInstance,
  onErrorCaptured,
  createComponentInstance,
  setCurrentInstance,
  resetComponentState,
  useSlots,
  useAttrs,
  createProvideContext,
} from '../../src/composition-api'

describe('Composition API - provide/inject', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should provide and inject values within a component instance', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide('theme', 'dark')
    const theme = inject('theme')

    expect(theme).toBe('dark')
    setCurrentInstance(null)
  })

  it('should inject default value when key not provided', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const value = inject('nonexistent', 'fallback')
    expect(value).toBe('fallback')

    setCurrentInstance(null)
  })

  it('should inject from parent instance', () => {
    const parent = createComponentInstance()
    parent.provides.set('color', 'blue')

    const child = createComponentInstance(parent)
    setCurrentInstance(child)

    const color = inject('color')
    expect(color).toBe('blue')

    setCurrentInstance(null)
  })

  it('should allow child to override parent provides', () => {
    const parent = createComponentInstance()
    parent.provides.set('color', 'blue')

    const child = createComponentInstance(parent)
    setCurrentInstance(child)

    provide('color', 'red')
    const color = inject('color')
    expect(color).toBe('red')

    setCurrentInstance(null)
  })

  it('should support symbol keys', () => {
    const key = Symbol('injection-key')
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    provide(key, { data: 42 })
    const value = inject<{ data: number }>(key)
    expect(value?.data).toBe(42)

    setCurrentInstance(null)
  })
})

describe('Composition API - defineEmits', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should return an emit function', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const emit = defineEmits(['click', 'change'])
    expect(typeof emit).toBe('function')

    setCurrentInstance(null)
  })

  it('should store emit on the instance', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const emit = defineEmits(['update:modelValue'])
    expect(instance.emit).toBe(emit)

    setCurrentInstance(null)
  })
})

describe('Composition API - defineExpose', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should store exposed properties on the instance', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    defineExpose({ count: 0, increment: () => {} })
    expect(instance.exposed).toEqual({ count: 0, increment: expect.any(Function) })

    setCurrentInstance(null)
  })
})

describe('Composition API - nextTick', () => {
  it('should return a promise', () => {
    const result = nextTick()
    expect(result).toBeInstanceOf(Promise)
  })

  it('should execute callback after microtask', async () => {
    let value = 0
    await nextTick(() => {
      value = 1
    })
    expect(value).toBe(1)
  })

  it('should resolve without callback', async () => {
    await nextTick()
    // If we get here, it resolved
    expect(true).toBe(true)
  })
})

describe('Composition API - getCurrentInstance', () => {
  beforeEach(() => {
    // Use resetComponentState to clear both currentInstance AND instanceStack
    // This guards against parallel tests leaving stale entries on the stack
    resetComponentState()
  })

  it('should return null when no instance is set', () => {
    resetComponentState()
    expect(getCurrentInstance()).toBeNull()
  })

  it('should return the current instance', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    expect(getCurrentInstance()).toBe(instance)

    setCurrentInstance(null)
  })
})

describe('Composition API - onErrorCaptured', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should register error captured hook', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const handler = () => false
    onErrorCaptured(handler)

    expect(instance.errorCapturedHooks).toContain(handler)

    setCurrentInstance(null)
  })
})

describe('Composition API - useSlots/useAttrs', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should return empty object when no instance', () => {
    expect(useSlots()).toEqual({})
    expect(useAttrs()).toEqual({})
  })

  it('should return instance slots and attrs', () => {
    const instance = createComponentInstance()
    instance.slots = { default: 'content', header: 'header content' }
    instance.attrs = { 'data-id': '123' }
    setCurrentInstance(instance)

    expect(useSlots()).toEqual({ default: 'content', header: 'header content' })
    expect(useAttrs()).toEqual({ 'data-id': '123' })

    setCurrentInstance(null)
  })
})

describe('Composition API - Server-side Context', () => {
  it('should create provide context from parent', () => {
    const parentContext: Record<string, any> = {
      __provides: { theme: 'dark' },
      title: 'Test',
    }

    const ctx = createProvideContext(parentContext)
    expect(ctx.title).toBe('Test')
    expect(typeof ctx.__provide).toBe('function')
    expect(typeof ctx.__inject).toBe('function')
  })

  it('should inject from context', () => {
    const parentContext: Record<string, any> = {
      __provides: { theme: 'dark' },
    }

    const ctx = createProvideContext(parentContext)
    expect(ctx.__inject('theme')).toBe('dark')
  })

  it('should provide new values to context', () => {
    const parentContext: Record<string, any> = {}
    const ctx = createProvideContext(parentContext)

    ctx.__provide('locale', 'en')
    expect(ctx.__inject('locale')).toBe('en')
  })

  it('should return default value when not found', () => {
    const parentContext: Record<string, any> = {}
    const ctx = createProvideContext(parentContext)

    expect(ctx.__inject('missing', 'default')).toBe('default')
  })
})
