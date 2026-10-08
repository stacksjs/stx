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
    expect(settings.fallback).toBe('/m')
    expect(settings.exclude).toContain('/_stx/hmr')
  })

  it('keeps each build\'s screens apart and API answers per signed-in token', () => {
    expect(worker).toContain('\'stx-shell-\' + S.build')
    expect(worker).toContain('__stx_who')
    expect(worker).toContain('stx:clear-offline-data')
    // Writes are never cached here, and only a full answer is ever kept.
    expect(worker).toContain('if (request.method !== \'GET\') return;')
    expect(worker).not.toContain('response.ok')
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

/** The worker run against an in-memory Cache API, enough to drive it. */
function runWorker(config: Parameters<typeof generateOfflineWorker>[0], network: (url: string) => Response | null) {
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
  const self: any = {
    location: { origin: 'http://app.test' },
    addEventListener: (type: string, fn: (event: any) => void) => { listeners[type] = fn },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  }
  const caches = { open, delete: async (name: string) => stores.delete(name), keys: async () => [...stores.keys()] }
  const fetch = async (input: string | Request) => {
    const url = typeof input === 'string' ? input : input.url
    const answer = network(url)
    if (!answer) throw new TypeError('offline')
    return answer
  }
  // eslint-disable-next-line no-new-func
  new Function('self', 'caches', 'fetch', 'crypto', generateOfflineWorker(config, 'b1'))(self, caches, fetch, crypto)
  return {
    stores,
    async install(): Promise<void> {
      let waited: Promise<unknown> = Promise.resolve()
      listeners.install!({ waitUntil: (p: Promise<unknown>) => { waited = p } })
      await waited
    },
    async message(data: unknown): Promise<any> {
      let waited: Promise<unknown> = Promise.resolve()
      let replied: unknown
      listeners.message!({ data, ports: [{ postMessage: (value: unknown) => { replied = value } }], waitUntil: (p: Promise<unknown>) => { waited = p } })
      await waited
      return replied
    },
    async request(url: string, headers: Record<string, string> = {}): Promise<Response | null> {
      let answer: Promise<Response> | null = null
      listeners.fetch!({ request: new Request(url, { headers }), respondWith: (p: Promise<Response>) => { answer = p } })
      return answer ? await answer : null
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
