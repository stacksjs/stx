import { describe, expect, it } from 'bun:test'
import { SIGNALS_REACTIVE_RUNTIME } from '../../src/client/signals-reactive-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals reactive runtime boundary', () => {
  it('assembles the reactive fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_REACTIVE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_REACTIVE_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps compatibility aliases with the object proxy', () => {
    expect(SIGNALS_REACTIVE_RUNTIME).toContain('var ref = state')
    expect(SIGNALS_REACTIVE_RUNTIME).toContain('function reactive(target)')
    expect(SIGNALS_REACTIVE_RUNTIME).toContain('var computed = derived')
    expect(SIGNALS_REACTIVE_RUNTIME).toContain('var watchEffect = function(fn)')
  })
})
