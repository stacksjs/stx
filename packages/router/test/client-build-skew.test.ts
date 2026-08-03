/**
 * The router falls back to a full navigation when the server's build id no
 * longer matches the page's (stacksjs/stx#1772).
 *
 * Under `bun --watch` a loaded page holds the client runtime from build N. A
 * file save restarts the server, so the next SPA navigation fetches a fragment
 * rendered by build N+1. Fragments legitimately carry preserved `{{ }}`
 * moustaches for client-side binding, so any drift in the scoped-script or
 * binding format between builds leaves the OLD runtime unable to hydrate the
 * NEW fragment — literal moustaches on screen, dead bindings, stale canvas.
 * Sporadic and never reproducible from a clean boot, which is its signature.
 *
 * This doesn't fix format drift; it makes the whole class of symptoms
 * unobservable, the same way Next and Vite's HMR clients hard-reload on a
 * version mismatch.
 *
 * The comparison is conservative on purpose — it acts only when BOTH ids are
 * known, so statically hosted output (no headers to send) and any consumer on
 * an older server keep swapping exactly as before.
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

/** Records assignments to location.href — the full-navigation fallback. */
function installRouter(html: string, fetchImpl: typeof fetch) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(html)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
    prefetch: false,
    progress: false,
    viewTransitions: false,
  }

  // very-happy-dom's location.href is non-configurable, so stand in a stub as
  // the global `location` the router resolves — it reads bare `location`.
  const navigations: string[] = []
  let href = 'http://localhost/'
  const real = window.location as any
  const locationStub: any = {
    get href() { return href },
    set href(v: string) { navigations.push(v); href = v },
  }
  for (const key of ['pathname', 'search', 'hash', 'origin', 'protocol', 'host', 'hostname', 'port']) {
    Object.defineProperty(locationStub, key, { get: () => real[key], configurable: true })
  }
  locationStub.assign = (v: string) => { locationStub.href = v }
  locationStub.replace = (v: string) => { locationStub.href = v }
  locationStub.toString = () => href

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: locationStub,
    history: window.history,
    fetch: fetchImpl,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
  })

  new Function(getRouterScript())()

  return { window: window as Window & { stxRouter: any }, navigations }
}

function page(buildId: string | null) {
  return `
    <html>
      <head>
        ${buildId === null ? '' : `<meta name="stx-build" content="${buildId}">`}
        <meta name="stx-layout" content="layouts/app.stx">
        <meta name="stx-layout-group" content="app">
      </head>
      <body><main>Home</main></body>
    </html>
  `
}

function fragment(buildId: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'text/html',
    'X-STX-Fragment': 'true',
    'X-STX-Layout': 'layouts/app.stx',
    'X-STX-Layout-Group': 'app',
  }
  if (buildId !== null)
    headers['X-STX-Build'] = buildId
  return async () => new Response('<section>Next page</section>', { status: 200, headers })
}

describe('router — build skew', () => {
  it('hard-navigates instead of swapping when the ids differ', async () => {
    const { window, navigations } = installRouter(page('buildN'), fragment('buildN+1'))

    await window.stxRouter.navigate('/next')

    expect(navigations).toEqual(['/next'])
    // Crucially the swap did NOT happen — that fragment would have been
    // hydrated by a runtime that predates it.
    expect(window.document.querySelector('main')?.textContent).toBe('Home')
  })

  it('swaps normally when the ids match', async () => {
    const { window, navigations } = installRouter(page('buildN'), fragment('buildN'))

    await window.stxRouter.navigate('/next')

    expect(navigations).toEqual([])
    expect(window.document.querySelector('main')?.textContent).toContain('Next page')
  })

  it('swaps when the server sends no id (static hosting, older server)', async () => {
    const { window, navigations } = installRouter(page('buildN'), fragment(null))

    await window.stxRouter.navigate('/next')

    expect(navigations).toEqual([])
    expect(window.document.querySelector('main')?.textContent).toContain('Next page')
  })

  it('swaps when the page carries no id', async () => {
    const { window, navigations } = installRouter(page(null), fragment('buildN+1'))

    await window.stxRouter.navigate('/next')

    expect(navigations).toEqual([])
    expect(window.document.querySelector('main')?.textContent).toContain('Next page')
  })

  it('catches skew on a full-document response too', async () => {
    // Layout changes fetch a full page, which carries the id as a meta rather
    // than a header.
    const { window, navigations } = installRouter(page('buildN'), async () =>
      new Response(page('buildN+1'), { status: 200, headers: { 'Content-Type': 'text/html' } }))

    await window.stxRouter.navigate('/next')

    expect(navigations).toEqual(['/next'])
  })

  it('exposes the loaded build id for debugging', () => {
    const { window } = installRouter(page('buildN'), fragment('buildN'))
    expect((window as any).__stxBuild).toBe('buildN')
  })
})
