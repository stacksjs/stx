import type { StxOptions } from '../../src/types'
import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { processDirectives } from '../../src/process'
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

const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }

async function processTemplate(template: string, context: Record<string, any> = {}, filePath: string = 'test.stx', options: StxOptions = defaultOptions): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

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

describe('isForExpressionSafe Hardening', () => {
  it('should allow safe for-loop expressions', () => {
    expect(isForExpressionSafe('let i = 0; i < 10; i++')).toBe(true)
    expect(isForExpressionSafe('let i = arr.length - 1; i >= 0; i--')).toBe(true)
  })

  it('should block fetch()', () => {
    expect(isForExpressionSafe('let i = 0; fetch("http://evil.com"); i < 1; i++')).toBe(false)
  })

  it('should block Bun and Deno globals', () => {
    expect(isForExpressionSafe('Bun.write("file", "data")')).toBe(false)
    expect(isForExpressionSafe('Deno.readFile("secret")')).toBe(false)
  })

  it('should block console access', () => {
    expect(isForExpressionSafe('console.log("leak")')).toBe(false)
  })

  it('should block this keyword', () => {
    expect(isForExpressionSafe('this.constructor("evil")()')).toBe(false)
  })

  it('should block Reflect and Proxy', () => {
    expect(isForExpressionSafe('Reflect.apply(eval, null, ["code"])')).toBe(false)
    expect(isForExpressionSafe('new Proxy({}, {})')).toBe(false)
  })

  it('should block prototype access', () => {
    expect(isForExpressionSafe('obj.prototype.pollute = true')).toBe(false)
  })

  it('should block bind/call/apply', () => {
    expect(isForExpressionSafe('fn.bind(null)()')).toBe(false)
    expect(isForExpressionSafe('fn.call(this, arg)')).toBe(false)
    expect(isForExpressionSafe('fn.apply(null, args)')).toBe(false)
  })

  it('should block process access', () => {
    expect(isForExpressionSafe('process.exit(1)')).toBe(false)
  })

  it('should allow safe comparison expressions', () => {
    expect(isForExpressionSafe('i > 5')).toBe(true)
    expect(isForExpressionSafe('i === 10')).toBe(true)
    expect(isForExpressionSafe('x >= y')).toBe(true)
  })

  it('should block unsafe expressions in break conditions', () => {
    expect(isForExpressionSafe('fetch("evil")')).toBe(false)
    expect(isForExpressionSafe('process.exit()')).toBe(false)
    expect(isForExpressionSafe('require("child_process")')).toBe(false)
    expect(isForExpressionSafe('Bun.write("x", "y")')).toBe(false)
  })
})

describe('sanitizeObject Built-in Type Preservation', () => {
  it('should allow _id, _name, _count in safe context', () => {
    const context = createSafeContext({
      _id: 42,
      _name: 'Test',
      _count: 7,
      __internal: 'hidden',
    })
    expect(context._id).toBe(42)
    expect(context._name).toBe('Test')
    expect(context._count).toBe(7)
    expect(context.__internal).toBeUndefined()
  })

  it('should sanitize nested objects with single-underscore keys', () => {
    const userObj: Record<string, unknown> = { _id: 1, name: 'Test' }
    Object.defineProperty(userObj, '__internal', { value: 'hidden', enumerable: true })
    const context = createSafeContext({ user: userObj })
    const user = context.user as Record<string, unknown>
    expect(user._id).toBe(1)
    expect(user.name).toBe('Test')
    expect(user.__internal).toBeUndefined()
  })

  it('should evaluate expressions with underscore-prefixed variables', () => {
    const result = safeEvaluate('_id + _count', { _id: 10, _count: 5 })
    expect(result).toBe(15)
  })

  it('should preserve Date objects', () => {
    const date = new Date('2024-01-01')
    const ctx = createSafeContext({ myDate: date })
    expect(ctx.myDate).toBeInstanceOf(Date)
    expect((ctx.myDate as Date).getFullYear()).toBe(2024)
  })

  it('should preserve RegExp objects', () => {
    const regex = /test\d+/gi
    const ctx = createSafeContext({ pattern: regex })
    expect(ctx.pattern).toBeInstanceOf(RegExp)
    expect((ctx.pattern as RegExp).test('test123')).toBe(true)
  })

  it('should preserve Map objects', () => {
    const map = new Map([['key', 'value']])
    const ctx = createSafeContext({ myMap: map })
    expect(ctx.myMap).toBeInstanceOf(Map)
    expect((ctx.myMap as Map<string, string>).get('key')).toBe('value')
  })

  it('should preserve Set objects', () => {
    const set = new Set([1, 2, 3])
    const ctx = createSafeContext({ mySet: set })
    expect(ctx.mySet).toBeInstanceOf(Set)
    expect((ctx.mySet as Set<number>).has(2)).toBe(true)
  })

  it('should preserve Error objects', () => {
    const error = new Error('test error')
    const ctx = createSafeContext({ err: error })
    expect(ctx.err).toBeInstanceOf(Error)
    expect((ctx.err as Error).message).toBe('test error')
  })

  it('should still strip dangerous __proto__ and constructor keys', () => {
    const obj = Object.create(null)
    obj.normal = 'ok'
    obj.__dangerous = 'stripped'
    obj.constructor = 'evil_constructor'
    const ctx = createSafeContext({ data: obj })
    const data = ctx.data as Record<string, unknown>
    expect(data.normal).toBe('ok')
    expect(data.__dangerous).toBeUndefined()
    expect(data.constructor).not.toBe('evil_constructor')
  })
})

describe('Safe Evaluation for Props and Bindings', () => {
  it('should reject unsafe expressions in component attrs', () => {
    expect(isExpressionSafe('constructor.constructor("return process")()')).toBe(false)
    expect(isExpressionSafe('require("child_process")')).toBe(false)
  })

  it('should allow safe slot-style expressions', () => {
    expect(isExpressionSafe('count + 1')).toBe(true)
    expect(isExpressionSafe('items.length > 0')).toBe(true)
  })

  it('should reject unsafe expressions in :prop bindings', () => {
    expect(isExpressionSafe('process.exit()')).toBe(false)
    expect(isExpressionSafe('require("fs")')).toBe(false)
    expect(isExpressionSafe('eval("code")')).toBe(false)
  })

  it('should accept safe expressions for :prop bindings', () => {
    expect(isExpressionSafe('items.length')).toBe(true)
    expect(isExpressionSafe('x + y')).toBe(true)
    expect(isExpressionSafe('user.name')).toBe(true)
  })

  it('should safely evaluate :prop expressions via createSafeFunction', () => {
    const fn = createSafeFunction('x * 2', ['x'])
    expect(fn(5)).toBe(10)
  })

  it('should handle array access in safe functions', () => {
    const fn = createSafeFunction('items[0]', ['items'])
    expect(fn([10, 20, 30])).toBe(10)
  })

  it('should block eval in sanitizeExpression', () => {
    expect(() => sanitizeExpression('eval("alert(1)")')).toThrow('Potentially unsafe')
  })

  it('should block Function constructor in sanitizeExpression', () => {
    expect(() => sanitizeExpression('Function("return this")()')).toThrow('Potentially unsafe')
  })

  it('should block process access in sanitizeExpression', () => {
    expect(() => sanitizeExpression('process.env.SECRET')).toThrow('Potentially unsafe')
  })

  it('should allow safe object expressions', () => {
    const result = safeEvaluateObject('{ title: "Hello", count: 42 }', {})
    expect(result.title).toBe('Hello')
    expect(result.count).toBe(42)
  })

  it('should block dangerous expressions in createSafeFunction', () => {
    expect(() => createSafeFunction('eval("code")', ['x'])).toThrow('Potentially unsafe')
  })

  it('should block import() in createSafeFunction', () => {
    expect(() => createSafeFunction('import("fs")', ['x'])).toThrow('Potentially unsafe')
  })

  it('should safely evaluate simple variable paths', () => {
    expect(isExpressionSafe('data')).toBe(true)
    expect(isExpressionSafe('user.name')).toBe(true)
    expect(isExpressionSafe('items[0]')).toBe(true)
  })

  it('should block dangerous @json paths', () => {
    expect(isExpressionSafe('constructor.constructor("return process")()')).toBe(false)
  })
})

describe('Date objects in context', () => {
  it('should handle Date objects in context through sanitizeObject', async () => {
    const now = new Date('2024-06-15')
    const template = '<span>{{ myDate.getFullYear() }}</span>'
    const result = await processTemplate(template, { myDate: now })
    expect(result).toContain('2024')
  })
})
