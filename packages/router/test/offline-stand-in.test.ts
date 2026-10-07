/**
 * An offline stand-in shows the screen that was asked for.
 *
 * Without a network the offline worker answers a screen it has not kept whole
 * (a workout opened inside the app, then the app reopened cold) with the
 * app's first screen, marked. The router asks for the wanted screen as a
 * fragment, which a visit inside the app kept, and shows it in place. When
 * there is none it stays on the stand-in: a failed navigation reloads, and
 * offline the reload would be the stand-in again, without end.
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

function boot(kept: boolean, marked = true) {
  const window = new Window({ url: 'http://localhost/m/go/7' })
  window.document.write(`<html><head>${marked ? '<meta name="stx-offline-fallback" content="1">' : ''}
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
    </head><body><main>Today</main></body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false }
  const asked: string[] = []
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    MouseEvent: window.MouseEvent,
    DOMParser: window.DOMParser,
    fetch: async (url: string) => {
      asked.push(String(url))
      if (!kept) throw new TypeError('offline')
      return new Response('<section data-player>Player</section>', {
        status: 200,
        headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/app.stx', 'X-STX-Layout-Group': 'app' },
      })
    },
  })
  new Function(getRouterScript())()
  return { window: window as unknown as Window & { document: Document }, asked }
}

describe('an offline stand-in', () => {
  it('shows the screen that was asked for, kept as a fragment', async () => {
    const { window, asked } = boot(true)
    await sleep(400)
    expect(asked[0]).toBe('/m/go/7')
    expect(window.document.querySelector('[data-player]')?.textContent).toBe('Player')
    expect(window.document.querySelector('meta[name="stx-offline-fallback"]')).toBeNull()
    expect(window.location.pathname).toBe('/m/go/7')
  })

  it('stays on the stand-in when that screen was never kept', async () => {
    const { window, asked } = boot(false)
    await sleep(50)
    expect(asked).toEqual(['/m/go/7'])
    expect(window.document.querySelector('main')?.textContent).toBe('Today')
    expect(window.location.pathname).toBe('/m/go/7')
  })

  it('asks for nothing on an ordinary page', async () => {
    const { asked } = boot(true, false)
    await sleep(50)
    expect(asked).toEqual([])
  })
})
