/**
 * Regression tests for `extractParenthesizedExpressionDetailed` — the
 * structured-result sibling of `extractParenthesizedExpression`. Exposes
 * why a parse failed (missing open paren vs. unclosed paren) so callers
 * can emit user-facing error messages pointing at the real problem.
 */

import { describe, expect, it } from 'bun:test'
import {
  extractParenthesizedExpression,
  extractParenthesizedExpressionDetailed,
} from '../../src/parser/directive-parser'

describe('extractParenthesizedExpressionDetailed', () => {
  it('returns { ok:true, … } for a well-formed parenthesized expression', () => {
    const r = extractParenthesizedExpressionDetailed('foo(a, b)bar', 3)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.expression).toBe('a, b')
      expect(r.endPos).toBe(9)
    }
  })

  it('distinguishes "missing open paren" from "unclosed paren"', () => {
    // Leading chars aren't `(` — a directive like `@if x > 0` instead of
    // `@if(x > 0)`.
    const missing = extractParenthesizedExpressionDetailed('@if x > 0', 3)
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.reason).toBe('missing-open-paren')

    // Open paren present but no matching close — typo'd directive.
    const unclosed = extractParenthesizedExpressionDetailed('@if(x > 0', 3)
    expect(unclosed.ok).toBe(false)
    if (!unclosed.ok) expect(unclosed.reason).toBe('unclosed-paren')
  })

  it('supports nested parens (findMatchingDelimiter under the hood)', () => {
    const r = extractParenthesizedExpressionDetailed('wrapper(fn(a, b), c)tail', 7)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.expression).toBe('fn(a, b), c')
    }
  })

  it('legacy extractParenthesizedExpression still returns null on failure', () => {
    // Callers that only care about "did it parse?" keep working unchanged.
    expect(extractParenthesizedExpression('@if x', 3)).toBeNull()
    expect(extractParenthesizedExpression('@if(x', 3)).toBeNull()
    expect(extractParenthesizedExpression('@if(x)', 3)).toEqual({ expression: 'x', endPos: 6 })
  })
})
