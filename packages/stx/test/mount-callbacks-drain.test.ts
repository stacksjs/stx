import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(import.meta.dir, '../src/signals.ts'), 'utf-8')

/**
 * `runMountCallbacks` is the single place every onMount hook is flushed
 * through, and the browser runtime reaches it more than once per page: the
 * DOM-ready handler calls it inside the per-root hydration loop and then again
 * for the global pass, against the same shared `mountCallbacks` array.
 *
 * It used to iterate the array and leave it in place, clearing it only after
 * the second call — so every onMount on a page with a `data-stx` root ran
 * twice, and a page with N roots ran them N+1 times. Each duplicated hook
 * duplicated whatever it did: one dashboard page fetched `/auth/me` six times
 * and every data endpoint twice on a single load.
 */
describe('runMountCallbacks', () => {
  const body = (() => {
    const start = source.indexOf('function runMountCallbacks(list, sink)')
    expect(start).toBeGreaterThan(-1)
    return source.slice(start, start + 1400)
  })()

  it('drains the queue it is given', () => {
    expect(body).toContain('list.splice(0, list.length)')
  })

  it('drains before invoking, so a hook registering another is not lost', () => {
    const splice = body.indexOf('splice(0, list.length)')
    const invoke = body.indexOf('batch[i]()')
    expect(splice).toBeGreaterThan(-1)
    expect(invoke).toBeGreaterThan(-1)
    expect(splice).toBeLessThan(invoke)
  })

  it('invokes the drained batch, never the live list', () => {
    expect(body).toContain('batch[i]()')
    expect(body).not.toContain('list[i]()')
  })
})

/**
 * A tiny stand-in for the runtime's flush, mirroring the fixed implementation,
 * exercised the way the DOM-ready handler actually calls it.
 */
describe('drain semantics', () => {
  function runMountCallbacks(list: Array<() => unknown>, sink: Array<() => void>) {
    if (!list || !list.length) return
    const batch = list.splice(0, list.length)
    for (const fn of batch) {
      const cleanup = fn()
      if (typeof cleanup === 'function') sink.push(cleanup as () => void)
    }
  }

  it('runs each hook once across the loop pass and the global pass', () => {
    let calls = 0
    const queue = [() => { calls++ }]
    const sink: Array<() => void> = []
    runMountCallbacks(queue, sink) // per-root hydration loop
    runMountCallbacks(queue, sink) // global pass, same array
    expect(calls).toBe(1)
    expect(queue).toHaveLength(0)
  })

  it('runs each hook once no matter how many roots the page has', () => {
    let calls = 0
    const queue = [() => { calls++ }]
    const sink: Array<() => void> = []
    for (let root = 0; root < 4; root++) runMountCallbacks(queue, sink)
    runMountCallbacks(queue, sink)
    expect(calls).toBe(1)
  })

  it('still collects returned cleanups into the sink', () => {
    const sink: Array<() => void> = []
    runMountCallbacks([() => () => {}], sink)
    expect(sink).toHaveLength(1)
  })

  it('queues a hook registered from inside a hook for the next flush', () => {
    const order: string[] = []
    const sink: Array<() => void> = []
    const queue: Array<() => unknown> = []
    queue.push(() => { order.push('first'); queue.push(() => order.push('nested')) })
    runMountCallbacks(queue, sink)
    expect(order).toEqual(['first'])
    runMountCallbacks(queue, sink)
    expect(order).toEqual(['first', 'nested'])
  })
})
