/**
 * Concurrent useQuery calls for one key share a request (stacksjs/stx#1869).
 *
 * `_queryCache` is written only after the body parses, so the entire in-flight
 * window was a cache miss: N components mounting together issued N identical
 * requests.
 *
 * ## Why this is not simply "dedupe by key"
 *
 * #1871 made a refetch ABORT the instance's previous in-flight request. Naive
 * dedup says the opposite — a second call for a live key should JOIN it — and
 * for a same-instance `refetch()` those give different answers. Adopting your
 * own pre-mutation request because it happens to still be open would return
 * stale data from a call whose entire purpose is to get fresh data.
 *
 * So dedup is scoped to DISTINCT instances. An instance's own re-run still
 * supersedes, and #1871's tests still hold unchanged.
 *
 * The refcount is not polish. The shared request carries one AbortController,
 * so a caller that loses interest must not cancel a response another caller is
 * still awaiting — that would convert #1871's fix into a component that loads
 * forever.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

interface Pending { url: string, opts: any, resolve: (r: Response) => void, reject: (e: unknown) => void }
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
  globalThis.fetch = ((url: string, opts: any) => new Promise<Response>((resolve, reject) => {
    pending.push({ url: String(url), opts, resolve, reject })
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

let seq = 0
/** A fresh key per test, so nothing leaks through the shared module cache. */
const key = () => `/api/dedupe/${++seq}`

describe('dedupe across instances (#1869)', () => {
  it('two instances asking for one key issue one request', async () => {
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })
    const b = g.window.stx.useQuery(url, { immediate: false })

    a.refetch()
    b.refetch()
    await tick()

    expect(pending).toHaveLength(1)
  })

  it('both instances receive the shared result', async () => {
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })
    const b = g.window.stx.useQuery(url, { immediate: false })

    a.refetch()
    b.refetch()
    await tick()
    pending[0].resolve(json({ name: 'shared' }))
    await settle()

    expect(a.data()).toEqual({ name: 'shared' })
    expect(b.data()).toEqual({ name: 'shared' })
    expect(a.loading()).toBe(false)
    expect(b.loading()).toBe(false)
  })

  it('both instances see a shared failure', async () => {
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })
    const b = g.window.stx.useQuery(url, { immediate: false })

    a.refetch()
    b.refetch()
    await tick()
    pending[0].resolve(new Response('nope', { status: 500, statusText: 'Server Error' }))
    await settle()

    expect(a.error()).toBeTruthy()
    expect(b.error()).toBeTruthy()
    expect(b.loading()).toBe(false)
  })

  it('does not dedupe different keys', async () => {
    const a = g.window.stx.useQuery(key(), { immediate: false })
    const b = g.window.stx.useQuery(key(), { immediate: false })

    a.refetch()
    b.refetch()
    await tick()

    expect(pending).toHaveLength(2)
  })

  it('each instance applies its own transform', async () => {
    // The shared promise carries the raw body; transform stays per-caller.
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false, transform: (r: any) => r.n * 2 })
    const b = g.window.stx.useQuery(url, { immediate: false, transform: (r: any) => r.n * 10 })

    a.refetch()
    b.refetch()
    await tick()
    pending[0].resolve(json({ n: 3 }))
    await settle()

    expect(a.data()).toBe(6)
    expect(b.data()).toBe(30)
  })
})

describe('the in-flight entry does not outlive the request (#1869)', () => {
  it('a later call issues a fresh request after the first resolves', async () => {
    // A settled entry left behind would make dedup a permanent cache.
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })
    a.refetch()
    await tick()
    pending[0].resolve(json({ v: 1 }))
    await settle()

    const b = g.window.stx.useQuery(url, { immediate: false })
    b.refetch()
    await tick()

    expect(pending).toHaveLength(2)
  })

  it('a later call issues a fresh request after the first rejects', async () => {
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })
    a.refetch()
    await tick()
    pending[0].resolve(new Response('boom', { status: 500 }))
    await settle()

    const b = g.window.stx.useQuery(url, { immediate: false })
    b.refetch()
    await tick()

    expect(pending).toHaveLength(2)
  })
})

describe('dedupe does not break #1871 abort semantics', () => {
  it('control: an instance refetching still supersedes its own request', async () => {
    // This is the case naive dedupe gets wrong. refetch() must hit the
    // network, not adopt the request that was already open.
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })

    a.refetch()
    await tick()
    expect(pending).toHaveLength(1)

    a.refetch()
    await tick()

    expect(pending).toHaveLength(2)
    expect(pending[0].opts.signal.aborted).toBe(true)
    expect(pending[1].opts.signal.aborted).toBe(false)
  })

  it('does not cancel a request another instance joined', async () => {
    // The refcount. B is waiting on A's request; A refetching must leave that
    // response alive, or B loads forever.
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })
    const b = g.window.stx.useQuery(url, { immediate: false })

    a.refetch()
    b.refetch()
    await tick()
    expect(pending).toHaveLength(1)

    a.refetch()
    await tick()

    // A started a second request; the shared first one is NOT aborted.
    expect(pending).toHaveLength(2)
    expect(pending[0].opts.signal.aborted).toBe(false)

    pending[0].resolve(json({ from: 'shared' }))
    await settle()

    expect(b.data()).toEqual({ from: 'shared' })
    expect(b.loading()).toBe(false)
  })
})

describe('query refresh supersession', () => {
  it('keeps the newest consumer and cache result while a shared older read can still finish', async () => {
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })
    const b = g.window.stx.useQuery(url, { immediate: false })
    const oldA = a.refetch()
    const oldB = b.refetch()
    const newA = a.refetch()
    await tick()

    pending[1].resolve(json({ version: 2 }))
    await newA
    pending[0].resolve(json({ version: 1 }))
    await Promise.all([oldA, oldB])
    expect(a.data()).toEqual({ version: 2 })
    expect(b.data()).toEqual({ version: 1 })

    const cached = g.window.stx.useQuery(url, {
      immediate: false,
      staleTime: 60_000,
      transform: (value: { version: number }) => value.version * 10,
    })
    await cached.refetch()
    expect(cached.data()).toBe(20)
    expect(pending).toHaveLength(2)
  })

  it('lets a joined consumer supersede its own read and ignores the older error', async () => {
    const url = key()
    const a = g.window.stx.useQuery(url, { immediate: false })
    const b = g.window.stx.useQuery(url, { immediate: false })
    const oldA = a.refetch()
    const oldB = b.refetch()
    const newB = b.refetch()
    await tick()
    expect(pending).toHaveLength(2)

    pending[0].resolve(new Response('old', { status: 500 }))
    await Promise.all([oldA, oldB])
    expect(a.error()).toBeTruthy()
    expect(b.error()).toBeNull()
    expect(b.isFetching()).toBe(true)

    pending[1].resolve(json({ version: 2 }))
    await newB
    expect(b.data()).toEqual({ version: 2 })
    expect(b.isFetching()).toBe(false)
  })

  it('detaches each consumer on destroy and aborts only once the final consumer leaves', async () => {
    const url = key()
    const stx = g.window.stx
    const owner = document.createElement('div')
    const mountQuery = (id: string) => {
      stx._scopes[id] = {}
      owner.setAttribute('data-stx-scope', id)
      g.window.__STX_CURRENT_ELEMENT__ = owner
      const query = stx.useQuery(url, { immediate: false })
      g.window.__STX_CURRENT_ELEMENT__ = null
      return {
        query,
        destroy: () => {
          stx._scopes[id].__destroyCallbacks.forEach((destroy: () => void) => destroy())
          delete stx._scopes[id]
        },
      }
    }
    const a = mountQuery('query-test-a')
    const b = mountQuery('query-test-b')
    const reads = [a.query.refetch(), b.query.refetch()]
    await tick()

    a.destroy()
    expect(pending[0].opts.signal.aborted).toBe(false)
    b.destroy()
    expect(pending[0].opts.signal.aborted).toBe(true)
    await Promise.all(reads)
    expect(a.query.data()).toBeNull()
    expect(b.query.data()).toBeNull()
  })

  it('refreshes active matching consumers once, behind their current data, after a mutation', async () => {
    const url = key()
    const stx = g.window.stx
    const a = stx.useQuery(url, { immediate: false, cacheKey: 'refresh-group' })
    const b = stx.useQuery(url, {
      immediate: false,
      cacheKey: 'refresh-group',
      transform: (value: { version: number }) => value.version * 10,
    })
    const deferred = stx.useQuery(url, { immediate: false, cacheKey: 'refresh-group' })
    const reads = [a.refetch(), b.refetch()]
    await tick()
    pending[0].resolve(json({ version: 1 }))
    await Promise.all(reads)
    const beforeWrite = a.refetch({ background: true })
    await tick()

    const write = stx.useMutation('/write', { invalidateQueries: ['refresh-group', 'refresh-group'] }).mutate({})
    await tick()
    expect(pending.map(request => request.opts.method)).toEqual(['GET', 'GET', 'POST'])
    pending[2].resolve(json({ ok: true }))
    await write
    await tick()
    expect(pending[1].opts.signal.aborted).toBe(true)
    expect(pending.map(request => request.opts.method)).toEqual(['GET', 'GET', 'POST', 'GET'])
    expect(a.data()).toEqual({ version: 1 })
    expect(b.data()).toBe(10)
    expect(a.loading()).toBe(false)
    expect(a.isFetching()).toBe(true)

    pending[3].resolve(json({ version: 2 }))
    await beforeWrite
    await tick()
    expect(a.data()).toEqual({ version: 2 })
    expect(b.data()).toBe(20)
    expect(deferred.data()).toBeNull()
  })
})
