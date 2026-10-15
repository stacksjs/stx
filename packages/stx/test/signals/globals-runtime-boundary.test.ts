import { describe, expect, it } from 'bun:test'
import { SIGNALS_GLOBALS_RUNTIME } from '../../src/client/signals-globals-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals browser-globals runtime boundary', () => {
  it('assembles the browser-globals fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_GLOBALS_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_GLOBALS_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps core, composable, overlay, and store aliases together', () => {
    expect(SIGNALS_GLOBALS_RUNTIME).toContain('window.state = state')
    expect(SIGNALS_GLOBALS_RUNTIME).toContain('window.useFetch = useFetch')
    expect(SIGNALS_GLOBALS_RUNTIME).toContain('window.toast = toast')
    expect(SIGNALS_GLOBALS_RUNTIME).toContain('window.defineStore = window.stx.defineStore')
  })
})
