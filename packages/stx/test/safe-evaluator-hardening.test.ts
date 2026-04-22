/**
 * Regression tests for safe-evaluator hardening:
 *   - `safeEvaluateArray` rejects bogus `length` (NaN/Infinity/negative/float/string)
 *   - `safeEvaluateObject` basic sanity (still returns `{}` for arrays)
 *   - `sanitizeExpression` error message names the matched pattern
 *   - `getExpressionSafetyReason` structured reason without try/catch
 *   - `safeEvaluateCode` rejects inputs over the size cap
 *   - `isExpressionSafe` stays in sync with `getExpressionSafetyReason`
 */

import { describe, expect, it } from 'bun:test'
import {
  getExpressionSafetyReason,
  isExpressionSafe,
  safeEvaluateArray,
  safeEvaluateCode,
  safeEvaluateObject,
  sanitizeExpression,
} from '../src/safe-evaluator'

// ─────────────────────────────────────────────────────────────────────────────
// safeEvaluateArray — array-like length hardening
// ─────────────────────────────────────────────────────────────────────────────

describe('safeEvaluateArray — array-like length validation', () => {
  it('returns [] when length is NaN', () => {
    // Array.from({length:NaN}) silently produces an empty array but masks
    // the intent — require finite non-negative integer instead.
    expect(safeEvaluateArray('x', { x: { length: Number.NaN } })).toEqual([])
  })

  it('returns [] when length is Infinity', () => {
    // Array.from({length:Infinity}) throws RangeError; we pre-reject so
    // callers get a predictable empty array.
    expect(safeEvaluateArray('x', { x: { length: Number.POSITIVE_INFINITY } })).toEqual([])
  })

  it('returns [] when length is negative', () => {
    expect(safeEvaluateArray('x', { x: { length: -5 } })).toEqual([])
  })

  it('returns [] when length is a non-integer float', () => {
    expect(safeEvaluateArray('x', { x: { length: 3.7 } })).toEqual([])
  })

  it('returns [] when length is a string', () => {
    expect(safeEvaluateArray('x', { x: { length: '3' as any } })).toEqual([])
  })

  it('still accepts well-formed array-like objects', () => {
    const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 }
    expect(safeEvaluateArray('x', { x: arrayLike })).toEqual(['a', 'b', 'c'])
  })

  it('accepts zero-length array-like', () => {
    expect(safeEvaluateArray('x', { x: { length: 0 } })).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeExpression — error includes matched pattern
// ─────────────────────────────────────────────────────────────────────────────

describe('sanitizeExpression — error message includes matched pattern', () => {
  it('names the pattern that rejected the expression', () => {
    let msg = ''
    try {
      sanitizeExpression('eval(x)')
    }
    catch (e) {
      msg = (e as Error).message
    }
    // `matched /…/` is the implementation-detail-free assertion — we don't
    // care which exact regex fired, only that one was named.
    expect(msg).toContain('matched /')
    expect(msg).toContain('eval(x)')
  })

  it('preserves the "Potentially unsafe expression" prefix', () => {
    let msg = ''
    try {
      sanitizeExpression('x.constructor')
    }
    catch (e) {
      msg = (e as Error).message
    }
    expect(msg).toMatch(/^Potentially unsafe expression/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getExpressionSafetyReason — structured reason without try/catch
// ─────────────────────────────────────────────────────────────────────────────

describe('getExpressionSafetyReason', () => {
  it('returns null for a safe expression', () => {
    expect(getExpressionSafetyReason('a + b')).toBeNull()
    expect(getExpressionSafetyReason('user.name')).toBeNull()
    expect(getExpressionSafetyReason('items.filter(x => x > 0)')).toBeNull()
  })

  it('returns a descriptive string for an unsafe expression', () => {
    const reason = getExpressionSafetyReason('eval(payload)')
    expect(reason).not.toBeNull()
    expect(reason).toContain('unsafe')
    expect(reason).toContain('eval(payload)')
  })

  it('does not throw — callers can use it as a pure predicate with reason', () => {
    expect(() => getExpressionSafetyReason('eval(x)')).not.toThrow()
    expect(() => getExpressionSafetyReason('window.x')).not.toThrow()
    expect(() => getExpressionSafetyReason('')).not.toThrow()
  })

  it('tracks isExpressionSafe exactly (one is the logical inverse of the other)', () => {
    const samples = ['a + b', 'eval(x)', 'x.constructor', 'user.name', '__proto__.x', '3 * 4']
    for (const expr of samples) {
      const reason = getExpressionSafetyReason(expr)
      expect(reason === null).toBe(isExpressionSafe(expr))
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// safeEvaluateCode — input size cap
// ─────────────────────────────────────────────────────────────────────────────

describe('safeEvaluateCode — input size cap', () => {
  it('returns undefined for input over the 64KB cap', () => {
    // Pathological input — regex backtracking on each DANGEROUS_PATTERNS
    // scan can pay O(n × patterns). Reject up-front.
    const huge = `return ${'x + '.repeat(20000)}1`
    expect(huge.length).toBeGreaterThan(64 * 1024)
    expect(safeEvaluateCode(huge, { x: 1 })).toBeUndefined()
  })

  it('still accepts reasonably-sized code', () => {
    // A modest 1KB of innocuous arithmetic should execute normally.
    const body = `return ${Array.from({ length: 200 }, (_, i) => i + 1).join(' + ')}`
    const result = safeEvaluateCode(body, {})
    // sum 1..200 = 20100
    expect(result).toBe(20100)
  })

  it('returns undefined on non-string input', () => {
    expect(safeEvaluateCode(null as any, {})).toBeUndefined()
    expect(safeEvaluateCode(undefined as any, {})).toBeUndefined()
    expect(safeEvaluateCode(42 as any, {})).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// safeEvaluateObject — don't misclassify arrays as plain objects
// ─────────────────────────────────────────────────────────────────────────────

describe('safeEvaluateObject — basic sanity', () => {
  it('returns {} for arrays (even though typeof array === "object")', () => {
    expect(safeEvaluateObject('x', { x: [1, 2, 3] })).toEqual({})
  })

  it('returns the object for plain objects', () => {
    expect(safeEvaluateObject('x', { x: { a: 1 } })).toEqual({ a: 1 })
  })

  it('returns {} for null / undefined', () => {
    expect(safeEvaluateObject('x', { x: null })).toEqual({})
    expect(safeEvaluateObject('x', { x: undefined })).toEqual({})
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// @while loop iteration cap — inline comment + console.warn
// ─────────────────────────────────────────────────────────────────────────────

describe('createSafeLoopFunction — while loop iteration cap surfaces a warning', async () => {
  const { createSafeLoopFunction } = await import('../src/safe-evaluator')

  it('emits console.warn when the max-iteration guard engages', () => {
    const originalWarn = console.warn
    const warnings: string[] = []
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }

    try {
      // A while(true)-style loop — the body just appends a char each turn.
      // The guard trips at maxIterations and both emits the HTML marker
      // AND warns in the dev console so silent truncation is visible.
      const fn = createSafeLoopFunction('while', 'true', 'x', [], 5)
      const out = fn()
      expect(out).toContain('Maximum iterations exceeded')
      expect(warnings.some(m => /@while loop hit max iterations/.test(m))).toBe(true)
    }
    finally {
      console.warn = originalWarn
    }
  })
})
