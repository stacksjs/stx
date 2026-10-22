import { describe, expect, it } from 'bun:test'
import { SIGNALS_SPA_LOAD_RUNTIME } from '../../src/client/signals-spa-load-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals SPA load runtime boundary', () => {
  it('assembles the SPA load fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_SPA_LOAD_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_SPA_LOAD_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps setup, component scope, binding, and mount rehydration together', () => {
    expect(SIGNALS_SPA_LOAD_RUNTIME).toContain('function _handleStxLoad()')
    expect(SIGNALS_SPA_LOAD_RUNTIME).toContain('runPageSetup(window.stx._latestSetup)')
    expect(SIGNALS_SPA_LOAD_RUNTIME).toContain("document.body.querySelectorAll('[data-stx-scope]')")
    expect(SIGNALS_SPA_LOAD_RUNTIME).toContain("auditHydration(container, 'stx:load')")
  })
})
