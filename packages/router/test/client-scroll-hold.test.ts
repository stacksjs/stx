/**
 * Back to a page that is not tall enough yet.
 *
 * A page put back by Back is swapped in before its lists are drawn: they come
 * from data still on its way, or from a store a moment later. scrollTo clamps
 * to the little height there is, so the position the entry was left at was
 * lost and Back landed at the top of every long page (hq.training's Home).
 * The router now holds the position and applies it again as the page grows,
 * until the person scrolls or taps, the page scrolls itself, or four seconds pass.
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
  DOMParser: globalThis.DOMParser,
  ResizeObserver: (globalThis as any).ResizeObserver,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

class FakeResizeObserver {
  static live: FakeResizeObserver[] = []
  disconnected = false
  constructor(private callback: () => void) { FakeResizeObserver.live.push(this) }
  observe() {}
  disconnect() { this.disconnected = true }
  /** The page grew: what the browser reports after a layout. */
  static grow() { for (const observer of FakeResizeObserver.live) if (!observer.disconnected) observer.callback() }
}

function installRouter() {
  const window = new Window({ url: 'http://localhost/start' })
  window.document.write('<html><head><meta name="stx-layout" content="layouts/app.stx"></head><body><main>Home</main></body></html>')
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false, announceRoute: false }
  // A document only so tall: scrolling past its end stops at the end.
  const page = { height: 5000 }
  const scrollTo = window.scrollTo.bind(window)
  ;(window as any).scrollTo = (options: any) => scrollTo({ ...options, top: Math.min(options.top ?? 0, page.height) })
  Object.defineProperty(window.document.documentElement, 'scrollHeight', { configurable: true, get: () => page.height + (window.innerHeight || 0) })
  FakeResizeObserver.live = []
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    ResizeObserver: FakeResizeObserver,
    fetch: async (target: any) => new Response(`<section>${String(target)}</section>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/app.stx' },
    }),
  })
  new Function(getRouterScript())()
  return { window: window as any, page }
}

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 180))

async function leaveAt(window: any, top: number) {
  await window.stxRouter.navigate('/list')
  await settle()
  const entry = { ...(window.history.state as object) }
  window.scrollTo({ left: 0, top, behavior: 'instant' })
  await window.stxRouter.navigate('/list/42')
  await settle()
  return entry
}

function goBackTo(window: any, href: string, state: unknown) {
  window.history.replaceState(state, '', href)
  window.dispatchEvent(new window.Event('popstate'))
}

describe('a restored position on a page still filling in', () => {
  it('is reached once the page has grown tall enough', async () => {
    const { window, page } = installRouter()
    const entry = await leaveAt(window, 1400)
    page.height = 300
    goBackTo(window, '/list', entry)
    await settle()
    expect(window.scrollY).toBe(300)

    page.height = 5000
    FakeResizeObserver.grow()
    expect(window.scrollY).toBe(1400)
  })

  it('is let go when the person scrolls first', async () => {
    const { window, page } = installRouter()
    const entry = await leaveAt(window, 1400)
    page.height = 300
    goBackTo(window, '/list', entry)
    await settle()

    window.dispatchEvent(new window.Event('wheel'))
    window.scrollTo({ left: 0, top: 120, behavior: 'instant' })
    page.height = 5000
    FakeResizeObserver.grow()
    expect(window.scrollY).toBe(120)
  })

  it('is let go by the next navigation', async () => {
    const { window, page } = installRouter()
    const entry = await leaveAt(window, 1400)
    page.height = 300
    goBackTo(window, '/list', entry)
    await settle()

    await window.stxRouter.navigate('/other')
    await settle()
    page.height = 5000
    FakeResizeObserver.grow()
    expect(window.scrollY).toBe(0)
  })
})

describe('the position an entry is left at', () => {
  it('is the one it had as the swap began, not after the next page clamped the window', async () => {
    const { window, page } = installRouter()
    // The window clamps to the document as it stands: a page that has just
    // been swapped in and is still filling in is only so tall.
    let scrolled = 0
    const tall = () => (window.document.querySelector('main')?.textContent || '').includes('/list/42') ? 300 : page.height
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => Math.min(scrolled, tall()) })
    Object.defineProperty(window, 'pageYOffset', { configurable: true, get: () => Math.min(scrolled, tall()) })
    ;(window as any).scrollTo = (options: any) => { scrolled = Math.min(options.top ?? 0, tall()) }

    await window.stxRouter.navigate('/list')
    await settle()
    const entry = { ...(window.history.state as object) }
    window.scrollTo({ left: 0, top: 1400, behavior: 'instant' })
    await window.stxRouter.navigate('/list/42')
    await settle()
    expect(window.scrollY).toBe(0)

    goBackTo(window, '/list', entry)
    await settle()
    expect(window.scrollY).toBe(1400)
  })
})

describe('a restored position the page moves itself', () => {
  it('is let go when something else scrolls the window', async () => {
    const { window, page } = installRouter()
    const entry = await leaveAt(window, 1400)
    page.height = 300
    goBackTo(window, '/list', entry)
    await settle()

    // The page scrolls to what it wants to show, then grows.
    page.height = 5000
    window.scrollTo({ left: 0, top: 900, behavior: 'instant' })
    window.dispatchEvent(new window.Event('scroll'))
    FakeResizeObserver.grow()
    expect(window.scrollY).toBe(900)
  })
})
