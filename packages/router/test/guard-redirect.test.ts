/**
 * A route guard's redirect is honoured by the SPA path (stacksjs/stx#1849).
 *
 * `definePageMeta({ middleware })` IS executed — the dev server runs it on the
 * fragment fetch (dev-server/serve-app.ts:705-727) and answers a guard with a
 * real 302. What went missing is on the client: `fetch` follows redirects
 * transparently, so the router saw the DESTINATION's 200, decided all was
 * well, and swapped /login's markup into the page while the address bar, the
 * history entry and the cache key all still said /dashboard.
 *
 * The result was a login form sitting at a URL claiming to be the guarded
 * page, and a reload that bounced the user again. `grep -n redirected
 * packages/router/src/client.ts` returned nothing before this change.
 *
 * The prefetch path had the same hole through a different door: hovering a
 * guarded link cached /login's body under the guarded key, so the later real
 * navigation was a cache hit that never touched the network and therefore
 * never reached the redirect check at all.
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
  MouseEvent: globalThis.MouseEvent,
  DOMParser: globalThis.DOMParser,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

/**
 * A response as `fetch` hands it back after transparently following a 302:
 * status 200, `redirected` true, and `url` pointing at the destination.
 * Both are read-only on a constructed Response, so they are defined here
 * rather than faked with a bare object — the router reads them off the real
 * Response contract.
 */
function redirectedResponse(html: string, finalUrl: string, headers: Record<string, string> = {}) {
  const response = new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html', ...headers },
  })
  Object.defineProperty(response, 'redirected', { value: true })
  Object.defineProperty(response, 'url', { value: finalUrl })
  return response
}

function plainResponse(html: string, headers: Record<string, string> = {}) {
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html', ...headers },
  })
}

const FRAGMENT_HEADERS = {
  'X-STX-Fragment': 'true',
  'X-STX-Layout': 'layouts/default.stx',
  'X-STX-Layout-Group': 'default',
}

function installRouter(body: string, fetchImpl: (url: string) => Promise<Response>) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`<html><head>
    <meta name="stx-layout" content="layouts/default.stx">
    <meta name="stx-layout-group" content="default">
  </head><body><main>Home</main>${body}</body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: true,
    progress: false,
    viewTransitions: false,
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    DOMParser: window.DOMParser,
    fetch: (url: string) => fetchImpl(String(url)),
  })

  new Function(getRouterScript())()

  return window as any
}

async function settle() {
  await new Promise(resolve => setTimeout(resolve, 200))
}

describe('guard redirect on SPA navigation (#1849)', () => {
  it('control: an unguarded navigation keeps the requested URL', async () => {
    const window = installRouter('', async () =>
      plainResponse('<section id="dash">Dashboard</section>', FRAGMENT_HEADERS))

    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(window.location.pathname).toBe('/dashboard')
    expect(window.document.querySelector('main')?.innerHTML).toContain('Dashboard')
  })

  it('puts the guard destination in the address bar, not the guarded path', async () => {
    const window = installRouter('', async () =>
      redirectedResponse('<section id="login">Sign in</section>', 'http://localhost/login', FRAGMENT_HEADERS))

    await window.stxRouter.navigate('/dashboard')
    await settle()

    // The body that arrived is /login's, so the URL must say /login. Showing
    // a login form under /dashboard is the actual reported symptom.
    expect(window.location.pathname).toBe('/login')
    expect(window.document.querySelector('main')?.innerHTML).toContain('Sign in')
  })

  it('caches the redirected body under the destination key, never the guarded one', async () => {
    const window = installRouter('', async () =>
      redirectedResponse('<section>Sign in</section>', 'http://localhost/login', FRAGMENT_HEADERS))

    await window.stxRouter.navigate('/dashboard')
    await settle()

    // A /dashboard cache entry holding /login's markup is the poisoning case:
    // it would be served on the next visit with no network round trip.
    expect(window.stxRouter.cache['/dashboard']).toBeUndefined()
    expect(window.stxRouter.cache['/login']).toContain('Sign in')
  })

  it('carries the destination query string through', async () => {
    const window = installRouter('', async () =>
      redirectedResponse('<section>Sign in</section>', 'http://localhost/login?next=%2Fdashboard', FRAGMENT_HEADERS))

    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toBe('?next=%2Fdashboard')
  })

  it('does not poison the prefetch cache with a guarded page it was redirected from', async () => {
    const seen: string[] = []
    const window = installRouter(
      `<a id="t" data-stx-link href="/dashboard">Dashboard</a>`,
      async (url) => {
        seen.push(url)
        return redirectedResponse('<section>Sign in</section>', 'http://localhost/login', FRAGMENT_HEADERS)
      },
    )

    const link = window.document.querySelector('#t')
    link.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true, cancelable: true }))
    await settle()

    expect(seen).toEqual(['/dashboard'])
    // Poisoning here is worse than the navigation case, because the later real
    // navigation is a cache hit and never reaches the redirect check.
    expect(window.stxRouter.cache['/dashboard']).toBeUndefined()
  })

  it('control: prefetch still caches an unguarded page', async () => {
    const window = installRouter(
      `<a id="t" data-stx-link href="/settings">Settings</a>`,
      async () => plainResponse('<section>Settings</section>', FRAGMENT_HEADERS),
    )

    const link = window.document.querySelector('#t')
    link.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true, cancelable: true }))
    await settle()

    expect(window.stxRouter.cache['/settings']).toContain('Settings')
  })
})
