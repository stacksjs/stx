import { describe, expect, it } from 'bun:test'
import { SIGNALS_LAZY_HYDRATION_RUNTIME } from '../../src/client/signals-lazy-hydration-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals lazy-hydration runtime boundary', () => {
  it('assembles the lazy-hydration fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_LAZY_HYDRATION_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_LAZY_HYDRATION_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps all hydration triggers and island setup together', () => {
    expect(SIGNALS_LAZY_HYDRATION_RUNTIME).toContain("trigger === 'idle'")
    expect(SIGNALS_LAZY_HYDRATION_RUNTIME).toContain("trigger === 'visible'")
    expect(SIGNALS_LAZY_HYDRATION_RUNTIME).toContain("trigger === 'interaction'")
    expect(SIGNALS_LAZY_HYDRATION_RUNTIME).toContain("trigger.indexOf('media:')")
    expect(SIGNALS_LAZY_HYDRATION_RUNTIME).toContain("script[data-stx-island=\"")
  })
})
