/**
 * A <style> inside a script belongs to the script.
 *
 * `doFragSwap` collects a fragment's page styles with a regex over the raw
 * HTML, and the scripts were still in that HTML (as pending placeholders) when
 * it ran. So a web component whose shadow-DOM CSS is a string in its bundle
 * (ts-video-player's controls: `:host {…} button { width: 40px; height: 40px }`)
 * had that CSS lifted into <head> as a page style on every client navigation:
 * every button in the document shrank to 40px, and the component's own copy
 * was cut out of its code. A full page load parses it correctly, so only pages
 * reached by navigation broke — in a native shell, that is all of them.
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
function installRouter(fragmentHtml: string) {
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

const COMPONENT = 'customElements.define("x-player", class extends HTMLElement { connectedCallback() { this.attachShadow({ mode: "open" }).innerHTML = `<style>:host { display: flex } button { width: 40px; height: 40px }</style><button>Play</button>` } })'

describe('router — styles inside scripts in a swapped fragment', () => {
  it('does not lift a script\'s CSS into the document', async () => {
    const window = installRouter(`<section><script data-stx-run="always">${COMPONENT}<\/script><button>Save</button></section>`)
    await navigate(window, '/player')

    const pageStyles = Array.from(window.document.querySelectorAll('style[data-stx-page]')).map((s: any) => s.textContent || '')
    expect(pageStyles.some(css => css.includes(':host') || css.includes('40px'))).toBe(false)
  })

  it('leaves the CSS in the script, where the component needs it', async () => {
    const window = installRouter(`<section><script data-stx-run="always">${COMPONENT}<\/script></section>`)
    await navigate(window, '/player')

    const scripts = Array.from(window.document.querySelectorAll('script[data-stx-page]')).map((s: any) => s.textContent || '')
    expect(scripts.some(code => code.includes('button { width: 40px; height: 40px }'))).toBe(true)
  })

  it('still carries the fragment\'s own page styles over', async () => {
    const window = installRouter(`<section><style>.page-only { color: red }</style><script data-stx-run="always">${COMPONENT}<\/script><p class="page-only">Hi</p></section>`)
    await navigate(window, '/player')

    const pageStyles = Array.from(window.document.querySelectorAll('style[data-stx-page]')).map((s: any) => s.textContent || '')
    expect(pageStyles).toEqual(['.page-only { color: red }'])
  })
})
