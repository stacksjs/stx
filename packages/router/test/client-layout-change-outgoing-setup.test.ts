/**
 * A layout-changing navigation hands stx:load nothing of the page it left.
 *
 * stx:load binds with window.stx._latestSetup, falling back to the setup named
 * by body[data-stx]. A destination without a setup function of its own replaced
 * neither: the full-body swap only ADDED the incoming body's attributes, and
 * nothing cleared _latestSetup (fragments get that clear from the server). The
 * outgoing page's setup and onMount then ran again on the new page.
 *
 * The incoming <body> is bare: very-happy-dom's attribute entries have no
 * name, so copying them would throw and turn the swap into a full load. The
 * real-browser version is packages/stx/test/router/layout-change-outgoing-setup.
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

describe('router: layout-changing navigation', () => {
  it('drops the outgoing page setup when the destination has none', async () => {
    const window = new Window({ url: 'http://localhost/coaches/calendar' })
    window.document.write(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/coach">
          <meta name="stx-layout-group" content="coach">
        </head>
        <body data-stx="__stx_setup_calendar" class="coach"><nav>Coach</nav><main>Calendar</main></body>
      </html>
    `)
    const calendarSetup = function __stx_setup_calendar() { return {} }
    ;(window as any).__stx_setup_calendar = calendarSetup
    ;(window as any).stx = { _scopes: {}, _latestSetup: calendarSetup }
    ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false }
    Object.assign(globalThis, {
      window,
      document: window.document,
      location: window.location,
      history: window.history,
      fetch: async () => new Response(`
        <html>
          <head>
            <meta name="stx-layout" content="layouts/app">
            <meta name="stx-layout-group" content="app">
            <script data-stx-runtime>window.stx = window.stx || {}</script>
          </head>
          <body><nav>App</nav><main><p id="relax">Breathe</p></main></body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } }),
      CustomEvent: window.CustomEvent,
      Event: window.Event,
      DOMParser: window.DOMParser,
    })
    new Function(getRouterScript())()

    let latestAtLoad: unknown = 'not loaded'
    window.addEventListener('stx:load', () => {
      latestAtLoad = (window as any).stx._latestSetup
    })
    await (window as any).stxRouter.navigate('/relax')
    await new Promise(resolve => setTimeout(resolve, 180))

    expect(window.document.querySelector('#relax')?.textContent).toBe('Breathe')
    expect(window.document.body.hasAttribute('data-stx')).toBeFalse()
    expect(latestAtLoad).toBeNull()
  })
})
