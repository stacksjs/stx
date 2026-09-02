/**
 * A prefetched entry keeps the container attributes (stacksjs/stx#1947).
 *
 * setCache takes six arguments. The navigate path passed all six; both
 * prefetch paths passed five, which JavaScript accepts without a word, so an
 * entry stored by hover-prefetch had no container attributes. Clicking a link
 * that had been hovered first was then a cache hit that applied '', and
 * setContainerAttrs stripped the class the previous navigation had put on the
 * routed <main>. It read as an intermittent CSS bug: only links that happened
 * to be hovered did it, and a hard reload — which takes the class from the
 * markup rather than the header — always fixed it.
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

// Mirrors the helper used in client-navigation.test.ts.
function installRouter(html: string, fetchImpl: typeof fetch, config: Record<string, unknown> = {}) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(html)
  // eslint-disable-next-line ts/no-explicit-any
  ;(window as any).stx = {}
  // eslint-disable-next-line ts/no-explicit-any
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: true,
    progress: false,
    viewTransitions: false,
    ...config,
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

  new Function(getRouterScript())()

  // eslint-disable-next-line ts/no-explicit-any
  return window as Window & { stxRouter: any }
}

const PAGE = `<html><head>
    <meta name="stx-layout" content="layouts/app.stx">
    <meta name="stx-layout-group" content="app">
  </head><body>
    <nav><a href="/reports" data-stx-link>Reports</a></nav>
    <main>Home</main>
  </body></html>`

/**
 * What the dev server sends for a dashboard route: the routed <main> gets its
 * shell class from the header, not from the fragment's markup.
 */
function makeFetch(calls: string[]): typeof fetch {
  return async (url: string | URL | Request) => {
    const href = String(url)
    calls.push(href)
    return new Response(`<section>${href}</section>`, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/app.stx',
        'X-STX-Layout-Group': 'app',
        'X-STX-Container-Attrs': encodeURIComponent('class="app-shell"'),
      },
    })
  }
}

async function flush() {
  await new Promise(resolve => setTimeout(resolve, 180))
}

function mainClass(window: Window): string | null {
  return window.document.querySelector('main')?.getAttribute('class') ?? null
}

describe('router prefetch keeps container attributes (#1947)', () => {
  it('applies them on a navigation served from the prefetch cache', async () => {
    const calls: string[] = []
    const window = installRouter(PAGE, makeFetch(calls))

    window.stxRouter.prefetch('/dashboard')
    await flush()
    expect(calls).toEqual(['/dashboard'])

    await window.stxRouter.navigate('/dashboard')
    await flush()

    // Served from the cache — no second request — and the class came with it.
    expect(calls).toEqual(['/dashboard'])
    expect(mainClass(window)).toBe('app-shell')
  })

  it('does not strip what the previous navigation applied', async () => {
    // The reported symptom: page A is reached over the network and gets its
    // class; a link to page B is hovered, then clicked. The cache hit for B
    // used to apply '' and remove A's class from the container.
    const calls: string[] = []
    const window = installRouter(PAGE, makeFetch(calls))

    await window.stxRouter.navigate('/dashboard')
    await flush()
    expect(mainClass(window)).toBe('app-shell')

    window.stxRouter.prefetch('/dashboard/reports')
    await flush()
    await window.stxRouter.navigate('/dashboard/reports')
    await flush()

    expect(calls).toEqual(['/dashboard', '/dashboard/reports'])
    expect(mainClass(window)).toBe('app-shell')
  })

  it('declines to cache a redirected body, on the public API too', async () => {
    // #1849: a guarded route prefetched while logged out answers with the
    // login page. Storing that under the guarded key makes the later real
    // navigation a cache hit, so the login markup is swapped in without ever
    // reaching the network — where navigate's own redirect check would have
    // caught it. The hover path guarded against this; router.prefetch() did
    // not, until both were routed through one reader.
    const calls: string[] = []
    const window = installRouter(PAGE, async (url: string | URL | Request) => {
      const href = String(url)
      calls.push(href)
      const r = new Response(`<section>login</section>`, {
        status: 200,
        headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true' },
      })
      Object.defineProperty(r, 'redirected', { value: true })
      return r
    })

    window.stxRouter.prefetch('/admin')
    await flush()

    expect(calls).toEqual(['/admin'])
    expect(window.stxRouter.cache['/admin']).toBeUndefined()
  })

  it('declines to cache a fragment built by a different build', async () => {
    // #1772: a fragment from another build must not reach this page's runtime.
    // navigate answers skew by reloading; a prefetch must not, because the user
    // only hovered. Not caching is the fix — the click then goes to the
    // network, where navigate reloads properly.
    const calls: string[] = []
    const window = installRouter(
      `<html><head>
         <meta name="stx-layout" content="layouts/app.stx">
         <meta name="stx-build" content="build-one">
       </head><body><main>Home</main></body></html>`,
      async (url: string | URL | Request) => {
        calls.push(String(url))
        return new Response(`<section>newer</section>`, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'X-STX-Fragment': 'true',
            'X-STX-Build': 'build-two',
          },
        })
      },
    )

    window.stxRouter.prefetch('/next')
    await flush()

    expect(calls).toEqual(['/next'])
    expect(window.stxRouter.cache['/next']).toBeUndefined()
    // Hovering must not have navigated the page anywhere.
    expect(window.location.pathname).toBe('/')
  })

  it('stores them from a hover prefetch too', async () => {
    const calls: string[] = []
    const window = installRouter(PAGE, makeFetch(calls))

    const link = window.document.querySelector('a[data-stx-link]')!
    link.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
    await flush()
    expect(calls).toEqual(['/reports'])

    await window.stxRouter.navigate('/reports')
    await flush()

    expect(calls).toEqual(['/reports'])
    expect(mainClass(window)).toBe('app-shell')
  })
})
