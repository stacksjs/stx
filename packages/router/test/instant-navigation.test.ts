/**
 * A tab bar's navigation is instant, as on a phone.
 *
 * Every navigation ran inside a View Transition, a quarter-second cross-fade,
 * and drew a progress bar even when the page came from the prefetch cache in a
 * few milliseconds. In a phone app's tab bar that read as lag on every tap.
 *
 * - A link marked `data-stx-transition="none"` swaps without the transition;
 *   an ordinary link still gets it.
 * - The progress bar shows only for a navigation still waiting after 150ms.
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

function installRouter(options: { progress?: boolean, fetchDelay?: number } = {}) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`<html><head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
    </head><body><main>Home</main>
    <a id="tab" href="/calendar" data-stx-link data-stx-transition="none">Calendar</a>
    <a id="plain" href="/about" data-stx-link>About</a>
  </body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: !!options.progress, viewTransitions: true }
  const transitions: string[] = []
  ;(window.document as any).startViewTransition = (callback: () => void) => {
    transitions.push(window.location.pathname)
    callback()
    const done = Promise.resolve()
    return { ready: done, finished: done, updateCallbackDone: done }
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    DOMParser: window.DOMParser,
    fetch: async () => {
      if (options.fetchDelay)
        await sleep(options.fetchDelay)
      return new Response('<section>next</section>', {
        status: 200,
        headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/app.stx', 'X-STX-Layout-Group': 'app' },
      })
    },
  })

  new Function(getRouterScript())()
  return { window: window as unknown as Window & { document: Document }, transitions }
}

function click(window: Window & { document: Document }, id: string) {
  window.document.getElementById(id)!.dispatchEvent(new (window as any).MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
}

describe('instant navigation', () => {
  it('skips the View Transition for a link marked data-stx-transition="none"', async () => {
    const { window, transitions } = installRouter()
    click(window, 'tab')
    await sleep(150)
    expect(window.location.pathname).toBe('/calendar')
    expect(window.document.querySelector('main')!.textContent).toContain('next')
    expect(transitions).toEqual([])
  })

  it('keeps the View Transition for an ordinary link', async () => {
    const { window, transitions } = installRouter()
    click(window, 'plain')
    await sleep(150)
    expect(window.location.pathname).toBe('/about')
    expect(window.document.querySelector('main')!.textContent).toContain('next')
    expect(transitions.length).toBe(1)
  })

  it('does not draw the progress bar for a navigation that finishes at once', async () => {
    const { window } = installRouter({ progress: true })
    const bar = () => window.document.getElementById('stx-router-progress') as HTMLElement | null
    click(window, 'plain')
    await sleep(60)
    expect(window.location.pathname).toBe('/about')
    expect(bar()?.style.opacity ?? '').not.toBe('1')
    await sleep(200)
    expect(bar()?.style.opacity ?? '').not.toBe('1')
  })

  it('still shows it for a navigation that is waiting', async () => {
    const { window } = installRouter({ progress: true, fetchDelay: 400 })
    const bar = () => window.document.getElementById('stx-router-progress') as HTMLElement | null
    click(window, 'plain')
    await sleep(250)
    expect(bar()?.style.opacity).toBe('1')
    await sleep(400)
  })
})
