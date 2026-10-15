import { describe, expect, it } from 'bun:test'
import { SIGNALS_EXPRESSION_RUNTIME } from '../../src/client/signals-expression-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals expression runtime boundary', () => {
  it('assembles the expression fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_EXPRESSION_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_EXPRESSION_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps scope lookup and expression evaluation together', () => {
    expect(SIGNALS_EXPRESSION_RUNTIME).toContain('function findElementScope(el)')
    expect(SIGNALS_EXPRESSION_RUNTIME).toContain('function toValue(expr, el')
    expect(SIGNALS_EXPRESSION_RUNTIME).toContain('parsePipeExpression(expr, baseScope)')
    expect(SIGNALS_EXPRESSION_RUNTIME).toContain('__stxCompileScoped(baseScope')
  })
})
