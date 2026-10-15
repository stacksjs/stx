import { describe, expect, it } from 'bun:test'
import { SIGNALS_DRAWER_RUNTIME } from '../../src/client/signals-drawer-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals drawer runtime boundary', () => {
  it('assembles the drawer fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_DRAWER_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_DRAWER_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps drawer open, close, and toggle behavior together', () => {
    expect(SIGNALS_DRAWER_RUNTIME).toContain('var drawer = {')
    expect(SIGNALS_DRAWER_RUNTIME).toContain("overlays.open('stx-drawer:' + id")
    expect(SIGNALS_DRAWER_RUNTIME).toContain("overlays.close('stx-drawer:' + id)")
    expect(SIGNALS_DRAWER_RUNTIME).toContain('else drawer.open(id)')
  })
})
