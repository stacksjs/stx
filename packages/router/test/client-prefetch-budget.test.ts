/**
 * Prefetch on sight is capped in bytes, not only in documents (stacksjs/stx#2161).
 *
 * prefetchVisibleMax limits how many documents a page load prefetches whatever
 * their size, and this router navigates by fetching a whole server-rendered
 * page rather than a route chunk. Twelve chunks is a modest number; twelve
 * pages is not. Measured on the Stacks dashboard, one load pulled 1,409 KB of
 * other pages against a 717 KB document of its own.
 *
 * The budget defaults to the size of the document this origin actually served,
 * read once from navigation timing, so an app of small pages still prefetches
 * freely and an app of large ones stops early. Only what the viewport asked
 * for is charged: a hover or a touch is a person asking for that page.
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
  performance: globalThis.performance,
  CustomEvent: globalThis.CustomEvent,
  Event: globalThis.Event,
  DOMParser: globalThis.DOMParser,
  IntersectionObserver: (globalThis as any).IntersectionObserver,
  PerformanceObserver: (globalThis as any).PerformanceObserver,
}
afterEach(() => { Object.assign(globalThis, originals) })

const observers: FakeIntersection[] = []
class FakeIntersection {
  seen: any[] = []
  constructor(public callback: (entries: any[]) => void) { observers.push(this) }
  observe(target: any) { this.seen.push(target) }
  unobserve() {}
  disconnect() {}
  /** Scroll every observed link into view, one at a time. */
  async reveal(wait: (ms: number) => Promise<unknown>) {
    for (const target of [...this.seen]) {
      this.callback([{ isIntersecting: true, target }])
      await wait(5)
    }
  }

  /** A viewport that already contains every link: one callback, all entries. */
  revealTogether() {
    this.callback(this.seen.map(target => ({ isIntersecting: true, target })))
  }
}

interface Options { pageBytes: number, documentBytes: number, budget?: number, links?: number }

function install({ pageBytes, documentBytes, budget, links = 10 }: Options) {
  observers.length = 0
  const requested: string[] = []
  const window: any = new Window({ url: 'http://localhost/' })
  const anchors = Array.from({ length: links }, (_, i) => `<a href="/p${i}" data-stx-link>p${i}</a>`).join('')
  // Inside the container: observeLinksNow scans from the active root, so links
  // outside it are never observed and the test would pass vacuously.
  window.document.write(`<html><head><meta name="stx-build" content="b1"></head><body><main>Home${anchors}</main></body></html>`)
  window.__stxRouterConfig = {
    cache: true,
    prefetch: true,
    prefetchVisible: true,
    progress: false,
    viewTransitions: false,
    revalidate: false,
    ...(budget === undefined ? {} : { prefetchBudgetBytes: budget }),
  }
  const body = `<main>${'x'.repeat(pageBytes)}</main>`
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    navigator: window.navigator,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    // A plain object, not a spread: spreading loses performance.now, which the
    // router calls, and every prefetch then dies before it is requested.
    performance: {
      now: () => Date.now(),
      mark() {},
      measure() {},
      getEntriesByName: () => [],
      getEntriesByType: (type: string) => type === 'navigation' ? [{ decodedBodySize: documentBytes }] : [],
    },
    fetch: async (url: string) => { requested.push(String(url)); return new Response(body, { headers: { 'Content-Type': 'text/html' } }) },
    IntersectionObserver: FakeIntersection,
    PerformanceObserver: undefined,
  })
  new Function(getRouterScript())()
  return { requested }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('prefetch on sight is bounded by bytes', () => {
  it('stops once prefetched pages outweigh the document the origin served', async () => {
    // Five 1 KB pages fit a 5 KB document; the rest of the ten links must not be fetched.
    const { requested } = install({ pageBytes: 1000, documentBytes: 5000 })
    await wait(20)
    await observers[0]!.reveal(wait)
    await wait(40)

    expect(requested.length).toBeGreaterThan(0)
    expect(requested.length).toBeLessThan(10)
  })

  it('honours an explicit budget over the served document size', async () => {
    // A generous document but a 2 KB budget: roughly two 1 KB pages, not ten.
    const { requested } = install({ pageBytes: 1000, documentBytes: 10_000_000, budget: 2000 })
    await wait(20)
    await observers[0]!.reveal(wait)
    await wait(40)

    expect(requested.length).toBeLessThan(5)
  })

  it('still prefetches freely when the pages are small against the document', async () => {
    // Ten 100-byte pages against a 500 KB document stay well inside the budget,
    // so the existing count cap is what applies and every link is fetched.
    const { requested } = install({ pageBytes: 100, documentBytes: 500_000 })
    await wait(20)
    await observers[0]!.reveal(wait)
    await wait(40)

    expect(requested.length).toBe(10)
  })

  it('bites when a whole viewport of links arrives in one observer callback', async () => {
    // The shape the report describes: a list of links above the fold. Every
    // entry is delivered in a single callback, so nothing has been fetched yet
    // when the last one is seen. Charging at dequeue rather than on sight is
    // what makes the budget apply here at all.
    const { requested } = install({ pageBytes: 1000, documentBytes: 3000, links: 12 })
    await wait(20)
    observers[0]!.revealTogether()
    await wait(120)

    expect(requested.length).toBeGreaterThan(0)
    expect(requested.length).toBeLessThan(12)
  })

  it('falls back to the count cap where navigation timing says nothing', async () => {
    // decodedBodySize of 0 means the browser did not tell us; nothing is held back.
    const { requested } = install({ pageBytes: 1000, documentBytes: 0 })
    await wait(20)
    await observers[0]!.reveal(wait)
    await wait(40)

    expect(requested.length).toBe(10)
  })
})
