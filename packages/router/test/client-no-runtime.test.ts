/**
 * SPA navigation works on a page with no signals runtime (stacksjs/stx#1809).
 *
 * The router ships on every page. The signals runtime only ships on pages that
 * have a `<script client>`. A debug log in the fragment-swap path read
 * `window.stx._latestSetup` with no guard, so on any runtime-less page the swap
 * threw, the fetch path caught it, and the navigation fell back to
 * `location.href` — a full document load.
 *
 * `log()` is gated on the debug flag, but its ARGUMENTS are evaluated at the
 * call site whether or not it logs, so the throw happened for everyone. Same
 * shape as the `bindIf` debug log that aborted hydration: a diagnostic taking
 * down the thing it was diagnosing.
 *
 * It is source-dependent, not target-dependent, which is what made it look
 * random: the same target page swapped cleanly from a page that had a client
 * script and reloaded from one that did not. Content-heavy sites are worst
 * affected — marketing and docs pages have no client script by design, so the
 * router was disabled on exactly the pages that most want prefetch.
 *
 * The fix is to guard the read, not to ship the runtime everywhere: every
 * FUNCTIONAL window.stx use in the router (_cleanupContainer, .router) was
 * already guarded. This one log was the sole reader that assumed otherwise.
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

const PAGE = `
  <html>
    <head>
      <meta name="stx-layout" content="layouts/app.stx">
      <meta name="stx-layout-group" content="app">
    </head>
    <body><main>Home</main></body>
  </html>
`

const FRAGMENT = '<section data-stx-content><h1>Features</h1></section>'

/**
 * Install the router with `withRuntime` controlling whether window.stx exists.
 * A content page that has no `<script client>` never gets the signals runtime,
 * so window.stx is genuinely absent — not an empty object.
 */
function installRouter(withRuntime: boolean) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(PAGE)
  if (withRuntime)
    (window as any).stx = {}
  ;(window as any).__stxRouterConfig = {
    cache: false,
    prefetch: false,
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
    DOMParser: window.DOMParser,
    fetch: async () => new Response(FRAGMENT, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/app.stx',
        'X-STX-Layout-Group': 'app',
      },
    }),
  })

  new Function(getRouterScript())()
  return window as Window & { stxRouter: any }
}

/**
 * Navigate and report whether the swap ran to completion.
 *
 * `stx:load` is dispatched on the line AFTER the crashing read, and the script
 * injection that precedes it still happens either way — so the event, not the
 * injected scripts, is what separates a completed swap from an aborted one.
 */
async function navigateAndSettle(window: any, url: string) {
  let loads = 0
  window.addEventListener('stx:load', () => { loads++ })
  await window.stxRouter.navigate(url)
  await new Promise(resolve => setTimeout(resolve, 200))
  return loads
}

describe('router on a page with no signals runtime', () => {
  it('completes a fragment swap when window.stx is absent', async () => {
    const window = installRouter(false)
    expect((window as any).stx).toBeUndefined()

    const loads = await navigateAndSettle(window, '/features')

    expect(loads).toBe(1)
    expect(window.document.body.innerHTML).toContain('Features')
  })

  it('does not fall back to a full document load', async () => {
    // The user-visible cost: state, scroll and stores all lost on a navigation
    // that was supposed to be a swap.
    const window = installRouter(false)
    await navigateAndSettle(window, '/features')

    expect(window.location.pathname).toBe('/features')
    expect(window.document.querySelector('main')).not.toBeNull()
  })

  it('still works on a page that does have the runtime', async () => {
    const window = installRouter(true)
    const loads = await navigateAndSettle(window, '/features')

    expect(loads).toBe(1)
    expect(window.document.body.innerHTML).toContain('Features')
  })

  it('navigates repeatedly without the runtime', async () => {
    // The reported case is a whole section of a site with no client script, so
    // the second hop matters as much as the first.
    const window = installRouter(false)
    await navigateAndSettle(window, '/features')
    const loads = await navigateAndSettle(window, '/features/goals')

    expect(loads).toBe(1)
    expect(window.location.pathname).toBe('/features/goals')
  })

  it('reads no window.stx property without guarding it first', () => {
    // Structural, and the durable half. Every functional read is already
    // guarded; regressions arrive as diagnostics, whose arguments evaluate even
    // when the log itself is disabled. A guard must appear shortly before each
    // property access — either `window.stx&&` or `if(window.stx)`.
    const src = getRouterScript()
    const unguarded: string[] = []
    for (let i = src.indexOf('window.stx.'); i !== -1; i = src.indexOf('window.stx.', i + 1)) {
      // Skip string literals — the run-contract sniff matches the TEXT
      // "window.stx.mount" inside a page script, which reads nothing.
      if (/['"`]/.test(src[i - 1] || ''))
        continue
      const preceding = src.slice(Math.max(0, i - 160), i)
      if (!preceding.includes('window.stx&&') && !preceding.includes('if(window.stx)'))
        unguarded.push(src.slice(i, i + 60).split('\n')[0].trim())
    }
    expect(unguarded).toEqual([])
  })
})
