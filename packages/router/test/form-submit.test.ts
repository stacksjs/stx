/**
 * The router carries form submissions (stacksjs/stx#1863).
 *
 * A submit IS a navigation, and the router only ever watched clicks —
 * `grep -c "'submit'" packages/router/src/client.ts` returned 0. So any
 * in-app form tore down the SPA with a full document load, discarding every
 * signal on the page, and the only way out was a hand-written `fetch()` in a
 * `@submit` handler with its own loading and error state.
 *
 * Gated exactly like links: `data-stx-form` opts one in, `interceptForms`
 * claims them all. Deliberately not on by default — a POST has side effects,
 * so claiming one must be a decision, not something that starts happening on
 * upgrade.
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
  FormData: globalThis.FormData,
  DOMParser: globalThis.DOMParser,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

/**
 * very-happy-dom's FormData serialises a form by building a NATIVE
 * `globalThis.FormData` internally, so assigning `globalThis.FormData =
 * window.FormData` makes it recurse until the stack blows — and because
 * `dispatchEvent` swallows listener errors, that surfaced as "the handler
 * silently did nothing" rather than as a crash.
 *
 * Native FormData given a happy-dom form returns an EMPTY set rather than
 * throwing, so leaving the global alone fails just as quietly. This shim hands
 * the router happy-dom's implementation while native is restored underneath it.
 */
const NativeFormData = globalThis.FormData

function formDataShim(window: any) {
  const Happy = window.FormData
  return function (this: unknown, form?: unknown) {
    const prev = globalThis.FormData
    globalThis.FormData = NativeFormData
    try {
      return new Happy(form)
    }
    finally {
      globalThis.FormData = prev
    }
  } as unknown as typeof FormData
}

const FRAGMENT_HEADERS = {
  'X-STX-Fragment': 'true',
  'X-STX-Layout': 'layouts/default.stx',
  'X-STX-Layout-Group': 'default',
}

interface Call { url: string, method: string, body: string }

function installRouter(bodyHtml: string, config: Record<string, unknown> = {}) {
  const calls: Call[] = []
  const window = new Window({ url: 'http://localhost/start' })
  window.document.write(`<html><head>
    <meta name="stx-layout" content="layouts/default.stx">
    <meta name="stx-layout-group" content="default">
  </head><body><main>Home</main>${bodyHtml}</body></html>`)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
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
    MouseEvent: window.MouseEvent,
    FormData: formDataShim(window),
    DOMParser: window.DOMParser,
    fetch: async (url: string, opts: any = {}) => {
      let body = ''
      if (opts.body)
        body = typeof opts.body === 'string' ? opts.body : String(opts.body)
      calls.push({ url: String(url), method: opts.method || 'GET', body })
      return new Response('<section id="result">submitted</section>', {
        status: 200,
        headers: { 'Content-Type': 'text/html', ...FRAGMENT_HEADERS },
      })
    },
  })

  new Function(getRouterScript())()
  return { window: window as any, calls }
}

const settle = () => new Promise(r => setTimeout(r, 220))

function submit(window: any, selector = 'form') {
  const form = window.document.querySelector(selector)
  const ev = new window.Event('submit', { bubbles: true, cancelable: true })
  form.dispatchEvent(ev)
  return ev
}

describe('opting in (#1863)', () => {
  it('control: an unmarked form is left to the browser', async () => {
    // Without this passing, every "was intercepted" assertion below is vacuous.
    const { window, calls } = installRouter(`<form action="/search" method="get"><input name="q" value="x"></form>`)
    const ev = submit(window)
    await settle()

    expect(ev.defaultPrevented).toBe(false)
    expect(calls).toHaveLength(0)
  })

  it('claims a form marked data-stx-form', async () => {
    const { window, calls } = installRouter(
      `<form data-stx-form action="/search" method="get"><input name="q" value="x"></form>`,
    )
    const ev = submit(window)
    await settle()

    expect(ev.defaultPrevented).toBe(true)
    expect(calls[0]?.url).toBe('/search?q=x')
  })

  it('claims every form when interceptForms is on', async () => {
    const { window, calls } = installRouter(
      `<form action="/search" method="get"><input name="q" value="x"></form>`,
      { interceptForms: true },
    )
    submit(window)
    await settle()

    expect(calls[0]?.url).toBe('/search?q=x')
  })

  it('honours data-no-router even when interceptForms is on', async () => {
    const { window, calls } = installRouter(
      `<form data-no-router action="/search" method="get"><input name="q" value="x"></form>`,
      { interceptForms: true },
    )
    const ev = submit(window)
    await settle()

    expect(ev.defaultPrevented).toBe(false)
    expect(calls).toHaveLength(0)
  })

  it('leaves a cross-origin action alone', async () => {
    const { window, calls } = installRouter(
      `<form data-stx-form action="https://example.com/x" method="post"></form>`,
    )
    const ev = submit(window)
    await settle()

    expect(ev.defaultPrevented).toBe(false)
    expect(calls).toHaveLength(0)
  })

  it('leaves a form targeting another browsing context alone', async () => {
    const { window, calls } = installRouter(
      `<form data-stx-form target="_blank" action="/x" method="post"></form>`,
    )
    const ev = submit(window)
    await settle()

    expect(ev.defaultPrevented).toBe(false)
    expect(calls).toHaveLength(0)
  })

  it('yields to a page handler that already called preventDefault', async () => {
    // The router is a fallback for forms nobody claimed, never an override of
    // a form that is already handled.
    const { window, calls } = installRouter(
      `<form data-stx-form action="/x" method="post"></form>`,
    )
    window.document.querySelector('form').addEventListener('submit', (e: any) => e.preventDefault())
    submit(window)
    await settle()

    expect(calls).toHaveLength(0)
  })
})

describe('GET forms become ordinary navigations (#1863)', () => {
  it('serialises fields into the query string', async () => {
    const { window, calls } = installRouter(
      `<form data-stx-form action="/dashboard" method="get">
         <input name="site" value="42"><input name="range" value="30d">
       </form>`,
    )
    submit(window)
    await settle()

    expect(calls[0]?.url).toBe('/dashboard?site=42&range=30d')
    expect(calls[0]?.method).toBe('GET')
  })

  it('puts the submitted query in the address bar', async () => {
    const { window } = installRouter(
      `<form data-stx-form action="/dashboard" method="get"><input name="site" value="42"></form>`,
    )
    submit(window)
    await settle()

    expect(window.location.pathname).toBe('/dashboard')
    expect(window.location.search).toBe('?site=42')
  })

  it('replaces the existing query rather than appending to it', async () => {
    const { window, calls } = installRouter(
      `<form data-stx-form action="/dashboard?stale=1" method="get"><input name="site" value="42"></form>`,
    )
    submit(window)
    await settle()

    expect(calls[0]?.url).toBe('/dashboard?site=42')
  })

  it('defaults the action to the current path', async () => {
    const { window, calls } = installRouter(
      `<form data-stx-form method="get"><input name="q" value="z"></form>`,
    )
    submit(window)
    await settle()

    expect(calls[0]?.url).toBe('/start?q=z')
  })
})

describe('POST forms (#1863)', () => {
  it('sends a urlencoded body by default', async () => {
    const { window, calls } = installRouter(
      `<form data-stx-form action="/subscribe" method="post"><input name="email" value="a@b.c"></form>`,
    )
    submit(window)
    await settle()

    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.url).toBe('/subscribe')
    // Handing FormData to fetch always produces multipart, which a server
    // expecting urlencoded reads as empty.
    expect(calls[0]?.body).toContain('email=a%40b.c')
  })

  it('swaps the response into the container', async () => {
    const { window } = installRouter(
      `<form data-stx-form action="/subscribe" method="post"><input name="email" value="a@b.c"></form>`,
    )
    submit(window)
    await settle()

    expect(window.document.querySelector('main')?.innerHTML).toContain('submitted')
  })

  it('marks the form pending while in flight and clears it after', async () => {
    const { window } = installRouter(
      `<form data-stx-form action="/subscribe" method="post"><input name="email" value="a@b.c"></form>`,
    )
    const form = window.document.querySelector('form')
    submit(window)
    // Synchronously after submit, the request is in flight.
    expect(form.classList.contains('stx-submitting')).toBe(true)
    expect(form.getAttribute('aria-busy')).toBe('true')

    await settle()
    expect(form.classList.contains('stx-submitting')).toBe(false)
    expect(form.hasAttribute('aria-busy')).toBe(false)
  })

  it('includes a named submit button, as a native submit would', async () => {
    // FormData omits the button, so a multi-button form (Save vs Delete) loses
    // the one field that distinguishes them.
    const { window, calls } = installRouter(
      `<form data-stx-form action="/post" method="post">
         <input name="id" value="7">
         <button type="submit" name="action" value="delete">Delete</button>
       </form>`,
    )
    const form = window.document.querySelector('form')
    const button = window.document.querySelector('button')
    const ev = new window.Event('submit', { bubbles: true, cancelable: true })
    Object.defineProperty(ev, 'submitter', { value: button })
    form.dispatchEvent(ev)
    await settle()

    expect(calls[0]?.body).toContain('action=delete')
  })

  it('does not cache the POST response under the action path', async () => {
    // Serving a POST's body later for a GET of the same path would be a lie.
    const { window } = installRouter(
      `<form data-stx-form action="/subscribe" method="post"><input name="email" value="a@b.c"></form>`,
      { cache: true },
    )
    submit(window)
    await settle()

    expect(window.stxRouter.cache['/subscribe']).toBeUndefined()
  })
})
