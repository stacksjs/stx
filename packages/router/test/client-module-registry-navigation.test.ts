/**
 * A layout-changing navigation carries the page's module registry, and runs
 * it first (stacksjs/stx#1957).
 *
 * The registry (`<script data-stx-modules>`) is the one bundle a page's
 * components read their imported modules from. It is spliced in right after
 * the signals runtime, and a layout with a `<head>` script of its own (an
 * analytics tag) pulls the runtime -- and the registry with it -- into
 * `<head>`. The full-document path, taken whenever the layout changes,
 * collected only setup functions from `<head>`, so the registry never ran.
 *
 * Reported on hq.training: home (marketing layout) to /login (auth layout).
 * The login setup threw `module "resources/functions/browser.ts" is not
 * registered on this page`, and its template hydrated against globals: the
 * email field, `<input id="email">` bound to `:model="email"`, showed
 * "[object HTMLInputElement]", and the submit button rendered empty. Only in
 * production, the one environment with the analytics tag; in development the
 * runtime stays in `<body>`, where the registry was carried along.
 *
 * very-happy-dom does not execute injected scripts, so the tests read the
 * order the router CREATES them in, which is the order it runs them. The
 * layout's own head script is inline here: an external one would hold the
 * swap on a load event very-happy-dom never fires.
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
  Node: globalThis.Node,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

/** What buildModuleRegistryScript emits, reduced to its recognisable shape. */
const REGISTRY = `;(function() {
  var __stxBundles = globalThis.__stxModuleBundles || (globalThis.__stxModuleBundles = {});
  if (__stxBundles["abc123"]) return;
  __stxBundles["abc123"] = true;
  globalThis.__stxModules = globalThis.__stxModules || {};
  globalThis.__stxModules["resources/functions/browser.ts"] = { copyText: function() {} };
})();`

/** A page setup that imports from the registry, as the bundler rewrites it. */
const SETUP = `function __stx_setup_login() {
  var __stxMod0 = globalThis.__stxModules && globalThis.__stxModules["resources/functions/browser.ts"];
  if (__stxMod0 === undefined) throw new Error("not registered");
  return {}
}
window.stx._latestSetup = __stx_setup_login`

/**
 * `<body>` carries no attributes on purpose: very-happy-dom's attribute
 * collection yields nameless entries, and the router's body-attribute copy
 * would throw on them (see client-document-runtime-handoff.test.ts).
 */
function loginDocument(registryInHead: boolean): string {
  const registry = `<script data-stx-scoped data-stx-run="always" data-stx-modules>${REGISTRY}<\/script>`
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="stx-layout" content="layouts/auth.stx">
    <meta name="stx-layout-group" content="auth">
    <script data-stx-runtime src="/_stx/runtime.js"><\/script>
    ${registryInHead ? registry : ''}
    <script>window.analyticsLoaded = true<\/script>
  </head>
  <body>
    ${registryInHead ? '' : registry}
    <main data-stx-content><form><input id="email"></form>
      <script data-stx-scoped>${SETUP}<\/script>
    </main>
  </body>
</html>`
}

function installRouter(responseHtml: string) {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`
    <html>
      <head>
        <meta name="stx-layout" content="layouts/marketing.stx">
        <meta name="stx-layout-group" content="marketing">
      </head>
      <body><main>Home</main></body>
    </html>
  `)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false }

  // Every script the router creates, in creation order.
  const created: any[] = []
  const createElement = window.document.createElement.bind(window.document)
  ;(window.document as any).createElement = (tag: string, ...rest: any[]) => {
    const el = (createElement as any)(tag, ...rest)
    if (String(tag).toLowerCase() === 'script')
      created.push(el)
    return el
  }

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    // A full document: the layout group changes, so the router swaps the body.
    fetch: async () => new Response(responseHtml, { status: 200, headers: { 'Content-Type': 'text/html' } }),
  })

  new Function(getRouterScript())()
  return { window: window as Window & { stxRouter: any }, created }
}

/** The page scripts the router ran, labelled, in the order it ran them. */
async function runOrder(responseHtml: string): Promise<string[]> {
  const { window, created } = installRouter(responseHtml)
  await window.stxRouter.navigate('/login')
  await new Promise(r => setTimeout(r, 200))
  return created
    .filter(s => s.hasAttribute && s.hasAttribute('data-stx-page'))
    .map((s) => {
      const text = String(s.textContent || '')
      if (text.includes('__stxModuleBundles')) return 'registry'
      if (text.includes('__stx_setup_login')) return 'setup'
      return 'other'
    })
}

describe('router: a layout change carries the module registry (#1957)', () => {
  it('runs a registry that sits in <head>, before the page setup that imports from it', async () => {
    expect(await runOrder(loginDocument(true))).toEqual(['registry', 'setup'])
  })

  it('still runs one that sits in <body>, first', async () => {
    expect(await runOrder(loginDocument(false))).toEqual(['registry', 'setup'])
  })
})

/**
 * A same-layout navigation takes the fragment path, which lists the scripts
 * in document order. The registry is emitted after the content it serves, so
 * a component that imports a package (the default `<Video>`, reading
 * `ts-video-player/elements`) ran ahead of it and threw "is not registered on
 * this page": the player element was never defined. Seen on hq.training's
 * phone app, navigating from Today to a page with a video.
 */
const COMPONENT = `var __stxMod0 = globalThis.__stxModules && globalThis.__stxModules["npm:ts-video-player/elements"];
if (__stxMod0 === undefined) throw new Error("not registered");`

const FRAGMENT = `<div data-stx-scope="stx_video_1"><video-player></video-player></div>
<script data-stx-scoped data-stx-run="always" data-stx-instance="stx_video_1">${COMPONENT}<\/script>
<script data-stx-page>function __stx_setup_video() { return {} }
window.stx._latestSetup = __stx_setup_video<\/script>
<script data-stx-scoped data-stx-run="always" data-stx-modules>${REGISTRY}<\/script>`

async function fragmentRunOrder(): Promise<string[]> {
  const window = new Window({ url: 'http://localhost/' })
  window.document.write(`
    <html>
      <head>
        <meta name="stx-layout" content="layouts/mobile.stx">
        <meta name="stx-layout-group" content="mobile">
      </head>
      <body><main>Today</main></body>
    </html>
  `)
  ;(window as any).stx = {}
  ;(window as any).__stxRouterConfig = { cache: false, prefetch: false, progress: false, viewTransitions: false }
  const created: any[] = []
  const createElement = window.document.createElement.bind(window.document)
  ;(window.document as any).createElement = (tag: string, ...rest: any[]) => {
    const el = (createElement as any)(tag, ...rest)
    if (String(tag).toLowerCase() === 'script')
      created.push(el)
    return el
  }
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    Node: window.Node,
    fetch: async () => new Response(FRAGMENT, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': 'layouts/mobile.stx',
        'X-STX-Layout-Group': 'mobile',
        'X-STX-Runtime': 'true',
      },
    }),
  })
  new Function(getRouterScript())()
  await (window as any).stxRouter.navigate('/m/video')
  await new Promise(r => setTimeout(r, 200))
  return created
    .filter(s => s.hasAttribute && s.hasAttribute('data-stx-page'))
    .map((s) => {
      const text = String(s.textContent || '')
      if (text.includes('__stxModuleBundles')) return 'registry'
      if (text.includes('__stx_setup_video')) return 'setup'
      if (text.includes('ts-video-player/elements')) return 'component'
      return 'other'
    })
}

describe('router: a fragment runs the module registry first (#1957)', () => {
  it('runs the registry before the components that import from it, and the page setup last', async () => {
    expect(await fragmentRunOrder()).toEqual(['registry', 'component', 'setup'])
  })
})
