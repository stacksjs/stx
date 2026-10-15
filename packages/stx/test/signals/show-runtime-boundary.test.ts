import { describe, expect, it } from 'bun:test'
import { SIGNALS_SHOW_RUNTIME } from '../../src/client/signals-show-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals show runtime boundary', () => {
  it('assembles the show fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_SHOW_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_SHOW_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps direct and expression visibility paths together', () => {
    expect(SIGNALS_SHOW_RUNTIME).toContain('function bindShow(el, expr')
    expect(SIGNALS_SHOW_RUNTIME).toContain('const directSignal = capturedScope[expr]')
    expect(SIGNALS_SHOW_RUNTIME).toContain('createExpressionAutoUnwrapProxy(capturedScope, expr)')
    expect(SIGNALS_SHOW_RUNTIME).toContain('stxHost.setVisible(el')
  })
})
