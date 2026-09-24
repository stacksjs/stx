import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRouteRuleResolver, validateRouteRules } from '../../src/route-rules'
import { RouteResponseCache } from '../../src/route-response-cache'
import { buildForProduction } from '../../src/production-builder'
import { startProductionServer } from '../../src/production-server'
import { loadManifest } from '../../src/manifest'

const policy = { public: true as const, maxAge: 1, swr: 2 }
const request = (path = '/page', headers?: Record<string, string>, method = 'GET'): Request => new Request(`http://localhost${path}`, { headers, method })

describe('route rules', () => {
  it('uses deterministic specificity, not insertion order or implicit inheritance', () => {
    const rules = { '/**': { cache: policy }, '/shop/*': { cache: false as const }, '/shop/:id': { rendering: 'dynamic' as const }, '/shop/new': { rendering: 'prerender' as const }, '/shop': { cache: false as const } }
    for (const ordered of [rules, Object.fromEntries(Object.entries(rules).reverse())]) {
      const resolve = createRouteRuleResolver(ordered)
      expect(resolve('/else')).toEqual({ cache: policy })
      expect(resolve('/shop/new')).toEqual({ rendering: 'prerender' })
      expect(resolve('/shop/42/')).toEqual({ rendering: 'dynamic' })
      expect(resolve('/shop')).toEqual({ cache: false })
      expect(resolve('/shop/a/b')).toEqual({ cache: policy })
    }
  })

  it('rejects unsupported patterns, modes and unsafe cache settings', () => {
    for (const rules of [
      { 'bad': {} }, { '/foo/**/bar': {} }, { '/foo*': {} },
      { '/': { rendering: 'spa' } }, { '/': { cache: { maxAge: 10 } } },
      { '/': { cache: { public: true, maxAge: 0 } } },
      { '/': { cache: { ...policy, swr: -1 } } },
      { '/': { rendering: 'prerender', cache: policy } }, { '/': { isr: true } },
    ]) expect(() => validateRouteRules(rules as any)).toThrow()
  })
})

describe('origin response cache', () => {
  it('separates query, origin and document/fragment variants; expires and invalidates', async () => {
    let time = 0
    let renders = 0
    const cache = new RouteResponseCache(() => time)
    const render = async (): Promise<Response> => new Response(String(++renders))
    const get = async (req = request()): Promise<string> => (await cache.respond(req, { ...policy, swr: 0 }, render)).text()
    expect(await get()).toBe('1')
    expect(await get()).toBe('1')
    expect(await get(request('/page', { 'X-STX-Router': 'true' }))).toBe('2')
    expect(await get(request('/page?a=1'))).toBe('3')
    expect(await get(new Request('http://other/page'))).toBe('4')
    time = 1000
    expect(await get()).toBe('5')
    cache.invalidate('/page')
    expect(await get()).toBe('6')
    expect(await get(request('/page', { 'X-STX-Router': 'true' }))).toBe('7')
  })

  it('bypasses credentials, actions, response cookies, private headers, errors and Vary', async () => {
    for (const [req, init, enabled] of [
      [request('/page', { Cookie: 'session=alice' }), {}, policy],
      [request('/page', { Authorization: 'Bearer token' }), {}, policy],
      [request('/page', {}, 'POST'), {}, policy],
      [request(), { headers: { 'Set-Cookie': 'session=alice' } }, policy],
      [request(), { headers: { 'Cache-Control': 'private' } }, policy],
      [request(), { headers: { Vary: 'Accept-Language' } }, policy],
      [request(), { status: 500 }, policy],
      [request(), {}, false],
    ] as const) {
      const cache = new RouteResponseCache()
      let calls = 0
      const render = async (): Promise<Response> => new Response(String(++calls), init)
      expect(await (await cache.respond(req, enabled, render)).text()).toBe('1')
      const second = await cache.respond(req, enabled, render)
      expect(await second.text()).toBe('2')
      expect(second.headers.get('Cache-Control')).toBe('private, no-store')
      expect(second.headers.get('Vary')).toContain('X-STX-Router')
    }
  })

  it('coalesces background revalidation and preserves stale on failure only within the SWR window', async () => {
    let time = 0
    let calls = 0
    let finish!: (response: Response) => void
    const cache = new RouteResponseCache(() => time)
    const render = (): Promise<Response> => {
      calls++
      return calls === 1 ? Promise.resolve(new Response('first')) : new Promise(resolve => { finish = resolve })
    }
    expect(await (await cache.respond(request(), policy, render)).text()).toBe('first')
    time = 1500
    expect(await (await cache.respond(request(), policy, render)).text()).toBe('first')
    expect(await (await cache.respond(request(), policy, render)).text()).toBe('first')
    expect(calls).toBe(2)
    finish(new Response('failed', { status: 500 }))
    await new Promise(resolve => setTimeout(resolve, 0))
    time = 3000
    const expired = cache.respond(request(), policy, render)
    finish(new Response('failed again', { status: 500 }))
    expect((await expired).status).toBe(500)
    expect(calls).toBe(3)
  })

  it('invalidation prevents an in-flight refresh from resurrecting stale data', async () => {
    let finish!: (response: Response) => void
    const cache = new RouteResponseCache()
    const pending = cache.respond(request(), policy, () => new Promise(resolve => { finish = resolve }))
    cache.invalidate('/page')
    finish(new Response('old'))
    await pending
    expect(await (await cache.respond(request(), policy, async () => new Response('new'))).text()).toBe('new')
  })

  it('replaces stale data after a successful background refresh', async () => {
    let time = 0
    const cache = new RouteResponseCache(() => time)
    await cache.respond(request(), policy, async () => new Response('before'))
    time = 1001
    expect(await (await cache.respond(request(), policy, async () => new Response('after'))).text()).toBe('before')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(await (await cache.respond(request(), policy, async () => { throw new Error('should hit') })).text()).toBe('after')
  })

  it('does not share a private response across concurrent anonymous requests', async () => {
    const cache = new RouteResponseCache()
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    const first = cache.respond(request(), policy, async () => {
      await gate
      return new Response('alice', { headers: { 'Set-Cookie': 'user=alice' } })
    })
    const second = cache.respond(request(), policy, async () => new Response('bob', { headers: { 'Set-Cookie': 'user=bob' } }))
    release()
    expect(await (await first).text()).toBe('alice')
    expect(await (await second).text()).toBe('bob')
  })
})

let dir: string | undefined
let server: Awaited<ReturnType<typeof startProductionServer>> | undefined
afterEach(async () => {
  server?.stop()
  server = undefined
  if (dir) await rm(dir, { recursive: true, force: true })
  dir = undefined
  delete (globalThis as any).__route_rule_count
  delete (globalThis as any).__route_rule_fail
})

it('builds and serves prerender/dynamic rules with matching SPA policy and explicit invalidation', async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-rules-'))
  const source = `<script server>
globalThis.__route_rule_count = (globalThis.__route_rule_count || 0) + 1
const count = globalThis.__route_rule_count
if (globalThis.__route_rule_fail) throw new Error('upstream failed')
</script><html><head></head><body><main><p>{{ count }}</p></main></body></html>`
  await Bun.write(path.join(dir, 'pages/frozen.stx'), source)
  await Bun.write(path.join(dir, 'pages/live.stx'), source)
  const built = await buildForProduction({ root: dir, routeRules: { '/frozen': { rendering: 'prerender' }, '/live': { rendering: 'dynamic', cache: policy } } })
  expect(loadManifest(built.outputDir)?.routes.find(route => route.pattern === '/frozen')?.prerendered).toBe(true)
  server = await startProductionServer({ outputDir: built.outputDir, port: 0 })
  const get = async (url: string, fragment = false): Promise<string> => (await fetch(`http://localhost:${server!.port}${url}`, { headers: fragment ? { 'X-STX-Router': 'true' } : {} })).text()
  const frozen = await get('/frozen')
  expect(await get('/frozen')).toBe(frozen)
  const live = await get('/live')
  expect(await get('/live')).toBe(live)
  const fragment = await get('/live', true)
  expect(fragment).not.toContain('<html')
  expect(fragment).not.toContain('__STX_PLACEHOLDER')
  expect(await get('/live', true)).toBe(fragment)
  expect(await get('/live')).toBe(live)
  server.invalidate('/live')
  expect(await get('/live')).not.toBe(live)
  ;(globalThis as any).__route_rule_fail = true
  server.invalidate('/live')
  expect((await fetch(`http://localhost:${server.port}/live`)).status).toBe(500)
  expect((await fetch(`http://localhost:${server.port}/frozen`, { method: 'POST' })).status).toBe(405)
})

it('never shares authenticated SSR data, including hydration payloads and fragments', async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-private-rules-'))
  await Bun.write(path.join(dir, 'pages/profile.stx'), `<script server>
const user = await useServerData('user', () => typeof request === 'undefined' ? 'build-user' : (request.headers.get('Cookie') || 'anonymous'))
</script><html><head></head><body><main><p>{{ user }}</p></main></body></html>`)
  const built = await buildForProduction({ root: dir, routeRules: { '/profile': { rendering: 'dynamic', cache: policy } } })
  server = await startProductionServer({ outputDir: built.outputDir, port: 0 })
  for (const fragment of [false, true]) {
    for (const name of ['alice', 'bob']) {
      const response = await fetch(`http://localhost:${server.port}/profile`, { headers: { Cookie: name, ...(fragment ? { 'X-STX-Router': 'true' } : {}) } })
      expect(response.headers.get('Cache-Control')).toBe('private, no-store')
      const html = await response.text()
      expect(html).toContain(`<p>${name}</p>`)
      expect(html).toContain(`{"user":"${name}"}`)
      expect(html).not.toContain('build-user')
      expect(html.includes('<html')).toBe(!fragment)
    }
  }
})
