/**
 * The router reconciles `<html>` attributes across an SPA layout change
 * (stacksjs/stx#1798).
 *
 * A layout that scopes its design tokens to the root element — `html.marketing
 * { --bg: … }` — needs that class to LEAVE when navigation lands on a layout
 * that defines the same custom properties differently. Head stylesheets are
 * deliberately additive across a swap (see the <link> reconcile), so both token
 * sheets are live simultaneously and the root class is the only thing telling
 * them apart. Without this, the destination page paints with the entry page's
 * palette.
 *
 * The reconcile is driven by the markers the document shell emits, NOT by
 * diffing the element: the live root also carries a `dark` class from the
 * pre-paint color-mode boot and `data-reduced-motion` from the animation
 * runtime, neither of which appears in any server response. A blind diff would
 * strip them on every navigation.
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

function installRouter(html: string, fetchImpl: typeof fetch) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(html)
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
    fetch: fetchImpl,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
  })

  new Function(getRouterScript())()

  return window as Window & { stxRouter: any }
}

function fullPage(html: string) {
  return async () => new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
}

const MARKETING = `
  <html lang="en" class="marketing dark" data-stx-html-class="marketing" data-theme="sunset" data-stx-html-attrs="data-theme">
    <head>
      <meta name="stx-layout" content="layouts/marketing.stx">
      <meta name="stx-layout-group" content="app">
    </head>
    <body><main>Landing</main></body>
  </html>
`

const APP_PAGE = `
  <html lang="en">
    <head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
    </head>
    <body><main>Dashboard</main></body>
  </html>
`

describe('router — <html> attribute reconcile', () => {
  it('removes the class the previous layout scoped its tokens to', async () => {
    const window = installRouter(MARKETING, fullPage(APP_PAGE))

    await window.stxRouter.navigate('/dashboard')

    const root = window.document.documentElement
    expect(root.classList.contains('marketing')).toBe(false)
    expect(root.hasAttribute('data-stx-html-class')).toBe(false)
  })

  it('keeps runtime-owned classes the server never sent', async () => {
    // `dark` comes from the pre-paint color-mode boot script. It is not in the
    // destination document, and dropping it flashes the wrong theme mid-nav.
    const window = installRouter(MARKETING, fullPage(APP_PAGE))

    await window.stxRouter.navigate('/dashboard')

    expect(window.document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies the destination layout class', async () => {
    const window = installRouter(MARKETING, fullPage(`
      <html lang="en" class="docs" data-stx-html-class="docs">
        <head>
          <meta name="stx-layout" content="layouts/docs.stx">
          <meta name="stx-layout-group" content="app">
        </head>
        <body><main>Docs</main></body>
      </html>
    `))

    await window.stxRouter.navigate('/docs')

    const root = window.document.documentElement
    expect(root.classList.contains('docs')).toBe(true)
    expect(root.classList.contains('marketing')).toBe(false)
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.getAttribute('data-stx-html-class')).toBe('docs')
  })

  it('keeps a class both layouts declare', async () => {
    const window = installRouter(MARKETING, fullPage(`
      <html lang="en" class="marketing wide" data-stx-html-class="marketing wide">
        <head>
          <meta name="stx-layout" content="layouts/pricing.stx">
          <meta name="stx-layout-group" content="app">
        </head>
        <body><main>Pricing</main></body>
      </html>
    `))

    await window.stxRouter.navigate('/pricing')

    const root = window.document.documentElement
    expect(root.classList.contains('marketing')).toBe(true)
    expect(root.classList.contains('wide')).toBe(true)
  })

  it('removes and updates non-class attributes it owns', async () => {
    const window = installRouter(MARKETING, fullPage(`
      <html lang="en" dir="rtl" data-stx-html-attrs="dir">
        <head>
          <meta name="stx-layout" content="layouts/app.stx">
          <meta name="stx-layout-group" content="app">
        </head>
        <body><main>RTL</main></body>
      </html>
    `))

    await window.stxRouter.navigate('/ar')

    const root = window.document.documentElement
    expect(root.getAttribute('dir')).toBe('rtl')
    // data-theme was stx-owned on the entry page and absent on the destination
    expect(root.hasAttribute('data-theme')).toBe(false)
    expect(root.getAttribute('data-stx-html-attrs')).toBe('dir')
  })

  it('leaves the root alone when neither document declares any', async () => {
    const window = installRouter(`
      <html lang="en" class="dark" data-reduced-motion="false">
        <head>
          <meta name="stx-layout" content="layouts/app.stx">
          <meta name="stx-layout-group" content="app">
        </head>
        <body><main>Home</main></body>
      </html>
    `, fullPage(APP_PAGE))

    await window.stxRouter.navigate('/dashboard')

    const root = window.document.documentElement
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.getAttribute('data-reduced-motion')).toBe('false')
  })

  it('still mirrors lang', async () => {
    const window = installRouter(MARKETING, fullPage(`
      <html lang="fr">
        <head>
          <meta name="stx-layout" content="layouts/app.stx">
          <meta name="stx-layout-group" content="app">
        </head>
        <body><main>Bonjour</main></body>
      </html>
    `))

    await window.stxRouter.navigate('/fr')

    expect(window.document.documentElement.getAttribute('lang')).toBe('fr')
  })
})
