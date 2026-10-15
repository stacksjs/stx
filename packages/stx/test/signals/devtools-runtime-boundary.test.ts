import { describe, expect, it } from 'bun:test'
import { SIGNALS_DEVTOOLS_RUNTIME } from '../../src/client/signals-devtools-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals DevTools runtime boundary', () => {
  it('assembles the DevTools fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_DEVTOOLS_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_DEVTOOLS_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps graph, trace, scope, and store inspection together', () => {
    expect(SIGNALS_DEVTOOLS_RUNTIME).toContain('function __stxDevtoolsClassify(sv)')
    expect(SIGNALS_DEVTOOLS_RUNTIME).toContain('window.__stxDevtools = {')
    expect(SIGNALS_DEVTOOLS_RUNTIME).toContain('graph: function()')
    expect(SIGNALS_DEVTOOLS_RUNTIME).toContain('store: function(id)')
  })
})
