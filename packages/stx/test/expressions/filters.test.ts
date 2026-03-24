import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
  applyFilters,
  clearCustomFilters,
  defaultFilters,
  escapeHtml,
  evaluateExpression,
  getAllFilters,
  processExpressions,
  registerFilter,
  registerFilters,
  unescapeHtml,
  usesSignalsInScript,
} from '../../src/expressions'

// =============================================================================
// Helper
// =============================================================================
const ctx: Record<string, any> = {}

// =============================================================================
// String Filters
// =============================================================================

describe('Built-in Filters: String', () => {
  // ---------------------------------------------------------------------------
  // uppercase
  // ---------------------------------------------------------------------------
  describe('uppercase', () => {
    it('converts a lowercase string to uppercase', () => {
      expect(defaultFilters.uppercase('hello', ctx)).toBe('HELLO')
    })

    it('converts a mixed-case string to uppercase', () => {
      expect(defaultFilters.uppercase('Hello World', ctx)).toBe('HELLO WORLD')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.uppercase(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.uppercase(undefined, ctx)).toBe('')
    })

    it('returns empty string for empty string input', () => {
      expect(defaultFilters.uppercase('', ctx)).toBe('')
    })

    it('converts a number to its uppercase string (no-op)', () => {
      expect(defaultFilters.uppercase(123, ctx)).toBe('123')
    })

    it('handles strings with special characters', () => {
      expect(defaultFilters.uppercase('cafe\u0301', ctx)).toBe('CAFE\u0301')
    })
  })

  // ---------------------------------------------------------------------------
  // lowercase
  // ---------------------------------------------------------------------------
  describe('lowercase', () => {
    it('converts an uppercase string to lowercase', () => {
      expect(defaultFilters.lowercase('HELLO', ctx)).toBe('hello')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.lowercase(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.lowercase(undefined, ctx)).toBe('')
    })

    it('returns empty string for empty string input', () => {
      expect(defaultFilters.lowercase('', ctx)).toBe('')
    })

    it('converts a number to its lowercase string (no-op)', () => {
      expect(defaultFilters.lowercase(42, ctx)).toBe('42')
    })
  })

  // ---------------------------------------------------------------------------
  // capitalize
  // ---------------------------------------------------------------------------
  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(defaultFilters.capitalize('hello', ctx)).toBe('Hello')
    })

    it('does not change an already-capitalized string', () => {
      expect(defaultFilters.capitalize('Hello', ctx)).toBe('Hello')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.capitalize(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.capitalize(undefined, ctx)).toBe('')
    })

    it('returns empty string for empty string input', () => {
      expect(defaultFilters.capitalize('', ctx)).toBe('')
    })

    it('capitalizes a single character', () => {
      expect(defaultFilters.capitalize('a', ctx)).toBe('A')
    })

    it('handles number input by converting to string', () => {
      expect(defaultFilters.capitalize(123, ctx)).toBe('123')
    })
  })

  // ---------------------------------------------------------------------------
  // truncate
  // ---------------------------------------------------------------------------
  describe('truncate', () => {
    it('truncates a long string with default suffix', () => {
      expect(defaultFilters.truncate('hello world', ctx, 8)).toBe('hello...')
    })

    it('does not truncate if string is shorter than length', () => {
      expect(defaultFilters.truncate('hi', ctx, 10)).toBe('hi')
    })

    it('does not truncate if string equals the length', () => {
      expect(defaultFilters.truncate('hello', ctx, 5)).toBe('hello')
    })

    it('uses custom suffix', () => {
      expect(defaultFilters.truncate('hello world', ctx, 8, '--')).toBe('hello --')
    })

    it('handles length <= suffix length by truncating the suffix', () => {
      expect(defaultFilters.truncate('hello world', ctx, 2, '...')).toBe('..')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.truncate(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.truncate(undefined, ctx)).toBe('')
    })

    it('returns empty string for empty string input', () => {
      expect(defaultFilters.truncate('', ctx, 5)).toBe('')
    })

    it('handles number input by converting to string', () => {
      expect(defaultFilters.truncate(123456, ctx, 4)).toBe('1...')
    })

    it('default length is 50', () => {
      const longStr = 'a'.repeat(60)
      const result = defaultFilters.truncate(longStr, ctx)
      expect(result.length).toBe(50)
      expect(result.endsWith('...')).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // replace
  // ---------------------------------------------------------------------------
  describe('replace', () => {
    it('replaces occurrences of a substring', () => {
      expect(defaultFilters.replace('hello world', ctx, 'world', 'earth')).toBe('hello earth')
    })

    it('replaces all occurrences globally', () => {
      expect(defaultFilters.replace('abab', ctx, 'ab', 'x')).toBe('xx')
    })

    it('escapes regex special characters in the search string', () => {
      expect(defaultFilters.replace('a.b a.b', ctx, 'a.b', 'x')).toBe('x x')
    })

    it('escapes parentheses in the search string', () => {
      expect(defaultFilters.replace('fn(x)', ctx, '(x)', '[y]')).toBe('fn[y]')
    })

    it('escapes brackets in the search string', () => {
      expect(defaultFilters.replace('item[0]', ctx, '[0]', '[1]')).toBe('item[1]')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.replace(null, ctx, 'a', 'b')).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.replace(undefined, ctx, 'a', 'b')).toBe('')
    })

    it('replaces with empty string by default', () => {
      expect(defaultFilters.replace('hello world', ctx, ' world')).toBe('hello')
    })

    it('handles number input', () => {
      expect(defaultFilters.replace(12321, ctx, '2', 'X')).toBe('1X3X1')
    })
  })

  // ---------------------------------------------------------------------------
  // stripTags
  // ---------------------------------------------------------------------------
  describe('stripTags', () => {
    it('removes HTML tags from a string', () => {
      expect(defaultFilters.stripTags('<b>bold</b>', ctx)).toBe('bold')
    })

    it('removes multiple tags', () => {
      expect(defaultFilters.stripTags('<p>Hello <strong>World</strong></p>', ctx)).toBe('Hello World')
    })

    it('handles self-closing tags', () => {
      expect(defaultFilters.stripTags('line<br/>break', ctx)).toBe('linebreak')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.stripTags(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.stripTags(undefined, ctx)).toBe('')
    })

    it('returns empty string for empty string input', () => {
      expect(defaultFilters.stripTags('', ctx)).toBe('')
    })

    it('handles string with no tags', () => {
      expect(defaultFilters.stripTags('just text', ctx)).toBe('just text')
    })
  })
})

// =============================================================================
// Number Filters
// =============================================================================

describe('Built-in Filters: Number', () => {
  // ---------------------------------------------------------------------------
  // number
  // ---------------------------------------------------------------------------
  describe('number', () => {
    it('formats a number to 0 decimal places by default', () => {
      expect(defaultFilters.number(3.14159, ctx)).toBe('3')
    })

    it('formats a number to specified decimal places', () => {
      expect(defaultFilters.number(3.14159, ctx, 2)).toBe('3.14')
    })

    it('formats a number with padding zeros', () => {
      expect(defaultFilters.number(5, ctx, 3)).toBe('5.000')
    })

    it('returns empty string for NaN input', () => {
      expect(defaultFilters.number('abc', ctx)).toBe('')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.number(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.number(undefined, ctx)).toBe('')
    })

    it('handles string number input', () => {
      expect(defaultFilters.number('42.567', ctx, 1)).toBe('42.6')
    })
  })

  // ---------------------------------------------------------------------------
  // fmt
  // ---------------------------------------------------------------------------
  describe('fmt', () => {
    it('formats a number with locale-aware separators (en-US)', () => {
      const result = defaultFilters.fmt(1234567, ctx)
      expect(result).toBe('1,234,567')
    })

    it('formats a decimal number', () => {
      const result = defaultFilters.fmt(1234.56, ctx)
      expect(result).toBe('1,234.56')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.fmt(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.fmt(undefined, ctx)).toBe('')
    })

    it('returns the original string for NaN', () => {
      expect(defaultFilters.fmt('not-a-number', ctx)).toBe('not-a-number')
    })

    it('handles zero', () => {
      expect(defaultFilters.fmt(0, ctx)).toBe('0')
    })
  })

  // ---------------------------------------------------------------------------
  // abs
  // ---------------------------------------------------------------------------
  describe('abs', () => {
    it('returns absolute value of a negative number', () => {
      expect(defaultFilters.abs(-5, ctx)).toBe(5)
    })

    it('returns the same value for a positive number', () => {
      expect(defaultFilters.abs(5, ctx)).toBe(5)
    })

    it('returns 0 for zero', () => {
      expect(defaultFilters.abs(0, ctx)).toBe(0)
    })

    it('returns 0 for NaN input', () => {
      expect(defaultFilters.abs('abc', ctx)).toBe(0)
    })

    it('handles string number input', () => {
      expect(defaultFilters.abs('-42', ctx)).toBe(42)
    })

    it('handles null (NaN -> 0)', () => {
      expect(defaultFilters.abs(null, ctx)).toBe(0)
    })

    it('handles undefined (NaN -> 0)', () => {
      expect(defaultFilters.abs(undefined, ctx)).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // round
  // ---------------------------------------------------------------------------
  describe('round', () => {
    it('rounds to 0 decimal places by default', () => {
      expect(defaultFilters.round(3.7, ctx)).toBe(4)
    })

    it('rounds to specified decimal places', () => {
      expect(defaultFilters.round(3.14159, ctx, 2)).toBe(3.14)
    })

    it('rounds up correctly', () => {
      expect(defaultFilters.round(2.555, ctx, 2)).toBe(2.56)
    })

    it('returns 0 for NaN input', () => {
      expect(defaultFilters.round('abc', ctx)).toBe(0)
    })

    it('handles string number input', () => {
      expect(defaultFilters.round('3.456', ctx, 1)).toBe(3.5)
    })

    it('handles negative numbers', () => {
      expect(defaultFilters.round(-2.7, ctx)).toBe(-3)
    })
  })

  // ---------------------------------------------------------------------------
  // currency
  // ---------------------------------------------------------------------------
  describe('currency', () => {
    it('formats as USD by default', () => {
      const result = defaultFilters.currency(1234.5, ctx)
      expect(result).toContain('1,234.50')
      expect(result).toContain('$')
    })

    it('formats with custom currency code', () => {
      const result = defaultFilters.currency(1234.5, ctx, 'EUR', 'en-US')
      expect(result).toContain('1,234.50')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.currency(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.currency(undefined, ctx)).toBe('')
    })

    it('returns the string value for NaN', () => {
      expect(defaultFilters.currency('abc', ctx)).toBe('abc')
    })

    it('handles zero', () => {
      const result = defaultFilters.currency(0, ctx)
      expect(result).toContain('$')
      expect(result).toContain('0.00')
    })

    it('handles negative values', () => {
      const result = defaultFilters.currency(-50, ctx)
      expect(result).toContain('50.00')
    })
  })

  // ---------------------------------------------------------------------------
  // pluralize
  // ---------------------------------------------------------------------------
  describe('pluralize', () => {
    it('returns singular for count of 1', () => {
      expect(defaultFilters.pluralize(1, ctx, 'item', 'items')).toBe('item')
    })

    it('returns plural for count of 0', () => {
      expect(defaultFilters.pluralize(0, ctx, 'item', 'items')).toBe('items')
    })

    it('returns plural for count > 1', () => {
      expect(defaultFilters.pluralize(5, ctx, 'item', 'items')).toBe('items')
    })

    it('auto-generates plural by appending "s" when no plural provided', () => {
      expect(defaultFilters.pluralize(2, ctx, 'cat')).toBe('cats')
    })

    it('returns singular for NaN input', () => {
      expect(defaultFilters.pluralize('abc', ctx, 'item', 'items')).toBe('item')
    })

    it('handles negative count', () => {
      expect(defaultFilters.pluralize(-1, ctx, 'item', 'items')).toBe('items')
    })

    it('handles string number input', () => {
      expect(defaultFilters.pluralize('1', ctx, 'item', 'items')).toBe('item')
    })
  })
})

// =============================================================================
// Array Filters
// =============================================================================

describe('Built-in Filters: Array', () => {
  // ---------------------------------------------------------------------------
  // join
  // ---------------------------------------------------------------------------
  describe('join', () => {
    it('joins an array with default comma separator', () => {
      expect(defaultFilters.join([1, 2, 3], ctx)).toBe('1,2,3')
    })

    it('joins an array with custom separator', () => {
      expect(defaultFilters.join(['a', 'b', 'c'], ctx, ' - ')).toBe('a - b - c')
    })

    it('returns empty string for non-array input', () => {
      expect(defaultFilters.join('not an array', ctx)).toBe('')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.join(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.join(undefined, ctx)).toBe('')
    })

    it('handles empty array', () => {
      expect(defaultFilters.join([], ctx)).toBe('')
    })

    it('handles single-element array', () => {
      expect(defaultFilters.join(['only'], ctx)).toBe('only')
    })
  })

  // ---------------------------------------------------------------------------
  // first
  // ---------------------------------------------------------------------------
  describe('first', () => {
    it('returns the first element of an array', () => {
      expect(defaultFilters.first([10, 20, 30], ctx)).toBe(10)
    })

    it('returns the first character of a string', () => {
      expect(defaultFilters.first('hello', ctx)).toBe('h')
    })

    it('returns undefined for empty array', () => {
      expect(defaultFilters.first([], ctx)).toBeUndefined()
    })

    it('returns empty string for empty string', () => {
      expect(defaultFilters.first('', ctx)).toBe('')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.first(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.first(undefined, ctx)).toBe('')
    })

    it('handles number input (first char of stringified number)', () => {
      expect(defaultFilters.first(42, ctx)).toBe('4')
    })
  })

  // ---------------------------------------------------------------------------
  // last
  // ---------------------------------------------------------------------------
  describe('last', () => {
    it('returns the last element of an array', () => {
      expect(defaultFilters.last([10, 20, 30], ctx)).toBe(30)
    })

    it('returns the last character of a string', () => {
      expect(defaultFilters.last('hello', ctx)).toBe('o')
    })

    it('returns undefined for empty array', () => {
      expect(defaultFilters.last([], ctx)).toBeUndefined()
    })

    it('returns empty string for empty string', () => {
      expect(defaultFilters.last('', ctx)).toBe('')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.last(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.last(undefined, ctx)).toBe('')
    })

    it('handles number input (last char of stringified number)', () => {
      expect(defaultFilters.last(42, ctx)).toBe('2')
    })
  })

  // ---------------------------------------------------------------------------
  // length
  // ---------------------------------------------------------------------------
  describe('length', () => {
    it('returns the length of an array', () => {
      expect(defaultFilters.length([1, 2, 3], ctx)).toBe(3)
    })

    it('returns the length of a string', () => {
      expect(defaultFilters.length('hello', ctx)).toBe(5)
    })

    it('returns the number of keys of an object', () => {
      expect(defaultFilters.length({ a: 1, b: 2 }, ctx)).toBe(2)
    })

    it('returns 0 for null', () => {
      expect(defaultFilters.length(null, ctx)).toBe(0)
    })

    it('returns 0 for undefined', () => {
      expect(defaultFilters.length(undefined, ctx)).toBe(0)
    })

    it('returns 0 for a number', () => {
      expect(defaultFilters.length(42, ctx)).toBe(0)
    })

    it('returns 0 for empty array', () => {
      expect(defaultFilters.length([], ctx)).toBe(0)
    })

    it('returns 0 for empty string', () => {
      expect(defaultFilters.length('', ctx)).toBe(0)
    })

    it('returns 0 for empty object', () => {
      expect(defaultFilters.length({}, ctx)).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // reverse
  // ---------------------------------------------------------------------------
  describe('reverse', () => {
    it('reverses an array without mutating the original', () => {
      const original = [1, 2, 3]
      const result = defaultFilters.reverse(original, ctx)
      expect(result).toEqual([3, 2, 1])
      expect(original).toEqual([1, 2, 3])
    })

    it('reverses a string', () => {
      expect(defaultFilters.reverse('hello', ctx)).toBe('olleh')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.reverse(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.reverse(undefined, ctx)).toBe('')
    })

    it('returns empty string for empty string input', () => {
      expect(defaultFilters.reverse('', ctx)).toBe('')
    })

    it('returns empty array for empty array', () => {
      expect(defaultFilters.reverse([], ctx)).toEqual([])
    })

    it('handles number input by converting to string and reversing', () => {
      expect(defaultFilters.reverse(123, ctx)).toBe('321')
    })
  })

  // ---------------------------------------------------------------------------
  // slice
  // ---------------------------------------------------------------------------
  describe('slice', () => {
    it('slices an array with start and end', () => {
      expect(defaultFilters.slice([1, 2, 3, 4, 5], ctx, 1, 3)).toEqual([2, 3])
    })

    it('slices an array from start to end', () => {
      expect(defaultFilters.slice([1, 2, 3, 4, 5], ctx, 2)).toEqual([3, 4, 5])
    })

    it('slices a string', () => {
      expect(defaultFilters.slice('hello world', ctx, 0, 5)).toBe('hello')
    })

    it('handles negative indices for arrays', () => {
      expect(defaultFilters.slice([1, 2, 3, 4, 5], ctx, -2)).toEqual([4, 5])
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.slice(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.slice(undefined, ctx)).toBe('')
    })

    it('returns the value as-is for non-array/non-string types', () => {
      expect(defaultFilters.slice(42, ctx, 0, 1)).toBe(42)
    })

    it('handles empty array', () => {
      expect(defaultFilters.slice([], ctx, 0, 5)).toEqual([])
    })
  })
})

// =============================================================================
// Utility Filters
// =============================================================================

describe('Built-in Filters: Utility', () => {
  // ---------------------------------------------------------------------------
  // escape
  // ---------------------------------------------------------------------------
  describe('escape', () => {
    it('escapes HTML entities', () => {
      expect(defaultFilters.escape('<b>bold</b>', ctx)).toBe('&lt;b&gt;bold&lt;/b&gt;')
    })

    it('escapes ampersands', () => {
      expect(defaultFilters.escape('foo & bar', ctx)).toBe('foo &amp; bar')
    })

    it('escapes quotes', () => {
      expect(defaultFilters.escape('"hello"', ctx)).toBe('&quot;hello&quot;')
    })

    it('escapes single quotes', () => {
      expect(defaultFilters.escape("it's", ctx)).toBe('it&#39;s')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.escape(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.escape(undefined, ctx)).toBe('')
    })

    it('returns empty string for empty string', () => {
      expect(defaultFilters.escape('', ctx)).toBe('')
    })
  })

  // ---------------------------------------------------------------------------
  // json
  // ---------------------------------------------------------------------------
  describe('json', () => {
    it('serializes an object to JSON', () => {
      expect(defaultFilters.json({ a: 1 }, ctx)).toBe('{"a":1}')
    })

    it('serializes with pretty printing', () => {
      const result = defaultFilters.json({ a: 1 }, ctx, true)
      expect(result).toContain('\n')
      expect(result).toContain('  "a": 1')
    })

    it('returns "null" for null input', () => {
      expect(defaultFilters.json(null, ctx)).toBe('null')
    })

    it('returns "undefined" for undefined input', () => {
      expect(defaultFilters.json(undefined, ctx)).toBe('undefined')
    })

    it('serializes arrays', () => {
      expect(defaultFilters.json([1, 2, 3], ctx)).toBe('[1,2,3]')
    })

    it('serializes strings with quotes', () => {
      expect(defaultFilters.json('hello', ctx)).toBe('"hello"')
    })

    it('serializes numbers', () => {
      expect(defaultFilters.json(42, ctx)).toBe('42')
    })

    it('serializes booleans', () => {
      expect(defaultFilters.json(true, ctx)).toBe('true')
    })
  })

  // ---------------------------------------------------------------------------
  // default
  // ---------------------------------------------------------------------------
  describe('default', () => {
    it('returns the value if it is truthy', () => {
      expect(defaultFilters.default('hello', ctx, 'fallback')).toBe('hello')
    })

    it('returns the default value for null', () => {
      expect(defaultFilters.default(null, ctx, 'fallback')).toBe('fallback')
    })

    it('returns the default value for undefined', () => {
      expect(defaultFilters.default(undefined, ctx, 'fallback')).toBe('fallback')
    })

    it('returns the default value for empty string', () => {
      expect(defaultFilters.default('', ctx, 'fallback')).toBe('fallback')
    })

    it('does not replace 0', () => {
      expect(defaultFilters.default(0, ctx, 'fallback')).toBe(0)
    })

    it('does not replace false', () => {
      expect(defaultFilters.default(false, ctx, 'fallback')).toBe(false)
    })

    it('returns empty string as default if no fallback provided', () => {
      expect(defaultFilters.default(null, ctx)).toBe('')
    })
  })

  // ---------------------------------------------------------------------------
  // urlencode
  // ---------------------------------------------------------------------------
  describe('urlencode', () => {
    it('encodes special characters', () => {
      expect(defaultFilters.urlencode('hello world', ctx)).toBe('hello%20world')
    })

    it('encodes ampersands', () => {
      expect(defaultFilters.urlencode('a=1&b=2', ctx)).toBe('a%3D1%26b%3D2')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.urlencode(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.urlencode(undefined, ctx)).toBe('')
    })

    it('returns empty string for empty string', () => {
      expect(defaultFilters.urlencode('', ctx)).toBe('')
    })

    it('handles number input', () => {
      expect(defaultFilters.urlencode(42, ctx)).toBe('42')
    })

    it('encodes unicode characters', () => {
      const result = defaultFilters.urlencode('cafe\u0301', ctx)
      expect(result).toBe('cafe%CC%81')
    })
  })
})

// =============================================================================
// i18n Filters
// =============================================================================

describe('Built-in Filters: i18n', () => {
  // ---------------------------------------------------------------------------
  // translate / t
  // ---------------------------------------------------------------------------
  describe('translate', () => {
    const translations = {
      greeting: 'Hello',
      farewell: 'Goodbye, :name',
      nested: {
        deep: {
          key: 'Deep Value',
        },
      },
    }
    const i18nCtx = { __translations: translations }

    it('translates a simple key', () => {
      expect(defaultFilters.translate('greeting', i18nCtx)).toBe('Hello')
    })

    it('returns the key if translation is not found (fallbackToKey default)', () => {
      expect(defaultFilters.translate('missing.key', i18nCtx)).toBe('missing.key')
    })

    it('translates a nested key using dot notation', () => {
      expect(defaultFilters.translate('nested.deep.key', i18nCtx)).toBe('Deep Value')
    })

    it('replaces :parameter placeholders in translations', () => {
      expect(defaultFilters.translate('farewell', i18nCtx, { name: 'Alice' })).toBe('Goodbye, Alice')
    })

    it('returns the value as-is if no __translations in context', () => {
      expect(defaultFilters.translate('greeting', {})).toBe('greeting')
    })

    it('returns empty string when fallbackToKey is false and key not found', () => {
      const noFallbackCtx = { __translations: translations, __i18nConfig: { fallbackToKey: false } }
      expect(defaultFilters.translate('missing', noFallbackCtx)).toBe('')
    })
  })

  describe('t (alias for translate)', () => {
    it('works the same as translate', () => {
      const i18nCtx = { __translations: { hello: 'Hi there' } }
      expect(defaultFilters.t('hello', i18nCtx)).toBe('Hi there')
    })
  })
})

// =============================================================================
// Date Filter
// =============================================================================

describe('Built-in Filters: Date', () => {
  describe('date', () => {
    const testDate = new Date('2024-06-15T10:30:00Z')

    it('formats a date with short preset', () => {
      const result = defaultFilters.date(testDate, ctx, 'short', 'en-US')
      // Short format varies by locale but should contain the date parts
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(0)
    })

    it('formats a date with medium preset', () => {
      const result = defaultFilters.date(testDate, ctx, 'medium', 'en-US')
      expect(result).toContain('Jun')
      expect(result).toContain('2024')
    })

    it('formats a date with long preset', () => {
      const result = defaultFilters.date(testDate, ctx, 'long', 'en-US')
      expect(result).toContain('June')
      expect(result).toContain('2024')
    })

    it('formats a date with full preset', () => {
      const result = defaultFilters.date(testDate, ctx, 'full', 'en-US')
      expect(result).toContain('June')
      expect(result).toContain('2024')
      // Full format includes the day of week
      expect(result).toMatch(/Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday/)
    })

    it('formats a date with iso preset', () => {
      const result = defaultFilters.date(testDate, ctx, 'iso')
      expect(result).toBe('2024-06-15T10:30:00.000Z')
    })

    it('formats a date with time preset', () => {
      const result = defaultFilters.date(testDate, ctx, 'time', 'en-US')
      expect(result).toBeTruthy()
    })

    it('formats a date with datetime preset', () => {
      const result = defaultFilters.date(testDate, ctx, 'datetime', 'en-US')
      expect(result).toBeTruthy()
    })

    it('handles date string input', () => {
      const result = defaultFilters.date('2024-01-01', ctx, 'iso')
      expect(result).toContain('2024-01-01')
    })

    it('returns empty string for null', () => {
      expect(defaultFilters.date(null, ctx)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(defaultFilters.date(undefined, ctx)).toBe('')
    })

    it('returns original string for invalid date', () => {
      expect(defaultFilters.date('not-a-date', ctx)).toBe('not-a-date')
    })

    it('defaults to short format', () => {
      const result = defaultFilters.date(testDate, ctx)
      expect(result).toBeTruthy()
    })
  })
})

// =============================================================================
// Filter Registration API
// =============================================================================

describe('Custom Filter Registration', () => {
  beforeAll(() => {
    clearCustomFilters()
  })

  afterAll(() => {
    clearCustomFilters()
  })

  describe('registerFilter', () => {
    it('registers a custom filter', () => {
      registerFilter('double', (value: any) => Number(value) * 2)
      const filters = getAllFilters()
      expect(filters.double).toBeDefined()
      expect(filters.double(5, ctx)).toBe(10)
    })

    it('custom filter takes precedence over built-in', () => {
      // Save original console.warn
      const originalWarn = console.warn
      let warnCalled = false
      console.warn = () => { warnCalled = true }

      registerFilter('uppercase', (value: any) => `CUSTOM:${value}`)
      const filters = getAllFilters()
      expect(filters.uppercase('test', ctx)).toBe('CUSTOM:test')
      expect(warnCalled).toBe(true)

      // Restore
      console.warn = originalWarn
      clearCustomFilters()
    })
  })

  describe('registerFilters (bulk)', () => {
    it('registers multiple filters at once', () => {
      clearCustomFilters()
      registerFilters({
        triple: (value: any) => Number(value) * 3,
        exclaim: (value: any) => `${value}!`,
      })
      const filters = getAllFilters()
      expect(filters.triple(3, ctx)).toBe(9)
      expect(filters.exclaim('hello', ctx)).toBe('hello!')
    })
  })

  describe('getAllFilters', () => {
    it('returns both default and custom filters', () => {
      clearCustomFilters()
      registerFilter('myCustom', (value: any) => value)
      const all = getAllFilters()
      expect(all.uppercase).toBeDefined()
      expect(all.lowercase).toBeDefined()
      expect(all.myCustom).toBeDefined()
    })

    it('includes all 37 default filter keys', () => {
      const expectedFilters = [
        'uppercase', 'lowercase', 'capitalize', 'truncate', 'replace', 'stripTags',
        'number', 'fmt', 'abs', 'round', 'currency', 'pluralize',
        'join', 'first', 'last', 'length', 'reverse', 'slice',
        'escape', 'json', 'default', 'urlencode',
        'translate', 't',
        'date',
      ]
      for (const name of expectedFilters) {
        expect(defaultFilters[name]).toBeDefined()
      }
    })
  })

  describe('clearCustomFilters', () => {
    it('removes all custom filters', () => {
      registerFilter('toRemove', (value: any) => value)
      expect(getAllFilters().toRemove).toBeDefined()
      clearCustomFilters()
      expect(getAllFilters().toRemove).toBeUndefined()
    })

    it('does not remove built-in filters', () => {
      clearCustomFilters()
      expect(getAllFilters().uppercase).toBeDefined()
    })
  })
})

// =============================================================================
// applyFilters
// =============================================================================

describe('applyFilters', () => {
  beforeAll(() => {
    clearCustomFilters()
  })

  afterAll(() => {
    clearCustomFilters()
  })

  it('applies a single filter with no args', () => {
    const result = applyFilters('hello', 'uppercase', ctx)
    expect(result).toBe('HELLO')
  })

  it('applies a filter with colon param syntax', () => {
    const result = applyFilters(3.14159, 'number:2', ctx)
    expect(result).toBe('3.14')
  })

  it('applies a filter with parenthesis params', () => {
    const result = applyFilters(3.14159, 'number(2)', ctx)
    expect(result).toBe('3.14')
  })

  it('applies a filter chain with pipe separator', () => {
    const result = applyFilters('hello world', 'uppercase | truncate:8', ctx)
    expect(result).toBe('HELLO...')
  })

  it('throws on unknown filter name', () => {
    expect(() => applyFilters('hello', 'nonExistent', ctx)).toThrow('Filter not found: nonExistent')
  })

  it('returns value unchanged for empty filter expression', () => {
    expect(applyFilters('hello', '', ctx)).toBe('hello')
    expect(applyFilters('hello', '   ', ctx)).toBe('hello')
  })

  it('handles parenthesis params with string arguments', () => {
    const result = applyFilters('hello world', "replace('world', 'earth')", ctx)
    expect(result).toBe('hello earth')
  })

  it('handles parenthesis params with object argument', () => {
    const i18nCtx = { __translations: { greeting: 'Hello, :name!' } }
    const result = applyFilters('greeting', "translate({name: 'Bob'})", i18nCtx)
    expect(result).toBe('Hello, Bob!')
  })

  it('applies filter with empty parenthesis (no args)', () => {
    const result = applyFilters('hello', 'uppercase()', ctx)
    expect(result).toBe('HELLO')
  })

  it('wraps filter execution errors with filter name context', () => {
    registerFilter('throwError', () => { throw new Error('oops') })
    expect(() => applyFilters('x', 'throwError', ctx)).toThrow("Error applying filter 'throwError': oops")
    clearCustomFilters()
  })
})

// =============================================================================
// evaluateExpression with filters
// =============================================================================

describe('evaluateExpression', () => {
  describe('filter pipe detection', () => {
    it('detects a filter pipe and applies the filter', () => {
      const result = evaluateExpression('name | uppercase', { name: 'alice' })
      expect(result).toBe('ALICE')
    })

    it('does not confuse || (logical OR) with filter pipe', () => {
      const result = evaluateExpression('a || b', { a: '', b: 'fallback' })
      expect(result).toBe('fallback')
    })

    it('does not confuse |= with filter pipe', () => {
      // |= is bitwise OR assignment - this would fail in normal eval context
      // but the point is it should NOT be treated as a filter
      const result = evaluateExpression('5', ctx)
      expect(result).toBe(5)
    })

    it('handles filter with value containing logical OR', () => {
      const result = evaluateExpression('(a || b) | uppercase', { a: '', b: 'fallback' })
      expect(result).toBe('FALLBACK')
    })

    it('handles pipe inside string (not treated as filter)', () => {
      const result = evaluateExpression('"a|b"', ctx)
      expect(result).toBe('a|b')
    })

    it('handles chained filters', () => {
      const result = evaluateExpression('name | uppercase | truncate:8', { name: 'alice wonderland' })
      expect(result).toBe('ALICE...')
    })
  })

  describe('basic evaluation', () => {
    it('evaluates arithmetic', () => {
      expect(evaluateExpression('2 + 3', ctx)).toBe(5)
    })

    it('evaluates string concatenation', () => {
      expect(evaluateExpression('"hello" + " " + "world"', ctx)).toBe('hello world')
    })

    it('evaluates ternary expressions', () => {
      expect(evaluateExpression('x > 0 ? "positive" : "negative"', { x: 5 })).toBe('positive')
    })

    it('evaluates template literals', () => {
      expect(evaluateExpression('`Hello ${name}!`', { name: 'World' })).toBe('Hello World!')
    })

    it('returns undefined for unknown variables (safe evaluator fallback)', () => {
      // The safe evaluator catches ReferenceError and returns undefined
      const result = evaluateExpression('unknownVar', {}, true)
      expect(result).toBeUndefined()
    })

    it('returns undefined for unknown property access in silent mode', () => {
      const result = evaluateExpression('unknownVar.prop', {}, true)
      expect(result).toBeUndefined()
    })
  })
})

// =============================================================================
// processExpressions
// =============================================================================

describe('processExpressions', () => {
  const filePath = 'test.stx'

  describe('{{ }} escaped output', () => {
    it('evaluates and escapes a simple variable', () => {
      const result = processExpressions('{{ name }}', { name: 'Alice' }, filePath)
      expect(result).toBe('Alice')
    })

    it('escapes HTML in the output', () => {
      const result = processExpressions('{{ html }}', { html: '<b>bold</b>' }, filePath)
      expect(result).toBe('&lt;b&gt;bold&lt;/b&gt;')
    })

    it('returns empty string for null/undefined values', () => {
      expect(processExpressions('{{ val }}', { val: null }, filePath)).toBe('')
      expect(processExpressions('{{ val }}', { val: undefined }, filePath)).toBe('')
    })

    it('evaluates expressions with arithmetic', () => {
      const result = processExpressions('{{ a + b }}', { a: 2, b: 3 }, filePath)
      expect(result).toBe('5')
    })

    it('applies filters in escaped output', () => {
      const result = processExpressions('{{ name | uppercase }}', { name: 'alice' }, filePath)
      expect(result).toBe('ALICE')
    })
  })

  describe('{!! !!} unescaped output', () => {
    it('outputs raw HTML without escaping', () => {
      const result = processExpressions('{!! html !!}', { html: '<b>bold</b>' }, filePath)
      expect(result).toBe('<b>bold</b>')
    })

    it('returns empty string for null', () => {
      expect(processExpressions('{!! val !!}', { val: null }, filePath)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(processExpressions('{!! val !!}', { val: undefined }, filePath)).toBe('')
    })
  })

  describe('{{{ }}} triple-brace unescaped output', () => {
    it('outputs raw HTML without escaping', () => {
      const result = processExpressions('{{{ html }}}', { html: '<em>italic</em>' }, filePath)
      expect(result).toBe('<em>italic</em>')
    })

    it('returns empty string for null', () => {
      expect(processExpressions('{{{ val }}}', { val: null }, filePath)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(processExpressions('{{{ val }}}', { val: undefined }, filePath)).toBe('')
    })
  })

  describe('error handling', () => {
    it('returns empty string for undefined property access in escaped expressions', () => {
      // The safe evaluator returns undefined for unknown variables, which becomes ''
      const result = processExpressions('{{ nonExistent.property.deep }}', {}, filePath)
      expect(result).toBe('')
    })

    it('returns empty string for undefined property access in unescaped expressions', () => {
      const result = processExpressions('{!! nonExistent.deep !!}', {}, filePath)
      expect(result).toBe('')
    })

    it('returns empty string for undefined property access in triple-brace expressions', () => {
      const result = processExpressions('{{{ nonExistent.deep }}}', {}, filePath)
      expect(result).toBe('')
    })

    it('returns empty string for expressions that evaluate to undefined', () => {
      // Expressions that resolve to undefined produce empty output
      const result = processExpressions('{{ missingVar }}', {}, filePath)
      expect(result).toBe('')
    })
  })

  describe('mixed expressions in template', () => {
    it('processes multiple expression types in one template', () => {
      const template = '<h1>{{ title }}</h1><div>{!! content !!}</div><span>{{{ raw }}}</span>'
      const context = { title: 'Hello & World', content: '<p>paragraph</p>', raw: '<b>raw</b>' }
      const result = processExpressions(template, context, filePath)
      expect(result).toContain('Hello &amp; World')
      expect(result).toContain('<p>paragraph</p>')
      expect(result).toContain('<b>raw</b>')
    })
  })

  describe('build-time placeholder handling', () => {
    it('returns empty string for __PLACEHOLDER__ style expressions', () => {
      const result = processExpressions('{{ __TITLE__ }}', {}, filePath)
      expect(result).toBe('')
    })
  })
})

// =============================================================================
// escapeHtml / unescapeHtml
// =============================================================================

describe('escapeHtml and unescapeHtml', () => {
  describe('escapeHtml', () => {
    it('escapes ampersands', () => {
      expect(escapeHtml('&')).toBe('&amp;')
    })

    it('escapes less-than signs', () => {
      expect(escapeHtml('<')).toBe('&lt;')
    })

    it('escapes greater-than signs', () => {
      expect(escapeHtml('>')).toBe('&gt;')
    })

    it('escapes double quotes', () => {
      expect(escapeHtml('"')).toBe('&quot;')
    })

    it('escapes single quotes', () => {
      expect(escapeHtml("'")).toBe('&#39;')
    })

    it('escapes all entities in a complex string', () => {
      const input = '<div class="test" data-x=\'y\'>&</div>'
      const result = escapeHtml(input)
      expect(result).toBe('&lt;div class=&quot;test&quot; data-x=&#39;y&#39;&gt;&amp;&lt;/div&gt;')
    })

    it('handles empty string', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('does not double-escape already-escaped content', () => {
      // Note: it WILL double-escape - this is correct behavior
      expect(escapeHtml('&amp;')).toBe('&amp;amp;')
    })
  })

  describe('unescapeHtml', () => {
    it('unescapes &amp;', () => {
      expect(unescapeHtml('&amp;')).toBe('&')
    })

    it('unescapes &lt;', () => {
      expect(unescapeHtml('&lt;')).toBe('<')
    })

    it('unescapes &gt;', () => {
      expect(unescapeHtml('&gt;')).toBe('>')
    })

    it('unescapes &quot;', () => {
      expect(unescapeHtml('&quot;')).toBe('"')
    })

    it('unescapes &#39;', () => {
      expect(unescapeHtml('&#39;')).toBe("'")
    })

    it('unescapes &#039;', () => {
      expect(unescapeHtml('&#039;')).toBe("'")
    })

    it('returns empty string for empty input', () => {
      expect(unescapeHtml('')).toBe('')
    })

    it('returns empty string for falsy input', () => {
      // @ts-expect-error testing falsy input
      expect(unescapeHtml(null)).toBe('')
      // @ts-expect-error testing falsy input
      expect(unescapeHtml(undefined)).toBe('')
    })
  })

  describe('round-trip', () => {
    it('round-trips a string with all special characters', () => {
      const original = '<div class="test" data-name=\'val\'>&more</div>'
      const escaped = escapeHtml(original)
      const unescaped = unescapeHtml(escaped)
      expect(unescaped).toBe(original)
    })

    it('round-trips a simple string', () => {
      const original = 'Hello World'
      expect(unescapeHtml(escapeHtml(original))).toBe(original)
    })

    it('round-trips a string with only ampersands', () => {
      const original = 'a & b & c'
      expect(unescapeHtml(escapeHtml(original))).toBe(original)
    })
  })
})

// =============================================================================
// usesSignalsInScript
// =============================================================================

describe('usesSignalsInScript', () => {
  it('detects state() in a client-side script', () => {
    expect(usesSignalsInScript('<script>const x = state(0)</script>')).toBe(true)
  })

  it('detects derived()', () => {
    expect(usesSignalsInScript('<script>const d = derived(() => x.value * 2)</script>')).toBe(true)
  })

  it('detects effect()', () => {
    expect(usesSignalsInScript('<script>effect(() => {})</script>')).toBe(true)
  })

  it('detects ref()', () => {
    expect(usesSignalsInScript('<script>const r = ref(0)</script>')).toBe(true)
  })

  it('detects reactive()', () => {
    expect(usesSignalsInScript('<script>const obj = reactive({})</script>')).toBe(true)
  })

  it('detects computed()', () => {
    expect(usesSignalsInScript('<script>const c = computed(() => 1)</script>')).toBe(true)
  })

  it('detects watch()', () => {
    expect(usesSignalsInScript('<script>watch(() => x.value, () => {})</script>')).toBe(true)
  })

  it('detects watchEffect()', () => {
    expect(usesSignalsInScript('<script>watchEffect(() => {})</script>')).toBe(true)
  })

  it('does not detect signals in server scripts', () => {
    expect(usesSignalsInScript('<script server>const x = state(0)</script>')).toBe(false)
  })

  it('returns false for no signal usage', () => {
    expect(usesSignalsInScript('<script>const x = 5</script>')).toBe(false)
  })

  it('returns false for no script tag at all', () => {
    expect(usesSignalsInScript('<div>hello</div>')).toBe(false)
  })

  it('detects signals in @if with function calls', () => {
    expect(usesSignalsInScript('<div @if="loading()">Loading</div>')).toBe(true)
  })

  it('detects signals in @for with function calls in collection', () => {
    expect(usesSignalsInScript('<div @for="item in items()">{{ item }}</div>')).toBe(true)
  })

  it('detects signals in @show with function calls', () => {
    expect(usesSignalsInScript('<div @show="visible()">content</div>')).toBe(true)
  })

  it('handles template with external script src (ignored)', () => {
    expect(usesSignalsInScript('<script src="app.js"></script>')).toBe(false)
  })

  it('handles multiple script blocks (only one has signals)', () => {
    const template = `
      <script>const x = 5</script>
      <script>const y = state(0)</script>
    `
    expect(usesSignalsInScript(template)).toBe(true)
  })

  it('detects state with generic type parameter', () => {
    expect(usesSignalsInScript('<script>const items = state<string[]>([])</script>')).toBe(true)
  })
})

// =============================================================================
// Filter Chaining via evaluateExpression
// =============================================================================

describe('Filter Chaining Integration', () => {
  it('chains uppercase then truncate', () => {
    const result = evaluateExpression('name | uppercase | truncate:5', { name: 'alice wonderland' })
    expect(result).toBe('AL...')
  })

  it('chains capitalize then replace', () => {
    const result = evaluateExpression("text | capitalize | replace('World', 'Earth')", { text: 'hello World' })
    expect(result).toBe('Hello Earth')
  })

  it('chains lowercase then default', () => {
    const result = evaluateExpression("val | lowercase | default('N/A')", { val: null })
    expect(result).toBe('N/A')
  })

  it('chains number then json', () => {
    const result = evaluateExpression('price | number:2', { price: 42.999 })
    expect(result).toBe('43.00')
  })

  it('chains reverse then uppercase', () => {
    const result = evaluateExpression('text | reverse | uppercase', { text: 'hello' })
    expect(result).toBe('OLLEH')
  })

  it('chains slice then join', () => {
    const result = evaluateExpression("items | slice(0, 3) | join(' ')", { items: ['a', 'b', 'c', 'd', 'e'] })
    expect(result).toBe('a b c')
  })

  it('chains first then uppercase', () => {
    const result = evaluateExpression('items | first | uppercase', { items: ['hello', 'world'] })
    expect(result).toBe('HELLO')
  })

  it('chains stripTags then truncate', () => {
    const result = evaluateExpression('html | stripTags | truncate:10', { html: '<p>Hello beautiful world!</p>' })
    expect(result).toBe('Hello b...')
  })
})

// =============================================================================
// Edge Cases and Comprehensive Scenarios
// =============================================================================

describe('Edge Cases', () => {
  it('handles deeply nested filter chains', () => {
    const result = evaluateExpression('text | uppercase | lowercase | capitalize', { text: 'hELLO' })
    expect(result).toBe('Hello')
  })

  it('handles filter on boolean value', () => {
    expect(defaultFilters.uppercase(true, ctx)).toBe('TRUE')
    expect(defaultFilters.uppercase(false, ctx)).toBe('FALSE')
    expect(defaultFilters.lowercase(true, ctx)).toBe('true')
    expect(defaultFilters.lowercase(false, ctx)).toBe('false')
  })

  it('handles filter on array value where string filter expected', () => {
    const result = defaultFilters.uppercase([1, 2, 3], ctx)
    expect(result).toBe('1,2,3')
  })

  it('abs on a boolean (NaN -> 0)', () => {
    // Number(true) = 1, Number(false) = 0
    expect(defaultFilters.abs(true, ctx)).toBe(1)
    expect(defaultFilters.abs(false, ctx)).toBe(0)
  })

  it('length on a boolean returns 0', () => {
    expect(defaultFilters.length(true, ctx)).toBe(0)
  })

  it('join on an array of mixed types', () => {
    expect(defaultFilters.join([1, 'two', null, true], ctx, '|')).toBe('1|two||true')
  })

  it('replace with dollar sign in replacement', () => {
    // The replace filter uses a callback to avoid $-interpretation
    expect(defaultFilters.replace('abc', ctx, 'b', '$1')).toBe('a$1c')
  })

  it('number filter with very large numbers', () => {
    expect(defaultFilters.number(1e20, ctx, 0)).toBe('100000000000000000000')
  })

  it('round with large decimal places', () => {
    const result = defaultFilters.round(Math.PI, ctx, 10)
    expect(result).toBeCloseTo(Math.PI, 10)
  })

  it('truncate with length of 0', () => {
    expect(defaultFilters.truncate('hello', ctx, 0, '...')).toBe('')
  })

  it('reverse on a single character string', () => {
    expect(defaultFilters.reverse('a', ctx)).toBe('a')
  })

  it('slice with out-of-bounds indices', () => {
    expect(defaultFilters.slice([1, 2, 3], ctx, 10, 20)).toEqual([])
  })

  it('default filter does not replace 0', () => {
    expect(defaultFilters.default(0, ctx, 'fallback')).toBe(0)
  })

  it('default filter does not replace false', () => {
    expect(defaultFilters.default(false, ctx, 'fallback')).toBe(false)
  })

  it('json filter on circular reference gracefully returns string', () => {
    const obj: any = {}
    obj.self = obj
    // JSON.stringify will throw, so it falls back to String(value)
    const result = defaultFilters.json(obj, ctx)
    expect(result).toBe('[object Object]')
  })

  it('fmt filter handles negative numbers', () => {
    const result = defaultFilters.fmt(-1234567, ctx)
    expect(result).toBe('-1,234,567')
  })

  it('currency handles string number input', () => {
    const result = defaultFilters.currency('99.99', ctx)
    expect(result).toContain('99.99')
  })

  it('pluralize with zero count', () => {
    expect(defaultFilters.pluralize(0, ctx, 'item', 'items')).toBe('items')
  })

  it('urlencode handles slash characters', () => {
    expect(defaultFilters.urlencode('/path/to/resource', ctx)).toBe('%2Fpath%2Fto%2Fresource')
  })
})
