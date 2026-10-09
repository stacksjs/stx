/**
 * Persisted queries: seeded from the device per account, refreshed behind,
 * one request for every caller, and a waiting write shown on top until it
 * syncs. The page's own events (stx:updated from the worker, stx:outbox from
 * the outbox) are dispatched on window as in a browser.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import type { KeptBackend } from '../../src/offline/kept-store'
import { createKeptStore } from '../../src/offline/kept-store'
import { createQueryCache, queryTargetMatches } from '../../src/offline/query-cache'
import { useOutbox } from '../../src/composables/use-outbox'
import { state } from '../../src/signals-api'

class MemoryStorage {
  data = new Map<string, string>()
  get length(): number { return this.data.size }
  key(i: number): string | null { return Array.from(this.data.keys())[i] ?? null }
  getItem(k: string): string | null { return this.data.has(k) ? this.data.get(k)! : null }
  setItem(k: string, v: string): void { this.data.set(k, String(v)) }
  removeItem(k: string): void { this.data.delete(k) }
}

function memoryBackend(): KeptBackend & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>()
  return {
    data,
    get: async key => data.get(key),
    set: async (key, value) => { data.set(key, structuredClone(value)) },
    remove: async (key) => { data.delete(key) },
    removePrefix: async (prefix) => {
      for (const key of [...data.keys()]) if (key.startsWith(prefix)) data.delete(key)
    },
  }
}

interface Server { calls: Array<{ url: string, init: RequestInit }>, answer: (url: string) => unknown, delay: number, fail: boolean }

function setUp(storage = new MemoryStorage(), backend = memoryBackend()) {
  const kept = createKeptStore({ storage, backend, defer: fn => fn() })
  const cache = createQueryCache({ state: state as any, kept, matches: queryTargetMatches })
  const server: Server = { calls: [], answer: () => ({}), delay: 0, fail: false }
  const fetch = async (url: string, init: RequestInit): Promise<Response> => {
    server.calls.push({ url, init })
    if (server.delay) await new Promise(resolve => setTimeout(resolve, server.delay))
    if (server.fail) throw new TypeError('Load failed')
    return new Response(JSON.stringify(server.answer(url)), { status: 200 })
  }
  return { storage, backend, kept, cache, server, fetch }
}

const stops: Array<() => void> = []
afterEach(() => { while (stops.length) stops.pop()!() })

describe('cachedQuery', () => {
  it('seeds synchronously from what this account kept, and only this account', async () => {
    const first = setUp()
    first.server.answer = () => ({ days: 7 })
    await first.cache.cachedQuery('calendar', { url: '/api/calendar', fetch: first.fetch, scope: 77 }).load()
    expect(JSON.parse(first.storage.getItem('stx:kept:77:query:calendar')!).d).toEqual({ days: 7 })

    // Next launch: same device, a fresh page.
    const again = setUp(first.storage, first.backend)
    const calendar = again.cache.cachedQuery('calendar', { url: '/api/calendar', fetch: again.fetch, scope: 77, initial: {} })
    expect(calendar.data()).toEqual({ days: 7 })
    expect(calendar.updatedAt()).toBeGreaterThan(0)
    expect(again.server.calls.length).toBe(0)

    const other = setUp(first.storage, first.backend)
    expect(other.cache.cachedQuery('calendar', { url: '/api/calendar', fetch: other.fetch, scope: 116, initial: {} }).data()).toEqual({})
  })

  it('revalidates a kept copy once, then not again within staleTime', async () => {
    const { cache, server, fetch } = setUp()
    let n = 0
    server.answer = () => ({ n: ++n })
    const q = cache.cachedQuery('n', { url: '/api/n', fetch, scope: 1, staleTime: 60_000 })
    await q.load()
    await q.load()
    expect(server.calls.length).toBe(1)
    expect(q.data()).toEqual({ n: 1 })
    q.invalidate()
    await q.load()
    expect(q.data()).toEqual({ n: 2 })
    await q.load(true)
    expect(server.calls.length).toBe(3)
  })

  it('sends one request for every caller, and is one query per key', async () => {
    const { cache, server, fetch } = setUp()
    server.delay = 20
    const a = cache.cachedQuery('shared', { url: '/api/shared', fetch, scope: 1 })
    const b = cache.cachedQuery('shared', { url: '/api/shared', fetch, scope: 1 })
    expect(a).toBe(b)
    await Promise.all([a.load(), b.load(), a.load(true)])
    expect(server.calls.length).toBe(1)
  })

  it('goes past every cache for a refresh', async () => {
    const { cache, server, fetch } = setUp()
    const q = cache.cachedQuery('r', { url: '/api/r', fetch, scope: 1 })
    await q.load()
    await q.refresh()
    expect(server.calls[0]!.init.cache).toBeUndefined()
    expect(server.calls[1]!.init.cache).toBe('no-cache')
  })

  it('shows loading only with nothing to show, and keeps the data on an error', async () => {
    const { cache, server, fetch } = setUp()
    server.answer = () => [1]
    const q = cache.cachedQuery('e', { url: '/api/e', fetch, scope: 1, initial: [] as number[] })
    const first = q.load()
    expect(q.loading()).toBe(true)
    await first
    expect(q.loading()).toBe(false)
    server.fail = true
    const second = q.refresh()
    expect(q.loading()).toBe(false)
    expect(q.isFetching()).toBe(true)
    await second
    expect(q.data()).toEqual([1])
    expect(q.error()).toBe('Load failed')
    expect(q.isFetching()).toBe(false)
  })

  it('gives up on a request after timeoutMs, and asks again next time', async () => {
    const { cache, server, fetch } = setUp()
    server.delay = 200
    const q = cache.cachedQuery('t', { url: '/api/t', fetch, scope: 1, timeoutMs: 20 })
    await q.load()
    expect(q.error()).toBe('The request took too long.')
    expect(q.isFetching()).toBe(false)
    server.delay = 0
    await q.load()
    expect(server.calls.length).toBe(2)
  })

  it('keeps nothing for a scope of false, and uses setScope when given none', async () => {
    const { cache, storage, fetch } = setUp()
    await cache.cachedQuery('none', { url: '/api/x', fetch, scope: false }).load()
    expect(storage.length).toBe(0)
    cache.setScope('acct')
    await cache.cachedQuery('mine', { url: '/api/x', fetch }).load()
    expect(storage.getItem('stx:kept:acct:query:mine')).not.toBeNull()
  })

  it('swaps to the new account\'s data when the scope changes', async () => {
    const { cache, server, fetch } = setUp()
    let who: string | false = 'a'
    server.answer = () => ({ who })
    const q = cache.cachedQuery('me', { url: '/api/me', fetch, scope: () => who, initial: null })
    await q.load()
    who = 'b'
    const loading = q.load()
    // Not a's data while b's loads.
    expect(q.data()).toBeNull()
    await loading
    expect(q.data()).toEqual({ who: 'b' })
    who = 'a'
    void q.load()
    expect(q.data()).toEqual({ who: 'a' })
  })

  it('arrives a moment later when it was kept too large for a synchronous read', async () => {
    const first = setUp()
    first.server.answer = () => ({ rows: 'x'.repeat(40_000) })
    await first.cache.cachedQuery('big', { url: '/api/big', fetch: first.fetch, scope: 1 }).load()
    expect(first.storage.length).toBe(0)
    const again = setUp(first.storage, first.backend)
    const q = again.cache.cachedQuery('big', { url: '/api/big', fetch: again.fetch, scope: 1 })
    expect(q.data()).toBeNull()
    await new Promise(resolve => setTimeout(resolve, 5))
    expect((q.data() as any).rows.length).toBe(40_000)
  })

  it('refreshes when the offline worker says its answer changed', async () => {
    const { cache, server, fetch } = setUp()
    let v = 1
    server.answer = () => ({ v })
    const q = cache.cachedQuery('w', { url: '/api/w?x=1', fetch, scope: 1, staleTime: 60_000 })
    await q.load()
    v = 2
    // The test page has no origin of its own: URLs resolve against localhost.
    window.dispatchEvent(new CustomEvent('stx:updated', { detail: { kind: 'api', url: 'http://localhost/api/w?x=2' } }))
    window.dispatchEvent(new CustomEvent('stx:updated', { detail: { kind: 'api', url: 'http://elsewhere.test/api/w?x=1' } }))
    window.dispatchEvent(new CustomEvent('stx:updated', { detail: { kind: 'page', url: 'http://localhost/api/w?x=1' } }))
    expect(server.calls.length).toBe(1)
    window.dispatchEvent(new CustomEvent('stx:updated', { detail: { kind: 'api', url: 'http://localhost/api/w?x=1' } }))
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(q.data()).toEqual({ v: 2 })
  })
})

describe('cachedQuery with the outbox', () => {
  function outbox(online: { value: boolean }) {
    const box = useOutbox(`q-${Math.random()}`, {
      storage: new MemoryStorage(),
      fetch: async () => {
        if (!online.value) throw new TypeError('offline')
        return new Response('{}')
      },
      overlays: { addWeight: (list: number[], entry) => [...list, JSON.parse(entry.body!).kg] },
    })
    stops.push(() => box.stop())
    return box
  }

  it('shows a write made offline on top of every refetch until it syncs, then the server\'s answer', async () => {
    const online = { value: false }
    const { cache, server, fetch } = setUp()
    let weights = [79]
    server.answer = () => weights
    const q = cache.cachedQuery('weights', { url: '/api/health/weight', fetch, scope: 1, initial: [] as number[] })
    await q.load()
    const box = outbox(online)
    await box.send('/api/health/weight', { method: 'POST', body: '{"kg":80}', affects: ['/api/health/weight'], overlay: 'addWeight' })
    expect(q.data()).toEqual([79, 80])
    await q.refresh()
    expect(q.data()).toEqual([79, 80])

    // Synced: still shown while the refetch it starts is out, then the
    // server's own answer, which now has it.
    online.value = true
    server.delay = 20
    weights = [79, 80]
    await box.flush(true)
    expect(q.data()).toEqual([79, 80])
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(q.data()).toEqual([79, 80])
    expect(server.calls.at(-1)!.init.cache).toBe('no-cache')
  })

  it('seeds with a waiting write applied, after a reload', async () => {
    const online = { value: false }
    const storage = new MemoryStorage()
    const first = setUp(storage)
    first.server.answer = () => [70]
    await first.cache.cachedQuery('w2', { url: '/api/w2', fetch: first.fetch, scope: 1 }).load()
    const box = outbox(online)
    await box.send('/api/w2', { method: 'POST', body: '{"kg":71}', affects: ['w2'], overlay: 'addWeight' })
    const again = setUp(storage, first.backend)
    expect(again.cache.cachedQuery('w2', { url: '/api/w2', fetch: again.fetch, scope: 1 }).data()).toEqual([70, 71])
  })

  it('refetches a read a write changed when the write went straight through', async () => {
    const { cache, server, fetch } = setUp()
    const q = cache.cachedQuery('direct', { url: '/api/direct', fetch, scope: 1, staleTime: 60_000 })
    await q.load()
    const box = outbox({ value: true })
    await box.send('/api/direct', { method: 'POST', affects: ['/api/direct'] })
    expect(server.calls.length).toBe(2)
  })
})
