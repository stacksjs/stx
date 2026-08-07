/**
 * The data layer has one place to hook (stacksjs/stx#1855).
 *
 * `useFetch`, `useQuery` and `useMutation` had no way to carry an auth header
 * or to observe a 401. Every call site had to pass `headers` by hand, and
 * there was nowhere at all to notice that a response came back unauthorized —
 * so an app ended up keeping hand-written `fetch()` calls next to the
 * primitives that were supposed to replace them, just to get a token on the
 * request.
 *
 * All three primitives funnel through `__stxFetch`, the only `fetch` call in
 * the runtime, so one pair of hooks covers all of them. That is asserted here
 * rather than assumed: a hook registered once is checked against each of the
 * three primitives in turn.
 *
 * Second, smaller hole: `headers` was spread as `...(options.headers || {})`,
 * and object spread over a function copies no own enumerable properties. So
 * passing `headers: () => ({ Authorization: ... })` — the obvious way to
 * evaluate a token per request — contributed nothing, in silence.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

interface Seen { url: string, opts: any }
let seen: Seen[] = []
let realFetch: typeof globalThis.fetch
let nextStatus = 200

const settle = () => new Promise(r => setTimeout(r, 20))

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  realFetch = globalThis.fetch
})

beforeEach(() => {
  seen = []
  nextStatus = 200
  globalThis.fetch = (async (url: string, opts: any) => {
    seen.push({ url: String(url), opts })
    return new Response(JSON.stringify({ ok: true }), {
      status: nextStatus,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as never
})

afterEach(() => {
  globalThis.fetch = realFetch
  // Hooks are global. Leaving one installed would leak into the next test and,
  // worse, into unrelated suites sharing this runtime instance.
  g.window.stx.configureFetch({})
})

function headerOf(entry: Seen, name: string): unknown {
  return entry.opts?.headers?.[name]
}

describe('configureFetch reaches every primitive (#1855)', () => {
  it('is exposed on window.stx', () => {
    // An interceptor nobody can reach is the same as no interceptor. This is
    // also registered in STX_RUNTIME_GLOBALS so a <script client> can call it
    // without touching window.stx by hand.
    expect(typeof g.window.stx.configureFetch).toBe('function')
  })

  it('adds a header to useFetch', async () => {
    g.window.stx.configureFetch({
      onRequest: (ctx: any) => { ctx.options.headers.Authorization = 'Bearer t' },
    })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(seen).toHaveLength(1)
    expect(headerOf(seen[0], 'Authorization')).toBe('Bearer t')
  })

  it('adds a header to useQuery', async () => {
    g.window.stx.configureFetch({
      onRequest: (ctx: any) => { ctx.options.headers.Authorization = 'Bearer t' },
    })

    g.window.stx.useQuery('/api/q1', { immediate: false }).refetch()
    await settle()

    expect(seen).toHaveLength(1)
    expect(headerOf(seen[0], 'Authorization')).toBe('Bearer t')
  })

  it('adds a header to useMutation', async () => {
    g.window.stx.configureFetch({
      onRequest: (ctx: any) => { ctx.options.headers.Authorization = 'Bearer t' },
    })

    await g.window.stx.useMutation('/api/m').mutate({ a: 1 })
    await settle()

    expect(seen).toHaveLength(1)
    expect(headerOf(seen[0], 'Authorization')).toBe('Bearer t')
  })

  it('sees which primitive made the call', async () => {
    const sources: string[] = []
    g.window.stx.configureFetch({ onRequest: (ctx: any) => { sources.push(ctx.source) } })

    g.window.stx.useQuery('/api/q2', { immediate: false }).refetch()
    await settle()

    expect(sources).toEqual(['useQuery'])
  })

  it('can rewrite the URL, so a baseURL needs no new option', async () => {
    g.window.stx.configureFetch({
      onRequest: (ctx: any) => { ctx.url = `https://api.example.com${ctx.url}` },
    })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(seen[0]?.url).toBe('https://api.example.com/api/a')
  })

  it('supports an async onRequest, for a token that must be refreshed first', async () => {
    g.window.stx.configureFetch({
      onRequest: async (ctx: any) => {
        await new Promise(r => setTimeout(r, 5))
        ctx.options.headers.Authorization = 'Bearer refreshed'
      },
    })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(headerOf(seen[0], 'Authorization')).toBe('Bearer refreshed')
  })
})

describe('onResponse (#1855)', () => {
  it('observes the status, which is how an app notices a 401', async () => {
    nextStatus = 401
    const statuses: number[] = []
    g.window.stx.configureFetch({
      onResponse: (ctx: any) => { statuses.push(ctx.response.status) },
    })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(statuses).toEqual([401])
  })

  it('runs on success too', async () => {
    const statuses: number[] = []
    g.window.stx.configureFetch({
      onResponse: (ctx: any) => { statuses.push(ctx.response.status) },
    })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(statuses).toEqual([200])
  })
})

describe('configureFetch replaces rather than stacks (#1855)', () => {
  it('a second call does not leave the first hook installed', async () => {
    let first = 0
    let second = 0
    g.window.stx.configureFetch({ onRequest: () => { first++ } })
    g.window.stx.configureFetch({ onRequest: () => { second++ } })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    // Stacking would send two Authorization headers from a module that gets
    // re-evaluated by hot reload or re-run after an SPA swap.
    expect(first).toBe(0)
    expect(second).toBe(1)
  })

  it('an empty config clears the hooks', async () => {
    let calls = 0
    g.window.stx.configureFetch({ onRequest: () => { calls++ } })
    g.window.stx.configureFetch({})

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(calls).toBe(0)
  })

  it('ignores a non-function hook instead of crashing every request', async () => {
    g.window.stx.configureFetch({ onRequest: 'nope' })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(seen).toHaveLength(1)
  })
})

describe('a headers function is resolved (#1855)', () => {
  it('useQuery evaluates headers per request', async () => {
    let token = 'first'
    g.window.stx.useQuery('/api/q3', { immediate: false, headers: () => ({ Authorization: token }) }).refetch()
    await settle()
    expect(headerOf(seen[0], 'Authorization')).toBe('first')

    token = 'second'
    g.window.stx.useQuery('/api/q4', { immediate: false, headers: () => ({ Authorization: token }) }).refetch()
    await settle()
    // Spreading a function copied nothing, so this header used to be absent
    // with no error anywhere.
    expect(headerOf(seen[1], 'Authorization')).toBe('second')
  })

  it('still accepts a plain object', async () => {
    g.window.stx.useQuery('/api/q5', { immediate: false, headers: { 'X-Trace': 'abc' } }).refetch()
    await settle()
    expect(headerOf(seen[0], 'X-Trace')).toBe('abc')
  })

  it('useMutation evaluates headers per request', async () => {
    await g.window.stx.useMutation('/api/m', { headers: () => ({ 'X-Trace': 'm' }) }).mutate({})
    await settle()
    expect(headerOf(seen[0], 'X-Trace')).toBe('m')
  })
})

/**
 * onResponseError is where a 401 -> refresh -> retry lives, once, instead of at
 * every call site (#1855). It fires for a non-ok response and for a thrown
 * fetch; returning a Response replaces the failed one, which is what lets the
 * refreshed request stand in for the one that 401'd. Observing a status is
 * onResponse's job — this hook is specifically the recovery point.
 */
describe('onResponseError recovers a failed request (#1855)', () => {
  it('fires on a non-ok response, with the Response in hand', async () => {
    nextStatus = 401
    const statuses: number[] = []
    g.window.stx.configureFetch({
      onResponseError: (ctx: any) => { statuses.push(ctx.response.status) },
    })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(statuses).toEqual([401])
  })

  it('does not fire on a successful response', async () => {
    const calls: number[] = []
    g.window.stx.configureFetch({ onResponseError: () => { calls.push(1) } })

    g.window.stx.useFetch('/api/a', { immediate: false }).refetch()
    await settle()

    expect(calls).toEqual([])
  })

  it('a returned Response replaces the failed one — the 401 -> refresh -> retry shape', async () => {
    nextStatus = 401
    const f = g.window.stx.useFetch('/api/protected', { immediate: false })
    g.window.stx.configureFetch({
      onResponseError: async (ctx: any) => {
        // A real hook refreshes the token here, then re-issues with a plain
        // fetch() so it does not re-enter this hook and loop. The retried
        // Response stands in for the 401.
        if (ctx.response && ctx.response.status === 401) {
          return new Response(JSON.stringify({ user: 'me' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    })

    f.refetch()
    await settle()

    expect(f.data()).toEqual({ user: 'me' })
    expect(f.error()).toBe(null)
  })

  it('returning nothing lets the original error stand, body and all', async () => {
    nextStatus = 500
    const f = g.window.stx.useFetch('/api/a', { immediate: false })
    g.window.stx.configureFetch({ onResponseError: () => {} })

    f.refetch()
    await settle()

    expect(f.error()).not.toBe(null)
    // #1848: the status survives to the consumer, not just a string message.
    expect(f.error().status).toBe(500)
  })

  it('also recovers a network failure, where there is no Response at all', async () => {
    g.window.stx.configureFetch({
      onResponseError: (ctx: any) => {
        // response is null on a thrown fetch; error carries the throw.
        if (ctx.response === null && ctx.error) {
          return new Response(JSON.stringify({ recovered: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    })
    globalThis.fetch = (async () => { throw new Error('network down') }) as never

    const f = g.window.stx.useFetch('/api/a', { immediate: false })
    f.refetch()
    await settle()

    expect(f.data()).toEqual({ recovered: true })
    expect(f.error()).toBe(null)
  })

  it('reaches useQuery and useMutation through the same choke point', async () => {
    nextStatus = 401
    const hit: string[] = []
    g.window.stx.configureFetch({ onResponseError: (ctx: any) => { hit.push(ctx.source) } })

    g.window.stx.useQuery('/api/q', { immediate: false }).refetch()
    await settle()
    await g.window.stx.useMutation('/api/m').mutate({}).catch(() => {})
    await settle()

    expect(hit).toContain('useQuery')
    expect(hit).toContain('useMutation')
  })
})
