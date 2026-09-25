/**
 * Regression tests for the ORDER of generated utility stylesheets across SPA
 * navigations.
 *
 * Every page ships its own `<link data-css="generated">`, and the router never
 * removes them, so they accumulate in <head>. Two sheets can define the same
 * class at equal specificity, so the later one wins. The router used to only
 * dedupe: after A → B → A, B's sheet still sat after A's, and B's `.flex-col`
 * beat A's responsive `sm:flex-row` — A's header rendered as a column on
 * desktop (seen on wildloop.org, Records → Feed → Records). The current page's
 * sheet must always be the last generated one.
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

const CSS_A = '/_stx/css.aaaaaaaaaaaaaaaa.css'
const CSS_B = '/_stx/css.bbbbbbbbbbbbbbbb.css'

function installRouter(html: string, fetchImpl: typeof fetch, config: Record<string, unknown> = {}) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(html)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: true,
    progress: false,
    viewTransitions: false,
    // The test DOM never fires <link> load events, so keep the cap short.
    cssLoadTimeout: 20,
    ...config,
  }

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

function response(html: string, headers: Record<string, string> = {}) {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      ...headers,
    },
  })
}

function fragment(css: string, body: string) {
  return response(`
    <link data-css="generated" rel="stylesheet" href="${css}">
    <section>${body}</section>
  `, {
    'X-STX-Fragment': 'true',
    'X-STX-Layout': 'layouts/app',
    'X-STX-Layout-Group': 'app',
  })
}

function generatedHrefs(window: Window) {
  return [...window.document.querySelectorAll('head link[data-css]')].map(l => l.getAttribute('href'))
}

function lastHeadElement(window: Window) {
  const children = window.document.head.children
  return children[children.length - 1]
}

async function waitForRouterSwap() {
  await new Promise(resolve => setTimeout(resolve, 180))
}

const SHELL = `
  <html>
    <head>
      <meta name="stx-layout" content="layouts/app">
      <meta name="stx-layout-group" content="app">
      <link rel="stylesheet" href="/app.css">
    </head>
    <body><main>Home</main></body>
  </html>
`

describe('router generated stylesheet order', () => {
  it('moves the current page\'s sheet last on fragment swaps (A → B → A)', async () => {
    const window = installRouter(SHELL, async (url) => {
      return String(url).startsWith('/b') ? fragment(CSS_B, 'Feed') : fragment(CSS_A, 'Records')
    })

    await window.stxRouter.navigate('/a')
    await waitForRouterSwap()
    expect(generatedHrefs(window)).toEqual([CSS_A])

    await window.stxRouter.navigate('/b')
    await waitForRouterSwap()
    expect(generatedHrefs(window)).toEqual([CSS_A, CSS_B])

    // Back to A — served from the router cache, which is the same swap path.
    await window.stxRouter.navigate('/a')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Records')
    // A is last and there is still exactly one of each.
    expect(generatedHrefs(window)).toEqual([CSS_B, CSS_A])
    // Only generated sheets move; the app stylesheet stays where it was.
    expect(window.document.querySelector('head link[href="/app.css"]')).not.toBeNull()
    const a = window.document.querySelector(`head link[href="${CSS_A}"]`)
    expect(a?.hasAttribute('media')).toBeFalse()
    expect(a?.hasAttribute('data-stx-css-pending')).toBeFalse()
  })

  it('moves an SSR-rendered sheet last when returning to its page', async () => {
    const window = installRouter(SHELL.replace('</head>', `<link data-css="generated" rel="stylesheet" href="${CSS_A}"></head>`), async (url) => {
      return String(url).startsWith('/b') ? fragment(CSS_B, 'Feed') : fragment(CSS_A, 'Records')
    })

    await window.stxRouter.navigate('/b')
    await waitForRouterSwap()
    expect(generatedHrefs(window)).toEqual([CSS_A, CSS_B])

    await window.stxRouter.navigate('/a')
    await waitForRouterSwap()
    expect(generatedHrefs(window)).toEqual([CSS_B, CSS_A])
  })

  it('moves the current page\'s sheet last on full-document swaps (A → B → A)', async () => {
    const page = (css: string, body: string) => response(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/app">
          <meta name="stx-layout-group" content="app">
          <link rel="stylesheet" href="/app.css">
          <link data-css="generated" rel="stylesheet" href="${css}">
        </head>
        <body><div data-shell><main>${body}</main></div></body>
      </html>
    `)
    const window = installRouter(`
      <html>
        <head>
          <meta name="stx-layout" content="layouts/app">
          <meta name="stx-layout-group" content="app">
          <link rel="stylesheet" href="/app.css">
        </head>
        <body><div data-shell><main>Home</main></div></body>
      </html>
    `, async (url) => {
      return String(url).startsWith('/b') ? page(CSS_B, 'Feed') : page(CSS_A, 'Records')
    }, { container: '[data-shell]', cache: false })

    await window.stxRouter.navigate('/a')
    await waitForRouterSwap()
    await window.stxRouter.navigate('/b')
    await waitForRouterSwap()
    await window.stxRouter.navigate('/a')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Records')
    expect(generatedHrefs(window)).toEqual([CSS_B, CSS_A])
    expect(lastHeadElement(window)?.getAttribute('href')).toBe(CSS_A)
    expect(window.document.querySelectorAll('head link[href="/app.css"]')).toHaveLength(1)
  })

  it('waits for a new sheet to load before swapping the content', async () => {
    const window = installRouter(SHELL, async () => fragment(CSS_B, 'Feed'), { cssLoadTimeout: 5000 })

    let settled = false
    const nav = window.stxRouter.navigate('/b').then(() => { settled = true })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Downloading, but inert: it must not restyle the page still on screen.
    const pending = window.document.querySelector(`head link[href="${CSS_B}"]`) as any
    expect(pending?.getAttribute('media')).toBe('print')
    expect(window.document.querySelector('main')?.textContent).toBe('Home')
    expect(settled).toBeFalse()

    pending.onload()
    await nav
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Feed')
    expect(pending.hasAttribute('media')).toBeFalse()
    expect(generatedHrefs(window)).toEqual([CSS_B])
  })

  it('does not hold navigation hostage to a sheet that never loads', async () => {
    const window = installRouter(SHELL, async () => fragment(CSS_B, 'Feed'), { cssLoadTimeout: 30 })

    await window.stxRouter.navigate('/b')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Feed')
    expect(window.document.querySelector(`head link[href="${CSS_B}"]`)?.hasAttribute('media')).toBeFalse()
  })

  it('loads the page in full instead of swapping in markup whose sheet failed', async () => {
    // Seen on wildloop.org: the server answered 520 for the profile page's
    // sheet, the router swapped anyway, and the profile rendered with only
    // the utilities the previous page happened to share.
    const window = installRouter(SHELL, async () => fragment(CSS_B, 'Feed'), { cssLoadTimeout: 5000 })

    const nav = window.stxRouter.navigate('/b')
    await new Promise(resolve => setTimeout(resolve, 50))

    const pending = window.document.querySelector(`head link[href="${CSS_B}"]`) as any
    expect(pending).not.toBeNull()
    pending.onerror()
    await nav
    await waitForRouterSwap()

    // The unstyled markup never replaced the page on screen, the dead link is
    // gone so the reload fetches it again, and the browser was sent there.
    expect(window.document.querySelector('main')?.textContent).toBe('Home')
    expect(window.document.querySelector(`head link[href="${CSS_B}"]`)).toBeNull()
    expect(String(window.location.href)).toEndWith('/b')
  })
})
