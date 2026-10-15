import { describe, expect, it } from 'bun:test'
import { SIGNALS_OVERLAY_RUNTIME } from '../../src/client/signals-overlay-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals overlay runtime boundary', () => {
  it('assembles the overlay fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_OVERLAY_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_OVERLAY_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps the shared stack and modal facade together', () => {
    expect(SIGNALS_OVERLAY_RUNTIME).toContain('function _overlaySync()')
    expect(SIGNALS_OVERLAY_RUNTIME).toContain('function _overlayFocusIn(entry, attempts)')
    expect(SIGNALS_OVERLAY_RUNTIME).toContain('var overlays = {')
    expect(SIGNALS_OVERLAY_RUNTIME).toContain('var modal = {')
  })
})
