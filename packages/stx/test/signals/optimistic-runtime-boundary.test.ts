import { describe, expect, it } from 'bun:test'
import { SIGNALS_OPTIMISTIC_RUNTIME } from '../../src/client/signals-optimistic-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals optimistic runtime boundary', () => {
  it('assembles the optimistic fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_OPTIMISTIC_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_OPTIMISTIC_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps the optimistic overlay and settlement together', () => {
    expect(SIGNALS_OPTIMISTIC_RUNTIME).toContain('function useOptimistic(base, reducer)')
    expect(SIGNALS_OPTIMISTIC_RUNTIME).toContain('return [optimistic, addOptimistic]')
    expect(SIGNALS_OPTIMISTIC_RUNTIME).toContain('Promise.resolve(settleWhen).then(settle, settle)')
  })
})
