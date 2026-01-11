import { afterEach, describe, expect, it } from 'bun:test'
import {
  assert,
  clearErrorHandler,
  ComponentError,
  createDebugger,
  devAssert,
  errorBoundary,
  ErrorTypes,
  handleError,
  setErrorHandler,
  warn,
  wrapErrorHandler,
} from '../../src/utils/error-handling'

// Clean up global error handler after each test to prevent test pollution
afterEach(() => {
  clearErrorHandler()
})

describe('ComponentError', () => {
  it('should create error with component and message', () => {
    const error = new ComponentError('Button', 'Invalid prop')
    expect(error.message).toContain('[Button]')
    expect(error.message).toContain('Invalid prop')
    expect(error.component).toBe('Button')
  })

  it('should include prop context', () => {
    const error = new ComponentError('Button', 'Invalid variant', {
      prop: 'variant',
      received: 'invalid',
      expected: ['primary', 'secondary'],
    })

    expect(error.message).toContain('variant')
    expect(error.message).toContain('invalid')
    expect(error.message).toContain('primary')
  })

  it('should include documentation link', () => {
    const error = new ComponentError('Button', 'Error message')
    expect(error.message).toContain('Documentation')
    expect(error.message).toContain('button')
  })

  it('should format to JSON', () => {
    const error = new ComponentError('Button', 'Test error')
    const json = error.toJSON()

    expect(json.name).toBe('ComponentError')
    expect(json.component).toBe('Button')
    expect(json.message).toBeDefined()
    expect(json.context).toBeDefined()
  })
})

describe('ErrorTypes', () => {
  describe('invalidProp', () => {
    it('should create invalid prop error', () => {
      const error = ErrorTypes.invalidProp('Button', 'variant', 'invalid', ['primary', 'secondary'])

      expect(error.message).toContain('Invalid prop value')
      expect(error.message).toContain('variant')
      expect(error.message).toContain('invalid')
      expect(error.context.prop).toBe('variant')
    })
  })

  describe('requiredProp', () => {
    it('should create required prop error', () => {
      const error = ErrorTypes.requiredProp('Button', 'onClick')

      expect(error.message).toContain('Required prop')
      expect(error.message).toContain('onClick')
      expect(error.context.prop).toBe('onClick')
    })
  })

  describe('invalidType', () => {
    it('should create invalid type error', () => {
      const error = ErrorTypes.invalidType('Button', 'count', 'string', 'number')

      expect(error.message).toContain('Invalid type')
      expect(error.message).toContain('count')
      expect(error.context.expected).toBe('number')
    })
  })

  describe('componentNotFound', () => {
    it('should create component not found error', () => {
      const error = ErrorTypes.componentNotFound('MyComponent')

      expect(error.message).toContain('not found')
      expect(error.message).toContain('MyComponent')
    })
  })

  describe('invalidChildren', () => {
    it('should create invalid children error', () => {
      const error = ErrorTypes.invalidChildren('List', 'string', 'ListItem components')

      expect(error.message).toContain('Invalid children')
      expect(error.message).toContain('List')
    })
  })

  describe('stateUpdate', () => {
    it('should create state update error', () => {
      const originalError = new Error('State error')
      const error = ErrorTypes.stateUpdate('Form', 'values', originalError)

      expect(error.message).toContain('Failed to update state')
      expect(error.message).toContain('values')
      expect(error.context.details).toContain('State error')
    })
  })

  describe('eventHandler', () => {
    it('should create event handler error', () => {
      const originalError = new Error('Handler error')
      const error = ErrorTypes.eventHandler('Button', 'onClick', originalError)

      expect(error.message).toContain('onClick')
      expect(error.message).toContain('event handler')
    })
  })

  describe('render', () => {
    it('should create render error', () => {
      const originalError = new Error('Render failed')
      const error = ErrorTypes.render('MyComponent', originalError)

      expect(error.message).toContain('Failed to render')
      expect(error.context.details).toContain('Render failed')
    })
  })
})

describe('Error Handling Functions', () => {
  describe('assert', () => {
    it('should not throw for truthy conditions', () => {
      expect(() => {
        assert(true, new Error('Should not throw'))
      }).not.toThrow()

      expect(() => {
        assert(1, new Error('Should not throw'))
      }).not.toThrow()

      expect(() => {
        assert('truthy', new Error('Should not throw'))
      }).not.toThrow()
    })

    it('should throw for falsy conditions', () => {
      expect(() => {
        assert(false, new Error('Test error'))
      }).toThrow('Test error')

      expect(() => {
        assert(0, new ComponentError('Test', 'Error'))
      }).toThrow(ComponentError)

      expect(() => {
        assert(null, new Error('Null error'))
      }).toThrow('Null error')
    })
  })

  describe('devAssert', () => {
    it('should not throw for truthy conditions', () => {
      expect(() => {
        devAssert(true, new Error('Should not throw'))
      }).not.toThrow()
    })

    // Note: devAssert only throws in development, behavior varies by NODE_ENV
  })

  describe('wrapErrorHandler', () => {
    it('should wrap synchronous function', () => {
      const fn = () => 'success'
      const wrapped = wrapErrorHandler(fn, 'Button', 'onClick')

      expect(wrapped()).toBe('success')
    })

    it('should catch and wrap synchronous errors', () => {
      const fn = () => {
        throw new Error('Test error')
      }
      const wrapped = wrapErrorHandler(fn, 'Button', 'onClick')

      expect(() => wrapped()).toThrow(ComponentError)
    })

    it('should handle async functions', async () => {
      const fn = async () => 'success'
      const wrapped = wrapErrorHandler(fn, 'Button', 'onClick')

      const result = await wrapped()
      expect(result).toBe('success')
    })

    it('should catch async errors', async () => {
      const fn = async () => {
        throw new Error('Async error')
      }
      const wrapped = wrapErrorHandler(fn, 'Button', 'onClick')

      await expect(wrapped()).rejects.toThrow(ComponentError)
    })

    it('should preserve function arguments', () => {
      const fn = (a: number, b: number) => a + b
      const wrapped = wrapErrorHandler(fn, 'Button', 'onClick')

      expect(wrapped(2, 3)).toBe(5)
    })
  })

  describe('errorBoundary', () => {
    it('should return result on success', () => {
      const result = errorBoundary(
        'TestComponent',
        () => 'success',
        'fallback',
      )

      expect(result).toBe('success')
    })

    it('should return fallback on error', () => {
      const result = errorBoundary(
        'TestComponent',
        () => {
          throw new Error('Test error')
        },
        'fallback',
      )

      expect(result).toBe('fallback')
    })

    it('should handle complex return types', () => {
      const result = errorBoundary(
        'TestComponent',
        () => ({ data: 'value' }),
        { data: 'fallback' },
      )

      expect(result).toEqual({ data: 'value' })
    })
  })

  describe('createDebugger', () => {
    it('should create debugger with component name', () => {
      const debug = createDebugger('Button')

      expect(debug.log).toBeDefined()
      expect(debug.warn).toBeDefined()
      expect(debug.error).toBeDefined()
    })

    it('should have working methods', () => {
      const debug = createDebugger('TestComponent')

      expect(() => {
        debug.log('Test log')
        debug.warn('Test warn')
        debug.error('Test error')
      }).not.toThrow()
    })
  })
})

describe('Global Error Handler', () => {
  it('should allow setting error handler', () => {
    let captured: Error | null = null
    setErrorHandler((error) => {
      captured = error
    })

    const error = new ComponentError('Test', 'Error')
    handleError(error, { throwError: false })

    expect(captured as Error | null).toBe(error)
  })

  it('should handle errors without throwing when configured', () => {
    expect(() => {
      handleError(new Error('Test'), { throwError: false })
    }).not.toThrow()
  })

  it('should throw errors when configured', () => {
    expect(() => {
      handleError(new Error('Test'), { throwError: true })
    }).toThrow()
  })
})

describe('Warning Function', () => {
  it('should not throw when called', () => {
    expect(() => {
      warn('Button', 'Test warning', { prop: 'variant' })
    }).not.toThrow()
  })

  it('should accept context', () => {
    expect(() => {
      warn('Button', 'Test', {
        prop: 'test',
        received: 'value',
        expected: 'other',
      })
    }).not.toThrow()
  })
})

describe('Error Message Formatting', () => {
  it('should include all context information', () => {
    const error = new ComponentError('Button', 'Test error', {
      prop: 'variant',
      received: 'invalid',
      expected: ['primary', 'secondary'],
      details: 'Additional details',
      docsUrl: 'https://example.com/docs',
    })

    expect(error.message).toContain('[Button]')
    expect(error.message).toContain('Test error')
    expect(error.message).toContain('variant')
    expect(error.message).toContain('invalid')
    expect(error.message).toContain('primary')
    expect(error.message).toContain('Additional details')
    expect(error.message).toContain('https://example.com/docs')
  })
})
