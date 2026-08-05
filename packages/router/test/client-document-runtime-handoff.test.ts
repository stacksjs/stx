/**
 * The runtime hand-off covers the full-document swap too (stacksjs/stx#1839).
 *
 * #1809 added it for fragments, and #1827 made the server declare it — but both
 * live inside the fragment branch. The full-document path, taken whenever the
 * layout or layout GROUP changes, had no equivalent check.
 *
 * A document is not a fragment: it genuinely carries the destination's runtime.
 * This path then throws it away. `prepareRoutedBodyScripts` drops every
 * `script[src]` and everything `isSignalsRuntimeScript` matches, on the
 * assumption that the current page already has a runtime and the incoming copy
 * is redundant. When the current page has none, nothing puts one back.
 *
 * The destination's client code then dies on its first line — `defineStore is
 * not defined`, because `defineStore` lives on `window.stx` — so `onMount`
 * never runs, the fetch it would have made never fires, and the page renders
 * quietly inert. Nothing reaches the console the user would see.
 *
 * The reported route was `/compare → /dashboard`, an ordinary in-app navigation
 * pushed onto the document path by a layout-group change.
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

/** The current page: an app-group page with no client script, so no runtime. */
const PAGE = `
  <html>
    <head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
    </head>
    <body><main>Compare</main></body>
  </html>
`

/**
 * A destination in a DIFFERENT layout group, which forces the document path.
 *
 * `<body>` carries no attributes on purpose: very-happy-dom's `attributes`
 * collection yields entries with no `name`, so the router's body-attribute copy
 * throws `setAttribute(undefined)` and every document swap fails in this DOM
 * regardless of what is being tested. Real browsers return proper Attr nodes.
 */
function destination(headExtra: string): string {
  return `<!DOCTYPE html><html>
    <head>
      <meta name="stx-layout" content="layouts/dashboard.stx">
      <meta name="stx-layout-group" content="dashboard">
      ${headExtra}
    </head>
    <body><main data-stx-content>Dashboard</main></body>
  </html>`
}

const INLINE_RUNTIME = `<script data-stx-runtime>'use strict';var cloakStyle=1;<\/script>`
const EXTERNAL_RUNTIME = `<script data-stx-runtime src="/_stx/runtime.js"><\/script>`

/**
 * Assertions are on the hand-off itself — assignments to `location.href` —
 * rather than on a completed swap. The swap is the wrong signal here:
 * very-happy-dom throws inside `setAttribute` while copying body attributes, so
 * a full-document swap cannot run to completion in this DOM whatever the router
 * decides. What is under test is the decision, and that is directly observable.
 *
 * `location.href` is non-configurable in very-happy-dom, so a stub stands in as
 * the global `location` the router resolves — it reads the bare name.
 */
function installRouter(documentHtml: string, withRuntime = false) {
  const window = new Window({ url: 'http://localhost/compare' })
  window.document.write(PAGE)
  if (withRuntime)
    (window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
    prefetch: false,
    progress: false,
    viewTransitions: false,
  }

  const navigations: string[] = []
  let href = 'http://localhost/compare'
  const real = window.location as any
  const locationStub: any = {
    get href() { return href },
    set href(v: string) { navigations.push(v); href = v },
  }
  for (const key of ['pathname', 'search', 'hash', 'origin', 'protocol', 'host', 'hostname', 'port'])
    Object.defineProperty(locationStub, key, { get: () => real[key], configurable: true })
  locationStub.assign = (v: string) => { locationStub.href = v }
  locationStub.replace = (v: string) => { locationStub.href = v }
  locationStub.toString = () => href

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: locationStub,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    // No X-STX-Fragment: the server returns a full document for this route.
    fetch: async () => new Response(documentHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }),
  })

  new Function(getRouterScript())()
  return { window: window as Window & { stxRouter: any }, navigations }
}

/** Navigate and report the full page loads the router fell back to. */
async function navigateAndSettle(installed: { window: any, navigations: string[] }, url: string) {
  await installed.window.stxRouter.navigate(url)
  await new Promise(resolve => setTimeout(resolve, 200))
  return installed.navigations
}

describe('full-document swap into a page with no runtime', () => {
  it('hands off when the destination ships an inline runtime', async () => {
    const installed = installRouter(destination(INLINE_RUNTIME))

    expect(await navigateAndSettle(installed, '/dashboard')).toEqual(['/dashboard'])
  })

  it('hands off when the runtime is the serve-mode external script', async () => {
    // Dropped even earlier than the inline copy — prepareRoutedBodyScripts
    // removes every script[src] before it looks at anything else.
    const installed = installRouter(destination(EXTERNAL_RUNTIME))

    expect(await navigateAndSettle(installed, '/dashboard')).toEqual(['/dashboard'])
  })

  it('does not swap the destination in dead', async () => {
    // The user-visible failure. Without the hand-off the swap proceeds and the
    // page renders — with its runtime stripped, so every client script on it is
    // inert and nothing says so.
    const installed = installRouter(destination(INLINE_RUNTIME))
    await navigateAndSettle(installed, '/dashboard')

    expect(installed.window.document.body.innerHTML).not.toContain('Dashboard')
  })

  it('recognises a runtime from a server too old to stamp the attribute', async () => {
    const legacy = `<script>'use strict';var cloakStyle=document.getElementById('x');<\/script>`
    const installed = installRouter(destination(legacy))

    expect(await navigateAndSettle(installed, '/dashboard')).toEqual(['/dashboard'])
  })
})

describe('what must keep working', () => {
  it('does not hand off when this page already has the runtime', async () => {
    // The hand-off exists to get a runtime into a page that lacks one. This
    // page has it, so the incoming copy really is redundant and the swap should
    // proceed.
    const installed = installRouter(destination(INLINE_RUNTIME), true)

    expect(await navigateAndSettle(installed, '/dashboard')).toEqual([])
  })

  it('does not hand off a runtime-free document into a runtime-free page', async () => {
    // Content sites are the population with no runtime AND the one #1809
    // exists to keep on the SPA path. A destination that needs nothing must
    // still swap, or every navigation through a docs site is a full reload.
    const installed = installRouter(destination(''))

    expect(await navigateAndSettle(installed, '/about')).toEqual([])
  })
})
