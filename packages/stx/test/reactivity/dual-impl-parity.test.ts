/**
 * Dual-implementation parity tests.
 *
 * stx ships two independent reactive implementations:
 *   1. `packages/stx/src/signals-api.ts` — module-import path. Used by
 *      composables/tests/SSR contexts that don't go through the stx
 *      bundler. Self-contained subscriber sets, effect tracking, etc.
 *   2. The runtime template literal inside `packages/stx/src/signals.ts`
 *      — generated as a JS string and injected into client pages.
 *      Owns its own state.
 *
 * They have no shared state — a signal created in one is invisible to
 * the other. The bundler rewrites client-side imports to use the
 * runtime version; everything else uses signals-api.ts.
 *
 * Two independent impls of the same public API is real architectural
 * debt (see stacksjs/stx#1712). These tests pin both impls' behavior
 * to the same contract so future fixes to one (e.g. the watch() polling
 * refactor from #1713) don't silently regress parity.
 *
 * When this file fails on one impl and passes on the other, the divergence
 * is real — fix the lagging side or update the contract here intentionally.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import * as api from '../../src/signals-api'
import { watch as reactivityWatch } from '../../src/reactivity'
import { generateSignalsRuntimeDev } from '../../src/signals'

interface ReactiveImpl {
  state: <T>(initial: T) => {
    (): T
    set: (v: T) => void
    update: (fn: (v: T) => T) => void
    subscribe: (cb: (next: T, prev: T) => void) => () => void
    value: T
    _isSignal: true
  }
  derived: <T>(fn: () => T) => { (): T, readonly value: T, _isDerived: true }
  effect: (fn: () => void) => () => void
  batch: (fn: () => void) => void
  untrack: <T>(v: unknown) => T
  peek: <T>(fn: () => T) => T
  isSignal: (v: unknown) => boolean
  isDerived?: (v: unknown) => boolean
}

// Populate window.stx by executing the generated runtime in happy-dom.
// Done once per test file — the runtime is idempotent on re-execution
// (initializer guards check for existing window.stx).
beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

function getImpls(): Record<string, ReactiveImpl> {
  // happy-dom puts a `window` global on `globalThis`; the runtime IIFE
  // populates `window.stx` when executed. Cast via `any` is intentional —
  // globalThis's nominal type doesn't include the happy-dom shape.
  // eslint-disable-next-line ts/no-explicit-any
  const runtimeStx = (globalThis as any).window?.stx as ReactiveImpl
  return {
    'signals-api': api as unknown as ReactiveImpl,
    'runtime': runtimeStx,
  }
}

// ── Parametric describe ─────────────────────────────────────────────────
// Same suite runs against both impls. Both must pass for the contract
// to be considered honored.

for (const name of ['signals-api', 'runtime'] as const) {
  describe(`reactive parity (${name})`, () => {
    let impl: ReactiveImpl
    beforeAll(() => {
      impl = getImpls()[name]
      if (!impl)
        throw new Error(`impl ${name} not available — happy-dom or runtime setup failed`)
    })

    // ── state() basics ──
    it('state() returns the initial value', () => {
      expect(impl.state(42)()).toBe(42)
      expect(impl.state('hello')()).toBe('hello')
      expect(impl.state(null)()).toBe(null)
      expect(impl.state([1, 2, 3])()).toEqual([1, 2, 3])
    })

    it('state.set updates the value', () => {
      const s = impl.state(0)
      s.set(7)
      expect(s()).toBe(7)
    })

    it('state.update transforms the value via a function', () => {
      const s = impl.state(1)
      s.update(v => v + 1)
      expect(s()).toBe(2)
      s.update(v => v * 10)
      expect(s()).toBe(20)
    })

    it('state.value reads and writes the signal', () => {
      const s = impl.state(3)
      expect(s.value).toBe(3)
      s.value = 8
      expect(s()).toBe(8)
    })

    it('state.subscribe fires on .set() with new + previous values', () => {
      const s = impl.state(0)
      const seen: Array<[unknown, unknown]> = []
      s.subscribe((next, prev) => seen.push([next, prev]))
      s.set(1)
      s.set(2)
      expect(seen).toEqual([[1, 0], [2, 1]])
    })

    it('state.subscribe does not fire when value is the same (Object.is)', () => {
      const s = impl.state(5)
      let calls = 0
      s.subscribe(() => { calls++ })
      s.set(5) // identical value
      expect(calls).toBe(0)
    })

    it('state.subscribe returns an unsubscribe function', () => {
      const s = impl.state(0)
      let calls = 0
      const unsub = s.subscribe(() => { calls++ })
      s.set(1)
      expect(calls).toBe(1)
      unsub()
      s.set(2)
      expect(calls).toBe(1) // no further calls after unsubscribe
    })

    it('state has the _isSignal brand', () => {
      expect(impl.state(0)._isSignal).toBe(true)
    })

    // ── isSignal ──
    it('isSignal returns true for state() result', () => {
      expect(impl.isSignal(impl.state(0))).toBe(true)
    })

    it('isSignal returns false for plain values', () => {
      expect(impl.isSignal(42)).toBe(false)
      expect(impl.isSignal('foo')).toBe(false)
      expect(impl.isSignal(null)).toBe(false)
      expect(impl.isSignal(undefined)).toBe(false)
      expect(impl.isSignal({ value: 1 })).toBe(false)
      expect(impl.isSignal(() => 1)).toBe(false)
    })

    // ── derived() ──
    it('derived computes from a single state', () => {
      const count = impl.state(2)
      const doubled = impl.derived(() => count() * 2)
      expect(doubled()).toBe(4)
      count.set(5)
      expect(doubled()).toBe(10)
    })

    it('derived combines multiple states', () => {
      const a = impl.state(3)
      const b = impl.state(4)
      const sum = impl.derived(() => a() + b())
      expect(sum()).toBe(7)
      a.set(10)
      expect(sum()).toBe(14)
      b.set(20)
      expect(sum()).toBe(30)
    })

    it('derived.value reads the current computed value', () => {
      const source = impl.state(4)
      const doubled = impl.derived(() => source() * 2)
      expect(doubled.value).toBe(8)
      source.set(6)
      expect(doubled.value).toBe(12)
    })

    it('derived carries the _isDerived brand (not _isSignal — that is for state only)', () => {
      const d = impl.derived(() => 1)
      // Both impls deliberately distinguish state (_isSignal) from derived
      // (_isDerived) so callers can branch on which kind they have. The
      // public stx.d.ts type previously declared `_isSignal: true` on
      // derived — that was wrong; corrected to match implementation.
      expect((d as { _isDerived?: boolean })._isDerived).toBe(true)
      expect(impl.isSignal(d)).toBe(false)
      if (impl.isDerived)
        expect(impl.isDerived(d)).toBe(true)
    })

    // ── effect() ──
    it('effect runs immediately on creation', () => {
      let calls = 0
      impl.effect(() => { calls++ })
      expect(calls).toBe(1)
    })

    it('effect re-runs when a tracked signal changes', () => {
      const s = impl.state(0)
      const seen: number[] = []
      impl.effect(() => { seen.push(s()) })
      expect(seen).toEqual([0])
      s.set(1)
      s.set(2)
      // Allow for batching / scheduling: at minimum the final value lands,
      // and there was at least one extra run beyond the initial.
      expect(seen[seen.length - 1]).toBe(2)
      expect(seen.length).toBeGreaterThanOrEqual(2)
    })

    it('effect does NOT re-run when an untracked signal changes', () => {
      const tracked = impl.state(0)
      const untracked = impl.state(0)
      let calls = 0
      impl.effect(() => {
        tracked() // tracked
        calls++
      })
      const before = calls
      untracked.set(99) // shouldn't fire
      expect(calls).toBe(before)
    })

    // ── batch() ──
    it('batch coalesces multiple sets into one effect run', () => {
      const s = impl.state(0)
      let runs = 0
      impl.effect(() => { s(); runs++ })
      const initial = runs // 1 after initial run
      impl.batch(() => {
        s.set(1)
        s.set(2)
        s.set(3)
      })
      // Should have at most one additional run, not three.
      expect(runs - initial).toBeLessThanOrEqual(1)
      expect(s()).toBe(3)
    })

    // ── untrack() ──
    it('untrack returns the value of a signal', () => {
      const s = impl.state(99)
      // Explicit generic — untrack<T>(unknown): T can't infer T from an
      // `unknown` parameter, so toBe()'s strict overload matching fails
      // without it.
      expect(impl.untrack<number>(s)).toBe(99)
    })

    it('untrack passes through non-signal values unchanged', () => {
      expect(impl.untrack<number>(42)).toBe(42)
      expect(impl.untrack<string>('hi')).toBe('hi')
    })

    // ── peek() ──
    it('peek runs the function without subscribing the current effect', () => {
      const s = impl.state(0)
      let calls = 0
      impl.effect(() => {
        calls++
        impl.peek(() => s()) // read inside peek — must NOT track
      })
      const before = calls
      s.set(1)
      // No tracked dep → effect should not re-fire.
      expect(calls).toBe(before)
    })

    // ── one change, one run ──
    it('an effect reading a signal directly and through a derived runs once per change', () => {
      const user = impl.state({ id: 1 })
      const signedIn = impl.derived(() => user().id > 0)
      const seen: string[] = []
      impl.effect(() => {
        seen.push(`${user().id}:${signedIn()}`)
      })
      seen.length = 0
      user.set({ id: 0 })
      // Once, and never against the derived's old value ("0:true").
      expect(seen).toEqual(['0:false'])
    })

    it('an effect reached through two deriveds of one signal runs once per change', () => {
      const n = impl.state(1)
      const double = impl.derived(() => n() * 2)
      const triple = impl.derived(() => n() * 3)
      const seen: number[] = []
      impl.effect(() => {
        seen.push(double() + triple())
      })
      seen.length = 0
      n.set(2)
      expect(seen).toEqual([10])
    })

    it('a derived read inside batch() is current', () => {
      const n = impl.state(1)
      const double = impl.derived(() => n() * 2)
      impl.effect(() => {
        double()
      })
      let inside = 0
      impl.batch(() => {
        n.set(5)
        inside = double()
      })
      expect(inside).toBe(10)
    })
  })
}

// ── watch / memo / untrack ──────────────────────────────────────────────
// The module watch is reactivity.ts's (what `import { watch } from
// '@stacksjs/stx'` gives); the runtime's is window.stx.watch. Both used to
// differ: the runtime aliased $watch, which called a getter source's callback
// once with the getter itself, and a signal source's at once and on every
// write with no previous value.

interface WatchImpl {
  state: ReactiveImpl['state']
  derived: <T>(fn: () => T, options?: { equals?: (a: T, b: T) => boolean }) => { (): T }
  memo: <T>(fn: () => T, equals?: (a: T, b: T) => boolean) => { (): T }
  effect: ReactiveImpl['effect']
  batch: ReactiveImpl['batch']
  untrack: ReactiveImpl['untrack']
  watch: (source: unknown, cb: (next: any, prev: any) => void, options?: { immediate?: boolean, deep?: boolean, flush?: 'sync' | 'pre' | 'post', once?: boolean }) => () => void
}

const tick = (ms = 40): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

function getWatchImpls(): Record<string, WatchImpl> {
  // eslint-disable-next-line ts/no-explicit-any
  const runtimeStx = (globalThis as any).window?.stx as WatchImpl
  return {
    'signals-api': { ...(api as unknown as WatchImpl), watch: reactivityWatch as unknown as WatchImpl['watch'] },
    'runtime': runtimeStx,
  }
}

for (const name of ['signals-api', 'runtime'] as const) {
  describe(`watch / memo / untrack parity (${name})`, () => {
    let impl: WatchImpl
    beforeAll(() => {
      impl = getWatchImpls()[name]
    })

    it('watch(signal) does not call back at creation, then passes the new and old value', () => {
      const count = impl.state(1)
      const seen: unknown[] = []
      impl.watch(count, (next, prev) => seen.push([next, prev]), { flush: 'sync' })
      expect(seen).toEqual([])
      count.set(2)
      count.set(3)
      expect(seen).toEqual([[2, 1], [3, 2]])
    })

    it('watch(getter) calls back with values, only when the value changes', () => {
      const user = impl.state({ id: 1, name: 'Ada' })
      const seen: unknown[] = []
      const stop = impl.watch(() => user().id, (next, prev) => seen.push([next, prev]), { flush: 'sync' })
      expect(typeof stop).toBe('function')
      user.set({ id: 1, name: 'Ada L.' })
      expect(seen).toEqual([])
      user.set({ id: 2, name: 'Grace' })
      expect(seen).toEqual([[2, 1]])
    })

    it('watch(derived) follows the derived value', () => {
      const n = impl.state(2)
      const double = impl.derived(() => n() * 2)
      const seen: number[] = []
      impl.watch(double, next => seen.push(next), { flush: 'sync' })
      n.set(5)
      expect(seen).toEqual([10])
    })

    it('immediate calls back at once with no previous value', () => {
      const count = impl.state(7)
      const seen: unknown[] = []
      impl.watch(count, (next, prev) => seen.push([next, prev]), { immediate: true, flush: 'sync' })
      expect(seen).toEqual([[7, undefined]])
      count.set(8)
      expect(seen).toEqual([[7, undefined], [8, 7]])
    })

    it('an immediate watch is still called back only on a change afterwards', () => {
      const user = impl.state({ id: 1 })
      let calls = 0
      impl.watch(() => user().id, () => { calls++ }, { immediate: true, flush: 'sync' })
      user.set({ id: 1 })
      user.set({ id: 1 })
      expect(calls).toBe(1)
    })

    it('an array of sources passes arrays of values', () => {
      const a = impl.state(1)
      const b = impl.state('x')
      const seen: unknown[] = []
      impl.watch([a, () => b()], (next, prev) => seen.push([next, prev]), { flush: 'sync' })
      a.set(2)
      b.set('y')
      expect(seen).toEqual([[[2, 'x'], [1, 'x']], [[2, 'y'], [2, 'x']]])
    })

    it('once stops after the first call', () => {
      const count = impl.state(0)
      const seen: number[] = []
      impl.watch(count, next => seen.push(next), { flush: 'sync', once: true })
      count.set(1)
      count.set(2)
      expect(seen).toEqual([1])
    })

    it('the stop function stops it', () => {
      const count = impl.state(0)
      let calls = 0
      const stop = impl.watch(count, () => { calls++ }, { flush: 'sync' })
      count.set(1)
      stop()
      count.set(2)
      expect(calls).toBe(1)
    })

    it('what the callback reads is not followed', () => {
      const count = impl.state(0)
      const other = impl.state(0)
      let calls = 0
      impl.watch(count, () => { other(); calls++ }, { flush: 'sync' })
      count.set(1)
      other.set(1)
      expect(calls).toBe(1)
    })

    it('by default calls back after the change, once for several, with the latest value', async () => {
      const count = impl.state(0)
      const seen: unknown[] = []
      impl.watch(count, (next, prev) => seen.push([next, prev]))
      count.set(1)
      count.set(2)
      expect(seen).toEqual([])
      await tick()
      expect(seen).toEqual([[2, 0]])
    })

    it('deep compares structurally: an equal copy is not a change', () => {
      const list = impl.state([{ id: 1 }])
      const seen: unknown[] = []
      impl.watch(() => list(), next => seen.push(next), { deep: true, flush: 'sync' })
      list.set([{ id: 1 }])
      expect(seen).toEqual([])
      list.set([{ id: 1 }, { id: 2 }])
      expect(seen).toEqual([[{ id: 1 }, { id: 2 }]])
    })

    it('memo: an effect over memo(() => user().id) runs once for two same-id writes', () => {
      const user = impl.state({ id: 1, name: 'Ada' })
      const id = impl.memo(() => user().id)
      let runs = 0
      impl.effect(() => { id(); runs++ })
      user.set({ id: 1, name: 'Ada L.' })
      user.set({ id: 1, name: 'Ada Lovelace' })
      expect(runs).toBe(1)
      user.set({ id: 2, name: 'Grace' })
      expect(runs).toBe(2)
      expect(id()).toBe(2)
    })

    it('derived(fn, { equals }) passes a change on only when equals says it differs', () => {
      const list = impl.state([1, 2])
      const sameLength = (a: number[], b: number[]) => a.length === b.length
      const kept = impl.derived(() => list().slice(), { equals: sameLength })
      let runs = 0
      impl.effect(() => { kept(); runs++ })
      list.set([3, 4])
      expect(runs).toBe(1)
      list.set([3, 4, 5])
      expect(runs).toBe(2)
    })

    it('memo: an effect reading the source directly and through a memo runs once per change', () => {
      const user = impl.state({ id: 1 })
      const id = impl.memo(() => user().id)
      const seen: string[] = []
      impl.effect(() => { seen.push(`${user().id}:${id()}`) })
      seen.length = 0
      user.set({ id: 2 })
      expect(seen).toEqual(['2:2'])
      user.set({ id: 2 })
      expect(seen).toEqual(['2:2', '2:2'])
    })

    it('memo feeds deriveds and stops a change that leaves it equal', () => {
      const n = impl.state(1)
      const parity = impl.memo(() => n() % 2)
      const label = impl.derived(() => (parity() ? 'odd' : 'even'))
      const seen: string[] = []
      impl.effect(() => { seen.push(label()) })
      n.set(3)
      n.set(4)
      expect(seen).toEqual(['odd', 'even'])
    })

    it('memo inside batch() runs its readers once, against the final value', () => {
      const a = impl.state(1)
      const b = impl.state(1)
      const sum = impl.memo(() => a() + b())
      const seen: number[] = []
      impl.effect(() => { seen.push(sum()) })
      impl.batch(() => {
        a.set(2)
        b.set(3)
      })
      expect(seen).toEqual([2, 5])
    })

    it('memo with nothing reading it stays lazy', () => {
      const n = impl.state(1)
      let computes = 0
      const m = impl.memo(() => { computes++; return n() })
      expect(m()).toBe(1)
      n.set(2)
      n.set(3)
      expect(computes).toBe(1)
      expect(m()).toBe(3)
      expect(computes).toBe(2)
    })

    it('untrack(signal) inside an effect does not subscribe it', () => {
      const s = impl.state(0)
      let runs = 0
      impl.effect(() => { impl.untrack(s); runs++ })
      s.set(1)
      s.set(2)
      expect(runs).toBe(1)
      expect(impl.untrack<number>(s)).toBe(2)
    })
  })
}
