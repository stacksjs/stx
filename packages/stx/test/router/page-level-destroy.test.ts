/**
 * A page-level onDestroy belongs to the page that registered it.
 *
 * The router runs the incoming page's scripts and THEN fires stx:load, and
 * stx:load used to run every queued page-level onDestroy on the reading that
 * the queue held the outgoing page. It held the incoming page's too: a script
 * that registers outside any component element - a layout partial with no root
 * of its own, such as a theme include calling useColorMode - queued its
 * cleanup there, and stx:load ran it at once, with its page on screen. With a
 * tab bar retaining screens it was certain, because the outgoing page's
 * callbacks had already been filed with its screen, so the queue held nothing
 * else. An app's pages stopped following the system theme after the first
 * navigation; anything else registered that way went the same way.
 *
 * The router now marks the boundary (_beginSwap) before the incoming scripts
 * run, and stx:load runs only what was registered before it.
 */
import { afterEach, describe, expect, it, setDefaultTimeout } from 'bun:test'
import type { ServeMode, SpaApp } from './spa-harness'
import { boot, closeBrowser, layout, page, renderApp, sleep } from './spa-harness'

setDefaultTimeout(60_000)

afterEach(() => {
  closeBrowser()
})

/** Script only, no root element: the shape of a layout's theme include. */
const WATCH = `<script client>
  var watchId = ++window.__w.setups
  function onPing() { window.__w.heard.push(watchId) }
  window.addEventListener('w:ping', onPing)
  onDestroy(() => {
    window.__w.destroyed.push(watchId)
    window.removeEventListener('w:ping', onPing)
  })
</script>
`

const TABS = `<nav>
  <a id="tab-a" href="/a" data-stx-link data-stx-nav="tab" data-stx-transition="none">A</a>
  <a id="tab-b" href="/b" data-stx-link data-stx-nav="tab" data-stx-transition="none">B</a>
  <a id="tab-c" href="/c" data-stx-link data-stx-nav="tab" data-stx-transition="none">C</a>
</nav>`

const LINKS = `<nav>
  <a href="/a" data-stx-link>A</a>
  <a href="/b" data-stx-link>B</a>
  <a href="/c" data-stx-link>C</a>
</nav>`

function files(chrome: string): Record<string, string> {
  return {
    'partials/watch.stx': WATCH,
    'layouts/app.stx': layout(`@include('watch')\n${chrome}`),
    'pages/a.stx': page('app', '<h1 id="title">A</h1>'),
    'pages/b.stx': page('app', '<h1 id="title">B</h1>'),
    'pages/c.stx': page('app', '<h1 id="title">C</h1>'),
  }
}

const ROUTES = { '/a': 'pages/a.stx', '/b': 'pages/b.stx', '/c': 'pages/c.stx' }

interface Watch { setups: number, heard: number[], destroyed: number[] }

const QUIET = { navDuration: 0, revalidate: false, prefetchVisible: false }

const apps = new Map<string, SpaApp>()

async function start(chrome: string, serve: ServeMode) {
  const key = chrome === TABS ? 'tabs' : 'links'
  const app = apps.get(key) || await renderApp(files(chrome), ROUTES)
  apps.set(key, app)
  const watch: Watch = { setups: 0, heard: [], destroyed: [] }
  const browser = await boot(app, '/a', { serve, history: true, globals: { __w: watch, STX_ROUTER_OPTIONS: QUIET } })
  return { browser, watch }
}

/** Who is listening now: the ids that hear one ping. */
function listeners(browser: any, watch: Watch): number[] {
  watch.heard.length = 0
  browser.window.dispatchEvent(new browser.window.Event('w:ping'))
  return [...watch.heard].sort()
}

describe('a page-level onDestroy registered during a navigation', () => {
  for (const [name, chrome, serve] of [
    ['tab bar, retained screens', TABS, 'fragment'],
    ['plain links, fragments', LINKS, 'fragment'],
    ['plain links, whole documents', LINKS, 'document'],
  ] as Array<[string, string, ServeMode]>) {
    it(`stays with its page (${name})`, async () => {
      const { browser, watch } = await start(chrome, serve)
      expect(browser.errors).toEqual([])
      expect(listeners(browser, watch)).toContain(watch.setups)

      for (const to of ['/b', '/c', '/a']) {
        await browser.navigate(to)
        await sleep(40)
        expect(browser.document.querySelector('[data-stx-content] #title, main #title')?.textContent).toBe(to.slice(1).toUpperCase())
        // The instance this navigation started is alive, and hears the page.
        const current = watch.setups
        expect(watch.destroyed).not.toContain(current)
        expect(listeners(browser, watch)).toContain(current)
      }
      expect(browser.errors).toEqual([])
    })
  }

  it('still runs the outgoing page\'s, once (plain links)', async () => {
    const { browser, watch } = await start(LINKS, 'fragment')
    await browser.navigate('/b')
    await sleep(40)
    await browser.navigate('/c')
    await sleep(40)
    // A and B are gone; each was torn down exactly once, and only C listens.
    expect(watch.destroyed.sort()).toEqual([1, 2])
    expect(listeners(browser, watch)).toEqual([3])
  })
})
