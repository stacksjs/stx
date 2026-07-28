import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'

/**
 * Regression: stacksjs/stx#1777
 *
 * The SPA interceptor resolved link targets with `new URL(url, location.origin)`,
 * i.e. against the ORIGIN ROOT rather than the current document. Any relative
 * href therefore navigated to the site root: on /dashboard, a filter tab like
 * `<a href="?status=resolved">` went to /?status=resolved (the landing page)
 * instead of /dashboard?status=resolved. Native <a> semantics resolve against
 * the current document URL, so the interceptor must use `location.href`.
 *
 * The same base bug applied to the cache key (a relative key collapsed to the
 * root, so two different pages shared one cache entry) and to <head> asset
 * reconciliation.
 */

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

function installRouterAt(url: string, html: string, fetchImpl: typeof fetch) {
  const window = new Window({ url })
  window.document.write(html)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: false,
    progress: false,
    viewTransitions: false,
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    fetch: fetchImpl,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
  })

  // eslint-disable-next-line no-new-func
  new Function(getRouterScript())()

  return window as Window & { stxRouter: any }
}

function fragment(html: string) {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'X-STX-Fragment': 'true',
      'X-STX-Layout': 'layouts/app.stx',
      'X-STX-Layout-Group': 'app',
    },
  })
}

const PAGE = `
  <html>
    <head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
    </head>
    <body><nav>App nav</nav><main>Dashboard</main></body>
  </html>
`

async function settle() {
  await new Promise(resolve => setTimeout(resolve, 180))
}

describe('stx#1777: relative hrefs resolve against the current document', () => {
  it('keeps a query-only link on the current path (not the site root)', async () => {
    const window = installRouterAt(
      'http://localhost/dashboard',
      PAGE,
      async () => fragment('<section>Resolved issues</section>'),
    )

    await window.stxRouter.navigate('?status=resolved')
    await settle()

    // Pre-fix this landed on '/' — the marketing landing page.
    expect(window.location.pathname).toBe('/dashboard')
    expect(window.location.search).toBe('?status=resolved')
  })

  it('resolves a relative path against the current directory', async () => {
    const window = installRouterAt(
      'http://localhost/docs/intro',
      PAGE,
      async () => fragment('<section>Guide</section>'),
    )

    await window.stxRouter.navigate('guide')
    await settle()

    expect(window.location.pathname).toBe('/docs/guide')
  })

  it('caches a query-only navigation under the full path, not the root', async () => {
    const window = installRouterAt(
      'http://localhost/dashboard',
      PAGE,
      async () => fragment('<section>Resolved issues</section>'),
    )

    await window.stxRouter.navigate('?status=resolved')
    await settle()

    // A root-based key ('/?status=resolved') would collide across pages that
    // share a query string, serving one page's HTML for another.
    expect(Object.keys(window.stxRouter.cache)).toContain('/dashboard?status=resolved')
    expect(Object.keys(window.stxRouter.cache)).not.toContain('/?status=resolved')
  })

  it('still handles absolute in-app paths unchanged', async () => {
    const calls: string[] = []
    const window = installRouterAt(
      'http://localhost/dashboard',
      PAGE,
      async (url) => { calls.push(String(url)); return fragment('<section>Settings</section>') },
    )

    await window.stxRouter.navigate('/settings')
    await settle()

    expect(calls).toEqual(['/settings'])
    expect(window.location.pathname).toBe('/settings')
  })

  it('still treats a different origin as an external link', async () => {
    let fetched = false
    const window = installRouterAt(
      'http://localhost/dashboard',
      PAGE,
      async () => { fetched = true; return fragment('<section>nope</section>') },
    )

    await window.stxRouter.navigate('https://example.com/pricing')
    await settle()

    // Cross-origin must hand off to the browser, never SPA-fetch.
    expect(fetched).toBe(false)
  })
})
