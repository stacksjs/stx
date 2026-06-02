/**
 * Dual-impl parity for useOptimistic (stacksjs/stx#1742, #1712).
 *
 * useOptimistic lives in BOTH reactive implementations — signals-api.ts (module
 * path) and the runtime template literal in signals.ts (window.stx). Both must
 * behave identically. This pins the contract against both so a fix to one side
 * can't silently regress the other (see test/reactivity/dual-impl-parity.test.ts).
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import * as api from '../../src/signals-api'
import { generateSignalsRuntimeDev } from '../../src/signals'

interface OptimisticImpl {
  state: <T>(initial: T) => { (): T, set: (v: T) => void }
  useOptimistic: <T, A>(
    base: { (): T } | (() => T) | T,
    reducer: (cur: T, action: A) => T,
  ) => [{ (): T }, (action: A, settleWhen?: PromiseLike<unknown>) => () => void]
}

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

function getImpls(): Record<string, OptimisticImpl> {
  // eslint-disable-next-line ts/no-explicit-any
  const runtimeStx = (globalThis as any).window?.stx as OptimisticImpl
  return {
    'signals-api': api as unknown as OptimisticImpl,
    'runtime': runtimeStx,
  }
}

for (const name of ['signals-api', 'runtime'] as const) {
  describe(`useOptimistic parity (${name})`, () => {
    let impl: OptimisticImpl
    beforeAll(() => {
      impl = getImpls()[name]
      if (!impl?.useOptimistic)
        throw new Error(`impl ${name} missing useOptimistic — setup failed`)
    })

    it('reflects base when there are no pending actions', () => {
      const likes = impl.state(10)
      const [optimistic] = impl.useOptimistic<number, number>(likes, (c, d) => c + d)
      expect(optimistic()).toBe(10)
    })

    it('applies queued actions immediately and folds them', () => {
      const likes = impl.state(10)
      const [optimistic, add] = impl.useOptimistic<number, number>(likes, (c, d) => c + d)
      add(1)
      expect(optimistic()).toBe(11)
      add(5)
      expect(optimistic()).toBe(16)
    })

    it('discards the overlay when base changes (happy path)', () => {
      const likes = impl.state(10)
      const [optimistic, add] = impl.useOptimistic<number, number>(likes, (c, d) => c + d)
      add(1)
      expect(optimistic()).toBe(11)
      likes.set(11)
      expect(optimistic()).toBe(11)
      likes.set(20)
      expect(optimistic()).toBe(20)
    })

    it('rolls back via settle() (error path)', () => {
      const likes = impl.state(10)
      const [optimistic, add] = impl.useOptimistic<number, number>(likes, (c, d) => c + d)
      const settle = add(1)
      expect(optimistic()).toBe(11)
      settle()
      expect(optimistic()).toBe(10)
    })

    it('settle removes only its own entry among identical values', () => {
      const n = impl.state(0)
      const [optimistic, add] = impl.useOptimistic<number, number>(n, (c, d) => c + d)
      const settleA = add(1)
      add(1)
      expect(optimistic()).toBe(2)
      settleA()
      expect(optimistic()).toBe(1)
    })

    it('accepts a plain (non-signal) base', () => {
      const [optimistic, add] = impl.useOptimistic<number, number>(10, (c, d) => c + d)
      expect(optimistic()).toBe(10)
      add(3)
      expect(optimistic()).toBe(13)
    })
  })
}
