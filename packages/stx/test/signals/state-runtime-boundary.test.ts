import { describe, expect, it } from 'bun:test'
import { SIGNALS_STATE_RUNTIME } from '../../src/client/signals-state-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function loadPrimitives(): { state: (value: number) => any, derived: (compute: () => number) => any } {
  const prelude = `
    let activeEffect = null;
    const effectStack = [];
    const pendingEffects = new Set();
    let isBatching = false;
    let __stxDevtoolsTracking = false;
    const __stxDevtoolsStats = { signalSets: 0 };
    const __stxDevtoolsMutations = [];
    let __stxSignalId = 0;
    function __stxShort(value) { return String(value); }
  `
  return new Function(`${prelude}\n${SIGNALS_STATE_RUNTIME}\nreturn { state, derived }`)() as any
}

describe('signals state runtime boundary', () => {
  it('assembles the state fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_STATE_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_STATE_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps state and derived behavior together', () => {
    const { state, derived } = loadPrimitives()
    const count = state(2)
    const doubled = derived(() => count() * 2)

    expect(doubled()).toBe(4)
    count.set(3)
    expect(doubled()).toBe(6)
    expect(count.value).toBe(3)
  })
})
