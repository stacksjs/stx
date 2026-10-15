/**
 * A tap that waits for its prefetch says so at once.
 *
 * A hover starts the page's fetch; the click a moment later waits for that
 * answer rather than asking again. Until it came, nothing on screen moved:
 * no loading class, no progress bar. On a server a second or two away the
 * link read as dead (hq.training's Calendar, 2026-10-14), so it was clicked
 * again, and again. The tap is now answered when it happens.
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

function installRouter(delay: number) {
  const window = new Window({ url: 'http://localhost/home' })
  window.document.write('<html><head><meta name="stx-layout" content="layouts/app.stx"></head><body><nav><a href="/calendar" data-stx-link id="cal">Calendar</a></nav><main>Home</main></body></html>')
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: true, prefetch: true, progress: true, viewTransitions: false, prefetchVisible: false, announceRoute: false }
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
      await new Promise(resolve => setTimeout(resolve, delay))
      return new Response('<section>Calendar page</section>', { status: 200, headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/app.stx' } })
    },
  })
  new Function(getRouterScript())()
  return { window: window as any, requested }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const hover = (window: any, el: any) => el.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
const bar = (window: any) => window.document.getElementById('stx-router-progress')

describe('a tap waiting on its prefetch', () => {
  it('shows the loading state at once, and clears it when the page is in', async () => {
    const { window, requested } = installRouter(600)
    hover(window, window.document.getElementById('cal'))
    await wait(20)
    expect(requested.filter(url => url === '/calendar')).toHaveLength(1)

    const navigation = window.stxRouter.navigate('/calendar')
    expect(window.document.body.classList.contains('stx-navigating')).toBe(true)
    await wait(300)
    // The bar shows after its short delay, while the prefetch is still out.
    expect(window.location.pathname).toBe('/home')
    expect(bar(window).style.opacity).toBe('1')

    await navigation
    await wait(20)
    expect(requested.filter(url => url === '/calendar')).toHaveLength(1)
    expect(window.location.pathname).toBe('/calendar')
    expect(window.document.body.classList.contains('stx-navigating')).toBe(false)
  })
})

describe('the page the app opened on', () => {
  it('is fetched into the cache once the page is idle, so Back to it is a swap', async () => {
    const { window, requested } = installRouter(10)
    await wait(1700)
    expect(requested).toContain('/home')
    expect(window.stxRouter.cache['/home']).toContain('Calendar page')
  })
})
