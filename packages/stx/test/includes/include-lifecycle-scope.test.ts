/**
 * An @include's onMount and onDestroy belong to the partial's own scope
 * (stacksjs/stx#1958).
 *
 * The runtime attaches a lifecycle hook to the current element's scope only
 * when that scope is already registered, and queues it globally otherwise. A
 * partial's script used to register its scope in the tail, after the body had
 * already called onMount and onDestroy, so every hook went global. The global
 * destroy queue is drained wholesale by every stx:load, which did two things:
 *
 *   - a partial inside the swap container had its NEW instance's onDestroy run
 *     on arrival, before its onMount, and its old instance's onDestroy run a
 *     second time
 *   - a partial whose root survives a navigation (one the layout renders) lost
 *     whatever its onDestroy was meant to undo at the first navigation
 *
 * The scope is now registered before the body runs, whenever the root is
 * found. A partial with no root keeps the global queues: there is no scope to
 * attach to.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import type { Browser, SpaApp } from '../router/spa-harness'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'

setDefaultTimeout(60_000)

/** Logs each instance's setup, mount and destroy, numbered by instance. */
const COUNTED = `<script client>
  const hits = state(0)
  const instance = ++window.__log.seq
  window.__log.lines.push('setup ' + instance)
  onMount(() => { window.__log.lines.push('mount ' + instance) })
  onDestroy(() => { window.__log.lines.push('destroy ' + instance) })
</script>

<p class="counted">{{ hits() }}</p>
`

/** No state/derived/effect: emitted by the non-signal branch. */
const PLAIN = `<script client>
  window.__log.lines.push('setup')
  function ping() { return 'pong' }
  onMount(() => { window.__log.lines.push('mount') })
  onDestroy(() => { window.__log.lines.push('destroy') })
</script>

<div class="plain" :text="ping()">plain</div>
`

/** Nothing to stamp a scope on. */
const ROOTLESS = `<script client>
  const hits = state(0)
  window.__log.lines.push('setup')
  onMount(() => { window.__log.lines.push('mount') })
  onDestroy(() => { window.__log.lines.push('destroy') })
</script>

just text
`

/** A root that already carries a scope id, which the partial merges into. */
const MERGED = `<script client>
  const hits = state(0)
  window.__log.lines.push('setup')
  onMount(() => { window.__log.lines.push('mount') })
  onDestroy(() => { window.__log.lines.push('destroy') })
</script>

<div class="merged" data-stx-scope="shared_root">{{ hits() }}</div>
`

const FILES: Record<string, string> = {
  'partials/counted.stx': COUNTED,
  'partials/plain.stx': PLAIN,
  'partials/rootless.stx': ROOTLESS,
  'partials/merged.stx': MERGED,
  'layouts/default.stx': layout('<nav></nav>'),
  'pages/signal.stx': page('default', `<h1>Signal</h1>\n@include('counted')`),
  'pages/plain.stx': page('default', `<h1>Plain</h1>\n@include('plain')`),
  'pages/rootless.stx': page('default', `<h1>Rootless</h1>\n<div>@include('rootless')</div>`),
  'pages/merged.stx': page('default', `<h1>Merged</h1>\n@include('merged')`),
  'pages/d/one.stx': page('default', `<h1>One</h1>\n@include('counted')`),
  'pages/d/two.stx': page('default', `<h1>Two</h1>\n@include('counted')`),
  'pages/d/three.stx': page('default', `<h1>Three</h1>\n@include('counted')`),
}

const ROUTES: Record<string, string> = {
  '/signal': 'pages/signal.stx',
  '/plain': 'pages/plain.stx',
  '/rootless': 'pages/rootless.stx',
  '/merged': 'pages/merged.stx',
  '/d/one': 'pages/d/one.stx',
  '/d/two': 'pages/d/two.stx',
  '/d/three': 'pages/d/three.stx',
}

let app: SpaApp

beforeAll(async () => {
  app = await renderApp(FILES, ROUTES)
})

afterAll(async () => {
  await app?.dispose()
})

afterEach(closeBrowser)

function open(pathname: string): Promise<Browser> {
  return boot(app, pathname, { globals: { __log: { seq: 0, lines: [] } } })
}

function lines(browser: Browser): string[] {
  return [...browser.window.__log.lines]
}

/** The registry entry of the scope stamped on `selector`. */
function scopeOf(browser: Browser, selector: string): any {
  const id = browser.document.querySelector(selector)?.getAttribute('data-stx-scope')
  return id ? browser.window.stx._scopes[id] : undefined
}

/**
 * stx:load runs every hook queued on the GLOBAL destroy queue, so firing one
 * tells whether a partial's onDestroy went there.
 */
async function drainGlobalDestroys(browser: Browser): Promise<void> {
  browser.window.dispatchEvent(new browser.window.Event('stx:load'))
  await settle()
}

describe('an @include whose root is found', () => {
  for (const [shape, route, selector] of [
    ['with signals', '/signal', '.counted'],
    ['without signals', '/plain', '.plain'],
  ] as const) {
    it(`queues onMount and onDestroy on its own scope, ${shape}`, async () => {
      const browser = await open(route)
      const scope = scopeOf(browser, selector)
      expect(browser.errors).toEqual([])
      expect({ mounted: scope?.__mounted, destroyHooks: scope?.__destroyCallbacks?.length })
        .toEqual({ mounted: true, destroyHooks: 1 })

      await drainGlobalDestroys(browser)
      // Mounted once; nothing of the partial's sat on the global queue.
      expect(lines(browser).map(line => line.replace(/ \d+$/, ''))).toEqual(['setup', 'mount'])
    })
  }

  it('registers under the id it merged into, and finds its root by it', async () => {
    const out = app.documents.get('/merged')!
    expect(out).not.toMatch(/stx_scope_merged_\d+/)
    expect(out).toContain(`document.querySelector('[data-stx-scope="shared_root"]')`)
    expect(out).toContain(`window.stx._scopes['shared_root'] = __scopeRegistration;`)

    const browser = await open('/merged')
    expect(scopeOf(browser, '.merged')?.__mounted).toBe(true)
    await drainGlobalDestroys(browser)
    expect(lines(browser)).toEqual(['setup', 'mount'])
  })

  it('inside the swap container: one mount and one destroy per instance, in that order', async () => {
    const browser = await open('/d/one')
    for (const to of ['/d/two', '/d/three', '/d/two'])
      await browser.navigate(to)
    expect(browser.errors).toEqual([])
    expect(lines(browser)).toEqual([
      'setup 1',
      'mount 1',
      'destroy 1',
      'setup 2',
      'mount 2',
      'destroy 2',
      'setup 3',
      'mount 3',
      'destroy 3',
      'setup 4',
      'mount 4',
    ])
  })
})

describe('an @include with no root', () => {
  it('keeps the global queues, having no scope to attach to', async () => {
    const browser = await open('/rootless')
    expect(lines(browser)).toEqual(['setup', 'mount'])
    await drainGlobalDestroys(browser)
    expect(lines(browser)).toEqual(['setup', 'mount', 'destroy'])
  })
})
