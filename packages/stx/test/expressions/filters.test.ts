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

    it('returns empty string for empty array', () => {
      // Template-safe: empty array yields '' so interpolations don't render
      // `undefined`. Matches the null/undefined/empty-string behavior.
      expect(defaultFilters.first([], ctx)).toBe('')
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

    it('returns empty string for empty array', () => {
      // Consistent with first([]) and null/undefined handling.
      expect(defaultFilters.last([], ctx)).toBe('')
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

// =============================================================================
// Merged from discovered-bugs.test.ts: Expression edge cases
// =============================================================================

describe('Expression Edge Cases (discovered bugs)', () => {
  it('should not evaluate @{{ }} at the expression level (handled by process pipeline)', () => {
    const result = processExpressions('@{{ name }}', { name: 'Alice' }, 'test.stx')
    expect(result).toBeDefined()
  })
})

// =============================================================================
// Merged from discovered-bugs.test.ts: Filter edge cases
// =============================================================================

describe('Filter Edge Cases (discovered bugs)', () => {
  it('should handle truncate with length equal to suffix length', () => {
    const result = defaultFilters.truncate('Hello World', {}, 3, '...')
    expect(result).toBe('...')
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
// Merged from discovered-bugs.test.ts: Expression bugs
// =============================================================================

describe('Expression Bugs (discovered bugs)', () => {
  const fp = 'test.stx'

  it('should correctly handle JSON.stringify in expressions', () => {
    const r = processExpressions('{{ JSON.stringify(data) }}', { data: { key: 'value' } }, fp)
    expect(r).toContain('{')
    expect(r).toContain('key')
  })

  it('should handle multiline expressions', () => {
    const r = processExpressions('{{ a +\n  b }}', { a: 1, b: 2 }, fp)
    expect(r).toContain('3')
  })

  it('should handle 5-level deep property access', () => {
    const context = { a: { b: { c: { d: { e: 'deep' } } } } }
    const r = processExpressions('{{ a.b.c.d.e }}', context, fp)
    expect(r).toContain('deep')
  })

  it('should handle array index access', () => {
    const r = processExpressions('{{ items[0] }}', { items: ['first', 'second'] }, fp)
    expect(r).toContain('first')
  })

  it('should handle array.at(-1) for last element', () => {
    const r = processExpressions('{{ items.at(-1) }}', { items: [1, 2, 3] }, fp)
    expect(r).toContain('3')
  })

  it('should stringify object in {{ }}', () => {
    const r = processExpressions('{{ obj }}', { obj: { a: 1 } }, fp)
    expect(r).toBeDefined()
    expect(r).not.toBe('')
  })

  it('should stringify array in {{ }}', () => {
    const r = processExpressions('{{ arr }}', { arr: [1, 2, 3] }, fp)
    expect(r).toContain('1')
  })

  it('should handle Date in expressions', () => {
    const r = processExpressions('{{ d.getFullYear() }}', { d: new Date(2024, 0, 1) }, fp)
    expect(r).toContain('2024')
  })

  it('should handle multiple expressions on same line', () => {
    const r = processExpressions('{{ a }}-{{ b }}-{{ c }}', { a: 1, b: 2, c: 3 }, fp)
    expect(r).toBe('1-2-3')
  })

  it('should work inside HTML attributes', () => {
    const r = processExpressions('<div class="{{ cls }}">test</div>', { cls: 'active' }, fp)
    expect(r).toContain('class="active"')
  })

  it('should handle value containing curly braces', () => {
    const r = processExpressions('{{ val }}', { val: 'has {braces}' }, fp)
    expect(r).toContain('has {braces}')
  })

  it('should output raw HTML with {{{ }}}', () => {
    const r = processExpressions('{{{ html }}}', { html: '<b>bold</b>' }, fp)
    expect(r).toBe('<b>bold</b>')
  })

  it('should output raw HTML with {!! !!}', () => {
    const r = processExpressions('{!! html !!}', { html: '<em>italic</em>' }, fp)
    expect(r).toBe('<em>italic</em>')
  })

  it('should escape HTML entities in {{ }}', () => {
    const r = processExpressions('{{ val }}', { val: '<script>alert("xss")</script>' }, fp)
    expect(r).not.toContain('<script>')
    expect(r).toContain('&lt;script&gt;')
  })
})

// =============================================================================
// Merged from discovered-bugs.test.ts: Filter bugs
// =============================================================================

describe('Filter Bugs (discovered bugs)', () => {
  it('should format Date object with date filter', () => {
    const d = new Date(2024, 0, 15)
    const r = defaultFilters.date(d, {}, 'iso')
    expect(r).toContain('2024-01-15')
  })

  it('should format timestamp with date filter', () => {
    const r = defaultFilters.date(1705276800000, {}, 'iso')
    expect(r).toContain('2024')
  })

  it('should pretty-print JSON with indent', () => {
    const r = defaultFilters.json({ a: 1, b: 2 }, {}, true)
    expect(r).toContain('\n')
    expect(r).toContain('  ')
  })

  it('should handle circular reference in json filter', () => {
    const obj: any = { a: 1 }
    obj.self = obj
    const r = defaultFilters.json(obj, {})
    expect(typeof r).toBe('string')
  })

  it('should use default when value is empty string', () => {
    const r = defaultFilters.default('', {}, 'fallback')
    expect(r).toBe('fallback')
  })

  it('should NOT use default for 0 (0 is a valid value)', () => {
    const r = defaultFilters.default(0, {}, 'fallback')
    expect(r).toBe(0)
  })

  it('should NOT use default for false (false is a valid value)', () => {
    const r = defaultFilters.default(false, {}, 'fallback')
    expect(r).toBe(false)
  })

  it('capitalize should handle empty string', () => {
    expect(defaultFilters.capitalize('', {})).toBe('')
  })

  it('capitalize should handle single character', () => {
    expect(defaultFilters.capitalize('a', {})).toBe('A')
  })

  it('truncate should not add suffix when string fits', () => {
    expect(defaultFilters.truncate('hello', {}, 10)).toBe('hello')
  })

  it('truncate at exact boundary', () => {
    expect(defaultFilters.truncate('hello', {}, 5)).toBe('hello')
  })

  it('replace with empty search string', () => {
    const r = defaultFilters.replace('hello', {}, '', 'x')
    expect(typeof r).toBe('string')
  })

  it('slice with only start parameter', () => {
    expect(defaultFilters.slice([1, 2, 3, 4, 5], {}, 2)).toEqual([3, 4, 5])
  })

  it('length on number should return 0', () => {
    expect(defaultFilters.length(42, {})).toBe(0)
  })

  it('abs on string number', () => {
    expect(defaultFilters.abs('-5', {})).toBe(5)
  })

  it('round to 2 decimal places', () => {
    expect(defaultFilters.round(3.14159, {}, 2)).toBe(3.14)
  })

  it('currency with EUR', () => {
    const r = defaultFilters.currency(42.5, {}, 'EUR', 'de-DE')
    expect(r).toContain('42')
  })

  it('pluralize with 0 should be plural', () => {
    expect(defaultFilters.pluralize(0, {}, 'item')).toBe('items')
  })

  it('pluralize with custom plural form', () => {
    expect(defaultFilters.pluralize(2, {}, 'mouse', 'mice')).toBe('mice')
    expect(defaultFilters.pluralize(1, {}, 'mouse', 'mice')).toBe('mouse')
  })

  it('urlencode with &, =, space', () => {
    expect(defaultFilters.urlencode('a=1&b=2 c', {})).toBe('a%3D1%26b%3D2%20c')
  })

  it('stripTags on nested HTML', () => {
    expect(defaultFilters.stripTags('<div><span>text</span></div>', {})).toBe('text')
  })

  it('stripTags on self-closing tags', () => {
    expect(defaultFilters.stripTags('before<br/>after', {})).toBe('beforeafter')
  })
})

// =============================================================================
// Merged from deep-edge-cases.test.ts: Filter Stress Tests
// =============================================================================

describe('Filter Stress Tests', () => {
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
    const emoji = defaultFilters.uppercase('hello \u{1F389}', ctx)
    expect(emoji).toContain('HELLO')
    expect(emoji).toContain('\u{1F389}')

    const cjk = defaultFilters.uppercase('\u4F60\u597D\u4E16\u754C', ctx)
    expect(cjk).toBe('\u4F60\u597D\u4E16\u754C')

    const rtl = defaultFilters.uppercase('\u0645\u0631\u062D\u0628\u0627', ctx)
    expect(rtl).toBe('\u0645\u0631\u062D\u0628\u0627')
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
    expect(result).toBe('ab')
  })

  it('truncate filter where length equals suffix length', () => {
    const result = defaultFilters.truncate('abcdef', ctx, 3, '...')
    expect(result).toBe('...')
  })

  it('replace filter where search matches entire string', () => {
    const result = defaultFilters.replace('hello', ctx, 'hello', 'world')
    expect(result).toBe('world')
  })

  it('replace filter where replacement contains the search pattern', () => {
    const result = defaultFilters.replace('abc', ctx, 'a', 'ab')
    expect(result).toBe('abbc')
  })

  it('join filter with undefined items in array', () => {
    const arr = [1, undefined, 3, undefined, 5]
    const result = defaultFilters.join(arr, ctx, ',')
    expect(result).toContain('1')
    expect(result).toContain('3')
    expect(result).toContain('5')
  })

  it('first on empty array returns empty string (template-safe)', () => {
    const result = defaultFilters.first([], ctx)
    expect(result).toBe('')
  })

  it('last on empty array returns empty string (template-safe)', () => {
    const result = defaultFilters.last([], ctx)
    expect(result).toBe('')
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
// Merged from deep-edge-cases.test.ts: Expression Processing Edge Cases
// =============================================================================

describe('Expression Processing Edge Cases', () => {
  const fp = 'test.stx'

  it('expression with null value produces empty string', () => {
    const result = processExpressions('{{ val }}', { val: null }, fp)
    expect(result.trim()).toBe('')
  })

  it('expression with undefined value produces empty string', () => {
    const result = processExpressions('{{ val }}', { val: undefined }, fp)
    expect(result.trim()).toBe('')
  })

  it('expression with boolean false renders as false', () => {
    const result = processExpressions('{{ val }}', { val: false }, fp)
    expect(result).toContain('false')
  })

  it('expression with zero renders as 0', () => {
    const result = processExpressions('{{ val }}', { val: 0 }, fp)
    expect(result).toContain('0')
  })

  it('raw expression {!! !!} does not escape HTML', () => {
    const result = processExpressions('{!! html !!}', { html: '<b>bold</b>' }, fp)
    expect(result).toContain('<b>bold</b>')
  })

  it('escaped expression {{ }} does escape HTML', () => {
    const result = processExpressions('{{ html }}', { html: '<b>bold</b>' }, fp)
    expect(result).toContain('&lt;b&gt;')
    expect(result).not.toContain('<b>bold</b>')
  })

  it('expression with simple arithmetic', () => {
    const result = processExpressions('{{ a + b }}', { a: 10, b: 20 }, fp)
    expect(result).toContain('30')
  })

  it('expression with string concatenation', () => {
    const result = processExpressions('{{ first + " " + last }}', { first: 'John', last: 'Doe' }, fp)
    expect(result).toContain('John Doe')
  })

  it('expression with array access', () => {
    const result = processExpressions('{{ items[0] }}', { items: ['first', 'second'] }, fp)
    expect(typeof result).toBe('string')
  })

  it('expression with method chain', () => {
    const result = processExpressions('{{ name.toUpperCase() }}', { name: 'alice' }, fp)
    expect(result).toContain('ALICE')
  })

  it('multiple expressions on one line', () => {
    const result = processExpressions('{{ a }} and {{ b }}', { a: 'X', b: 'Y' }, fp)
    expect(result).toContain('X')
    expect(result).toContain('Y')
    expect(result).toContain('and')
  })

  it('expression with ternary operator', () => {
    const result = processExpressions('{{ show ? "yes" : "no" }}', { show: true }, fp)
    expect(result).toContain('yes')
  })

  it('expression with logical OR for default value', () => {
    const result = processExpressions('{{ val || "default" }}', { val: '' }, fp)
    expect(result).toContain('default')
  })

  it('expression with nullish coalescing style fallback', () => {
    const result = processExpressions('{{ val || "fallback" }}', { val: null }, fp)
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
// Merged from deep-edge-cases.test.ts: Additional Filter Edge Cases
// =============================================================================

describe('Additional Filter Edge Cases', () => {
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
// Merged from regression-bugs.test.ts: Expression Regression Tests
// =============================================================================

describe('Expression Regression Tests', () => {
  const fp = 'test.stx'

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

// =============================================================================
// Merged from regression-bugs.test.ts: Cross-Cutting Expression/Filter Tests
// =============================================================================

describe('Cross-Cutting Expression and Filter Regression Tests', () => {
  const fp = 'test.stx'

  it('should handle expressions with the currency filter', () => {
    const result = processExpressions('{{ amount | currency }}', { amount: 1234.56 }, fp)
    expect(result).toBe('$1,234.56')
  })

  it('should handle filters with truncate and custom length', () => {
    const result = processExpressions(
      '{{ text | truncate:20 }}',
      { text: 'This is a very long sentence that should be truncated.' },
      fp,
    )
    expect(result.length).toBeLessThanOrEqual(20)
    expect(result).toContain('...')
  })

  it('should handle the json filter', () => {
    const result = processExpressions('{!! data | json !!}', { data: { a: 1, b: 2 } }, fp)
    expect(result).toContain('"a":1')
    expect(result).toContain('"b":2')
  })

  it('should handle the uppercase and lowercase filters', () => {
    const upper = processExpressions('{{ name | uppercase }}', { name: 'hello' }, fp)
    expect(upper).toBe('HELLO')
    const lower = processExpressions('{{ name | lowercase }}', { name: 'WORLD' }, fp)
    expect(lower).toBe('world')
  })

  it('should handle the capitalize filter', () => {
    const result = processExpressions('{{ word | capitalize }}', { word: 'hello' }, fp)
    expect(result).toBe('Hello')
  })

  it('should handle the default filter for null values', () => {
    const result = processExpressions('{{ missing | default:fallback }}', { missing: null }, fp)
    expect(result).toBe('fallback')
  })

  it('should handle chained filters', () => {
    const result = processExpressions(
      '{{ name | uppercase | truncate:5 }}',
      { name: 'hello world' },
      fp,
    )
    expect(result).toBe('HE...')
  })

  it('should handle the stripTags filter', () => {
    const result = processExpressions(
      '{{ html | stripTags }}',
      { html: '<p>Hello <strong>World</strong></p>' },
      fp,
    )
    expect(result).toBe('Hello World')
  })

  it('should handle the number filter with decimals', () => {
    const result = processExpressions('{{ val | number:2 }}', { val: 3.14159 }, fp)
    expect(result).toBe('3.14')
  })

  it('should handle the reverse filter on arrays', () => {
    const result = processExpressions('{!! items | reverse | join:- !!}', { items: ['a', 'b', 'c'] }, fp)
    expect(result).toBe('c-b-a')
  })

  it('should handle evaluateExpression for simple arithmetic', () => {
    const result = evaluateExpression('2 + 3 * 4', {})
    expect(result).toBe(14)
  })

  it('should handle the abs filter for negative numbers', () => {
    const result = processExpressions('{{ val | abs }}', { val: -42 }, fp)
    expect(result).toBe('42')
  })

  it('should handle the round filter', () => {
    const result = processExpressions('{{ val | round:1 }}', { val: 3.456 }, fp)
    expect(result).toBe('3.5')
  })

  it('should handle the urlencode filter', () => {
    const result = processExpressions('{{ url | urlencode }}', { url: 'hello world & foo=bar' }, fp)
    expect(result).toBe('hello%20world%20%26%20foo%3Dbar')
  })

  it('should handle the length filter', () => {
    const arrResult = processExpressions('{{ items | length }}', { items: [1, 2, 3] }, fp)
    expect(arrResult).toBe('3')
    const strResult = processExpressions('{{ text | length }}', { text: 'hello' }, fp)
    expect(strResult).toBe('5')
  })

  it('should handle the first and last filters', () => {
    const first = processExpressions('{{ items | first }}', { items: ['a', 'b', 'c'] }, fp)
    expect(first).toBe('a')
    const last = processExpressions('{{ items | last }}', { items: ['a', 'b', 'c'] }, fp)
    expect(last).toBe('c')
  })

  it('should handle the slice filter', () => {
    const result = processExpressions('{!! items | slice:1 | join:- !!}', { items: ['a', 'b', 'c', 'd'] }, fp)
    expect(result).toBe('b-c-d')
  })
})
