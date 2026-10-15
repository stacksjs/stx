import { describe, expect, it } from 'bun:test'
import { SIGNALS_HELPERS_RUNTIME } from '../../src/client/signals-helpers-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function loadHelpers(): Record<string, any> {
  const prelude = `
    let activeEffect = null;
    const targetMap = new WeakMap();
    let isBatching = false;
    const pendingEffects = new Set();
  `
  return new Function(`${prelude}\n${SIGNALS_HELPERS_RUNTIME}\nreturn { globalHelpers, track, trigger, setEffect: value => activeEffect = value }`)() as any
}

describe('signals helpers runtime boundary', () => {
  it('assembles the helpers fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_HELPERS_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_HELPERS_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps formatting and object dependency tracking available', () => {
    const { globalHelpers, track, trigger, setEffect } = loadHelpers()
    const target = {}
    let runs = 0
    setEffect(() => runs++)
    track(target, 'value')
    trigger(target, 'value')

    expect(globalHelpers.fmt(1250)).toBe('1.3K')
    expect(globalHelpers.currency(1234.5)).toBe('$1,234.50')
    expect(runs).toBe(1)
  })
})
