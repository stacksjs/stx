/**
 * Security edge case tests - redistributed from bugs/ directory.
 *
 * Covers: Safe evaluator deep probes, XSS prevention, attack vectors,
 * and security regression tests.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processExpressions } from '../../src/expressions'
import { processBasicFormDirectives, processFormInputDirectives, defaultFormClasses } from '../../src/forms'
import { processMetaDirectives } from '../../src/seo'
import { isExpressionSafe, safeEvaluate, safeEvaluateCondition, safeEvaluateArray, safeEvaluateObject, createSafeFunction, createSafeContext, isForExpressionSafe, createSafeLoopFunction, configureSafeEvaluator, resetSafeEvaluatorConfig, sanitizeExpression } from '../../src/safe-evaluator'
import type { StxOptions } from '../../src/types'

const opts = defaultConfig as any as StxOptions
const fp = 'test.stx'

// =============================================================================
// 1. Safe Evaluator Deep Probes (from deep-edge-cases.ts)
// =============================================================================

describe('Safe Evaluator Deep Probes', () => {
  it('expression accessing `this` should be blocked', () => {
    const result = isExpressionSafe('this.value')
    expect(result).toBe(false)
  })

  it('expression with `new` keyword should be blocked', () => {
    const result = isExpressionSafe('new Date()')
    expect(result).toBe(false)
  })

  it('expression with assignment: `x = 5` - check safety', () => {
    const isSafe = isExpressionSafe('x = 5')
    expect(typeof isSafe).toBe('boolean')
  })

  it('expression with delete should be blocked', () => {
    const result = isExpressionSafe('delete obj.key')
    expect(result).toBe(false)
  })

  it('expression with eval should be blocked', () => {
    expect(isExpressionSafe('eval("1+1")')).toBe(false)
  })

  it('expression with Function constructor should be blocked', () => {
    expect(isExpressionSafe('Function("return 1")')).toBe(false)
  })

  it('expression with process should be blocked', () => {
    expect(isExpressionSafe('process.env.SECRET')).toBe(false)
  })

  it('expression with require should be blocked', () => {
    expect(isExpressionSafe('require("fs")')).toBe(false)
  })

  it('expression with __proto__ should be blocked', () => {
    expect(isExpressionSafe('obj.__proto__')).toBe(false)
  })

  it('expression with constructor should be blocked', () => {
    expect(isExpressionSafe('obj.constructor')).toBe(false)
  })

  it('expression with prototype should be blocked', () => {
    expect(isExpressionSafe('Object.prototype')).toBe(false)
  })

  it('simple arithmetic is safe', () => {
    expect(isExpressionSafe('2 + 3')).toBe(true)
    const result = safeEvaluate('2 + 3', {})
    expect(result).toBe(5)
  })

  it('string concatenation is safe', () => {
    expect(isExpressionSafe('"hello" + " " + "world"')).toBe(true)
    const result = safeEvaluate('"hello" + " " + "world"', {})
    expect(result).toBe('hello world')
  })

  it('context variable access is safe', () => {
    const result = safeEvaluate('name', { name: 'Alice' })
    expect(result).toBe('Alice')
  })

  it('expression with window should be blocked', () => {
    expect(isExpressionSafe('window.location')).toBe(false)
  })
})

// =============================================================================
// 2. safeEvaluate string literal false positives (from discovered-bugs.ts)
// =============================================================================

describe('safeEvaluate string literal false positives', () => {
  it('BUG: should allow __proto__ inside a string literal', () => {
    const result = safeEvaluate('"__proto__"', {})
    expect(result).toBe('__proto__')
  })

  it('BUG: should allow constructor inside a string literal', () => {
    const result = safeEvaluate('"constructor"', {})
    expect(result).toBe('constructor')
  })

  it('should still block actual __proto__ access', () => {
    const result = safeEvaluate('obj.__proto__', { obj: {} })
    expect(result).toBeUndefined()
  })
})

// =============================================================================
// 3. Safe evaluator additional attacks (from discovered-bugs.ts)
// =============================================================================

describe('Safe evaluator additional attacks', () => {
  it('should handle comma operator (may execute multiple expressions)', () => {
    const r = safeEvaluate('(1, 2, 3)', {})
    expect(r).toBe(3)
  })

  it('should handle void operator', () => {
    const r = safeEvaluate('void 0', {})
    expect(r).toBeUndefined()
  })

  it('should handle spread in array', () => {
    const r = safeEvaluate('[...arr, 4]', { arr: [1, 2, 3] })
    expect(r).toEqual([1, 2, 3, 4])
  })

  it('should handle object spread', () => {
    const r = safeEvaluate('({...obj, c: 3})', { obj: { a: 1, b: 2 } })
    expect(r).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('should handle nullish coalescing', () => {
    expect(safeEvaluate<string>('val ?? "default"', { val: null })).toBe('default')
    expect(safeEvaluate<number>('val ?? "default"', { val: 0 })).toBe(0)
  })

  it('should handle optional chaining', () => {
    expect(safeEvaluate('obj?.nested?.value', { obj: {} })).toBeUndefined()
    expect(safeEvaluate<number>('obj?.nested?.value', { obj: { nested: { value: 42 } } })).toBe(42)
  })

  it('should block tagged template literals that could be code execution', () => {
    const r = isExpressionSafe('eval`code`')
    expect(r).toBe(false)
  })

  it('arguments object is accessible in Function scope (known limitation)', () => {
    const r = safeEvaluate('typeof arguments', {})
    expect(r).toBe('object')
  })

  it('should block constructor chain access', () => {
    const r = isExpressionSafe('"".constructor.constructor("return 1")()')
    expect(r).toBe(false)
  })

  it('should block indirect globalThis access', () => {
    const r = isExpressionSafe('(0, eval)("1")')
    expect(r).toBe(false)
  })
})

// =============================================================================
// 4. @meta XSS prevention (from discovered-bugs.ts)
// =============================================================================

describe('@meta XSS prevention', () => {
  it('BUG: should escape meta name containing angle brackets', () => {
    const r = processMetaDirectives("@meta('desc<script>', 'content')", {}, fp, opts)
    expect(r).not.toContain('<script>')
  })
})

// =============================================================================
// 5. Safe evaluator edge cases (from edge-case-bugs.ts)
// =============================================================================

describe('Safe evaluator edge cases', () => {
  beforeEach(() => {
    resetSafeEvaluatorConfig()
  })

  it('should handle empty string expression', () => {
    const result = safeEvaluate('', {})
    expect(result).toBeUndefined()
  })

  it('should handle whitespace-only expression', () => {
    const result = safeEvaluate('   ', {})
    expect(result).toBeUndefined()
  })

  it('should handle very long arithmetic expression', () => {
    const expr = Array.from({ length: 500 }, () => '1').join(' + ')
    const result = safeEvaluate(expr, {})
    expect(result).toBe(500)
  })

  it('should handle expression with template literal', () => {
    const result = safeEvaluate('`Hello ${name}`', { name: 'World' })
    expect(result).toBe('Hello World')
  })

  it('should handle safeEvaluateCondition with complex boolean chain', () => {
    const ctx = { a: true, b: false, c: true }
    const result = safeEvaluateCondition('a && !b && c', ctx)
    expect(result).toBe(true)
  })

  it('should handle safeEvaluateCondition returning false on error', () => {
    const result = safeEvaluateCondition('nonexistent.property.deep', {})
    expect(result).toBe(false)
  })

  it('should handle safeEvaluateArray with string input (should return [])', () => {
    const result = safeEvaluateArray('"hello"', {})
    expect(result).toEqual([])
  })

  it('should handle safeEvaluateArray with null expression (should return [])', () => {
    const result = safeEvaluateArray('null', {})
    expect(result).toEqual([])
  })

  it('should handle safeEvaluateArray with valid array', () => {
    const result = safeEvaluateArray('[1, 2, 3]', {})
    expect(result).toEqual([1, 2, 3])
  })

  it('should handle safeEvaluateObject with array (should return {})', () => {
    const result = safeEvaluateObject('[1, 2, 3]', {})
    expect(result).toEqual({})
  })

  it('should handle safeEvaluateObject with string (should return {})', () => {
    const result = safeEvaluateObject('"hello"', {})
    expect(result).toEqual({})
  })

  it('should handle safeEvaluateObject with valid object', () => {
    const result = safeEvaluateObject('({ a: 1, b: 2 })', {})
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should handle createSafeFunction with expression referencing non-existent var', () => {
    const fn = createSafeFunction('x + y', ['x', 'y'])
    const result = fn(1, undefined)
    expect(Number.isNaN(result as number)).toBe(true)
  })

  it('should handle createSafeLoopFunction for a for loop', () => {
    const fn = createSafeLoopFunction('for', 'let i = 0; i < 3; i++', '{{ i }}', [])
    const result = fn()
    expect(result).toContain('0')
    expect(result).toContain('1')
    expect(result).toContain('2')
  })

  it('should handle createSafeLoopFunction while loop with max iterations', () => {
    const fn = createSafeLoopFunction('while', 'true', 'x', [], 5)
    const result = fn()
    expect(result).toContain('Maximum iterations exceeded')
  })

  it('should handle isForExpressionSafe with safe patterns', () => {
    expect(isForExpressionSafe('let i = 0; i < 10; i++')).toBe(true)
    expect(isForExpressionSafe('let i = 0; i < n; i += 2')).toBe(true)
  })

  it('should handle isForExpressionSafe rejecting dangerous patterns', () => {
    expect(isForExpressionSafe('eval("evil")')).toBe(false)
    expect(isForExpressionSafe('let i = process.exit()')).toBe(false)
    expect(isForExpressionSafe('window.location')).toBe(false)
  })

  it('should configure safe evaluator to enable bracket notation', () => {
    configureSafeEvaluator({ allowBracketNotation: true })
    const result = safeEvaluate('obj["key"]', { obj: { key: 'value' } })
    expect(result).toBe('value')
    resetSafeEvaluatorConfig()
  })

  it('should block bracket notation by default', () => {
    resetSafeEvaluatorConfig()
    const result = safeEvaluate('obj["key"]', { obj: { key: 'value' } })
    expect(result).toBeUndefined()
  })

  it('should handle deep object at exactly max sanitize depth', () => {
    let obj: any = { value: 'deep' }
    for (let i = 0; i < 9; i++) {
      obj = { nested: obj }
    }
    const ctx = createSafeContext({ root: obj })
    expect(ctx.root).toBeDefined()
  })

  it('should handle createSafeContext with function values (functions pass through)', () => {
    const myFn = (x: number) => x * 2
    const ctx = createSafeContext({ myFn, name: 'test' })
    expect(ctx.myFn).toBeDefined()
    expect(ctx.name).toBe('test')
  })

  it('should handle isExpressionSafe with simple math', () => {
    expect(isExpressionSafe('1 + 2')).toBe(true)
    expect(isExpressionSafe('a > b')).toBe(true)
  })

  it('should handle isExpressionSafe blocking eval', () => {
    expect(isExpressionSafe('eval("code")')).toBe(false)
  })
})

// =============================================================================
// 6. Security Regression Tests (from regression-bugs.ts)
// =============================================================================

describe('Security Regression Tests', () => {
  it('should escape HTML in {{ }} expressions', () => {
    const result = processExpressions('{{ userInput }}', { userInput: '<script>alert("xss")</script>' }, fp)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should NOT escape HTML in {!! !!} raw expressions', () => {
    const result = processExpressions('{!! rawHtml !!}', { rawHtml: '<strong>Bold</strong>' }, fp)
    expect(result).toContain('<strong>Bold</strong>')
    expect(result).not.toContain('&lt;strong&gt;')
  })

  it('should generate CSRF token in UUID format', () => {
    const context: Record<string, any> = {}
    const result = processBasicFormDirectives('@csrf', context)
    expect(result).toContain('type="hidden"')
    expect(result).toContain('name="_token"')
    const tokenMatch = result.match(/value="([^"]+)"/)
    expect(tokenMatch).toBeTruthy()
    const token = tokenMatch![1]
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('should escape @input value attribute to prevent XSS', () => {
    const context = {
      old: { name: '"><script>alert("xss")</script>' },
      errors: {},
    }
    const result = processFormInputDirectives(`@input('name')`, context, defaultFormClasses)
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('should escape @textarea content to prevent XSS', () => {
    const context = {
      old: { bio: '<img src=x onerror=alert(1)>' },
      errors: {},
    }
    const result = processFormInputDirectives(`@textarea('bio')Default@endtextarea`, context, defaultFormClasses)
    expect(result).toContain('&lt;img')
    expect(result).toContain('&gt;')
    expect(result).not.toContain('<img')
  })

  it('should escape @meta content to prevent XSS', () => {
    const template = `@meta('description', 'A <script>alert(1)</script> test')`
    const result = processMetaDirectives(template, {}, fp, opts)
    expect(result).toContain('&lt;script&gt;')
    expect(result).not.toContain('<script>alert')
  })

  it('should block process.env access in expressions', () => {
    const isSafe = isExpressionSafe('process.env.SECRET')
    expect(isSafe).toBe(false)
  })

  it('should block eval in expressions', () => {
    const isSafe = isExpressionSafe('eval("alert(1)")')
    expect(isSafe).toBe(false)
  })

  it('should block window/document access in expressions', () => {
    expect(isExpressionSafe('window.location')).toBe(false)
    expect(isExpressionSafe('document.cookie')).toBe(false)
  })

  it('should block prototype pollution via constructor access', () => {
    expect(isExpressionSafe('({}).constructor.constructor("return this")()')).toBe(false)
    expect(isExpressionSafe('x.__proto__')).toBe(false)
  })
})
