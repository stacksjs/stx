/**
 * The two `useInterval` implementations agree (stacksjs/stx#1941).
 *
 * stx ships `useInterval` twice, the same way it ships `useCookie` twice: once
 * in `browser-composables.ts` for the module-import path, and once inside the
 * runtime template literal in `signals.ts` for client pages. A caller cannot
 * tell which one their bundle resolved, so the two must behave identically.
 *
 * They had drifted on three axes at once. The module twin had no callback form,
 * so `useInterval(fn, 1000)` passed the function where the delay goes — it
 * coerces to `NaN`, which the platform clamps to 0, giving a runaway timer
 * incrementing a counter nobody could read. It had no `subscribe`, so there was
 * no supported way to observe a tick at all (`counter` is a plain number, not a
 * signal, so an effect cannot track it). And `immediate` was accepted and
 * documented but used as an initial paused-flag rather than "tick right away".
 *
 * Behaviour, not shape: `timer-declaration-drift.test.ts` already compares the
 * returned key sets. Matching keys with different semantics behind them is
 * exactly the drift that is hardest to see.
 */

import { describe, expect, it } from 'bun:test'
import { useInterval as moduleUseInterval } from '../../src/browser-composables'
import { generateSignalsRuntimeDev } from '../../src/signals'

type IntervalFn = (..._args: any[]) => {
  readonly counter: number
  pause: () => void
  resume: () => void
  reset: () => void
  subscribe: (_fn: (_count: number) => void) => () => void
}

/** The runtime's own `useInterval`, executed rather than string-matched. */
function runtimeUseInterval(): IntervalFn {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  // eslint-disable-next-line ts/no-explicit-any
  const fn = (globalThis as any).window?.stx?.useInterval as IntervalFn
  if (typeof fn !== 'function')
    throw new Error('runtime useInterval not available — happy-dom or runtime setup failed')
  return fn
}

const impls: Array<[string, IntervalFn]> = [
  ['module', moduleUseInterval as unknown as IntervalFn],
  ['runtime', runtimeUseInterval()],
]

for (const [name, useInterval] of impls) {
  describe(`useInterval parity (${name})`, () => {
    it('returns controls, not a bare counter object', () => {
      const t = useInterval(10_000)
      try {
        expect(typeof t.counter).toBe('number')
        expect(typeof t.pause).toBe('function')
        expect(typeof t.resume).toBe('function')
        expect(typeof t.reset).toBe('function')
        expect(typeof t.subscribe).toBe('function')
      }
      finally {
        t.pause()
      }
    })

    it('treats a leading function as the callback, not the delay', async () => {
      // The failure this replaces: the callback landed in the delay slot, which
      // coerces to NaN and clamps to 0. Asserting on the tick COUNT after a
      // short wait catches that — a 0ms timer fires hundreds of times where a
      // correct 15ms one fires a handful.
      let ticks = 0
      const t = useInterval(() => { ticks++ }, 15)
      try {
        await Bun.sleep(90)
        expect(ticks).toBeGreaterThan(0)
        // Generous ceiling: this is asserting "not a runaway", not exact timing.
        expect(ticks).toBeLessThan(60)
      }
      finally {
        t.pause()
      }
    })

    it('honours immediate by ticking before the first interval elapses', async () => {
      let ticks = 0
      const t = useInterval(() => { ticks++ }, 10_000, { immediate: true })
      try {
        // No wait: with `immediate` the first tick has already happened, and the
        // interval is far too long to have produced one on its own.
        expect(ticks).toBe(1)
      }
      finally {
        t.pause()
      }
    })

    it('does not tick immediately without the option', () => {
      let ticks = 0
      const t = useInterval(() => { ticks++ }, 10_000)
      try {
        expect(ticks).toBe(0)
      }
      finally {
        t.pause()
      }
    })

    it('skips ticks while enabled is false', async () => {
      let ticks = 0
      const t = useInterval(() => { ticks++ }, 5, { enabled: false })
      try {
        await Bun.sleep(60)
        expect(ticks).toBe(0)
      }
      finally {
        t.pause()
      }
    })

    it('re-evaluates a function-valued enabled on every tick', async () => {
      let allowed = false
      let ticks = 0
      const t = useInterval(() => { ticks++ }, 5, { enabled: () => allowed })
      try {
        await Bun.sleep(40)
        expect(ticks).toBe(0)
        allowed = true
        await Bun.sleep(40)
        expect(ticks).toBeGreaterThan(0)
      }
      finally {
        t.pause()
      }
    })

    it('notifies subscribers with the running count', async () => {
      const seen: number[] = []
      const t = useInterval(10)
      try {
        const off = t.subscribe(count => seen.push(count))
        await Bun.sleep(70)
        off()
        const afterUnsubscribe = seen.length
        await Bun.sleep(40)

        expect(afterUnsubscribe).toBeGreaterThan(0)
        expect(seen[0]).toBe(1)
        // Unsubscribing has to actually detach, or "returns a function" is a
        // claim nothing checks.
        expect(seen.length).toBe(afterUnsubscribe)
      }
      finally {
        t.pause()
      }
    })

    it('pause stops ticking and resume starts it again', async () => {
      let ticks = 0
      const t = useInterval(() => { ticks++ }, 5)
      try {
        await Bun.sleep(40)
        const running = ticks
        t.pause()
        await Bun.sleep(40)
        expect(ticks).toBe(running)

        t.resume()
        await Bun.sleep(40)
        expect(ticks).toBeGreaterThan(running)
      }
      finally {
        t.pause()
      }
    })

    it('reset returns the counter to zero', async () => {
      const t = useInterval(5)
      try {
        await Bun.sleep(40)
        expect(t.counter).toBeGreaterThan(0)
        t.reset()
        expect(t.counter).toBe(0)
      }
      finally {
        t.pause()
      }
    })
  })
}
