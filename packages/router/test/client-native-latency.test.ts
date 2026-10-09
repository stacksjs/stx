/**
 * The router's half of a native-feeling app, on a page without retained
 * screens (no tab links, no signals runtime): the behaviours every stx page
 * gets.
 *
 *   - the newest navigation wins: one already loading when another starts is
 *     aborted and its answer ignored, where the later one used to be dropped
 *   - a failed load shows a retry in the container instead of a document
 *     load, which offline is the offline page or nothing
 *   - a page served from the router's cache is asked for again behind the
 *     swap, and stx:updated says when it changed
 *   - the offline worker's { type: 'stx:updated' } message is heard as a
 *     window event
 *   - a build skew noticed in the background waits for the page to be hidden
 *   - links are prefetched as they scroll into view, with their stylesheet
 *   - inner scrollers (data-stx-scroll) return to where they were on Back
 *   - data-nav-direction says push, pop or replace while a navigation runs
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'

const originalGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  location: globalThis.location,
  history: globalThis.history,
  fetch: globalThis.fetch,
  CustomEvent: globalThis.CustomEvent,
  Event: globalThis.Event,
  MouseEvent: (globalThis as any).MouseEvent,
  DOMParser: globalThis.DOMParser,
}
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
const originalObserver = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver')

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
  if (originalNavigator)
    Object.defineProperty(globalThis, 'navigator', originalNavigator)
  if (originalObserver)
    Object.defineProperty(globalThis, 'IntersectionObserver', originalObserver)
  else
    delete (globalThis as any).IntersectionObserver
})

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

function page(main: string, head = ''): string {
  return `<html><head>
    <meta name="stx-build" content="b1">
    <meta name="stx-layout" content="layouts/app.stx">
    <meta name="stx-layout-group" content="app">${head}
  </head><body>
    <nav><a id="to-b" href="/b" data-stx-link>B</a></nav>
    <main>${main}</main>
  </body></html>`
}

type Answer = (path: string) => Promise<Response> | Response

function fragment(body: string, build = 'b1'): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'X-STX-Fragment': 'true',
      'X-STX-Layout': 'layouts/app.stx',
      'X-STX-Layout-Group': 'app',
      'X-STX-Build': build,
    },
  })
}

interface Installed {
  window: any
  calls: string[]
  navigations: string[]
  reloads: number
}

/**
 * location is stood in so a document load (href assignment, reload) is
 * recorded rather than performed: very-happy-dom's own is not configurable.
 */
function install(html: string, answer: Answer, config: Record<string, unknown> = {}, globals: Record<string, unknown> = {}): Installed {
  const window: any = new Window({ url: 'http://localhost/' })
  window.document.write(html)
  window.history.pushState(null, '', 'http://localhost/')
  window.__stxRouterConfig = { cache: true, prefetch: false, progress: false, viewTransitions: false, revalidate: false, prefetchVisible: false, ...config }
  const installed: Installed = { window, calls: [], navigations: [], reloads: 0 }

  const real = window.location
  const locationStub: any = {
    get href() { return real.href },
    set href(v: string) { installed.navigations.push(v) },
    reload() { installed.reloads++ },
    assign(v: string) { installed.navigations.push(v) },
    replace(v: string) { installed.navigations.push(v) },
    toString() { return real.href },
  }
  for (const key of ['pathname', 'search', 'hash', 'origin', 'protocol', 'host', 'hostname', 'port'])
    Object.defineProperty(locationStub, key, { get: () => real[key], configurable: true })

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: locationStub,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    DOMParser: window.DOMParser,
    fetch: async (url: string, init?: { signal?: AbortSignal }) => {
      const path = String(url)
      installed.calls.push(path)
      const response = await answer(path)
      if (init?.signal?.aborted)
        throw new DOMException('The operation was aborted.', 'AbortError')
      return response
    },
  })
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })

  new Function(getRouterScript())()
  return installed
}

const main = (window: any): string => (window.document.querySelector('main')?.textContent ?? '').trim()

describe('the newest navigation wins', () => {
  it('ignores a slow page once a later navigation has started', async () => {
    const { window, navigations } = install(page('Home'), async (path) => {
      if (path === '/slow')
        await sleep(120)
      return fragment(`<p>${path}</p>`)
    })
    const slow = window.stxRouter.navigate('/slow')
    await sleep(10)
    expect(await window.stxRouter.navigate('/fast')).toBe(true)
    expect(await slow).toBe(false)
    await sleep(150)
    expect(main(window)).toBe('/fast')
    expect(window.location.pathname).toBe('/fast')
    expect(navigations).toEqual([])
  })

  it('lets Back during a load win over the load', async () => {
    const { window } = install(page('Home'), async (path) => {
      if (path === '/slow')
        await sleep(120)
      return fragment(`<p>${path}</p>`)
    })
    await window.stxRouter.navigate('/a')
    const slow = window.stxRouter.navigate('/slow')
    await sleep(10)
    window.history.back()
    await sleep(40)
    expect(await slow).toBe(false)
    await sleep(150)
    expect(window.location.pathname).toBe('/')
    expect(main(window)).toBe('/')
  })
})

describe('a page that cannot be loaded', () => {
  it('shows a retry in the container and never loads a document', async () => {
    let up = false
    const { window, navigations } = install(page('Home'), async (path) => {
      if (!up)
        throw new TypeError('Failed to fetch')
      return fragment(`<p>${path} again</p>`)
    })
    expect(await window.stxRouter.navigate('/b')).toBe(false)
    expect(navigations).toEqual([])
    expect(window.location.pathname).toBe('/b')
    expect(window.document.querySelector('main [data-stx-retry]')?.getAttribute('data-stx-retry')).toBe('/b')
    expect(main(window)).toContain('Try again')

    up = true
    window.document.querySelector('.stx-retry-button').dispatchEvent(new window.MouseEvent('click', { bubbles: true, button: 0 }))
    // The plain container's cross-fade takes 120ms.
    await sleep(200)
    expect(main(window)).toBe('/b again')
    expect(navigations).toEqual([])
  })

  it('says so for a server error too, with the status', async () => {
    const seen: any[] = []
    const { window, navigations } = install(page('Home'), () => new Response('boom', { status: 503 }))
    window.addEventListener('stx:navigate-error', (e: any) => seen.push(e.detail.status))
    await window.stxRouter.navigate('/b')
    expect(seen).toEqual([503])
    expect(navigations).toEqual([])
    expect(window.document.querySelector('main [data-stx-retry]')).not.toBeNull()
  })

  it('leaves the drawing to a page that cancels stx:navigate-error', async () => {
    const { window } = install(page('Home'), () => { throw new TypeError('offline') })
    window.addEventListener('stx:navigate-error', (e: any) => e.preventDefault())
    await window.stxRouter.navigate('/b')
    expect(main(window)).toBe('Home')
  })
})

describe('build skew noticed in the background', () => {
  it('never reloads the screen in use, and reloads once the page is hidden', async () => {
    let build = 'b1'
    const installed = install(page('Home'), path => fragment(`<p>${path}</p>`, build), { revalidate: true, revalidateAfter: 0 })
    const { window, navigations } = installed
    await window.stxRouter.navigate('/b')
    await window.stxRouter.navigate('/')
    build = 'b2'
    // A cache hit, revalidated behind the swap: the newer build answers.
    expect(await window.stxRouter.navigate('/b')).toBe(true)
    await sleep(30)
    expect(main(window)).toBe('/b')
    expect(navigations).toEqual([])
    expect(installed.reloads).toBe(0)

    window.document.dispatchEvent(new window.Event('visibilitychange'))
    expect(installed.reloads).toBe(0)
    Object.defineProperty(window.document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    window.document.dispatchEvent(new window.Event('visibilitychange'))
    expect(installed.reloads).toBe(1)
    expect(navigations).toEqual([])
  })
})

describe('revalidation', () => {
  it('serves the cached page at once and says stx:updated when it changed', async () => {
    let version = 1
    const updated: any[] = []
    const { window, calls } = install(page('Home'), path => fragment(`<p>${path} v${version}</p>`), { revalidate: true, revalidateAfter: 0 })
    window.addEventListener('stx:updated', (e: any) => updated.push(e.detail))
    await window.stxRouter.navigate('/b')
    await window.stxRouter.navigate('/')
    version = 2
    calls.length = 0
    await window.stxRouter.navigate('/b')
    // Shown from the cache, the old copy.
    expect(main(window)).toBe('/b v1')
    await sleep(30)
    expect(calls).toEqual(['/b'])
    expect(updated).toEqual([{ url: '/b', kind: 'page' }])
    // The cache has the new copy for the next visit.
    expect(window.stxRouter.cache['/b']).toContain('v2')
  })

  it('stays quiet when nothing changed', async () => {
    const updated: any[] = []
    const { window } = install(page('Home'), path => fragment(`<p>${path}</p>`), { revalidate: true, revalidateAfter: 0 })
    window.addEventListener('stx:updated', (e: any) => updated.push(e.detail))
    await window.stxRouter.navigate('/b')
    await window.stxRouter.navigate('/')
    await window.stxRouter.navigate('/b')
    await sleep(30)
    expect(updated).toEqual([])
  })
})

describe('the offline worker\'s update message', () => {
  function withWorker() {
    let onMessage: ((e: any) => void) | null = null
    const serviceWorker = { addEventListener: (type: string, fn: (e: any) => void) => { if (type === 'message') onMessage = fn } }
    const installed = install(page('Home'), path => fragment(`<p>${path}</p>`), {}, {
      navigator: { serviceWorker, onLine: true, userAgent: 'test' },
    })
    const updated: any[] = []
    installed.window.addEventListener('stx:updated', (e: any) => updated.push(e.detail))
    return { ...installed, updated, post: (data: unknown) => onMessage!({ data }) }
  }

  it('is heard as a window event and drops the cached page', async () => {
    const { window, updated, post } = withWorker()
    await window.stxRouter.navigate('/b')
    expect(window.stxRouter.cache['/b']).toBeDefined()

    post({ type: 'stx:updated', url: 'http://localhost/b', kind: 'page' })
    expect(updated).toEqual([{ url: 'http://localhost/b', kind: 'page' }])
    expect(window.stxRouter.cache['/b']).toBeUndefined()

    post({ type: 'something-else' })
    expect(updated.length).toBe(1)
  })

  it('is left to the offline register script when it is on the page, so it is heard once', async () => {
    const { window, updated, post } = withWorker()
    await window.stxRouter.navigate('/b')
    window.stxOffline = {}
    post({ type: 'stx:updated', url: 'http://localhost/b', kind: 'page' })
    expect(updated).toEqual([])
    // The register script's own event still drops the cached page.
    window.dispatchEvent(new window.CustomEvent('stx:updated', { detail: { url: 'http://localhost/b', kind: 'page', fragment: true } }))
    expect(window.stxRouter.cache['/b']).toBeUndefined()
  })

  it('keeps the cached page for an API update', async () => {
    const { window } = withWorker()
    await window.stxRouter.navigate('/b')
    window.dispatchEvent(new window.CustomEvent('stx:updated', { detail: { url: 'http://localhost/b', kind: 'api' } }))
    expect(window.stxRouter.cache['/b']).toBeDefined()
  })
})

describe('prefetch on sight', () => {
  class FakeObserver {
    static last: FakeObserver | null = null
    observed: any[] = []
    constructor(public callback: (entries: any[]) => void) { FakeObserver.last = this }
    observe(el: any) { this.observed.push(el) }
    unobserve(el: any) { this.observed = this.observed.filter(x => x !== el) }
    disconnect() {}
  }

  const LINKS = '<a id="one" href="/one" data-stx-link>One</a><a id="two" href="/two" data-stx-link data-stx-prefetch="hover">Two</a>'

  it('fetches a link once it scrolls into view, with its stylesheet', async () => {
    FakeObserver.last = null
    const { window, calls } = install(page(LINKS), path => fragment(`<link data-css="generated" rel="stylesheet" href="/css${path}.css"><p>${path}</p>`), { prefetch: true, prefetchVisible: true }, {
      IntersectionObserver: FakeObserver,
    })
    await sleep(20)
    const observer = FakeObserver.last!
    expect(observer.observed.map((a: any) => a.id)).toEqual(['one'])

    observer.callback([{ isIntersecting: true, target: window.document.getElementById('one') }])
    await sleep(20)
    expect(calls).toEqual(['/one'])
    expect(window.stxRouter.cache['/one']).toBeDefined()
    // Its utility sheet is already on its way, unapplied, so the tap never
    // waits for it.
    const sheet = window.document.querySelector('head link[href="/css/one.css"]')
    expect(sheet?.getAttribute('media')).toBe('print')
    expect(sheet?.hasAttribute('data-stx-css-pending')).toBe(true)
  })

  it('does nothing on a connection that asked to save data', async () => {
    FakeObserver.last = null
    install(page(LINKS), path => fragment(`<p>${path}</p>`), { prefetch: true, prefetchVisible: true }, {
      IntersectionObserver: FakeObserver,
      navigator: { connection: { saveData: true }, onLine: true, userAgent: 'test' },
    })
    await sleep(20)
    expect(FakeObserver.last).toBeNull()
  })
})

describe('inner scrollers', () => {
  it('return to where they were left on Back', async () => {
    const { window } = install(page('<div data-stx-scroll="feed">feed</div>'), path => fragment(path === '/' ? '<div data-stx-scroll="feed">feed</div>' : `<p>${path}</p>`))
    await window.stxRouter.navigate('/')
    window.document.querySelector('[data-stx-scroll]').scrollTop = 240
    await window.stxRouter.navigate('/b')
    window.history.back()
    // The cross-fade (120ms), then the second pass once the page has bound.
    await sleep(300)
    expect(window.document.querySelector('[data-stx-scroll]').scrollTop).toBe(240)
  })
})

describe('data-nav-direction', () => {
  it('says push, pop and replace while each runs', async () => {
    const { window } = install(page('Home'), path => fragment(`<p>${path}</p>`))
    const seen: string[] = []
    window.addEventListener('stx:navigate', (e: any) => seen.push(`${e.detail.direction}:${window.document.documentElement.getAttribute('data-nav-direction')}`))
    await window.stxRouter.navigate('/b')
    window.history.back()
    await sleep(60)
    await window.stxRouter.refresh()
    expect(seen).toEqual(['push:push', 'pop:pop', 'replace:replace'])
    expect(window.document.documentElement.hasAttribute('data-nav-direction')).toBe(false)
  })
})
