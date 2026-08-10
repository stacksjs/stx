/**
 * The two module-side reactive systems observe each other (stacksjs/stx#1885).
 *
 * `reactivity.ts` (`ref`, `reactive`, `computed`, `watch`, `watchEffect`) and
 * `signals-api.ts` (`state`, `derived`, `effect`) are exported from the same
 * package entry, and each used to record dependencies against its own
 * module-local "currently running effect" variable — `currentEffect` in one,
 * `activeEffect` in the other. Same shape, same purpose, two variables. Which
 * system a value belonged to was decided by which module happened to declare
 * the variable that was set when the value was read.
 *
 * Measured on `import { … } from 'stx'` before the fix:
 *
 *     reactive() + effect()        INERT      reactive() + watchEffect()  REACTIVE
 *     ref()      + effect()        INERT      ref()      + watchEffect()  REACTIVE
 *     state()    + effect()        REACTIVE   state()    + watchEffect()  INERT
 *
 * Four of six dead, and dead in the worst way available: the effect ran its
 * first pass and never again, which is indistinguishable from a value that
 * never changed. Eight names out of one entry point, nothing to tell an author
 * which half of the matrix they were standing in.
 *
 * `reactive-tracking.ts` now owns that state for both. These are the pairings.
 */

import { describe, expect, it } from 'bun:test'
import { batch, computed, derived, effect, peek, reactive, ref, state, watch, watchEffect } from '../../src'

/** `watch` defaults to `flush: 'post'`, so its callback lands after a tick. */
const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 20))

/** Run `observe` over `read`, poke the value, and report what the observer saw. */
function pairing<T>(
  make: () => T,
  read: (subject: T) => unknown,
  poke: (subject: T) => void,
  observe: (fn: () => void) => void,
): unknown[] {
  const subject = make()
  const seen: unknown[] = []

  observe(() => { seen.push(read(subject)) })
  poke(subject)

  return seen
}

describe('every producer is seen by every consumer', () => {
  it('reactive() is tracked by effect()', () => {
    // One of the four that were inert. `effect` lived in the other module, so
    // the proxy's read recorded nothing and the effect never re-ran.
    expect(pairing(() => reactive({ n: 0 }), o => o.n, (o) => { o.n = 1 }, fn => effect(fn)))
      .toEqual([0, 1])
  })

  it('reactive() is tracked by watchEffect()', () => {
    expect(pairing(() => reactive({ n: 0 }), o => o.n, (o) => { o.n = 1 }, fn => watchEffect(fn)))
      .toEqual([0, 1])
  })

  it('ref() is tracked by effect()', () => {
    expect(pairing(() => ref(0), r => r.value, (r) => { r.value = 1 }, fn => effect(fn)))
      .toEqual([0, 1])
  })

  it('ref() is tracked by watchEffect()', () => {
    expect(pairing(() => ref(0), r => r.value, (r) => { r.value = 1 }, fn => watchEffect(fn)))
      .toEqual([0, 1])
  })

  it('state() is tracked by effect()', () => {
    expect(pairing(() => state(0), s => s(), (s) => { s.set(1) }, fn => effect(fn)))
      .toEqual([0, 1])
  })

  it('state() is tracked by watchEffect()', () => {
    expect(pairing(() => state(0), s => s(), (s) => { s.set(1) }, fn => watchEffect(fn)))
      .toEqual([0, 1])
  })
})

describe('the derived forms cross the seam too', () => {
  it('computed() recomputes from a state()', () => {
    // `computed` is reactivity.ts's; `state` is signals-api's.
    const n = state(1)
    const double = computed(() => n() * 2)

    expect(double.value).toBe(2)
    n.set(5)
    expect(double.value).toBe(10)
  })

  it('derived() recomputes from a ref()', () => {
    const n = ref(1)
    const double = derived(() => n.value * 2)

    expect(double()).toBe(2)
    n.value = 5
    expect(double()).toBe(10)
  })

  it('derived() recomputes from a reactive() property', () => {
    const o = reactive({ n: 1 })
    const double = derived(() => o.n * 2)

    expect(double()).toBe(2)
    o.n = 5
    expect(double()).toBe(10)
  })

  it('watch() fires for a reactive() property', async () => {
    const o = reactive({ n: 1 })
    const seen: number[] = []

    watch(() => o.n, (value) => { seen.push(value) })
    o.n = 7
    await flush()

    expect(seen).toEqual([7])
  })

  it('watch() fires for a state(), which is already a getter', async () => {
    // A Signal is callable, so it takes `watch`'s function-source branch. This
    // pins that it stays true — the alternative reading, `source.value` on a
    // Signal, is `undefined` and compares equal to itself forever.
    const n = state(1)
    const seen: number[] = []

    watch(n as unknown as () => number, (value) => { seen.push(value) })
    n.set(2)
    await flush()

    expect(seen).toEqual([2])
  })
})

describe('batch() covers both halves', () => {
  it('coalesces a ref and a state written together', () => {
    /*
     * The same seam on the write side. `batch()` lived in signals-api and only
     * deferred signals-api's notifications, so a ref written inside a batch
     * notified immediately and the effect ran twice — once for the eager ref,
     * once at the flush.
     */
    const a = ref(1)
    const b = state(1)
    let runs = 0

    effect(() => { void a.value; void b(); runs++ })
    const before = runs

    batch(() => {
      a.value = 2
      b.set(2)
    })

    expect(runs - before).toBe(1)
  })

  it('coalesces two writes to one reactive() object', () => {
    const o = reactive({ a: 1, b: 1 })
    let runs = 0

    effect(() => { void o.a; void o.b; runs++ })
    const before = runs

    batch(() => {
      o.a = 2
      o.b = 2
    })

    expect(runs - before).toBe(1)
  })

  it('flushes once for a nested batch, not at the inner exit', () => {
    const a = ref(1)
    let runs = 0

    effect(() => { void a.value; runs++ })
    const before = runs

    batch(() => {
      a.value = 2
      batch(() => { a.value = 3 })
      a.value = 4
    })

    expect(runs - before).toBe(1)
  })
})

describe('sharing the tracker did not widen it', () => {
  it('peek() still suppresses a ref read', () => {
    const a = ref(1)
    let runs = 0

    effect(() => { peek(() => a.value); runs++ })
    const before = runs
    a.value = 99

    expect(runs).toBe(before)
  })

  it('an inner effect does not steal the outer effect\'s dependencies', () => {
    /*
     * The failure mode of one shared variable done wrong: if the inner effect
     * clears the subscriber instead of restoring the outer one, every read
     * after it subscribes nothing — or worse, subscribes the inner effect, and
     * the outer runs on changes it never read.
     */
    const a = state(1)
    const b = state(1)
    let outer = 0

    effect(() => {
      outer++
      void a()
      effect(() => { void b() })
    })

    const before = outer
    b.set(2)

    expect(outer).toBe(before)
  })

  it('an effect still tracks what it reads after a nested one returns', () => {
    const a = state(1)
    const b = state(1)
    let outer = 0

    effect(() => {
      outer++
      effect(() => { void b() })
      void a()
    })

    const before = outer
    a.set(2)

    expect(outer).toBe(before + 1)
  })
})
