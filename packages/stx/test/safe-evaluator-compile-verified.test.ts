/**
 * A compiled expression is the one that was asked for, on every runtime.
 *
 * `new Function` is not a function of its source on Bun 1.4.2: it keeps
 * compiled code in a cache it matches too loosely, and about once in four
 * thousand distinct compiles it hands back the code of a different source of
 * the same length --
 *
 *   new Function('rows', 'return 1002893 + rows')(0)   // 1002227
 *
 * -- while `toString()` still shows the source that was asked for. Nothing
 * throws. For a template that is one expression silently evaluating as
 * another: a 4,000-row page rendered row 263's value on row 711. It was found
 * by an equivalence test for stacksjs/stx#2176 that failed only on CI, where
 * the affected version runs, and it is fixed upstream by 1.4.3.
 *
 * stx cannot choose its users' runtime, and every `{{ }}`, `@if` and `@for`
 * compiles through this primitive, so each compile is verified: the code is
 * asked to identify itself, and a function that answers as some other compile
 * is discarded and compiled again. On an affected runtime the sweeps below
 * exercise the real collisions; on a correct one they are plain correctness.
 */
import { describe, expect, it } from 'bun:test'
import { evaluateExpression } from '../src/expressions'
import { compileVerificationStats, compileVerified } from '../src/safe-evaluator'

describe('a verified compile', () => {
  it('returns the code for its own source across many same-length sources', () => {
    const wrong: string[] = []
    for (let i = 0; i < 20000; i++) {
      const n = 1000000 + i
      const result = compileVerified(['rows'], `'use strict'; return ${n} + rows`)(0)
      if (result !== n)
        wrong.push(`${n} ran as ${result}`)
    }
    expect(wrong).toEqual([])
    // Not asserted to be zero: on an affected runtime mismatches are expected,
    // and the point is that every one of them was caught above.
    expect(compileVerificationStats().mismatches).toBeGreaterThanOrEqual(0)
  })

  it('evaluates each of thousands of template expressions as itself', () => {
    const context = { rows: 4000, identity: 'alice', label: 'x' }
    const wrong: string[] = []
    for (let i = 0; i < 4000; i++) {
      const value = evaluateExpression(` ${i} + rows `, context, false)
      if (value !== i + 4000)
        wrong.push(`${i} + rows -> ${value}`)
    }
    expect(wrong).toEqual([])
  })

  it('does not run any of the body while verifying', () => {
    // The probe passes `undefined` for every parameter, so a body that touched
    // one during verification would throw here, at compile time.
    const sink = { count: 0 }
    const compiled = compileVerified(['sink'], `'use strict'; sink.count++; return sink.count`)
    expect(sink.count).toBe(0)
    expect(compiled(sink)).toBe(1)
  })

  it('never mistakes a stray extra argument for the probe', () => {
    const compiled = compileVerified(['a'], `'use strict'; return a`)
    expect(compiled(1, 'extra')).toBe(1)
    expect(compiled(2, undefined, 'more')).toBe(2)
    expect(compiled(3, 'stx-compile-probe:')).toBe(3)
  })

  it('still compiles when the context binds the probe param name', () => {
    const compiled = compileVerified(['__stx_compile_probe', 'b'], `'use strict'; return __stx_compile_probe + b`)
    expect(compiled(40, 2)).toBe(42)
  })

  it('keeps the body strict', () => {
    const compiled = compileVerified([], `'use strict'; undeclaredByAnyone = 1; return 1`)
    expect(() => compiled()).toThrow(ReferenceError)
  })
})
