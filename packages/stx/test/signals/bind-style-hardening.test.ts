/**
 * Regression test for bindStyle retry pattern — now mirrors bindClass.
 *
 * Context: the auto-unwrap proxy turns signals into primitives during
 * expression evaluation. That works for expressions like
 *   :style="{ active: count > 5 }"
 * but breaks call-syntax expressions like
 *   :style="{ color: theme() }"
 * because `theme` is already unwrapped to its value, and calling a
 * primitive throws TypeError. bindClass solved this with a two-pass
 * try/catch (unwrap → raw scope fallback); bindStyle now does the same.
 */

import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('bindStyle runtime — retry with raw scope for call-syntax', () => {
  const runtime = generateSignalsRuntimeDev()

  it('bindStyle catches an initial TypeError and retries with raw scope', () => {
    // Two new Function() calls, one inside the primary try, one in the
    // retry — matches bindClass's shape.
    const styleSrc = runtime.slice(runtime.indexOf('function bindStyle'))
    const styleEnd = styleSrc.indexOf('function bindFor')
    const body = styleSrc.slice(0, styleEnd > 0 ? styleEnd : 3000)
    const fnCalls = body.match(/new Function\(/g) || []
    expect(fnCalls.length).toBeGreaterThanOrEqual(2)
    // The second pass uses capturedScope values directly (not unwrapScope),
    // which is the key shape of the retry.
    expect(body).toMatch(/Object\.values\(capturedScope\)/)
  })

  it('still guards TypeError/ReferenceError from producing noisy warns', () => {
    // Catch-variable name (e / e1 / e2) is an implementation detail — the
    // TypeError guard wraps the Style warn regardless of naming.
    expect(runtime).toMatch(/!\(e2? instanceof TypeError\)\)\s*console\.warn\(['"]\[STX\] Style expression error:/)
  })
})
