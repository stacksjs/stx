import { describe, expect, it } from 'bun:test'
import { SIGNALS_EVENT_SHORTHAND_RUNTIME } from '../../src/client/signals-event-shorthand-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals event shorthand runtime boundary', () => {
  it('assembles the event shorthand fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_EVENT_SHORTHAND_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_EVENT_SHORTHAND_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps every shorthand form in one parser', () => {
    expect(SIGNALS_EVENT_SHORTHAND_RUNTIME).toContain('function parseEventShorthand(expr, scope)')
    expect(SIGNALS_EVENT_SHORTHAND_RUNTIME).toContain('signal.set(!signal())')
    expect(SIGNALS_EVENT_SHORTHAND_RUNTIME).toContain('signal.update(n => n + 1)')
    expect(SIGNALS_EVENT_SHORTHAND_RUNTIME).toContain('return ($event) => fn($event)')
  })
})
