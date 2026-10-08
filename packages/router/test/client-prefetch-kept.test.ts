/**
 * Tab pages that are there from the first tap.
 *
 * On a server a continent away each page is a second or more, so a tab bar
 * whose prefetch had not finished, or an app just opened, waited for the
 * network on its first tap. A tap now waits for the prefetch already in flight
 * rather than asking again, and eager pages are kept between launches of the
 * same build, so the first tap after opening the app is a swap.
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
  navigator: globalThis.navigator,
  CustomEvent: globalThis.CustomEvent,
  Event: globalThis.Event,
  DOMParser: globalThis.DOMParser,
  localStorage: (globalThis as any).localStorage,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

const TABS = '<nav><a href="/m" data-stx-link data-stx-prefetch="eager">Today</a>'
  + '<a href="/m/calendar" data-stx-link data-stx-prefetch="eager" id="cal">Calendar</a></nav>'

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed))
  return {
    data,
    get length() { return data.size },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, String(v)) },
    removeItem: (k: string) => { data.delete(k) },
  }
}

function installRouter(options: { build?: string, storage?: ReturnType<typeof memoryStorage>, delay?: number } = {}) {
  const window = new Window({ url: 'http://localhost/m' })
  const build = options.build ?? 'b1'
  window.document.write(`<html><head><meta name="stx-layout" content="layouts/mobile.stx"><meta name="stx-build" content="${build}"></head><body>${TABS}<main>Today</main></body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: true, prefetch: true, progress: false, viewTransitions: false }
  const storage = options.storage ?? memoryStorage()
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
  const requested: string[] = []
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    navigator: window.navigator,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async (url: string) => {
      requested.push(String(url))
      if (options.delay) await new Promise(resolve => setTimeout(resolve, options.delay))
      return new Response(`<section>${String(url)} page</section>`, { status: 200, headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/mobile.stx', 'X-STX-Build': build } })
    },
  })
  new Function(getRouterScript())()
  return { window, requested, storage }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('tab pages from the first tap', () => {
  it('waits for the prefetch in flight instead of asking the server again', async () => {
    const { window, requested } = installRouter({ delay: 150 })
    await wait(120)
    expect(requested.filter(url => url === '/m/calendar')).toHaveLength(1)
    await (window as any).stxRouter.navigate('/m/calendar')
    expect(requested.filter(url => url === '/m/calendar')).toHaveLength(1)
    expect(window.location.pathname).toBe('/m/calendar')
  })

  it('keeps eager pages for the next launch of the same build, and shows them at once', async () => {
    const first = installRouter()
    await wait(400)
    expect(JSON.parse(first.storage.getItem('stx:pages:b1')!)['/m/calendar'].h).toContain('/m/calendar page')

    // The next launch: the kept page is in the cache before any request
    // returns, and is refreshed behind it.
    const next = installRouter({ storage: first.storage, delay: 1000 })
    const started = Date.now()
    await (next.window as any).stxRouter.navigate('/m/calendar')
    expect(Date.now() - started).toBeLessThan(500)
    expect(next.window.location.pathname).toBe('/m/calendar')
  })

  it('drops pages another build rendered', async () => {
    const storage = memoryStorage({ 'stx:pages:old': JSON.stringify({ '/m/calendar': { h: '<section>old</section>' } }) })
    installRouter({ storage })
    await wait(400)
    expect(storage.getItem('stx:pages:old')).toBeNull()
    expect(storage.getItem('stx:pages:b1')).not.toBeNull()
  })
})
