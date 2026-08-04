/**
 * Module-path lifecycle hooks actually run (stacksjs/stx#1811).
 *
 * `signals-api`'s `mountCallbacks` and `destroyCallbacks` were written and
 * never read: `onMount` and `onDestroy` pushed, and nothing anywhere drained
 * them.
 *
 * Two consequences, and the first is the one that bites. A composable
 * registering cleanup via `onDestroy` got no cleanup — silently. The code reads
 * as correct, passes review, and does nothing; that is how the `useClipboard`
 * timer leak in #1805 survived being "fixed". The second is a slow leak: with
 * nothing clearing the arrays, every registration retained its closure for the
 * life of the process, and the retained objects were exactly the ones the
 * author expected to be released.
 *
 * The client runtime drains its equivalents, so this was also a breach of the
 * dual-implementation parity CLAUDE.md item 40 requires — the same public API
 * doing something on one side and nothing on the other.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  onDestroy,
  onMount,
  pendingLifecycleCounts,
  runDestroyCallbacks,
  runMountCallbacks,
} from '../../src/signals-api'

beforeEach(() => {
  // Queues are module-global, so drain whatever an earlier test left behind.
  runMountCallbacks()
  runDestroyCallbacks()
})

afterEach(() => {
  runMountCallbacks()
  runDestroyCallbacks()
})

describe('onDestroy on the module path', () => {
  it('runs a registered callback', () => {
    // The whole defect: there was no way to make this true.
    let ran = false
    onDestroy(() => { ran = true })

    runDestroyCallbacks()

    expect(ran).toBe(true)
  })

  it('runs callbacks in registration order', () => {
    const order: number[] = []
    onDestroy(() => order.push(1))
    onDestroy(() => order.push(2))
    onDestroy(() => order.push(3))

    runDestroyCallbacks()

    expect(order).toEqual([1, 2, 3])
  })

  it('clears the queue, so a second drain is a no-op', () => {
    // This is the leak half: nothing cleared, so closures were retained for the
    // life of the process.
    let calls = 0
    onDestroy(() => { calls++ })

    runDestroyCallbacks()
    runDestroyCallbacks()

    expect(calls).toBe(1)
    expect(pendingLifecycleCounts().destroy).toBe(0)
  })

  it('contains a throwing callback so the rest still run', () => {
    // Same lesson as the page-setup loop in #1805: one bad hook must not cost
    // every hook after it.
    const ran: string[] = []
    const realError = console.error
    console.error = () => {}
    try {
      onDestroy(() => { throw new Error('boom') })
      onDestroy(() => { ran.push('after') })
      runDestroyCallbacks()
    }
    finally {
      console.error = realError
    }

    expect(ran).toEqual(['after'])
  })

  it('queues a callback registered during a drain for the next one', () => {
    // Draining before invoking keeps a self-registering hook from recursing.
    let inner = 0
    onDestroy(() => { onDestroy(() => { inner++ }) })

    runDestroyCallbacks()
    expect(inner).toBe(0)

    runDestroyCallbacks()
    expect(inner).toBe(1)
  })
})

describe('onMount on the module path', () => {
  it('runs and clears', () => {
    let ran = false
    onMount(() => { ran = true })

    runMountCallbacks()

    expect(ran).toBe(true)
    expect(pendingLifecycleCounts().mount).toBe(0)
  })

  it('does not run destroy callbacks', () => {
    let destroyed = false
    onDestroy(() => { destroyed = true })

    runMountCallbacks()

    expect(destroyed).toBe(false)
  })
})

describe('the queues do not grow without bound', () => {
  it('reports zero pending after a drain', () => {
    for (let i = 0; i < 50; i++) {
      onMount(() => {})
      onDestroy(() => {})
    }
    expect(pendingLifecycleCounts()).toEqual({ mount: 50, destroy: 50 })

    runMountCallbacks()
    runDestroyCallbacks()

    expect(pendingLifecycleCounts()).toEqual({ mount: 0, destroy: 0 })
  })
})
