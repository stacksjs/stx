/**
 * The re-run fallback asks what a script REGISTERS, not how it is spelled
 * (stacksjs/stx#1828).
 *
 * `data-stx-run` is the primary signal (#1773). The fallback exists for scripts
 * that arrive without it, and it decided by looking at the first character of
 * the body: `(` or `;` meant "re-run me". A scoped script that opened with a
 * comment therefore looked run-once and was deduplicated, so on the second
 * navigation onward its scope was never re-registered and the component stopped
 * hydrating — silently, since nothing errors.
 *
 * That was live. The x-data reactive bridge emits its `initScope` calls in a
 * script whose body begins `// STX Reactive Runtime`, so it was deduped on
 * every revisit.
 *
 * The obvious repair — strip leading comments, then test the first character —
 * is wrong in the expensive direction, and these tests pin that too. Three
 * emitters open with a comment and MUST NOT re-run: the animation scripts
 * register matchMedia and DOMContentLoaded listeners plus an
 * IntersectionObserver, and the STX lifecycle runtime owns a Map of live
 * component instances. Comment-stripping flips all three to re-running on every
 * navigation, leaking a listener and an observer per hop and resetting the
 * instance registry. It would trade a silent missing component for a silent
 * leak.
 *
 * What separates the two groups is not punctuation, it is whether
 * cleanupContainer tore down what the script registered — and that is
 * detectable: it deletes `window.stx._scopes` entries, element disposers and
 * destroy hooks.
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

/**
 * Pull the REAL runsAlways out of the generated script and make it callable.
 *
 * Throws rather than returning a stub if either piece is missing. A test that
 * locates code by searching generated text and quietly finds nothing becomes a
 * test that passes because it checked nothing (CLAUDE.md item 41).
 */
function generatedRunsAlways(): (declared: string, code: string) => boolean {
  const src = getRouterScript()
  const registers = /var REGISTERS_SCOPE=[^;]+;/.exec(src)
  const fn = /function runsAlways\(declared,code\)\{[\s\S]*?\n?\}/.exec(src)
  if (!registers)
    throw new Error('REGISTERS_SCOPE not found in the generated router script')
  if (!fn)
    throw new Error('runsAlways not found in the generated router script')
  // eslint-disable-next-line no-new-func
  return new Function(`${registers[0]}\n${fn[0]}; return runsAlways`)() as never
}

describe('the unstamped fallback', () => {
  const runsAlways = generatedRunsAlways()

  it('re-runs a script that registers a scope, whatever it starts with', () => {
    // Each of these opens with something the first-character test rejects.
    const registering = [
      '// STX Reactive Runtime\n(function(){ __stx_reactive.initScope(el, {}, [], {}, null) })()',
      '/* scope */ (function(){ window.stx._scopes["a"] = {} })()',
      'const s = 1; window.stx._scopes["b"] = {}',
      '!function(){ window.stx.mount(function(){ return {} }) }()',
    ]
    for (const code of registering)
      expect(runsAlways('', code)).toBe(true)
  })

  it('re-runs a repeated component factory call', () => {
    // The one scope registration the sniff could not see. A component used
    // twice on a page emits one of these per instance, and each registers the
    // scope for its own root. It opens with `window.`, so the first-character
    // test rejected it and every instance was deduped from the first SPA
    // return onward.
    expect(runsAlways('', 'window.__stxComponentFactories["6e1e4d3e"]("stx_counter_1_abc123");')).toBe(true)
  })

  it('does not re-run a script that only registers listeners', () => {
    // The regression the obvious fix would have caused. Both open with a
    // comment and neither touches a scope.
    const once = [
      '// Motion preferences handling\n(function(){ window.matchMedia("x").addEventListener("change", function(){}) })()',
      '// STX Lifecycle Runtime\n(function(){ const instances = new Map(); window.STX = { instances } })()',
      '// observer\n(function(){ new IntersectionObserver(function(){}) })()',
    ]
    for (const code of once)
      expect(runsAlways('', code)).toBe(false)
  })

  it('keeps the original shapes it already accepted', () => {
    // A page from an older server must behave exactly as before.
    expect(runsAlways('', '(function(){ var a = 1 })()')).toBe(true)
    expect(runsAlways('', ';(function(){ var a = 1 })()')).toBe(true)
    expect(runsAlways('', 'window.stx.mount(function(){})')).toBe(true)
  })

  it('lets the declaration win over anything it would infer', () => {
    expect(runsAlways('once', 'window.stx._scopes["a"] = {}')).toBe(false)
    expect(runsAlways('always', '// nothing here')).toBe(true)
  })
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

/** 1 = the router re-injected it on the latest navigation; 0 = it was deduped. */
function injected(window: any, needle: string): number {
  return Array.from(window.document.querySelectorAll('script[data-stx-page]'))
    .filter((s: any) => (s.textContent || '').includes(needle)).length
}

describe('end to end, on the second navigation', () => {
  it('re-registers a scope whose script opens with a comment', async () => {
    // The reported failure, as the reactive bridge actually emits it.
    const window = installRouter(
      '<section><script data-stx-scoped>// STX Reactive Runtime\n'
      + '(function(){ __stx_reactive.initScope(SENTINEL_BRIDGE) })()<\/script>Body</section>',
    )
    await navigateTwice(window)

    expect(injected(window, 'SENTINEL_BRIDGE')).toBe(1)
  })

  it('re-invokes a repeated component factory on a revisit', async () => {
    // End to end, the reported failure. The shared factory PRELUDE was already
    // marked always — but the prelude only re-registers the factory, and
    // nothing invokes it. Skipping the CALL leaves the scope unregistered, and
    // the stx:load walk then bails at `if (!scopeVars) return`, so the
    // component renders with empty :text and inert @click and reports nothing.
    const window = installRouter(
      '<section>'
      + '<script data-stx-scoped data-stx-run="always">SENTINEL_PRELUDE()<\/script>'
      + '<script data-stx-scoped data-stx-run="always">window.__stxComponentFactories["h"]("SENTINEL_CALL_1")<\/script>'
      + '<script data-stx-scoped data-stx-run="always">window.__stxComponentFactories["h"]("SENTINEL_CALL_2")<\/script>'
      + 'Body</section>',
    )
    await navigateTwice(window)

    expect(injected(window, 'SENTINEL_CALL_1')).toBe(1)
    expect(injected(window, 'SENTINEL_CALL_2')).toBe(1)
  })

  it('re-invokes an unstamped factory call too, for an older server', async () => {
    const window = installRouter(
      '<section><script data-stx-scoped>window.__stxComponentFactories["h"]("SENTINEL_LEGACY")<\/script>Body</section>',
    )
    await navigateTwice(window)

    expect(injected(window, 'SENTINEL_LEGACY')).toBe(1)
  })

  it('still dedups a comment-first script that registers only listeners', async () => {
    const window = installRouter(
      '<section><script data-stx-scoped>// Motion preferences handling\n'
      + '(function(){ SENTINEL_MOTION.addEventListener("change", function(){}) })()<\/script>Body</section>',
    )
    await window.stxRouter.navigate('/a')
    await new Promise(r => setTimeout(r, 200))
    const first = injected(window, 'SENTINEL_MOTION')

    await window.stxRouter.navigate('/b')
    await new Promise(r => setTimeout(r, 200))

    expect(first).toBe(1)
    expect(injected(window, 'SENTINEL_MOTION')).toBe(0)
  })
})
