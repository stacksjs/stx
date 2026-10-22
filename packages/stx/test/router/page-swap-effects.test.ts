/**
 * A page's effects end with the page.
 *
 * Effects a page's script or one of its components' scripts made at setup were
 * never tracked by anything: bindings are disposed when the router swaps the
 * page out, effects made in a script were not. One that read a store kept
 * running for a page that was gone. HQ's breathwork player opens its dialog
 * from effect(() => store.playerRequest()): after /relax, another page, and
 * /relax again, Join set the request and the FIRST visit's player, long out of
 * the document, took it and failed to open ("showModal ... not in a
 * Document"), while the player on screen never heard.
 *
 * Setup effects are now collected the way onDestroy callbacks are, and go when
 * the page does: a component's or a rooted partial's with its scope, the
 * page's with its page-level onDestroy callbacks (so a retained screen keeps
 * them until the router disposes it).
 */
import { afterEach, describe, expect, it, setDefaultTimeout } from 'bun:test'
import type { SpaApp } from './spa-harness'
import { boot, closeBrowser, layout, page, renderApp, sleep } from './spa-harness'

setDefaultTimeout(60_000)

afterEach(() => {
  closeBrowser()
})

const STORE = `defineStore('player', () => {
  const request = state(null)
  return { request }
})`

// Every effect run names its instance and says whether its element is still
// in the document, which is what decides whether it could do anything.
const PLAYER = `<script client>
  ${STORE}
  const store = useStore('player')
  const id = ++window.__fx.players
  const opened = state('')
  effect(() => {
    const request = store.request()
    if (!request) return
    const el = document.querySelector('[data-player="' + id + '"]')
    window.__fx.runs.push('player ' + id + (el && el.isConnected ? '' : ' (gone)'))
    opened.set(request)
  })
  watch(() => store.request(), (next) => { if (next) window.__fx.runs.push('watch ' + id) })
</script>
<div class="player" :data-player="id" :text="opened"></div>`

const RELAX = `<script client>
  ${STORE}
  const relaxStore = useStore('player')
  const visit = ++window.__fx.pages
  effect(() => {
    if (relaxStore.request()) window.__fx.runs.push('page ' + visit)
  })
</script>
<h1 id="title">Relax</h1>
@include('meter')
<Player />`

// A partial with a root of its own: a scope, like a component's.
const METER = `<script client>
  ${STORE}
  const meterStore = useStore('player')
  const meter = ++window.__fx.meters
  effect(() => {
    if (meterStore.request()) window.__fx.runs.push('partial ' + meter)
  })
</script>
<p class="meter" :text="meter"></p>`

const TABS = `<nav>
  <a href="/relax" data-stx-link data-stx-nav="tab" data-stx-transition="none">Relax</a>
  <a href="/other" data-stx-link data-stx-nav="tab" data-stx-transition="none">Other</a>
</nav>`

const LINKS = `<nav>
  <a href="/relax" data-stx-link>Relax</a>
  <a href="/other" data-stx-link>Other</a>
</nav>`

interface Fx { players: number, pages: number, meters: number, runs: string[] }

const QUIET = { navDuration: 0, revalidate: false, prefetchVisible: false }
const apps = new Map<string, SpaApp>()

async function start(chrome: string) {
  const key = chrome === TABS ? 'tabs' : 'links'
  const app = apps.get(key) || await renderApp({
    'components/Player.stx': PLAYER,
    'partials/meter.stx': METER,
    'layouts/app.stx': layout(chrome),
    'pages/relax.stx': page('app', RELAX),
    'pages/other.stx': page('app', `<script client>const other = state('Other')</script><h1 id="title" :text="other"></h1>`),
  }, { '/relax': 'pages/relax.stx', '/other': 'pages/other.stx' })
  apps.set(key, app)
  const fx: Fx = { players: 0, pages: 0, meters: 0, runs: [] }
  const browser = await boot(app, '/relax', { history: true, globals: { __fx: fx, STX_ROUTER_OPTIONS: QUIET } })
  return { browser, fx }
}

/** What one request reaches. */
async function request(browser: any, fx: Fx, value: string): Promise<string[]> {
  fx.runs.length = 0
  browser.window.stx.useStore('player').request.set(value)
  // effect runs in set(); watch flushes on the next tick.
  await sleep(40)
  return [...fx.runs].sort()
}

describe('a page swapped out by the router', () => {
  it('leaves no effect behind (plain links)', async () => {
    const { browser, fx } = await start(LINKS)
    expect(browser.errors).toEqual([])
    expect(await request(browser, fx, 'first')).toEqual(['page 1', 'partial 1', 'player 1', 'watch 1'])

    await browser.navigate('/other')
    await browser.navigate('/relax')
    expect(fx.players).toBe(2)
    expect(await request(browser, fx, 'second')).toEqual(['page 2', 'partial 2', 'player 2', 'watch 2'])

    await browser.navigate('/other')
    expect(await request(browser, fx, 'third')).toEqual([])
    expect(browser.errors).toEqual([])
  })

  it('keeps a retained screen\'s effects until the screen goes (tab bar)', async () => {
    const { browser, fx } = await start(TABS)
    await browser.navigate('/other')
    // Retained, not disposed: the hidden /relax still listens.
    expect(await request(browser, fx, 'first')).toEqual(['page 1', 'partial 1', 'player 1', 'watch 1'])

    await browser.navigate('/relax')
    expect(fx.players).toBe(2)
    expect(await request(browser, fx, 'second')).toEqual(['page 1', 'page 2', 'partial 1', 'partial 2', 'player 1', 'player 2', 'watch 1', 'watch 2'])

    // Back pops the second /relax, and disposes it: its effects go with it.
    browser.window.history.back()
    await sleep(80)
    expect(browser.window.location.pathname).toBe('/other')
    expect(await request(browser, fx, 'third')).toEqual(['page 1', 'partial 1', 'player 1', 'watch 1'])
    expect(browser.errors).toEqual([])
  })
})
