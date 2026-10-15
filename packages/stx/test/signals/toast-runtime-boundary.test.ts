import { describe, expect, it } from 'bun:test'
import { SIGNALS_TOAST_RUNTIME } from '../../src/client/signals-toast-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals toast runtime boundary', () => {
  it('assembles the toast fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_TOAST_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_TOAST_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps toast creation, dismissal, and theme resolution together', () => {
    expect(SIGNALS_TOAST_RUNTIME).toContain('function addToast(type, message, options)')
    expect(SIGNALS_TOAST_RUNTIME).toContain('function removeToast(id)')
    expect(SIGNALS_TOAST_RUNTIME).toContain('function _resolveDark(override)')
    expect(SIGNALS_TOAST_RUNTIME).toContain('var toast = {')
  })
})
