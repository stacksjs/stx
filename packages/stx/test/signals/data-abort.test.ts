/**
 * Client-runtime data primitives abort in-flight requests (stacksjs/stx#1871).
 *
 * `useFetch`/`useQuery` called `fetch` with no `AbortController`, so a request
 * outlived the thing that started it: a refetch, a reactive-URL change, or an
 * unmount left the old request in flight, and its late resolution wrote `data`
 * / `error` / `loading` into a scope that was already gone (or clobbered the
 * newer result — the classic out-of-order-response bug).
 *
 * The fix gives each run its own controller: a newer run aborts the previous
 * one, onDestroy aborts the last, and every state write is guarded on
 * `signal.aborted` so a superseded request is silently dropped, not surfaced.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

interface Pending { url: string, opts: any, resolve: (r: Response) => void }
let pending: Pending[] = []
let realFetch: typeof globalThis.fetch

function abortError(): Error {
  const e = new Error('The operation was aborted')
  e.name = 'AbortError'
  return e
}

const json = (o: unknown) =>
  new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } })

const tick = () => new Promise(r => setTimeout(r, 0))
const settle = () => new Promise(r => setTimeout(r, 20))

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  realFetch = globalThis.fetch
})

beforeEach(() => {
  pending = []
  // A controllable fetch: every call parks until resolved by hand, and a call
  // whose signal aborts rejects with AbortError — exactly like the platform.
  globalThis.fetch = ((url: string, opts: any) => new Promise<Response>((resolve, reject) => {
    pending.push({ url: String(url), opts, resolve })
    const sig = opts && opts.signal
    if (sig) {
      if (sig.aborted) { reject(abortError()); return }
      sig.addEventListener('abort', () => reject(abortError()))
    }
  })) as never
})

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('useFetch aborts (#1871)', () => {
  it('passes an AbortSignal to fetch', async () => {
    const r = g.window.stx.useFetch('/api/a', { immediate: false })
    r.refetch()
    await tick()
    expect(pending).toHaveLength(1)
    expect(pending[0].opts.signal).toBeInstanceOf(AbortSignal)
    expect(pending[0].opts.signal.aborted).toBe(false)
  })

  it('aborts the previous in-flight request when superseded by a refetch', async () => {
    const r = g.window.stx.useFetch('/api/a', { immediate: false })
    r.refetch()
    await tick()
    const first = pending[0].opts.signal
    expect(first.aborted).toBe(false)

    r.refetch()
    await tick()
    expect(first.aborted).toBe(true) // the older request was cancelled
    expect(pending).toHaveLength(2) // a fresh request went out
  })

  it('a superseded (out-of-order) response does not clobber the newer result', async () => {
    const r = g.window.stx.useFetch('/api/a', { immediate: false })
    r.refetch()
    await tick()
    const stale = pending[0]

    r.refetch()
    await tick()
    const fresh = pending[1]

    fresh.resolve(json({ v: 'new' }))
    await settle()
    // The stale request was aborted; even if its socket somehow delivered late,
    // resolving it must not overwrite the newer value.
    stale.resolve(json({ v: 'old' }))
    await settle()

    expect(r.data()).toEqual({ v: 'new' })
    expect(r.error()).toBeNull()
  })

  it('does not surface an abort as an error', async () => {
    const r = g.window.stx.useFetch('/api/a', { immediate: false })
    r.refetch()
    await tick()
    r.refetch() // aborts the first
    await settle()
    expect(r.error()).toBeNull()
  })
})

describe('useQuery aborts (#1871)', () => {
  it('passes an AbortSignal and aborts the previous run on refetch', async () => {
    const q = g.window.stx.useQuery('/api/q', { immediate: false })
    q.refetch()
    await tick()
    expect(pending).toHaveLength(1)
    expect(pending[0].opts.signal).toBeInstanceOf(AbortSignal)
    const first = pending[0].opts.signal

    q.refetch()
    await tick()
    expect(first.aborted).toBe(true)
    expect(pending).toHaveLength(2)
  })
})
