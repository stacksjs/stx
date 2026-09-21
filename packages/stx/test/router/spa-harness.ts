/**
 * A browser for SPA navigation tests that drives the whole pipeline instead of
 * a hand-built fragment.
 *
 * The app's pages are rendered by processDirectives with the real router
 * script injected, the way the dev server's buildPage does it, and each page
 * is rendered once, as in production. A page loads into very-happy-dom with
 * the real signals runtime and router, and navigation goes through the real
 * router against a fake server that answers the way the stx servers do.
 *
 * very-happy-dom executes no scripts at all, so the harness does what a
 * browser does:
 *
 *   - scripts in the parsed document run in document order, with
 *     document.currentScript set, while readyState is loading; then
 *     DOMContentLoaded and load fire
 *   - a script created with createElement runs when it is inserted with
 *     appendChild, insertBefore or replaceChild, which is how the router and
 *     the runtime execute what they inject
 *   - scripts that arrive through innerHTML stay inert, as they do in a
 *     browser; the router relies on that
 *
 * Two more gaps are filled: the attribute shim (very-happy-dom keeps
 * attributes in a Map, the runtime reads a NamedNodeMap) is applied to
 * everything that brings elements in, and ids are looked up as [id="..."]
 * because very-happy-dom's #id index misses an element that :if detached and
 * inserted again.
 */
import path from 'node:path'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { Window } from 'very-happy-dom'
import { extractContainerContent, extractLayoutMetadata } from '../../src/app-shell'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { injectRouterScript, pageShipsSignalsRuntime } from '../../src/runtime-injection'
import { shimAttributes } from '../../src/testing'

export const BASE = 'http://localhost'

// ---------------------------------------------------------------------------
// The app
// ---------------------------------------------------------------------------

export interface SpaApp {
  /** Every route's whole rendered document. */
  documents: Map<string, string>
  dispose: () => Promise<void>
}

/** A layout with the chrome around the router's container. */
export function layout(chrome: string, containerAttrs = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Harness</title>
</head>
<body>
  ${chrome}
  <main${containerAttrs}>
    @yield('content')
  </main>
</body>
</html>
`
}

/** A page that extends `layouts/<layoutName>` with `body` as its content. */
export function page(layoutName: string, body: string): string {
  return `@extends('layouts/${layoutName}')
@section('content')
${body}
@endsection
`
}

/**
 * Write `files` into a temp app and render every route, the way the dev
 * server's buildPage does it: processDirectives, then the router script.
 */
export async function renderApp(files: Record<string, string>, routes: Record<string, string>): Promise<SpaApp> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-spa-harness-'))
  for (const [rel, source] of Object.entries(files))
    await Bun.write(path.join(dir, rel), source)

  const config = {
    ...defaultConfig,
    autoShell: true,
    cache: false,
    componentsDir: path.join(dir, 'components'),
    layoutsDir: path.join(dir, 'layouts'),
    partialsDir: path.join(dir, 'partials'),
  } as any

  const documents = new Map<string, string>()
  for (const [route, rel] of Object.entries(routes)) {
    const file = path.join(dir, rel)
    const context = {
      __filename: file,
      __dirname: path.dirname(file),
      params: {},
      __stx_runtime_head: {},
    }
    const html = await processDirectives(await Bun.file(file).text(), context, file, config, new Set<string>())
    documents.set(route, await injectRouterScript(html, { router: config.router } as any))
  }

  return {
    documents,
    dispose: () => rm(dir, { recursive: true, force: true }),
  }
}

// ---------------------------------------------------------------------------
// The server
// ---------------------------------------------------------------------------

/**
 * How the fake server answers a router request.
 *
 *   - fragment: extractContainerContent of the whole rendered page, which is
 *     what production-builder.ts writes as the route's fragment, with the
 *     headers the servers send alongside one
 *   - document: the whole document, which is what a non-shell serveApp sends
 *     an SPA request, so the router takes its full-document path
 *
 * A request without X-STX-Router always gets the whole document.
 */
export type ServeMode = 'fragment' | 'document'

function serverFetch(app: SpaApp, requests: string[], mode: ServeMode) {
  return async (input: unknown, init: { headers?: Record<string, string> } = {}): Promise<Response> => {
    const url = new URL(String(input), BASE)
    const full = app.documents.get(url.pathname)
    const wantsFragment = new Headers(init.headers).get('X-STX-Router') === 'true'
    requests.push(`${wantsFragment ? 'fragment' : 'document'} ${url.pathname}`)
    if (!full)
      return new Response('Not Found', { status: 404 })
    if (!wantsFragment || mode === 'document')
      return new Response(full, { headers: { 'Content-Type': 'text/html' } })

    const meta = extractLayoutMetadata(full)
    const title = (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(full)?.[1] ?? '').trim()
    return new Response(extractContainerContent(full, 'main'), {
      headers: {
        'Content-Type': 'text/html',
        'X-STX-Fragment': 'true',
        'X-STX-Layout': meta.layout,
        'X-STX-Layout-Group': meta.group,
        'X-STX-Runtime': pageShipsSignalsRuntime(full) ? 'true' : 'false',
        ...(title && { 'X-STX-Title': encodeURIComponent(title) }),
      },
    })
  }
}

// ---------------------------------------------------------------------------
// The browser
// ---------------------------------------------------------------------------

const GLOBAL_KEYS = [
  'window',
  'document',
  'location',
  'history',
  'navigator',
  'Node',
  'NodeFilter',
  'Event',
  'CustomEvent',
  'DOMParser',
  'MutationObserver',
  'requestAnimationFrame',
  'fetch',
] as const

export interface Browser {
  window: any
  document: any
  /** Every script that threw, the way a browser reports them: without stopping anything. */
  errors: string[]
  /** Every request the router made, in order, by what it asked for. */
  requests: string[]
  /** Navigate through the router and wait for the destination to hydrate. */
  navigate: (to: string) => Promise<void>
  teardown: () => void
}

export interface BootOptions {
  serve?: ServeMode
  /** Set on window before any script runs, e.g. counters a component bumps. */
  globals?: Record<string, unknown>
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/** Long enough for the debounced stx:load (5ms) and a deferred :if subtree. */
export function settle(): Promise<void> {
  return sleep(30)
}

let active: Browser | null = null

/** Undo the current browser's patches; call it from afterEach. */
export function closeBrowser(): void {
  active?.teardown()
  active = null
}

/** Load `pathname` as a browser would, then hand back a way to drive it. */
export async function boot(app: SpaApp, pathname: string, options: BootOptions = {}): Promise<Browser> {
  closeBrowser()
  const html = app.documents.get(pathname)
  if (!html)
    throw new Error(`no rendered document for ${pathname}`)

  const window: any = new Window({ url: `${BASE}${pathname}` })
  const document = window.document
  const errors: string[] = []
  const requests: string[] = []

  const saved = new Map<string, PropertyDescriptor | undefined>()
  for (const key of GLOBAL_KEYS)
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
  const setGlobal = (key: string, value: unknown) => {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true, enumerable: true })
  }
  setGlobal('window', window)
  setGlobal('document', document)
  setGlobal('location', window.location)
  setGlobal('history', window.history)
  setGlobal('navigator', window.navigator)
  setGlobal('Node', window.Node)
  setGlobal('NodeFilter', window.NodeFilter)
  setGlobal('Event', window.Event)
  setGlobal('CustomEvent', window.CustomEvent)
  // The full-document swap reads attributes off parsed elements
  // (newBody.attributes), so parsed documents get the same attribute shim.
  const BaseParser = window.DOMParser
  class ShimmedParser extends BaseParser {
    parseFromString(markup: string, type: string) {
      const parsed = super.parseFromString(markup, type)
      shimAttributes(parsed.documentElement)
      return parsed
    }
  }
  window.DOMParser = ShimmedParser
  setGlobal('DOMParser', ShimmedParser)
  setGlobal('MutationObserver', window.MutationObserver)
  setGlobal('requestAnimationFrame', (cb: () => void) => setTimeout(cb, 0))
  const fetchImpl = serverFetch(app, requests, options.serve ?? 'fragment')
  setGlobal('fetch', fetchImpl)
  window.fetch = fetchImpl

  for (const [key, value] of Object.entries(options.globals ?? {}))
    window[key] = value

  let currentScript: any = null
  Object.defineProperty(document, 'currentScript', { configurable: true, get: () => currentScript })
  const executed = new WeakSet<object>()
  const runScript = (el: any): void => {
    if (executed.has(el))
      return
    executed.add(el)
    if (el.getAttribute('src'))
      return
    const type = (el.getAttribute('type') || '').trim().toLowerCase()
    if (type && type !== 'text/javascript' && type !== 'application/javascript' && type !== 'module')
      return
    const code = el.textContent || ''
    if (!code.trim())
      return
    const previous = currentScript
    currentScript = el
    try {
      // eslint-disable-next-line no-new-func
      new Function(code)()
    }
    catch (error) {
      errors.push(`${(el.getAttribute('data-stx-route-script') || el.getAttribute('data-stx-page') !== null) ? 'injected' : 'parsed'} script: ${String(error)}`)
    }
    finally {
      currentScript = previous
    }
  }

  // Scripts a browser would execute on insertion: made by createElement.
  const created = new WeakSet<object>()
  const originalCreateElement = document.createElement
  document.createElement = function (this: any, tag: string, ...rest: unknown[]) {
    const el = originalCreateElement.call(this, tag, ...rest)
    if (String(tag).toLowerCase() === 'script')
      created.add(el)
    shimAttributes(el)
    return el
  }
  const maybeRun = (node: any): void => {
    if (node && node.tagName === 'SCRIPT' && created.has(node) && node.isConnected)
      runScript(node)
  }

  // The element prototype is shared by every Window in the process, so each
  // patch is undone in teardown.
  const proto = Object.getPrototypeOf(document.body)
  const restores: Array<() => void> = []
  const wrap = (name: string, after: (self: any, args: any[], result: any) => void) => {
    const original = proto[name]
    proto[name] = function (this: any, ...args: any[]) {
      const result = original.apply(this, args)
      after(this, args, result)
      return result
    }
    restores.push(() => { proto[name] = original })
  }
  wrap('appendChild', (_self, args) => maybeRun(args[0]))
  wrap('insertBefore', (_self, args) => maybeRun(args[0]))
  wrap('replaceChild', (_self, args) => maybeRun(args[0]))
  wrap('cloneNode', (_self, _args, result) => shimAttributes(result))
  const innerHTML = Object.getOwnPropertyDescriptor(proto, 'innerHTML')!
  Object.defineProperty(proto, 'innerHTML', {
    ...innerHTML,
    set(this: any, value: string) {
      innerHTML.set!.call(this, value)
      shimAttributes(this)
    },
  })
  restores.push(() => Object.defineProperty(proto, 'innerHTML', innerHTML))

  const browser: Browser = {
    window,
    document,
    errors,
    requests,
    async navigate(to: string) {
      const ok = await window.stxRouter.navigate(to)
      if (ok !== true)
        throw new Error(`router did not swap to ${to} (returned ${String(ok)}); requests: ${requests.join(', ')}`)
      // stx:load is debounced 5ms inside the runtime, and :if defers its
      // subtree a macrotask.
      await sleep(60)
    },
    teardown() {
      for (const restore of restores.reverse())
        restore()
      document.createElement = originalCreateElement
      for (const [key, descriptor] of saved) {
        if (descriptor)
          Object.defineProperty(globalThis, key, descriptor)
        else
          delete (globalThis as any)[key]
      }
    },
  }
  active = browser

  // Parse, then run the parsed scripts in order while the document is loading.
  document.write(html)
  shimAttributes(document.documentElement)
  document.readyState = 'loading'
  for (const script of Array.from(document.querySelectorAll('script')))
    runScript(script)
  document.readyState = 'interactive'
  document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }))
  document.readyState = 'complete'
  window.dispatchEvent(new window.Event('load'))
  await sleep(60)

  return browser
}

// ---------------------------------------------------------------------------
// Reading the page
// ---------------------------------------------------------------------------

export function dispatch(browser: Browser, name: string): void {
  browser.window.dispatchEvent(new browser.window.Event(name))
}

/**
 * Ids are matched as attributes: very-happy-dom's document-level #id lookup
 * misses an element that was detached and inserted again, which is exactly
 * what :if does, while [id="..."] walks the tree like a browser would.
 */
export function find(browser: Browser, selector: string): any {
  return browser.document.querySelector(selector.replace(/#([\w-]+)/g, '[id="$1"]'))
}

export function text(browser: Browser, selector: string): string {
  return (find(browser, selector)?.textContent ?? '<missing>').trim()
}

/** :if detaches a hidden element and leaves a comment in its place. */
export function shown(browser: Browser, selector: string): boolean {
  const el = find(browser, selector)
  return !!el && el.isConnected
}

export interface Counters { setups: number, mounts: number, destroys: number }

export function counts(counters: Counters): string {
  return `setups ${counters.setups}, mounts ${counters.mounts}, destroys ${counters.destroys}`
}
