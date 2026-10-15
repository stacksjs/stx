import { describe, expect, it } from 'bun:test'
import { SIGNALS_MODEL_RUNTIME } from '../../src/client/signals-model-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals model runtime boundary', () => {
  it('assembles the model fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_MODEL_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_MODEL_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps text, checkbox, radio, and select bindings together', () => {
    expect(SIGNALS_MODEL_RUNTIME).toContain('function bindModel(el, expr')
    expect(SIGNALS_MODEL_RUNTIME).toContain("type === 'checkbox'")
    expect(SIGNALS_MODEL_RUNTIME).toContain("type === 'radio'")
    expect(SIGNALS_MODEL_RUNTIME).toContain("tag === 'select'")
    expect(SIGNALS_MODEL_RUNTIME).toContain('createModelWriteProxy(capturedScope)')
  })
})
