import { describe, expect, it } from 'bun:test'
import { SIGNALS_LOOP_ROW_RUNTIME } from '../../src/client/signals-loop-row-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals loop row runtime boundary', () => {
  it('assembles the loop row fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_LOOP_ROW_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_LOOP_ROW_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps row ownership and moving-placeholder support together', () => {
    expect(SIGNALS_LOOP_ROW_RUNTIME).toContain('function markLoopRow')
    expect(SIGNALS_LOOP_ROW_RUNTIME).toContain('function isForeignToLoopRow')
    expect(SIGNALS_LOOP_ROW_RUNTIME).toContain('function followPlaceholder')
  })
})
