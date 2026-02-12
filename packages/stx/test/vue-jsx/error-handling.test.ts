/**
 * Error Handling Tests
 *
 * Adapted from vue-core test suite:
 * - vue-core/packages/runtime-core/__tests__/errorHandling.spec.ts
 *
 * Tests verify that stx's error handling system (onErrorCaptured, handleError)
 * behaves consistently with Vue 3's error boundary system.
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
  type StxComponentInstance,
} from '../../src/composition-api'

// =============================================================================
// Error Propagation Tests
// =============================================================================

describe('error handling / onErrorCaptured', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should register error captured hook on current instance', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const handler = () => false
    onErrorCaptured(handler)

    expect(instance.errorCapturedHooks.length).toBe(1)
    expect(instance.errorCapturedHooks[0]).toBe(handler)

    setCurrentInstance(null)
  })

  it('should support multiple error captured hooks', () => {
    const instance = createComponentInstance()
    setCurrentInstance(instance)

    const handler1 = () => {}
    const handler2 = () => false
    const handler3 = () => true

    onErrorCaptured(handler1)
    onErrorCaptured(handler2)
    onErrorCaptured(handler3)

    expect(instance.errorCapturedHooks.length).toBe(3)

    setCurrentInstance(null)
  })

  it('should not register hook when no current instance', () => {
    setCurrentInstance(null)
    // Should not throw
    onErrorCaptured(() => false)
  })
})

// =============================================================================
// handleError Propagation Tests
// =============================================================================

describe('error handling / handleError propagation', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should propagate error to parent', () => {
    const errors: Array<{ error: Error, info: string }> = []

    const grandparent = createComponentInstance()
    const parent = createComponentInstance(grandparent)
    const child = createComponentInstance(parent)

    // Register handler on grandparent
    setCurrentInstance(grandparent)
    onErrorCaptured((error, _instance, info) => {
      errors.push({ error, info })
    })
    setCurrentInstance(null)

    // Trigger error from child
    const testError = new Error('test error')
    handleError(testError, child, 'render')

    expect(errors.length).toBe(1)
    expect(errors[0].error.message).toBe('test error')
    expect(errors[0].info).toBe('render')
  })

  it('should propagate through multiple ancestors', () => {
    const capturedAt: string[] = []

    const root = createComponentInstance()
    root.scopeId = 'root'

    const middle = createComponentInstance(root)
    middle.scopeId = 'middle'

    const leaf = createComponentInstance(middle)
    leaf.scopeId = 'leaf'

    // Register handlers on root and middle
    setCurrentInstance(root)
    onErrorCaptured((_error, _instance, info) => {
      capturedAt.push(`root:${info}`)
    })
    setCurrentInstance(null)

    setCurrentInstance(middle)
    onErrorCaptured((_error, _instance, info) => {
      capturedAt.push(`middle:${info}`)
    })
    setCurrentInstance(null)

    handleError(new Error('test'), leaf, 'setup')

    // Middle handler should run first (closest ancestor), then root
    expect(capturedAt).toEqual(['middle:setup', 'root:setup'])
  })

  it('should stop propagation when handler returns false', () => {
    const capturedAt: string[] = []

    const root = createComponentInstance()
    const parent = createComponentInstance(root)
    const child = createComponentInstance(parent)

    // Root handler
    setCurrentInstance(root)
    onErrorCaptured(() => {
      capturedAt.push('root')
    })
    setCurrentInstance(null)

    // Parent handler returns false to stop propagation
    setCurrentInstance(parent)
    onErrorCaptured(() => {
      capturedAt.push('parent')
      return false
    })
    setCurrentInstance(null)

    handleError(new Error('test'), child, 'render')

    // Only parent should have caught it
    expect(capturedAt).toEqual(['parent'])
  })

  it('should continue propagation when handler returns void/undefined', () => {
    const capturedAt: string[] = []

    const root = createComponentInstance()
    const parent = createComponentInstance(root)
    const child = createComponentInstance(parent)

    setCurrentInstance(root)
    onErrorCaptured(() => {
      capturedAt.push('root')
    })
    setCurrentInstance(null)

    setCurrentInstance(parent)
    onErrorCaptured(() => {
      capturedAt.push('parent')
      // returns void — should continue propagation
    })
    setCurrentInstance(null)

    handleError(new Error('test'), child, 'render')

    expect(capturedAt).toEqual(['parent', 'root'])
  })

  it('should pass the error-originating instance to handler', () => {
    let capturedInstance: StxComponentInstance | null = null

    const parent = createComponentInstance()
    const child = createComponentInstance(parent)

    setCurrentInstance(parent)
    onErrorCaptured((_error, instance) => {
      capturedInstance = instance
    })
    setCurrentInstance(null)

    handleError(new Error('test'), child, 'render')

    expect(capturedInstance).toBe(child)
  })

  it('should handle null instance in handleError', () => {
    // Should not throw when instance is null
    handleError(new Error('test'), null, 'render')
  })

  it('should handle error from component with no parent', () => {
    const root = createComponentInstance()
    // Error on root — no parent to catch it
    handleError(new Error('test'), root, 'render')
    // Should not throw
  })
})

// =============================================================================
// Error Handling in Component Tree Scenarios
// =============================================================================

describe('error handling / component tree scenarios', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should handle errors at different tree levels', () => {
    const errors: Array<{ level: string, error: string }> = []

    // Build a 4-level tree
    const root = createComponentInstance()
    const l1 = createComponentInstance(root)
    const l2 = createComponentInstance(l1)
    const l3 = createComponentInstance(l2)

    // Register handlers at each level
    setCurrentInstance(root)
    onErrorCaptured((err) => { errors.push({ level: 'root', error: err.message }) })
    setCurrentInstance(null)

    setCurrentInstance(l1)
    onErrorCaptured((err) => { errors.push({ level: 'l1', error: err.message }) })
    setCurrentInstance(null)

    setCurrentInstance(l2)
    onErrorCaptured((err) => { errors.push({ level: 'l2', error: err.message }) })
    setCurrentInstance(null)

    // Error from deepest level
    handleError(new Error('deep error'), l3, 'setup')

    expect(errors).toEqual([
      { level: 'l2', error: 'deep error' },
      { level: 'l1', error: 'deep error' },
      { level: 'root', error: 'deep error' },
    ])
  })

  it('should handle multiple errors independently', () => {
    const errors: string[] = []

    const root = createComponentInstance()
    const child1 = createComponentInstance(root)
    const child2 = createComponentInstance(root)

    setCurrentInstance(root)
    onErrorCaptured((err) => {
      errors.push(err.message)
    })
    setCurrentInstance(null)

    handleError(new Error('error1'), child1, 'render')
    handleError(new Error('error2'), child2, 'setup')

    expect(errors).toEqual(['error1', 'error2'])
  })

  it('should support error handler that captures error info', () => {
    const captures: Array<{ message: string, info: string }> = []

    const root = createComponentInstance()
    const child = createComponentInstance(root)

    setCurrentInstance(root)
    onErrorCaptured((error, _instance, info) => {
      captures.push({ message: error.message, info })
      return false
    })
    setCurrentInstance(null)

    handleError(new Error('render failed'), child, 'render')
    handleError(new Error('setup failed'), child, 'setup')
    handleError(new Error('watch failed'), child, 'watcher callback')

    expect(captures).toEqual([
      { message: 'render failed', info: 'render' },
      { message: 'setup failed', info: 'setup' },
      { message: 'watch failed', info: 'watcher callback' },
    ])
  })

  it('should handle sibling component errors independently', () => {
    const rootErrors: string[] = []

    const root = createComponentInstance()
    const parent1 = createComponentInstance(root)
    const parent2 = createComponentInstance(root)
    const child1 = createComponentInstance(parent1)
    const child2 = createComponentInstance(parent2)

    let parent1Stopped = false

    setCurrentInstance(root)
    onErrorCaptured((err) => { rootErrors.push(err.message) })
    setCurrentInstance(null)

    // parent1 stops propagation
    setCurrentInstance(parent1)
    onErrorCaptured(() => {
      parent1Stopped = true
      return false
    })
    setCurrentInstance(null)

    handleError(new Error('from child1'), child1, 'render')
    handleError(new Error('from child2'), child2, 'render')

    expect(parent1Stopped).toBe(true)
    // child1 error stopped at parent1, child2 error propagates to root
    expect(rootErrors).toEqual(['from child2'])
  })
})

// =============================================================================
// Error Categories Tests
// =============================================================================

describe('error handling / error categories', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should categorize render errors', () => {
    const infos: string[] = []
    const root = createComponentInstance()
    const child = createComponentInstance(root)

    setCurrentInstance(root)
    onErrorCaptured((_err, _inst, info) => { infos.push(info) })
    setCurrentInstance(null)

    handleError(new Error(''), child, 'render')
    handleError(new Error(''), child, 'setup')
    handleError(new Error(''), child, 'watcher callback')
    handleError(new Error(''), child, 'watcher getter')
    handleError(new Error(''), child, 'lifecycle hook')
    handleError(new Error(''), child, 'event handler')

    expect(infos).toEqual([
      'render',
      'setup',
      'watcher callback',
      'watcher getter',
      'lifecycle hook',
      'event handler',
    ])
  })

  it('should handle TypeError', () => {
    const errors: Error[] = []
    const root = createComponentInstance()
    const child = createComponentInstance(root)

    setCurrentInstance(root)
    onErrorCaptured((err) => { errors.push(err) })
    setCurrentInstance(null)

    const typeError = new TypeError('Cannot read property of undefined')
    handleError(typeError, child, 'render')

    expect(errors[0]).toBeInstanceOf(TypeError)
    expect(errors[0].message).toBe('Cannot read property of undefined')
  })

  it('should handle RangeError', () => {
    const errors: Error[] = []
    const root = createComponentInstance()
    const child = createComponentInstance(root)

    setCurrentInstance(root)
    onErrorCaptured((err) => { errors.push(err) })
    setCurrentInstance(null)

    const rangeError = new RangeError('Maximum call stack size exceeded')
    handleError(rangeError, child, 'render')

    expect(errors[0]).toBeInstanceOf(RangeError)
  })
})

// =============================================================================
// Error Handler Return Value Tests
// =============================================================================

describe('error handling / handler return values', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should stop on first handler returning false in same level', () => {
    const calls: number[] = []

    const root = createComponentInstance()
    const child = createComponentInstance(root)

    setCurrentInstance(root)
    onErrorCaptured(() => {
      calls.push(1)
      return false
    })
    onErrorCaptured(() => {
      calls.push(2)
    })
    setCurrentInstance(null)

    handleError(new Error('test'), child, 'render')

    // First handler returns false, stopping propagation
    // But both handlers on the same level still run
    // Actually in our implementation, returning false from any handler stops all
    expect(calls).toEqual([1])
  })

  it('should handle handler that returns true', () => {
    const calls: string[] = []

    const root = createComponentInstance()
    const parent = createComponentInstance(root)
    const child = createComponentInstance(parent)

    setCurrentInstance(root)
    onErrorCaptured(() => {
      calls.push('root')
    })
    setCurrentInstance(null)

    setCurrentInstance(parent)
    onErrorCaptured(() => {
      calls.push('parent')
      return true as any // truthy value — should NOT stop propagation
    })
    setCurrentInstance(null)

    handleError(new Error('test'), child, 'render')

    expect(calls).toEqual(['parent', 'root'])
  })
})

// =============================================================================
// Integration with Provide/Inject Tests
// =============================================================================

describe('error handling / integration with provide/inject', () => {
  beforeEach(() => {
    setCurrentInstance(null)
  })

  it('should maintain provide/inject chain alongside error handling', () => {
    const errors: string[] = []
    const root = createComponentInstance()
    setCurrentInstance(root)
    provide('theme', 'dark')
    onErrorCaptured((err) => {
      errors.push(err.message)
      return false
    })
    setCurrentInstance(null)

    const child = createComponentInstance(root)
    setCurrentInstance(child)
    const theme = inject('theme')
    expect(theme).toBe('dark')
    setCurrentInstance(null)

    // Error handling and provide/inject should coexist
    handleError(new Error('test'), child, 'render')
    expect(errors).toContain('test')
  })
})
