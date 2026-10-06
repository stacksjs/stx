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

function installRouter(options: { progress?: boolean, fetchDelay?: number, fragment?: string } = {}) {
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
  const instant: boolean[] = []
  const updates: Promise<unknown>[] = []
  ;(window.document as any).startViewTransition = (callback: () => unknown) => {
    transitions.push(window.location.pathname)
    instant.push(window.document.documentElement.classList.contains('stx-instant'))
    const update = Promise.resolve(callback())
    updates.push(update)
    return { ready: update, finished: update, updateCallbackDone: update }
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
      return new Response(options.fragment ?? '<section>next</section>', {
        status: 200,
        headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/app.stx', 'X-STX-Layout-Group': 'app' },
      })
    },
  })

  new Function(getRouterScript())()
  return { window: window as unknown as Window & { document: Document }, transitions, instant, updates }
}

function click(window: Window & { document: Document }, id: string) {
  window.document.getElementById(id)!.dispatchEvent(new (window as any).MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
}

describe('instant navigation', () => {
  it('swaps a link marked data-stx-transition="none" in one frame, without the fade', async () => {
    const { window, transitions } = installRouter({ fragment: '<section>next</section><script>window.__page = 1</script>' })
    const bound: string[] = []
    ;(window as any).stx = { _flushLoad: () => { bound.push(window.document.querySelector('main')!.textContent || '') } }
    click(window, 'tab')
    await sleep(150)
    expect(window.location.pathname).toBe('/calendar')
    expect(window.document.querySelector('main')!.textContent).toContain('next')
    // Its scripts all run in the swap's own task, so there is nothing to hold
    // a frame for: no View Transition, and the page is bound in that same
    // task (not after the runtime's stx:load debounce), before any paint.
    expect(transitions.length).toBe(0)
    expect(bound).toEqual([expect.stringContaining('next')])
    expect(window.document.documentElement.classList.contains('stx-instant')).toBe(false)
  })

  it('holds the old frame until a page script that runs later has run, and no longer', async () => {
    // A script with an import runs as a module, after the task that inserted
    // it: the only case where the new screen could paint before it is bound.
    const { window, updates, instant } = installRouter({ fragment: '<section>next</section><script>import "data:text/javascript,";\nwindow.__page = 1</script>' })
    click(window, 'tab')
    await sleep(20)
    expect(updates.length).toBe(1)
    // Held by a View Transition marked instant, which the router's CSS strips
    // of its animation.
    expect(instant).toEqual([true])
    const inserted = [...window.document.querySelectorAll('script[data-stx-page]')].map(node => node.textContent || '')
    expect(inserted.some(text => text.includes('__page') && text.trimEnd().endsWith('window.__stxScriptRan&&window.__stxScriptRan();'))).toBe(true)
    let settled = false
    void updates[0]!.then(() => { settled = true })
    await sleep(40)
    expect(settled).toBe(false)
    const reported = Date.now()
    ;(window as any).__stxScriptRan()
    await updates[0]
    expect(Date.now() - reported).toBeLessThan(100)
  })

  it('does not fall back to the fade for it either', async () => {
    const { window } = installRouter()
    ;(window.document as any).startViewTransition = undefined
    const main = window.document.querySelector('main') as HTMLElement
    const opacities: string[] = []
    const observer = new (window as any).MutationObserver(() => opacities.push(main.style.opacity))
    observer.observe(main, { attributes: true, attributeFilter: ['style'] })
    click(window, 'tab')
    await sleep(40)
    expect(window.document.querySelector('main')!.textContent).toContain('next')
    expect(opacities).not.toContain('0')
    observer.disconnect()
  })

  it('swaps a navigate(url, { instant: true }) call the same way', async () => {
    const { window, transitions } = installRouter({ fragment: '<section>next</section><script>window.__page = 1</script>' })
    void (window as any).stxRouter.navigate('/about', { replace: true, instant: true })
    await sleep(150)
    expect(window.location.pathname).toBe('/about')
    expect(window.document.querySelector('main')!.textContent).toContain('next')
    expect(transitions.length).toBe(0)
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
