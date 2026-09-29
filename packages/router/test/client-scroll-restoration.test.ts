/**
 * Back and forward return to where the entry was left.
 *
 * The router scrolled to the top on every swap, including a popstate, so
 * pressing Back after scrolling halfway down a list dumped you at the top of it
 * -- the one thing a reader of a long page notices immediately, and what every
 * other router does for you.
 *
 * The browser cannot do it here: by the time it would restore, the content of
 * the entry has not been fetched, so it clamps to the outgoing page's height.
 * history.scrollRestoration therefore goes to manual, each entry carries a
 * token, and the position lives in sessionStorage under it -- which also
 * restores the position a reload would otherwise have lost to manual mode.
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
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

const PAGE = `
  <html>
    <head>
      <meta name="stx-layout" content="layouts/app/index.stx">
      <meta name="stx-layout-group" content="app">
    </head>
    <body><main>Home</main></body>
  </html>
`

function installRouter(config: Record<string, unknown> = {}, url = 'http://localhost/start') {
  const window = new Window({ url })
  window.document.write(PAGE)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false, ...config }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async (target: any) => new Response(`<section>${String(target)}</section><h2 id="reviews">Reviews</h2>`, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/app/index.stx',
        'X-STX-Layout-Group': 'app',
      },
    }),
  })

  new Function(getRouterScript())()
  return window as Window & { stxRouter: any }
}

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 180))

/**
 * very-happy-dom keeps history state only for an entry a pushState created:
 * replaceState updates the URL but drops the state it was given. So neither the
 * token the router stamps onto the first entry nor the one it adds to a popped
 * entry survives in this harness. Every test that needs an entry carrying a
 * token therefore navigates to it, which pushes one, and the two stamping paths
 * are checked by watching the call the browser would have applied.
 */
async function visit(window: any, href: string): Promise<Record<string, unknown>> {
  await window.stxRouter.navigate(href)
  await settle()
  return { ...(window.history.state as object) }
}

function copyStorage(from: any, to: any) {
  for (let i = 0; i < from.length; i++) {
    const key = from.key(i)
    to.setItem(key, from.getItem(key))
  }
}

/** What the browser does on Back: URL and state change, then popstate fires. */
function goBackTo(window: any, href: string, state: unknown) {
  window.history.replaceState(state, '', href)
  window.dispatchEvent(new window.Event('popstate'))
}

describe('router scroll restoration', () => {
  it('returns to the position the entry was left at', async () => {
    const window = installRouter()
    const listEntry = await visit(window, '/list')

    window.scrollTo({ left: 0, top: 640, behavior: 'instant' })
    await visit(window, '/list/42')

    // A forward navigation still starts at the top of the new page.
    expect(window.scrollY).toBe(0)

    window.scrollTo({ left: 0, top: 120, behavior: 'instant' })
    goBackTo(window, '/list', listEntry)
    await settle()

    expect(window.scrollY).toBe(640)
  })

  it('gives two entries for the same URL their own positions', async () => {
    const window = installRouter()
    const firstVisit = await visit(window, '/list')

    window.scrollTo({ left: 0, top: 300, behavior: 'instant' })
    await visit(window, '/other')
    const secondVisit = await visit(window, '/list')
    window.scrollTo({ left: 0, top: 900, behavior: 'instant' })
    await visit(window, '/other')

    goBackTo(window, '/list', secondVisit)
    await settle()
    expect(window.scrollY).toBe(900)

    goBackTo(window, '/list', firstVisit)
    await settle()
    expect(window.scrollY).toBe(300)
  })

  it('goes to the top of an entry it has no position for', async () => {
    const window = installRouter()

    window.scrollTo({ left: 0, top: 500, behavior: 'instant' })
    goBackTo(window, '/never-visited', { __stxScroll: 'no-such-token' })
    await settle()

    expect(window.scrollY).toBe(0)
  })

  it('switches the browser off manual restoration only when asked', () => {
    expect(installRouter().history.scrollRestoration).toBe('manual')
    expect(installRouter({ scrollRestoration: false }).history.scrollRestoration).not.toBe('manual')
  })

  it('scrolls to the top on back when restoration is off', async () => {
    const window = installRouter({ scrollRestoration: false })
    const listEntry = await visit(window, '/list')

    window.scrollTo({ left: 0, top: 640, behavior: 'instant' })
    await visit(window, '/list/42')
    goBackTo(window, '/list', listEntry)
    await settle()

    expect(window.scrollY).toBe(0)
  })

  it('stamps a token onto an entry that has none', () => {
    const window = new Window({ url: 'http://localhost/list' })
    window.document.write(PAGE)
    const seen: unknown[] = []
    const real = window.history.replaceState.bind(window.history)
    ;(window.history as any).replaceState = (state: unknown, title: string, url: string) => {
      seen.push(state)
      return real(state, title, url)
    }
    ;(window as any).stx = {}
    ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false }
    Object.assign(globalThis, {
      window,
      document: window.document,
      location: window.location,
      history: window.history,
      CustomEvent: window.CustomEvent,
      Event: window.Event,
      DOMParser: window.DOMParser,
      fetch: async () => new Response('<section>x</section>'),
    })
    new Function(getRouterScript())()

    expect(seen.length).toBe(1)
    expect((seen[0] as any).__stxScroll).toBeTruthy()
  })

  it('restores after a reload, which never calls writeHistory', async () => {
    const first = installRouter()
    const listEntry = await visit(first, '/list')
    first.scrollTo({ left: 0, top: 480, behavior: 'instant' })
    // What the browser does when the tab reloads or the user leaves the app.
    first.dispatchEvent(new first.Event('pagehide'))

    const reloaded = new Window({ url: 'http://localhost/list' })
    reloaded.document.write(PAGE)
    copyStorage(first.sessionStorage, reloaded.sessionStorage)
    reloaded.history.pushState(listEntry, '', '/list')
    ;(reloaded as any).stx = {}
    ;(reloaded as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false }
    Object.assign(globalThis, {
      window: reloaded,
      document: reloaded.document,
      location: reloaded.location,
      history: reloaded.history,
      CustomEvent: reloaded.CustomEvent,
      Event: reloaded.Event,
      DOMParser: reloaded.DOMParser,
      fetch: async () => new Response('<section>x</section>'),
    })
    new Function(getRouterScript())()

    expect(reloaded.scrollY).toBe(480)
  })

  it('keeps what another script put in the history entry', async () => {
    const window = installRouter()
    await visit(window, '/list')
    const stamped: any[] = []
    const real = window.history.replaceState.bind(window.history)
    ;(window.history as any).replaceState = (state: unknown, title: string, url: string) => {
      stamped.push(state)
      return real(state, title, url)
    }

    // An entry written by something else: no token of its own, but a key that
    // has to survive the one the router adds when it pops back to it.
    goBackTo(window, '/elsewhere', { mine: 'keep' })
    await settle()

    const stamp = stamped[stamped.length - 1]
    expect(stamp.mine).toBe('keep')
    expect(stamp.__stxScroll).toBeTruthy()
  })

  it('still honours a hash over a fresh navigation', async () => {
    const window = installRouter()
    const into: string[] = []
    ;(window as any).Element.prototype.scrollIntoView = function (this: any) { into.push(this.id) }

    await window.stxRouter.navigate('/list#reviews')
    await settle()

    // The anchor comes in with the fragment, so it only exists after the swap.
    expect(into).toContain('reviews')
  })
})
