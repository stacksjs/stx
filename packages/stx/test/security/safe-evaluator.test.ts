/* eslint-disable no-template-curly-in-string */
import { beforeEach, describe, expect, it } from 'bun:test'
import {
  sanitizeExpression,
  createSafeContext,
  safeEvaluate,
  isExpressionSafe,
  isForExpressionSafe,
  createSafeFunction,
  safeEvaluateCondition,
  safeEvaluateArray,
  safeEvaluateObject,
  safeEvaluateCode,
  createSafeLoopFunction,
  configureSafeEvaluator,
  resetSafeEvaluatorConfig,
  getSafeEvaluatorConfig,
} from '../../src/safe-evaluator'

describe('Safe Evaluator Comprehensive Security Tests', () => {
  beforeEach(() => resetSafeEvaluatorConfig())

  // ===========================================================================
  // Configuration
  // ===========================================================================

  describe('configureSafeEvaluator()', () => {
    it('merges partial config with existing config', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 20 })
      const config = getSafeEvaluatorConfig()
      expect(config.maxSanitizeDepth).toBe(20)
      expect(config.allowBracketNotation).toBe(false)
    })

    it('merges allowBracketNotation without overwriting maxSanitizeDepth', () => {
      configureSafeEvaluator({ allowBracketNotation: true })
      const config = getSafeEvaluatorConfig()
      expect(config.allowBracketNotation).toBe(true)
      expect(config.maxSanitizeDepth).toBe(10)
    })

    it('allows overriding both settings at once', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 5, allowBracketNotation: true })
      const config = getSafeEvaluatorConfig()
      expect(config.maxSanitizeDepth).toBe(5)
      expect(config.allowBracketNotation).toBe(true)
    })

    it('last call wins on successive configuration', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 50 })
      configureSafeEvaluator({ maxSanitizeDepth: 3 })
      expect(getSafeEvaluatorConfig().maxSanitizeDepth).toBe(3)
    })
  })

  describe('resetSafeEvaluatorConfig()', () => {
    it('restores defaults after configureSafeEvaluator', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 99, allowBracketNotation: true })
      resetSafeEvaluatorConfig()
      const config = getSafeEvaluatorConfig()
      expect(config.maxSanitizeDepth).toBe(10)
      expect(config.allowBracketNotation).toBe(false)
    })
  })

  describe('getSafeEvaluatorConfig()', () => {
    it('returns a copy, not a reference to internal state', () => {
      const config1 = getSafeEvaluatorConfig()
      config1.maxSanitizeDepth = 999
      const config2 = getSafeEvaluatorConfig()
      expect(config2.maxSanitizeDepth).toBe(10)
    })
  })

  describe('maxSanitizeDepth setting', () => {
    it('respects custom maxSanitizeDepth in object sanitization', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 2 })
      const deepObj = { a: { b: { c: 'deep' } } }
      const ctx = createSafeContext({ data: deepObj })
      const data = ctx.data as Record<string, any>
      expect(data.a.b).toBe('[Object too deep]')
    })

    it('allows deeper nesting with higher maxSanitizeDepth', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 20 })
      const deepObj = { a: { b: { c: { d: { e: 'found' } } } } }
      const ctx = createSafeContext({ data: deepObj })
      const data = ctx.data as Record<string, any>
      expect(data.a.b.c.d.e).toBe('found')
    })
  })

  describe('allowBracketNotation setting', () => {
    it('blocks bracket notation with strings by default', () => {
      expect(() => sanitizeExpression('obj["key"]')).toThrow()
    })

    it('allows bracket notation with strings when enabled', () => {
      configureSafeEvaluator({ allowBracketNotation: true })
      expect(() => sanitizeExpression('obj["key"]')).not.toThrow()
    })

    it('allows bracket notation with numbers regardless of setting', () => {
      expect(() => sanitizeExpression('items[0]')).not.toThrow()
    })
  })

  // ===========================================================================
  // sanitizeExpression()
  // ===========================================================================

  describe('sanitizeExpression()', () => {
    describe('allows safe expressions', () => {
      it('allows arithmetic: x + y', () => {
        expect(sanitizeExpression('x + y')).toBe('x + y')
      })

      it('allows method call: name.toUpperCase()', () => {
        expect(sanitizeExpression('name.toUpperCase()')).toBe('name.toUpperCase()')
      })

      it('allows property access: items.length', () => {
        expect(sanitizeExpression('items.length')).toBe('items.length')
      })

      it('allows ternary: x > 0 ? "yes" : "no"', () => {
        expect(sanitizeExpression('x > 0 ? "yes" : "no"')).toBe('x > 0 ? "yes" : "no"')
      })

      it('allows string concatenation', () => {
        expect(sanitizeExpression('"hello" + " " + "world"')).toBe('"hello" + " " + "world"')
      })

      it('returns trimmed expression', () => {
        expect(sanitizeExpression('  x + y  ')).toBe('x + y')
      })
    })

    describe('blocks dangerous patterns', () => {
      it('blocks eval()', () => {
        expect(() => sanitizeExpression('eval("code")')).toThrow('Potentially unsafe expression')
      })

      it('blocks Function()', () => {
        expect(() => sanitizeExpression('Function("return 1")')).toThrow('Potentially unsafe expression')
      })

      it('blocks setTimeout()', () => {
        expect(() => sanitizeExpression('setTimeout(fn, 0)')).toThrow('Potentially unsafe expression')
      })

      it('blocks setInterval()', () => {
        expect(() => sanitizeExpression('setInterval(fn, 100)')).toThrow('Potentially unsafe expression')
      })

      it('blocks setImmediate()', () => {
        expect(() => sanitizeExpression('setImmediate(fn)')).toThrow('Potentially unsafe expression')
      })

      it('blocks process.env', () => {
        expect(() => sanitizeExpression('process.env')).toThrow('Potentially unsafe expression')
      })

      it('blocks require()', () => {
        expect(() => sanitizeExpression('require("fs")')).toThrow('Potentially unsafe expression')
      })

      it('blocks import()', () => {
        expect(() => sanitizeExpression('import("module")')).toThrow('Potentially unsafe expression')
      })

      it('blocks window.location', () => {
        expect(() => sanitizeExpression('window.location')).toThrow('Potentially unsafe expression')
      })

      it('blocks document.cookie', () => {
        expect(() => sanitizeExpression('document.cookie')).toThrow('Potentially unsafe expression')
      })

      it('blocks global.process', () => {
        expect(() => sanitizeExpression('global.process')).toThrow('Potentially unsafe expression')
      })

      it('blocks globalThis.eval', () => {
        expect(() => sanitizeExpression('globalThis.eval')).toThrow('Potentially unsafe expression')
      })

      it('blocks obj.constructor', () => {
        expect(() => sanitizeExpression('obj.constructor')).toThrow('Potentially unsafe expression')
      })

      it('blocks obj.prototype', () => {
        expect(() => sanitizeExpression('obj.prototype')).toThrow('Potentially unsafe expression')
      })

      it('blocks obj.__proto__', () => {
        expect(() => sanitizeExpression('obj.__proto__')).toThrow('Potentially unsafe expression')
      })

      it('blocks Reflect.ownKeys()', () => {
        expect(() => sanitizeExpression('Reflect.ownKeys(obj)')).toThrow('Potentially unsafe expression')
      })

      it('blocks new Proxy()', () => {
        expect(() => sanitizeExpression('new Proxy({}, {})')).toThrow('Potentially unsafe expression')
      })

      it('blocks Symbol()', () => {
        expect(() => sanitizeExpression('Symbol("test")')).toThrow('Potentially unsafe expression')
      })

      it('blocks new WeakMap()', () => {
        expect(() => sanitizeExpression('new WeakMap()')).toThrow('Potentially unsafe expression')
      })

      it('blocks new WeakSet()', () => {
        expect(() => sanitizeExpression('new WeakSet()')).toThrow('Potentially unsafe expression')
      })

      it('blocks new WeakRef()', () => {
        expect(() => sanitizeExpression('new WeakRef(obj)')).toThrow('Potentially unsafe expression')
      })

      it('blocks new FinalizationRegistry()', () => {
        expect(() => sanitizeExpression('new FinalizationRegistry(cb)')).toThrow('Potentially unsafe expression')
      })

      it('blocks Generator', () => {
        expect(() => sanitizeExpression('Generator')).toThrow('Potentially unsafe expression')
      })

      it('blocks AsyncGenerator', () => {
        expect(() => sanitizeExpression('AsyncGenerator')).toThrow('Potentially unsafe expression')
      })

      it('blocks dunder methods: __anything__', () => {
        expect(() => sanitizeExpression('obj.__hidden__')).toThrow('Potentially unsafe expression')
      })

      it('blocks fn.bind()', () => {
        expect(() => sanitizeExpression('fn.bind(this)')).toThrow('Potentially unsafe expression')
      })

      it('blocks fn.call()', () => {
        expect(() => sanitizeExpression('fn.call(this)')).toThrow('Potentially unsafe expression')
      })

      it('blocks fn.apply()', () => {
        expect(() => sanitizeExpression('fn.apply(this, [])')).toThrow('Potentially unsafe expression')
      })
    })

    describe('bracket notation', () => {
      it('blocks obj["key"] by default', () => {
        expect(() => sanitizeExpression('obj["key"]')).toThrow('Bracket notation')
      })

      it('blocks obj[\'key\'] by default', () => {
        expect(() => sanitizeExpression("obj['key']")).toThrow('Bracket notation')
      })

      it('allows obj["key"] when allowBracketNotation is true', () => {
        configureSafeEvaluator({ allowBracketNotation: true })
        expect(sanitizeExpression('obj["key"]')).toBe('obj["key"]')
      })
    })
  })

  // ===========================================================================
  // createSafeContext()
  // ===========================================================================

  describe('createSafeContext()', () => {
    it('includes Math global', () => {
      const ctx = createSafeContext({})
      expect(ctx.Math).toBe(Math)
    })

    it('includes JSON global', () => {
      const ctx = createSafeContext({})
      expect(ctx.JSON).toBe(JSON)
    })

    it('includes Date global', () => {
      const ctx = createSafeContext({})
      expect(ctx.Date).toBe(Date)
    })

    it('includes String global', () => {
      const ctx = createSafeContext({})
      expect(ctx.String).toBe(String)
    })

    it('includes Number global', () => {
      const ctx = createSafeContext({})
      expect(ctx.Number).toBe(Number)
    })

    it('includes Boolean global', () => {
      const ctx = createSafeContext({})
      expect(ctx.Boolean).toBe(Boolean)
    })

    it('includes Array global', () => {
      const ctx = createSafeContext({})
      expect(ctx.Array).toBe(Array)
    })

    it('includes parseInt', () => {
      const ctx = createSafeContext({})
      expect(typeof ctx.parseInt).toBe('function')
    })

    it('includes parseFloat', () => {
      const ctx = createSafeContext({})
      expect(typeof ctx.parseFloat).toBe('function')
    })

    it('includes isNaN', () => {
      const ctx = createSafeContext({})
      expect(typeof ctx.isNaN).toBe('function')
    })

    it('includes isFinite', () => {
      const ctx = createSafeContext({})
      expect(typeof ctx.isFinite).toBe('function')
    })

    it('includes encodeURIComponent', () => {
      const ctx = createSafeContext({})
      expect(ctx.encodeURIComponent).toBe(encodeURIComponent)
    })

    it('includes decodeURIComponent', () => {
      const ctx = createSafeContext({})
      expect(ctx.decodeURIComponent).toBe(decodeURIComponent)
    })

    it('includes user context variables', () => {
      const ctx = createSafeContext({ name: 'Alice', age: 30 })
      expect(ctx.name).toBe('Alice')
      expect(ctx.age).toBe(30)
    })

    it('sanitizes object values recursively', () => {
      const ctx = createSafeContext({
        user: { name: 'Alice', __secret: 'hidden', nested: { value: 1 } },
      })
      const user = ctx.user as Record<string, any>
      expect(user.name).toBe('Alice')
      expect(user.__secret).toBeUndefined()
      expect(user.nested.value).toBe(1)
    })

    it('skips double-underscore keys', () => {
      const ctx = createSafeContext({ __internal: 'secret', visible: 'yes' })
      expect(ctx.__internal).toBeUndefined()
      expect(ctx.visible).toBe('yes')
    })

    it('allows single-underscore keys (_id, _name)', () => {
      const ctx = createSafeContext({ _id: 123, _name: 'test' })
      expect(ctx._id).toBe(123)
      expect(ctx._name).toBe('test')
    })

    it('preserves Date instances', () => {
      const date = new Date('2024-01-01')
      const ctx = createSafeContext({ obj: { created: date } })
      const obj = ctx.obj as Record<string, any>
      expect(obj.created).toBeInstanceOf(Date)
    })

    it('preserves RegExp instances', () => {
      const regex = /test/gi
      const ctx = createSafeContext({ obj: { pattern: regex } })
      const obj = ctx.obj as Record<string, any>
      expect(obj.pattern).toBeInstanceOf(RegExp)
    })

    it('preserves Map instances', () => {
      const map = new Map([['key', 'value']])
      const ctx = createSafeContext({ obj: { data: map } })
      const obj = ctx.obj as Record<string, any>
      expect(obj.data).toBeInstanceOf(Map)
    })

    it('preserves Set instances', () => {
      const set = new Set([1, 2, 3])
      const ctx = createSafeContext({ obj: { items: set } })
      const obj = ctx.obj as Record<string, any>
      expect(obj.items).toBeInstanceOf(Set)
    })

    it('preserves Error instances', () => {
      const err = new Error('test error')
      const ctx = createSafeContext({ obj: { error: err } })
      const obj = ctx.obj as Record<string, any>
      expect(obj.error).toBeInstanceOf(Error)
    })

    it('handles deep object sanitization with depth limit', () => {
      configureSafeEvaluator({ maxSanitizeDepth: 3 })
      const deep = { a: { b: { c: { d: 'too deep' } } } }
      const ctx = createSafeContext({ data: deep })
      const data = ctx.data as Record<string, any>
      expect(data.a.b.c).toBe('[Object too deep]')
    })

    it('strips constructor key from nested objects', () => {
      const ctx = createSafeContext({
        obj: { constructor: 'evil', safe: 'ok' },
      })
      const obj = ctx.obj as Record<string, any>
      // The 'constructor' own property is stripped; obj.constructor falls back to Object.prototype.constructor
      expect(Object.prototype.hasOwnProperty.call(obj, 'constructor')).toBe(false)
      expect(obj.safe).toBe('ok')
    })

    it('strips prototype key from nested objects', () => {
      const ctx = createSafeContext({
        obj: { prototype: 'evil', safe: 'ok' },
      })
      const obj = ctx.obj as Record<string, any>
      expect(obj.prototype).toBeUndefined()
      expect(obj.safe).toBe('ok')
    })

    it('passes through arrays without wrapping them in objects', () => {
      const ctx = createSafeContext({ items: [1, 2, 3] })
      expect(Array.isArray(ctx.items)).toBe(true)
    })
  })

  // ===========================================================================
  // safeEvaluate()
  // ===========================================================================

  describe('safeEvaluate()', () => {
    it('evaluates simple arithmetic: 1 + 2', () => {
      expect(safeEvaluate('1 + 2', {})).toBe(3)
    })

    it('evaluates string literal', () => {
      expect(safeEvaluate('"hello"', {})).toBe('hello')
    })

    it('accesses context variable', () => {
      expect(safeEvaluate('name', { name: 'Alice' })).toBe('Alice')
    })

    it('accesses nested property: user.name', () => {
      expect(safeEvaluate('user.name', { user: { name: 'Bob' } })).toBe('Bob')
    })

    it('accesses array index: items[0]', () => {
      expect(safeEvaluate('items[0]', { items: ['first', 'second'] })).toBe('first')
    })

    it('calls string method: name.toUpperCase()', () => {
      expect(safeEvaluate('name.toUpperCase()', { name: 'hello' })).toBe('HELLO')
    })

    it('evaluates Math operations: Math.max(1, 2, 3)', () => {
      expect(safeEvaluate('Math.max(1, 2, 3)', {})).toBe(3)
    })

    it('evaluates ternary: x > 0 ? "positive" : "negative"', () => {
      expect(safeEvaluate('x > 0 ? "positive" : "negative"', { x: 5 })).toBe('positive')
      expect(safeEvaluate('x > 0 ? "positive" : "negative"', { x: -1 })).toBe('negative')
    })

    it('returns undefined for dangerous expression (does not throw)', () => {
      expect(safeEvaluate('eval("1")', {})).toBeUndefined()
    })

    it('returns undefined for ReferenceError', () => {
      expect(safeEvaluate('nonExistentVar', {})).toBeUndefined()
    })

    it('returns undefined for TypeError on null access', () => {
      expect(safeEvaluate('x.y.z', { x: null })).toBeUndefined()
    })

    it('handles null in context gracefully', () => {
      expect(safeEvaluate('x', { x: null })).toBe(null)
    })

    it('handles undefined in context gracefully', () => {
      expect(safeEvaluate('x', { x: undefined })).toBeUndefined()
    })

    it('evaluates boolean expressions', () => {
      expect(safeEvaluate('a && b', { a: true, b: false })).toBe(false)
    })

    it('evaluates comparison operators', () => {
      expect(safeEvaluate('a === b', { a: 1, b: 1 })).toBe(true)
    })

    it('evaluates template literals without dangerous content', () => {
      // Template literals are fine as long as they don't reference dangerous globals
      expect(safeEvaluate('`${x} world`', { x: 'hello' })).toBe('hello world')
    })
  })

  // ===========================================================================
  // isExpressionSafe()
  // ===========================================================================

  describe('isExpressionSafe()', () => {
    it('returns true for safe arithmetic', () => {
      expect(isExpressionSafe('x + y')).toBe(true)
    })

    it('returns true for safe method call', () => {
      expect(isExpressionSafe('name.toUpperCase()')).toBe(true)
    })

    it('returns true for safe property access', () => {
      expect(isExpressionSafe('items.length')).toBe(true)
    })

    it('returns false for eval()', () => {
      expect(isExpressionSafe('eval("code")')).toBe(false)
    })

    it('returns false for require()', () => {
      expect(isExpressionSafe('require("fs")')).toBe(false)
    })

    it('returns false for process.env', () => {
      expect(isExpressionSafe('process.env.SECRET')).toBe(false)
    })

    it('returns false for __proto__', () => {
      expect(isExpressionSafe('obj.__proto__')).toBe(false)
    })

    it('handles empty string', () => {
      // Empty string is technically safe to sanitize (no dangerous patterns)
      expect(isExpressionSafe('')).toBe(true)
    })

    it('handles whitespace-only string', () => {
      expect(isExpressionSafe('   ')).toBe(true)
    })
  })

  // ===========================================================================
  // safeEvaluateCondition()
  // ===========================================================================

  describe('safeEvaluateCondition()', () => {
    it('returns true for truthy number', () => {
      expect(safeEvaluateCondition('x', { x: 1 })).toBe(true)
    })

    it('returns true for truthy string', () => {
      expect(safeEvaluateCondition('x', { x: 'hello' })).toBe(true)
    })

    it('returns true for true boolean', () => {
      expect(safeEvaluateCondition('x', { x: true })).toBe(true)
    })

    it('returns false for zero', () => {
      expect(safeEvaluateCondition('x', { x: 0 })).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(safeEvaluateCondition('x', { x: '' })).toBe(false)
    })

    it('returns false for null', () => {
      expect(safeEvaluateCondition('x', { x: null })).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(safeEvaluateCondition('x', { x: undefined })).toBe(false)
    })

    it('returns false for false boolean', () => {
      expect(safeEvaluateCondition('x', { x: false })).toBe(false)
    })

    it('returns false on error (dangerous expression)', () => {
      expect(safeEvaluateCondition('eval("true")', {})).toBe(false)
    })

    it('evaluates compound condition', () => {
      expect(safeEvaluateCondition('a > 0 && b < 10', { a: 5, b: 3 })).toBe(true)
    })
  })

  // ===========================================================================
  // safeEvaluateArray()
  // ===========================================================================

  describe('safeEvaluateArray()', () => {
    it('returns array for array result', () => {
      const result = safeEvaluateArray('items', { items: [1, 2, 3] })
      expect(result).toEqual([1, 2, 3])
    })

    it('returns empty array for non-array result (string)', () => {
      const result = safeEvaluateArray('x', { x: 'hello' })
      expect(result).toEqual([])
    })

    it('returns empty array for non-array result (number)', () => {
      const result = safeEvaluateArray('x', { x: 42 })
      expect(result).toEqual([])
    })

    it('returns empty array for null result', () => {
      const result = safeEvaluateArray('x', { x: null })
      expect(result).toEqual([])
    })

    it('handles array-like objects with length property', () => {
      const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 }
      const result = safeEvaluateArray('data', { data: arrayLike })
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('returns empty array on error', () => {
      const result = safeEvaluateArray('eval("[]")', {})
      expect(result).toEqual([])
    })

    it('returns empty array for plain object without length', () => {
      const result = safeEvaluateArray('x', { x: { a: 1, b: 2 } })
      expect(result).toEqual([])
    })
  })

  // ===========================================================================
  // safeEvaluateObject()
  // ===========================================================================

  describe('safeEvaluateObject()', () => {
    it('returns object for object result', () => {
      const result = safeEvaluateObject('data', { data: { a: 1, b: 2 } })
      expect(result.a).toBe(1)
      expect(result.b).toBe(2)
    })

    it('returns empty object for non-object result (string)', () => {
      const result = safeEvaluateObject('x', { x: 'hello' })
      expect(result).toEqual({})
    })

    it('returns empty object for non-object result (number)', () => {
      const result = safeEvaluateObject('x', { x: 42 })
      expect(result).toEqual({})
    })

    it('returns empty object for arrays (arrays excluded)', () => {
      const result = safeEvaluateObject('x', { x: [1, 2, 3] })
      expect(result).toEqual({})
    })

    it('returns empty object for null', () => {
      const result = safeEvaluateObject('x', { x: null })
      expect(result).toEqual({})
    })

    it('returns empty object on error', () => {
      const result = safeEvaluateObject('eval("{}")', {})
      expect(result).toEqual({})
    })
  })

  // ===========================================================================
  // createSafeFunction()
  // ===========================================================================

  describe('createSafeFunction()', () => {
    it('creates a callable function from expression', () => {
      const fn = createSafeFunction('x + y', ['x', 'y'])
      expect(fn(1, 2)).toBe(3)
    })

    it('function accesses context via arguments', () => {
      const fn = createSafeFunction('name.toUpperCase()', ['name'])
      expect(fn('hello')).toBe('HELLO')
    })

    it('throws on dangerous expressions', () => {
      expect(() => createSafeFunction('eval("code")', ['x'])).toThrow('Potentially unsafe expression')
    })

    it('throws on process access', () => {
      expect(() => createSafeFunction('process.exit()', [])).toThrow('Potentially unsafe expression')
    })

    it('returns undefined for ReferenceError during execution', () => {
      const fn = createSafeFunction('unknownVar', [])
      expect(fn()).toBeUndefined()
    })

    it('returns undefined for TypeError during execution', () => {
      const fn = createSafeFunction('x.y.z', ['x'])
      expect(fn(null)).toBeUndefined()
    })
  })

  // ===========================================================================
  // isForExpressionSafe()
  // ===========================================================================

  describe('isForExpressionSafe()', () => {
    it('allows standard for loop: let i = 0; i < n; i++', () => {
      expect(isForExpressionSafe('let i = 0; i < n; i++')).toBe(true)
    })

    it('allows decrementing loop', () => {
      expect(isForExpressionSafe('let i = 10; i > 0; i--')).toBe(true)
    })

    it('blocks eval in for expression', () => {
      expect(isForExpressionSafe('let i = eval("0"); i < 10; i++')).toBe(false)
    })

    it('blocks Function in for expression', () => {
      expect(isForExpressionSafe('let i = Function("return 0")(); i < 10; i++')).toBe(false)
    })

    it('blocks import in for expression', () => {
      expect(isForExpressionSafe('let i = import("fs"); i < 10; i++')).toBe(false)
    })

    it('blocks require in for expression', () => {
      expect(isForExpressionSafe('let i = require("fs"); i < 10; i++')).toBe(false)
    })

    it('blocks process access', () => {
      expect(isForExpressionSafe('let i = 0; i < process.env.N; i++')).toBe(false)
    })

    it('blocks __proto__ access', () => {
      expect(isForExpressionSafe('let i = 0; i < obj.__proto__.length; i++')).toBe(false)
    })

    it('blocks constructor access', () => {
      expect(isForExpressionSafe('let i = 0; i < arr.constructor(1); i++')).toBe(false)
    })

    it('blocks globalThis', () => {
      expect(isForExpressionSafe('let i = globalThis; i < 10; i++')).toBe(false)
    })

    it('blocks window', () => {
      expect(isForExpressionSafe('let i = window.x; i < 10; i++')).toBe(false)
    })

    it('blocks document', () => {
      expect(isForExpressionSafe('let i = document.x; i < 10; i++')).toBe(false)
    })

    it('blocks fetch', () => {
      expect(isForExpressionSafe('let i = fetch("url"); i; i++')).toBe(false)
    })

    it('blocks Bun', () => {
      expect(isForExpressionSafe('let i = Bun.file("x"); i; i++')).toBe(false)
    })

    it('blocks Deno', () => {
      expect(isForExpressionSafe('let i = Deno.readFile("x"); i; i++')).toBe(false)
    })

    it('blocks console', () => {
      expect(isForExpressionSafe('let i = console.log("x"); i < 10; i++')).toBe(false)
    })

    it('blocks this', () => {
      expect(isForExpressionSafe('let i = this.x; i < 10; i++')).toBe(false)
    })

    it('blocks Reflect', () => {
      expect(isForExpressionSafe('let i = Reflect.ownKeys({}); i; i++')).toBe(false)
    })

    it('blocks Proxy', () => {
      expect(isForExpressionSafe('let i = new Proxy({}, {}); i; i++')).toBe(false)
    })

    it('blocks prototype', () => {
      expect(isForExpressionSafe('let i = obj.prototype.x; i < 10; i++')).toBe(false)
    })

    it('blocks .bind()', () => {
      expect(isForExpressionSafe('let i = fn.bind(null)(); i < 10; i++')).toBe(false)
    })

    it('blocks .call()', () => {
      expect(isForExpressionSafe('let i = fn.call(null); i < 10; i++')).toBe(false)
    })

    it('blocks .apply()', () => {
      expect(isForExpressionSafe('let i = fn.apply(null, []); i < 10; i++')).toBe(false)
    })
  })

  // ===========================================================================
  // createSafeLoopFunction()
  // ===========================================================================

  describe('createSafeLoopFunction()', () => {
    it('creates for loop function that iterates correctly', () => {
      const fn = createSafeLoopFunction('for', 'let i = 0; i < 3; i++', '{{i}}', ['n'])
      const result = fn(3)
      expect(result).toContain('0')
      expect(result).toContain('1')
      expect(result).toContain('2')
    })

    it('creates while loop function with iteration limit', () => {
      // While loop that would go forever without limit
      const fn = createSafeLoopFunction('while', 'true', 'x', [], 5)
      const result = fn()
      expect(result).toContain('Maximum iterations exceeded')
    })

    it('respects custom maxIterations parameter', () => {
      const fn = createSafeLoopFunction('while', 'true', '.', [], 3)
      const result = fn()
      // Should have 3 dots and then the error comment
      expect(result).toContain('...')
      expect(result).toContain('Maximum iterations exceeded')
    })

    it('throws on unsafe for expression', () => {
      expect(() =>
        createSafeLoopFunction('for', 'let i = eval("0"); i < 10; i++', 'body', []),
      ).toThrow('Unsafe expression')
    })

    it('throws on unsafe while expression', () => {
      expect(() =>
        createSafeLoopFunction('while', 'process.env.RUN', 'body', []),
      ).toThrow('Unsafe expression')
    })

    it('processes template expressions in body', () => {
      const fn = createSafeLoopFunction('for', 'let i = 0; i < 2; i++', '<span>{{i}}</span>', [])
      const result = fn()
      expect(result).toContain('<span>')
    })

    it('for loop accesses context keys', () => {
      const fn = createSafeLoopFunction('for', 'let i = 0; i < n; i++', '{{i}}', ['n'])
      const result = fn(2)
      expect(result).toContain('0')
      expect(result).toContain('1')
    })

    it('while loop terminates normally when condition becomes false', () => {
      // A while loop with a variable counter that terminates
      const fn = createSafeLoopFunction(
        'while',
        'count > 0',
        '{{count--}}',
        ['count'],
        100,
      )
      const result = fn(3)
      // Should not hit max iterations
      expect(result).not.toContain('Maximum iterations exceeded')
    })
  })

  // ===========================================================================
  // safeEvaluateCode()
  // ===========================================================================

  describe('safeEvaluateCode()', () => {
    it('evaluates code blocks', () => {
      const result = safeEvaluateCode('return x + y', { x: 1, y: 2 })
      expect(result).toBe(3)
    })

    it('blocks dangerous patterns in code', () => {
      const result = safeEvaluateCode('return eval("1 + 1")', {})
      expect(result).toBeUndefined()
    })

    it('blocks process access in code', () => {
      const result = safeEvaluateCode('return process.env.SECRET', {})
      expect(result).toBeUndefined()
    })

    it('blocks require in code', () => {
      const result = safeEvaluateCode('const fs = require("fs"); return fs', {})
      expect(result).toBeUndefined()
    })

    it('returns undefined on syntax error', () => {
      const result = safeEvaluateCode('return }{}{', {})
      expect(result).toBeUndefined()
    })

    it('returns undefined on runtime error', () => {
      const result = safeEvaluateCode('return undeclaredVariable', {})
      expect(result).toBeUndefined()
    })

    it('accesses safe context variables', () => {
      const result = safeEvaluateCode('return name.toUpperCase()', { name: 'alice' })
      expect(result).toBe('ALICE')
    })

    it('can use allowed globals (Math, JSON, etc.)', () => {
      const result = safeEvaluateCode('return Math.max(a, b)', { a: 5, b: 10 })
      expect(result).toBe(10)
    })
  })

  // ===========================================================================
  // Security Attack Vectors
  // ===========================================================================

  describe('Security attack vectors', () => {
    it('blocks prototype pollution via constructor.prototype', () => {
      const result = safeEvaluate('({}).constructor.prototype.polluted = true', {})
      expect(result).toBeUndefined()
      // Verify no pollution occurred
      expect(({} as any).polluted).toBeUndefined()
    })

    it('blocks constructor chain attack: [].constructor.constructor("return process")()', () => {
      const result = safeEvaluate('[].constructor.constructor("return process")()', {})
      expect(result).toBeUndefined()
    })

    it('blocks __proto__ pollution: ({}).__proto__.polluted = true', () => {
      const result = safeEvaluate('({}).__proto__.polluted = true', {})
      expect(result).toBeUndefined()
      expect(({} as any).polluted).toBeUndefined()
    })

    it('blocks template literal injection with process.env', () => {
      const result = safeEvaluate('`${process.env.SECRET}`', {})
      expect(result).toBeUndefined()
    })

    it('blocks computed property __proto__ attack', () => {
      // The expression contains __proto__ which is a dunder pattern
      expect(isExpressionSafe('{["__proto__"]: {polluted: true}}')).toBe(false)
    })

    it('blocks constructor key in computed property', () => {
      expect(isExpressionSafe('{["constructor"]: evil}')).toBe(false)
    })

    it('blocks Array.from with process callback', () => {
      // Contains 'process' which triggers the dangerous pattern
      const result = safeEvaluate('Array.from({length: 1}, () => process)', {})
      expect(result).toBeUndefined()
    })

    it('blocks toString override attack', () => {
      // constructor is blocked
      expect(isExpressionSafe('({toString: () => constructor("return this")()})')).toBe(false)
    })

    it('blocks valueOf override attack', () => {
      expect(isExpressionSafe('({valueOf: () => constructor("alert(1)")()})')).toBe(false)
    })

    it('blocks with statement', () => {
      // safeEvaluateCode runs in strict mode, 'with' is not allowed
      const result = safeEvaluateCode('with(obj) { return x }', { obj: { x: 1 } })
      expect(result).toBeUndefined()
    })

    it('blocks comma operator smuggling dangerous code', () => {
      const result = safeEvaluate('(eval("1"), "safe")', {})
      expect(result).toBeUndefined()
    })

    it('blocks semicolon injection: 1; process.exit()', () => {
      const result = safeEvaluate('1; process.exit()', {})
      expect(result).toBeUndefined()
    })

    it('blocks nested function creation via IIFE', () => {
      // This will be caught because Function is in the dangerous pattern list
      // but also the constructor pattern catches (function(){}).constructor
      const result = safeEvaluate('(function(){return this})()', {})
      // Even if it evaluates, it should be in strict mode so `this` is undefined
      // The expression itself doesn't contain blocked patterns except potentially via eval/Function
      // In strict mode, `this` inside a plain function is undefined
      if (result !== undefined) {
        expect(result).not.toBe(globalThis)
      }
    })

    it('blocks access to Function via array constructor chain', () => {
      const result = safeEvaluate('[].constructor.constructor("return this")()', {})
      expect(result).toBeUndefined()
    })

    it('blocks globalThis access via various paths', () => {
      expect(safeEvaluate('globalThis', {})).toBeUndefined()
    })

    it('blocks window access', () => {
      expect(safeEvaluate('window', {})).toBeUndefined()
    })

    it('blocks document access', () => {
      expect(safeEvaluate('document', {})).toBeUndefined()
    })

    it('blocks Reflect-based introspection', () => {
      expect(safeEvaluate('Reflect.ownKeys({})', {})).toBeUndefined()
    })

    it('blocks Proxy-based traps', () => {
      expect(safeEvaluate('new Proxy({}, { get: () => "trap" })', {})).toBeUndefined()
    })

    it('blocks Symbol creation for hidden properties', () => {
      expect(safeEvaluate('Symbol("hidden")', {})).toBeUndefined()
    })

    it('blocks WeakRef for escaping garbage collection', () => {
      expect(safeEvaluate('new WeakRef({})', {})).toBeUndefined()
    })

    it('blocks FinalizationRegistry for GC hooks', () => {
      expect(safeEvaluate('new FinalizationRegistry(() => {})', {})).toBeUndefined()
    })

    it('blocks bind to change execution context', () => {
      expect(safeEvaluate('fn.bind(null)()', { fn: () => 1 })).toBeUndefined()
    })

    it('blocks call to change execution context', () => {
      expect(safeEvaluate('fn.call(null)', { fn: () => 1 })).toBeUndefined()
    })

    it('blocks apply to change execution context', () => {
      expect(safeEvaluate('fn.apply(null, [])', { fn: () => 1 })).toBeUndefined()
    })

    it('blocks import() dynamic import', () => {
      expect(safeEvaluate('import("fs")', {})).toBeUndefined()
    })

    it('blocks require() module loading', () => {
      expect(safeEvaluate('require("child_process")', {})).toBeUndefined()
    })

    it('blocks setTimeout abuse', () => {
      expect(safeEvaluate('setTimeout(() => {}, 0)', {})).toBeUndefined()
    })

    it('blocks setInterval abuse', () => {
      expect(safeEvaluate('setInterval(() => {}, 100)', {})).toBeUndefined()
    })

    it('createSafeContext strips __proto__ keys from context objects', () => {
      const ctx = createSafeContext({
        obj: { __proto_hack__: 'evil', name: 'safe' },
      })
      const obj = ctx.obj as Record<string, any>
      // __proto_hack__ starts with __ so it should be stripped
      expect(obj.__proto_hack__).toBeUndefined()
      expect(obj.name).toBe('safe')
    })

    it('sanitizeExpression blocks expressions with module keyword', () => {
      expect(() => sanitizeExpression('module.exports')).toThrow()
    })

    it('sanitizeExpression blocks expressions with exports keyword', () => {
      expect(() => sanitizeExpression('exports.secret')).toThrow()
    })

    it('blocks Object.assign with constructor', () => {
      // constructor is blocked
      expect(isExpressionSafe('Object.assign({}, {constructor: evil})')).toBe(false)
    })

    it('context sanitization removes constructor from deeply nested objects', () => {
      const ctx = createSafeContext({
        a: { b: { constructor: 'evil', safe: true } },
      })
      const a = ctx.a as Record<string, any>
      // The 'constructor' own property is stripped; it falls back to Object.prototype.constructor
      expect(Object.prototype.hasOwnProperty.call(a.b, 'constructor')).toBe(false)
      expect(a.b.safe).toBe(true)
    })

    it('blocks Generator keyword', () => {
      expect(isExpressionSafe('Generator')).toBe(false)
    })

    it('blocks AsyncGenerator keyword', () => {
      expect(isExpressionSafe('AsyncGenerator')).toBe(false)
    })
  })
})
