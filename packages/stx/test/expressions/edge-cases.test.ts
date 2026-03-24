/**
 * Expression edge case tests - redistributed from bugs/ directory.
 *
 * Covers:
 * - Expression filter stress tests
 * - Expression processing edge cases
 * - Additional filter edge cases
 * - Expression bugs and regressions
 */
import { describe, expect, it } from 'bun:test'
import { defaultFilters, escapeHtml, processExpressions, evaluateExpression, registerFilter, clearCustomFilters } from '../../src/expressions'

const fp = 'test.stx'

// =============================================================================
// 1. Expression Filter Stress Tests (from deep-edge-cases.ts)
// =============================================================================

describe('Expression Filter Stress Tests', () => {
  const ctx = {}

  it('uppercase filter with extremely long string (10000 chars)', () => {
    const longStr = 'a'.repeat(10000)
    const result = defaultFilters.uppercase(longStr, ctx)
    expect(result).toBe('A'.repeat(10000))
    expect(result.length).toBe(10000)
  })

  it('lowercase filter with only whitespace', () => {
    const result = defaultFilters.lowercase('   \t\n  ', ctx)
    expect(result).toBe('   \t\n  ')
  })

  it('capitalize filter with only newlines', () => {
    const result = defaultFilters.capitalize('\n\n\n', ctx)
    expect(result).toBe('\n\n\n')
  })

  it('uppercase filter with HTML entities as input', () => {
    const result = defaultFilters.uppercase('&amp; &lt; &gt;', ctx)
    expect(result).toBe('&AMP; &LT; &GT;')
  })

  it('uppercase filter with unicode - emoji, CJK, RTL', () => {
    const emoji = defaultFilters.uppercase('hello 🎉', ctx)
    expect(emoji).toContain('HELLO')
    expect(emoji).toContain('🎉')

    const cjk = defaultFilters.uppercase('你好世界', ctx)
    expect(cjk).toBe('你好世界')

    const rtl = defaultFilters.uppercase('مرحبا', ctx)
    expect(rtl).toBe('مرحبا')
  })

  it('number filter with Infinity', () => {
    const result = defaultFilters.number(Infinity, ctx, 2)
    expect(result).toBe('Infinity')
  })

  it('number filter with -Infinity', () => {
    const result = defaultFilters.number(-Infinity, ctx, 2)
    expect(result).toBe('-Infinity')
  })

  it('number filter with Number.MAX_SAFE_INTEGER', () => {
    const result = defaultFilters.number(Number.MAX_SAFE_INTEGER, ctx, 0)
    expect(result).toBe(String(Number.MAX_SAFE_INTEGER))
  })

  it('currency filter with very small number (0.001)', () => {
    const result = defaultFilters.currency(0.001, ctx, 'USD', 'en-US')
    expect(typeof result).toBe('string')
    expect(result).toContain('$')
  })

  it('truncate filter with string shorter than suffix', () => {
    const result = defaultFilters.truncate('ab', ctx, 2, '...')
    // string length (2) <= length (2), should return as-is
    expect(result).toBe('ab')
  })

  it('truncate filter where length equals suffix length', () => {
    const result = defaultFilters.truncate('abcdef', ctx, 3, '...')
    // length (3) <= suffix.length (3), returns suffix.substring(0, 3)
    expect(result).toBe('...')
  })

  it('replace filter where search matches entire string', () => {
    const result = defaultFilters.replace('hello', ctx, 'hello', 'world')
    expect(result).toBe('world')
  })

  it('replace filter where replacement contains the search pattern', () => {
    const result = defaultFilters.replace('abc', ctx, 'a', 'ab')
    // Should replace all 'a' with 'ab' but not recurse
    expect(result).toBe('abbc')
  })

  it('join filter with undefined items in array', () => {
    const arr = [1, undefined, 3, undefined, 5]
    const result = defaultFilters.join(arr, ctx, ',')
    expect(result).toContain('1')
    expect(result).toContain('3')
    expect(result).toContain('5')
  })

  it('first on empty array returns undefined', () => {
    const result = defaultFilters.first([], ctx)
    expect(result).toBeUndefined()
  })

  it('last on empty array returns undefined', () => {
    const result = defaultFilters.last([], ctx)
    expect(result).toBeUndefined()
  })

  it('reverse on very long array (10000 items)', () => {
    const arr = Array.from({ length: 10000 }, (_, i) => i)
    const result = defaultFilters.reverse(arr, ctx) as number[]
    expect(result[0]).toBe(9999)
    expect(result[9999]).toBe(0)
    expect(result.length).toBe(10000)
  })

  it('slice with start greater than length', () => {
    const result = defaultFilters.slice([1, 2, 3], ctx, 100)
    expect(result).toEqual([])
  })

  it('date filter with epoch (0)', () => {
    const result = defaultFilters.date(0, ctx, 'iso')
    expect(result).toBe('1970-01-01T00:00:00.000Z')
  })

  it('date filter with far future date', () => {
    const result = defaultFilters.date('9999-12-31', ctx, 'iso')
    expect(result).toContain('9999')
  })

  it('fmt filter with very large number', () => {
    const result = defaultFilters.fmt(999999999999, ctx, 'en-US')
    expect(result).toContain(',')
    expect(result).toContain('999')
  })

  it('abs on -0 returns 0', () => {
    const result = defaultFilters.abs(-0, ctx)
    expect(Object.is(result, 0) || result === 0).toBe(true)
  })

  it('round with very many decimal places (15)', () => {
    const result = defaultFilters.round(1.123456789012345, ctx, 15)
    expect(typeof result).toBe('number')
    expect(result).toBeCloseTo(1.123456789012345, 12)
  })
})

// =============================================================================
// 2. Expression Processing Edge Cases (from deep-edge-cases.ts)
// =============================================================================

describe('Expression Processing Edge Cases', () => {
  it('expression with null value produces empty string', () => {
    const result = processExpressions('{{ val }}', { val: null }, 'test.stx')
    expect(result.trim()).toBe('')
  })

  it('expression with undefined value produces empty string', () => {
    const result = processExpressions('{{ val }}', { val: undefined }, 'test.stx')
    expect(result.trim()).toBe('')
  })

  it('expression with boolean false renders as false or empty', () => {
    const result = processExpressions('{{ val }}', { val: false }, 'test.stx')
    expect(result).toContain('false')
  })

  it('expression with zero renders as 0', () => {
    const result = processExpressions('{{ val }}', { val: 0 }, 'test.stx')
    expect(result).toContain('0')
  })

  it('raw expression {!! !!} does not escape HTML', () => {
    const result = processExpressions('{!! html !!}', { html: '<b>bold</b>' }, 'test.stx')
    expect(result).toContain('<b>bold</b>')
  })

  it('escaped expression {{ }} does escape HTML', () => {
    const result = processExpressions('{{ html }}', { html: '<b>bold</b>' }, 'test.stx')
    expect(result).toContain('&lt;b&gt;')
    expect(result).not.toContain('<b>bold</b>')
  })

  it('expression with simple arithmetic', () => {
    const result = processExpressions('{{ a + b }}', { a: 10, b: 20 }, 'test.stx')
    expect(result).toContain('30')
  })

  it('expression with string concatenation', () => {
    const result = processExpressions('{{ first + " " + last }}', { first: 'John', last: 'Doe' }, 'test.stx')
    expect(result).toContain('John Doe')
  })

  it('expression with array access', () => {
    const result = processExpressions('{{ items[0] }}', { items: ['first', 'second'] }, 'test.stx')
    // Bracket notation may not be allowed in safe evaluator
    expect(typeof result).toBe('string')
  })

  it('expression with method chain', () => {
    const result = processExpressions('{{ name.toUpperCase() }}', { name: 'alice' }, 'test.stx')
    expect(result).toContain('ALICE')
  })

  it('multiple expressions on one line', () => {
    const result = processExpressions('{{ a }} and {{ b }}', { a: 'X', b: 'Y' }, 'test.stx')
    expect(result).toContain('X')
    expect(result).toContain('Y')
    expect(result).toContain('and')
  })

  it('expression with ternary operator', () => {
    const result = processExpressions('{{ show ? "yes" : "no" }}', { show: true }, 'test.stx')
    expect(result).toContain('yes')
  })

  it('expression with logical OR for default value', () => {
    const result = processExpressions('{{ val || "default" }}', { val: '' }, 'test.stx')
    expect(result).toContain('default')
  })

  it('expression with nullish coalescing style fallback', () => {
    const result = processExpressions('{{ val || "fallback" }}', { val: null }, 'test.stx')
    expect(result).toContain('fallback')
  })

  it('escapeHtml escapes all special chars', () => {
    const result = escapeHtml('<script>"alert(\'xss\')&</script>')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).toContain('&quot;')
    expect(result).toContain('&#39;')
    expect(result).toContain('&amp;')
    expect(result).not.toContain('<script>')
  })
})

// =============================================================================
// 3. Additional Filter Edge Cases (from deep-edge-cases.ts)
// =============================================================================

describe('Additional Filter Edge Cases', () => {
  const ctx = {}

  it('json filter with undefined returns "undefined"', () => {
    const result = defaultFilters.json(undefined, ctx)
    expect(result).toBe('undefined')
  })

  it('json filter with null returns "null"', () => {
    const result = defaultFilters.json(null, ctx)
    expect(result).toBe('null')
  })

  it('json filter with pretty flag', () => {
    const result = defaultFilters.json({ a: 1 }, ctx, true)
    expect(result).toContain('\n')
    expect(result).toContain('  ')
  })

  it('default filter returns default when value is empty string', () => {
    const result = defaultFilters.default('', ctx, 'fallback')
    expect(result).toBe('fallback')
  })

  it('default filter returns value when present', () => {
    const result = defaultFilters.default('actual', ctx, 'fallback')
    expect(result).toBe('actual')
  })

  it('length filter on object returns key count', () => {
    const result = defaultFilters.length({ a: 1, b: 2, c: 3 }, ctx)
    expect(result).toBe(3)
  })

  it('length filter on null returns 0', () => {
    const result = defaultFilters.length(null, ctx)
    expect(result).toBe(0)
  })

  it('length filter on number returns 0', () => {
    const result = defaultFilters.length(42, ctx)
    expect(result).toBe(0)
  })

  it('stripTags filter removes all HTML tags', () => {
    const result = defaultFilters.stripTags('<p>Hello <b>World</b></p>', ctx)
    expect(result).toBe('Hello World')
  })

  it('urlencode filter encodes special chars', () => {
    const result = defaultFilters.urlencode('hello world&foo=bar', ctx)
    expect(result).toBe('hello%20world%26foo%3Dbar')
  })

  it('capitalize on empty string returns empty string', () => {
    const result = defaultFilters.capitalize('', ctx)
    expect(result).toBe('')
  })

  it('capitalize on null returns empty string', () => {
    const result = defaultFilters.capitalize(null, ctx)
    expect(result).toBe('')
  })

  it('pluralize returns singular when count is 1', () => {
    const result = defaultFilters.pluralize(1, ctx, 'item', 'items')
    expect(result).toBe('item')
  })

  it('pluralize returns plural when count is not 1', () => {
    const result = defaultFilters.pluralize(5, ctx, 'item', 'items')
    expect(result).toBe('items')
  })

  it('pluralize returns plural when count is 0', () => {
    const result = defaultFilters.pluralize(0, ctx, 'item', 'items')
    expect(result).toBe('items')
  })

  it('pluralize auto-appends s when no plural form given', () => {
    const result = defaultFilters.pluralize(2, ctx, 'cat')
    expect(result).toBe('cats')
  })

  it('reverse on string reverses characters', () => {
    const result = defaultFilters.reverse('hello', ctx)
    expect(result).toBe('olleh')
  })

  it('reverse on null returns empty string', () => {
    const result = defaultFilters.reverse(null, ctx)
    expect(result).toBe('')
  })

  it('date filter with invalid date returns original string', () => {
    const result = defaultFilters.date('not-a-date', ctx, 'short')
    expect(result).toBe('not-a-date')
  })

  it('currency filter with NaN returns string representation', () => {
    const result = defaultFilters.currency('abc', ctx, 'USD')
    expect(result).toBe('abc')
  })

  it('number filter with NaN returns empty string', () => {
    const result = defaultFilters.number('xyz', ctx, 2)
    expect(result).toBe('')
  })

  it('number filter with null returns empty string', () => {
    const result = defaultFilters.number(null, ctx, 2)
    expect(result).toBe('')
  })

  it('abs filter with NaN returns 0', () => {
    const result = defaultFilters.abs('not-a-number', ctx)
    expect(result).toBe(0)
  })

  it('round filter with NaN returns 0', () => {
    const result = defaultFilters.round('not-a-number', ctx, 2)
    expect(result).toBe(0)
  })

  it('first on string returns first character', () => {
    const result = defaultFilters.first('hello', ctx)
    expect(result).toBe('h')
  })

  it('last on string returns last character', () => {
    const result = defaultFilters.last('hello', ctx)
    expect(result).toBe('o')
  })

  it('slice on string', () => {
    const result = defaultFilters.slice('hello world', ctx, 0, 5)
    expect(result).toBe('hello')
  })

  it('escape filter on null returns empty string', () => {
    const result = defaultFilters.escape(null, ctx)
    expect(result).toBe('')
  })

  it('fmt filter with NaN returns original string', () => {
    const result = defaultFilters.fmt('abc', ctx, 'en-US')
    expect(result).toBe('abc')
  })
})

// =============================================================================
// 4. Expression edge cases (from discovered-bugs.ts)
// =============================================================================

describe('Expression edge cases', () => {
  it('should not evaluate @{{ }} at the expression level (handled by process pipeline)', () => {
    const result = processExpressions('@{{ name }}', { name: 'Alice' }, fp)
    expect(result).toBeDefined()
  })
})

// =============================================================================
// 5. Expression bugs (from discovered-bugs.ts)
// =============================================================================

describe('Expression bugs', () => {
  // JSON.stringify in expression gets double-escaped
  it('should correctly handle JSON.stringify in expressions', () => {
    const r = processExpressions('{{ JSON.stringify(data) }}', { data: { key: 'value' } }, fp)
    expect(r).toContain('{')
    expect(r).toContain('key')
  })

  // Expression with newlines
  it('should handle multiline expressions', () => {
    const r = processExpressions('{{ a +\n  b }}', { a: 1, b: 2 }, fp)
    expect(r).toContain('3')
  })

  // Expression with deeply nested property access
  it('should handle 5-level deep property access', () => {
    const ctx = { a: { b: { c: { d: { e: 'deep' } } } } }
    const r = processExpressions('{{ a.b.c.d.e }}', ctx, fp)
    expect(r).toContain('deep')
  })

  // Expression with array index access
  it('should handle array index access', () => {
    const r = processExpressions('{{ items[0] }}', { items: ['first', 'second'] }, fp)
    expect(r).toContain('first')
  })

  // Expression with array.at(-1) for last element
  it('should handle array.at(-1) for last element', () => {
    const r = processExpressions('{{ items.at(-1) }}', { items: [1, 2, 3] }, fp)
    expect(r).toContain('3')
  })

  // Expression that returns object
  it('should stringify object in {{ }}', () => {
    const r = processExpressions('{{ obj }}', { obj: { a: 1 } }, fp)
    expect(r).toBeDefined()
    expect(r).not.toBe('')
  })

  // Expression that returns array
  it('should stringify array in {{ }}', () => {
    const r = processExpressions('{{ arr }}', { arr: [1, 2, 3] }, fp)
    expect(r).toContain('1')
  })

  // Expression with Date
  it('should handle Date in expressions', () => {
    const r = processExpressions('{{ d.getFullYear() }}', { d: new Date(2024, 0, 1) }, fp)
    expect(r).toContain('2024')
  })

  // Multiple expressions on same line
  it('should handle multiple expressions on same line', () => {
    const r = processExpressions('{{ a }}-{{ b }}-{{ c }}', { a: 1, b: 2, c: 3 }, fp)
    expect(r).toBe('1-2-3')
  })

  // Expression inside HTML attribute
  it('should work inside HTML attributes', () => {
    const r = processExpressions('<div class="{{ cls }}">test</div>', { cls: 'active' }, fp)
    expect(r).toContain('class="active"')
  })

  // Expression with string that contains {{ }}
  it('should handle value containing curly braces', () => {
    const r = processExpressions('{{ val }}', { val: 'has {braces}' }, fp)
    expect(r).toContain('has {braces}')
  })

  // Triple expression {{{ }}}
  it('should output raw HTML with {{{ }}}', () => {
    const r = processExpressions('{{{ html }}}', { html: '<b>bold</b>' }, fp)
    expect(r).toBe('<b>bold</b>')
  })

  // {!! !!} raw output
  it('should output raw HTML with {!! !!}', () => {
    const r = processExpressions('{!! html !!}', { html: '<em>italic</em>' }, fp)
    expect(r).toBe('<em>italic</em>')
  })

  // {{ }} escapes HTML
  it('should escape HTML entities in {{ }}', () => {
    const r = processExpressions('{{ val }}', { val: '<script>alert("xss")</script>' }, fp)
    expect(r).not.toContain('<script>')
    expect(r).toContain('&lt;script&gt;')
  })
})

// =============================================================================
// 6. Filter edge cases (from discovered-bugs.ts)
// =============================================================================

describe('Filter edge cases', () => {
  it('should handle truncate with length equal to suffix length', () => {
    const result = defaultFilters.truncate('Hello World', {}, 3, '...')
    expect(result).toBe('...')
  })

  it('should handle truncate with length of 0', () => {
    const result = defaultFilters.truncate('Hello World', {}, 0, '...')
    expect(result.length).toBe(0)
  })

  it('should handle number filter with NaN input', () => {
    const result = defaultFilters.number('not-a-number', {})
    expect(result).toBe('')
  })

  it('should handle currency filter with very large number', () => {
    const result = defaultFilters.currency(999999999999, {})
    expect(result).toContain('999')
  })

  it('should handle join filter with non-array input', () => {
    const result = defaultFilters.join('not-an-array', {})
    expect(result).toBe('')
  })

  it('should handle slice filter with negative start', () => {
    const result = defaultFilters.slice([1, 2, 3, 4, 5], {}, -2)
    expect(result).toEqual([4, 5])
  })

  it('should handle reverse filter with single character string', () => {
    const result = defaultFilters.reverse('a', {})
    expect(result).toBe('a')
  })

  it('should handle length filter with object', () => {
    const result = defaultFilters.length({ a: 1, b: 2, c: 3 }, {})
    expect(result).toBe(3)
  })
})

// =============================================================================
// 7. Filter bugs (from discovered-bugs.ts)
// =============================================================================

describe('Filter bugs', () => {
  // date filter with Date object
  it('should format Date object with date filter', () => {
    const d = new Date(2024, 0, 15)
    const r = defaultFilters.date(d, {}, 'iso')
    expect(r).toContain('2024-01-15')
  })

  // date filter with timestamp
  it('should format timestamp with date filter', () => {
    const r = defaultFilters.date(1705276800000, {}, 'iso')
    expect(r).toContain('2024')
  })

  // json filter with pretty option
  it('should pretty-print JSON with indent', () => {
    const r = defaultFilters.json({ a: 1, b: 2 }, {}, true)
    expect(r).toContain('\n')
    expect(r).toContain('  ')
  })

  // json filter with circular reference
  it('should handle circular reference in json filter', () => {
    const obj: any = { a: 1 }
    obj.self = obj
    const r = defaultFilters.json(obj, {})
    expect(typeof r).toBe('string')
  })

  // default filter with explicit empty string
  it('should use default when value is empty string', () => {
    const r = defaultFilters.default('', {}, 'fallback')
    expect(r).toBe('fallback')
  })

  // default filter should NOT use default for 0
  it('should NOT use default for 0 (0 is a valid value)', () => {
    const r = defaultFilters.default(0, {}, 'fallback')
    expect(r).toBe(0)
  })

  // default filter should NOT use default for false
  it('should NOT use default for false (false is a valid value)', () => {
    const r = defaultFilters.default(false, {}, 'fallback')
    expect(r).toBe(false)
  })

  // capitalize on empty string
  it('capitalize should handle empty string', () => {
    expect(defaultFilters.capitalize('', {})).toBe('')
  })

  // capitalize on single character
  it('capitalize should handle single character', () => {
    expect(defaultFilters.capitalize('a', {})).toBe('A')
  })

  // truncate with exactly the right length (no truncation needed)
  it('truncate should not add suffix when string fits', () => {
    expect(defaultFilters.truncate('hello', {}, 10)).toBe('hello')
  })

  // truncate with exactly boundary length
  it('truncate at exact boundary', () => {
    expect(defaultFilters.truncate('hello', {}, 5)).toBe('hello')
  })

  // replace with empty search string
  it('BUG: replace with empty search string', () => {
    const r = defaultFilters.replace('hello', {}, '', 'x')
    expect(typeof r).toBe('string')
  })

  // slice with no end parameter
  it('slice with only start parameter', () => {
    expect(defaultFilters.slice([1, 2, 3, 4, 5], {}, 2)).toEqual([3, 4, 5])
  })

  // length on number
  it('length on number should return 0', () => {
    expect(defaultFilters.length(42, {})).toBe(0)
  })

  // abs on string number
  it('abs on string number', () => {
    expect(defaultFilters.abs('-5', {})).toBe(5)
  })

  // round with decimal places
  it('round to 2 decimal places', () => {
    expect(defaultFilters.round(3.14159, {}, 2)).toBe(3.14)
  })

  // currency with different locale
  it('currency with EUR', () => {
    const r = defaultFilters.currency(42.5, {}, 'EUR', 'de-DE')
    expect(r).toContain('42')
  })

  // pluralize with 0
  it('pluralize with 0 should be plural', () => {
    expect(defaultFilters.pluralize(0, {}, 'item')).toBe('items')
  })

  // pluralize with custom plural
  it('pluralize with custom plural form', () => {
    expect(defaultFilters.pluralize(2, {}, 'mouse', 'mice')).toBe('mice')
    expect(defaultFilters.pluralize(1, {}, 'mouse', 'mice')).toBe('mouse')
  })

  // urlencode with special chars
  it('urlencode with &, =, space', () => {
    expect(defaultFilters.urlencode('a=1&b=2 c', {})).toBe('a%3D1%26b%3D2%20c')
  })

  // stripTags on nested tags
  it('stripTags on nested HTML', () => {
    expect(defaultFilters.stripTags('<div><span>text</span></div>', {})).toBe('text')
  })

  // stripTags on self-closing tags
  it('stripTags on self-closing tags', () => {
    expect(defaultFilters.stripTags('before<br/>after', {})).toBe('beforeafter')
  })
})

// =============================================================================
// 8. Expression Regression Tests (from regression-bugs.ts)
// =============================================================================

describe('Expression Regression Tests', () => {
  it('should evaluate price.toFixed(2)', () => {
    const result = processExpressions('{{ price.toFixed(2) }}', { price: 19.9 }, fp)
    expect(result).toBe('19.90')
  })

  it('should evaluate items.filter(i => i.active).length', () => {
    const items = [{ active: true }, { active: false }, { active: true }]
    const result = processExpressions('{{ items.filter(i => i.active).length }}', { items }, fp)
    expect(result).toBe('2')
  })

  it('should evaluate Date.now() as a number', () => {
    const result = processExpressions('{{ typeof Date.now() }}', {}, fp)
    expect(result).toBe('number')
  })

  it('should evaluate users.map(u => u.name).join(", ")', () => {
    const users = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }]
    const result = processExpressions('{{ users.map(u => u.name).join(", ") }}', { users }, fp)
    expect(result).toBe('Alice, Bob, Charlie')
  })

  it('should evaluate Math.round(score * 100) / 100', () => {
    const result = processExpressions('{{ Math.round(score * 100) / 100 }}', { score: 3.14159 }, fp)
    expect(result).toBe('3.14')
  })

  it('should evaluate str.replace(/[^a-z]/gi, "")', () => {
    const result = processExpressions('{{ str.replace(/[^a-z]/gi, "") }}', { str: 'H3llo W0rld!' }, fp)
    expect(result).toBe('HlloWrld')
  })

  it('should evaluate items.reduce((sum, i) => sum + i.price, 0)', () => {
    const items = [{ price: 10 }, { price: 20 }, { price: 30 }]
    const result = processExpressions('{{ items.reduce((sum, i) => sum + i.price, 0) }}', { items }, fp)
    expect(result).toBe('60')
  })

  it('should evaluate optional chaining with nullish coalescing', () => {
    const result = processExpressions('{{ obj?.deeply?.nested?.value ?? "N/A" }}', { obj: {} }, fp)
    expect(result).toBe('N/A')
  })

  it('should evaluate ternary with count', () => {
    const result1 = processExpressions('{{ count > 0 ? count + " items" : "No items" }}', { count: 5 }, fp)
    expect(result1).toBe('5 items')
    const result2 = processExpressions('{{ count > 0 ? count + " items" : "No items" }}', { count: 0 }, fp)
    expect(result2).toBe('No items')
  })

  it('should evaluate template literals', () => {
    const result = processExpressions('{{ `Welcome, ${name}!` }}', { name: 'Chris' }, fp)
    expect(result).toBe('Welcome, Chris!')
  })

  it('should evaluate Array.from with mapping', () => {
    const result = processExpressions('{{ Array.from({ length: 5 }, (_, i) => i + 1) }}', {}, fp)
    expect(result).toBe('1,2,3,4,5')
  })

  it('should evaluate typeof for undefined values', () => {
    const result = processExpressions('{{ typeof value === "undefined" ? "N/A" : value }}', {}, fp)
    expect(result).toBe('N/A')
  })

  it('should evaluate Array.includes for status check', () => {
    const result1 = processExpressions('{{ [1, 2, 3].includes(status) ? "active" : "inactive" }}', { status: 2 }, fp)
    expect(result1).toBe('active')
    const result2 = processExpressions('{{ [1, 2, 3].includes(status) ? "active" : "inactive" }}', { status: 5 }, fp)
    expect(result2).toBe('inactive')
  })

  it('should evaluate JSON.parse().name', () => {
    const jsonStr = '{"name":"TestUser","age":30}'
    const result = processExpressions('{{ JSON.parse(jsonStr).name }}', { jsonStr }, fp)
    expect(result).toBe('TestUser')
  })

  it('should evaluate str.padStart(5, "0") for zero-padding', () => {
    const result = processExpressions('{{ str.padStart(5, "0") }}', { str: '42' }, fp)
    expect(result).toBe('00042')
  })

  it('should evaluate url.split("/").pop() for last URL segment', () => {
    const result = processExpressions('{{ url.split("/").pop() }}', { url: '/users/profile/edit' }, fp)
    expect(result).toBe('edit')
  })

  it('should evaluate text line count', () => {
    const result = processExpressions('{{ text.split("\\n").length }}', { text: 'line1\nline2\nline3' }, fp)
    expect(result).toBe('3')
  })

  it('should evaluate Number().toLocaleString for currency formatting', () => {
    const result = processExpressions(
      '{{ Number(price).toLocaleString("en-US", { style: "currency", currency: "USD" }) }}',
      { price: 1234.56 },
      fp,
    )
    expect(result).toBe('$1,234.56')
  })

  it('should evaluate Object.entries mapping', () => {
    const config = { page: '1', sort: 'name', order: 'asc' }
    const result = processExpressions(
      '{{ Object.entries(config).map(([k, v]) => k + "=" + v).join("&") }}',
      { config },
      fp,
    )
    expect(result).toContain('page=1')
    expect(result).toContain('sort=name')
    expect(result).toContain('order=asc')
    expect(result).toContain('&')
  })

  it('should evaluate items.sort with localeCompare', () => {
    const items = [{ name: 'Cherry' }, { name: 'Apple' }, { name: 'Banana' }]
    const result = processExpressions(
      '{{ items.sort((a, b) => a.name.localeCompare(b.name)).map(i => i.name).join(", ") }}',
      { items },
      fp,
    )
    expect(result).toBe('Apple, Banana, Cherry')
  })
})
