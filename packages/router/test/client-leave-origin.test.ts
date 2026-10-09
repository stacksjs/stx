/**
 * A page that lives on another origin, reached by a router navigation.
 *
 * A host given a page of the site as its home (stx domain routes with
 * `elsewhere`) sends its other pages to the main origin. The server cannot
 * redirect the router's fetch there: the request carries X-STX-Router, and a
 * cross-origin redirect of such a request fails CORS, so the router showed
 * its retry screen with the address bar on the new path. The server says
 * X-STX-Location instead and the router goes there itself; a plain fetch
 * redirected off-origin is treated the same.
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


describe('leaving the origin on a router navigation', () => {
  it('goes where X-STX-Location says, and swaps nothing in', async () => {
    const window = installRouter('', async () =>
      new Response(null, { status: 200, headers: { 'X-STX-Location': 'https://example.com/login?next=/chris' } }))

    await window.stxRouter.navigate('/login?next=/chris')
    await settle()

    expect(window.location.href).toBe('https://example.com/login?next=/chris')
    expect(window.document.querySelector('main')?.innerHTML).toBe('Home')
    expect(window.stxRouter.cache['/login?next=/chris']).toBeUndefined()
  })

  it('does the same for a plain fetch redirected to another origin', async () => {
    const window = installRouter('', async () =>
      redirectedResponse('<section>Elsewhere</section>', 'https://example.com/pricing', FRAGMENT_HEADERS))

    await window.stxRouter.navigate('/pricing')
    await settle()

    expect(window.location.href).toBe('https://example.com/pricing')
    expect(window.document.querySelector('main')?.innerHTML).not.toContain('Elsewhere')
  })

  it('never caches such an answer from a prefetch', async () => {
    const window = installRouter('<a id="away" href="/pricing">Pricing</a>', async () =>
      new Response(null, { status: 200, headers: { 'X-STX-Location': 'https://example.com/pricing' } }))

    window.stxRouter.prefetch?.('/pricing')
    window.document.getElementById('away')?.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }))
    await settle()

    expect(window.stxRouter.cache['/pricing']).toBeUndefined()
  })
})
