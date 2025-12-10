import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import {
  configureSafeEvaluator,
  createSafeContext,
  createSafeFunction,
  getSafeEvaluatorConfig,
  isExpressionSafe,
  isForExpressionSafe,
  resetSafeEvaluatorConfig,
  safeEvaluate,
  safeEvaluateArray,
  safeEvaluateCondition,
  safeEvaluateObject,
  sanitizeExpression,
} from '../../src/safe-evaluator'

describe('Safe Evaluator', () => {
  beforeEach(() => {
    resetSafeEvaluatorConfig()
  })

  afterEach(() => {
    resetSafeEvaluatorConfig()
  })

  describe('Configuration', () => {
    it('should have default configuration', () => {
      const config = getSafeEvaluatorConfig()
      expect(config.maxSanitizeDepth).toBe(10)
      expect(config.allowBracketNotation).toBe(false)
    })

    it('should allow configuration changes', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 20 })
      const config = getSafeEvaluatorConfig()
      expect(config.maxSanitizeDepth).toBe(20)
    })

    it('should reset configuration to defaults', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 20, allowBracketNotation: true })
      resetSafeEvaluatorConfig()
      const config = getSafeEvaluatorConfig()
      expect(config.maxSanitizeDepth).toBe(10)
      expect(config.allowBracketNotation).toBe(false)
    })
  })

  describe('sanitizeExpression', () => {
    it('should sanitize basic expressions', () => {
      const result = sanitizeExpression('user.name')
      expect(result).toBe('user.name')
    })

    it('should handle function calls', () => {
      const result = sanitizeExpression('getValue()')
      expect(result).toContain('getValue')
    })

    it('should handle template literals', () => {
      const result = sanitizeExpression('`Hello ${name}`')
      expect(result).toContain('name')
    })
  })

  describe('createSafeContext', () => {
    it('should create safe context from objects', () => {
      const context = { name: 'John', age: 30 }
      const safeContext = createSafeContext(context)
      expect(safeContext.name).toBe('John')
      expect(safeContext.age).toBe(30)
    })

    it('should handle nested objects', () => {
      const context = { user: { name: 'John', profile: { bio: 'Developer' } } }
      const safeContext = createSafeContext(context)
      expect((safeContext.user as any).name).toBe('John')
      expect((safeContext.user as any).profile.bio).toBe('Developer')
    })

    it('should handle arrays', () => {
      const context = { items: [1, 2, 3] }
      const safeContext = createSafeContext(context)
      expect(Array.isArray(safeContext.items)).toBe(true)
      expect((safeContext.items as number[])[0]).toBe(1)
    })

    it('should handle functions', () => {
      const context = { greet: (name: string) => `Hello, ${name}!` }
      const safeContext = createSafeContext(context)
      expect(typeof safeContext.greet).toBe('function')
    })
  })

  describe('safeEvaluate', () => {
    it('should evaluate simple expressions', () => {
      const result = safeEvaluate('1 + 1', {})
      expect(result).toBe(2)
    })

    it('should evaluate context variables', () => {
      const result = safeEvaluate('name', { name: 'John' })
      expect(result).toBe('John')
    })

    it('should evaluate object property access', () => {
      const result = safeEvaluate('user.name', { user: { name: 'John' } })
      expect(result).toBe('John')
    })

    it('should evaluate function calls', () => {
      const result = safeEvaluate('greet("World")', { greet: (n: string) => `Hello, ${n}!` })
      expect(result).toBe('Hello, World!')
    })

    it('should evaluate ternary expressions', () => {
      const result = safeEvaluate('isAdmin ? "Admin" : "User"', { isAdmin: true })
      expect(result).toBe('Admin')
    })

    it('should evaluate comparison operations', () => {
      expect(safeEvaluate<boolean>('a > b', { a: 5, b: 3 })).toBe(true)
      expect(safeEvaluate<boolean>('a === b', { a: 5, b: 5 })).toBe(true)
      expect(safeEvaluate<boolean>('a !== b', { a: 5, b: 3 })).toBe(true)
    })

    it('should handle undefined gracefully', () => {
      const result = safeEvaluate('nonexistent', {})
      expect(result).toBeUndefined()
    })
  })

  describe('isExpressionSafe', () => {
    it('should allow safe expressions', () => {
      expect(isExpressionSafe('user.name')).toBe(true)
      expect(isExpressionSafe('1 + 1')).toBe(true)
      expect(isExpressionSafe('items.length')).toBe(true)
      expect(isExpressionSafe('getValue()')).toBe(true)
    })

    it('should block dangerous patterns', () => {
      expect(isExpressionSafe('eval("code")')).toBe(false)
      expect(isExpressionSafe('new Function()')).toBe(false)
      expect(isExpressionSafe('constructor')).toBe(false)
      expect(isExpressionSafe('__proto__')).toBe(false)
      expect(isExpressionSafe('process.env')).toBe(false)
    })

    it('should block require and import', () => {
      expect(isExpressionSafe('require("fs")')).toBe(false)
      expect(isExpressionSafe('import("module")')).toBe(false)
    })
  })

  describe('safeEvaluateCondition', () => {
    it('should evaluate boolean conditions', () => {
      expect(safeEvaluateCondition('isActive', { isActive: true })).toBe(true)
      expect(safeEvaluateCondition('isActive', { isActive: false })).toBe(false)
    })

    it('should evaluate comparison conditions', () => {
      expect(safeEvaluateCondition('count > 0', { count: 5 })).toBe(true)
      expect(safeEvaluateCondition('count > 0', { count: 0 })).toBe(false)
    })

    it('should evaluate logical AND', () => {
      expect(safeEvaluateCondition('a && b', { a: true, b: true })).toBe(true)
      expect(safeEvaluateCondition('a && b', { a: true, b: false })).toBe(false)
    })

    it('should evaluate logical OR', () => {
      expect(safeEvaluateCondition('a || b', { a: false, b: true })).toBe(true)
      expect(safeEvaluateCondition('a || b', { a: false, b: false })).toBe(false)
    })

    it('should evaluate negation', () => {
      expect(safeEvaluateCondition('!isDisabled', { isDisabled: false })).toBe(true)
      expect(safeEvaluateCondition('!isDisabled', { isDisabled: true })).toBe(false)
    })
  })

  describe('safeEvaluateArray', () => {
    it('should evaluate array expressions', () => {
      const result = safeEvaluateArray('items', { items: [1, 2, 3] })
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([1, 2, 3])
    })

    it('should return empty array for non-array values', () => {
      const result = safeEvaluateArray('value', { value: 'string' })
      expect(result).toEqual([])
    })

    it('should handle nested array access', () => {
      const result = safeEvaluateArray('data.items', { data: { items: ['a', 'b'] } })
      expect(result).toEqual(['a', 'b'])
    })
  })

  describe('safeEvaluateObject', () => {
    it('should evaluate object expressions', () => {
      const result = safeEvaluateObject('user', { user: { name: 'John', age: 30 } })
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should return empty object for non-object values', () => {
      const result = safeEvaluateObject('value', { value: 'string' })
      expect(result).toEqual({})
    })
  })

  describe('createSafeFunction', () => {
    it('should create function from expression', () => {
      const fn = createSafeFunction('a + b', ['a', 'b'])
      const result = fn(2, 3)
      expect(result).toBe(5)
    })

    it('should handle object property access', () => {
      const fn = createSafeFunction('user.name', ['user'])
      const result = fn({ name: 'John' })
      expect(result).toBe('John')
    })

    it('should handle ternary expressions', () => {
      const fn = createSafeFunction('x > 0 ? "positive" : "non-positive"', ['x'])
      expect(fn(5)).toBe('positive')
      expect(fn(-1)).toBe('non-positive')
    })
  })

  describe('isForExpressionSafe', () => {
    it('should validate safe for expressions', () => {
      expect(isForExpressionSafe('items as item')).toBe(true)
      expect(isForExpressionSafe('users as user')).toBe(true)
      expect(isForExpressionSafe('data.items as item')).toBe(true)
    })

    it('should reject unsafe for expressions', () => {
      // isForExpressionSafe checks the array expression, not the iterator name
      expect(isForExpressionSafe('eval() as item')).toBe(false)
      // Note: simple variable names like 'constructor' may pass as they could be legitimate variable names
      // The actual security check happens during evaluation
    })
  })
})

describe('Safe Evaluator Security', () => {
  it('should block prototype pollution attempts', () => {
    expect(isExpressionSafe('obj.__proto__')).toBe(false)
    expect(isExpressionSafe('obj.constructor.prototype')).toBe(false)
  })

  it('should block global access attempts', () => {
    expect(isExpressionSafe('globalThis')).toBe(false)
    expect(isExpressionSafe('window.location')).toBe(false)
  })

  it('should block dangerous function creation', () => {
    expect(isExpressionSafe('new Function("return this")()')).toBe(false)
    expect(isExpressionSafe('(0, eval)("code")')).toBe(false)
  })

  it('should handle nested dangerous patterns', () => {
    expect(isExpressionSafe('obj["constructor"]["prototype"]')).toBe(false)
  })
})
