/**
 * The router must not navigate a click the page already handled
 * (stacksjs/stacks#2393).
 *
 * The click listener ran in the CAPTURE phase, which broke the contract twice
 * over. It saw the click before the anchor did, so `e.defaultPrevented` was
 * necessarily false by the time the router read it - and it read it only to
 * log it, never to branch on it. Worse, the `stopPropagation()` it then called
 * stopped the event ever reaching the element, so a page's own click handler
 * on an intercepted link never ran at all: not a late handler, not a losing
 * handler, no handler.
 *
 * The visible symptom was an anchor that navigated away instead of opening the
 * inline form its handler was there to render. The only workaround was to
 * replace the anchor with a <button> in script, which costs the no-JS reader
 * the link.
 *
 * Each case is paired with a control that must STILL be intercepted. A probe
 * reporting "not intercepted" for both is measuring nothing.
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

interface Harness {
  window: any
  /** URLs the router actually fetched, i.e. navigations it claimed. */
  navigations: string[]
}

function installRouter(body: string, config: Record<string, unknown> = {}): Harness {
  const navigations: string[] = []
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`<html><head></head><body><main>Home</main>${body}</body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
    prefetch: false,
    progress: false,
    viewTransitions: false,
    ...config,
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
    fetch: async (url: string) => {
      navigations.push(String(url))
      return new Response('<section>next</section>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  new Function(getRouterScript())()

  return { window, navigations }
}

function click(harness: Harness, selector: string): void {
  const element = harness.window.document.querySelector(selector)
  if (!element)
    throw new Error(`no element matched ${selector}`)
  element.dispatchEvent(new harness.window.MouseEvent('click', { bubbles: true, cancelable: true }))
}

/** Binds the progressive-enhancement handler the issue describes. */
function enhance(harness: Harness, selector: string, ran: { value: boolean }): void {
  harness.window.document.querySelector(selector).addEventListener('click', (event: any) => {
    ran.value = true
    event.preventDefault()
  })
}

describe('a page handler that cancels the click (#2393)', () => {
  describe('a marked [data-stx-link] anchor', () => {
    it('control: without a handler the router still claims it', () => {
      const harness = installRouter(`<a id="t" data-stx-link href="/partner">Go</a>`)
      click(harness, '#t')
      expect(harness.navigations).toEqual(['/partner'])
    })

    it('runs the page handler at all', () => {
      // Under capture + stopPropagation the event never reached the anchor,
      // so this was false: the handler did not lose the race, it never ran.
      const harness = installRouter(`<a id="t" data-stx-link href="/partner">Go</a>`)
      const ran = { value: false }
      enhance(harness, '#t', ran)
      click(harness, '#t')
      expect(ran.value).toBe(true)
    })

    it('does not navigate once that handler has cancelled it', () => {
      const harness = installRouter(`<a id="t" data-stx-link href="/partner">Go</a>`)
      enhance(harness, '#t', { value: false })
      click(harness, '#t')
      expect(harness.navigations).toEqual([])
    })
  })

  describe('an ordinary anchor under interceptAllLinks', () => {
    const staticSite = { interceptAllLinks: true }

    it('control: without a handler the router still claims it', () => {
      const harness = installRouter(`<a id="t" href="/partner">Go</a>`, staticSite)
      click(harness, '#t')
      expect(harness.navigations).toEqual(['/partner'])
    })

    it('runs the page handler at all', () => {
      const harness = installRouter(`<a id="t" href="/partner">Go</a>`, staticSite)
      const ran = { value: false }
      enhance(harness, '#t', ran)
      click(harness, '#t')
      expect(ran.value).toBe(true)
    })

    it('does not navigate once that handler has cancelled it', () => {
      const harness = installRouter(`<a id="t" href="/partner">Go</a>`, staticSite)
      enhance(harness, '#t', { value: false })
      click(harness, '#t')
      expect(harness.navigations).toEqual([])
    })

    it('leaves an uncancelled handler on a sibling link alone', () => {
      // The guard reads the event, not the element, so one enhanced link must
      // not stop the next plain one from routing.
      const harness = installRouter(
        `<a id="a" href="/partner">Claim</a><a id="b" href="/browse">Browse</a>`,
        staticSite,
      )
      enhance(harness, '#a', { value: false })
      click(harness, '#a')
      click(harness, '#b')
      expect(harness.navigations).toEqual(['/browse'])
    })
  })
})
