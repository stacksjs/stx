/**
 * Regression tests for the destination page's own stylesheets on a fragment
 * navigation.
 *
 * A fragment is the routed container's inner content, so the
 * `<link rel="stylesheet">` tags a page declares in its `<head>` never came
 * with it. Clicking from a page that links `home.css` to one that links
 * `format.css` left only `home.css` in the document: the destination rendered
 * with the previous page's CSS and none of its own, while a full load of the
 * same URL was fine. The server now lists those links in a
 * `<template data-stx-page-css="1">` behind the metadata template, and the
 * router adds the ones the document lacks.
 *
 * They are assets, not metadata, so the metadata contract (#2121) is
 * unchanged: `applyPageHead` still reconciles only the tags it owns.
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

const HOME_CSS = '/assets/styles/production/home.css'
const FORMAT_CSS = '/assets/styles/production/format.css'
const GENERATED_CSS = '/_stx/css.bbbbbbbbbbbbbbbb.css'

function installRouter(html: string, fetchImpl: typeof fetch, config: Record<string, unknown> = {}, url = 'http://localhost/') {
  const window = new Window({ url })
  window.document.write(html)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: true,
    progress: false,
    viewTransitions: false,
    screens: false,
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

const FRAGMENT_HEADERS = {
  'Content-Type': 'text/html',
  'X-STX-Fragment': 'true',
  'X-STX-Runtime': 'false',
  'X-STX-Layout': 'layouts/app',
  'X-STX-Layout-Group': 'app',
}

/** A fragment as the server sends it: metadata, then the page's stylesheet list, then the content. */
function fragment(links: string, body: string, metadata = '') {
  const css = links ? `<template data-stx-page-css="1">${links}</template>\n` : ''
  return new Response(`<template data-stx-page-head="1">${metadata}</template>\n${css}<section>${body}</section>`, {
    status: 200,
    headers: FRAGMENT_HEADERS,
  })
}

function sheet(href: string, attributes = '') {
  return `<link rel="stylesheet" href="${href}"${attributes}>`
}

/** Every non-generated stylesheet in <head>, as the absolute URL it names. */
function pageSheets(window: Window) {
  return [...window.document.querySelectorAll('head link[rel="stylesheet"]')]
    .filter(link => !link.hasAttribute('data-css'))
    .map(link => new URL(link.getAttribute('href')!, window.location.href).pathname)
}

function linkFor(window: Window, pathname: string): any {
  return [...window.document.querySelectorAll('head link[rel="stylesheet"]')]
    .find(link => new URL(link.getAttribute('href')!, window.location.href).pathname === pathname)
}

async function waitForRouterSwap() {
  await new Promise(resolve => setTimeout(resolve, 180))
}

const SHELL = `
  <html>
    <head>
      <title>Home</title>
      <meta name="stx-layout" content="layouts/app">
      <meta name="stx-layout-group" content="app">
      <meta name="description" content="Home">
      <link rel="stylesheet" href="/app.css">
      <link rel="stylesheet" href="${HOME_CSS}">
    </head>
    <body><main>Home</main></body>
  </html>
`

describe('page stylesheets on a fragment navigation', () => {
  it('adds a stylesheet the destination links and the document lacks, once', async () => {
    const window = installRouter(SHELL, async () => fragment(sheet('/app.css') + sheet(FORMAT_CSS), 'Format'))

    await window.stxRouter.navigate('/format')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Format')
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS, FORMAT_CSS])
    // Live, not left as the unapplied copy the preload adds.
    const added = linkFor(window, FORMAT_CSS)
    expect(added.hasAttribute('media')).toBeFalse()
    expect(added.hasAttribute('data-stx-css-pending')).toBeFalse()
    // The list is read, never written into the page.
    expect(window.document.querySelector('template[data-stx-page-css]')).toBeNull()
    expect(window.document.querySelector('main link')).toBeNull()
  })

  it('never duplicates a stylesheet the document already has, and never removes one', async () => {
    const window = installRouter(SHELL, async (url) => {
      return String(url).startsWith('/format')
        ? fragment(sheet('/app.css') + sheet(FORMAT_CSS), 'Format')
        : fragment(sheet('/app.css') + sheet(HOME_CSS), 'Home again')
    }, { cache: false })
    const original = [...window.document.querySelectorAll('head link[rel="stylesheet"]')]

    await window.stxRouter.navigate('/format')
    await waitForRouterSwap()
    await window.stxRouter.navigate('/home')
    await waitForRouterSwap()
    await window.stxRouter.navigate('/format')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Format')
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS, FORMAT_CSS])
    // The sheets the document started with are the same nodes, untouched.
    expect(original.every(link => link.isConnected && !link.hasAttribute('media'))).toBeTrue()
  })

  it('dedupes an absolute URL against the same sheet written as a path', async () => {
    const window = installRouter(SHELL, async () => fragment(sheet(`http://localhost${HOME_CSS}`), 'Same sheet'))

    await window.stxRouter.navigate('/again')
    await waitForRouterSwap()

    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS])
  })

  it('resolves a relative href against the destination, not the page on screen (#1777)', async () => {
    const window = installRouter(SHELL, async () => fragment(sheet('assets/intro.css') + sheet('../shared.css'), 'Intro'), {}, 'http://localhost/blog/post')

    await window.stxRouter.navigate('/docs/guide/intro')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Intro')
    // /docs/guide/assets/intro.css, not /blog/assets/intro.css: stored
    // absolute so it still names that file from wherever the app goes next.
    expect(linkFor(window, '/docs/guide/assets/intro.css')?.getAttribute('href')).toBe('http://localhost/docs/guide/assets/intro.css')
    expect(linkFor(window, '/docs/shared.css')?.getAttribute('href')).toBe('http://localhost/docs/shared.css')
    expect(linkFor(window, '/blog/assets/intro.css')).toBeUndefined()
  })

  it('leaves generated data-css sheets to their own mechanism', async () => {
    const generated = `<link data-css="generated" rel="stylesheet" href="${GENERATED_CSS}">`
    const window = installRouter(SHELL, async () => new Response(
      // A generated link in the list is ignored; the one in the fragment body
      // is what promoteGeneratedCss handles, exactly as before.
      `<template data-stx-page-head="1"></template>\n<template data-stx-page-css="1">${generated}${sheet(FORMAT_CSS)}</template>\n${generated}<section>Format</section>`,
      { status: 200, headers: FRAGMENT_HEADERS },
    ))

    await window.stxRouter.navigate('/format')
    await waitForRouterSwap()

    const all = [...window.document.querySelectorAll('head link[rel="stylesheet"]')]
    const generatedLinks = all.filter(link => link.hasAttribute('data-css'))
    expect(generatedLinks).toHaveLength(1)
    expect(generatedLinks[0].getAttribute('href')).toBe(GENERATED_CSS)
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS, FORMAT_CSS])
    // The page's own sheet never takes the generated marker, and the
    // destination's generated sheet still ends last in the cascade.
    expect(linkFor(window, FORMAT_CSS).hasAttribute('data-css')).toBeFalse()
    expect(all[all.length - 1]).toBe(generatedLinks[0])
  })

  it('reads only stylesheet links out of the list, with the attributes that decide how one loads', async () => {
    const window = installRouter(SHELL, async () => fragment(
      `<link rel="preload" as="style" href="/preloaded.css"><link rel="icon" href="/icon.png"><meta name="csrf-token" content="wrong"><script>window.__listRan=1</script>`
      + sheet('https://fonts.example/css?family=Inter&amp;display=swap', ' media="(min-width: 600px)" crossorigin="anonymous" integrity="sha384-abc" onload="window.__listRan=1" id="injected"'),
      'Format',
    ))

    await window.stxRouter.navigate('/format')
    await waitForRouterSwap()

    const added = [...window.document.querySelectorAll('head link[rel="stylesheet"]')].find(link => link.getAttribute('href')?.includes('fonts.example'))!
    expect(added.getAttribute('href')).toBe('https://fonts.example/css?family=Inter&display=swap')
    expect(added.getAttribute('media')).toBe('(min-width: 600px)')
    expect(added.getAttribute('crossorigin')).toBe('anonymous')
    expect(added.getAttribute('integrity')).toBe('sha384-abc')
    expect(added.hasAttribute('onload')).toBeFalse()
    expect(added.hasAttribute('id')).toBeFalse()
    expect(window.document.querySelector('head link[rel="preload"],head link[rel="icon"]')).toBeNull()
    expect(window.document.querySelector('meta[name="csrf-token"]')).toBeNull()
    expect((window as any).__listRan).toBeUndefined()
  })

  it('still reconciles page metadata, and only metadata (#2121)', async () => {
    const window = installRouter(
      SHELL.replace('</head>', '<meta name="theme-color" content="red"><link rel="canonical" href="/"></head>'),
      async () => fragment(sheet(FORMAT_CSS), 'Format', '<title>Format</title><meta name="description" content="Format"><link rel="canonical" href="/format">'),
    )

    await window.stxRouter.navigate('/format')
    await waitForRouterSwap()

    expect(window.document.title).toBe('Format')
    expect(window.document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Format')
    expect(window.document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(window.document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('/format')
    expect(window.document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('red')
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS, FORMAT_CSS])
  })

  it('leaves the document alone for a fragment that lists no stylesheets', async () => {
    const window = installRouter(SHELL, async () => fragment('', 'Plain'))

    await window.stxRouter.navigate('/plain')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Plain')
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS])
  })

  it('waits for a new sheet before swapping, and applies it under its declared media', async () => {
    const window = installRouter(SHELL, async () => fragment(sheet(FORMAT_CSS, ' media="screen"'), 'Format'), { cssLoadTimeout: 5000 })

    let settled = false
    const nav = window.stxRouter.navigate('/format').then(() => { settled = true })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Downloading, but inert: it must not restyle the page still on screen.
    const pending = linkFor(window, FORMAT_CSS)
    expect(pending?.getAttribute('media')).toBe('print')
    expect(window.document.querySelector('main')?.textContent).toBe('Home')
    expect(settled).toBeFalse()

    pending.onload()
    await nav
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Format')
    expect(pending.getAttribute('media')).toBe('screen')
    expect(pending.hasAttribute('data-stx-css-pending')).toBeFalse()
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS, FORMAT_CSS])
  })

  it('loads the page in full instead of swapping in markup whose own sheet failed', async () => {
    const window = installRouter(SHELL, async () => fragment(sheet(FORMAT_CSS), 'Format'), { cssLoadTimeout: 5000 })

    const nav = window.stxRouter.navigate('/format')
    await new Promise(resolve => setTimeout(resolve, 50))
    linkFor(window, FORMAT_CSS).onerror()
    await nav
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toBe('Home')
    expect(linkFor(window, FORMAT_CSS)).toBeUndefined()
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS])
    expect(String(window.location.href)).toEndWith('/format')
  })

  it('treats a prefetched fragment the same: preloaded unapplied on hover, live once after the swap', async () => {
    const requested: string[] = []
    const window = installRouter(
      SHELL.replace('<main>Home</main>', '<main>Home<a id="go" data-stx-link href="/docs/format">Format</a></main>'),
      async (url) => { requested.push(String(url)); return fragment(sheet('format.css'), 'Format') },
      { keepOpening: false, cssLoadTimeout: 5000 },
    )

    window.document.getElementById('go')!.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 150))

    // Fetched beside the page, resolved against the page that links it, and
    // unable to restyle the one still on screen.
    const warmed = linkFor(window, '/docs/format.css')
    expect(window.document.querySelector('main')?.textContent).toContain('Home')
    expect(warmed?.getAttribute('media')).toBe('print')

    const nav = window.stxRouter.navigate('/docs/format')
    await new Promise(resolve => setTimeout(resolve, 20))
    warmed.onload()
    await nav
    await waitForRouterSwap()

    // Served from the prefetch cache: the page was fetched once.
    expect(requested).toEqual(['/docs/format'])
    expect(window.document.querySelector('main')?.textContent).toContain('Format')
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS, '/docs/format.css'])
    expect(linkFor(window, '/docs/format.css')).toBe(warmed)
    expect(warmed.hasAttribute('media')).toBeFalse()
    expect(window.document.querySelector('template[data-stx-page-css]')).toBeNull()
  })

  it('makes a sheet a fragment navigation left unapplied live on a full-document swap', async () => {
    const page = (html: string) => new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
    const window = installRouter(SHELL, async (url) => {
      if (String(url).startsWith('/slow')) return fragment(sheet(FORMAT_CSS), 'Slow')
      return page(`<html><head><meta name="stx-layout" content="layouts/app"><meta name="stx-layout-group" content="app">
        <link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="${FORMAT_CSS}"></head><body><main>Document</main></body></html>`)
    }, { cssLoadTimeout: 5000, cache: false })

    // Starts preloading format.css, then is superseded before it swaps.
    window.stxRouter.navigate('/slow')
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(linkFor(window, FORMAT_CSS)?.getAttribute('media')).toBe('print')

    await window.stxRouter.navigate('/document')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Document')
    expect(pageSheets(window).filter(path => path === FORMAT_CSS)).toHaveLength(1)
    expect(linkFor(window, FORMAT_CSS).hasAttribute('media')).toBeFalse()
    expect(linkFor(window, FORMAT_CSS).hasAttribute('data-stx-css-pending')).toBeFalse()
  })

  it('leaves the head alone for an older server that sends no list', async () => {
    const window = installRouter(SHELL, async () => new Response('<template data-stx-page-head="1"></template>\n<section>Old server</section>', { status: 200, headers: FRAGMENT_HEADERS }))

    await window.stxRouter.navigate('/legacy')
    await waitForRouterSwap()

    expect(window.document.querySelector('main')?.textContent).toContain('Old server')
    expect(pageSheets(window)).toEqual(['/app.css', HOME_CSS])
  })
})
