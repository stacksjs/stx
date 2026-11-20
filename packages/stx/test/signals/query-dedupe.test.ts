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
import { mutationResponse } from '../../src/mutation-response'
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
  const destroy = g.window.stx._destroyCallbacks
  for (const cleanup of destroy.splice(0)) cleanup()
  g.window.stx.configureFetch({})
  g.window.stx.setKeptScope(undefined)
  globalThis.fetch = realFetch
})

let seq = 0
/** A fresh key per test, so nothing leaks through the shared module cache. */
const key = () => `/api/dedupe/${++seq}`

describe('dedupe across instances (#1869)', () => {
  it('uses normalized headers for both deduplication and cached results', async () => {
    const url = key()
    const stx = g.window.stx
    const options = { immediate: false, staleTime: 60_000 }
    const fr = stx.useQuery(url, { ...options, headers: { 'Accept-Language': 'fr' } })
    const same = stx.useQuery(url, { ...options, headers: [['accept-language', ' fr ']] })
    const en = stx.useQuery(url, { ...options, headers: new Headers({ 'Accept-Language': 'en' }) })
    const reads = [fr.refetch(), same.refetch(), en.refetch()]
    await tick()
    const languages = pending.map(request => new Headers(request.opts.headers).get('accept-language'))
    expect(languages).toEqual(['fr', 'en'])
    pending.forEach((request, index) => request.resolve(json(languages[index])))
    await Promise.all(reads)
    expect([fr.data(), same.data(), en.data()]).toEqual(['fr', 'fr', 'en'])
    await Promise.all([fr.refetch(), en.refetch()])
    expect([fr.data(), en.data()]).toEqual(['fr', 'en'])
    expect(pending).toHaveLength(2)
  })

  it('identifies the effective request after a request interceptor', async () => {
    const url = key()
    const stx = g.window.stx
    let language = 'fr'
    stx.configureFetch({ onRequest: (ctx: { options: { headers: Record<string, string> } }) => {
      ctx.options.headers['Accept-Language'] = language
    } })
    const options = { immediate: false, staleTime: 60_000 }
    const first = stx.useQuery(url, options)
    const same = stx.useQuery(url, options)
    const other = stx.useQuery(url, options)
    const reads = [first.refetch(), same.refetch()]
    await tick()
    language = 'en'
    reads.push(other.refetch())
    await tick()
    expect(pending.map(request => request.opts.headers['Accept-Language'])).toEqual(['fr', 'en'])
    pending[0].resolve(json('fr'))
    pending[1].resolve(json('en'))
    await Promise.all(reads)
    expect([first.data(), same.data(), other.data()]).toEqual(['fr', 'fr', 'en'])
    await first.refetch()
    expect(first.data()).toBe('en')
    expect(pending).toHaveLength(2)
  })

  it('shares only within the same query scope', async () => {
    const url = key()
    const stx = g.window.stx
    const first = stx.useQuery(url, { immediate: false, scope: 'first', cacheTime: 0 })
    const second = stx.useQuery(url, { immediate: false, scope: 'second', cacheTime: 0 })
    const reads = [first.refetch(), second.refetch()]
    await tick()
    expect(pending).toHaveLength(2)
    pending[0].resolve(json(1))
    pending[1].resolve(json(2))
    await Promise.all(reads)
    expect([first.data(), second.data()]).toEqual([1, 2])
  })

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
  it('follows the selected URL after hydrating with the initial request deferred', async () => {
    const stx = g.window.stx
    const first = key()
    const second = key()
    const url = stx.state(first)
    const snapshot = g.window.__STX_DATA__
    g.window.__STX_DATA__ = { initial: 'server' }
    try {
      const query = stx.useQuery(url, { key: 'initial', immediate: false, cacheTime: 0 })
      expect(query.data()).toBe('server')
      expect(pending).toHaveLength(0)
      url.set(second)
      await tick()
      expect(pending.map(request => request.url)).toEqual([second])
      pending[0].resolve(json('client'))
      await tick()
      expect(query.data()).toBe('client')
    }
    finally {
      g.window.__STX_DATA__ = snapshot
    }
  })

  it('supersedes an in-flight request when the reactive URL changes under the same logical key', async () => {
    const stx = g.window.stx
    const paris = key()
    const oslo = key()
    const url = stx.state(paris)
    const query = stx.useQuery(url, { immediate: false, cacheKey: key(), staleTime: 60_000 })
    const first = query.refetch()
    await tick()
    url.set(oslo)
    await tick()
    expect(pending.map(request => request.url)).toEqual([paris, oslo])
    expect(pending[0].opts.signal.aborted).toBe(true)
    pending[0].resolve(json('Paris'))
    await first
    expect(query.data()).toBeNull()
    pending[1].resolve(json('Oslo'))
    await tick()
    expect(query.data()).toBe('Oslo')
    url.set('')
    await tick()
    expect(query.data()).toBeNull()
    expect(query.isFetching()).toBe(false)
    expect(pending).toHaveLength(2)
  })

  it('reacts to scope and enabled changes without publishing the departed scope', async () => {
    const stx = g.window.stx
    const enabled = stx.state(true)
    const query = stx.useQuery(key(), { immediate: false, enabled, cacheTime: 0 })
    stx.setKeptScope('before')
    const first = query.refetch()
    await tick()
    enabled.set(false)
    stx.setKeptScope('after')
    await first
    expect(pending[0].opts.signal.aborted).toBe(true)
    expect(query.isFetching()).toBe(false)
    expect(pending).toHaveLength(1)
    enabled.set(true)
    await tick()
    expect(pending).toHaveLength(2)
    pending[1].resolve(json('current account'))
    await tick()
    expect(query.data()).toBe('current account')
    enabled.set(false)
    stx.setKeptScope(undefined)
    expect(query.data()).toBeNull()
  })

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

describe('overlapping mutations', () => {
  it('keeps a newer success and stays pending until an older write settles', async () => {
    const mutation = g.window.stx.useMutation('/write', { optimisticData: (value: unknown) => value })
    const old = mutation.mutate(1).catch((error: Error) => error)
    const next = mutation.mutate(2)
    await tick()
    expect(mutation.data()).toBe(2)
    pending[1].resolve(json(20))
    expect(await next).toBe(20)
    expect(mutation.data()).toBe(20)
    expect(mutation.loading()).toBe(true)

    pending[0].resolve(new Response('older failed', { status: 500 }))
    expect(await old).toBeInstanceOf(Error)
    expect(mutation.data()).toBe(20)
    expect(mutation.loading()).toBe(false)
    expect(mutation.error()).toBeNull()
  })

  it('rolls back only the failed optimistic value, including a falsy optimistic result', async () => {
    const mutation = g.window.stx.useMutation('/write', { optimisticData: (value: unknown) => value })
    const old = mutation.mutate(1)
    const next = mutation.mutate(false).catch((error: Error) => error)
    await tick()
    expect(mutation.data()).toBe(false)
    pending[0].resolve(json(10))
    await old
    expect(mutation.data()).toBe(false)
    expect(mutation.loading()).toBe(true)
    pending[1].resolve(new Response('second failed', { status: 500 }))
    expect(await next).toBeInstanceOf(Error)
    expect(mutation.data()).toBe(10)
    expect(mutation.error()).toContain('second failed')
  })

  it('reset detaches old results without cancelling the server write', async () => {
    const mutation = g.window.stx.useMutation('/write')
    const old = mutation.mutate(1)
    await tick()
    mutation.reset()
    expect(mutation.loading()).toBe(false)
    const next = mutation.mutate(2)
    await tick()
    pending[0].resolve(json(10))
    await old
    expect(mutation.loading()).toBe(true)
    expect(mutation.data()).toBeNull()
    pending[1].resolve(json(20))
    await next
    expect(mutation.data()).toBe(20)
    expect(mutation.loading()).toBe(false)
  })
})

describe('mutation query snapshots', () => {
  it('updates active readers from a typed response and fetches only the missing keys', async () => {
    const stx = g.window.stx
    const list = key()
    const missing = key()
    const unrelated = key()
    const options = { immediate: false, staleTime: 60_000 }
    const a = stx.useQuery(list, options)
    const b = stx.useQuery(list, { ...options, transform: (value: number) => value * 10 })
    const c = stx.useQuery(missing, options)
    const d = stx.useQuery(unrelated, options)
    const first = [a.refetch(), b.refetch(), c.refetch(), d.refetch()]
    await tick()
    expect(pending.map(request => request.url)).toEqual([list, missing, unrelated])
    pending.slice().forEach(item => item.resolve(json(1)))
    await Promise.all(first)

    const mutation = stx.useMutation('/write', {
      invalidateQueries: [list, missing],
      transform: (result: { ok: boolean }) => result.ok,
    })
    const observed: unknown[][] = []
    const dispose = stx.effect(() => { observed.push([mutation.loading(), mutation.data(), a.data(), b.data()]) })
    const write = mutation.mutate({})
    await tick()
    const response = mutationResponse({ ok: true }, { [list]: 2, [unrelated]: 99 }, { status: 201 })
    expect(response.status).toBe(201)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    pending[3].resolve(response)
    expect(await write).toBe(true)
    await tick()
    expect(pending.map(request => request.url)).toEqual([list, missing, unrelated, '/write', missing])
    expect([a.data(), b.data(), c.data(), d.data()]).toEqual([2, 20, 1, 1])
    expect(observed).toEqual([[false, null, 1, 10], [true, null, 1, 10], [false, true, 2, 20]])
    dispose()

    const cacheReader = stx.useQuery(list, options)
    await cacheReader.refetch()
    expect(cacheReader.data()).toBe(2)
    expect(pending).toHaveLength(5)
    pending[4].resolve(json(3))
    await tick()
    expect(c.data()).toBe(3)
  })

  it('revalidates every active variant when a snapshot key is ambiguous', async () => {
    const stx = g.window.stx
    const url = key()
    const cacheKey = key()
    const options = { immediate: false, cacheKey, staleTime: 60_000 }
    const fr = stx.useQuery(url, { ...options, headers: { 'Accept-Language': 'fr' } })
    const en = stx.useQuery(url, { ...options, headers: { 'Accept-Language': 'en' } })
    const first = [fr.refetch(), en.refetch()]
    await tick()
    pending[0].resolve(json('fr 1'))
    pending[1].resolve(json('en 1'))
    await Promise.all(first)
    const write = stx.useMutation('/write', { invalidateQueries: [cacheKey] }).mutate()
    await tick()
    pending[2].resolve(mutationResponse(true, { [cacheKey]: 'ambiguous' }))
    await write
    await tick()
    expect([fr.data(), en.data()]).toEqual(['fr 1', 'en 1'])
    expect(pending.slice(3).map(request => new Headers(request.opts.headers).get('accept-language'))).toEqual(['fr', 'en'])
    pending[3].resolve(json('fr 2'))
    pending[4].resolve(json('en 2'))
    await tick()
    expect([fr.data(), en.data()]).toEqual(['fr 2', 'en 2'])
  })

  it('does not apply an older snapshot and still revalidates an older write arriving late', async () => {
    const stx = g.window.stx
    const url = key()
    const query = stx.useQuery(url, { immediate: false })
    const initial = query.refetch()
    await tick()
    pending[0].resolve(json(0))
    await initial
    const mutation = stx.useMutation('/write', { invalidateQueries: [url] })
    const first = mutation.mutate(1)
    const second = mutation.mutate(2)
    await tick()
    pending[2].resolve(mutationResponse(2, { [url]: null }))
    await second
    expect(query.data()).toBeNull()
    expect(pending).toHaveLength(3)
    pending[1].resolve(mutationResponse(1, { [url]: 1 }))
    await first
    await tick()
    expect(query.data()).toBeNull()
    expect(pending.map(request => request.url)).toEqual([url, '/write', '/write', url])
    pending[3].resolve(json(3))
    await tick()
    expect(query.data()).toBe(3)
  })

  it('accepts the existing JSON result shape without treating it as a snapshot envelope', async () => {
    const mutation = g.window.stx.useMutation('/write')
    const result = { data: 'plain', queries: { incidental: 'metadata' } }
    const write = mutation.mutate({})
    await tick()
    pending[0].resolve(json(result))
    expect(await write).toEqual(result)
  })
})
