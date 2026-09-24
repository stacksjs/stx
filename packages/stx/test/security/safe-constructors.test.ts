import { describe, expect, it } from 'bun:test'
import {
  createSafeFunction,
  getExpressionSafetyRule,
  isExpressionSafe,
  safeEvaluate,
  sanitizeExpression,
  UnsafeExpressionError,
} from '../../src/safe-evaluator'

/**
 * `new` is banned in template expressions because `new Function('...')()`
 * runs arbitrary code. A handful of value constructors are let through, bound
 * to the evaluator's own copy so the template's context cannot swap them.
 *
 * Found building marioadrion: `{{ new Date().getFullYear() }}` in a footer
 * rendered as an empty string.
 */

const run = (expr: string, ctx: Record<string, unknown> = {}): unknown =>
  createSafeFunction(expr, Object.keys(ctx))(...Object.values(ctx))

describe('allowlisted constructors', () => {
  it('evaluates new Date()', () => {
    expect(run('new Date(0).getUTCFullYear()')).toBe(1970)
    expect(safeEvaluate('new Date(0).getUTCFullYear()', {})).toBe(1970)
    expect(run('new Date(ts).toISOString()', { ts: 0 })).toBe('1970-01-01T00:00:00.000Z')
  })

  it('evaluates new URL() and new URLSearchParams()', () => {
    expect(run(`new URL('https://example.com/a/b?c=1').pathname`)).toBe('/a/b')
    expect(run(`new URLSearchParams('a=1&b=2').get('b')`)).toBe('2')
  })

  it('evaluates new Intl.* constructors', () => {
    expect(run(`new Intl.NumberFormat('en-US').format(1234.5)`)).toBe('1,234.5')
    expect(run(`new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric' }).format(new Date(0))`)).toBe('1970')
    expect(run(`new Intl.PluralRules('en-US').select(1)`)).toBe('one')
    expect(run(`new Intl . NumberFormat('en-US').format(1)`)).toBe('1')
  })

  it('evaluates several allowlisted constructors in one expression', () => {
    expect(run(`new Date(0).getUTCFullYear() + '-' + new URL('https://x.y/z').host`)).toBe('1970-x.y')
  })

  it('evaluates a `new` inside a template literal interpolation', () => {
    expect(run('`© ${new Date(0).getUTCFullYear()}`')).toBe('© 1970')
  })

  it('leaves the word "new" inside strings alone', () => {
    expect(run(`'new ' + name`, { name: 'item' })).toBe('new item')
    expect(run(`"new Function('x')"`)).toBe(`new Function('x')`)
  })

  it('treats `.new` as a property, not the operator', () => {
    expect(run('counts.new + 1', { counts: { new: 4 } })).toBe(5)
    expect(run('counts?.new', { counts: { new: 2 } })).toBe(2)
  })

  it('constructs the real Date even when the context binds `Date`', () => {
    const Fake = function () { return { getUTCFullYear: () => 'shadowed' } }
    expect(run('new Date(0).getUTCFullYear()', { Date: Fake })).toBe(1970)
    // Non-`new` uses still read the context's binding, as before.
    expect(run('typeof Date.now', { Date: { now: 'x' } })).toBe('string')
  })

  it('ignores a context key named after the evaluator\'s own binding', () => {
    const fake = { Date: function () { return { getUTCFullYear: () => 'hijacked' } } }
    expect(run('new Date(0).getUTCFullYear()', { __stx_safe_ctors: fake })).toBe(1970)
  })

  it('survives a missing identifier retry', () => {
    expect(run('new Date(0).getUTCFullYear() + (missing ?? 0)')).toBe(1970)
  })
})

describe('rejected `new` expressions', () => {
  const rejected = [
    // The reason the rule exists.
    `new Function('return process')()`,
    // Reaching Function through any value.
    `new (x.constructor)('return 1')()`,
    `new x.constructor('return 1')()`,
    `new Date.constructor('return 1')()`,
    `new Date(0).constructor.constructor('return 1')()`,
    // Constructors off the allowlist.
    'new Map()',
    'new Proxy({}, {})',
    'new Intl.Foo()',
    'new Intl.DateTimeFormat.prototype.format()',
    // Not a plain `new Name(` call: parenthesised, computed or member targets.
    'new (Date)(0)',
    'new x.Date(0)',
    `new Intl['DateTimeFormat']()`,
    'new Date',
    'new Date.now()',
    // A disallowed `new` hidden among allowed ones.
    'new Date(new Map())',
    '[...new Set(items)]',
    '`${new Map()}`',
    // A constructor name spliced together around a string literal.
    `new ''Date(0)`,
    // Naming the evaluator's binding directly.
    'new __stx_safe_ctors.Date(0)',
    '__stx_safe_ctors',
    // Comments are not whitespace here.
    'new/**/Date(0)',
  ]

  for (const expr of rejected) {
    it(`rejects ${expr}`, () => {
      expect(isExpressionSafe(expr)).toBe(false)
      expect(() => createSafeFunction(expr, ['x', 'items'])).toThrow()
      expect(safeEvaluate(expr, { x: {}, items: [] })).toBeUndefined()
    })
  }

  it('names the allowlist in the rule', () => {
    const rule = getExpressionSafetyRule('new Map()')
    expect(rule).toContain('new Date()')
    expect(rule).toContain('new Intl.')
    expect(() => sanitizeExpression('new Map()')).toThrow(UnsafeExpressionError)
    expect(() => sanitizeExpression('new Map()')).toThrow('Potentially unsafe expression')
  })

  it('reports null for a safe expression', () => {
    expect(getExpressionSafetyRule('new Date(0)')).toBeNull()
    expect(getExpressionSafetyRule('a + b')).toBeNull()
  })

  it('sanitizeExpression returns the expression as written, not the rewrite', () => {
    expect(sanitizeExpression('  new Date(0)  ')).toBe('new Date(0)')
  })
})
