/**
 * The router only claims links it can actually render (stacksjs/stx#1864).
 *
 * `interceptAllLinks` — the base default on the serve path — made the router
 * claim EVERY same-origin relative anchor. `shouldIntercept()` filtered on
 * protocol, target and a few opt-out attributes and had no notion of a route
 * table, so a link to a non-page endpoint was fetched, failed to swap, and then
 * fell back to a real navigation. The reporter's trace:
 *
 *     Fetch     503  /api/auth/github/redirect
 *     Document  503  /api/auth/github/redirect
 *
 * Two hits on an endpoint whose entire job is minting OAuth state. And when
 * such an endpoint returns a successful cross-origin redirect, `fetch` follows
 * it and the router swaps a third-party document into the container.
 *
 * The only escape was `data-no-router`, which removes the anchor from routing
 * altogether — 17 of them in one app, and every new link has to remember.
 *
 * The safety property that matters as much as the fix: when the route table did
 * NOT reach the client, absence means UNKNOWN and every path stays claimable.
 * Reading it as "owns nothing" would disable SPA navigation site-wide, which is
 * far worse than the double-fetch being fixed.
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

/** Matchers as the server ships them: the file router's own compiled regexes. */
const OWNED = ['^\\/$', '^\\/login$', '^\\/cars\\/([^/]+)$']

const PAGE = `
  <html>
    <head></head>
    <body><main>Home</main>
      <a id="page" href="/login">Sign in</a>
      <a id="dynamic" href="/cars/42">A car</a>
      <a id="oauth" href="/api/auth/github/redirect">GitHub</a>
      <a id="proxied" href="/docs/guide">Docs</a>
      <a id="query" href="?status=resolved">Filter</a>
      <a id="withquery" href="/login?next=/cars/42">Sign in next</a>
      <a id="external" href="https://example.com/x">External</a>
    </body>
  </html>
`

interface Harness {
  fetched: string[]
  click: (id: string) => boolean
}

/** Install the router; `owned` omitted models a client that never got the table. */
function installRouter(owned?: string[]): Harness {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(PAGE)
  ;(window as any).stx = {}

  const config: Record<string, unknown> = {
    cache: false,
    prefetch: false,
    progress: false,
    viewTransitions: false,
    interceptAllLinks: true,
  }
  if (owned)
    config.ownedRoutes = owned
  ;(window as any).__stxRouterConfig = config

  const fetched: string[] = []

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async (url: string) => {
      fetched.push(String(url))
      return new Response('<main>swapped</main>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  // eslint-disable-next-line no-new-func
  new Function(getRouterScript())()

  return {
    fetched,
    /** Click an anchor; returns whether the router claimed it. */
    click(id: string): boolean {
      const link = window.document.getElementById(id)!
      const event = new window.Event('click', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'button', { value: 0 })
      Object.defineProperty(event, 'target', { value: link })
      link.dispatchEvent(event)
      return event.defaultPrevented
    },
  }
}

describe('with the route table on the client', () => {
  it('leaves an endpoint it cannot render to the browser', () => {
    // The reported case: claiming this fetched it, failed, then navigated —
    // minting OAuth state twice.
    const app = installRouter(OWNED)

    expect(app.click('oauth')).toBe(false)
    expect(app.fetched).toEqual([])
  })

  it('leaves a proxied path alone', () => {
    // `/docs` served by a different backend: a fragment fetch returns a
    // document the router cannot swap.
    const app = installRouter(OWNED)

    expect(app.click('proxied')).toBe(false)
  })

  it('still claims a real page', () => {
    const app = installRouter(OWNED)

    expect(app.click('page')).toBe(true)
  })

  it('still claims a dynamic route', () => {
    // The matcher is the server's own, so `:id` is not special-cased here.
    const app = installRouter(OWNED)

    expect(app.click('dynamic')).toBe(true)
  })

  it('ignores a query string when deciding ownership', () => {
    const app = installRouter(OWNED)

    expect(app.click('withquery')).toBe(true)
  })

  it('still claims a bare query link on the current page', () => {
    const app = installRouter(OWNED)

    expect(app.click('query')).toBe(true)
  })

  it('leaves an external link alone, as before', () => {
    const app = installRouter(OWNED)

    expect(app.click('external')).toBe(false)
  })
})

describe('without the route table', () => {
  it('claims everything, exactly as it did before', () => {
    // Absence means UNKNOWN. Treating it as "owns nothing" would kill SPA
    // navigation for every site whose routes could not be discovered.
    const app = installRouter(undefined)

    expect(app.click('page')).toBe(true)
    expect(app.click('oauth')).toBe(true)
  })

  it('treats an empty list the same as absence', () => {
    const app = installRouter([])

    expect(app.click('oauth')).toBe(true)
  })

  it('ignores a matcher that does not compile', () => {
    // A malformed source must not take the whole gate down.
    const app = installRouter(['^\\/login$', '([unclosed'])

    expect(app.click('page')).toBe(true)
    expect(app.click('oauth')).toBe(false)
  })
})
