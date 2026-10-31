/**
 * Prefetch on sight waits for the page's own paint (stacksjs/stacks#3082).
 *
 * Links were observed as soon as the router started, so on a slow link two other
 * pages' documents were already downloading when the page the person asked for
 * had drawn nothing. The first observation now waits for first contentful paint.
 * Where the browser has no paint timing, or the page never paints, nothing is
 * held back for good.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'

const originals = {
  window: globalThis.window,
  document: globalThis.document,
  location: globalThis.location,
  history: globalThis.history,
  fetch: globalThis.fetch,
  navigator: globalThis.navigator,
  CustomEvent: globalThis.CustomEvent,
  Event: globalThis.Event,
  DOMParser: globalThis.DOMParser,
  IntersectionObserver: (globalThis as any).IntersectionObserver,
  PerformanceObserver: (globalThis as any).PerformanceObserver,
}
afterEach(() => { Object.assign(globalThis, originals) })

class FakeIntersection {
  static created = 0
  constructor(public callback: (entries: any[]) => void) { FakeIntersection.created++ }
  observe() {}
  unobserve() {}
  disconnect() {}
}

class FakePaint {
  static supportedEntryTypes = ['paint']
  static last: FakePaint | null = null
  constructor(public callback: (list: { getEntriesByName: (name: string) => unknown[] }) => void) { FakePaint.last = this }
  observe() {}
  disconnect() {}
  paint() { this.callback({ getEntriesByName: name => name === 'first-contentful-paint' ? [{}] : [] }) }
}

function install(paintTiming: boolean) {
  FakeIntersection.created = 0
  FakePaint.last = null
  const window: any = new Window({ url: 'http://localhost/' })
  window.document.write('<html><head><meta name="stx-build" content="b1"></head><body><a href="/one" data-stx-link>One</a><main>Home</main></body></html>')
  window.__stxRouterConfig = { cache: true, prefetch: true, prefetchVisible: true, progress: false, viewTransitions: false, revalidate: false }
  Object.assign(globalThis, {
    window, document: window.document, location: window.location, history: window.history, navigator: window.navigator,
    CustomEvent: window.CustomEvent, Event: window.Event, DOMParser: window.DOMParser,
    fetch: async () => new Response('<p>page</p>', { headers: { 'Content-Type': 'text/html' } }),
    IntersectionObserver: FakeIntersection,
    PerformanceObserver: paintTiming ? FakePaint : undefined,
  })
  new Function(getRouterScript())()
}
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('prefetch on sight and first paint', () => {
  it('starts watching links only once the page has painted', async () => {
    install(true)
    await wait(30)
    expect(FakeIntersection.created).toBe(0)
    FakePaint.last!.paint()
    await wait(30)
    expect(FakeIntersection.created).toBe(1)
  })

  it('does not hold prefetch back in a browser without paint timing', async () => {
    install(false)
    await wait(30)
    expect(FakeIntersection.created).toBe(1)
  })
})
