/**
 * The router's opt-out set applies to marked links too (stacksjs/stx#1864).
 *
 * The click handler matched `[data-stx-link]` first and only consulted
 * `shouldIntercept()` on the `interceptAllLinks` fallback path. So on a link
 * carrying both attributes, `data-no-router` did nothing at all: the router
 * claimed an OAuth redirect, fetched it as a fragment, failed to use the
 * response, and fell back to a native navigation — requesting the URL twice.
 *
 * The hover-prefetch handler was worse: it matched `[data-stx-link]` and
 * applied no exclusions whatsoever, not even a protocol check, so merely
 * hovering a link the router was told to leave alone fired a real GET at it.
 *
 * Each exclusion test is paired with a control that must still be intercepted.
 * A probe that reports "not intercepted" for both the excluded and the ordinary
 * link is measuring nothing.
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

function installRouter(body: string, onFetch: (url: string) => void) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`<html><head></head><body><main>Home</main>${body}</body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
    prefetch: true,
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
    MouseEvent: window.MouseEvent,
    DOMParser: window.DOMParser,
    fetch: async (url: string) => {
      onFetch(String(url))
      return new Response('<section>next</section>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  new Function(getRouterScript())()

  return window as unknown as Window & { document: Document }
}

/** Returns true when the router claimed the click. */
function clickLink(window: any, selector: string): boolean {
  const link = window.document.querySelector(selector)
  if (!link)
    throw new Error(`no element matched ${selector}`)
  const event = new window.MouseEvent('click', { bubbles: true, cancelable: true })
  link.dispatchEvent(event)
  return event.defaultPrevented
}

function hoverLink(window: any, selector: string): void {
  const link = window.document.querySelector(selector)
  if (!link)
    throw new Error(`no element matched ${selector}`)
  link.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true, cancelable: true }))
}

describe('router link exclusions (#1864)', () => {
  it('control: an ordinary marked link IS intercepted', () => {
    // Without this passing, every "not intercepted" assertion below is vacuous.
    const window = installRouter(`<a id="t" data-stx-link href="/dashboard">Go</a>`, () => {})
    expect(clickLink(window, '#t')).toBe(true)
  })

  it('honours data-no-router on a marked link', () => {
    const window = installRouter(
      `<a id="t" data-stx-link data-no-router href="/auth/github">Sign in</a>`,
      () => {},
    )
    expect(clickLink(window, '#t')).toBe(false)
  })

  it('honours data-stx-no-router on a marked link', () => {
    const window = installRouter(
      `<a id="t" data-stx-link data-stx-no-router href="/auth/github">Sign in</a>`,
      () => {},
    )
    expect(clickLink(window, '#t')).toBe(false)
  })

  it('honours download on a marked link', () => {
    const window = installRouter(
      `<a id="t" data-stx-link download href="/export.csv">Export</a>`,
      () => {},
    )
    expect(clickLink(window, '#t')).toBe(false)
  })

  it('honours target=_blank on a marked link', () => {
    const window = installRouter(
      `<a id="t" data-stx-link target="_blank" href="/docs">Docs</a>`,
      () => {},
    )
    expect(clickLink(window, '#t')).toBe(false)
  })

  it('leaves a javascript: href alone', () => {
    const window = installRouter(
      `<a id="t" data-stx-link href="javascript:void(0)">Menu</a>`,
      () => {},
    )
    expect(clickLink(window, '#t')).toBe(false)
  })

  it('leaves an absolute URL alone', () => {
    const window = installRouter(
      `<a id="t" data-stx-link href="https://github.com/login/oauth/authorize">OAuth</a>`,
      () => {},
    )
    expect(clickLink(window, '#t')).toBe(false)
  })
})

describe('router prefetch exclusions (#1864)', () => {
  it('control: hovering an ordinary marked link DOES prefetch', () => {
    const seen: string[] = []
    const window = installRouter(`<a id="t" data-stx-link href="/dashboard">Go</a>`, url => seen.push(url))
    hoverLink(window, '#t')
    expect(seen).toEqual(['/dashboard'])
  })

  it('does not prefetch a link marked data-no-router', () => {
    // The live failure this encodes: hovering "Sign out" logged the user out.
    const seen: string[] = []
    const window = installRouter(
      `<a id="t" data-stx-link data-no-router href="/logout">Sign out</a>`,
      url => seen.push(url),
    )
    hoverLink(window, '#t')
    expect(seen).toEqual([])
  })

  it('does not prefetch a download link', () => {
    const seen: string[] = []
    const window = installRouter(
      `<a id="t" data-stx-link download href="/export.csv">Export</a>`,
      url => seen.push(url),
    )
    hoverLink(window, '#t')
    expect(seen).toEqual([])
  })

  it('does not prefetch a cross-origin URL', () => {
    const seen: string[] = []
    const window = installRouter(
      `<a id="t" data-stx-link href="https://github.com/login/oauth/authorize">OAuth</a>`,
      url => seen.push(url),
    )
    hoverLink(window, '#t')
    expect(seen).toEqual([])
  })
})
