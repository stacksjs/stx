/**
 * A click into another layout is one request, and a navigation that gets no
 * answer becomes a page load.
 *
 * The router asked for a fragment, read in its headers that the page was on
 * another layout, and fetched the whole document. The server rendered the
 * page twice for one click: on one app a link from a marketing page to an
 * app page cost two 1.25 MB renders and two lookups of the same data. Now a
 * fragment request says which layout the router's page is on, and a server
 * that knows the page is elsewhere answers with the document at once.
 *
 * And the navigation fetch had no time limit, so a slow server left a click
 * hanging with nothing to show for it. Past navigationTimeout the browser
 * loads the page itself.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'
import { layoutChanges, layoutTheRouterHas } from '../src/layout-metadata'

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

interface Seen { router: boolean, layout: string | null, group: string | null, purpose: string | null }

// A server that does what stx's servers now do: a router request from
// another layout gets the document, from the same layout a fragment.
function install(target: { layout: string, group: string }, options: Record<string, unknown> = {}, hang = false) {
  const seen: Seen[] = []
  const assigned: string[] = []
  const window = new Window({ url: 'http://localhost/home' })
  window.document.write('<html><head><meta name="stx-layout" content="layouts/marketing"><meta name="stx-layout-group" content="marketing"></head><body>'
    + '<nav id="marketing-nav"><a id="go" href="/brands/acme" data-stx-link>Acme</a></nav>'
    + '<main data-stx-content>Home</main></body></html>')
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
  try {
    Object.defineProperty(window.location, 'assign', { value: (url: string) => { assigned.push(String(url)) }, configurable: true })
  }
  catch {
    ;(window.location as any).assign = (url: string) => { assigned.push(String(url)) }
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: (_url: string, init?: any) => {
      const headers = new Headers(init?.headers)
      seen.push({ router: headers.get('X-STX-Router') === 'true', layout: headers.get('X-STX-Have-Layout'), group: headers.get('X-STX-Have-Layout-Group'), purpose: headers.get('Purpose') })
      if (hang) {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
        })
      }
      const layoutHeaders = { 'X-STX-Layout': target.layout, 'X-STX-Layout-Group': target.group }
      const routerHas = layoutTheRouterHas(headers)
      if (headers.get('X-STX-Router') === 'true' && !(routerHas && layoutChanges(routerHas, target))) {
        return Promise.resolve(new Response('<main data-stx-content>Acme</main>', {
          headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', ...layoutHeaders },
        }))
      }
      return Promise.resolve(new Response(
        `<!DOCTYPE html><html><head><meta name="stx-layout" content="${target.layout}"><meta name="stx-layout-group" content="${target.group}"></head>`
        + '<body><nav id="app-nav">app</nav><main data-stx-content>Acme</main></body></html>',
        { headers: { 'Content-Type': 'text/html', ...(routerHas ? layoutHeaders : {}) } },
      ))
    },
  })

  new Function(getRouterScript())()
  return { window: window as Window & { stxRouter: any }, seen, assigned }
}

const settle = (ms = 80) => new Promise(resolve => setTimeout(resolve, ms))
const APP = { layout: 'layouts/app', group: 'app' }
const MARKETING = { layout: 'layouts/marketing', group: 'marketing' }

describe('a click into another layout', () => {
  it('is one request, which says the layout the router is on', async () => {
    const { window, seen } = install(APP)
    await window.stxRouter.navigate('/brands/acme')
    await settle()

    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ router: true, layout: 'layouts/marketing', group: 'marketing' })
    // The document it answered with is the one swapped in, chrome and all.
    expect(window.document.querySelector('#app-nav')).not.toBeNull()
    expect(window.document.querySelector('#marketing-nav')).toBeNull()
    expect(window.document.querySelector('main')?.textContent?.trim()).toBe('Acme')
  })

  it('stays a fragment swap within the same layout', async () => {
    const { window, seen } = install(MARKETING)
    await window.stxRouter.navigate('/brands/acme')
    await settle()

    expect(seen).toHaveLength(1)
    expect(window.document.querySelector('#marketing-nav')).not.toBeNull()
    expect(window.document.querySelector('main')?.textContent?.trim()).toBe('Acme')
  })

  it('prefetches it in one request too, and the tap needs nothing more', async () => {
    const { window, seen } = install(APP)
    window.document.getElementById('go')!.dispatchEvent(new window.Event('mouseover', { bubbles: true }))
    await settle()
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ router: true, group: 'marketing', purpose: 'prefetch' })

    await window.stxRouter.navigate('/brands/acme')
    await settle(250)
    expect(seen).toHaveLength(1)
    expect(window.document.querySelector('#app-nav')).not.toBeNull()
  })
})

describe('a navigation with no answer', () => {
  it('becomes a page load past navigationTimeout', async () => {
    const { window, assigned } = install(APP, { navigationTimeout: 40 }, true)
    void window.stxRouter.navigate('/brands/acme')
    await settle(200)
    expect(assigned).toHaveLength(1)
    expect(new URL(assigned[0], 'http://localhost').pathname).toBe('/brands/acme')
  })

  it('waits as long as it takes when the limit is off', async () => {
    const { window, assigned } = install(APP, { navigationTimeout: 0 }, true)
    void window.stxRouter.navigate('/brands/acme')
    await settle(200)
    expect(assigned).toHaveLength(0)
  })
})

describe('the rule both sides use', () => {
  it('matches the router: another group, or another named layout in the same group', () => {
    expect(layoutChanges(MARKETING, APP)).toBe(true)
    expect(layoutChanges(APP, APP)).toBe(false)
    expect(layoutChanges({ layout: 'layouts/app', group: 'app' }, { layout: 'layouts/coach', group: 'app' })).toBe(true)
    // A side with no named layout only compares groups, as the router does.
    expect(layoutChanges({ layout: '', group: 'app' }, { layout: 'layouts/app', group: 'app' })).toBe(false)
    expect(layoutChanges({ layout: '', group: '' }, { layout: '', group: '' })).toBe(false)
  })

  it('reads nothing from a router that says nothing', () => {
    expect(layoutTheRouterHas(new Headers({ 'X-STX-Router': 'true' }))).toBeNull()
    expect(layoutTheRouterHas(new Headers({ 'X-STX-Have-Layout-Group': 'app' }))).toEqual({ layout: '', group: 'app' })
  })
})
