/**
 * A component that stayed on the page is not re-run by a navigation
 * (stacksjs/stx#1958).
 *
 * Every navigation fragment carries the layout's component scripts, stamped
 * data-stx-run="always", and the router re-ran them all. A layout component
 * outside the swapped region never left the page and stays bound to its first
 * instance, so re-running it built a second instance: setup and its side
 * effects repeated on every navigation, for a component whose markup never
 * noticed.
 *
 * A component script now names its root in data-stx-owner, and runs on
 * navigation only for a root that just arrived -- one swapped in with the new
 * content, not yet bound. It is skipped when its root is gone (a different page
 * file gives the layout component a different id, since ids are page-keyed) and
 * when its root is still here and already bound (the same page file on both
 * sides gives the same id). Both shapes were measured in Chrome before this.
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

/** A page whose layout holds one component root outside <main>. */
function installRouter(responseHtml: string, options: { persistentId?: string, bound?: boolean, fullDocument?: boolean } = {}) {
  const window = new Window({ url: 'http://localhost/' })
  const persistent = options.persistentId
    ? `<div data-stx-scope="${options.persistentId}">nav</div>`
    : ''
  window.document.write(`
    <html>
      <head>
        <meta name="stx-layout" content="layouts/app.stx">
        <meta name="stx-layout-group" content="app">
      </head>
      <body>${persistent}<main>Home</main></body>
    </html>
  `)
  if (options.persistentId && options.bound) {
    // What hydrateComponentScopes leaves on a root it bound at first load.
    ;(window.document.querySelector(`[data-stx-scope="${options.persistentId}"]`) as any).__stx_disposers = () => {}
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
    fetch: async () => new Response(responseHtml, {
      status: 200,
      // A full document is what a static host serves: no fragment header, and
      // the router reads the layout from the page's own meta tags.
      headers: options.fullDocument
        ? { 'Content-Type': 'text/html' }
        : {
            'Content-Type': 'text/html',
            'X-STX-Fragment': 'true',
            'X-STX-Layout': 'layouts/app.stx',
            'X-STX-Layout-Group': 'app',
          },
    }),
  })

  new Function(getRouterScript())()
  return window as Window & { stxRouter: any }
}

async function navigate(window: any, url = '/next') {
  await window.stxRouter.navigate(url)
  await new Promise(r => setTimeout(r, 200))
}

/** How many executable copies of `needle` the router injected. */
function injected(window: any, needle: string): number {
  return Array.from(window.document.querySelectorAll('script[data-stx-page]'))
    .filter((s: any) => (s.textContent || '').includes(needle)).length
}

const ownedScript = (owner: string, sentinel: string): string =>
  `<script data-stx-scoped data-stx-run="always" data-stx-owner="${owner}">${sentinel}()<\/script>`

describe('router — components that stayed on the page (#1958)', () => {
  it('skips a component script whose root is not on the page', async () => {
    // A different page file: the layout component kept its first id, and the
    // fragment carries the next page's id for it.
    const window = installRouter(
      `<section>Body</section>${ownedScript('stx_nav_1_nextpage', 'SENTINEL_ORPHAN')}`,
      { persistentId: 'stx_nav_1_firstpage', bound: true },
    )
    await navigate(window)
    expect(injected(window, 'SENTINEL_ORPHAN')).toBe(0)
  })

  it('skips a component script whose root is still here and already bound', async () => {
    // The same page file on both sides: the fragment names the live root.
    const window = installRouter(
      `<section>Body</section>${ownedScript('stx_nav_1_samepage', 'SENTINEL_STAYED')}`,
      { persistentId: 'stx_nav_1_samepage', bound: true },
    )
    await navigate(window)
    expect(injected(window, 'SENTINEL_STAYED')).toBe(0)
  })

  it('still runs a component script whose root just arrived with the page', async () => {
    // The page's own components: swapped in, not bound yet. Skipping these
    // would leave every page component dead after navigation.
    const window = installRouter(
      `<section><div data-stx-scope="stx_card_1_nextpage">card</div>${ownedScript('stx_card_1_nextpage', 'SENTINEL_ARRIVED')}</section>`,
    )
    await navigate(window)
    expect(injected(window, 'SENTINEL_ARRIVED')).toBe(1)
  })

  it('runs a script with no owner exactly as before', async () => {
    const window = installRouter(
      '<section><script data-stx-scoped data-stx-run="always">SENTINEL_UNOWNED()<\/script>Body</section>',
      { persistentId: 'stx_nav_1_samepage', bound: true },
    )
    await navigate(window)
    expect(injected(window, 'SENTINEL_UNOWNED')).toBe(1)
  })
})

/** The same layout as installRouter's page, served whole. */
const fullDocument = (outside: string, inside: string): string => `<!DOCTYPE html>
<html>
  <head>
    <meta name="stx-layout" content="layouts/app.stx">
    <meta name="stx-layout-group" content="app">
  </head>
  <body>${outside}<main>${inside}</main></body>
</html>`

describe('router — components that stayed on the page, full-document responses (#1958)', () => {
  // The same layout reached through a whole page rather than a fragment. The
  // layout's component scripts sit outside <main> and are collected separately
  // from the page's own, so they need the owner rule on that path too.
  it('skips the layout component script collected from outside the container', async () => {
    const window = installRouter(
      fullDocument(
        `<div data-stx-scope="stx_nav_1_samepage">nav</div>${ownedScript('stx_nav_1_samepage', 'SENTINEL_LAYOUT')}`,
        '<section>Body</section>',
      ),
      { persistentId: 'stx_nav_1_samepage', bound: true, fullDocument: true },
    )
    await navigate(window)
    expect(window.document.querySelector('main')?.textContent).toContain('Body')
    expect(injected(window, 'SENTINEL_LAYOUT')).toBe(0)
  })

  it('still runs a page component script that arrived inside the container', async () => {
    const window = installRouter(
      fullDocument(
        '',
        `<div data-stx-scope="stx_card_1_nextpage">card</div>${ownedScript('stx_card_1_nextpage', 'SENTINEL_PAGE')}`,
      ),
      { fullDocument: true },
    )
    await navigate(window)
    expect(injected(window, 'SENTINEL_PAGE')).toBe(1)
  })
})

describe('router: a layout component with no scope root, full-document responses (#1958)', () => {
  // A component with no signals has no scope root for the owner check, so its
  // script carries data-stx-instance instead, and the side of the container it
  // sits on decides. Outside, it is the layout's chrome, still running; a
  // stx.mount wrapper re-run from there mounted onto the incoming page.
  const instanceScript = (id: string, sentinel: string): string =>
    `<script data-stx-scoped data-stx-run="always" data-stx-instance="${id}">${sentinel}()<\/script>`

  it('skips its script collected from outside the container', async () => {
    const window = installRouter(
      fullDocument(`<nav>${instanceScript('stx_plain_1_samepage', 'SENTINEL_CHROME')}</nav>`, '<section>Body</section>'),
      { fullDocument: true },
    )
    await navigate(window)
    expect(window.document.querySelector('main')?.textContent).toContain('Body')
    expect(injected(window, 'SENTINEL_CHROME')).toBe(0)
  })

  it('still runs one that arrived inside the container', async () => {
    const window = installRouter(
      fullDocument('', `<section>Body</section>${instanceScript('stx_plain_1_nextpage', 'SENTINEL_INSIDE')}`),
      { fullDocument: true },
    )
    await navigate(window)
    expect(injected(window, 'SENTINEL_INSIDE')).toBe(1)
  })

  it('still runs an unstamped scoped script from outside the container', async () => {
    const window = installRouter(
      fullDocument('<script data-stx-scoped data-stx-run="always">SENTINEL_UNSTAMPED()<\/script>', '<section>Body</section>'),
      { fullDocument: true },
    )
    await navigate(window)
    expect(injected(window, 'SENTINEL_UNSTAMPED')).toBe(1)
  })
})
