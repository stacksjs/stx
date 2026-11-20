import { describe, expect, it, spyOn } from 'bun:test'
import { SIGNALS_EFFECT_RUNTIME } from '../../src/client/signals-effect-runtime'
import { SIGNALS_NOTIFY_RUNTIME } from '../../src/client/signals-notify-runtime'
import { SIGNALS_STATE_RUNTIME } from '../../src/client/signals-state-runtime'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'

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
  const runtime = `${prelude}\n${SIGNALS_STATE_RUNTIME}\n${SIGNALS_EFFECT_RUNTIME}\nreturn { state, derived, effect, batch, effectDiagnostics }`
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

it('reports repeated synchronous effect reentry once in development', () => {
  const { state, effect, effectDiagnostics } = loadReactivity()
  const count = state(0)
  const warning = spyOn(console, 'warn').mockImplementation(() => {})
  try {
    effect(function incrementOwnDependency() {
      const value = count()
      if (value < 15) count.set(value + 1)
    })
    expect(count()).toBe(15)
    expect(warning).toHaveBeenCalledTimes(1)
    expect(effectDiagnostics).toHaveLength(1)
    expect(effectDiagnostics[0]).toMatchObject({ code: 'STX_EFFECT_REENTRY' })
    expect(effectDiagnostics[0].stack).toContain('incrementOwnDependency')
  }
  finally {
    warning.mockRestore()
  }
})

it('leaves reentry diagnostics out of production builds', () => {
  expect(generateSignalsRuntime()).not.toContain('STX_EFFECT_REENTRY')
})
