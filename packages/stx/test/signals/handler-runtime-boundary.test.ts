import { describe, expect, it } from 'bun:test'
import { SIGNALS_HANDLER_RUNTIME } from '../../src/client/signals-handler-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals handler runtime boundary', () => {
  it('assembles the handler fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_HANDLER_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_HANDLER_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps explicit signal access and event execution together', () => {
    expect(SIGNALS_HANDLER_RUNTIME).toContain('function expressionCallsSignal')
    expect(SIGNALS_HANDLER_RUNTIME).toContain('function createExpressionAutoUnwrapProxy')
    expect(SIGNALS_HANDLER_RUNTIME).toContain('function executeHandler(expr, event, el)')
    expect(SIGNALS_HANDLER_RUNTIME).toContain('parseEventShorthand(expr, scope)')
  })
})
