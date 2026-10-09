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
  saved.localStorage = g.localStorage
  saved.fetch = g.fetch
  g.localStorage = local
  if (g.window) g.window.localStorage = local
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterAll(() => {
  g.localStorage = saved.localStorage
  if (g.window) g.window.localStorage = saved.localStorage
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
