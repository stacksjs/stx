/**
 * Prefetch on a phone.
 *
 * The router prefetched on mouseover only, and a finger never hovers, so on a
 * phone every first visit waited for its fetch. A touch now starts the fetch
 * at touchdown, a tap's length before the click, and links marked
 * data-stx-prefetch="eager" (a tab bar) are fetched once the page is idle, so
 * their first tap is served from the cache like a native tab switch.
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
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

function installRouter(body: string, connection?: { saveData?: boolean, effectiveType?: string }) {
  const window = new Window({ url: 'http://localhost/m' })
  window.document.write(`<html><head><meta name="stx-layout" content="layouts/mobile.stx"></head><body>${body}<main>Today</main></body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: true, prefetch: true, progress: false, viewTransitions: false }
  if (connection) Object.defineProperty(window.navigator, 'connection', { configurable: true, value: connection })
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
      return new Response('<section>page</section>', { status: 200, headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/mobile.stx' } })
    },
  })
  new Function(getRouterScript())()
  return { window, requested }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('router prefetch on a phone', () => {
  it('starts fetching a link when a finger touches it', async () => {
    const { window, requested } = installRouter('<a href="/m/calendar" data-stx-link id="cal">Calendar</a>')
    const link = window.document.getElementById('cal')!
    link.dispatchEvent(new window.Event('touchstart', { bubbles: true }))
    await wait(10)
    expect(requested).toContain('/m/calendar')
  })

  it('fetches eager links soon after the page loads, the page it is on included', async () => {
    const { requested } = installRouter(
      '<nav><a href="/m" data-stx-link data-stx-prefetch="eager">Today</a>'
      + '<a href="/m/calendar" data-stx-link data-stx-prefetch="eager">Calendar</a>'
      + '<a href="/m/me" data-stx-link data-stx-prefetch="eager">Me</a>'
      + '<a href="/m/health" data-stx-link>Health</a></nav>',
    )
    await wait(400)
    // The page it is on came as a whole document; its fragment is the way back.
    expect(requested.sort()).toEqual(['/m', '/m/calendar', '/m/me'])
  })

  it('leaves eager links alone on a connection that asked to save data', async () => {
    const { requested } = installRouter('<a href="/m/calendar" data-stx-link data-stx-prefetch="eager">Calendar</a>', { saveData: true })
    await wait(400)
    expect(requested).toEqual([])
  })

  it('never prefetches a link the router may not claim', async () => {
    const { window, requested } = installRouter('<a href="/logout" data-stx-link data-stx-no-router id="out">Log out</a>')
    window.document.getElementById('out')!.dispatchEvent(new window.Event('touchstart', { bubbles: true }))
    await wait(10)
    expect(requested).toEqual([])
  })
})
