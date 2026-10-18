import { describe, expect, it } from 'bun:test'
import { SIGNALS_EFFECT_RUNTIME } from '../../src/client/signals-effect-runtime'
import { SIGNALS_NOTIFY_RUNTIME } from '../../src/client/signals-notify-runtime'
import { SIGNALS_STATE_RUNTIME } from '../../src/client/signals-state-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

function loadReactivity(): Record<string, any> {
  const prelude = `
    let activeEffect = null;
    const effectStack = [];
    const pendingEffects = new Set();
    let isBatching = false;
    let activeDisposers = null;
    let __stxDevtoolsTracking = false;
    const __stxDevtoolsStats = { signalSets: 0, effectRuns: 0 };
    const __stxDevtoolsMutations = [];
    let __stxSignalId = 0;
    let __stxEffectId = 0;
    function __stxShort(value) { return String(value); }
    ${SIGNALS_NOTIFY_RUNTIME}
  `
  const runtime = `${prelude}\n${SIGNALS_STATE_RUNTIME}\n${SIGNALS_EFFECT_RUNTIME}\nreturn { state, derived, effect, batch }`
  return new Function(runtime)() as Record<string, any>
}

describe('signals effect runtime boundary', () => {
  it('assembles the effect fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_EFFECT_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_EFFECT_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps effects and batching wired to state', () => {
    const { state, effect, batch } = loadReactivity()
    const count = state(0)
    const seen: number[] = []
    effect(() => seen.push(count()))

    batch(() => {
      count.set(1)
      count.set(2)
    })

    expect(seen).toEqual([0, 2])
  })
})
