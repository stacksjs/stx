import { describe, expect, it } from 'bun:test'
import { runInNewContext } from 'node:vm'
import { signalsFetchRuntime } from '../../src/client/signals-fetch-runtime'

function harness() {
  const mounts: Array<() => void> = []
  const destroys: Array<() => void> = []
  const polls = new Map<number, () => void>()
  const listeners = new Set<() => void>()
  const calls: RequestInit[] = []
  let respond = () => Promise.resolve(new Response('{"value":1}'))
  const scope: any = {
    AbortController, Number, console: { error() {} },
    state: (value: unknown) => Object.assign(() => value, { set: (next: unknown) => { value = next } }),
    onMount: (fn: () => void) => mounts.push(fn), onDestroy: (fn: () => void) => destroys.push(fn),
    __stxHeaders: (headers: unknown) => headers || {},
    __stxFetch: (label: string, url: string, init: RequestInit) => { calls.push(init); return respond() },
    __stxHttpError: async (response: Response) => Object.assign(new Error('HTTP ' + response.status), { status: response.status }),
    setInterval: (fn: () => void) => { const id = polls.size + 1; polls.set(id, fn); return id },
    clearInterval: (id: number) => polls.delete(id),
    document: { visibilityState: 'visible', addEventListener: (event: string, fn: () => void) => listeners.add(fn), removeEventListener: (event: string, fn: () => void) => listeners.delete(fn) },
  }
  runInNewContext(signalsFetchRuntime('() => undefined', '() => {}') + '\nglobalThis.useFetch = useFetch;', scope)
  return { calls, polls, listeners, useFetch: scope.useFetch, mount() { mounts.forEach(fn => fn()) }, destroy() { destroys.forEach(fn => fn()) }, response(fn: typeof respond) { respond = fn } }
}
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }

describe('generated useFetch polling transport', () => {
  it('forwards no-store and exposes revocation status while retaining the old snapshot', async () => {
    const h = harness()
    const fetch = h.useFetch('/live/token', { immediate: false, cache: 'no-store', initialData: { old: true } })
    h.response(() => Promise.resolve(new Response('{}', { status: 404, statusText: 'Not Found' })))
    await fetch.refetch()
    expect(h.calls[0]?.cache).toBe('no-store')
    expect(fetch.status()).toBe(404)
    expect(fetch.statusText()).toBe('Not Found')
    expect(fetch.data()).toEqual({ old: true })
    expect(fetch.error()).toBeTruthy()
  })
  it('polls in the background, skips an in-flight request and cleans up on scope destruction', async () => {
    const h = harness()
    let resolve!: (value: Response) => void
    h.response(() => new Promise(done => { resolve = done }))
    const fetch = h.useFetch('/live/token', { initialData: { value: 0 }, refetchInterval: 15000, refetchOnFocus: true })
    h.mount()
    expect(h.calls).toHaveLength(1)
    h.polls.forEach(tick => tick())
    expect(h.calls).toHaveLength(1)
    resolve(new Response('{"value":1}'))
    await settle()
    expect(fetch.loading()).toBe(false)
    h.polls.forEach(tick => tick())
    expect(fetch.isFetching()).toBe(true)
    expect(fetch.loading()).toBe(false)
    expect(fetch.data()).toEqual({ value: 1 })
    h.destroy()
    expect(h.polls.size).toBe(0)
    expect(h.listeners.size).toBe(0)
    expect(h.calls.at(-1)?.signal?.aborted).toBe(true)
    resolve(new Response('{"value":2}'))
    await settle()
    expect(fetch.data()).toEqual({ value: 1 })
  })
  it('refreshes on focus and makes abort release both polling and focus listeners', async () => {
    const h = harness()
    const fetch = h.useFetch('/live/token', { refetchInterval: 15000, refetchOnFocus: true })
    h.mount()
    await settle()
    h.listeners.forEach(fn => fn())
    await settle()
    expect(h.calls).toHaveLength(2)
    expect(fetch.status()).toBe(200)
    fetch.abort()
    expect(h.polls.size).toBe(0)
    expect(h.listeners.size).toBe(0)
  })
})
