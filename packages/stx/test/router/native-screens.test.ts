/**
 * Retained screens, tab stacks, swipe back and direction-aware transitions:
 * the router behaving like a phone app's navigation controller.
 *
 * An stx app inside a native shell re-rendered every screen from the server on
 * every visit. Back threw away the list you came from and fetched it again
 * (scroll position restored by guesswork, every signal reset), a tab switch
 * tore the tab down and rebuilt it, and the history was one linear stack, so
 * Back from one tab could land in another. With tab links on the page
 * (data-stx-nav="tab"), the router now keeps screens:
 *
 *   - a push hides the outgoing screen instead of disposing it; Back shows it
 *     again as it was, DOM, signals and scroll, with no fetch and no script
 *   - each tab owns a stack of screens, mirrored by the history above the
 *     entry the app opened with; a tab switch rewinds to that entry and
 *     writes the other tab's stack in its place, so Back never crosses tabs
 *   - re-selecting the current tab scrolls to the top, then pops to its root
 *   - an edge swipe drags the screen away over the retained one underneath
 *
 * The harness (spa-harness.ts) renders real pages and drives the real router
 * and runtime against a fake server.
 */
import { afterEach, describe, expect, it, setDefaultTimeout } from 'bun:test'
import type { Browser, SpaApp } from './spa-harness'
import { boot, closeBrowser, layout, page, renderApp, sleep } from './spa-harness'

setDefaultTimeout(60_000)

afterEach(() => {
  closeBrowser()
})

const CHROME = `<nav data-stx-sticky-active>
  <a id="tab-today" href="/today" data-stx-link data-stx-nav="tab" data-stx-transition="none">Today</a>
  <a id="tab-cal" href="/calendar" data-stx-link data-stx-nav="tab" data-stx-transition="none">Calendar</a>
</nav>`

/** A page whose lifecycle is visible from the test: mounts and destroys by name. */
function lifePage(name: string, body: string): string {
  return page('app', `<script client>
  onMount(() => { window.__life.mounts.push('${name}') })
  onDestroy(() => { window.__life.destroys.push('${name}') })
</script>
${body}`)
}

const FILES = {
  'layouts/app.stx': layout(CHROME),
  'pages/today.stx': page('app', `<script client>
  const count = state(0)
  function bump() { count.set(count() + 1) }
  onMount(() => { window.__life.mounts.push('today') })
  onDestroy(() => { window.__life.destroys.push('today') })
</script>
<h1>Today</h1>
<button id="bump" @click="bump()">{{ count() }}</button>
<div id="today-scroller" data-stx-scroll="list" style="overflow:auto;height:50px"><div style="height:500px">rows</div></div>
<a id="to-detail" href="/today/detail" data-stx-link>Detail</a>`),
  'pages/detail.stx': lifePage('detail', `<h1>Detail</h1>
<p id="detail-text">detail</p>
<div id="no-swipe" data-stx-no-swipe>carousel</div>
<a id="to-deeper" href="/today/deeper" data-stx-link>Deeper</a>`),
  'pages/deeper.stx': lifePage('deeper', `<h1>Deeper</h1>
<p id="deeper-text">deeper</p>`),
  'pages/calendar.stx': lifePage('calendar', `<h1>Calendar</h1>
<p id="cal-text">calendar</p>`),
}

const ROUTES = {
  '/today': 'pages/today.stx',
  '/today/detail': 'pages/detail.stx',
  '/today/deeper': 'pages/deeper.stx',
  '/calendar': 'pages/calendar.stx',
}

interface Life { mounts: string[], destroys: string[] }

const QUIET = { navDuration: 0, revalidate: false, prefetchVisible: false }

let app: SpaApp | null = null

async function start(options: Record<string, unknown> = {}, at = '/today'): Promise<{ browser: Browser, life: Life }> {
  app = app || await renderApp(FILES, ROUTES)
  const life: Life = { mounts: [], destroys: [] }
  const browser = await boot(app, at, {
    history: true,
    globals: { __life: life, STX_ROUTER_OPTIONS: { ...QUIET, ...options } },
  })
  return { browser, life }
}

/** The screen on show: the one the runtime binds, wearing data-stx-content. */
function shownScreen(browser: Browser): any {
  return browser.document.querySelector('[data-stx-screen][data-stx-content]')
}

function shownText(browser: Browser): string {
  return (shownScreen(browser)?.querySelector('h1')?.textContent ?? '<none>').trim()
}

/** Within the screen on show: a retained screen carries the same ids. */
function inShown(browser: Browser, selector: string): any {
  return shownScreen(browser)?.querySelector(selector.replace(/#([\w-]+)/g, '[id="$1"]'))
}

function click(browser: Browser, selector: string): void {
  const el = browser.document.querySelector(selector.replace(/#([\w-]+)/g, '[id="$1"]'))
  if (!el)
    throw new Error(`nothing to click at ${selector}`)
  el.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
}

async function tap(browser: Browser, selector: string): Promise<void> {
  click(browser, selector)
  await sleep(80)
}

async function back(browser: Browser): Promise<void> {
  browser.window.history.back()
  await sleep(80)
}

function fetchesOf(browser: Browser, path: string): number {
  return browser.requests.filter(r => r.endsWith(` ${path}`)).length
}

function touch(browser: Browser, type: string, target: any, x: number, y = 200): void {
  const event = new browser.window.Event(type, { bubbles: true, cancelable: true })
  const point = [{ clientX: x, clientY: y, target }]
  Object.defineProperty(event, 'touches', { value: type === 'touchend' || type === 'touchcancel' ? [] : point })
  Object.defineProperty(event, 'changedTouches', { value: point })
  target.dispatchEvent(event)
}

describe('retained screens', () => {
  it('keeps the screen a push leaves, and Back shows it as it was without fetching', async () => {
    const { browser, life } = await start()
    await tap(browser, '#bump')
    await tap(browser, '#bump')
    expect(inShown(browser, '#bump').textContent.trim()).toBe('2')
    const todayScreen = shownScreen(browser)

    await tap(browser, '#to-detail')
    expect(shownText(browser)).toBe('Detail')
    expect(browser.window.location.pathname).toBe('/today/detail')
    // Hidden, not disposed: its onDestroy has not run.
    expect(todayScreen.isConnected).toBe(true)
    expect(todayScreen.hasAttribute('data-stx-screen-hidden')).toBe(true)
    expect(life.destroys).not.toContain('today')

    const fetchesBefore = fetchesOf(browser, '/today')
    await back(browser)
    expect(browser.window.location.pathname).toBe('/today')
    expect(shownScreen(browser)).toBe(todayScreen)
    expect(inShown(browser, '#bump').textContent.trim()).toBe('2')
    expect(fetchesOf(browser, '/today')).toBe(fetchesBefore)
    // The popped screen is gone, through the runtime's own disposal.
    expect(life.destroys).toContain('detail')
    expect(browser.document.querySelectorAll('[data-stx-screen]').length).toBe(1)

    // Still live: its handlers and signals were never torn down.
    await tap(browser, '#bump')
    expect(inShown(browser, '#bump').textContent.trim()).toBe('3')
    expect(browser.errors).toEqual([])
  })

  it('tells a screen shown again that it is on screen, so it can refresh', async () => {
    const { browser } = await start()
    const shown: any[] = []
    browser.window.addEventListener('stx:screen-shown', (e: any) => shown.push(e.detail))
    await tap(browser, '#to-detail')
    await back(browser)
    expect(shown).toEqual([{ url: '/today', direction: 'pop' }])
  })

  it('lets the least recently shown screen go past the limit, and loads it again on Back', async () => {
    const { browser, life } = await start({ screenLimit: 2 })
    await tap(browser, '#to-detail')
    await tap(browser, '#to-deeper')
    // Three screens, room for two: Today went.
    expect(life.destroys).toContain('today')
    expect(browser.document.querySelectorAll('[data-stx-screen]').length).toBe(2)

    await back(browser)
    expect(shownText(browser)).toBe('Detail')
    const before = fetchesOf(browser, '/today')
    await back(browser)
    expect(shownText(browser)).toBe('Today')
    // Served from the router's cache, or fetched; either way a new screen.
    expect(fetchesOf(browser, '/today')).toBeGreaterThanOrEqual(before)
    expect(browser.window.location.pathname).toBe('/today')
  })

  it('restores a retained screen\'s inner scroller', async () => {
    const { browser } = await start()
    const scroller = inShown(browser, '#today-scroller')
    scroller.scrollTop = 120
    await tap(browser, '#to-detail')
    scroller.scrollTop = 0
    await back(browser)
    expect(inShown(browser, '#today-scroller').scrollTop).toBe(120)
  })
})

describe('tabs', () => {
  it('switches back to a tab exactly as it was: DOM, signal and scroll', async () => {
    const { browser, life } = await start()
    await tap(browser, '#bump')
    const todayScreen = shownScreen(browser)
    browser.window.scrollTo({ left: 0, top: 400, behavior: 'instant' })

    await tap(browser, '#tab-cal')
    expect(shownText(browser)).toBe('Calendar')
    expect(browser.window.location.pathname).toBe('/calendar')
    expect(browser.window.scrollY).toBe(0)
    expect(life.destroys).not.toContain('today')

    await tap(browser, '#tab-today')
    expect(shownScreen(browser)).toBe(todayScreen)
    expect(inShown(browser, '#bump').textContent.trim()).toBe('1')
    expect(browser.window.scrollY).toBe(400)
    expect(fetchesOf(browser, '/today')).toBe(0)

    // And the other way: Calendar was kept too.
    await tap(browser, '#tab-cal')
    expect(shownText(browser)).toBe('Calendar')
    expect(fetchesOf(browser, '/calendar')).toBe(1)
    expect(life.destroys).toEqual([])
  })

  it('never adds a back entry for a tab switch, and Back never crosses tabs', async () => {
    const { browser } = await start()
    await tap(browser, '#to-detail')
    expect(browser.window.history.state.__stxDepth).toBe(1)

    await tap(browser, '#tab-cal')
    expect(browser.window.location.pathname).toBe('/calendar')
    // Rewound to the entry the app opened with, and written over it.
    expect(browser.window.history.state.__stxDepth).toBe(0)
    expect(browser.window.history.state.__stxPushed).toBeUndefined()

    await back(browser)
    expect(browser.window.location.pathname).toBe('/calendar')
    expect(shownText(browser)).toBe('Calendar')

    // Today's own stack comes back with it: Detail on top, Today under it.
    await tap(browser, '#tab-today')
    expect(shownText(browser)).toBe('Detail')
    expect(browser.window.location.pathname).toBe('/today/detail')
    expect(browser.window.history.state.__stxDepth).toBe(1)
    await back(browser)
    expect(shownText(browser)).toBe('Today')
    expect(browser.window.location.pathname).toBe('/today')
  })

  it('keeps the tab bar on the tab whose screen is shown', async () => {
    const { browser } = await start()
    await tap(browser, '#to-detail')
    await tap(browser, '#tab-cal')
    await tap(browser, '#tab-today')
    expect(browser.document.querySelector('[id="tab-today"]').hasAttribute('data-stx-nav-current')).toBe(true)
    expect(browser.document.querySelector('[id="tab-cal"]').hasAttribute('data-stx-nav-current')).toBe(false)
  })

  it('scrolls to the top on a re-select, then pops to the tab\'s first screen', async () => {
    const { browser, life } = await start()
    const seen: string[] = []
    browser.window.addEventListener('stx:tabreselect', (e: any) => seen.push(`${e.detail.href} ${e.detail.action}`))
    await tap(browser, '#to-detail')
    browser.window.scrollTo({ left: 0, top: 300, behavior: 'instant' })

    await tap(browser, '#tab-today')
    expect(seen).toEqual(['/today top'])
    expect(browser.window.scrollY).toBe(0)
    expect(shownText(browser)).toBe('Detail')

    await tap(browser, '#tab-today')
    expect(seen).toEqual(['/today top', '/today root'])
    expect(shownText(browser)).toBe('Today')
    expect(browser.window.location.pathname).toBe('/today')
    expect(life.destroys).toContain('detail')

    // At the root and at the top: nothing left to do.
    await tap(browser, '#tab-today')
    expect(seen[2]).toBe('/today none')
  })

  it('lets a page keep a re-select for itself', async () => {
    const { browser } = await start()
    await tap(browser, '#to-detail')
    browser.window.scrollTo({ left: 0, top: 300, behavior: 'instant' })
    browser.window.addEventListener('stx:tabreselect', (e: any) => e.preventDefault())
    await tap(browser, '#tab-today')
    expect(browser.window.scrollY).toBe(300)
  })

  it('switches tabs through the API as a tap would', async () => {
    const { browser } = await start()
    await browser.window.stxRouter.selectTab('/calendar')
    await sleep(60)
    expect(shownText(browser)).toBe('Calendar')
    expect(browser.window.stxRouter.screens().map((s: any) => `${s.tab} ${s.url} ${s.active}`)).toEqual([
      '/today /today false',
      '/calendar /calendar true',
    ])
  })
})

describe('navigation direction', () => {
  it('marks push, pop, tab and replace while they happen, and clears it after', async () => {
    const { browser } = await start()
    const seen: string[] = []
    browser.window.addEventListener('stx:navigate', (e: any) => {
      seen.push(`${e.detail.direction}:${browser.document.documentElement.getAttribute('data-nav-direction')}`)
    })
    await tap(browser, '#to-detail')
    await back(browser)
    await tap(browser, '#tab-cal')
    await browser.window.stxRouter.refresh()
    await sleep(80)
    expect(seen).toEqual(['push:push', 'pop:pop', 'tab:tab', 'replace:replace'])
    expect(browser.document.documentElement.hasAttribute('data-nav-direction')).toBe(false)
  })

  it('slides two real screens: the new one in, the old one under it, then hides the old', async () => {
    const { browser } = await start({ navDuration: 120 })
    click(browser, '#to-detail')
    await sleep(30)
    const entering = browser.document.querySelector('[data-stx-screen-enter]')
    const leaving = browser.document.querySelector('[data-stx-screen-leave]')
    expect(entering?.querySelector('h1')?.textContent).toBe('Detail')
    expect(leaving?.querySelector('h1')?.textContent).toBe('Today')
    expect(leaving.style.position).toBe('fixed')
    expect(browser.document.querySelector('[data-stx-screen-dim]')).not.toBeNull()
    expect(browser.document.documentElement.getAttribute('data-nav-direction')).toBe('push')

    await sleep(400)
    expect(browser.document.querySelector('[data-stx-screen-enter],[data-stx-screen-leave],[data-stx-screen-dim]')).toBeNull()
    expect(leaving.hasAttribute('data-stx-screen-hidden')).toBe(true)
    expect(leaving.style.position).toBe('')
    expect(browser.document.documentElement.hasAttribute('data-nav-direction')).toBe(false)
  })

  it('ships the iOS push and pop motion, with a reduced-motion cross-fade', async () => {
    const { browser } = await start()
    const css = browser.document.getElementById('stx-r-css').textContent
    expect(css).toContain('html[data-nav-direction=push] [data-stx-screen-enter]{animation-name:stx-nav-in')
    expect(css).toContain('@keyframes stx-nav-out{from{transform:none}to{transform:translateX(-30%)}}')
    expect(css).toContain('linear(0,')
    expect(css).toContain('@media (prefers-reduced-motion: reduce){html[data-nav-direction] [data-stx-screen-enter]{animation-name:stx-nav-fade-in')
    // The old View Transitions block that silently overrode this one is gone.
    expect(browser.document.getElementById('stx-view-transitions')).toBeNull()
  })
})

describe('swipe back', () => {
  async function onDetail(): Promise<{ browser: Browser, life: Life, todayScreen: any }> {
    const started = await start()
    const todayScreen = shownScreen(started.browser)
    await tap(started.browser, '#to-detail')
    return { ...started, todayScreen }
  }

  it('commits past half way: Back, shown without a second animation', async () => {
    const { browser, life, todayScreen } = await onDetail()
    const target = inShown(browser, '#detail-text')
    const width = browser.window.innerWidth
    touch(browser, 'touchstart', target, 5)
    touch(browser, 'touchmove', target, 40)
    // Dragged: the screen underneath is shown, pinned, while the top one moves.
    expect(todayScreen.hasAttribute('data-stx-screen-hidden')).toBe(false)
    expect(todayScreen.style.position).toBe('fixed')
    touch(browser, 'touchmove', target, width * 0.7)
    expect(shownScreen(browser).style.transform).toBe(`translateX(${width * 0.7 - 5}px)`)
    await sleep(120)
    touch(browser, 'touchend', target, width * 0.7)
    await sleep(500)

    expect(browser.window.location.pathname).toBe('/today')
    expect(shownScreen(browser)).toBe(todayScreen)
    expect(todayScreen.style.position).toBe('')
    expect(todayScreen.style.transform).toBe('')
    expect(life.destroys).toContain('detail')
    expect(browser.document.querySelector('[data-stx-screen-dim]')).toBeNull()
  })

  it('commits on a flick however short', async () => {
    const { browser, todayScreen } = await onDetail()
    const target = inShown(browser, '#detail-text')
    touch(browser, 'touchstart', target, 5)
    touch(browser, 'touchmove', target, 20)
    await sleep(16)
    touch(browser, 'touchmove', target, 60)
    await sleep(16)
    touch(browser, 'touchmove', target, 120)
    touch(browser, 'touchend', target, 120)
    await sleep(500)
    expect(shownScreen(browser)).toBe(todayScreen)
    expect(browser.window.location.pathname).toBe('/today')
  })

  it('springs back when released early and slowly', async () => {
    const { browser, life, todayScreen } = await onDetail()
    const detail = shownScreen(browser)
    const target = inShown(browser, '#detail-text')
    touch(browser, 'touchstart', target, 5)
    touch(browser, 'touchmove', target, 30)
    await sleep(40)
    touch(browser, 'touchmove', target, 100)
    await sleep(150)
    touch(browser, 'touchend', target, 100)
    await sleep(500)

    expect(browser.window.location.pathname).toBe('/today/detail')
    expect(shownScreen(browser)).toBe(detail)
    expect(detail.style.transform).toBe('')
    expect(todayScreen.hasAttribute('data-stx-screen-hidden')).toBe(true)
    expect(todayScreen.style.position).toBe('')
    expect(life.destroys).not.toContain('detail')
  })

  it('leaves a vertical pan to the page', async () => {
    const { browser, todayScreen } = await onDetail()
    const target = inShown(browser, '#detail-text')
    touch(browser, 'touchstart', target, 5, 200)
    touch(browser, 'touchmove', target, 12, 260)
    touch(browser, 'touchmove', target, 400, 300)
    touch(browser, 'touchend', target, 400, 300)
    await sleep(500)
    expect(todayScreen.hasAttribute('data-stx-screen-hidden')).toBe(true)
    expect(browser.window.location.pathname).toBe('/today/detail')
  })

  it('starts only at the edge, and never inside data-stx-no-swipe', async () => {
    const { browser, todayScreen } = await onDetail()
    const text = inShown(browser, '#detail-text')
    touch(browser, 'touchstart', text, 60)
    touch(browser, 'touchmove', text, 600)
    touch(browser, 'touchend', text, 600)
    const carousel = inShown(browser, '#no-swipe')
    touch(browser, 'touchstart', carousel, 5)
    touch(browser, 'touchmove', carousel, 600)
    touch(browser, 'touchend', carousel, 600)
    await sleep(500)
    expect(todayScreen.hasAttribute('data-stx-screen-hidden')).toBe(true)
    expect(browser.window.location.pathname).toBe('/today/detail')
  })

  it('has nothing to swipe back to on a tab\'s first screen', async () => {
    const { browser } = await start()
    const target = inShown(browser, '#bump')
    touch(browser, 'touchstart', target, 5)
    touch(browser, 'touchmove', target, 600)
    touch(browser, 'touchend', target, 600)
    await sleep(100)
    expect(shownScreen(browser)?.style.transform || '').toBe('')
    expect(browser.window.location.pathname).toBe('/today')
  })
})

describe('the newest navigation wins', () => {
  it('lets Back during a load win over the load', async () => {
    const { browser } = await start()
    await tap(browser, '#to-detail')
    const serve = (globalThis as any).fetch
    ;(globalThis as any).fetch = async (input: unknown, init: any) => {
      if (String(input).includes('deeper'))
        await sleep(150)
      return serve(input, init)
    }
    const slow = browser.window.stxRouter.navigate('/today/deeper')
    await sleep(20)
    await back(browser)
    expect(await slow).toBe(false)
    await sleep(200)
    expect(browser.window.location.pathname).toBe('/today')
    expect(shownText(browser)).toBe('Today')
    expect(browser.document.body.textContent).not.toContain('deeper')
  })

  it('does not swallow a tap while another page loads', async () => {
    const { browser } = await start()
    const css = browser.document.getElementById('stx-r-css').textContent
    expect(css).not.toContain('pointer-events:none}#stx')
    expect(css).not.toMatch(/stx-navigating [a-z]/)
  })
})

describe('a screen that cannot be loaded', () => {
  it('shows a retry in place instead of reloading, and retries into the same entry', async () => {
    const { browser } = await start()
    const serve = (globalThis as any).fetch
    let offline = true
    ;(globalThis as any).fetch = async (input: unknown, init: any) => {
      if (offline)
        throw new TypeError('Failed to fetch')
      return serve(input, init)
    }
    const errors: any[] = []
    browser.window.addEventListener('stx:navigate-error', (e: any) => errors.push(e.detail.url))
    const document = browser.document

    expect(await browser.window.stxRouter.navigate('/today/detail')).toBe(false)
    await sleep(60)
    expect(browser.document).toBe(document)
    expect(errors).toEqual(['/today/detail'])
    expect(browser.window.location.pathname).toBe('/today/detail')
    expect(inShown(browser, '[data-stx-retry]')).not.toBeNull()
    expect(inShown(browser, '.stx-retry-button').textContent).toBe('Try again')
    // The screen it was opened from is kept, for Back.
    expect(browser.document.querySelectorAll('[data-stx-screen]').length).toBe(2)

    offline = false
    await tap(browser, '.stx-retry-button')
    await sleep(60)
    expect(shownText(browser)).toBe('Detail')
    expect(browser.window.history.state.__stxDepth).toBe(1)
    await back(browser)
    expect(shownText(browser)).toBe('Today')
  })

  it('retries by itself when the connection comes back', async () => {
    const { browser } = await start()
    const serve = (globalThis as any).fetch
    let offline = true
    ;(globalThis as any).fetch = async (input: unknown, init: any) => {
      if (offline)
        throw new TypeError('Failed to fetch')
      return serve(input, init)
    }
    await browser.window.stxRouter.navigate('/today/detail')
    await sleep(60)
    offline = false
    browser.window.dispatchEvent(new browser.window.Event('online'))
    await sleep(120)
    expect(shownText(browser)).toBe('Detail')
  })
})
