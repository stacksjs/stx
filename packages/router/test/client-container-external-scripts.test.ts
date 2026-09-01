/**
 * An external script inside the routed container survives navigation.
 *
 * A page whose x-data factory lives in its own file — a
 * `<script src="dashboard-xdata.js">` sitting inside `[data-stx-content]` —
 * lost that file on every SPA navigation. Both swap paths dropped it: the
 * fragment path's regex sees an empty body and returns `''`, and
 * `prepareRoutedBodyScripts` removed it outright. The inline scripts beside it
 * were re-executed with care; the external ones were deleted.
 *
 * What that looked like: a screen that renders on a cold load and comes back
 * empty after a click, with `dashboardXData is not defined` in the console and
 * every binding in the container left unevaluated — because nothing had defined
 * it since the file was thrown away. Reported as "33 expressions never
 * evaluated" on a page nobody had touched.
 *
 * It hid behind a cold load working perfectly, and behind prerendered bundles
 * that ship no link interceptor at all, where the same markup is served and the
 * router never runs.
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

const PAGE = `
  <html>
    <head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
    </head>
    <body><main>Home</main></body>
  </html>
`

/** Same layout group on both sides, so navigation takes the fragment path. */
function installRouter(fragmentHtml: string, page: string = PAGE) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(page)
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
    fetch: async () => new Response(fragmentHtml, {
      status: 200,
      headers: {
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

async function navigate(window: any, url: string) {
  await window.stxRouter.navigate(url)
  await new Promise(r => setTimeout(r, 200))
}

/** The scripts the router appended for the incoming page. */
function injectedSrcs(window: any): string[] {
  return Array.from(window.document.querySelectorAll('script[src]'))
    .map((s: any) => s.getAttribute('src') || '')
}

describe('router — external scripts inside the routed container', () => {
  it('loads the file the incoming container asks for', async () => {
    const window = installRouter(
      `<section><script src="/js/dashboard-xdata.js"><\/script><div data-stx-xdata="dashboardXData()"></div></section>`,
    )
    await navigate(window, '/dashboard')

    // Before this fix the fragment regex returned '' for it and nothing ever
    // requested the file, so the factory the container binds to never existed.
    expect(injectedSrcs(window).some(s => s.includes('dashboard-xdata.js'))).toBe(true)
  })

  it('resolves a relative src against the page being navigated to', async () => {
    // Not against the current URL. Navigating from / to /reports/disk, a bare
    // "panel.js" belongs to /reports/, and resolving it at the origin root
    // requests a file that is not there.
    const window = installRouter(
      `<section><script src="panel.js"><\/script></section>`,
    )
    await navigate(window, '/reports/disk')

    const src = injectedSrcs(window).find(s => s.includes('panel.js')) || ''
    expect(src).toContain('/reports/panel.js')
  })

  it('does not load the same file twice across navigations', async () => {
    // The file defines a global that outlives the navigation, so a second
    // execution buys nothing and costs whatever side effects it has — a mount
    // helper firing again on every click through the same page is its own bug.
    const window = installRouter(
      `<section><script src="/js/shared-panel.js"><\/script></section>`,
    )
    await navigate(window, '/one')
    await navigate(window, '/two')

    const loads = injectedSrcs(window).filter(s => s.includes('shared-panel.js'))
    expect(loads.length).toBe(1)
  })

  it('does not reload a file the initial page already had', async () => {
    // The seeding pass records every src on the document at startup, so
    // arriving at a page that references one already loaded is a no-op rather
    // than a second execution.
    const withScript = PAGE.replace(
      '<body>',
      '<body><script src="/js/already-here.js"><\/script>',
    )
    const window = installRouter(
      `<section><script src="/js/already-here.js"><\/script></section>`,
      withScript,
    )
    await navigate(window, '/dashboard')

    const loads = injectedSrcs(window).filter(s => s.includes('already-here.js'))
    expect(loads.length).toBe(1)
  })

  it('still swaps the container content around the script', async () => {
    // The script is pulled out of the markup; everything else must land.
    const window = installRouter(
      `<section><script src="/js/x.js"><\/script><h1>Reports</h1></section>`,
    )
    await navigate(window, '/reports')

    expect(window.document.querySelector('main')?.textContent).toContain('Reports')
  })
})
