/**
 * A data block is not code (stacksjs/stx#1801).
 *
 * `doFragSwap` pulls scripts out of an incoming fragment with a regex over the
 * raw HTML, and every match was treated as JavaScript: stashed, re-emitted as a
 * pending placeholder, then wrapped in braces and executed. Wrapping a JSON
 * object in braces reparses it as a labelled block, so its first `:` throws
 * `SyntaxError: Unexpected token ':'` — once per fragment swap, on every
 * navigation into the page.
 *
 * It stayed hidden because the swap still completes and the page looks correct;
 * it is only visible with the console open. The reporter found it after a full
 * stage of work had already shipped over it.
 *
 * `prepareRoutedBodyScripts` classifies by `type` and the head/body collection
 * requires a setup marker, so both of those paths were already safe. The regex
 * path never had the check — which is why the two obvious suspects looked
 * innocent when the issue was filed.
 *
 * `@structuredData` renders at its call site, and inside a layout that is
 * `@section('content')` — i.e. within the routed container. So the natural way
 * to write it triggered this, including the breadcrumb example in the guide.
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

const LD_JSON = '{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1}]}'

describe('router — non-executable scripts in a swapped fragment', () => {
  it('does not brace-wrap a JSON-LD payload', async () => {
    // The wrap is what threw. Reproduce it directly so the premise is pinned:
    // if this ever stops throwing, the guard below is testing nothing.
    expect(() => new Function(`{${LD_JSON}}`)).toThrow()

    const window = installRouter(
      `<section><script type="application/ld+json">${LD_JSON}<\/script><h1>Pricing</h1></section>`,
    )
    await navigate(window, '/pricing')

    const injected = Array.from(window.document.querySelectorAll('script[data-stx-page]'))
      .map((s: any) => s.textContent || '')
    expect(injected.some(t => t.includes('BreadcrumbList'))).toBe(false)
  })

  it('leaves the structured data in the document for crawlers', async () => {
    // Stripping it would trade a console error for an SEO regression, so the
    // guard preserves the node verbatim rather than dropping it.
    const window = installRouter(
      `<section><script type="application/ld+json">${LD_JSON}<\/script><h1>Pricing</h1></section>`,
    )
    await navigate(window, '/pricing')

    const ld = window.document.querySelector('script[type="application/ld+json"]')
    expect(ld).toBeTruthy()
    expect(ld?.textContent).toContain('BreadcrumbList')
    // And it must not have been rewritten into the router's pending placeholder.
    expect(ld?.getAttribute('data-stx-route-script')).toBeNull()
  })

  it('survives repeated navigation, which is when the error fired', async () => {
    const window = installRouter(
      `<section><script type="application/ld+json">${LD_JSON}<\/script><h1>Page</h1></section>`,
    )
    await navigate(window, '/pricing')
    await navigate(window, '/features')

    const injected = Array.from(window.document.querySelectorAll('script[data-stx-page]'))
      .map((s: any) => s.textContent || '')
    expect(injected.some(t => t.includes('BreadcrumbList'))).toBe(false)
  })

  it('still executes real page scripts in the same fragment', async () => {
    // The guard must not become a blanket skip: a JSON-LD block sitting next to
    // a page script is the actual shape of an SEO'd page.
    const window = installRouter(
      `<section>`
      + `<script type="application/ld+json">${LD_JSON}<\/script>`
      + `<script data-stx-run="always">SENTINEL_EXEC()<\/script>`
      + `</section>`,
    )
    await navigate(window, '/pricing')

    const injected = Array.from(window.document.querySelectorAll('script[data-stx-page]'))
      .map((s: any) => s.textContent || '')
    expect(injected.some(t => t.includes('SENTINEL_EXEC'))).toBe(true)
  })

  it('treats other data types the same way', async () => {
    // importmap and speculationrules are JSON too, and an importmap executed as
    // JS would break module resolution for the whole document.
    const window = installRouter(
      `<section><script type="importmap">{"imports":{"a":"/a.js"}}<\/script><h1>Page</h1></section>`,
    )
    await navigate(window, '/pricing')

    const injected = Array.from(window.document.querySelectorAll('script[data-stx-page]'))
      .map((s: any) => s.textContent || '')
    expect(injected.some(t => t.includes('imports'))).toBe(false)
    expect(window.document.querySelector('script[type="importmap"]')).toBeTruthy()
  })
})
