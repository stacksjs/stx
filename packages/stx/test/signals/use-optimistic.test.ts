/**
 * useOptimistic — React-19-style optimistic state for signals (stacksjs/stx#1742).
 */
import { describe, expect, it } from 'bun:test'
import { state, useOptimistic } from '../../src/signals-api'

describe('useOptimistic (module impl)', () => {
  it('shows the base value with no pending actions', () => {
    const likes = state(10)
    const [optimistic] = useOptimistic(likes, (cur: number, d: number) => cur + d)
    expect(optimistic()).toBe(10)
  })

  it('applies a queued optimistic action immediately', () => {
    const likes = state(10)
    const [optimistic, addOptimistic] = useOptimistic(likes, (cur: number, d: number) => cur + d)
    addOptimistic(1)
    expect(optimistic()).toBe(11)
  })

  it('folds multiple pending actions through the reducer', () => {
    const likes = state(10)
    const [optimistic, addOptimistic] = useOptimistic(likes, (cur: number, d: number) => cur + d)
    addOptimistic(1)
    addOptimistic(5)
    expect(optimistic()).toBe(16)
  })

  it('discards the overlay automatically when base changes (happy path)', () => {
    const likes = state(10)
    const [optimistic, addOptimistic] = useOptimistic(likes, (cur: number, d: number) => cur + d)
    addOptimistic(1)
    expect(optimistic()).toBe(11)
    // The real update lands — base is now the source of truth, overlay cleared.
    likes.set(11)
    expect(optimistic()).toBe(11)
    // A subsequent base change is reflected with no stale overlay.
    likes.set(20)
    expect(optimistic()).toBe(20)
  })

  it('rolls back via the returned settle() (error path)', () => {
    const likes = state(10)
    const [optimistic, addOptimistic] = useOptimistic(likes, (cur: number, d: number) => cur + d)
    const settle = addOptimistic(1)
    expect(optimistic()).toBe(11)
    // base never changed (the action failed) — settle reverts.
    settle()
    expect(optimistic()).toBe(10)
  })

  it('settle removes only its own entry, even with identical action values', () => {
    const likes = state(0)
    const [optimistic, addOptimistic] = useOptimistic(likes, (cur: number, d: number) => cur + d)
    const settleA = addOptimistic(1)
    addOptimistic(1)
    expect(optimistic()).toBe(2)
    settleA()
    expect(optimistic()).toBe(1) // only one of the two +1 entries removed
  })

  it('auto-settles when the settleWhen promise rejects (auto-rollback)', async () => {
    const likes = state(10)
    const [optimistic, addOptimistic] = useOptimistic(likes, (cur: number, d: number) => cur + d)
    const failing = Promise.reject(new Error('boom'))
    addOptimistic(1, failing)
    expect(optimistic()).toBe(11) // optimistic immediately
    await failing.catch(() => {}) // let the rejection settle
    await Promise.resolve() // flush the .then(settle) microtask
    expect(optimistic()).toBe(10) // rolled back
  })

  it('accepts a plain (non-signal) base value', () => {
    const [optimistic, addOptimistic] = useOptimistic(10, (cur: number, d: number) => cur + d)
    expect(optimistic()).toBe(10)
    addOptimistic(3)
    expect(optimistic()).toBe(13)
  })

  it('supports non-numeric reducers (e.g. list append)', () => {
    const items = state<string[]>(['a'])
    const [optimistic, addOptimistic] = useOptimistic(
      items,
      (cur: string[], next: string) => [...cur, next],
    )
    addOptimistic('b')
    expect(optimistic()).toEqual(['a', 'b'])
    items.set(['a', 'b']) // confirmed
    expect(optimistic()).toEqual(['a', 'b'])
  })
})
