/**
 * useQuery({ keep }) and cachedQuery in the browser runtime: the answer is
 * kept per account and seeds the next visit, refreshed behind rather than
 * under a spinner, and a write waiting in the outbox shows on top.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { useOutbox } from '../../src/composables/use-outbox'

const g = globalThis as any

class MemoryStorage {
  data = new Map<string, string>()
  get length(): number { return this.data.size }
  key(i: number): string | null { return Array.from(this.data.keys())[i] ?? null }
  getItem(k: string): string | null { return this.data.has(k) ? this.data.get(k)! : null }
  setItem(k: string, v: string): void { this.data.set(k, String(v)) }
  removeItem(k: string): void { this.data.delete(k) }
  clear(): void { this.data.clear() }
}

const local = new MemoryStorage()
const saved: Record<string, any> = {}
let calls: string[] = []
let answer: (url: string) => unknown = () => ({})

beforeAll(() => {
  // The preload's DOM puts localStorage on `window` only, so the global and
  // the window property are saved apart: restoring the window's from the
  // (undefined) global left every later file in the process without storage.
  saved.localStorage = g.localStorage
  saved.windowLocalStorage = g.window?.localStorage
  saved.fetch = g.fetch
  g.localStorage = local
  if (g.window) g.window.localStorage = local
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterAll(() => {
  g.localStorage = saved.localStorage
  if (g.window) g.window.localStorage = saved.windowLocalStorage
  g.fetch = saved.fetch
})

beforeEach(() => {
  calls = []
  g.fetch = async (url: string) => {
    calls.push(String(url))
    return new Response(JSON.stringify(answer(String(url))), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
})

const settle = () => new Promise(resolve => setTimeout(resolve, 20))
let seq = 0

describe('useQuery({ keep })', () => {
  it('coalesces an outbox acknowledgment and a worker update in the same turn', async () => {
    const url = `/api/keep/${++seq}`
    const stx = g.window.stx
    let version = 1
    answer = () => version
    const options = { immediate: false, cacheTime: 0 }
    const a = stx.useQuery(url, options)
    const b = stx.useQuery(url, options)
    await Promise.all([a.refetch(), b.refetch()])
    version = 2
    g.window.dispatchEvent(new g.window.CustomEvent('stx:outbox', { detail: { sent: { id: 'ack', affects: [url] } } }))
    g.window.dispatchEvent(new g.window.CustomEvent('stx:updated', { detail: { kind: 'api', url } }))
    await settle()
    expect(calls).toEqual([url, url])
    expect([a.data(), b.data()]).toEqual([2, 2])
  })

  it('discards a kept answer when a no-store response fails JSON parsing', async () => {
    const url = `/api/keep/${++seq}`
    const stx = g.window.stx
    const options = { immediate: false, keep: true, cacheTime: 0, scope: 'malformed' }
    answer = () => 'visible answer'
    const reader = stx.useQuery(url, options)
    await reader.refetch()
    g.fetch = async () => new Response('{broken', { headers: { 'Cache-Control': 'no-store' } })
    await reader.refetch()
    expect(reader.data()).toBe('visible answer')
    expect(reader.error()).toBeTruthy()
    expect(stx.useQuery(url, options).data()).toBeNull()
  })

  it('coalesces a worker update across readers of the same request', async () => {
    const url = `/api/keep/${++seq}`
    let version = 1
    answer = () => version
    const stx = g.window.stx
    const options = { immediate: false, staleTime: 60_000 }
    const a = stx.useQuery(url, options)
    const b = stx.useQuery(url, options)
    await Promise.all([a.refetch(), b.refetch()])
    version = 2
    g.window.dispatchEvent(new g.window.CustomEvent('stx:updated', { detail: { kind: 'api', url: `http://localhost${url}` } }))
    await settle()
    expect(calls).toEqual([url, url])
    expect([a.data(), b.data()]).toEqual([2, 2])
  })

  it('replaces a previously kept answer when the server responds with no-store', async () => {
    const url = `/api/keep/${++seq}`
    answer = () => 'was reusable'
    const stx = g.window.stx
    const options = { immediate: false, keep: true, cacheTime: 0, scope: 'no-store' }
    const query = stx.useQuery(url, options)
    await query.refetch()
    expect(stx.useQuery(url, options).data()).toBe('was reusable')
    g.fetch = async () => Response.json('never store', { headers: { 'Cache-Control': 'no-store' } })
    await query.refetch()
    expect(query.data()).toBe('never store')
    expect(stx.useQuery(url, options).data()).toBeNull()
    await stx.flushKeptState()
    expect(local.getItem(`stx:kept:no-store:query:${url}`)).not.toContain('never store')
  })

  it('keeps the answer per account and seeds the next visit with it, refreshed behind', async () => {
    const url = `/api/keep/${++seq}`
    answer = () => ({ n: 1 })
    g.window.stx.setKeptScope(77)
    const first = g.window.stx.useQuery(url, { keep: true, immediate: false })
    await first.refetch()
    expect(JSON.parse(local.getItem(`stx:kept:77:query:${url}`)!).d).toEqual({ n: 1 })

    answer = () => ({ n: 2 })
    const next = g.window.stx.useQuery(url, { keep: true, immediate: false })
    expect(next.data()).toEqual({ n: 1 })
    expect(next.loading()).toBe(false)
    expect(next.isStale()).toBe(true)
    await next.refetch({ background: true })
    expect(next.data()).toEqual({ n: 2 })
    expect(next.loading()).toBe(false)

    // Another account sees nothing of it.
    g.window.stx.setKeptScope(116)
    expect(g.window.stx.useQuery(url, { keep: true, immediate: false }).data()).toBeNull()
    g.window.stx.setKeptScope(undefined)
  })

  it('keeps under a name of its own, and nothing for a scope of false', async () => {
    const url = `/api/keep/${++seq}`
    answer = () => [1]
    await g.window.stx.useQuery(url, { keep: 'week', scope: 5, immediate: false }).refetch()
    expect(local.getItem('stx:kept:5:query:week')).not.toBeNull()
    const before = local.length
    await g.window.stx.useQuery(`/api/keep/${++seq}`, { keep: true, scope: false, immediate: false }).refetch()
    expect(local.length).toBe(before)
  })

  it('shows a write waiting in the outbox on top of the answer', async () => {
    const url = `/api/keep/${++seq}`
    answer = () => [79]
    const box = useOutbox(`keep-${seq}`, {
      storage: new MemoryStorage(),
      fetch: async () => { throw new TypeError('offline') },
    })
    const q = g.window.stx.useQuery(url, { immediate: false })
    await q.refetch()
    await box.send(url, { method: 'POST', affects: [url], apply: (list: number[]) => [...list, 80] })
    expect(q.data()).toEqual([79, 80])
    await q.refetch()
    expect(q.data()).toEqual([79, 80])
    box.stop()
  })

  it('refetches when the offline worker says its answer changed', async () => {
    const url = `/api/keep/${++seq}`
    let n = 1
    answer = () => ({ n })
    const q = g.window.stx.useQuery(url, { immediate: false, staleTime: 60_000 })
    await q.refetch()
    n = 2
    g.window.dispatchEvent(new g.window.CustomEvent('stx:updated', { detail: { kind: 'api', url: `http://localhost${url}` } }))
    await settle()
    expect(q.data()).toEqual({ n: 2 })
  })
})

describe('the runtime\'s kept state', () => {
  it('exposes cachedQuery, setKeptScope and flushKeptState', async () => {
    expect(typeof g.window.stx.cachedQuery).toBe('function')
    expect(typeof g.window.cachedQuery).toBe('function')
    expect(typeof g.window.stx.setKeptScope).toBe('function')
    await g.window.stx.flushKeptState()
    answer = () => ({ ok: true })
    const q = g.window.stx.cachedQuery(`runtime-${++seq}`, { url: '/api/runtime', scope: 9 })
    expect(await q.load()).toEqual({ ok: true })
    expect(q.data()).toEqual({ ok: true })
  })

  it('applies setKeptScope to keptState given no scope', () => {
    g.window.stx.setKeptScope('acct')
    g.window.stx.keptState('tab', 'today').set('plan')
    expect(local.getItem('stx:kept:acct:tab')).toBe('"plan"')
    g.window.stx.setKeptScope(undefined)
  })
})
