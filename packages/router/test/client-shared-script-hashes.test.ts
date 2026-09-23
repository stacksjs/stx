/**
 * The runtime and router are never loaded a second time on navigation.
 *
 * Serve mode links both by content hash (`/_stx/router.<hash>.js`), so a
 * release reaches browsers and CDNs on the next page load instead of hours
 * later. The catch is what that does to the paths that load every script[src]
 * they have not seen: after a deploy, the incoming page's runtime and router
 * have different URLs from the ones this document loaded, and loading them
 * would run a second router and a second runtime over the live ones — two
 * click handlers on every link, and a fresh `window.stx` under scopes the old
 * one created.
 *
 * With fixed URLs that could not happen, because the incoming src always
 * matched the loaded one. A new version is now picked up by the build-skew
 * reload (client-build-skew.test.ts), never by injecting it into a running
 * page. Ordinary external scripts must keep loading exactly as before.
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

const LOADED = 'aaaaaaaaaaaaaaaa'
const DEPLOYED = 'bbbbbbbbbbbbbbbb'

const runtimeTag = (hash: string) => `<script data-stx-runtime src="/_stx/runtime.${hash}.js"><\/script>`
const routerTag = (hash: string) => `<script data-stx-router src="/_stx/router.${hash}.js"><\/script>`

/** The page as the browser loaded it, before the deploy. */
const PAGE = `
  <html>
    <head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
      ${runtimeTag(LOADED)}
    </head>
    <body><main>Home</main>${routerTag(LOADED)}</body>
  </html>
`

/** A full document from the new release, in the same layout group. */
function deployedDocument(extraHead = '', container = '<h1>Reports</h1>'): string {
  return `<!DOCTYPE html><html>
    <head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
      ${runtimeTag(DEPLOYED)}
      ${extraHead}
    </head>
    <body><main>${container}</main>${routerTag(DEPLOYED)}</body>
  </html>`
}

function installRouter(body: string, fragment: boolean) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(PAGE)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
    prefetch: false,
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
    DOMParser: window.DOMParser,
    fetch: async () => new Response(body, {
      status: 200,
      headers: fragment
        ? {
            'Content-Type': 'text/html',
            'X-STX-Fragment': 'true',
            'X-STX-Layout': 'layouts/app.stx',
            'X-STX-Layout-Group': 'app',
          }
        : { 'Content-Type': 'text/html' },
    }),
  })

  new Function(getRouterScript())()
  return window as Window & { stxRouter: any }
}

async function navigate(window: any, url: string) {
  await window.stxRouter.navigate(url)
  await new Promise(r => setTimeout(r, 200))
}

function scriptSrcs(window: any): string[] {
  return Array.from(window.document.querySelectorAll('script[src]'))
    .map((s: any) => s.getAttribute('src') || '')
}

describe('router — content-hashed runtime and router across a deploy', () => {
  it('does not load the new release\'s runtime or router from a full document', async () => {
    const window = installRouter(deployedDocument(), false)
    await navigate(window, '/reports')

    expect(window.document.querySelector('main')?.textContent).toContain('Reports')
    expect(scriptSrcs(window).filter(src => src.includes(DEPLOYED))).toEqual([])
  })

  it('still loads an ordinary head script the destination adds', async () => {
    // The reconcile the runtime is now excluded from must keep doing its job.
    const window = installRouter(deployedDocument('<script src="/js/charts.js"><\/script>'), false)
    await navigate(window, '/reports')

    expect(scriptSrcs(window).some(src => src.endsWith('/js/charts.js'))).toBe(true)
    expect(scriptSrcs(window).filter(src => src.includes(DEPLOYED))).toEqual([])
  })

  it('does not load a runtime or router tag that sits inside the container', async () => {
    // prepareRoutedBodyScripts queues every script[src] in the container.
    const window = installRouter(
      deployedDocument('', `<h1>Reports</h1>${routerTag(DEPLOYED)}${runtimeTag(DEPLOYED)}<script src="/js/panel.js"><\/script>`),
      false,
    )
    await navigate(window, '/reports')

    expect(scriptSrcs(window).filter(src => src.includes(DEPLOYED))).toEqual([])
    expect(scriptSrcs(window).some(src => src.endsWith('/js/panel.js'))).toBe(true)
  })

  it('does not load them from a fragment either', async () => {
    const window = installRouter(
      `<section>${runtimeTag(DEPLOYED)}${routerTag(DEPLOYED)}<script src="/js/panel.js"><\/script><h1>Reports</h1></section>`,
      true,
    )
    await navigate(window, '/reports')

    expect(window.document.querySelector('main')?.textContent).toContain('Reports')
    expect(scriptSrcs(window).filter(src => src.includes(DEPLOYED))).toEqual([])
    expect(scriptSrcs(window).some(src => src.endsWith('/js/panel.js'))).toBe(true)
  })

  it('keeps the loaded runtime and router in place', async () => {
    const window = installRouter(deployedDocument(), false)
    await navigate(window, '/reports')

    expect(window.document.querySelectorAll('script[data-stx-runtime]').length).toBeLessThanOrEqual(1)
    expect(scriptSrcs(window).filter(src => src.includes(LOADED)).length).toBeGreaterThanOrEqual(1)
  })
})
