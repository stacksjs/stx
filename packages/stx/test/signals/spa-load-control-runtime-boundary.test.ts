import { describe, expect, it } from 'bun:test'
import { SIGNALS_SPA_LOAD_CONTROL_RUNTIME } from '../../src/client/signals-spa-load-control-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals SPA load-control runtime boundary', () => {
  it('assembles the SPA load-control fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_SPA_LOAD_CONTROL_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_SPA_LOAD_CONTROL_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps debouncing, immediate flush, and swap teardown together', () => {
    expect(SIGNALS_SPA_LOAD_CONTROL_RUNTIME).toContain('function stxLoadHandler()')
    expect(SIGNALS_SPA_LOAD_CONTROL_RUNTIME).toContain('function flushStxLoad()')
    expect(SIGNALS_SPA_LOAD_CONTROL_RUNTIME).toContain('function beginSwap()')
    expect(SIGNALS_SPA_LOAD_CONTROL_RUNTIME).toContain("window.addEventListener('stx:load', stxLoadHandler)")
  })
})
