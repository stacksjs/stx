import { describe, expect, it } from 'bun:test'
import { SIGNALS_CLASS_RUNTIME } from '../../src/client/signals-class-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals class runtime boundary', () => {
  it('assembles the class fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_CLASS_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_CLASS_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps object, array, and string class forms together', () => {
    expect(SIGNALS_CLASS_RUNTIME).toContain('function bindClass(el, expr')
    expect(SIGNALS_CLASS_RUNTIME).toContain("typeof value === 'object'")
    expect(SIGNALS_CLASS_RUNTIME).toContain('Array.isArray(value)')
    expect(SIGNALS_CLASS_RUNTIME).toContain('createExpressionAutoUnwrapProxy(capturedScope, expr)')
  })
})
