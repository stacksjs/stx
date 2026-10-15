import { describe, expect, it } from 'bun:test'
import { SIGNALS_SUSPENSE_RUNTIME } from '../../src/client/signals-suspense-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals suspense runtime boundary', () => {
  it('assembles the suspense fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_SUSPENSE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_SUSPENSE_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps loading, error, and content states together', () => {
    expect(SIGNALS_SUSPENSE_RUNTIME).toContain('function bindSuspense(el, scope)')
    expect(SIGNALS_SUSPENSE_RUNTIME).toContain('[data-stx-suspense-fallback]')
    expect(SIGNALS_SUSPENSE_RUNTIME).toContain('[data-stx-suspense-error]')
    expect(SIGNALS_SUSPENSE_RUNTIME).toContain('[data-stx-suspense-content]')
  })
})
