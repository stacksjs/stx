/**
 * A navigation never leaves a page unbound because its module bundle did not
 * load.
 *
 * Serve mode links a page's module registry, stores and composables as
 * content-addressed files, `/_stx/modules.<hash>.js`, answered from what the
 * server process has rendered. Reported on hq.training: a coach opened
 * /coaches/athletes from the app and got the server's shell with nothing
 * bound -- a `{{ a }} · {{ b }}` subtitle read just "·", the `:for` option
 * lists were empty, the `:if` buttons were missing -- and the same tap worked
 * a while later. Never locally. Two ways in, both fixed here:
 *
 * - The bundle was still on its way. A prefetch starts loading the page's
 *   registry (loadModuleRegistries), and the router counted a file as loaded
 *   the moment it was requested. A tap before it finished swapped the page in
 *   and ran its setup at once, ahead of the registry it imports from:
 *   "module ... is not registered on this page". Locally a bundle loads in a
 *   millisecond, so the tap never wins.
 * - The bundle is gone. Its HTML was kept (the router's cache, the offline
 *   worker's stale-while-revalidate copy) from a server process that has
 *   since been replaced: a deploy is a new release directory and a new
 *   process, which has never rendered that page and answers the hash 404.
 *   The setup ran anyway, against no registry, and the failed file was
 *   remembered as loaded, so not even a fresh copy of the page could load it
 *   again until a reload.
 *
 * Now a navigation waits for a bundle in flight, a failed one is forgotten,
 * and a page whose bundle failed is fetched again past every cache and swapped
 * in fresh; failing that too, it is loaded as a document.
 *
 * very-happy-dom neither loads nor runs an injected script, so the tests
 * settle each file themselves (onload / onerror) and read which page scripts
 * the router created, which is what it runs.
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

const BUNDLE = '/_stx/modules.0123456789abcdef.js'

/** A page whose setup imports from its registry, as serve mode renders it. */
function fragment(bundle = BUNDLE): string {
  return `<section><p>{{ athlete }} · {{ team }}</p></section>
<script data-stx-scoped data-stx-run="always" data-stx-modules src="${bundle}"><\/script>
<script>function __stx_setup_athletes() { return {} }
window.stx._latestSetup = __stx_setup_athletes<\/script>`
}

interface Answer { body: string, build?: string, layout?: string, doc?: boolean }

function install(answers: Answer[], options: { prefetch?: boolean } = {}) {
  const window = new Window({ url: 'http://localhost/coaches' })
  window.document.write(`
    <html>
      <head>
        <meta name="stx-build" content="b1">
        <meta name="stx-layout" content="layouts/app.stx">
        <meta name="stx-layout-group" content="app">
      </head>
      <body><nav><a href="/coaches/athletes" data-stx-link id="athletes">Athletes</a></nav><main>Coaches</main></body>
    </html>
  `)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: true, prefetch: options.prefetch ?? false, prefetchVisible: false, progress: false, viewTransitions: false, revalidate: false }

  // Every script the router creates, in creation order.
  const created: any[] = []
  const createElement = window.document.createElement.bind(window.document)
  ;(window.document as any).createElement = (tag: string, ...rest: any[]) => {
    const el = (createElement as any)(tag, ...rest)
    if (String(tag).toLowerCase() === 'script')
      created.push(el)
    return el
  }

  // Full navigations, through a stand-in location (very-happy-dom's href is
  // not configurable). Everything else reads the real one.
  const navigations: string[] = []
  const real = window.location as any
  const locationStub: any = {
    get href() { return real.href },
    set href(v: string) { navigations.push(v) },
  }
  for (const key of ['pathname', 'search', 'hash', 'origin', 'protocol', 'host', 'hostname', 'port'])
    Object.defineProperty(locationStub, key, { get: () => real[key], configurable: true })
  locationStub.assign = (v: string) => { navigations.push(v) }
  locationStub.replace = (v: string) => { navigations.push(v) }
  locationStub.reload = () => { navigations.push('reload') }
  locationStub.toString = () => real.href

  const requests: Array<{ url: string, cache?: string }> = []
  let next = 0
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: locationStub,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async (url: string, init: RequestInit = {}) => {
      requests.push({ url: String(url), cache: init.cache })
      const answer = answers[Math.min(next++, answers.length - 1)]
      if (answer.doc)
        return new Response(answer.body, { status: 200, headers: { 'Content-Type': 'text/html' } })
      return new Response(answer.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'X-STX-Fragment': 'true',
          'X-STX-Layout': answer.layout ?? 'layouts/app.stx',
          'X-STX-Layout-Group': 'app',
          'X-STX-Runtime': 'true',
          'X-STX-Build': answer.build ?? 'b1',
        },
      })
    },
  })

  new Function(getRouterScript())()

  const bundles = () => created.filter(s => (s.getAttribute?.('src') || '').includes('/_stx/modules.'))
  const setups = () => created.filter(s => s.hasAttribute?.('data-stx-page') && String(s.textContent).includes('__stx_setup_athletes'))
  return { window: window as Window & { stxRouter: any }, created, bundles, setups, requests, navigations }
}

// Past the fallback fade (120ms) a navigation the test did not await swaps behind.
const tick = (ms = 200) => new Promise(r => setTimeout(r, ms))

describe('router: a page\'s module bundle (serve mode)', () => {
  it('runs the page once its bundle has loaded, not before', async () => {
    const { window, bundles, setups } = install([{ body: fragment() }])

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    expect(bundles().length).toBe(1)
    expect(setups().length).toBe(0)

    bundles()[0].onload()
    await tick()
    expect(setups().length).toBe(1)
  })

  it('waits for a bundle a prefetch is still loading, rather than counting it loaded', async () => {
    // The registry starts loading with the prefetch, and the tap lands before
    // it has finished: on a phone a continent from the server, the usual case.
    const { window, bundles, setups } = install([{ body: fragment() }], { prefetch: true })

    const link = window.document.getElementById('athletes') as any
    link.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
    await tick()
    expect(bundles().length).toBe(1)

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    // Not requested twice, and the setup has not run ahead of it.
    expect(bundles().length).toBe(1)
    expect(setups().length).toBe(0)

    bundles()[0].onload()
    await tick()
    expect(setups().length).toBe(1)
  })

  it('fetches the page again past every cache when its bundle cannot be loaded, and runs that copy', async () => {
    // The first copy was kept from a server process that is gone; the one
    // asked for again was rendered by the process now answering, which
    // therefore knows the bundle it links.
    const { window, bundles, setups, requests, navigations } = install([{ body: fragment() }, { body: fragment() }])

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    bundles()[0].onerror()
    await tick()

    // Never run against a registry that is not there.
    expect(setups().length).toBe(0)
    expect(requests.length).toBe(2)
    expect(requests[0].cache).toBeUndefined()
    // no-store: the offline worker passes it straight to the network, where
    // a plain request would be answered with the same kept copy.
    expect(requests[1].cache).toBe('no-store')

    // The failed file was forgotten, so the fresh copy loads it again.
    expect(bundles().length).toBe(2)
    bundles()[1].onload()
    await tick()
    expect(setups().length).toBe(1)
    expect(navigations).toEqual([])
    expect(window.location.pathname).toBe('/coaches/athletes')
  })

  it('drops the cached copy whose bundle failed, so the next visit does not swap it in again', async () => {
    const { window, bundles } = install([{ body: fragment() }, { body: fragment() }])

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    const kept = window.stxRouter.cache['/coaches/athletes']
    expect(kept).toContain(BUNDLE)

    bundles()[0].onerror()
    await tick()
    // Replaced by the copy fetched again, not the one that failed.
    expect(window.stxRouter.cache['/coaches/athletes']).toBeDefined()
    expect(bundles().length).toBe(2)
  })

  it('loads the page as a document when the fresh copy\'s bundle fails too', async () => {
    const { window, bundles, setups, navigations } = install([{ body: fragment() }, { body: fragment() }])

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    bundles()[0].onerror()
    await tick()
    bundles()[1].onerror()
    await tick()

    expect(setups().length).toBe(0)
    expect(navigations).toEqual(['/coaches/athletes'])
  })

  it('reloads into the new build when the fresh copy comes from one', async () => {
    // The usual cause: a deploy. The fresh answer carries the new build's id,
    // which this page's runtime must not hydrate (#1772).
    const { window, bundles, setups, navigations } = install([{ body: fragment() }, { body: fragment('/_stx/modules.fedcba9876543210.js'), build: 'b2' }])

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    bundles()[0].onerror()
    await tick()

    expect(setups().length).toBe(0)
    expect(navigations).toEqual(['/coaches/athletes'])
  })

  it('does not recover a page the person has already left', async () => {
    const { window, bundles, requests, navigations } = install([{ body: fragment() }, { body: '<section>Schedule</section>' }])

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    await window.stxRouter.navigate('/coaches/schedule')
    await tick()
    bundles()[0].onerror()
    await tick()

    expect(requests.map(r => r.url)).toEqual(['/coaches/athletes', '/coaches/schedule'])
    expect(navigations).toEqual([])
  })

  it('recovers a layout change\'s whole document the same way', async () => {
    // A different layout is swapped in as a whole document, whose bundles
    // load through the same barrier as a fragment's.
    // <body> carries no attributes: very-happy-dom's attribute collection
    // yields nameless entries the body-attribute copy would throw on.
    const doc = `<!DOCTYPE html><html><head>
      <meta name="stx-build" content="b1">
      <meta name="stx-layout" content="layouts/coach.stx">
      <meta name="stx-layout-group" content="app">
    </head><body><main>${fragment()}</main></body></html>`
    const { window, bundles, setups, requests, navigations } = install([
      { body: fragment(), layout: 'layouts/coach.stx' },
      { body: doc, doc: true },
      { body: fragment(), layout: 'layouts/coach.stx' },
    ])

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    expect(bundles().length).toBe(1)
    bundles()[0].onerror()
    await tick()

    expect(requests.length).toBe(3)
    expect(requests[2].cache).toBe('no-store')
    expect(bundles().length).toBe(2)
    bundles()[1].onload()
    await tick()
    expect(setups().length).toBe(1)
    expect(navigations).toEqual([])
  })

  it('still runs the page when a file of its own (not a module bundle) fails', async () => {
    // Unchanged: one missing app script must not stop the rest of the page
    // hydrating, and fetching the page again would not bring it back.
    const body = `<section><script src="/js/chart-extras.js"><\/script></section>
<script>function __stx_setup_athletes() { return {} }
window.stx._latestSetup = __stx_setup_athletes<\/script>`
    const { window, created, setups, requests } = install([{ body }])

    await window.stxRouter.navigate('/coaches/athletes')
    await tick()
    created.find(s => (s.getAttribute?.('src') || '').includes('chart-extras.js')).onerror()
    await tick()

    expect(setups().length).toBe(1)
    expect(requests.length).toBe(1)
  })
})
