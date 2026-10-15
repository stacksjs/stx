import { describe, expect, it } from 'bun:test'
import { SIGNALS_HYDRATION_RUNTIME } from '../../src/client/signals-hydration-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals hydration runtime boundary', () => {
  it('assembles the hydration fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_HYDRATION_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_HYDRATION_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps dynamic script, scope, directive, and mount hydration together', () => {
    expect(SIGNALS_HYDRATION_RUNTIME).toContain('function hydrateSubtree(container)')
    expect(SIGNALS_HYDRATION_RUNTIME).toContain("querySelectorAll('script[data-stx-scoped]')")
    expect(SIGNALS_HYDRATION_RUNTIME).toContain('processElement(container)')
    expect(SIGNALS_HYDRATION_RUNTIME).toContain("window.dispatchEvent(new CustomEvent('stx:hydrated'")
  })
})
