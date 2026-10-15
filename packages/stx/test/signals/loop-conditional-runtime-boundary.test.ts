import { describe, expect, it } from 'bun:test'
import { SIGNALS_LOOP_CONDITIONAL_RUNTIME } from '../../src/client/signals-loop-conditional-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals loop conditional runtime boundary', () => {
  it('assembles the loop conditional fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_LOOP_CONDITIONAL_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_LOOP_CONDITIONAL_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps directive names and row deferral together', () => {
    expect(SIGNALS_LOOP_CONDITIONAL_RUNTIME).toContain("var IF_ATTRS = [':if', 'x-if', '@if']")
    expect(SIGNALS_LOOP_CONDITIONAL_RUNTIME).toContain("var FOR_ATTRS = [':for', 'x-for', '@for']")
    expect(SIGNALS_LOOP_CONDITIONAL_RUNTIME).toContain('function deferRowConditionals')
  })
})
