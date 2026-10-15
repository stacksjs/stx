import { describe, expect, it } from 'bun:test'
import { SIGNALS_TRANSITION_GROUP_RUNTIME } from '../../src/client/signals-transition-group-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals transition-group runtime boundary', () => {
  it('assembles the transition-group fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_TRANSITION_GROUP_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_TRANSITION_GROUP_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps enter, leave, snapshot, and FLIP helpers together', () => {
    expect(SIGNALS_TRANSITION_GROUP_RUNTIME).toContain('function tgEnter(el, name)')
    expect(SIGNALS_TRANSITION_GROUP_RUNTIME).toContain('function tgLeave(el, name)')
    expect(SIGNALS_TRANSITION_GROUP_RUNTIME).toContain('function tgSnapshot(els)')
    expect(SIGNALS_TRANSITION_GROUP_RUNTIME).toContain('function tgFlip(els, first, name)')
  })
})
