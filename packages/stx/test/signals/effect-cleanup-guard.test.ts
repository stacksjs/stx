/**
 * Only a function is treated as an effect cleanup (stacksjs/stx#1886).
 *
 * `effect()` stored whatever the callback returned and called it on the next
 * run, guarded only by truthiness. An effect body is an expression at least as
 * often as it is a block, and an expression has a value:
 *
 *     effect(() => el.textContent = name())
 *
 * The concise arrow returns the assigned string, `if (cleanup)` is truthy for
 * any non-empty string, and the next run called it — "cleanup is not a
 * function". The most ordinary effect in any framework crashed, and only on
 * its SECOND run, which is why it read as correct in review and in any test
 * that set the signal once.
 *
 * Braced bodies return undefined and were unaffected, so the failure depended
 * on syntax rather than on semantics.
 *
 * Both implementations are covered: they are two implementations with a parity
 * contract (CLAUDE.md item 40), and the runtime's copy was the worse of the
 * two — its throw came from ABOVE the try block, so it escaped the effect
 * entirely and propagated out of whatever `.set()` triggered the notification,
 * taking unrelated subscribers down with it.
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { effect, state } from '../../src/signals-api'

describe('effect cleanup guard, module side (#1886)', () => {
  it('survives a body whose value is a string', () => {
    const name = state('a')
    const el = { textContent: '' }

    // No braces: the arrow RETURNS the assigned value.
    effect(() => el.textContent = name())
    expect(el.textContent).toBe('a')

    // Before the guard this threw "cleanup is not a function".
    expect(() => name.set('b')).not.toThrow()
    expect(el.textContent).toBe('b')
  })

  it('survives a body whose value is a number', () => {
    const n = state(0)
    const seen: number[] = []

    // Array.push returns the new length.
    effect(() => seen.push(n()))
    n.set(1)
    n.set(2)

    expect(seen).toEqual([0, 1, 2])
  })

  it('survives a body whose value is an object', () => {
    const n = state(0)
    let runs = 0
    effect(() => ({ value: n(), runs: runs++ }))
    expect(() => n.set(1)).not.toThrow()
    expect(runs).toBe(2)
  })

  it('still honours a real cleanup function', () => {
    // The guard must not throw the baby out: a returned FUNCTION is still a
    // cleanup and must still run before the next effect pass.
    const n = state(0)
    const order: string[] = []

    effect(() => {
      const v = n()
      order.push('run:' + v)
      return () => order.push('cleanup:' + v)
    })

    n.set(1)
    n.set(2)

    expect(order).toEqual(['run:0', 'cleanup:0', 'run:1', 'cleanup:1', 'run:2'])
  })

  it('runs the cleanup on dispose, and only if it is a function', () => {
    const n = state(0)
    const order: string[] = []

    const disposeReal = effect(() => {
      n()
      return () => order.push('disposed')
    })
    disposeReal()
    expect(order).toEqual(['disposed'])

    // A non-function return must make dispose a no-op rather than a throw.
    const m = state('x')
    const disposeValue = effect(() => m())
    expect(() => disposeValue()).not.toThrow()
  })

  it('does not carry a stale cleanup across a run that returns nothing', () => {
    const n = state(0)
    const order: string[] = []

    effect(() => {
      const v = n()
      if (v === 0)
        return () => order.push('cleanup-from-0')
      // Later runs return undefined — the earlier cleanup must not run again.
      order.push('run:' + v)
    })

    n.set(1)
    n.set(2)

    expect(order).toEqual(['cleanup-from-0', 'run:1', 'run:2'])
  })
})

describe('effect cleanup guard, generated runtime (#1886)', () => {
  it('stores a returned value only when it is a function', () => {
    const runtime = generateSignalsRuntimeDev()
    // Pinning the emitted shape: an unguarded `cleanup = fn()` is the defect.
    expect(runtime).toContain('typeof __result === \'function\' ? __result : undefined')
    expect(runtime).not.toMatch(/\n\s*cleanup = fn\(\);/)
  })
})
