/**
 * The runtime hand-off keys on what the SERVER declares, not on markers the
 * router hunts for in the fragment (stacksjs/stx#1827).
 *
 * #1809 added the hand-off: a fragment never carries the signals runtime, so
 * swapping one into a page that has none leaves it permanently unhydrated, and
 * a full navigation at least fetches the destination's own runtime. The
 * discriminator was four markers found in the fragment markup — and every one
 * of them originates in a client SCRIPT.
 *
 * A page can need the runtime without having a script anywhere. A
 * `<script server>`-only login form built from `:if` / `x-model` / `:disabled`
 * makes the server ship the runtime, but its fragment carries no marker at all:
 * whatever root marker the page gets lands on `<body>`, and a fragment is the
 * container's inner content. Same for `x-data` on the routed container, whose
 * scope attribute is hoisted into the X-STX-Container-Attrs header.
 *
 * The symptom is worse than dead handlers. The server stamps `x-cloak` on those
 * elements and only the runtime removes it, so server-rendered content sits in
 * the DOM at display:none permanently — with no console error.
 *
 * So the server says so instead, in X-STX-Runtime, carried into the fragment
 * marker as rt=1/rt=0 so it survives the prefetch cache. It is answering a
 * question it knows exactly: did I put a runtime in this page.
 *
 * The markup sniff stays as the fallback for a server too old to declare it,
 * and it must stay narrow — a false positive turns an SPA navigation into a
 * full reload, which is the regression #1809 existed to remove, on precisely
 * the content-heavy sites that have no runtime to begin with.
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

/**
 * The fragment the dev server actually emits for a `<script server>`-only page
 * whose reactivity is `:` / `x-` bindings — the reproducing shape. Note the
 * cloak style arrives as the fragment's first line and `x-cloak` is stamped on
 * the conditional element.
 */
const SCRIPTLESS_REACTIVE_FRAGMENT = `<style data-stx-cloak>[x-cloak]{display:none !important}</style>
<form class="auth">
  <input type="email" x-model="email" placeholder="Email">
  <p :if="error" x-cloak>Invalid credentials</p>
  <button type="submit" :disabled="isLoading">Sign in</button>
</form>
<script data-stx-page>if(window.stx)window.stx._latestSetup=null;<\/script>`

/** Ordinary prose. Carries the cloak style every fragment inlines. */
const CONTENT_FRAGMENT = `<style data-stx-cloak>[x-cloak]{display:none !important}</style>
<article><h1>Features</h1><p>Plain content, no reactivity.</p></article>
<script data-stx-page>if(window.stx)window.stx._latestSetup=null;<\/script>`

interface InstallOpts {
  /** window.stx present — i.e. this page already has the signals runtime. */
  withRuntime?: boolean
  /** What the server declares in X-STX-Runtime. Omit to send no header. */
  declares?: 'true' | 'false'
}

function installRouter(fragment: string, opts: InstallOpts = {}) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(PAGE)
  if (opts.withRuntime)
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
    fetch: async () => new Response(fragment, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/app.stx',
        'X-STX-Layout-Group': 'app',
        ...(opts.declares && { 'X-STX-Runtime': opts.declares }),
      },
    }),
  })

  new Function(getRouterScript())()
  return window as Window & { stxRouter: any }
}

/** Returns the number of completed swaps — 0 means the router handed off. */
async function navigateAndSettle(window: any, url: string) {
  let loads = 0
  window.addEventListener('stx:load', () => { loads++ })
  await window.stxRouter.navigate(url)
  await new Promise(resolve => setTimeout(resolve, 200))
  return loads
}

describe('server-declared runtime need', () => {
  it('hands off when the server says the destination needs a runtime', async () => {
    const window = installRouter(CONTENT_FRAGMENT, { declares: 'true' })
    expect(await navigateAndSettle(window, '/login')).toBe(0)
  })

  it('swaps when the server says it does not, whatever the markup looks like', async () => {
    // The declaration is authoritative in BOTH directions. A server that says
    // no runtime is needed has already decided not to ship one, so a full load
    // would produce the same inert page — at the cost of the whole document.
    const window = installRouter(
      `${CONTENT_FRAGMENT}<div data-stx-reactive>x</div>`,
      { declares: 'false' },
    )
    expect(await navigateAndSettle(window, '/about')).toBe(1)
  })

  it('does not hand off when this page already has the runtime', async () => {
    // The hand-off exists to get a runtime into a page that lacks one. This
    // page has it, so the fragment can hydrate in place.
    const window = installRouter(SCRIPTLESS_REACTIVE_FRAGMENT, { withRuntime: true, declares: 'true' })
    expect(await navigateAndSettle(window, '/login')).toBe(1)
  })
})

describe('fallback sniff, for a server too old to declare it', () => {
  it('catches a scriptless page whose reactivity is : and x- bindings', async () => {
    // The #1827 shape. None of the four original markers appear here — they all
    // come from a client script, and this page has none.
    for (const marker of ['__stx_setup_', 'data-stx-scope=', 'data-stx-reactive'])
      expect(SCRIPTLESS_REACTIVE_FRAGMENT).not.toContain(marker)
    expect(SCRIPTLESS_REACTIVE_FRAGMENT).not.toMatch(/=\s*window\.stx\s*;/)

    const window = installRouter(SCRIPTLESS_REACTIVE_FRAGMENT)
    expect(await navigateAndSettle(window, '/login')).toBe(0)
  })

  it('does not strand server-rendered content behind a stuck x-cloak', async () => {
    // The user-visible failure, stated as the counterfactual so it cannot pass
    // vacuously. A page WITH the runtime is allowed to receive cloaked markup —
    // its runtime uncloaks it on bind. A page without one must never receive
    // it, because nothing there will ever remove the attribute: the error text
    // would sit in the DOM at display:none for the life of the page.
    const cloaked = (w: any) => w.document.querySelectorAll('[x-cloak]').length

    const hydrated = installRouter(SCRIPTLESS_REACTIVE_FRAGMENT, { withRuntime: true })
    await navigateAndSettle(hydrated, '/login')
    expect(hydrated.document.body.innerHTML).toContain('Invalid credentials')
    expect(cloaked(hydrated)).toBe(1)

    const bare = installRouter(SCRIPTLESS_REACTIVE_FRAGMENT)
    await navigateAndSettle(bare, '/login')
    expect(bare.document.body.innerHTML).not.toContain('Invalid credentials')
    expect(cloaked(bare)).toBe(0)
  })

  it('still catches the original four markers', async () => {
    const cases = [
      '<main data-stx="__stx_setup_abc">x</main>',
      '<section data-stx-scope="__stx_scope_0">x</section>',
      '<div data-stx-reactive>x</div>',
      '<script data-stx-scoped>var { state } = window.stx;<\/script>',
    ]
    for (const frag of cases) {
      const window = installRouter(`<section data-stx-content>${frag}</section>`)
      expect(await navigateAndSettle(window, '/pricing')).toBe(0)
    }
  })

  it('leaves ordinary content alone', async () => {
    const window = installRouter(CONTENT_FRAGMENT)
    expect(await navigateAndSettle(window, '/features')).toBe(1)
    expect(window.document.body.innerHTML).toContain('Features')
  })

  it('does not fire on directive syntax quoted as documentation', async () => {
    // Docs are both the largest population of runtime-less pages and the
    // likeliest to contain directive syntax as literal CONTENT. Full-reloading
    // every hop through them is the regression #1809 removed.
    const window = installRouter(`<article>
  <h1>The :if directive</h1>
  <pre><code>&lt;div :if="open" x-text="name"&gt;&lt;/div&gt;</code></pre>
  <p>Write <code>@click="submit()"</code> to bind a handler.</p>
  <p>Mail us at <a href="mailto:hi@stacks.test">hi@stacks.test</a>.</p>
</article>`)
    expect(await navigateAndSettle(window, '/docs/directives')).toBe(1)
  })

  it('ignores directive-looking text inside a script body', async () => {
    // Proves the inert-region stripping actually runs. A data block or an
    // inline handler string is not markup, and every fragment carries at least
    // one script of its own.
    const window = installRouter(`<article><h1>Docs</h1></article>
<script type="application/json">{"snippet": "<div :if=\\"open\\" x-text=\\"name\\">{{ x }}</div>"}<\/script>`)
    expect(await navigateAndSettle(window, '/docs')).toBe(1)
  })

  it('is not fooled by colons and ats that are not attributes', async () => {
    const window = installRouter(`<article>
  <svg xmlns:xlink="http://www.w3.org/2000/svg"><use xlink:href="#i"></use></svg>
  <p style="background: red; color: blue">Doors open at 10:00.</p>
  <time datetime="2026-08-05 09:30">today</time>
  <span data-json='{"ratio": "16:9"}'>video</span>
</article>`)
    expect(await navigateAndSettle(window, '/features')).toBe(1)
  })
})

describe('the sniff regexes themselves', () => {
  it('emits single-escaped regexes, not the template-literal-eaten form', () => {
    // The file is one big template literal, so every regex escape is written
    // doubled. A missed pair ships /s+/ — which matches the letter "s" — and
    // fails silently (CLAUDE.md item 41).
    const src = getRouterScript()
    expect(src).toContain('/\\s(?::[a-z][\\w-]*|@[a-z][\\w.-]*|x-[a-z][\\w-]*)\\s*=\\s*["\']/i')
    expect(src).not.toContain('\\\\s(?::[a-z]')
  })

  it('parses as executable JavaScript', () => {
    const src = getRouterScript().replace(/^<script[^>]*>|<\/script>$/g, '')
    expect(() => new Function(src)).not.toThrow()
  })

  it('emits no raw script close tag, so stripping cannot end the document early', () => {
    // stripInertRegions has to name <script> to remove its body. Emitting that
    // close tag unsplit would terminate the router's OWN script element at the
    // first occurrence, truncating everything after it.
    expect(getRouterScript().includes('</script>')).toBe(false)
  })
})
