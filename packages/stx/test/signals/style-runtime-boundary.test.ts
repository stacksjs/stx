import { describe, expect, it } from 'bun:test'
import { SIGNALS_STYLE_RUNTIME } from '../../src/client/signals-style-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals style runtime boundary', () => {
  it('assembles the style fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_STYLE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_STYLE_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps proxy evaluation, raw fallback, and host writes together', () => {
    expect(SIGNALS_STYLE_RUNTIME).toContain('function bindStyle(el, expr')
    expect(SIGNALS_STYLE_RUNTIME).toContain('createExpressionAutoUnwrapProxy(capturedScope, expr)')
    expect(SIGNALS_STYLE_RUNTIME).toContain('__stxArgs(fn2, capturedScope)')
    expect(SIGNALS_STYLE_RUNTIME).toContain('stxHost.setStyle(el, value)')
  })
})
