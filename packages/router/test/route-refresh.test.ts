/**
 * The current route's server data can be re-run (stacksjs/stx#1850, #1858).
 *
 * The router exposed navigate / prefetch / clearCache / cache / swap /
 * updateNav and no refresh. `invalidate()` on a query only re-runs CLIENT
 * fetches, so anything the server rendered — a list a mutation just changed, a
 * count in the layout — could only be refreshed with a full document load.
 * That discards every signal on the page, which is the exact thing the SPA
 * exists to avoid, so apps fell back to `location.reload()` and lost their
 * state.
 *
 * `navigate` already took a `force` flag that evicts the cache entry and
 * defeats the same-URL early return, so this exposes behaviour the router had
 * rather than adding a parallel path.
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

const FRAGMENT_HEADERS = {
  'X-STX-Fragment': 'true',
  'X-STX-Layout': 'layouts/default.stx',
  'X-STX-Layout-Group': 'default',
}

function installRouter(config: Record<string, unknown> = {}) {
  const calls: string[] = []
  let counter = 0
  const window = new Window({ url: 'http://localhost/dashboard' })
  window.document.write(`<html><head>
    <meta name="stx-layout" content="layouts/default.stx">
    <meta name="stx-layout-group" content="default">
  </head><body><main>original</main></body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: true,
    prefetch: false,
    progress: false,
    viewTransitions: false,
    routeFocus: false,
    announceRoute: false,
    ...config,
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    fetch: async (url: string) => {
      calls.push(String(url))
      counter += 1
      return new Response(`<section>render ${counter}</section>`, {
        status: 200,
        headers: { 'Content-Type': 'text/html', ...FRAGMENT_HEADERS },
      })
    },
  })

  new Function(getRouterScript())()
  return { window: window as any, calls }
}

const settle = () => new Promise(r => setTimeout(r, 220))

describe('router.refresh() (#1850, #1858)', () => {
  it('is part of the public surface', () => {
    const { window } = installRouter()
    expect(typeof window.stxRouter.refresh).toBe('function')
    expect(typeof window.stxRouter.invalidate).toBe('function')
  })

  it('re-fetches the current route', async () => {
    const { window, calls } = installRouter()
    await window.stxRouter.refresh()
    await settle()

    expect(calls).toEqual(['/dashboard'])
    expect(window.document.querySelector('main')?.innerHTML).toContain('render 1')
  })

  it('bypasses the cache, so the second call really hits the server', async () => {
    // The whole point: a cached entry for the current path must not satisfy a
    // refresh, or the mutation's effect is invisible.
    const { window, calls } = installRouter()
    await window.stxRouter.refresh()
    await settle()
    await window.stxRouter.refresh()
    await settle()

    expect(calls).toEqual(['/dashboard', '/dashboard'])
    expect(window.document.querySelector('main')?.innerHTML).toContain('render 2')
  })

  it('adds no history entry', async () => {
    // A refresh is not a new place. Pushing one would make Back re-show the
    // same page and feel broken.
    const { window } = installRouter()
    const before = window.history.length
    await window.stxRouter.refresh()
    await settle()

    expect(window.history.length).toBe(before)
    expect(window.location.pathname).toBe('/dashboard')
  })

  it('keeps the query string', async () => {
    const { window, calls } = installRouter()
    window.history.replaceState({}, '', '/dashboard?range=30d')
    await window.stxRouter.refresh()
    await settle()

    expect(calls).toEqual(['/dashboard?range=30d'])
  })

  it('control: a plain navigate to the same URL still short-circuits', async () => {
    // refresh() works because it forces. Ordinary same-URL navigation must
    // keep its early return, or every nav link to the current page re-fetches.
    const { window, calls } = installRouter()
    await window.stxRouter.navigate('/dashboard')
    await settle()

    expect(calls).toEqual([])
  })
})

describe('router.invalidate() (#1850, #1858)', () => {
  it('expires one entry without clearing the whole cache', async () => {
    const { window } = installRouter()
    await window.stxRouter.navigate('/reports')
    await settle()
    await window.stxRouter.navigate('/settings')
    await settle()

    expect(window.stxRouter.cache['/reports']).toBeDefined()
    expect(window.stxRouter.cache['/settings']).toBeDefined()

    window.stxRouter.invalidate('/reports')

    expect(window.stxRouter.cache['/reports']).toBeUndefined()
    expect(window.stxRouter.cache['/settings']).toBeDefined()
  })

  it('defaults to the current path', async () => {
    const { window } = installRouter()
    await window.stxRouter.refresh()
    await settle()
    expect(window.stxRouter.cache['/dashboard']).toBeDefined()

    window.stxRouter.invalidate()

    expect(window.stxRouter.cache['/dashboard']).toBeUndefined()
  })
})
