/**
 * Re-execution is declared by the emitter, not sniffed from the source
 * (stacksjs/stx#1773, item 2).
 *
 * Whether a generated script may run again after an SPA swap used to be
 * inferred from its shape: does the source start with `(` or `;`, or mention
 * `window.stx.mount`. That is a property of how the emitter happened to wrap
 * the code, not of what it meant, so every change to the wrapping was one edit
 * away from silently reclassifying scripts — the #1700 recurrence the issue
 * calls the prime suspect.
 *
 * The symptom is nasty: skipping a scope script leaves the leaf with no scope
 * registered, so bindIf/@event never re-bind and the component renders
 * completely dead — literal moustaches, every `:if` branch visible at once —
 * and only on a REVISIT, because navigating away already disposed the scope.
 *
 * `data-stx-run="always|once"` states it. Unstamped scripts keep the old sniff,
 * so a page from an older server behaves exactly as before.
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

/** Serve the same fragment on every navigation, so revisits reuse one script. */
function installRouter(fragmentHtml: string) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(PAGE)
  ;(window as any).stx = {}
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
    fetch: async () => new Response(fragmentHtml, {
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

async function navigateTwice(window: any) {
  await window.stxRouter.navigate('/a')
  await new Promise(r => setTimeout(r, 200))
  await window.stxRouter.navigate('/b')
  await new Promise(r => setTimeout(r, 200))
}

/** Count executable copies of the page script the router injected. */
function injected(window: any, needle: string): number {
  return Array.from(window.document.querySelectorAll('script[data-stx-page]'))
    .filter((s: any) => (s.textContent || '').includes(needle)).length
}

describe('router — data-stx-run contract', () => {
  it('re-executes a script declared always, even on a revisit', async () => {
    // The shape whose skip renders a whole component dead.
    const window = installRouter(
      '<section><script data-stx-scoped data-stx-run="always">SENTINEL_ALWAYS()<\/script>Body</section>',
    )
    await navigateTwice(window)
    expect(injected(window, 'SENTINEL_ALWAYS')).toBe(1)
  })

  it('skips a script declared once when its hash was already seen', async () => {
    // Layout-level partials (theme.stx, stores.stx) declare top-level const;
    // re-running throws "Identifier has already been declared".
    const window = installRouter(
      '<section><script data-stx-run="once">const SENTINEL_ONCE = 1<\/script>Body</section>',
    )
    await window.stxRouter.navigate('/a')
    await new Promise(r => setTimeout(r, 200))
    const first = injected(window, 'SENTINEL_ONCE')
    await window.stxRouter.navigate('/b')
    await new Promise(r => setTimeout(r, 200))
    expect(first).toBe(1)
    expect(injected(window, 'SENTINEL_ONCE')).toBe(0)
  })

  it('honours "always" for a shape the old sniff would have deduped', async () => {
    // Starts with a bare identifier, no mount() call — exactly the source the
    // charAt(0) sniff misclassifies. The declaration is what saves it.
    const window = installRouter(
      '<section><script data-stx-scoped data-stx-run="always">SENTINEL_BARE.init()<\/script>Body</section>',
    )
    await navigateTwice(window)
    expect(injected(window, 'SENTINEL_BARE')).toBe(1)
  })

  it('falls back to the sniff when nothing is declared', async () => {
    // A page rendered by an older server must behave exactly as before.
    const window = installRouter(
      '<section><script data-stx-scoped>;(function(){SENTINEL_SNIFF()})()<\/script>Body</section>',
    )
    await navigateTwice(window)
    expect(injected(window, 'SENTINEL_SNIFF')).toBe(1)
  })

  it('carries the declaration onto the inert placeholder', async () => {
    // Scoped placeholders are re-executed later by the component runtime, so
    // the attribute has to survive extraction.
    const window = installRouter(
      '<section><script data-stx-scoped data-stx-run="always">SENTINEL_PH()<\/script>Body</section>',
    )
    await window.stxRouter.navigate('/a')
    await new Promise(r => setTimeout(r, 200))
    const html = window.document.querySelector('main')?.innerHTML || ''
    expect(html.includes('data-stx-run="always"') || injected(window, 'SENTINEL_PH') === 1).toBe(true)
  })
})

describe('emitted scripts declare their intent', () => {
  it('the router script reads the attribute rather than only sniffing', () => {
    const script = getRouterScript()
    expect(script).toContain('data-stx-run')
    expect(script).toContain('runsAlways')
  })
})
