/**
 * A tap on a page whose prefetch was refused must navigate, not freeze.
 *
 * navigate() hands over to an in-flight prefetch rather than asking the server
 * twice: it waits on the entry in 'prefetching' and re-enters itself once that
 * answer lands. Two defects met there and pinned the main thread.
 *
 * The sight budget (#2161) is charged where a job is dequeued, so a viewport
 * of links queues up to prefetchVisibleMax jobs before a single byte is
 * counted and every job still queued when the budget is crossed returns
 * early. That early return sat above the fetch chain whose .finally gives the
 * key back, so each one left an entry behind holding a promise that resolved
 * with nothing cached. navigate() then waited on an already settled promise,
 * found the cache still empty, and matched the same branch again on re-entry:
 * a hand-off to itself on every microtask. No error, no request, no console
 * output -- the window froze for good, and CDP could not even answer
 * Debugger.enable, because the thread that had to service it was the one
 * spinning. It showed up as an end-to-end suite that ran until CI's 20-minute
 * cap with no output at all.
 *
 * Both are fixed, and independently: the guard releases its key, and the
 * hand-off drops the entry it waited on before re-entering whatever left it
 * dangling. The second test runs the repro in a child process, once against
 * the shipped build and once against a build whose budget guard releases
 * nothing, so the hand-off's own guard is what has to stop the spin. A child
 * because a microtask loop starves its own thread: a timer never fires again,
 * so a regression cannot be caught in-process -- it would hang the suite
 * instead of failing it.
 */
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { getRouterScript } from '../src/client'

const names = ['window', 'document', 'location', 'history', 'fetch', 'navigator', 'performance', 'CustomEvent', 'Event', 'DOMParser', 'IntersectionObserver', 'PerformanceObserver'] as const
const originals = Object.fromEntries(names.map(name => [name, (globalThis as any)[name]]))
afterEach(() => { Object.assign(globalThis, originals) })

const LINKS = 12
const PAGE_BYTES = 1000
const BUDGET = 2000

const observers: FakeIntersection[] = []
class FakeIntersection {
  seen: any[] = []
  constructor(public callback: (entries: any[]) => void) { observers.push(this) }
  observe(target: any) { this.seen.push(target) }
  unobserve() {}
  disconnect() {}
  /** A viewport that already holds every link: one callback, all entries. */
  revealTogether() { this.callback(this.seen.map(target => ({ isIntersecting: true, target }))) }
}

/** The harness the child process runs too, kept in one place. */
function harnessSource(): string {
  return `
    const LINKS = ${LINKS}, PAGE_BYTES = ${PAGE_BYTES}, BUDGET = ${BUDGET}
    const observers = []
    class FakeIntersection {
      constructor(callback) { this.callback = callback; this.seen = []; observers.push(this) }
      observe(target) { this.seen.push(target) }
      unobserve() {}
      disconnect() {}
      revealTogether() { this.callback(this.seen.map(target => ({ isIntersecting: true, target }))) }
    }
    const requested = []
    const win = new Window({ url: 'http://localhost/' })
    const anchors = Array.from({ length: LINKS }, (_, i) => '<a href="/p' + i + '" data-stx-link id="l' + i + '">p' + i + '</a>').join('')
    win.document.write('<html><head><meta name="stx-build" content="b1"><meta name="stx-layout" content="layouts/app.stx"></head><body><main>Home' + anchors + '</main></body></html>')
    win.__stxRouterConfig = { cache: true, prefetch: true, prefetchVisible: true, progress: false, viewTransitions: false, revalidate: false, announceRoute: false, prefetchBudgetBytes: BUDGET }
    Object.assign(globalThis, {
      window: win, document: win.document, location: win.location, history: win.history,
      navigator: win.navigator, CustomEvent: win.CustomEvent, Event: win.Event, DOMParser: win.DOMParser,
      // A plain object, not a spread: spreading loses performance.now, which
      // the router calls, and every prefetch dies before it is requested.
      performance: { now: () => Date.now(), mark() {}, measure() {}, getEntriesByName: () => [], getEntriesByType: () => [] },
      fetch: async (url) => {
        const path = new URL(String(url), win.location.href).pathname
        requested.push(path)
        return new Response('<main>page ' + path + 'x'.repeat(PAGE_BYTES) + '</main>', {
          headers: { 'Content-Type': 'text/html', 'X-STX-Fragment': 'true', 'X-STX-Layout': 'layouts/app.stx' },
        })
      },
      IntersectionObserver: FakeIntersection,
      PerformanceObserver: undefined,
    })
  `
}

function install() {
  observers.length = 0
  const requested: string[] = []
  const window: any = new Window({ url: 'http://localhost/' })
  const anchors = Array.from({ length: LINKS }, (_, i) => `<a href="/p${i}" data-stx-link id="l${i}">p${i}</a>`).join('')
  // Inside the container: observeLinksNow scans from the active root, so links
  // outside it are never observed and the test would pass vacuously.
  window.document.write(`<html><head><meta name="stx-build" content="b1"></head><body><main>Home${anchors}</main></body></html>`)
  window.__stxRouterConfig = { cache: true, prefetch: true, prefetchVisible: true, progress: false, viewTransitions: false, revalidate: false, announceRoute: false, prefetchBudgetBytes: BUDGET }
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    navigator: window.navigator,
    CustomEvent: window.CustomEvent,
    Event: window.Event,
    DOMParser: window.DOMParser,
    performance: { now: () => Date.now(), mark() {}, measure() {}, getEntriesByName: () => [], getEntriesByType: () => [] },
    fetch: async (url: string) => {
      const path = new URL(String(url), window.location.href).pathname
      requested.push(path)
      return new Response(`<main>page ${path}${'x'.repeat(PAGE_BYTES)}</main>`, { headers: { 'Content-Type': 'text/html' } })
    },
    IntersectionObserver: FakeIntersection,
    PerformanceObserver: undefined,
  })
  new Function(getRouterScript())()
  return { window, requested }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('a prefetch the sight budget refused leaves nothing behind', () => {
  it('gives the key back, so the page can still be asked for on intent', async () => {
    const app = install()
    await wait(30)
    observers[0]!.revealTogether()
    await wait(150)

    // The budget bit: some of the twelve were fetched, the rest refused.
    const glanced = [...app.requested]
    expect(glanced.length).toBeGreaterThan(0)
    expect(glanced.length).toBeLessThan(LINKS)
    const refused = Array.from({ length: LINKS }, (_, i) => `/p${i}`).filter(path => !glanced.includes(path))
    expect(refused.length).toBeGreaterThan(0)

    // A hover is a person asking for that page, and it is not charged to the
    // budget. While the refused job's key was left in 'prefetching', this
    // found an entry already there and returned without asking for anything,
    // so the page was never fetched at all -- by hover, by touch or by tap.
    const target = refused[refused.length - 1]!
    app.window.document.getElementById(`l${target.slice(2)}`)
      .dispatchEvent(new app.window.Event('mouseover', { bubbles: true }))
    await wait(60)

    expect(app.requested).toContain(target)
  })
})

interface Run { code: number, out: string, err: string, timedOut: boolean }

/**
 * Reach a refused link and navigate to it, in a child process.
 *
 * 'leak' takes the release back out of the budget guard, which is how the
 * dangling entry arose, so that the hand-off's own guard is the only thing
 * left to stop the spin.
 */
async function navigateToRefused(mutate: 'none' | 'leak'): Promise<Run> {
  const client = fileURLToPath(new URL('../src/client.ts', import.meta.url))
  const root = fileURLToPath(new URL('../../..', import.meta.url))
  const script = `
    import { Window } from 'very-happy-dom'
    import { getRouterScript, getRouterScriptDev } from ${JSON.stringify(client)}

    // The dev build for the mutated run: it is the same script, whitespace
    // minified but with its identifiers intact, so the guard can be found.
    let script = ${mutate === 'leak' ? 'getRouterScriptDev()' : 'getRouterScript()'}
    ${mutate === 'leak'
  ? `
    const release = 'return Promise.resolve().then(function(){delete prefetching[key]})'
    if (!script.includes(release)) throw new Error('the budget guard no longer reads as expected; update this test')
    script = script.replace(release, 'return')
      `
    : ''}
    ${harnessSource()}
    new Function(script)()

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    await wait(30)
    observers[0].revealTogether()
    await wait(150)
    const glanced = [...requested]
    const refused = Array.from({ length: LINKS }, (_, i) => '/p' + i).filter(path => !glanced.includes(path))
    const target = refused[refused.length - 1]
    // Everything below this line is what froze. The router answers the tap at
    // once (a loading class, a progress bar) and hands over to the prefetch
    // it believes is on the way; that promise had already settled with
    // nothing cached.
    const answered = await win.stxRouter.navigate(target)
    await wait(50)
    console.log(JSON.stringify({
      glanced: glanced.length,
      refused: refused.length,
      target,
      answered,
      path: win.location.pathname,
      fetched: requested.includes(target),
      swapped: win.document.querySelector('main').textContent.indexOf('page ' + target) === 0,
    }))
  `
  const child = Bun.spawn([process.execPath, '-e', script], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
  let timedOut = false
  // A spinning child never ends on its own, and never answers anything again.
  const timer = setTimeout(() => { timedOut = true; child.kill(9) }, 20_000)
  const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])
  const code = await child.exited
  clearTimeout(timer)
  return { code, out, err, timedOut }
}

describe('the hand-off to an in-flight prefetch cannot hand off to itself', () => {
  for (const mutate of ['none', 'leak'] as const) {
    const what = mutate === 'none' ? 'the shipped router' : 'a router whose budget guard releases nothing'
    it(`navigates to a refused page under ${what}`, async () => {
      const run = await navigateToRefused(mutate)

      expect(run.timedOut, `${what} never finished: the hand-off is spinning again\n${run.out}\n${run.err}`).toBe(false)
      expect(run.code, run.err).toBe(0)

      const result = JSON.parse(run.out.trim().split('\n').pop()!)
      // Not vacuous: the budget has to have refused somebody.
      expect(result.glanced).toBeGreaterThan(0)
      expect(result.glanced).toBeLessThan(LINKS)
      expect(result.refused).toBeGreaterThan(0)
      // And the tap has to have been served, by a real fetch and a real swap.
      expect(result.answered).toBe(true)
      expect(result.fetched).toBe(true)
      expect(result.swapped).toBe(true)
      expect(result.path).toBe(result.target)
    }, 30_000)
  }
})
