/**
 * An onDestroy registered inside a component's onMount belongs to that
 * component (stacksjs/stx#1958).
 *
 * The runtime's onDestroy attaches to the current element's scope, and while
 * mount callbacks run there is no current element. So a composable called in
 * onMount (useEventListener registers its removal with onDestroy) put its
 * teardown on the GLOBAL destroy queue, which every stx:load drains. The
 * component's markup stayed bound while its listener was removed at the next
 * navigation, a frozen component, and the teardown never ran when the
 * component itself was destroyed.
 *
 * Each flush now makes its own destroy queue the destination of any onDestroy
 * registered while it runs: the scope's queue for a scoped component,
 * root.__stx_destroy for stx.mount, the global queue for the global flush.
 *
 * Every case fires stx:load by hand, which is exactly the drain a navigation
 * performs, then destroys the component the way navigation does, through
 * _cleanupContainer.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import type { Browser, SpaApp } from '../router/spa-harness'
import { boot, closeBrowser, dispatch, layout, page, renderApp, settle } from '../router/spa-harness'

setDefaultTimeout(60_000)

/** The listener counts hits; the explicit onDestroy logs. */
const BODY = `
  onMount(() => {
    useEventListener('sink:hit', () => { window.__sink.hits++ })
    onDestroy(() => { window.__sink.log.push('destroy') })
  })
`

const FILES: Record<string, string> = {
  // A tag component with signals: the component factory's scope.
  'components/TagSink.stx': `<script client>
  const hits = state(0)
${BODY}</script>

<div class="sink">{{ hits() }}</div>
`,
  // A tag component with no signals: stx.mount, which keeps its hooks on
  // root.__stx_destroy.
  'components/MountSink.stx': `<script client>
  function label() { return 'mounted' }
${BODY}</script>

<div class="sink" :text="label()">sink</div>
`,
  // An @include: the partial's own scope.
  'partials/include-sink.stx': `<script client>
  const hits = state(0)
${BODY}</script>

<div class="sink">{{ hits() }}</div>
`,
  // No element to scope: the global flush.
  'partials/rootless-sink.stx': `<script client>
  const hits = state(0)
${BODY}</script>

rootless
`,
  // A component mounted from INSIDE another one's onMount, onto a :for row.
  // Its setup's teardown is its own, not the outer component's.
  'components/NestedHost.stx': `<script client>
  const rows = state([1])
  window.__clearRows = () => rows.set([])
  onMount(() => {
    window.stx.mountEl('.row-target', function() {
      useEventListener('sink:hit', () => { window.__sink.hits++ })
      return {}
    })
  })
</script>

<div class="nested-host"><div class="row" :for="r in rows()"><div class="row-target" x-text="r"></div></div></div>
`,
  'layouts/default.stx': layout('<nav></nav>'),
  'pages/tag.stx': page('default', '<TagSink />'),
  'pages/mount.stx': page('default', '<MountSink />'),
  'pages/include.stx': page('default', `@include('include-sink')`),
  'pages/rootless.stx': page('default', `<div>@include('rootless-sink')</div>`),
  'pages/nested.stx': page('default', '<NestedHost />'),
}

const ROUTES: Record<string, string> = {
  '/tag': 'pages/tag.stx',
  '/mount': 'pages/mount.stx',
  '/include': 'pages/include.stx',
  '/rootless': 'pages/rootless.stx',
  '/nested': 'pages/nested.stx',
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
  return boot(app, pathname, { globals: { __sink: { hits: 0, log: [] } } })
}

/** Hits the listener counted for one event, and what has been destroyed so far. */
function probe(browser: Browser): { perHit: number, log: string[] } {
  const sink = browser.window.__sink
  const before = sink.hits
  dispatch(browser, 'sink:hit')
  return { perHit: sink.hits - before, log: [...sink.log] }
}

async function stxLoad(browser: Browser): Promise<void> {
  browser.window.dispatchEvent(new browser.window.Event('stx:load'))
  await settle()
}

async function destroyContainer(browser: Browser): Promise<void> {
  browser.window.stx._cleanupContainer(browser.document.querySelector('main'))
  await settle()
}

describe('an onDestroy registered inside onMount', () => {
  for (const [shape, route, stamp] of [
    ['a tag component with signals', '/tag', 'data-stx-scope'],
    ['a tag component mounted through stx.mount', '/mount', 'window.stx.mount('],
    ['an @include', '/include', 'data-stx-scope'],
  ] as const) {
    it(`stays with ${shape} until it is destroyed, then runs once`, async () => {
      expect(app.documents.get(route)).toContain(stamp)
      const browser = await open(route)
      expect(browser.errors).toEqual([])
      expect(probe(browser)).toEqual({ perHit: 1, log: [] })

      // The drain a navigation performs. Nothing of the component's is on it.
      await stxLoad(browser)
      expect(probe(browser)).toEqual({ perHit: 1, log: [] })

      await destroyContainer(browser)
      expect(probe(browser)).toEqual({ perHit: 0, log: ['destroy'] })

      // Once: a later drain finds nothing of it left to run.
      await stxLoad(browser)
      expect(probe(browser)).toEqual({ perHit: 0, log: ['destroy'] })
    })
  }

  it('in the global flush still goes to the global queue', async () => {
    // No scope to attach to, so the flush's own queue IS the global one.
    const browser = await open('/rootless')
    expect(probe(browser)).toEqual({ perHit: 1, log: [] })
    await stxLoad(browser)
    expect(probe(browser)).toEqual({ perHit: 0, log: ['destroy'] })
  })
})

describe('a component set up from inside another one\'s onMount', () => {
  // The sink is for the mount callbacks themselves. stx.mount collects its
  // setup's teardown off the global queue for its own root, so while it runs
  // the outer component's sink must not catch that teardown first: it would
  // outlive the root it belongs to.
  it('keeps its setup\'s teardown on its own root, so removing the row removes its listener', async () => {
    const browser = await open('/nested')
    expect(browser.errors).toEqual([])
    expect(browser.document.querySelector('.row-target')?.__stx_destroy).toHaveLength(1)
    expect(probe(browser)).toEqual({ perHit: 1, log: [] })

    browser.window.__clearRows()
    await settle()
    expect(browser.document.querySelectorAll('.row')).toHaveLength(0)
    expect(probe(browser)).toEqual({ perHit: 0, log: [] })
  })
})
