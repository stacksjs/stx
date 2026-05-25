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
import { generateSignalsRuntimeDev } from '../../src/signals'

interface ReactiveImpl {
  state: <T>(initial: T) => {
    (): T
    set: (v: T) => void
    update: (fn: (v: T) => T) => void
    subscribe: (cb: (next: T, prev: T) => void) => () => void
    _isSignal: true
  }
  derived: <T>(fn: () => T) => { (): T, _isDerived: true }
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
  return {
    'signals-api': api as unknown as ReactiveImpl,
    'runtime': (globalThis as { window?: { stx?: ReactiveImpl } }).window?.stx as ReactiveImpl,
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
      expect(impl.untrack(s)).toBe(99)
    })

    it('untrack passes through non-signal values unchanged', () => {
      expect(impl.untrack(42)).toBe(42)
      expect(impl.untrack('hi')).toBe('hi')
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
  })
}
