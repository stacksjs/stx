/**
 * Regression tests for built-in filter hardening fixes:
 *   - `translate` placeholder word-boundary + regex cache
 *   - `first`/`last` empty-array returns template-safe ''
 *   - `length` counts Map and Set members via `.size`
 *
 * Each `describe` block locks in one concrete correctness change; failures
 * here mean the original bug has regressed.
 */

import { describe, expect, it } from 'bun:test'
import { defaultFilters } from '../../src/expressions'

// ─────────────────────────────────────────────────────────────────────────────
// translate filter — placeholder boundary + regex cache
// ─────────────────────────────────────────────────────────────────────────────

describe('translate filter — placeholder word boundary', () => {
  const ctx = (s: string): Record<string, any> => ({
    __translations: { greeting: s },
  })

  it('does NOT replace `:user` when it appears inside `:userName`', () => {
    // Regression: before the fix, passing {user: 'Alice'} against
    // `"Hello :userName"` produced `"Hello AliceName"` because the regex
    // matched the prefix. We now require a non-word char (or EOL) after
    // the key.
    const out = defaultFilters.translate('greeting', ctx('Hello :userName'), { user: 'Alice' })
    expect(out).toBe('Hello :userName')
  })

  it('does replace `:user` when followed by a non-word char', () => {
    expect(defaultFilters.translate('greeting', ctx('Hi :user!'), { user: 'Alice' })).toBe('Hi Alice!')
    expect(defaultFilters.translate('greeting', ctx(':user, welcome'), { user: 'Alice' })).toBe('Alice, welcome')
    expect(defaultFilters.translate('greeting', ctx('hello :user'), { user: 'Alice' })).toBe('hello Alice')
  })

  it('replaces multiple occurrences of the same key', () => {
    expect(defaultFilters.translate('greeting', ctx(':user + :user'), { user: 'Alice' })).toBe('Alice + Alice')
  })

  it('handles keys with regex-special characters safely', () => {
    const out = defaultFilters.translate('greeting', ctx('Hi :user.name!'), { 'user.name': 'Alice' })
    expect(out).toBe('Hi Alice!')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// first / last — empty array yields '' (template-safe)
// ─────────────────────────────────────────────────────────────────────────────

describe('first / last filters — empty array', () => {
  it('first([]) returns ""', () => {
    // Before: returned undefined, which rendered as "undefined" in
    // interpolations. Now consistent with null/undefined handling.
    expect(defaultFilters.first([], {})).toBe('')
  })

  it('last([]) returns ""', () => {
    expect(defaultFilters.last([], {})).toBe('')
  })

  it('first/last still work on non-empty arrays', () => {
    expect(defaultFilters.first(['a', 'b'], {})).toBe('a')
    expect(defaultFilters.last(['a', 'b'], {})).toBe('b')
  })

  it('first/last still work on strings', () => {
    expect(defaultFilters.first('abc', {})).toBe('a')
    expect(defaultFilters.last('abc', {})).toBe('c')
  })

  it('first/last on null/undefined still return ""', () => {
    expect(defaultFilters.first(null, {})).toBe('')
    expect(defaultFilters.first(undefined, {})).toBe('')
    expect(defaultFilters.last(null, {})).toBe('')
    expect(defaultFilters.last(undefined, {})).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// length filter — Map / Set support
// ─────────────────────────────────────────────────────────────────────────────

describe('length filter — Map/Set cardinality', () => {
  it('length(new Map([...])) returns the size', () => {
    // Before: fell through to Object.keys(map).length === 0 for all Maps,
    // silently hiding the real size.
    const m = new Map([['a', 1], ['b', 2], ['c', 3]])
    expect(defaultFilters.length(m, {})).toBe(3)
  })

  it('length(new Set([...])) returns the size', () => {
    const s = new Set(['a', 'b', 'c', 'a'])
    expect(defaultFilters.length(s, {})).toBe(3)
  })

  it('length still works for arrays, strings, plain objects, and null', () => {
    expect(defaultFilters.length([1, 2, 3], {})).toBe(3)
    expect(defaultFilters.length('abc', {})).toBe(3)
    expect(defaultFilters.length({ a: 1, b: 2 }, {})).toBe(2)
    expect(defaultFilters.length(null, {})).toBe(0)
    expect(defaultFilters.length(undefined, {})).toBe(0)
  })
})
