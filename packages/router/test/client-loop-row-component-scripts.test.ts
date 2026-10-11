/**
 * A component's setup script inside a client loop row is left for the runtime.
 *
 * `<tr :for> > <td> > component root + scoped setup` is the loop's source, not
 * an instance: bindFor clones it per row and runs the setup once per clone. The
 * router recognised that only when the component root was the :for element
 * itself, so it ran this shape in place and replaced the script with a copy
 * that no longer carried data-stx-scoped. Every row cloned afterwards had no
 * setup to run and the component never hydrated on a routed visit.
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

function installRouter(fetchImpl: typeof fetch) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`
    <html>
      <head>
        <meta name="stx-layout" content="layouts/app">
        <meta name="stx-layout-group" content="app">
      </head>
      <body><main>Home</main></body>
    </html>
  `)
  ;(window as any).stx = { _scopes: {} }
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false }
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
  return window as Window & { stxRouter: any }
}

const ROW = `
  <table><tbody>
    <tr :for="a in athletes()" :key="a.id">
      <td>
        <div data-stx-scope="stx_avatar_8" :src="a.avatar_url"><img :if="showImage" :src="avatarSrc"></div>
        <script data-stx-scoped data-stx-run="always" data-stx-owner="stx_avatar_8">window.__avatarSetups = (window.__avatarSetups || 0) + 1; window.stx._scopes['stx_avatar_8'] = {}</script>
      </td>
    </tr>
  </tbody></table>
  <div data-stx-scope="stx_badge_1"></div>
  <script data-stx-scoped data-stx-run="always" data-stx-owner="stx_badge_1">window.__badgeSetups = (window.__badgeSetups || 0) + 1</script>
`

function expectRowSetupLeftForTheRuntime(window: any) {
  const setup = window.document.querySelector('main td > script[data-stx-scoped]')
  expect(setup?.getAttribute('type')).toBe('application/stx-pending')
  expect(setup?.textContent).toContain(`window.stx._scopes['stx_avatar_8']`)
  expect(setup?.previousElementSibling?.getAttribute('data-stx-scope')).toBe('stx_avatar_8')
  const executed = [...window.document.querySelectorAll('script[data-stx-page]')]
  expect(executed.some((script: any) => script.textContent?.includes('__avatarSetups'))).toBeFalse()
  // A component outside any loop still runs where it stands.
  const badge = executed.find((script: any) => script.textContent?.includes('__badgeSetups'))
  expect(badge?.previousElementSibling?.getAttribute('data-stx-scope')).toBe('stx_badge_1')
}

describe('router: component setup inside a loop row', () => {
  it('leaves it pending with its code on a fragment swap', async () => {
    const window = installRouter(async () => new Response(ROW, {
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/app',
        'X-STX-Layout-Group': 'app',
      },
    }))

    await window.stxRouter.navigate('/coaches/athletes')
    await new Promise(resolve => setTimeout(resolve, 180))

    expect(window.location.pathname).toBe('/coaches/athletes')
    expectRowSetupLeftForTheRuntime(window)
  })

  it('leaves it pending with its code on a full-document swap', async () => {
    const window = installRouter(async () => new Response(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/coach">
          <meta name="stx-layout-group" content="coach">
        </head>
        <body><main>${ROW}</main></body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } }))

    await window.stxRouter.navigate('/coaches/athletes')
    await new Promise(resolve => setTimeout(resolve, 180))

    expect(window.location.pathname).toBe('/coaches/athletes')
    expectRowSetupLeftForTheRuntime(window)
  })
})
