/**
 * A mount callback's returned cleanup actually runs (stacksjs/stx#1857).
 *
 * `LifecycleCallback` has always declared the `() => cleanup` return, and the
 * two component-factory paths honoured it. Every other flush site in the
 * generated runtime called `fn()` and dropped the result, so the teardown
 * never ran and nothing said so. A listener or timer registered that way
 * outlived its element and leaked once per re-render — the failure mode is
 * silent, which is why it survived: the code reads as correct.
 *
 * The module-side `drain()` in signals-api.ts had the same hole.
 *
 * Asserted by running the real callbacks rather than by matching runtime
 * source text. The existing source-text assertions in scope-lifecycle.test.ts
 * and component-scoping.test.ts pin the shape of the emitted code; they cannot
 * tell whether the cleanup is ever invoked.
 */
import { describe, expect, it } from 'bun:test'
import {
  onDestroy,
  onMount,
  pendingLifecycleCounts,
  runDestroyCallbacks,
  runMountCallbacks,
} from '../../src/signals-api'

describe('mount cleanup, module side (#1857)', () => {
  it('runs a cleanup returned by onMount when destroy callbacks run', () => {
    const order: string[] = []

    onMount(() => {
      order.push('mount')
      return () => order.push('cleanup')
    })

    runMountCallbacks()
    // The cleanup must NOT have run yet — it is teardown, not part of mount.
    expect(order).toEqual(['mount'])

    runDestroyCallbacks()
    expect(order).toEqual(['mount', 'cleanup'])
  })

  it('leaves the queues empty afterwards', () => {
    onMount(() => () => {})
    runMountCallbacks()
    runDestroyCallbacks()
    expect(pendingLifecycleCounts()).toEqual({ mount: 0, destroy: 0 })
  })

  it('ignores a non-function return', () => {
    const order: string[] = []
    // Returning a value is legal and common — an async callback returns a
    // promise. It must not be treated as a teardown.
    onMount(() => {
      order.push('mount')
      return 42 as unknown as undefined
    })

    runMountCallbacks()
    expect(() => runDestroyCallbacks()).not.toThrow()
    expect(order).toEqual(['mount'])
  })

  it('keeps cleanups from several mount callbacks', () => {
    const cleaned: string[] = []
    onMount(() => () => cleaned.push('a'))
    onMount(() => () => cleaned.push('b'))

    runMountCallbacks()
    runDestroyCallbacks()

    expect(cleaned.sort()).toEqual(['a', 'b'])
  })

  it('a throwing mount callback does not lose the others cleanups', () => {
    const cleaned: string[] = []
    onMount(() => () => cleaned.push('before'))
    onMount(() => { throw new Error('boom') })
    onMount(() => () => cleaned.push('after'))

    runMountCallbacks()
    runDestroyCallbacks()

    expect(cleaned.sort()).toEqual(['after', 'before'])
  })

  it('does not park a cleanup returned by a destroy callback', () => {
    let reruns = 0
    onDestroy(() => {
      // A cleanup returning a cleanup has nowhere meaningful to go. Parking it
      // back on the destroy queue would keep it alive across every later drain.
      return () => { reruns++ }
    })

    runDestroyCallbacks()
    runDestroyCallbacks()

    expect(reruns).toBe(0)
    expect(pendingLifecycleCounts().destroy).toBe(0)
  })
})

describe('mount cleanup, generated runtime (#1857)', () => {
  it('routes every flush through the capturing helper', async () => {
    const { generateSignalsRuntimeDev } = await import('../../src/signals')
    const runtime = generateSignalsRuntimeDev()

    // The defect was nine independent flush loops, of which two captured the
    // return. Any raw `forEach(fn => fn())` over a mount queue is a site that
    // silently drops cleanup again, so none may remain.
    expect(runtime).not.toMatch(/__mountCallbacks\.forEach/)
    expect(runtime).not.toMatch(/mountCallbacks\.forEach\(fn => fn\(\)\)/)

    // And the helper it was replaced with keeps the return value.
    expect(runtime).toContain('function runMountCallbacks(list, sink)')
    expect(runtime).toContain('if (typeof cleanup === \'function\') target.push(cleanup)')
  })

  it('gives scoped flushes the scope\'s own destroy queue', () => {
    // A scoped mount's cleanup belongs to that scope, not to the global queue,
    // or destroying one component would run another's teardown.
    const runtime = generateRuntime()
    expect(runtime).toContain('function scopeDestroySink(scopeVars)')
    expect(runtime).toContain('runMountCallbacks(scopeVars.__mountCallbacks, scopeDestroySink(scopeVars))')
  })
})

function generateRuntime(): string {
  // eslint-disable-next-line ts/no-require-imports
  return require('../../src/signals').generateSignalsRuntimeDev()
}
