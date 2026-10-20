/**
 * A tap into another layout is a swap, not two round trips after the tap.
 *
 * A page in another layout group cannot be swapped in as a fragment, so the
 * router fetched the fragment, saw the layout change, and only then fetched
 * the whole document. Prefetching on hover or on sight did not help: the
 * prefetch cached the fragment, and the cache hit went to the network for the
 * document anyway. On a server a round trip away (hq.training, an app page to
 * its public directory) that was a second or more after every tap.
 *
 * Now a prefetch that lands in another layout brings the full document, and
 * the tap swaps it in from the cache. And a page's generated stylesheet starts
 * downloading beside its module bundles instead of after them.
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

const APP_METAS = '<meta name="stx-layout" content="layouts/app"><meta name="stx-layout-group" content="app">'
const PUBLIC_HEADERS = { 'X-STX-Layout': 'layouts/public', 'X-STX-Layout-Group': 'public' }
const APP_HEADERS = { 'X-STX-Layout': 'layouts/app', 'X-STX-Layout-Group': 'app' }

function install(headers: Record<string, string>, extraBody = '', options: { revalidate?: boolean, revalidateAfter?: number, text?: () => string } = {}) {
  const requests: Array<'fragment' | 'document'> = []
  const window = new Window({ url: 'http://localhost/home' })
  window.document.write(`<html><head>${APP_METAS}</head><body>`
    + '<nav id="app-nav"><a id="go" href="/explore" data-stx-link>Discover</a></nav>'
    + `<main data-stx-content>Home</main>${extraBody}`
    + '</body></html>')
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: true,
    prefetchVisible: false,
    progress: false,
    viewTransitions: false,
    revalidate: false,
    keepOpening: false,
    cssLoadTimeout: 20,
    ...options,
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async (_url: string, init?: any) => {
      const wantsFragment = !!init?.headers?.['X-STX-Router']
      requests.push(wantsFragment ? 'fragment' : 'document')
      if (wantsFragment) {
        return new Response('<main data-stx-content>Explore</main>', {
          headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', ...headers },
        })
      }
      return new Response(
        '<!DOCTYPE html><html><head><meta name="stx-layout" content="layouts/public"><meta name="stx-layout-group" content="public"></head>'
        + `<body><nav id="public-nav">p</nav><main data-stx-content>${options.text?.() ?? 'Explore'}</main></body></html>`,
        { headers: { 'Content-Type': 'text/html' } },
      )
    },
  })

  new Function(getRouterScript())()
  return { window: window as Window & { stxRouter: any }, requests }
}

const settle = (ms = 60) => new Promise(resolve => setTimeout(resolve, ms))

describe('a prefetch into another layout', () => {
  it('brings the whole document, so the tap needs nothing more', async () => {
    const { window, requests } = install(PUBLIC_HEADERS)
    window.document.getElementById('go')!.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
    await settle()
    expect(requests).toEqual(['fragment', 'document'])

    await window.stxRouter.navigate('/explore')
    await settle(250)

    // Served from the cache: no request after the tap.
    expect(requests).toEqual(['fragment', 'document'])
    // And it is the other layout's chrome, not Explore inside the app nav.
    expect(window.document.querySelector('#public-nav')).not.toBeNull()
    expect(window.document.querySelector('#app-nav')).toBeNull()
    expect(window.document.querySelector('main')?.textContent?.trim()).toBe('Explore')
  })

  it('leaves a prefetch within the same layout a single fragment', async () => {
    const { window, requests } = install(APP_HEADERS)
    window.document.getElementById('go')!.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
    await settle()
    expect(requests).toEqual(['fragment'])

    await window.stxRouter.navigate('/explore')
    await settle(250)
    expect(requests).toEqual(['fragment'])
    expect(window.document.querySelector('#app-nav')).not.toBeNull()
    expect(window.document.querySelector('main')?.textContent?.trim()).toBe('Explore')
  })

  it.each([false, true])('revalidates a cached document as a document (changed: %s)', async (changed) => {
    let text = 'Explore v1'
    const { window, requests } = install(PUBLIC_HEADERS, '', { revalidate: true, revalidateAfter: 0, text: () => text })
    const updated: unknown[] = []
    window.addEventListener('stx:updated', (event: any) => updated.push(event.detail))
    window.document.getElementById('go')!.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
    await settle()
    text = changed ? 'Explore v2' : text

    await window.stxRouter.navigate('/explore')
    await settle()

    expect(window.document.querySelector('main')?.textContent?.trim()).toBe('Explore v1')
    expect(requests).toEqual(['fragment', 'document', 'document'])
    expect(updated).toEqual(changed ? [{ url: '/explore', kind: 'page' }] : [])
    expect(window.stxRouter.cache['/explore']).toStartWith('<!DOCTYPE html>')
    expect(window.stxRouter.cache['/explore']).toContain(text)
  })

  it('keeps a freshly prefetched document within the revalidation interval', async () => {
    const { window, requests } = install(PUBLIC_HEADERS, '', { revalidate: true, revalidateAfter: 60_000 })
    window.document.getElementById('go')!.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
    await settle()
    await window.stxRouter.navigate('/explore')
    await settle()
    expect(requests).toEqual(['fragment', 'document'])
  })
})

describe('a page\'s stylesheet', () => {
  it('starts downloading beside its module bundle, not after it', async () => {
    const window = new Window({ url: 'http://localhost/a' })
    window.document.write(`<html><head>${APP_METAS}</head><body><main data-stx-content>A</main></body></html>`)
    ;(window as any).stx = {}
    ;(window as any).__stxRouterConfig = { cache: true, prefetch: false, progress: false, viewTransitions: false, cssLoadTimeout: 20 }
    Object.assign(globalThis, {
      window,
      document: window.document,
      location: window.location,
      history: window.history,
      CustomEvent: window.CustomEvent,
      Event: window.Event,
      DOMParser: window.DOMParser,
      fetch: async () => new Response(
        '<link data-css="generated" rel="stylesheet" href="/_stx/css.bbbbbbbbbbbbbbbb.css">'
        + '<script src="/_stx/modules.bbbbbbbbbbbbbbbb.js" data-stx-modules></script>'
        + '<section>B</section>',
        { headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', ...APP_HEADERS } },
      ),
    })
    const created: Element[] = []
    const createElement = window.document.createElement.bind(window.document)
    ;(window.document as any).createElement = (tag: string, ...rest: any[]) => {
      const el = (createElement as any)(tag, ...rest)
      created.push(el)
      return el
    }
    new Function(getRouterScript())()

    // Hold the bundle until the sheet is already on its way.
    const navigation = (window as any).stxRouter.navigate('/b')
    await settle(30)
    const bundle = created.find(el => el.tagName === 'SCRIPT' && String(el.getAttribute('src')).includes('modules.bbbb'))
    const sheet = created.find(el => el.tagName === 'LINK' && String(el.getAttribute('href')).includes('css.bbbb'))
    expect(bundle).toBeDefined()
    expect(sheet).toBeDefined()
    expect(window.document.querySelector('main')?.textContent?.trim()).toBe('A')
    // Finish this navigation before restoring the globals for another test.
    ;(bundle as any).onload()
    ;(sheet as any).onload?.()
    await navigation
    expect(window.document.querySelector('main')?.textContent?.trim()).toBe('B')
  })
})
