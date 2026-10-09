import { describe, expect, it } from 'bun:test'
import { generateOfflineWorker, OFFLINE_REGISTER_SCRIPT, offlineRoute } from '../../src/offline/app-service-worker'
import { processDirectives } from '../../src/process'

describe('the offline worker', () => {
  const worker = generateOfflineWorker({ enabled: true, pages: ['/m', '/m/calendar', 'not-a-path'], apiPrefix: '/api/', networkTimeoutMs: 2000 }, 'build123')

  it('is a script a browser can run', () => {
    // eslint-disable-next-line no-new-func
    expect(() => new Function('self', 'caches', 'fetch', worker)).not.toThrow()
  })

  it('keeps its regular expressions intact through the template', () => {
    // A backslash lost in the template string turned \\d into d and \\. into
    // "any character": seeking read the wrong bytes.
    expect(worker).toContain('/bytes=(\\d*)-(\\d*)/')
    expect(worker).toContain('/\\.(?:mp4|m4v|mov|webm|m3u8|mp3|m4a)$/i')
    expect(worker).toContain('/\\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg|ico)$/')
  })

  it('carries its build, its screens and its API prefix', () => {
    const settings = JSON.parse(worker.match(/var S = (\{.*\});/)![1]!)
    expect(settings.build).toBe('build123')
    expect(settings.pages).toEqual(['/m', '/m/calendar'])
    expect(settings.api).toBe('/api/')
    expect(settings.timeout).toBe(2000)
    expect(generateOfflineWorker({ enabled: true }, 'b')).toContain('"timeout":1500')
    expect(settings.fallback).toBe('/m')
    expect(settings.exclude).toContain('/_stx/hmr')
  })

  it('keeps each build\'s screens apart and API answers per signed-in token', () => {
    expect(worker).toContain('\'stx-shell-\' + S.build')
    expect(worker).toContain('__stx_who')
    expect(worker).toContain('stx:clear-offline-data')
    // Only a full, same-origin answer is ever kept.
    expect(worker).not.toContain('response.ok')
    expect(worker).toContain('response.type === \'basic\'')
  })
})

describe('registering it', () => {
  const page = '<!DOCTYPE html><html><head><title>t</title></head><body><main>hi</main></body></html>'

  it('rides on every document when offline is on', async () => {
    const html = await processDirectives(page, {}, 'page.stx', { offline: { enabled: true } } as any, new Set())
    expect(html).toContain(OFFLINE_REGISTER_SCRIPT)
  })

  it('is absent otherwise', async () => {
    const html = await processDirectives(page, {}, 'page.stx', {} as any, new Set())
    expect(html).not.toContain('data-stx-offline')
  })
})

interface FakeClient { visibilityState: 'visible' | 'hidden', messages: any[], postMessage: (message: unknown) => void }

/** A window client of the app, as the worker sees it. */
function client(visibilityState: 'visible' | 'hidden' = 'visible'): FakeClient {
  const messages: any[] = []
  return { visibilityState, messages, postMessage: (message: unknown) => { messages.push(message) } }
}

interface RequestOptions { method?: string, mode?: string, cache?: string }

/**
 * The worker run against an in-memory Cache API, enough to drive it. Answers
 * from `network` are same-origin (`type: 'basic'`) unless it says otherwise;
 * returning null is no network at all.
 */
function runWorker(config: Parameters<typeof generateOfflineWorker>[0], network: (url: string, request?: Request) => Response | null | Promise<Response | null>) {
  const stores = new Map<string, Map<string, Response>>()
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map())
    const store = stores.get(name)!
    const keyOf = (r: string | Request) => typeof r === 'string' ? new URL(r, 'http://app.test').toString() : r.url
    return {
      match: async (r: string | Request) => store.get(keyOf(r))?.clone(),
      put: async (r: string | Request, response: Response) => { store.set(keyOf(r), response) },
      delete: async (r: string | Request) => store.delete(keyOf(r)),
      keys: async () => [...store.keys()].map(url => new Request(url)),
    }
  }
  const listeners: Record<string, (event: any) => void> = {}
  const clients: FakeClient[] = []
  let skipped = 0
  const self: any = {
    location: { origin: 'http://app.test' },
    addEventListener: (type: string, fn: (event: any) => void) => { listeners[type] = fn },
    skipWaiting: async () => { skipped++ },
    clients: { claim: async () => {}, matchAll: async () => clients },
    registration: { waiting: null as null | { messages: any[], postMessage: (m: unknown) => void } },
  }
  const caches = { open, delete: async (name: string) => stores.delete(name), keys: async () => [...stores.keys()] }
  const fetched: string[] = []
  const fetch = async (input: string | Request) => {
    const url = typeof input === 'string' ? input : input.url
    fetched.push(url)
    const answer = await network(url, typeof input === 'string' ? undefined : input)
    if (!answer) throw new TypeError('offline')
    if (answer.type === 'default') Object.defineProperty(answer, 'type', { value: 'basic' })
    return answer
  }
  // eslint-disable-next-line no-new-func
  new Function('self', 'caches', 'fetch', 'crypto', generateOfflineWorker(config, 'b1'))(self, caches, fetch, crypto)
  let background: Promise<unknown>[] = []
  return {
    stores,
    clients,
    fetched,
    self,
    get skipped() { return skipped },
    async install(): Promise<void> {
      let waited: Promise<unknown> = Promise.resolve()
      listeners.install!({ waitUntil: (p: Promise<unknown>) => { waited = p } })
      await waited
    },
    async activate(): Promise<void> {
      let waited: Promise<unknown> = Promise.resolve()
      listeners.activate!({ waitUntil: (p: Promise<unknown>) => { waited = p } })
      await waited
    },
    async message(data: unknown): Promise<any> {
      let waited: Promise<unknown> = Promise.resolve()
      let replied: unknown
      listeners.message!({ data, ports: [{ postMessage: (value: unknown) => { replied = value } }], waitUntil: (p: Promise<unknown>) => { waited = p } })
      await waited
      return replied
    },
    async request(url: string, headers: Record<string, string> = {}, options: RequestOptions = {}): Promise<Response | null> {
      let answer: Promise<Response> | null = null
      const request = new Request(url, { headers, method: options.method || 'GET' })
      if (options.mode) Object.defineProperty(request, 'mode', { value: options.mode })
      if (options.cache) Object.defineProperty(request, 'cache', { value: options.cache })
      listeners.fetch!({
        request,
        respondWith: (p: Promise<Response>) => { answer = p },
        waitUntil: (p: Promise<unknown>) => { background.push(p) },
      })
      return answer ? await answer : null
    },
    /** Wait for what the worker does behind an answer: revalidating, keeping copies. */
    async settle(): Promise<void> {
      while (background.length) {
        const pending = background
        background = []
        await Promise.all(pending)
      }
    },
  }
}

describe('media kept for offline', () => {
  const video = new Uint8Array(1000).map((_, i) => i % 256)
  const url = 'http://app.test/api/exercise-videos/abc123.mp4'

  it('keeps a video whole and answers a seek from the device with no network', async () => {
    let online = true
    const sw = runWorker({ enabled: true }, u => online && u === url ? new Response(video, { status: 200, headers: { 'Content-Type': 'video/mp4' } }) : null)
    const reply = await sw.message({ type: 'stx:cache-media', urls: [url] })
    expect(reply.kept).toEqual([url])

    online = false
    const whole = await sw.request(url)
    expect(whole!.status).toBe(200)
    expect((await whole!.arrayBuffer()).byteLength).toBe(1000)

    const part = await sw.request(url, { Range: 'bytes=100-199' })
    expect(part!.status).toBe(206)
    expect(part!.headers.get('Content-Range')).toBe('bytes 100-199/1000')
    const bytes = new Uint8Array(await part!.arrayBuffer())
    expect(bytes.length).toBe(100)
    expect(bytes[0]).toBe(100)

    const tail = await sw.request(url, { Range: 'bytes=900-' })
    expect(tail!.headers.get('Content-Range')).toBe('bytes 900-999/1000')
    expect((await sw.request(url, { Range: 'bytes=5000-' }))!.status).toBe(416)
  })

  it('drops the oldest past its size limit, never one just asked for', async () => {
    const big = (n: number) => new Response(new Uint8Array(n), { status: 200 })
    const sw = runWorker({ enabled: true, mediaMaxBytes: 1 }, () => big(6 * 1024 * 1024))
    await sw.message({ type: 'stx:cache-media', urls: ['http://app.test/a.mp4'] })
    await new Promise(resolve => setTimeout(resolve, 5))
    const reply = await sw.message({ type: 'stx:cache-media', urls: ['http://app.test/b.mp4', 'http://app.test/c.mp4'] })
    // 10 MB is the floor: two 6 MB files do not fit, the older a.mp4 goes.
    expect(reply.kept.sort()).toEqual(['http://app.test/b.mp4', 'http://app.test/c.mp4'])
  })

  it('keeps a video the page already stored without fetching it again', async () => {
    let fetched = 0
    const sw = runWorker({ enabled: true }, () => { fetched++; return null })
    sw.stores.set('stx-media', new Map([[url, new Response(video, { status: 200, headers: { 'Content-Type': 'video/mp4' } })]]))
    const reply = await sw.message({ type: 'stx:cache-media', urls: [url] })
    expect(reply.kept).toEqual([url])
    expect(fetched).toBe(0)
    const part = await sw.request(url, { Range: 'bytes=0-9' })
    expect(part!.headers.get('Content-Range')).toBe('bytes 0-9/1000')
  })

  it('streams a download into the cache rather than reading it whole', async () => {
    let pulled = 0
    const streamed = () => new Response(new ReadableStream({
      pull(controller) {
        if (pulled >= 4) return controller.close()
        pulled++
        controller.enqueue(new Uint8Array(250))
      },
    }), { status: 200, headers: { 'Content-Type': 'video/mp4' } })
    const sw = runWorker({ enabled: true }, u => (u === url ? streamed() : null))
    const reply = await sw.message({ type: 'stx:cache-media', urls: [url] })
    expect(reply.kept).toEqual([url])
    const whole = await sw.request(url)
    expect((await whole!.arrayBuffer()).byteLength).toBe(1000)
    expect(whole!.headers.get('Accept-Ranges')).toBe('bytes')
  })

  it('forgets kept media on sign-out', async () => {
    const sw = runWorker({ enabled: true }, () => new Response(video, { status: 200 }))
    await sw.message({ type: 'stx:cache-media', urls: [url] })
    await sw.message({ type: 'stx:clear-offline-data' })
    expect(sw.stores.has('stx-media')).toBe(false)
  })
})

describe('a screen not kept whole', () => {
  it('is answered offline with the first screen, marked as a stand-in', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => null)
    sw.stores.set('stx-shell-b1', new Map([
      ['http://app.test/m', new Response('<!doctype html><html><head><title>Today</title></head><body>Today</body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } })],
    ]))
    const page = await sw.request('http://app.test/m/go/7', { Accept: 'text/html' })
    const html = await page!.text()
    expect(page!.status).toBe(200)
    expect(html).toContain('<head><meta name="stx-offline-fallback" content="1"><title>Today</title>')
    expect(html).toContain('<body>Today</body>')
  })

  it('leaves a screen it kept unmarked', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => null)
    sw.stores.set('stx-shell-b1', new Map([
      ['http://app.test/m', new Response('<html><head></head><body>Today</body></html>', { status: 200 })],
    ]))
    const page = await sw.request('http://app.test/m', { Accept: 'text/html' })
    expect(await page!.text()).not.toContain('stx-offline-fallback')
  })
})

describe('a dynamic screen never opened', () => {
  const paramsScript = (json: string) => `<script data-stx-route-params>(function(){var p=${json};window.__stx_rp=p;if(window.stx){window.stx._rp=p;if(window.stx.setRouteParams)window.stx.setRouteParams(p)}})()</script>`
  const sessionPage = (id: string) => `<html><head>${paramsScript(`{"id":"${id}"}`)}</head><body>Session</body></html>`

  it('matches `:param` and `[param]` routes, and leaves static ones out', () => {
    expect(offlineRoute('/m/workout/:id')).toEqual({ path: '/m/workout/:id', re: '^/m/workout/([^/]+)/?$', names: ['id'], sample: '/m/workout/0' })
    expect(offlineRoute('/m/go/[id]')!.sample).toBe('/m/go/0')
    expect(new RegExp(offlineRoute('/a.b/:x/c')!.re).test('/a.b/7/c')).toBe(true)
    expect(new RegExp(offlineRoute('/a.b/:x/c')!.re).test('/aXb/7/c')).toBe(false)
    expect(offlineRoute('/m/calendar')).toBeNull()
    expect(offlineRoute('m/:id')).toBeNull()
  })

  it('is fetched when the worker installs, from the route\'s sample', async () => {
    const asked: string[] = []
    const sw = runWorker({ enabled: true, pages: [], routes: ['/m/workout/:id'] }, (url) => {
      asked.push(url)
      return new Response(sessionPage('0'), { status: 200 })
    })
    await sw.install()
    expect(asked).toContain('/m/workout/0')
    expect(sw.stores.get('stx-shell-b1')!.has('http://app.test/__stx_route__/m/workout/:id')).toBe(true)
    expect(sw.stores.get('stx-shell-b1')!.has('http://app.test/__stx_route__/m/workout/:id?__stx_fragment=1')).toBe(true)
  })

  it('keeps the stylesheets and scripts of the screens it installs', async () => {
    const page = '<html><head><link data-css="generated" rel="stylesheet" href="/_stx/css.abc.css"><script data-stx-modules src="/_stx/modules.def.js"></script><link rel="stylesheet" href="https://cdn.test/x.css"></head></html>'
    const asked: string[] = []
    const sw = runWorker({ enabled: true, pages: ['/m/health'] }, (url) => {
      asked.push(url)
      return new Response(url.startsWith('/_stx/') ? 'body{}' : page, { status: 200 })
    })
    await sw.install()
    const assets = sw.stores.get('stx-assets')!
    expect(assets.has('http://app.test/_stx/css.abc.css')).toBe(true)
    expect(assets.has('http://app.test/_stx/modules.def.js')).toBe(true)
    expect(asked.filter(url => url === '/_stx/css.abc.css').length).toBe(1)
    expect(asked).not.toContain('https://cdn.test/x.css')
  })

  it('is answered offline with the route\'s kept page, carrying the params asked for', async () => {
    let online = true
    const sw = runWorker({ enabled: true, pages: ['/m'], routes: ['/m/workout/:id'] }, url => (online ? new Response(sessionPage(url.split('/').pop()!), { status: 200 }) : null))
    // Installed with a signal: the route's page is kept from its sample.
    await sw.install()
    online = false
    const page = await sw.request('http://app.test/m/workout/16319', { 'X-STX-Router': 'true', 'Accept': 'text/html' })
    const html = await page!.text()
    expect(page!.status).toBe(200)
    expect(html).toContain('var p={"id":"16319"};window.__stx_rp=p')
    expect(html).not.toContain('"id":"0"')
    expect(html).not.toContain('stx-offline-fallback')
  })

  it('keeps params script-safe', async () => {
    const sw = runWorker({ enabled: true, pages: [], routes: ['/p/:slug'] }, () => null)
    sw.stores.set('stx-shell-b1', new Map([
      ['http://app.test/__stx_route__/p/:slug', new Response(`<html><head>${paramsScript('{"slug":"a"}')}</head></html>`, { status: 200 })],
    ]))
    const html = await (await sw.request('http://app.test/p/%3C%2Fscript%3E$%26', { Accept: 'text/html' }))!.text()
    expect(html).toContain('var p={"slug":"\\u003C/script>$&"};')
  })

  it('still falls back to the first screen for a route not named', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'], routes: ['/m/workout/:id'] }, () => null)
    sw.stores.set('stx-shell-b1', new Map([
      ['http://app.test/m', new Response('<html><head></head><body>Today</body></html>', { status: 200 })],
    ]))
    const html = await (await sw.request('http://app.test/m/plan/3', { Accept: 'text/html' }))!.text()
    expect(html).toContain('stx-offline-fallback')
  })
})

const html = (body: string, headers: Record<string, string> = {}) =>
  new Response(`<html><head></head><body>${body}</body></html>`, { status: 200, headers: { 'Content-Type': 'text/html', ...headers } })
const json = (value: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json', ...headers } })
const never = () => new Promise<Response | null>(() => {})
const later = (ms: number, response: () => Response | null) => new Promise<Response | null>(resolve => setTimeout(() => resolve(response()), ms))

describe('a kept screen (stale-while-revalidate)', () => {
  it('is answered at once, without waiting on a network that has not answered', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'] }, never)
    sw.stores.set('stx-shell-b1', new Map([['http://app.test/m', html('Kept')]]))
    const started = Date.now()
    const page = await sw.request('http://app.test/m', { Accept: 'text/html' })
    expect(await page!.text()).toContain('Kept')
    expect(Date.now() - started).toBeLessThan(200)
    expect(sw.fetched).toContain('http://app.test/m')
  })

  it('takes the newer answer behind it and tells every open page', async () => {
    let body = 'Old'
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => html(body))
    sw.clients.push(client(), client('hidden'))
    await sw.install()
    body = 'New'
    const first = await sw.request('http://app.test/m', { Accept: 'text/html' })
    expect(await first!.text()).toContain('Old')
    await sw.settle()
    for (const open of sw.clients)
      expect(open.messages).toEqual([{ type: 'stx:updated', url: 'http://app.test/m', kind: 'page', fragment: false }])
    const second = await sw.request('http://app.test/m', { Accept: 'text/html' })
    expect(await second!.text()).toContain('New')
  })

  it('says nothing when the answer is the same, or differs only in its nonce', async () => {
    let nonce = 'a'
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => html(`<script nonce="${nonce}">1</script>Same`))
    sw.clients.push(client())
    await sw.install()
    await sw.request('http://app.test/m', { Accept: 'text/html' })
    nonce = 'b'
    await sw.request('http://app.test/m', { Accept: 'text/html' })
    await sw.settle()
    expect(sw.clients[0]!.messages).toEqual([])
  })

  it('trusts a matching ETag over the body', async () => {
    let body = 'One'
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => html(body, { ETag: '"v1"' }))
    sw.clients.push(client())
    await sw.install()
    body = 'Two'
    await sw.request('http://app.test/m', { Accept: 'text/html' })
    await sw.settle()
    expect(sw.clients[0]!.messages).toEqual([])
  })

  it('keeps a fragment apart from its page, and says which one changed', async () => {
    let body = 'A'
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => html(body))
    sw.clients.push(client())
    await sw.install()
    body = 'B'
    await sw.request('http://app.test/m', { 'X-STX-Router': 'true', 'Accept': 'text/html' })
    await sw.settle()
    expect(sw.clients[0]!.messages).toEqual([{ type: 'stx:updated', url: 'http://app.test/m', kind: 'page', fragment: true }])
    expect(await (await sw.stores.get('stx-shell-b1')!.get('http://app.test/m?__stx_fragment=1'))!.text()).toContain('B')
    expect(await (await sw.stores.get('stx-shell-b1')!.get('http://app.test/m'))!.text()).toContain('A')
  })

  it('keeps a copy whose headers describe the decoded body it holds', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => html('Body', { 'Content-Encoding': 'gzip', 'Content-Length': '12' }))
    await sw.request('http://app.test/m', { Accept: 'text/html' })
    await sw.settle()
    const kept = sw.stores.get('stx-shell-b1')!.get('http://app.test/m')!
    expect(kept.headers.get('Content-Encoding')).toBeNull()
    expect(kept.headers.get('Content-Length')).toBeNull()
    expect(kept.headers.get('X-STX-Kept-At')).not.toBeNull()
  })

  it('never keeps a redirect, an error or another origin\'s answer', async () => {
    let answer: () => Response = () => html('Kept')
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => answer())
    await sw.install()
    const redirected = html('Sign in')
    Object.defineProperty(redirected, 'redirected', { value: true })
    for (const next of [() => redirected, () => new Response('down', { status: 503 }), () => Object.defineProperty(html('x'), 'type', { value: 'opaque' })]) {
      answer = next
      await sw.request('http://app.test/m', { Accept: 'text/html' })
      await sw.settle()
      expect(await sw.stores.get('stx-shell-b1')!.get('http://app.test/m')!.clone().text()).toContain('Kept')
    }
  })

  it('goes to the network first for a pull to refresh and for a networkFirst path', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m', '/m/live'], networkFirst: ['/m/live'] }, () => html('Fresh'))
    sw.stores.set('stx-shell-b1', new Map([
      ['http://app.test/m', html('Kept')],
      ['http://app.test/m/live', html('Kept')],
    ]))
    expect(await (await sw.request('http://app.test/m', { Accept: 'text/html' }, { cache: 'no-cache' }))!.text()).toContain('Fresh')
    expect(await (await sw.request('http://app.test/m/live', { Accept: 'text/html' }))!.text()).toContain('Fresh')
    expect(await (await sw.request('http://app.test/m', { Accept: 'text/html' }))!.text()).toContain('Kept')
  })

  it('falls back to the kept copy when a network-first request goes unanswered', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'], networkTimeoutMs: 500 }, never)
    sw.stores.set('stx-shell-b1', new Map([['http://app.test/m', html('Kept')]]))
    expect(await (await sw.request('http://app.test/m', { Accept: 'text/html' }, { cache: 'no-cache' }))!.text()).toContain('Kept')
  })
})

describe('a screen never kept', () => {
  it('waits for the network, however slow, when nothing could stand in', async () => {
    const sw = runWorker({ enabled: true, pages: [], networkTimeoutMs: 500 }, () => later(700, () => html('Slow')))
    expect(await (await sw.request('http://app.test/m/new', { Accept: 'text/html' }))!.text()).toContain('Slow')
    await sw.settle()
    expect(sw.stores.get('stx-shell-b1')!.has('http://app.test/m/new')).toBe(true)
  })

  it('gets the route\'s kept page after the timeout, and keeps the late answer', async () => {
    const page = (id: string) => `<html><head><script data-stx-route-params>(function(){var p={"id":"${id}"};window.__stx_rp=p})()</script></head><body>Session</body></html>`
    let slow = false
    const sw = runWorker({ enabled: true, pages: [], routes: ['/m/workout/:id'], networkTimeoutMs: 500 }, url => slow ? later(800, () => new Response(page('late'), { status: 200 })) : new Response(page('0'), { status: 200 }))
    await sw.install()
    slow = true
    const started = Date.now()
    const answer = await sw.request('http://app.test/m/workout/42', { Accept: 'text/html' })
    expect(Date.now() - started).toBeLessThan(750)
    expect(await answer!.text()).toContain('var p={"id":"42"}')
    await sw.settle()
    expect(await sw.stores.get('stx-shell-b1')!.get('http://app.test/m/workout/42')!.clone().text()).toContain('"late"')
  })
})

describe('API reads', () => {
  const read = (sw: ReturnType<typeof runWorker>, token = 'a', options: RequestOptions = {}) =>
    sw.request('http://app.test/api/calendar', { Authorization: `Bearer ${token}` }, options)

  it('answer the kept copy at once, refresh it behind, and say when it changed', async () => {
    let value = 1
    const sw = runWorker({ enabled: true }, () => json({ value }))
    sw.clients.push(client())
    expect(await (await read(sw))!.json()).toEqual({ value: 1 })
    await sw.settle()
    expect(sw.clients[0]!.messages).toEqual([])
    value = 2
    expect(await (await read(sw))!.json()).toEqual({ value: 1 })
    await sw.settle()
    expect(sw.clients[0]!.messages).toEqual([{ type: 'stx:updated', url: 'http://app.test/api/calendar', kind: 'api', fragment: false }])
    expect(await (await read(sw))!.json()).toEqual({ value: 2 })
    await sw.settle()
    expect(sw.clients[0]!.messages.length).toBe(1)
  })

  it('are kept per signed-in token', async () => {
    let value = 'a'
    const sw = runWorker({ enabled: true }, () => json({ value }))
    await read(sw, 'a')
    await sw.settle()
    value = 'b'
    expect(await (await read(sw, 'b'))!.json()).toEqual({ value: 'b' })
    await sw.settle()
    expect(sw.stores.get('stx-data')!.size).toBe(2)
  })

  it('go to the network after the app wrote, so the write shows', async () => {
    let value = 'before'
    const sw = runWorker({ enabled: true }, () => json({ value }))
    await read(sw)
    await sw.settle()
    value = 'after'
    expect(await sw.request('http://app.test/api/calendar/5', {}, { method: 'POST' })).toBeNull()
    await sw.settle()
    expect(await (await read(sw))!.json()).toEqual({ value: 'after' })
  })

  it('remember the last write across a worker restart', async () => {
    const shared = runWorker({ enabled: true }, () => json({ value: 'old' }))
    await read(shared)
    await shared.request('http://app.test/api/x', {}, { method: 'DELETE' })
    await shared.settle()
    const kept = shared.stores.get('stx-data')!
    expect([...kept.keys()].some(key => key.endsWith('/__stx_last_write__'))).toBe(true)
  })

  it('go to the network first for a pull to refresh, and fall back offline', async () => {
    let online = true
    let value = 1
    const sw = runWorker({ enabled: true }, () => online ? json({ value }) : null)
    await read(sw)
    await sw.settle()
    value = 2
    expect(await (await read(sw, 'a', { cache: 'no-cache' }))!.json()).toEqual({ value: 2 })
    await sw.settle()
    online = false
    expect(await (await read(sw, 'a', { cache: 'no-cache' }))!.json()).toEqual({ value: 2 })
  })
})

describe('a new build', () => {
  it('installs without taking over the running one', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => html('x'))
    await sw.install()
    expect(sw.skipped).toBe(0)
  })

  it('takes over when no page of the app is on screen', async () => {
    const sw = runWorker({ enabled: true }, () => null)
    sw.clients.push(client('hidden'), client('visible'))
    await sw.message({ type: 'stx:activate-update', reason: 'hidden' })
    expect(sw.skipped).toBe(0)
    sw.clients[1]!.visibilityState = 'hidden'
    await sw.message({ type: 'stx:activate-update', reason: 'hidden' })
    expect(sw.skipped).toBe(1)
  })

  it('takes over when the only page just loaded, or when asked outright', async () => {
    const sw = runWorker({ enabled: true }, () => null)
    sw.clients.push(client(), client())
    await sw.message({ type: 'stx:activate-update', reason: 'load' })
    expect(sw.skipped).toBe(0)
    await sw.message({ type: 'stx:activate-update', force: true })
    expect(sw.skipped).toBe(1)
    sw.clients.pop()
    await sw.message({ type: 'stx:activate-update', reason: 'load' })
    expect(sw.skipped).toBe(2)
  })

  it('opens a cold start at once on the kept build, and leaves the new one waiting', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => html('New build'))
    sw.stores.set('stx-shell-b1', new Map([['http://app.test/m', html('Old build')]]))
    const waiting = { messages: [] as any[], postMessage(m: unknown) { this.messages.push(m) } }
    sw.self.registration.waiting = waiting
    const page = await sw.request('http://app.test/m', { Accept: 'text/html' }, { mode: 'navigate' })
    expect(await page!.text()).toContain('Old build')
    expect(waiting.messages).toEqual([])
  })

  it('with updateOnColdStart, takes over on a cold start, which opens on the network rather than the old build', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'], updateOnColdStart: true }, () => html('New build'))
    sw.stores.set('stx-shell-b1', new Map([['http://app.test/m', html('Old build')]]))
    const waiting = { messages: [] as any[], postMessage(m: unknown) { this.messages.push(m) } }
    sw.self.registration.waiting = waiting
    const page = await sw.request('http://app.test/m', { Accept: 'text/html' }, { mode: 'navigate' })
    expect(await page!.text()).toContain('New build')
    expect(waiting.messages).toEqual([{ type: 'stx:activate-update', reason: 'cold-start' }])

    // With another page of the app open, the running build stays.
    waiting.messages = []
    sw.clients.push(client(), client())
    sw.stores.set('stx-shell-b1', new Map([['http://app.test/m', html('Old build')]]))
    const other = await sw.request('http://app.test/m', { Accept: 'text/html' }, { mode: 'navigate' })
    expect(await other!.text()).toContain('Old build')
    expect(waiting.messages).toEqual([])
  })

  it('keeps the running build\'s screens until it takes over, then drops them', async () => {
    const sw = runWorker({ enabled: true, pages: ['/m'] }, () => html('x'))
    sw.stores.set('stx-shell-b0', new Map([['http://app.test/m', html('Old')]]))
    await sw.install()
    expect(sw.stores.has('stx-shell-b0')).toBe(true)
    await sw.activate()
    expect(sw.stores.has('stx-shell-b0')).toBe(false)
    expect(sw.stores.has('stx-shell-b1')).toBe(true)
  })

  it('prunes files no kept screen links to, but not ones fetched lately', async () => {
    const page = '<html><head><link rel="stylesheet" href="/_stx/css.new.css"><script src="/_stx/app.new.js"></script></head></html>'
    const sw = runWorker({ enabled: true, pages: ['/m'] }, url => new Response(url.endsWith('.css') || url.endsWith('.js') ? 'x' : page, { status: 200 }))
    const old = Date.now() - 3 * 24 * 60 * 60 * 1000
    const stampedAt = (at: number) => new Response('x', { headers: { 'X-STX-Kept-At': String(at) } })
    sw.stores.set('stx-assets', new Map([
      ['http://app.test/_stx/css.old.css', stampedAt(old)],
      ['http://app.test/_stx/app.old.js', new Response('x')],
      ['http://app.test/_stx/lazy.js', stampedAt(Date.now())],
      ['http://app.test/assets/logo.png', stampedAt(old)],
    ]))
    await sw.install()
    await sw.activate()
    const kept = [...sw.stores.get('stx-assets')!.keys()].sort()
    expect(kept).toEqual([
      'http://app.test/_stx/app.new.js',
      'http://app.test/_stx/css.new.css',
      'http://app.test/_stx/lazy.js',
      'http://app.test/assets/logo.png',
    ])
  })

  it('caps the other files it keeps, the least recently fetched first', async () => {
    const sw = runWorker({ enabled: true, pages: [], assetsMaxEntries: 50 }, () => null)
    const assets = new Map<string, Response>()
    for (let i = 0; i < 60; i++)
      assets.set(`http://app.test/assets/${i}.png`, new Response('x', { headers: { 'X-STX-Kept-At': String(1000 + i) } }))
    sw.stores.set('stx-assets', assets)
    await sw.activate()
    const kept = [...sw.stores.get('stx-assets')!.keys()]
    expect(kept.length).toBe(50)
    expect(kept).not.toContain('http://app.test/assets/0.png')
    expect(kept).toContain('http://app.test/assets/59.png')
  })
})
