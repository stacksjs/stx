/**
 * `useFetch` lifecycle defects (stacksjs/stx#1818).
 *
 * Three independent bugs, all in the client runtime:
 *
 *  1. `loading` was initialised `true` unconditionally, while the only thing
 *     that cleared it was the fetch `immediate: false` suppresses. So the
 *     documented way to declare a DEFERRED request produced a composable stuck
 *     loading forever — precisely the case where a template is most likely to
 *     be driving a spinner off it.
 *  2. A function URL fetched twice on mount: `onMount(fetchData)` ran, and the
 *     `effect()` watching the URL ALSO ran eagerly on creation. Two requests for
 *     every reactive-URL fetch.
 *  3. `refetchOnFocus` added a `visibilitychange` listener and never removed
 *     it, unlike `refetchInterval` immediately below it. Every instance leaked
 *     one for the life of the page, and each SPA navigation added more — every
 *     stale listener still firing, refetching for components long gone.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

let fetchCalls: string[] = []
let realFetch: typeof globalThis.fetch

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  realFetch = globalThis.fetch
})

beforeEach(() => {
  fetchCalls = []
  globalThis.fetch = (async (url: string) => {
    fetchCalls.push(String(url))
    return new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }) as never
})

afterEach(() => {
  globalThis.fetch = realFetch
})

const settle = () => new Promise(resolve => setTimeout(resolve, 20))

describe('immediate: false', () => {
  it('does not start in a loading state', () => {
    // The spinner case: `<div :if="loading()">Loading…</div>` rendered forever
    // for a request that was never issued.
    const r = g.window.stx.useFetch('/api/x', { immediate: false })
    expect(r.loading()).toBe(false)
  })

  it('issues no request until refetch is called', async () => {
    const r = g.window.stx.useFetch('/api/x', { immediate: false })
    await settle()
    expect(fetchCalls).toEqual([])

    await r.refetch()
    expect(fetchCalls).toEqual(['/api/x'])
  })

  it('clears loading again after an explicit refetch', async () => {
    const r = g.window.stx.useFetch('/api/x', { immediate: false })
    await r.refetch()
    await settle()
    expect(r.loading()).toBe(false)
  })

  it('still starts loading when immediate is left on', () => {
    const r = g.window.stx.useFetch('/api/x')
    expect(r.loading()).toBe(true)
  })

  it('honours immediate:false for a function URL too', async () => {
    const r = g.window.stx.useFetch(() => '/api/fn', { immediate: false })
    await settle()
    expect(r.loading()).toBe(false)
    expect(fetchCalls).toEqual([])
  })
})

describe('a function URL fetches once', () => {
  it('does not double-fetch on mount', async () => {
    // effect() runs eagerly on creation, so it IS the mount fetch; registering
    // onMount as well made two requests.
    g.window.stx.useFetch(() => '/api/reactive')
    await settle()
    expect(fetchCalls).toEqual(['/api/reactive'])
  })

  it('does not double-fetch a plain string URL either', async () => {
    // A plain URL defers to onMount, which this harness never fires — so the
    // meaningful assertion is that nothing fetches TWICE, not that it fetches.
    g.window.stx.useFetch('/api/plain')
    await settle()
    expect(fetchCalls.filter(u => u === '/api/plain').length).toBeLessThanOrEqual(1)
  })

  it('skips a falsy URL without requesting', async () => {
    g.window.stx.useFetch(() => '')
    await settle()
    expect(fetchCalls).toEqual([])
  })
})

describe('refetchOnFocus cleans up', () => {
  // Structural. Driving a full scope teardown through this harness would test
  // the teardown machinery rather than the pairing, and the pairing is the
  // defect: the listener was added and never removed, unlike refetchInterval
  // three lines below it.
  const runtime = generateSignalsRuntimeDev()

  it('pairs its listener with a removal', () => {
    const at = runtime.indexOf("addEventListener('visibilitychange'")
    expect(at).toBeGreaterThan(-1)
    const near = runtime.slice(at, at + 400)
    expect(near).toContain("removeEventListener('visibilitychange'")
  })

  it('registers that removal with onDestroy', () => {
    const at = runtime.indexOf("addEventListener('visibilitychange'")
    const near = runtime.slice(at, at + 400)
    expect(near).toContain('onDestroy(')
  })

  it('names the handler so it CAN be removed', () => {
    // An inline anonymous function is unremovable — that was the bug.
    const at = runtime.indexOf("addEventListener('visibilitychange'")
    const before = runtime.slice(Math.max(0, at - 300), at)
    expect(before).toMatch(/var\s+\w+\s*=\s*function/)
  })
})
