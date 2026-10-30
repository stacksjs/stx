/**
 * The router loads the next page's messages, module registry and stores
 * before it runs the page.
 *
 * A page ships the stores it reads and its own language's messages (stx's
 * store-loader.ts and message-catalogs.ts), each as a module bundle of its
 * own (`/_stx/modules.<hash>.js`), so the page navigated to may need files
 * the page navigated from never loaded. Its fragment carries them; the swap
 * waits for each, in the order they run (messages, registry, stores), and a
 * file the document already has is not asked for again.
 *
 * very-happy-dom neither loads nor runs an injected script, so the tests
 * settle each file themselves (onload) and read which scripts the router
 * created, in the order it created them (the order they run: async=false).
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

const MESSAGES = '/_stx/modules.aaaaaaaaaaaaaaaa.js'
const REGISTRY = '/_stx/modules.bbbbbbbbbbbbbbbb.js'
const STORES = '/_stx/modules.cccccccccccccccc.js'
const OTHER_STORES = '/_stx/modules.dddddddddddddddd.js'

function fragment(stores: string): string {
  return `<script data-stx-scoped data-stx-run="always" data-stx-messages src="${MESSAGES}"><\/script>
<script data-stx-scoped data-stx-run="always" data-stx-modules src="${REGISTRY}"><\/script>
<script data-stx-scoped data-stx-run="always" data-stx-stores src="${stores}"><\/script>
<section><p>{{ total }}</p></section>
<script>function __stx_setup_cart() { return {} }
window.stx._latestSetup = __stx_setup_cart<\/script>`
}

function install(bodies: Record<string, string>, loaded: string[] = []) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`
    <html>
      <head>
        <meta name="stx-build" content="b1">
        <meta name="stx-layout" content="layouts/app.stx">
        <meta name="stx-layout-group" content="app">
        ${loaded.map(src => `<script src="${src}"><\/script>`).join('\n')}
      </head>
      <body><main>Home</main></body>
    </html>
  `)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, prefetchVisible: false, progress: false, viewTransitions: false, revalidate: false }

  const created: any[] = []
  const createElement = window.document.createElement.bind(window.document)
  ;(window.document as any).createElement = (tag: string, ...rest: any[]) => {
    const el = (createElement as any)(tag, ...rest)
    if (String(tag).toLowerCase() === 'script')
      created.push(el)
    return el
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async (url: string) => new Response(bodies[new URL(String(url), 'http://localhost/').pathname] ?? '', {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/app.stx',
        'X-STX-Layout-Group': 'app',
        'X-STX-Runtime': 'true',
        'X-STX-Build': 'b1',
      },
    }),
  })

  new Function(getRouterScript())()

  const bundles = () => created.filter(s => (s.getAttribute?.('src') || '').includes('/_stx/modules.'))
  const setups = () => created.filter(s => s.hasAttribute?.('data-stx-page') && String(s.textContent).includes('__stx_setup_cart'))
  return { window: window as Window & { stxRouter: any }, bundles, setups }
}

const tick = (ms = 200) => new Promise(r => setTimeout(r, ms))
const path = (script: any): string => new URL(script.src || script.getAttribute('src'), 'http://localhost/').pathname

describe('router: a page\'s own messages and stores', () => {
  it('loads them, in order, before it runs the page', async () => {
    const { window, bundles, setups } = install({ '/cart': fragment(STORES) })

    await window.stxRouter.navigate('/cart')
    await tick()
    expect(bundles().map(path)).toEqual([MESSAGES, REGISTRY, STORES])
    expect(bundles().every(script => script.async === false)).toBe(true)
    expect(setups().length).toBe(0)

    bundles()[0].onload()
    bundles()[1].onload()
    await tick()
    // Still waiting on the stores.
    expect(setups().length).toBe(0)

    bundles()[2].onload()
    await tick()
    expect(setups().length).toBe(1)
  })

  it('asks only for the files the document does not have yet', async () => {
    // Loaded with the page the visit started on: its messages and registry,
    // but another set of stores.
    const { window, bundles, setups } = install({ '/cart': fragment(OTHER_STORES) }, [MESSAGES, REGISTRY, STORES])

    await window.stxRouter.navigate('/cart')
    await tick()
    expect(bundles().map(path)).toEqual([OTHER_STORES])

    bundles()[0].onload()
    await tick()
    expect(setups().length).toBe(1)
  })
})
