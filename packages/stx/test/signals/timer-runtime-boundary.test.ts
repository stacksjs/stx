import { describe, expect, it } from 'bun:test'
import { SIGNALS_TIMER_RUNTIME } from '../../src/client/signals-timer-runtime'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals timer runtime boundary', () => {
  it('assembles the timer fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_TIMER_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_TIMER_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps timer lifecycles and utility aliases together', () => {
    expect(SIGNALS_TIMER_RUNTIME).toContain('function useDebounce(fn, delay)')
    expect(SIGNALS_TIMER_RUNTIME).toContain('var useThrottleFn = useThrottle')
    expect(SIGNALS_TIMER_RUNTIME).toContain('function useInterval(interval, options, thirdOptions)')
    expect(SIGNALS_TIMER_RUNTIME).toContain('function watchMultiple(sources, callback, options)')
  })
})
