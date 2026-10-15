import { describe, expect, it } from 'bun:test'
import { SIGNALS_TOOLTIP_RUNTIME } from '../../src/client/signals-tooltip-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals tooltip runtime boundary', () => {
  it('assembles the tooltip fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_TOOLTIP_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_TOOLTIP_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps delegated pointer and focus handling together', () => {
    expect(SIGNALS_TOOLTIP_RUNTIME).toContain("tip.id = 'stx-tooltip'")
    expect(SIGNALS_TOOLTIP_RUNTIME).toContain("document.addEventListener('mouseover'")
    expect(SIGNALS_TOOLTIP_RUNTIME).toContain("document.addEventListener('focusin'")
    expect(SIGNALS_TOOLTIP_RUNTIME).toContain("el.getAttribute('x-tooltip-position')")
  })
})
