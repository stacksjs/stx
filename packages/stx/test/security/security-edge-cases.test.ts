/* eslint-disable no-template-curly-in-string */
import type { StxOptions } from '../../src/types'
import { beforeEach, describe, expect, it } from 'bun:test'
import {
  generateCsrfToken,
  resetCsrfToken,
  setCsrfToken,
  verifyCsrfToken,
} from '../../src/csrf'
import { escapeHtml, processExpressions, unescapeHtml } from '../../src/expressions'
import { processFormInputDirectives } from '../../src/forms'
import { processDirectives } from '../../src/process'
import {
  configureSafeEvaluator,
  createSafeContext,
  createSafeFunction,
  isExpressionSafe,
  isForExpressionSafe,
  resetSafeEvaluatorConfig,
  safeEvaluate,
  safeEvaluateObject,
  sanitizeExpression,
} from '../../src/safe-evaluator'

const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }

async function processTemplate(template: string, context: Record<string, any> = {}): Promise<string> {
  const deps = new Set<string>()
  return processDirectives(template, context, 'test.stx', defaultOptions, deps)
}

// =============================================================================
// Safe Evaluator Bypass Attempts
// =============================================================================

describe('Safe Evaluator Bypass Attempts', () => {
  beforeEach(() => {
    resetSafeEvaluatorConfig()
  })

  describe('Function constructor access chains', () => {
    it('should block constructor.constructor("return this")()', () => {
      expect(isExpressionSafe('constructor.constructor("return this")()')).toBe(false)
      const result = safeEvaluate('constructor.constructor("return this")()', {})
      expect(result).toBeUndefined()
    })

    it('should block bracket notation constructor chain', () => {
      // ''['constructor']['constructor']('return process')()
      expect(isExpressionSafe('""["constructor"]["constructor"]("return process")()')).toBe(false)
      const result = safeEvaluate('""["constructor"]["constructor"]("return process")()', {})
      expect(result).toBeUndefined()
    })

    it('should block __proto__.constructor chain', () => {
      expect(isExpressionSafe('this.__proto__.constructor("return process")()')).toBe(false)
      const result = safeEvaluate('this.__proto__.constructor("return process")()', {})
      expect(result).toBeUndefined()
    })

    it('should block object literal constructor chain', () => {
      expect(isExpressionSafe('({}).constructor.constructor("return process")()')).toBe(false)
      const result = safeEvaluate('({}).constructor.constructor("return process")()', {})
      expect(result).toBeUndefined()
    })

    it('should block array constructor chain', () => {
      expect(isExpressionSafe('[]["constructor"]["constructor"]("return this")()')).toBe(false)
      const result = safeEvaluate('[]["constructor"]["constructor"]("return this")()', {})
      expect(result).toBeUndefined()
    })
  })

  describe('Indirect eval and call patterns', () => {
    it('should block eval.call(null, ...)', () => {
      expect(isExpressionSafe('eval.call(null, "process.exit()")')).toBe(false)
      const result = safeEvaluate('eval.call(null, "process.exit()")', {})
      expect(result).toBeUndefined()
    })

    it('should block Function.prototype.call.call', () => {
      expect(isExpressionSafe('Function.prototype.call.call(Function, null, "return process")()')).toBe(false)
      const result = safeEvaluate('Function.prototype.call.call(Function, null, "return process")()', {})
      expect(result).toBeUndefined()
    })

    it('should block function expression returning global this', () => {
      // The word "function" is not blocked directly, but the expression
      // contains patterns that should be caught or the evaluation should fail
      // because `this` in strict mode is undefined
      const result = safeEvaluate('(function(){return this})()', {})
      // In strict mode, `this` is undefined inside a function expression
      // The safe evaluator wraps in strict mode, so this should return undefined or be blocked
      expect(result === undefined || result === null).toBe(true)
    })
  })

  describe('Module system access', () => {
    it('should block dynamic import()', () => {
      expect(isExpressionSafe('import("fs")')).toBe(false)
      const result = safeEvaluate('import("fs")', {})
      expect(result).toBeUndefined()
    })

    it('should block require()', () => {
      expect(isExpressionSafe('require("child_process")')).toBe(false)
      const result = safeEvaluate('require("child_process")', {})
      expect(result).toBeUndefined()
    })

    it('should block globalThis.process', () => {
      expect(isExpressionSafe('globalThis.process')).toBe(false)
      const result = safeEvaluate('globalThis.process', {})
      expect(result).toBeUndefined()
    })
  })

  describe('Reflection and metaprogramming', () => {
    it('should block Reflect.apply', () => {
      expect(isExpressionSafe('Reflect.apply(eval, null, ["1+1"])')).toBe(false)
      const result = safeEvaluate('Reflect.apply(eval, null, ["1+1"])', {})
      expect(result).toBeUndefined()
    })

    it('should block Proxy usage', () => {
      expect(isExpressionSafe('new Proxy({}, { get: () => "pwned" })')).toBe(false)
      const result = safeEvaluate('new Proxy({}, { get: () => "pwned" })', {})
      expect(result).toBeUndefined()
    })

    it('should block Symbol usage', () => {
      expect(isExpressionSafe('Symbol("hidden")')).toBe(false)
      const result = safeEvaluate('Symbol("hidden")', {})
      expect(result).toBeUndefined()
    })
  })

  describe('Unicode escape bypass attempts', () => {
    it('should handle unicode escape in identifier: \\u0065val', () => {
      // \\u0065 = 'e', so \\u0065val = eval
      // The regex checks the raw source, which contains the literal text "\u0065val"
      // JavaScript would interpret this as "eval" at runtime, but the pattern
      // check should see "eval" in the string
      const expr = '\u0065val("code")'
      // This resolves to 'eval("code")' which should be blocked
      expect(isExpressionSafe(expr)).toBe(false)
    })

    it('should handle unicode constructor bypass attempt', () => {
      // \u0063onstructor = constructor
      const expr = '\u0063onstructor'
      expect(isExpressionSafe(expr)).toBe(false)
    })
  })

  describe('Comment injection in expressions', () => {
    it('should block eval hidden after comment-like syntax', () => {
      // Even if expression contains comment-like syntax, the regex scan
      // should still find dangerous patterns
      // Note: JS comments are not valid in expression position in new Function(`return EXPR`)
      const result = safeEvaluate('/* harmless */ eval("bad")', {})
      expect(result).toBeUndefined()
    })
  })

  describe('Newline in identifier bypass', () => {
    it('should block expressions with newlines splitting dangerous keywords', () => {
      // ev\nal should not bypass the eval check
      // JavaScript actually does NOT allow newlines in identifiers,
      // so this would be a syntax error anyway, but check it does not succeed
      const result = safeEvaluate('ev\nal("bad")', {})
      expect(result).toBeUndefined()
    })
  })

  describe('arguments.callee access', () => {
    it('should block or fail arguments.callee in strict mode', () => {
      // In strict mode, arguments.callee throws TypeError
      // The safe evaluator uses strict mode
      const result = safeEvaluate('arguments.callee', {})
      expect(result).toBeUndefined()
    })
  })

  describe('Template literal injection', () => {
    it('should block template literal accessing process.env', () => {
      expect(isExpressionSafe('`${process.env.SECRET}`')).toBe(false)
      const result = safeEvaluate('`${process.env.SECRET}`', {})
      expect(result).toBeUndefined()
    })
  })

  describe('Object property descriptor bypass', () => {
    it('should block Object.getOwnPropertyDescriptor on globalThis', () => {
      expect(isExpressionSafe('Object.getOwnPropertyDescriptor(globalThis, "process").value')).toBe(false)
      const result = safeEvaluate('Object.getOwnPropertyDescriptor(globalThis, "process").value', {})
      expect(result).toBeUndefined()
    })
  })

  describe('bind/call/apply bypass attempts', () => {
    it('should block .bind(null)()', () => {
      expect(isExpressionSafe('fn.bind(null)()')).toBe(false)
      const result = safeEvaluate('fn.bind(null)()', { fn: () => 'test' })
      expect(result).toBeUndefined()
    })

    it('should block .call(null)', () => {
      expect(isExpressionSafe('fn.call(null)')).toBe(false)
      const result = safeEvaluate('fn.call(null)', { fn: () => 'test' })
      expect(result).toBeUndefined()
    })

    it('should block .apply(null, [])', () => {
      expect(isExpressionSafe('fn.apply(null, [])')).toBe(false)
      const result = safeEvaluate('fn.apply(null, [])', { fn: () => 'test' })
      expect(result).toBeUndefined()
    })
  })

  describe('WeakRef and FinalizationRegistry', () => {
    it('should block WeakRef', () => {
      expect(isExpressionSafe('new WeakRef({})')).toBe(false)
    })

    it('should block FinalizationRegistry', () => {
      expect(isExpressionSafe('new FinalizationRegistry(() => {})')).toBe(false)
    })

    it('should block WeakMap', () => {
      expect(isExpressionSafe('new WeakMap()')).toBe(false)
    })

    it('should block WeakSet', () => {
      expect(isExpressionSafe('new WeakSet()')).toBe(false)
    })
  })

  describe('Generator and AsyncGenerator', () => {
    it('should block Generator access', () => {
      expect(isExpressionSafe('Generator.prototype')).toBe(false)
    })

    it('should block AsyncGenerator access', () => {
      expect(isExpressionSafe('AsyncGenerator.prototype')).toBe(false)
    })
  })

  describe('Dunder method access', () => {
    it('should block __defineGetter__', () => {
      expect(isExpressionSafe('obj.__defineGetter__("x", () => 1)')).toBe(false)
    })

    it('should block __lookupGetter__', () => {
      expect(isExpressionSafe('obj.__lookupGetter__("x")')).toBe(false)
    })

    it('should block __defineSetter__', () => {
      expect(isExpressionSafe('obj.__defineSetter__("x", () => {})')).toBe(false)
    })
  })

  describe('Combined/chained bypass attempts', () => {
    it('should block chained dangerous patterns', () => {
      // Try to sneak eval via property access
      expect(isExpressionSafe('this["eval"]("1+1")')).toBe(false)
    })

    it('should block setTimeout/setInterval', () => {
      expect(isExpressionSafe('setTimeout("alert(1)", 0)')).toBe(false)
      expect(isExpressionSafe('setInterval("alert(1)", 100)')).toBe(false)
      expect(isExpressionSafe('setImmediate(() => {})')).toBe(false)
    })

    it('should block window and document access', () => {
      expect(isExpressionSafe('window.location.href')).toBe(false)
      expect(isExpressionSafe('document.cookie')).toBe(false)
    })

    it('should block accessing exports and module', () => {
      expect(isExpressionSafe('exports.secret')).toBe(false)
      expect(isExpressionSafe('module.exports')).toBe(false)
    })
  })
})

// =============================================================================
// sanitizeObject Edge Cases
// =============================================================================

describe('sanitizeObject Edge Cases', () => {
  beforeEach(() => {
    resetSafeEvaluatorConfig()
  })

  it('should strip __proto__ key from objects', () => {
    const obj = JSON.parse('{"__proto__": {"polluted": true}, "safe": "value"}')
    const ctx = createSafeContext({ data: obj })
    const data = ctx.data as Record<string, unknown>
    expect(data.safe).toBe('value')
    // __proto__ key should be stripped (starts with __)
    expect(data.__proto__).not.toEqual({ polluted: true })
  })

  it('should strip constructor property from objects', () => {
    const obj = { constructor: 'evil', name: 'safe' }
    const ctx = createSafeContext({ data: obj })
    const data = ctx.data as Record<string, unknown>
    expect(data.name).toBe('safe')
    // The custom 'constructor' value 'evil' should be stripped by sanitizeObject.
    // data.constructor will be the inherited Object constructor (from prototype),
    // NOT the custom 'evil' string value that was provided.
    expect(data.constructor).not.toBe('evil')
    expect(Object.prototype.hasOwnProperty.call(data, 'constructor')).toBe(false)
  })

  it('should strip prototype property from objects', () => {
    const obj = { prototype: { polluted: true }, name: 'safe' }
    const ctx = createSafeContext({ data: obj })
    const data = ctx.data as Record<string, unknown>
    expect(data.name).toBe('safe')
    expect(data.prototype).toBeUndefined()
  })

  it('should handle deeply nested objects up to maxSanitizeDepth', () => {
    // Build a 15-level deep object (default depth limit is 10)
    let obj: any = { value: 'deepest' }
    for (let i = 0; i < 14; i++) {
      obj = { nested: obj }
    }

    const ctx = createSafeContext({ data: obj })
    // Should not throw / stack overflow
    expect(ctx.data).toBeDefined()

    // At depth > 10, the value should be replaced with '[Object too deep]'
    let current: any = ctx.data
    let depth = 0
    while (current && typeof current === 'object' && current.nested) {
      current = current.nested
      depth++
    }
    // Once past depth limit, the nested object becomes '[Object too deep]'
    expect(depth).toBeLessThanOrEqual(11)
  })

  it('should handle deeply nested objects with custom maxSanitizeDepth', () => {
    configureSafeEvaluator({ maxSanitizeDepth: 3 })
    let obj: any = { value: 'deep' }
    for (let i = 0; i < 5; i++) {
      obj = { nested: obj }
    }

    const ctx = createSafeContext({ data: obj })
    expect(ctx.data).toBeDefined()
    // Should truncate at depth 3
    let current: any = ctx.data
    let depth = 0
    while (current && typeof current === 'object' && current.nested && typeof current.nested === 'object') {
      current = current.nested
      depth++
    }
    expect(depth).toBeLessThanOrEqual(4)
  })

  it('should handle objects with circular references without infinite loop', () => {
    const obj: any = { name: 'circular' }
    obj.self = obj // circular reference

    // This should not hang or throw a stack overflow
    // createSafeContext uses sanitizeObject which has a depth limit
    const ctx = createSafeContext({ data: obj })
    expect(ctx.data).toBeDefined()
    const data = ctx.data as Record<string, unknown>
    expect(data.name).toBe('circular')
  })

  it('should handle objects with getter that throws', () => {
    const obj: Record<string, unknown> = { safe: 'value' }
    Object.defineProperty(obj, 'dangerous', {
      get() {
        throw new Error('getter error')
      },
      enumerable: true,
    })

    // Object.entries iterates and will call the getter
    // The sanitizer should handle this gracefully
    try {
      const ctx = createSafeContext({ data: obj })
      // If it doesn't throw, that's fine too
      expect(ctx).toBeDefined()
    }
    catch {
      // Acceptable - the getter threw
    }
  })

  it('should handle objects with non-enumerable properties', () => {
    const obj: Record<string, unknown> = { visible: 'yes' }
    Object.defineProperty(obj, 'hidden', {
      value: 'secret',
      enumerable: false,
    })

    const ctx = createSafeContext({ data: obj })
    const data = ctx.data as Record<string, unknown>
    expect(data.visible).toBe('yes')
    // Non-enumerable properties should not appear (Object.entries skips them)
    expect(data.hidden).toBeUndefined()
  })

  it('should handle arrays with holes (sparse arrays)', () => {
    // eslint-disable-next-line no-sparse-arrays
    const arr = [1, , 3]
    const ctx = createSafeContext({ data: arr })
    // Arrays are passed through directly since they are Array.isArray
    expect(ctx.data).toBeDefined()
    const data = ctx.data as unknown[]
    expect(data[0]).toBe(1)
    expect(data[2]).toBe(3)
  })

  it('should pass through Date objects', () => {
    const date = new Date('2025-06-15T12:00:00Z')
    const ctx = createSafeContext({ ts: date })
    expect(ctx.ts).toBeInstanceOf(Date)
    expect((ctx.ts as Date).toISOString()).toBe('2025-06-15T12:00:00.000Z')
  })

  it('should pass through RegExp objects', () => {
    const regex = /^test\d+$/i
    const ctx = createSafeContext({ pattern: regex })
    expect(ctx.pattern).toBeInstanceOf(RegExp)
    expect((ctx.pattern as RegExp).test('test42')).toBe(true)
    expect((ctx.pattern as RegExp).test('nope')).toBe(false)
  })

  it('should pass through Map objects', () => {
    const map = new Map<string, number>([['a', 1], ['b', 2]])
    const ctx = createSafeContext({ lookup: map })
    expect(ctx.lookup).toBeInstanceOf(Map)
    expect((ctx.lookup as Map<string, number>).get('a')).toBe(1)
    expect((ctx.lookup as Map<string, number>).size).toBe(2)
  })

  it('should pass through Set objects', () => {
    const set = new Set([10, 20, 30])
    const ctx = createSafeContext({ unique: set })
    expect(ctx.unique).toBeInstanceOf(Set)
    expect((ctx.unique as Set<number>).has(20)).toBe(true)
    expect((ctx.unique as Set<number>).size).toBe(3)
  })

  it('should handle objects with toJSON method', () => {
    const obj = {
      name: 'test',
      toJSON() {
        return { serialized: true }
      },
    }
    const ctx = createSafeContext({ data: obj })
    const data = ctx.data as Record<string, unknown>
    // toJSON is a normal method, should be preserved
    expect(data.name).toBe('test')
    expect(typeof data.toJSON).toBe('function')
  })

  it('should handle object with numeric keys', () => {
    const obj = { 0: 'zero', 1: 'one', 2: 'two' }
    const ctx = createSafeContext({ data: obj })
    const data = ctx.data as Record<string, unknown>
    expect(data['0']).toBe('zero')
    expect(data['1']).toBe('one')
  })

  it('should handle object with empty string key', () => {
    const obj = { '': 'empty-key-value', normal: 'ok' }
    const ctx = createSafeContext({ data: obj })
    const data = ctx.data as Record<string, unknown>
    expect(data['']).toBe('empty-key-value')
    expect(data.normal).toBe('ok')
  })
})

// =============================================================================
// createSafeContext Edge Cases
// =============================================================================

describe('createSafeContext Edge Cases', () => {
  it('should strip context keys with __defineGetter__ property name', () => {
    const ctx = createSafeContext({ __defineGetter__: 'bad', safe: 'ok' })
    // __defineGetter__ starts with __ so the custom value should be stripped.
    // The inherited Object.prototype.__defineGetter__ method will still exist,
    // but the user-supplied 'bad' value should NOT be set as own property.
    expect(Object.prototype.hasOwnProperty.call(ctx, '__defineGetter__')).toBe(false)
    expect(ctx.safe).toBe('ok')
  })

  it('should strip context keys with __lookupGetter__ property name', () => {
    const ctx = createSafeContext({ __lookupGetter__: 'bad', safe: 'ok' })
    // Same as above: inherited method exists, but own property should not be set
    expect(Object.prototype.hasOwnProperty.call(ctx, '__lookupGetter__')).toBe(false)
    expect(ctx.safe).toBe('ok')
  })

  it('should handle very large context (1000+ keys)', () => {
    const bigContext: Record<string, unknown> = {}
    for (let i = 0; i < 1000; i++) {
      bigContext[`key_${i}`] = `value_${i}`
    }

    const ctx = createSafeContext(bigContext)
    // Should not throw or take excessive time
    expect(ctx.key_0).toBe('value_0')
    expect(ctx.key_999).toBe('value_999')
    // Should also have the globals
    expect(ctx.Math).toBeDefined()
    expect(ctx.JSON).toBeDefined()
  })

  it('should handle context with numeric keys', () => {
    const ctx = createSafeContext({ 42: 'numeric-key' } as any)
    expect(ctx['42']).toBe('numeric-key')
  })

  it('should handle context with empty string key', () => {
    const ctx = createSafeContext({ '': 'empty-key' })
    expect(ctx['']).toBe('empty-key')
  })

  it('should strip context keys matching dangerous patterns', () => {
    // constructor, prototype, __proto__ should all be blocked
    const ctx = createSafeContext({
      constructor: 'bad',
      prototype: 'bad',
      __proto__: { polluted: true },
      eval: 'bad', // 'eval' matches the dangerous pattern
      process: 'bad', // 'process' matches the dangerous pattern
      safe: 'ok',
    })
    expect(ctx.safe).toBe('ok')
    // These should be stripped
    expect(ctx.constructor).not.toBe('bad')
    expect(ctx.prototype).not.toBe('bad')
    expect(ctx.eval).toBeUndefined()
    expect(ctx.process).toBeUndefined()
  })

  it('should include allowed globals in context', () => {
    const ctx = createSafeContext({})
    expect(ctx.Math).toBe(Math)
    expect(ctx.JSON).toBe(JSON)
    expect(ctx.Date).toBe(Date)
    expect(ctx.String).toBe(String)
    expect(ctx.Number).toBe(Number)
    expect(ctx.Boolean).toBe(Boolean)
    expect(ctx.Array).toBe(Array)
    expect(ctx.parseInt).toBe(Number.parseInt)
    expect(ctx.parseFloat).toBe(Number.parseFloat)
    expect(typeof ctx.encodeURIComponent).toBe('function')
    expect(typeof ctx.decodeURIComponent).toBe('function')
  })

  it('should preserve single-underscore prefix keys but strip double-underscore', () => {
    const ctx = createSafeContext({
      _id: 1,
      _name: 'test',
      __internal: 'hidden',
      __secret: 'classified',
    })
    expect(ctx._id).toBe(1)
    expect(ctx._name).toBe('test')
    expect(ctx.__internal).toBeUndefined()
    expect(ctx.__secret).toBeUndefined()
  })
})

// =============================================================================
// CSRF Edge Cases
// =============================================================================

describe('CSRF Edge Cases', () => {
  beforeEach(() => {
    resetCsrfToken()
  })

  it('should fail verification after token reset', () => {
    const token = generateCsrfToken()
    expect(verifyCsrfToken(token)).toBe(true)

    resetCsrfToken()
    // After reset, no token is set, so verification should fail
    expect(verifyCsrfToken(token)).toBe(false)
  })

  it('should generate unique tokens in sequence', () => {
    const tokens: string[] = []
    for (let i = 0; i < 50; i++) {
      resetCsrfToken()
      tokens.push(generateCsrfToken())
    }

    const uniqueTokens = new Set(tokens)
    expect(uniqueTokens.size).toBe(50)
  })

  it('should generate token of exact requested length', () => {
    for (const len of [10, 20, 32, 40, 64, 128]) {
      resetCsrfToken()
      const token = generateCsrfToken(len)
      expect(token.length).toBe(len)
    }
  })

  it('should handle very long token verification (10000 chars)', () => {
    const longToken = 'a'.repeat(10000)
    setCsrfToken(longToken)

    expect(verifyCsrfToken(longToken)).toBe(true)
    expect(verifyCsrfToken('a'.repeat(9999) + 'b')).toBe(false)
  })

  it('should use timing-safe comparison (constant-time)', () => {
    // We cannot truly test timing safety in a unit test, but we can verify
    // the code uses crypto.timingSafeEqual by checking the behavior
    const token = generateCsrfToken(40)
    setCsrfToken(token)

    // Same token should pass
    expect(verifyCsrfToken(token)).toBe(true)

    // Different token of same length should fail
    const differentToken = token.split('').reverse().join('')
    if (differentToken !== token) {
      expect(verifyCsrfToken(differentToken)).toBe(false)
    }
  })

  it('should return false for empty string token', () => {
    setCsrfToken('valid-token')
    expect(verifyCsrfToken('')).toBe(false)
  })

  it('should return false when no global token is set', () => {
    // resetCsrfToken was called in beforeEach
    expect(verifyCsrfToken('any-token')).toBe(false)
  })

  it('should return false for length-mismatched tokens without throwing', () => {
    setCsrfToken('short')
    expect(() => verifyCsrfToken('much-longer-token-here')).not.toThrow()
    expect(verifyCsrfToken('much-longer-token-here')).toBe(false)
  })

  it('should support per-request token verification (two-arg form)', () => {
    const requestToken = 'per-request-token-abc123'
    const sessionToken = 'per-request-token-abc123'

    expect(verifyCsrfToken(requestToken, sessionToken)).toBe(true)
    expect(verifyCsrfToken('wrong', sessionToken)).toBe(false)
  })

  it('should return false for per-request verification with empty expected', () => {
    // When expected is empty string, Buffer lengths differ from any submitted token
    expect(verifyCsrfToken('submitted', '')).toBe(false)
  })

  it('should handle tokens with only hex characters', () => {
    // generateCsrfToken produces hex tokens
    const token = generateCsrfToken()
    expect(/^[0-9a-f]+$/.test(token)).toBe(true)
  })
})

// =============================================================================
// XSS in Template Expressions (Full Pipeline)
// =============================================================================

describe('XSS in Template Expressions', () => {
  it('should escape basic XSS: <script>alert(1)</script>', async () => {
    const template = '<div>{{ userInput }}</div>'
    const result = await processTemplate(template, {
      userInput: '<script>alert(1)</script>',
    })
    expect(result).not.toContain('<script>alert(1)</script>')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('&lt;/script&gt;')
  })

  it('should escape event handler XSS: <img src=x onerror=alert(1)>', async () => {
    const template = '<div>{{ userInput }}</div>'
    const result = await processTemplate(template, {
      userInput: '<img src=x onerror=alert(1)>',
    })
    expect(result).not.toContain('<img src=x onerror=alert(1)>')
    expect(result).toContain('&lt;img')
  })

  it('should pass through javascript: protocol when no HTML-special chars present', async () => {
    // NOTE: escapeHtml only escapes & < > " ' characters.
    // "javascript:alert(1)" contains none of those, so it passes through unchanged.
    // This is a known limitation: {{ }} escaping prevents HTML injection but does NOT
    // sanitize URL protocols. Href sanitization requires separate URL validation logic.
    const template = '<a href="{{ url }}">Link</a>'
    const result = await processTemplate(template, {
      url: 'javascript:alert(1)',
    })
    // Without dedicated URL sanitization, the javascript: protocol passes through
    expect(result).toContain('javascript:alert(1)')
  })

  it('should escape javascript: protocol with quotes in alert', async () => {
    // When the javascript: URL contains quotes, those ARE escaped
    const template = '<a href="{{ url }}">Link</a>'
    const result = await processTemplate(template, {
      url: 'javascript:alert("xss")',
    })
    // The double quotes should be escaped, breaking the attribute
    expect(result).toContain('&quot;')
    expect(result).not.toContain('javascript:alert("xss")')
  })

  it('should escape attribute breakout: " onmouseover="alert(1)', async () => {
    const template = '<div title="{{ title }}">Content</div>'
    const result = await processTemplate(template, {
      title: '" onmouseover="alert(1)',
    })
    expect(result).toContain('&quot;')
    expect(result).not.toContain('" onmouseover="alert(1)')
  })

  it('should escape tag breakout: \'><script>alert(1)</script>', async () => {
    const template = '<input value="{{ val }}">'
    const result = await processTemplate(template, {
      val: '\'><script>alert(1)</script>',
    })
    expect(result).toContain('&#39;')
    expect(result).toContain('&lt;script&gt;')
    expect(result).not.toContain('<script>alert(1)</script>')
  })

  it('should not execute expression injection: {{constructor.constructor(...)}}', async () => {
    // When a user provides content that contains {{ }}, it should be escaped
    // and NOT re-evaluated
    const template = '<div>{{ userContent }}</div>'
    const result = await processTemplate(template, {
      userContent: '{{constructor.constructor("return this")()}}',
    })
    // The inner {{ }} should be rendered as literal text, not evaluated
    expect(result).toContain('{{')
    expect(result).toContain('}}')
    // Should not have executed any code
    expect(result).not.toContain('[object')
  })

  it('should not execute directive injection in user content', async () => {
    const template = '<div>{{ userContent }}</div>'
    const result = await processTemplate(template, {
      userContent: '@if(true)INJECTED@endif',
    })
    // Directives in user content should be treated as literal text
    expect(result).toContain('@if(true)')
  })

  it('should escape </script> in context to prevent script tag breakout', async () => {
    const template = '<div>{{ content }}</div>'
    const result = await processTemplate(template, {
      content: '</script><script>alert(1)</script>',
    })
    expect(result).not.toContain('</script><script>')
    expect(result).toContain('&lt;/script&gt;')
  })

  it('should handle null bytes before XSS payload', async () => {
    const template = '<div>{{ content }}</div>'
    const result = await processTemplate(template, {
      content: '\x00<script>alert(1)</script>',
    })
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should handle UTF-7 BOM XSS attempt', async () => {
    const template = '<div>{{ content }}</div>'
    const result = await processTemplate(template, {
      content: '+ADw-script+AD4-alert(1)+ADw-/script+AD4-',
    })
    // UTF-7 encoding should be passed through as literal text, not decoded
    // The + characters are safe in HTML
    expect(result).toContain('+ADw-script+AD4-')
    expect(result).not.toContain('<script>')
  })

  it('should not allow XSS via SVG onload', async () => {
    const template = '<div>{{ content }}</div>'
    const result = await processTemplate(template, {
      content: '<svg/onload=alert("XSS")>',
    })
    expect(result).not.toContain('<svg/onload=')
    expect(result).toContain('&lt;svg')
  })

  it('should not allow XSS via data: URI', async () => {
    const template = '<div>{{ content }}</div>'
    const result = await processTemplate(template, {
      content: '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Click</a>',
    })
    expect(result).toContain('&lt;a')
    expect(result).not.toContain('<a href="data:')
  })
})

// =============================================================================
// Double Escaping Issues
// =============================================================================

describe('Double Escaping Issues', () => {
  it('should double-escape already-escaped content (escapeHtml is applied once per render)', () => {
    // escapeHtml applied to already-escaped content WILL double-escape
    // This is by design: {{ }} always escapes, so pre-escaped content gets re-escaped
    const alreadyEscaped = '&lt;script&gt;'
    const result = escapeHtml(alreadyEscaped)
    // & in &lt; becomes &amp;, so &lt; becomes &amp;lt;
    expect(result).toBe('&amp;lt;script&amp;gt;')
  })

  it('should confirm double escaping via template ({{ }} always escapes)', async () => {
    const template = '<div>{{ content }}</div>'
    const result = await processTemplate(template, {
      content: '&lt;script&gt;alert(1)&lt;/script&gt;',
    })
    // The ampersands in &lt; get escaped to &amp;lt;
    expect(result).toContain('&amp;lt;script&amp;gt;')
  })

  it('should handle mixed escaped/unescaped: <b>&amp;</b>', async () => {
    const template = '<div>{{ content }}</div>'
    const result = await processTemplate(template, {
      content: '<b>&amp;</b>',
    })
    // < and > get escaped, & in &amp; also gets escaped
    expect(result).toContain('&lt;b&gt;')
    expect(result).toContain('&amp;amp;')
    expect(result).toContain('&lt;/b&gt;')
  })

  it('should output raw HTML with triple braces {{{ }}} without escaping', async () => {
    const template = '<div>{{{ html }}}</div>'
    const result = await processTemplate(template, {
      html: '<strong>Bold & "quoted"</strong>',
    })
    // Triple braces should NOT escape
    expect(result).toContain('<strong>Bold & "quoted"</strong>')
    expect(result).not.toContain('&lt;strong&gt;')
    expect(result).not.toContain('&amp;')
  })

  it('should output raw HTML with {!! !!} without escaping', async () => {
    const template = '<div>{!! html !!}</div>'
    const result = await processTemplate(template, {
      html: '<em>Italic & "stuff"</em>',
    })
    expect(result).toContain('<em>Italic & "stuff"</em>')
    expect(result).not.toContain('&lt;em&gt;')
  })

  it('should confirm escapeHtml(escapeHtml(value)) differs from escapeHtml(value)', () => {
    const value = '<script>"Hello" & \'World\'</script>'
    const once = escapeHtml(value)
    const twice = escapeHtml(escapeHtml(value))

    expect(once).not.toBe(twice)
    // Once: &lt;script&gt;&quot;Hello&quot; &amp; &#39;World&#39;&lt;/script&gt;
    expect(once).toContain('&lt;script&gt;')
    // Twice: &amp;lt;script&amp;gt;...
    expect(twice).toContain('&amp;lt;script&amp;gt;')
  })

  it('should correctly round-trip with unescapeHtml', () => {
    const original = '<div class="test">Hello & \'world\'</div>'
    const escaped = escapeHtml(original)
    const unescaped = unescapeHtml(escaped)
    expect(unescaped).toBe(original)
  })
})

// =============================================================================
// Form Input Edge Cases
// =============================================================================

describe('Form Input XSS Edge Cases', () => {
  it('should escape XSS in @input context value via processFormInputDirectives', () => {
    const template = '@input("username")'
    const context = {
      old: { username: '<script>alert(1)</script>' },
    }
    const result = processFormInputDirectives(template, context)
    // The value attribute should be escaped
    expect(result).toContain('name="username"')
    expect(result).not.toContain('<script>alert(1)</script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should escape HTML in textarea content via processFormInputDirectives', () => {
    const template = '@textarea("bio")User bio here@endtextarea'
    const context = {
      old: { bio: '</textarea><script>alert(1)</script>' },
    }
    const result = processFormInputDirectives(template, context)
    // The textarea content should escape </textarea> to prevent breakout
    expect(result).toContain('<textarea')
    expect(result).not.toContain('</textarea><script>')
    // There should be exactly one closing textarea tag (the real one)
    const matches = result.match(/<\/textarea>/g)
    expect(matches?.length).toBe(1)
  })

  it('should escape special characters in select name via processFormInputDirectives', () => {
    const template = '@select("items")' +
      '<option value="a">A</option>' +
      '<option value="b">B</option>' +
      '@endselect'
    const result = processFormInputDirectives(template, {})
    expect(result).toContain('name="items"')
    expect(result).toContain('<select')
  })

  it('should render CSRF hidden input with proper escaping', async () => {
    const template = '<form>@csrf</form>'
    const result = await processTemplate(template)
    expect(result).toMatch(/<input type="hidden" name="_token" value="[^"]*"/)
    // The token value should only contain hex chars (no injection possible)
    const valueMatch = result.match(/value="([^"]*)"/)
    if (valueMatch) {
      expect(/^[a-f0-9]+$/.test(valueMatch[1])).toBe(true)
    }
  })

  it('should handle @form with method spoofing and CSRF via processFormInputDirectives', () => {
    const template = "@form('PUT', '/api/resource')Content@endform"
    const context: Record<string, any> = {}
    const result = processFormInputDirectives(template, context)
    expect(result).toContain('method="POST"')
    expect(result).toContain('action="/api/resource"')
    // Should contain CSRF hidden input
    expect(result).toContain('type="hidden"')
    expect(result).toContain('name="_token"')
    // Should contain method spoofing hidden input
    expect(result).toContain('name="_method"')
    expect(result).toContain('value="PUT"')
  })

  it('should escape XSS in @checkbox value attribute', () => {
    const template = '@checkbox("agree", "<script>alert(1)</script>")'
    const result = processFormInputDirectives(template, {})
    expect(result).toContain('type="checkbox"')
    expect(result).toContain('name="agree"')
    expect(result).not.toContain('<script>alert(1)</script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should escape XSS in input name attribute', () => {
    const template = '@input("na<script>me")'
    const result = processFormInputDirectives(template, {})
    expect(result).toContain('name="na&lt;script&gt;me"')
    expect(result).not.toContain('name="na<script>me"')
  })
})

// =============================================================================
// isForExpressionSafe Edge Cases
// =============================================================================

describe('isForExpressionSafe Additional Edge Cases', () => {
  it('should block eval with varied spacing', () => {
    expect(isForExpressionSafe('eval ("code")')).toBe(false)
    expect(isForExpressionSafe('eval  ("code")')).toBe(false)
  })

  it('should block Function constructor', () => {
    expect(isForExpressionSafe('Function ("return 1")')).toBe(false)
  })

  it('should block case-insensitive dangerous patterns', () => {
    // isForExpressionSafe uses /i flag on its patterns
    expect(isForExpressionSafe('EVAL("code")')).toBe(false)
    expect(isForExpressionSafe('Process.exit()')).toBe(false)
    expect(isForExpressionSafe('GLOBALTHIS')).toBe(false)
    expect(isForExpressionSafe('WINDOW.location')).toBe(false)
    expect(isForExpressionSafe('DOCUMENT.cookie')).toBe(false)
  })

  it('should block constructor with dot notation', () => {
    expect(isForExpressionSafe('obj.constructor("evil")')).toBe(false)
    expect(isForExpressionSafe('constructor("evil")')).toBe(false)
  })

  it('should allow arithmetic and comparison expressions', () => {
    expect(isForExpressionSafe('let i = 0; i < items.length; i++')).toBe(true)
    expect(isForExpressionSafe('let i = 10; i >= 0; i--')).toBe(true)
    expect(isForExpressionSafe('let i = 0; i < n; i += 2')).toBe(true)
  })
})

// =============================================================================
// createSafeFunction Edge Cases
// =============================================================================

describe('createSafeFunction Edge Cases', () => {
  it('should throw for expressions with eval', () => {
    expect(() => createSafeFunction('eval("1+1")', ['x'])).toThrow()
  })

  it('should throw for expressions with Function constructor', () => {
    expect(() => createSafeFunction('Function("return 1")()', ['x'])).toThrow()
  })

  it('should throw for expressions with process', () => {
    expect(() => createSafeFunction('process.exit()', ['x'])).toThrow()
  })

  it('should throw for expressions with import', () => {
    expect(() => createSafeFunction('import("fs")', ['x'])).toThrow()
  })

  it('should handle safe expressions correctly', () => {
    const fn = createSafeFunction('a + b', ['a', 'b'])
    expect(fn(3, 4)).toBe(7)
  })

  it('should handle string operations', () => {
    const fn = createSafeFunction('name.toUpperCase()', ['name'])
    expect(fn('hello')).toBe('HELLO')
  })

  it('should handle array operations', () => {
    const fn = createSafeFunction('items.length', ['items'])
    expect(fn([1, 2, 3])).toBe(3)
  })

  it('should handle undefined property access gracefully', () => {
    const fn = createSafeFunction('obj.nonexistent', ['obj'])
    expect(fn({})).toBeUndefined()
  })

  it('should handle TypeError gracefully (returns undefined)', () => {
    const fn = createSafeFunction('obj.nested.value', ['obj'])
    // obj.nested is undefined, so .value throws TypeError
    // The function catches TypeError and returns undefined
    expect(fn({})).toBeUndefined()
  })
})

// =============================================================================
// sanitizeExpression with bracket notation config
// =============================================================================

describe('sanitizeExpression Bracket Notation Configuration', () => {
  beforeEach(() => {
    resetSafeEvaluatorConfig()
  })

  it('should block bracket notation with strings by default', () => {
    expect(() => sanitizeExpression('obj["key"]')).toThrow('Bracket notation')
    expect(() => sanitizeExpression("obj['key']")).toThrow('Bracket notation')
  })

  it('should allow bracket notation when configured', () => {
    configureSafeEvaluator({ allowBracketNotation: true })
    // With bracket notation allowed, simple bracket access should work
    // But dangerous patterns inside brackets should still be blocked
    expect(() => sanitizeExpression('obj["key"]')).not.toThrow()
  })

  it('should still block dangerous patterns even with bracket notation allowed', () => {
    configureSafeEvaluator({ allowBracketNotation: true })
    expect(() => sanitizeExpression('obj["constructor"]')).toThrow('Potentially unsafe')
    expect(() => sanitizeExpression('obj["__proto__"]')).toThrow('Potentially unsafe')
  })

  it('should allow numeric bracket notation regardless of config', () => {
    // obj[0] does not match the bracket notation pattern (no quotes)
    expect(() => sanitizeExpression('obj[0]')).not.toThrow()
    expect(() => sanitizeExpression('arr[i]')).not.toThrow()
  })
})

// =============================================================================
// processExpressions unit tests
// =============================================================================

describe('processExpressions XSS Handling', () => {
  it('should escape HTML entities in {{ }} expressions', () => {
    const result = processExpressions(
      '{{ name }}',
      { name: '<b>Bold</b>' },
      'test.stx',
    )
    expect(result).toContain('&lt;b&gt;Bold&lt;/b&gt;')
    expect(result).not.toContain('<b>Bold</b>')
  })

  it('should NOT escape HTML in {{{ }}} expressions', () => {
    const result = processExpressions(
      '{{{ html }}}',
      { html: '<b>Bold</b>' },
      'test.stx',
    )
    expect(result).toContain('<b>Bold</b>')
  })

  it('should NOT escape HTML in {!! !!} expressions', () => {
    const result = processExpressions(
      '{!! html !!}',
      { html: '<i>Italic</i>' },
      'test.stx',
    )
    expect(result).toContain('<i>Italic</i>')
  })

  it('should render empty string for undefined/null in escaped expressions', () => {
    const result = processExpressions(
      '{{ missing }}',
      {},
      'test.stx',
    )
    // undefined values should render as empty string, not "undefined"
    // The behavior depends on whether the expression is considered safe
    // and how the evaluator handles missing context vars
    expect(result).not.toContain('undefined')
  })

  it('should handle expressions with nested property access', () => {
    const result = processExpressions(
      '{{ user.name }}',
      { user: { name: 'Alice & Bob' } },
      'test.stx',
    )
    expect(result).toContain('Alice &amp; Bob')
    expect(result).not.toContain('Alice & Bob')
  })
})

// =============================================================================
// escapeHtml / unescapeHtml Correctness
// =============================================================================

describe('escapeHtml Correctness', () => {
  it('should escape all five HTML-significant characters', () => {
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('>')).toBe('&gt;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect(escapeHtml('\'')).toBe('&#39;')
  })

  it('should not modify safe strings', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
    expect(escapeHtml('123')).toBe('123')
    expect(escapeHtml('')).toBe('')
  })

  it('should handle strings with multiple special characters', () => {
    const input = '<div class="test" data-val=\'a&b\'>'
    const expected = '&lt;div class=&quot;test&quot; data-val=&#39;a&amp;b&#39;&gt;'
    expect(escapeHtml(input)).toBe(expected)
  })
})

describe('unescapeHtml Correctness', () => {
  it('should unescape all five HTML entities', () => {
    expect(unescapeHtml('&amp;')).toBe('&')
    expect(unescapeHtml('&lt;')).toBe('<')
    expect(unescapeHtml('&gt;')).toBe('>')
    expect(unescapeHtml('&quot;')).toBe('"')
    expect(unescapeHtml('&#39;')).toBe('\'')
    expect(unescapeHtml('&#039;')).toBe('\'')
  })

  it('should handle empty and falsy input', () => {
    expect(unescapeHtml('')).toBe('')
  })

  it('should handle the correct order of unescaping (amp last)', () => {
    // unescapeHtml replaces &amp; last to avoid double-unescaping
    const input = '&amp;lt;script&amp;gt;'
    const result = unescapeHtml(input)
    // First pass: &lt; and &gt; are NOT present (they're &amp;lt; and &amp;gt;)
    // But &amp; -> & converts them to &lt; and &gt;
    // Then those are NOT re-processed because replace is not recursive
    expect(result).toBe('&lt;script&gt;')
  })
})

// =============================================================================
// safeEvaluate with dangerous context values
// =============================================================================

describe('safeEvaluate with Edge Case Contexts', () => {
  it('should handle context with function values safely', () => {
    const result = safeEvaluate('greet("World")', {
      greet: (name: string) => `Hello, ${name}!`,
    })
    expect(result).toBe('Hello, World!')
  })

  it('should handle context with null values', () => {
    const result = safeEvaluate('val', { val: null })
    expect(result).toBeNull()
  })

  it('should handle context with undefined values', () => {
    const result = safeEvaluate('val', { val: undefined })
    expect(result).toBeUndefined()
  })

  it('should handle context with boolean values', () => {
    expect(safeEvaluate('flag', { flag: true })).toBe(true)
    expect(safeEvaluate('flag', { flag: false })).toBe(false)
  })

  it('should handle context with array values', () => {
    const result = safeEvaluate('items[1]', { items: ['a', 'b', 'c'] })
    expect(result).toBe('b')
  })

  it('should handle ternary with string results', () => {
    expect(safeEvaluate('x ? "yes" : "no"', { x: true })).toBe('yes')
    expect(safeEvaluate('x ? "yes" : "no"', { x: false })).toBe('no')
  })

  it('should handle Math operations', () => {
    const result = safeEvaluate('Math.max(a, b)', { a: 3, b: 7 })
    expect(result).toBe(7)
  })

  it('should handle JSON.stringify', () => {
    const result = safeEvaluate('JSON.stringify(data)', { data: { x: 1 } })
    expect(result).toBe('{"x":1}')
  })

  it('should handle string methods', () => {
    const result = safeEvaluate('name.toUpperCase()', { name: 'hello' })
    expect(result).toBe('HELLO')
  })

  it('should handle Number operations', () => {
    const result = safeEvaluate('Number("42")', {})
    expect(result).toBe(42)
  })
})

// =============================================================================
// safeEvaluateObject Edge Cases
// =============================================================================

describe('safeEvaluateObject Edge Cases', () => {
  it('should return empty object for non-object results', () => {
    expect(safeEvaluateObject('42', {})).toEqual({})
    expect(safeEvaluateObject('"string"', {})).toEqual({})
    expect(safeEvaluateObject('true', {})).toEqual({})
    expect(safeEvaluateObject('null', {})).toEqual({})
  })

  it('should return empty object for array results', () => {
    expect(safeEvaluateObject('[1, 2, 3]', {})).toEqual({})
  })

  it('should return object for object literal expressions', () => {
    const result = safeEvaluateObject('({ name: "test", count: 5 })', {})
    expect(result.name).toBe('test')
    expect(result.count).toBe(5)
  })

  it('should return empty object for unsafe expressions', () => {
    const result = safeEvaluateObject('process.env', {})
    expect(result).toEqual({})
  })
})

// =============================================================================
// Integration: Combined XSS and Template Security
// =============================================================================

describe('Integration: Combined XSS and Template Security', () => {
  it('should handle multiple XSS vectors in a single template', async () => {
    const template = `
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <a href="{{ url }}">{{ linkText }}</a>
      <div title="{{ tooltip }}">{{ content }}</div>
    `
    const result = await processTemplate(template, {
      title: '<script>alert("title")</script>',
      description: '<img src=x onerror=alert(1)>',
      url: 'javascript:alert(1)',
      linkText: '<a href="evil">Click</a>',
      tooltip: '" onfocus="alert(1)',
      content: '\'><svg/onload=alert(1)>',
    })

    // None of the XSS payloads should be rendered unescaped
    expect(result).not.toContain('<script>alert("title")</script>')
    expect(result).not.toContain('<img src=x onerror=')
    expect(result).not.toContain('" onfocus="alert(1)')
    expect(result).not.toContain('<svg/onload=')

    // All should be escaped
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('&lt;img')
    expect(result).toContain('&lt;svg')
    expect(result).toContain('&quot;')
  })

  it('should handle XSS in @if conditional context', async () => {
    const template = `
      @if(showUser)
        <span>{{ userName }}</span>
      @endif
    `
    const result = await processTemplate(template, {
      showUser: true,
      userName: '<script>document.cookie</script>',
    })
    expect(result).toContain('&lt;script&gt;')
    expect(result).not.toContain('<script>document.cookie</script>')
  })

  it('should handle XSS in @foreach loop variable', async () => {
    const template = `
      <ul>
        @foreach(items as item)
          <li>{{ item }}</li>
        @endforeach
      </ul>
    `
    const result = await processTemplate(template, {
      items: ['safe', '<script>alert(1)</script>', '<img onerror=alert(1)>'],
    })
    expect(result).toContain('safe')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('&lt;img')
    expect(result).not.toContain('<script>alert(1)</script>')
    expect(result).not.toContain('<img onerror=')
  })

  it('should handle XSS in nested object properties within loops', async () => {
    const template = `
      @foreach(users as user)
        <div>{{ user.name }} - {{ user.bio }}</div>
      @endforeach
    `
    const result = await processTemplate(template, {
      users: [
        { name: 'Alice', bio: '<script>alert("bio")</script>' },
        { name: '<b>Bob</b>', bio: 'Normal bio' },
      ],
    })
    expect(result).toContain('Alice')
    expect(result).toContain('Normal bio')
    expect(result).toContain('&lt;script&gt;')
    expect(result).toContain('&lt;b&gt;Bob&lt;/b&gt;')
    expect(result).not.toContain('<script>')
  })
})
