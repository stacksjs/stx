/**
 * Entries the router pushes are marked; the one the app opened with is not.
 *
 * The router stamps a scroll token on every entry, the first one too, so "the
 * entry has a state" no longer told a pushed screen from a cold start. A phone
 * app's Back that went back on any state left the app, or did nothing at all,
 * from a screen it was opened on. The mark says the app put the entry there.
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
  MouseEvent: globalThis.MouseEvent,
  DOMParser: globalThis.DOMParser,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function boot() {
  const window = new Window({ url: 'http://localhost/m/go/7' })
  window.document.write(`<html><head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
    </head><body><main>Player</main><a id="next" href="/m/workout/7" data-stx-link>Workout</a></body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false }
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    DOMParser: window.DOMParser,
    fetch: async () => new Response('<section>Workout</section>', {
      status: 200,
      headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/app.stx', 'X-STX-Layout-Group': 'app' },
    }),
  })
  new Function(getRouterScript())()
  return window as any
}

describe('history entries', () => {
  it('leave the one the app opened with unmarked', async () => {
    const window = boot()
    await sleep(10)
    expect(window.history.state?.__stxPushed).toBeUndefined()
  })

  it('mark one the router pushed, and keep the mark through a replace', async () => {
    const window = boot()
    await window.stxRouter.navigate('/m/workout/7')
    await sleep(200)
    expect(window.location.pathname).toBe('/m/workout/7')
    expect(window.history.state.__stxPushed).toBe(true)
    await window.stxRouter.navigate('/m/workout/8', { replace: true })
    await sleep(200)
    expect(window.location.pathname).toBe('/m/workout/8')
    expect(window.history.state.__stxPushed).toBe(true)
  })

  it('do not mark the opening entry when it is replaced', async () => {
    const window = boot()
    await window.stxRouter.navigate('/m/workout/7', { replace: true })
    await sleep(200)
    expect(window.location.pathname).toBe('/m/workout/7')
    expect(window.history.state?.__stxPushed).toBeUndefined()
  })
})
