import { describe, expect, it } from 'bun:test'
import { SIGNALS_BINDING_UTILS_RUNTIME } from '../../src/client/signals-binding-utils-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals binding-utils runtime boundary', () => {
  it('assembles the binding-utils fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_BINDING_UTILS_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_BINDING_UTILS_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps attribute, loop-boundary, and prop-signal helpers together', () => {
    expect(SIGNALS_BINDING_UTILS_RUNTIME).toContain('function getElementAttributes(el)')
    expect(SIGNALS_BINDING_UTILS_RUNTIME).toContain('function getModelBinding(el)')
    expect(SIGNALS_BINDING_UTILS_RUNTIME).toContain('function hasPendingLoopBoundary(el)')
    expect(SIGNALS_BINDING_UTILS_RUNTIME).toContain('function syncComponentPropSignal(el, name, value)')
  })
})
