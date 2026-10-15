import { describe, expect, it } from 'bun:test'
import { SIGNALS_DIALOG_RUNTIME } from '../../src/client/signals-dialog-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals dialog runtime boundary', () => {
  it('assembles the dialog fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_DIALOG_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_DIALOG_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps alert and confirm behavior in one fragment', () => {
    expect(SIGNALS_DIALOG_RUNTIME).toContain('function _createDialog(message, options, isConfirm)')
    expect(SIGNALS_DIALOG_RUNTIME).toContain('function _dialogReducedMotion()')
    expect(SIGNALS_DIALOG_RUNTIME).toContain('function stxAlert(message, options)')
    expect(SIGNALS_DIALOG_RUNTIME).toContain('function stxConfirm(message, options)')
  })
})
