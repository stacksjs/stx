/**
 * A component that stays on the page during SPA navigation stays alive and
 * bound (stacksjs/stx#1958).
 *
 * A component the LAYOUT renders (a nav, a sign-in sheet) lives outside the
 * router's swap container, so a same-layout navigation leaves its root, and
 * the bindings on it, in place. Its script used to run again anyway: the
 * fragment carried every body script outside the container, the component's
 * was stamped data-stx-run="always", and the router re-ran it, as did the
 * full-document path. The markup was never rebound (the stx:load walk skips a
 * bound element), so the re-run set up a second instance nothing on the page
 * read:
 *
 *   - state the component set after the first navigation never rendered
 *   - as an @include, the first instance's onDestroy had run, so its
 *     listeners were gone
 *   - a listener registered without onDestroy was added again per navigation
 *   - as a tag, the registry kept one orphan scope per page visited
 *
 * The router now skips a script stamped data-stx-owner whose root stayed on
 * the page, so the instance the page loaded with is the only one. For that
 * instance to keep working, its lifecycle has to be its own: an @include
 * registers its scope before its body runs, and an onDestroy registered
 * inside onMount stays with the component instead of the global queue that
 * every stx:load drains.
 *
 * Both server shapes run every case: a fragment (extractContainerContent, what
 * the production builder writes) and a whole document (what a non-shell
 * serveApp answers an SPA request with). The harness (spa-harness.ts) renders
 * the pages with processDirectives and the real router, loads them into
 * very-happy-dom with every script executed in document order, and navigates
 * through the real router.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { extractContainerContent } from '../../src/app-shell'
import type { Browser, Counters, ServeMode, SpaApp } from './spa-harness'
import { boot, closeBrowser, counts, dispatch, find, layout, page, renderApp, settle, shown, sleep, text } from './spa-harness'

setDefaultTimeout(60_000)

// ---------------------------------------------------------------------------
// The app
// ---------------------------------------------------------------------------

/**
 * The issue's minimal component, with the counters it describes. window rather
 * than globalThis: they are the same object in a browser, and here globalThis
 * is the test process.
 */
const REPRO = `<script client>
  const open = state(false)
  window.__repro.setups++

  function show() {
    open.set(true)
  }

  onMount(() => {
    window.__repro.mounts++
    window.addEventListener('repro:open', show)
    // Registered with no onDestroy counterpart, the other shape the issue measured.
    document.addEventListener('click', () => { window.__repro.clicks++ })
  })
  onDestroy(() => {
    window.__repro.destroys++
    window.removeEventListener('repro:open', show)
  })
</script>

<div id="repro">
  <span id="repro-text">{{ open() ? 'open' : 'closed' }}</span>
  <span id="repro-if" :if="open()">IF</span>
</div>
`

/** The same shape, rendered INSIDE the swap container: recreated per page. */
const INNER = `<script client>
  const open = state(false)
  window.__inner.setups++

  function show() {
    open.set(true)
  }

  onMount(() => {
    window.__inner.mounts++
    window.addEventListener('inner:open', show)
  })
  onDestroy(() => {
    window.__inner.destroys++
    window.removeEventListener('inner:open', show)
  })
</script>

<div class="inner">
  <span class="inner-text">{{ open() ? 'open' : 'closed' }}</span>
  <span class="inner-if" :if="open()">IF</span>
</div>
`

/** The other layout's own component, for the layout-change controls. */
const BADGE = `<script client>
  const open = state(false)
  window.__badge.setups++

  function show() {
    open.set(true)
  }

  onMount(() => {
    window.__badge.mounts++
    window.addEventListener('badge:open', show)
  })
  onDestroy(() => {
    window.__badge.destroys++
    window.removeEventListener('badge:open', show)
  })
</script>

<div id="badge">
  <span id="badge-text">{{ open() ? 'open' : 'closed' }}</span>
</div>
`

/** A page-scoped partial: its script is stamped data-stx-run="always" inside the container. */
const TALLY = `<script client>
  const hits = state(0)
  window.__tally.runs++

  function bump() {
    hits.set(hits() + 1)
  }

  onMount(() => window.addEventListener('tally:bump', bump))
  onDestroy(() => window.removeEventListener('tally:bump', bump))
</script>

<p class="tally">{{ hits() }}</p>
`

/** Counts per placement, so the layout's instance and the page's are told apart. */
const DUAL = `<script client>
  const open = state(false)
  const root = window.__STX_CURRENT_ELEMENT__
  const where = !root ? 'orphan' : (root.closest('main') ? 'page' : 'chrome')
  window.__dual[where].setups++

  function show() {
    open.set(true)
  }

  onMount(() => {
    window.__dual[where].mounts++
    window.addEventListener('dual:open', show)
  })
  onDestroy(() => {
    window.__dual[where].destroys++
    window.removeEventListener('dual:open', show)
  })
</script>

<div class="dual">
  <span class="dual-text">{{ open() ? 'open' : 'closed' }}</span>
</div>
`

/** Used twice on a page, so its instances go through the shared factory prelude. */
const MULTI = `<script client>
  const open = state(false)
  window.__multi.setups++

  function show() {
    open.set(true)
  }

  onMount(() => {
    window.__multi.mounts++
    window.addEventListener('multi:open', show)
  })
  onDestroy(() => {
    window.__multi.destroys++
    window.removeEventListener('multi:open', show)
  })
</script>

<div class="multi">
  <span class="multi-text">{{ open() ? 'open' : 'closed' }}</span>
</div>
`

/** A component around another one. */
const OUTER = `<script client>
  const o = state(0)
  window.__outer.setups++
  onMount(() => { window.__outer.mounts++ })
  onDestroy(() => { window.__outer.destroys++ })
</script>

<div class="outer"><span class="outer-text">{{ o() }}</span><Multi /></div>
`

/** No signals: emitted as a plain script by processClientScript. */
const PLAIN = `<script client>
  window.__plain.runs++
  document.addEventListener('click', () => { window.__plain.clicks++ })
</script>

<div class="plain">plain</div>
`

/** No signals, but its template binds a declaration: wrapped in stx.mount. */
const MOUNTED = `<script client>
  window.__mounted.runs++
  function label() { return 'mounted' }
</script>

<div class="mounted" :text="label()">x</div>
`

/** No signals, through @include: the partial's non-signal branch. */
const NSIG = `<script client>
  window.__nsig.setups++
  function ping() { return 'pong' }
  onMount(() => { window.__nsig.mounts++ })
  onDestroy(() => { window.__nsig.destroys++ })
</script>

<div class="nsig" :text="ping()">nsig</div>
`

/** A composable at setup and one inside onMount: both must outlive a navigation. */
const LSN = `<script client>
  const open = state(false)
  const top = state(false)
  useEventListener('lsn:top', () => top.set(true))
  onMount(() => { useEventListener('lsn:open', () => open.set(true)) })
</script>

<div class="lsn"><span class="lsn-text">{{ open() ? 'open' : 'closed' }}</span><span class="lsn-top">{{ top() ? 'open' : 'closed' }}</span></div>
`

const LINKS = `<StxLink to="/" exactActiveClass="is-here">Home</StxLink>
  <StxLink to="/other" exactActiveClass="is-here">Other</StxLink>`

const FILES: Record<string, string> = {
  'components/Repro.stx': REPRO,
  'components/Inner.stx': INNER,
  'components/Badge.stx': BADGE,
  'components/Dual.stx': DUAL,
  'components/Multi.stx': MULTI,
  'components/Outer.stx': OUTER,
  'components/Lsn.stx': LSN,
  'components/Plain.stx': PLAIN,
  'components/Mounted.stx': MOUNTED,
  // The same source again, for a layout that @includes it instead of using
  // the tag. The two emit different scripts (utils.ts vs includes.ts), with
  // different lifecycle plumbing, so both ways in are covered.
  'partials/repro.stx': REPRO,
  'partials/tally.stx': TALLY,
  'partials/nsig.stx': NSIG,
  'layouts/default.stx': layout(`<nav><Repro />\n  ${LINKS}</nav>`),
  'layouts/included.stx': layout(`<nav>@include('repro')</nav>`),
  'layouts/auth.stx': layout('<header><Badge /></header>'),
  'layouts/both.stx': layout('<nav><Dual /></nav>'),
  'layouts/multi.stx': layout('<nav><Multi /><Multi /></nav>'),
  'layouts/nested.stx': layout('<nav><Outer /></nav>'),
  'layouts/nsig.stx': layout(`<nav>@include('nsig')</nav>`),
  'layouts/lsn.stx': layout('<nav><Lsn /></nav>'),
  'layouts/plain.stx': layout('<nav><Plain /></nav>'),
  'layouts/mounted.stx': layout('<nav><Mounted /></nav>'),
  // Bare pages: nothing but the layout's components carries a script.
  'pages/index.stx': page('default', '<h1>Home</h1>'),
  'pages/other.stx': page('default', '<h1>Other</h1>'),
  'pages/third.stx': page('default', '<h1>Third</h1>'),
  'pages/i/index.stx': page('included', '<h1>Home</h1>'),
  'pages/i/other.stx': page('included', '<h1>Other</h1>'),
  'pages/i/third.stx': page('included', '<h1>Third</h1>'),
  'pages/login.stx': page('auth', '<h1>Login</h1>'),
  // Pages whose own content carries scripts.
  'pages/c/one.stx': page('default', `<h1>One</h1>\n<Inner />\n@include('tally')`),
  'pages/c/two.stx': page('default', `<h1>Two</h1>\n<Inner />\n@include('tally')`),
  'pages/c/three.stx': page('default', `<h1>Three</h1>\n<Inner />\n@include('tally')`),
  'pages/q/one.stx': page('plain', '<h1>Q1</h1>\n<Plain />'),
  'pages/q/two.stx': page('plain', '<h1>Q2</h1>\n<Plain />'),
  // One page per probed layout shape.
  'pages/b/one.stx': page('both', '<h1>B1</h1>\n<Dual />'),
  'pages/b/two.stx': page('both', '<h1>B2</h1>\n<Dual />'),
  'pages/m/one.stx': page('multi', '<h1>M1</h1>'),
  'pages/m/two.stx': page('multi', '<h1>M2</h1>'),
  'pages/m/three.stx': page('multi', '<h1>M3</h1>'),
  'pages/x/one.stx': page('nested', '<h1>X1</h1>'),
  'pages/x/two.stx': page('nested', '<h1>X2</h1>'),
  'pages/n/one.stx': page('nsig', '<h1>N1</h1>'),
  'pages/n/two.stx': page('nsig', '<h1>N2</h1>'),
  'pages/l/one.stx': page('lsn', '<h1>L1</h1>'),
  'pages/l/two.stx': page('lsn', '<h1>L2</h1>'),
  'pages/p/one.stx': page('plain', '<h1>P1</h1>'),
  'pages/p/two.stx': page('plain', '<h1>P2</h1>'),
  'pages/o/one.stx': page('mounted', '<section class="page-one"><h1>O1</h1></section>'),
  'pages/o/two.stx': page('mounted', '<section class="page-two"><h1>O2</h1></section>'),
}

const ROUTES: Record<string, string> = {
  '/': 'pages/index.stx',
  '/other': 'pages/other.stx',
  '/third': 'pages/third.stx',
  '/i': 'pages/i/index.stx',
  '/i/other': 'pages/i/other.stx',
  '/i/third': 'pages/i/third.stx',
  '/login': 'pages/login.stx',
  '/c/one': 'pages/c/one.stx',
  '/c/two': 'pages/c/two.stx',
  '/c/three': 'pages/c/three.stx',
  '/q/one': 'pages/q/one.stx',
  '/q/two': 'pages/q/two.stx',
  '/b/one': 'pages/b/one.stx',
  '/b/two': 'pages/b/two.stx',
  '/m/one': 'pages/m/one.stx',
  '/m/two': 'pages/m/two.stx',
  '/m/three': 'pages/m/three.stx',
  '/x/one': 'pages/x/one.stx',
  '/x/two': 'pages/x/two.stx',
  '/n/one': 'pages/n/one.stx',
  '/n/two': 'pages/n/two.stx',
  '/l/one': 'pages/l/one.stx',
  '/l/two': 'pages/l/two.stx',
  '/p/one': 'pages/p/one.stx',
  '/p/two': 'pages/p/two.stx',
  '/o/one': 'pages/o/one.stx',
  '/o/two': 'pages/o/two.stx',
}

let app: SpaApp

beforeAll(async () => {
  app = await renderApp(FILES, ROUTES)
})

afterAll(async () => {
  await app?.dispose()
})

afterEach(closeBrowser)

function counters(): Record<string, unknown> {
  const fresh = () => ({ setups: 0, mounts: 0, destroys: 0 })
  return {
    __repro: { ...fresh(), clicks: 0 },
    __inner: fresh(),
    __badge: fresh(),
    __tally: { runs: 0 },
    __dual: { chrome: fresh(), page: fresh(), orphan: fresh() },
    __multi: fresh(),
    __outer: fresh(),
    __nsig: fresh(),
    __plain: { runs: 0, clicks: 0 },
    __mounted: { runs: 0 },
  }
}

/** Texts of every element `selector` matches, in document order. */
function texts(browser: Browser, selector: string): string[] {
  return Array.from(browser.document.querySelectorAll(selector)).map((el: any) => (el.textContent || '').trim())
}

function scopeCount(browser: Browser): number {
  return Object.keys(browser.window.stx._scopes).length
}

/** A click on the document, and how many times the listeners counted it. */
function clickCount(browser: Browser, tally: { clicks: number }): number {
  const before = tally.clicks
  browser.document.dispatchEvent(new browser.window.Event('click'))
  return tally.clicks - before
}

// ---------------------------------------------------------------------------
// The persistent layout component
// ---------------------------------------------------------------------------

/**
 * Two ways a layout renders a component, and they emit different scripts:
 *
 *   - the tag (components/Repro.stx as <Repro />) goes through the component
 *     renderer, whose scope id is keyed to the page that rendered it
 *   - @include (partials/repro.stx) goes through includes.ts, whose hooks fell
 *     back to the global queues on a re-run, where stx:load drained them
 */
const SHAPES = [
  { shape: 'rendered as a tag', first: '/', other: '/other', third: '/third' },
  { shape: 'rendered by @include', first: '/i', other: '/i/other', third: '/i/third' },
]

const MODES: ServeMode[] = ['fragment', 'document']

for (const serve of MODES) {
  const open = (pathname: string): Promise<Browser> => boot(app, pathname, { serve, globals: counters() })

  for (const { shape, first, other, third } of SHAPES) {
    // Away and back again, ending on the page that was loaded first. Returning
    // mattered for the tag: its scope id is derived from the page, so only the
    // FIRST page's script re-registered the id the live element carries.
    const hops = [other, third, first, other]

    describe(`a layout component outside the swap container, ${shape}, served as a ${serve}`, () => {
      it('(a) renders state set after a full load', async () => {
        const browser = await open(first)
        expect(text(browser, '#repro-text')).toBe('closed')
        expect(shown(browser, '#repro-if')).toBe(false)

        dispatch(browser, 'repro:open')
        await settle()

        expect(text(browser, '#repro-text')).toBe('open')
        expect(shown(browser, '#repro-if')).toBe(true)
        expect(browser.errors).toEqual([])
      })

      it('(b) renders state set after one navigation', async () => {
        const browser = await open(first)
        await browser.navigate(other)
        expect(text(browser, 'main h1')).toBe('Other')
        expect(text(browser, '#repro-text')).toBe('closed')

        dispatch(browser, 'repro:open')
        await settle()

        expect({ text: text(browser, '#repro-text'), shown: shown(browser, '#repro-if') })
          .toEqual({ text: 'open', shown: true })
      })

      it('(c) renders state set after three navigations', async () => {
        const browser = await open(first)
        for (const to of [other, third, other])
          await browser.navigate(to)
        expect(text(browser, 'main h1')).toBe('Other')

        dispatch(browser, 'repro:open')
        await settle()

        expect({ text: text(browser, '#repro-text'), shown: shown(browser, '#repro-if') })
          .toEqual({ text: 'open', shown: true })
      })

      it('(c) renders state set after coming back to the page loaded first', async () => {
        const browser = await open(first)
        for (const to of [other, third, first])
          await browser.navigate(to)
        expect(text(browser, 'main h1')).toBe('Home')

        dispatch(browser, 'repro:open')
        await settle()

        expect({ text: text(browser, '#repro-text'), shown: shown(browser, '#repro-if') })
          .toEqual({ text: 'open', shown: true })
      })

      it('(d) is set up and mounted once, and never destroyed, while its root stays', async () => {
        // The issue measured 1/1/0, then 2/2/2, 3/3/3: no live instance at all
        // from the first navigation on.
        const browser = await open(first)
        const repro = browser.window.__repro as Counters
        const seen = [counts(repro)]
        for (const to of hops) {
          await browser.navigate(to)
          seen.push(counts(repro))
        }
        expect(seen).toEqual(hops.concat(first).map(() => 'setups 1, mounts 1, destroys 0'))
      })

      it('(e) a listener added in onMount without onDestroy fires once per click', async () => {
        // Only a component that is left alone can pass this: nothing can remove
        // a listener its author never gave a teardown for.
        const browser = await open(first)
        const repro = browser.window.__repro
        const perClick = [clickCount(browser, repro)]
        for (const to of hops) {
          await browser.navigate(to)
          perClick.push(clickCount(browser, repro))
        }
        expect(perClick).toEqual([1, 1, 1, 1, 1])
      })

      it('(f) the scope registry does not grow per navigation', async () => {
        // Bare pages: the layout component is the only scope there is.
        const browser = await open(first)
        const sizes = [scopeCount(browser)]
        for (const to of hops) {
          await browser.navigate(to)
          sizes.push(scopeCount(browser))
        }
        expect(sizes).toEqual([1, 1, 1, 1, 1])
      })

      it('(g) keeps its state, its root and its bindings across a navigation', async () => {
        const browser = await open(first)
        const root = find(browser, '#repro')
        dispatch(browser, 'repro:open')
        await settle()

        // Read the moment the router says it is done, with no settling: a
        // component that is left alone has nothing to catch up on.
        const ok = await browser.window.stxRouter.navigate(other)
        expect(ok).toBe(true)
        const atResolve = { text: text(browser, '#repro-text'), shown: shown(browser, '#repro-if') }
        await settle()

        expect(atResolve).toEqual({ text: 'open', shown: true })
        expect(find(browser, '#repro')).toBe(root)
        expect(counts(browser.window.__repro)).toBe('setups 1, mounts 1, destroys 0')
      })

      it('(h) router.refresh() leaves it alone too', async () => {
        const browser = await open(first)
        await browser.navigate(other)
        await browser.window.stxRouter.refresh()
        await sleep(60)
        dispatch(browser, 'repro:open')
        await settle()

        expect(counts(browser.window.__repro)).toBe('setups 1, mounts 1, destroys 0')
        expect(text(browser, '#repro-text')).toBe('open')
      })
    })
  }

  describe(`other layout component shapes, served as a ${serve}`, () => {
    it('a component in both the layout and the page: only the page\'s is recreated', async () => {
      const browser = await open('/b/one')
      const dual = browser.window.__dual
      const snap = () => `chrome ${counts(dual.chrome)} | page ${counts(dual.page)} | orphan ${counts(dual.orphan)}`
      const seen = [snap()]
      for (const to of ['/b/two', '/b/one']) {
        await browser.navigate(to)
        seen.push(snap())
      }
      dispatch(browser, 'dual:open')
      await settle()

      expect(seen).toEqual([
        'chrome setups 1, mounts 1, destroys 0 | page setups 1, mounts 1, destroys 0 | orphan setups 0, mounts 0, destroys 0',
        'chrome setups 1, mounts 1, destroys 0 | page setups 2, mounts 2, destroys 1 | orphan setups 0, mounts 0, destroys 0',
        'chrome setups 1, mounts 1, destroys 0 | page setups 3, mounts 3, destroys 2 | orphan setups 0, mounts 0, destroys 0',
      ])
      expect(texts(browser, '.dual-text')).toEqual(['open', 'open'])
    })

    it('two instances of one component in the layout, through the factory prelude', async () => {
      expect(app.documents.get('/m/one')).toContain('data-stx-component-factories')
      const browser = await open('/m/one')
      const multi = browser.window.__multi
      const seen = [counts(multi)]
      const sizes = [scopeCount(browser)]
      for (const to of ['/m/two', '/m/three', '/m/one']) {
        await browser.navigate(to)
        seen.push(counts(multi))
        sizes.push(scopeCount(browser))
      }
      dispatch(browser, 'multi:open')
      await settle()

      expect(browser.errors).toEqual([])
      expect(seen).toEqual(Array.from({ length: 4 }, () => 'setups 2, mounts 2, destroys 0'))
      expect(sizes).toEqual([2, 2, 2, 2])
      expect(texts(browser, '.multi-text')).toEqual(['open', 'open'])
    })

    it('a component nested in a layout component', async () => {
      const browser = await open('/x/one')
      const snap = () => `outer ${counts(browser.window.__outer)} | inner ${counts(browser.window.__multi)}`
      const seen = [snap()]
      for (const to of ['/x/two', '/x/one']) {
        await browser.navigate(to)
        seen.push(snap())
      }
      dispatch(browser, 'multi:open')
      await settle()

      expect(seen).toEqual(Array.from({ length: 3 }, () => 'outer setups 1, mounts 1, destroys 0 | inner setups 1, mounts 1, destroys 0'))
      expect(text(browser, '.multi-text')).toBe('open')
    })

    it('a layout component with no signals runs its script once', async () => {
      const browser = await open('/p/one')
      const plain = browser.window.__plain
      const runs = [plain.runs]
      const perClick = [clickCount(browser, plain)]
      for (const to of ['/p/two', '/p/one', '/p/two']) {
        await browser.navigate(to)
        runs.push(plain.runs)
        perClick.push(clickCount(browser, plain))
      }
      expect({ runs, perClick }).toEqual({ runs: [1, 1, 1, 1], perClick: [1, 1, 1, 1] })
    })

    it('a layout component mounted through stx.mount keeps its own root, and only that', async () => {
      expect(app.documents.get('/o/one')).toMatch(/<script\b[^>]*\bdata-stx-instance="[^"]+"[^>]*>\s*window\.stx\.mount\(/)
      const browser = await open('/o/one')
      await browser.navigate('/o/two')
      // Re-run from the navigation, the wrapper mounted onto the incoming
      // page's content: its section on a fragment, the container itself on a
      // whole document.
      const holders = Array.from(browser.document.querySelectorAll('*'))
        .filter((el: any) => el.__stx_scope && typeof el.__stx_scope.label === 'function')
        .map((el: any) => el.className || el.tagName)
      expect({ runs: browser.window.__mounted.runs, holders }).toEqual({ runs: 1, holders: ['mounted'] })
      expect(text(browser, '.mounted')).toBe('mounted')
    })

    it('an @include with no signals in the layout', async () => {
      const browser = await open('/n/one')
      const seen = [counts(browser.window.__nsig)]
      for (const to of ['/n/two', '/n/one']) {
        await browser.navigate(to)
        seen.push(counts(browser.window.__nsig))
      }
      expect(browser.errors).toEqual([])
      expect(seen).toEqual(Array.from({ length: 3 }, () => 'setups 1, mounts 1, destroys 0'))
      expect(text(browser, '.nsig')).toBe('pong')
    })

    it('a composable listener registered at setup or inside onMount outlives a navigation', async () => {
      const browser = await open('/l/one')
      await browser.navigate('/l/two')
      dispatch(browser, 'lsn:open')
      dispatch(browser, 'lsn:top')
      await settle()
      expect([text(browser, '.lsn-text'), text(browser, '.lsn-top')]).toEqual(['open', 'open'])
    })

    it('back, forward and a prefetched page leave it alone', async () => {
      const browser = await open('/')
      browser.window.stxRouter.prefetch('/third')
      await sleep(60)
      await browser.navigate('/other')
      // pushState false: the popstate path.
      expect(await browser.window.stxRouter.navigate('/', false)).toBe(true)
      await sleep(60)
      await browser.navigate('/third')
      dispatch(browser, 'repro:open')
      await settle()

      expect(counts(browser.window.__repro)).toBe('setups 1, mounts 1, destroys 0')
      expect(text(browser, '#repro-text')).toBe('open')
    })
  })

  // -------------------------------------------------------------------------
  // Controls: what must keep working
  // -------------------------------------------------------------------------

  describe(`controls, served as a ${serve}`, () => {
    it('a component inside the swap container is recreated on every navigation', async () => {
      const browser = await open('/c/one')
      const inner = browser.window.__inner as Counters
      expect(counts(inner)).toBe('setups 1, mounts 1, destroys 0')
      dispatch(browser, 'inner:open')
      await settle()
      expect(text(browser, '.inner-text')).toBe('open')

      const steps: Array<[string, string]> = [
        ['/c/two', 'setups 2, mounts 2, destroys 1'],
        ['/c/three', 'setups 3, mounts 3, destroys 2'],
        ['/c/two', 'setups 4, mounts 4, destroys 3'],
      ]
      for (const [to, expected] of steps) {
        await browser.navigate(to)
        // The old instance is gone and a fresh one is bound: closed, then open.
        expect({ to, counts: counts(inner), text: text(browser, '.inner-text') })
          .toEqual({ to, counts: expected, text: 'closed' })
        dispatch(browser, 'inner:open')
        await settle()
        expect({ to, text: text(browser, '.inner-text'), shown: shown(browser, '.inner-if') })
          .toEqual({ to, text: 'open', shown: true })
      }
    })

    it('a page-scoped @include runs again on every visit', async () => {
      const browser = await open('/c/one')
      const tally = browser.window.__tally as { runs: number }
      expect(tally.runs).toBe(1)

      const visits = ['/c/two', '/c/three', '/c/two']
      for (let i = 0; i < visits.length; i++) {
        await browser.navigate(visits[i])
        dispatch(browser, 'tally:bump')
        await settle()
        expect({ to: visits[i], runs: tally.runs, hits: text(browser, '.tally') })
          .toEqual({ to: visits[i], runs: i + 2, hits: '1' })
      }
    })

    it('a component with no signals inside the swap container runs on every visit', async () => {
      const browser = await open('/q/one')
      const plain = browser.window.__plain
      const runs = [plain.runs]
      for (const to of ['/q/two', '/q/one']) {
        await browser.navigate(to)
        runs.push(plain.runs)
      }
      // The layout's instance ran once; the page's runs per visit.
      expect(runs).toEqual([2, 3, 4])
    })

    it('the layout\'s links still follow the route', async () => {
      const browser = await open('/')
      const here = () => Array.from(browser.document.querySelectorAll('nav a.is-here')).map((a: any) => a.getAttribute('href'))
      expect(here()).toEqual(['/'])
      await browser.navigate('/other')
      expect(here()).toEqual(['/other'])
      await browser.navigate('/')
      expect(here()).toEqual(['/'])
    })

    it('a different layout swaps the whole body and sets up that layout\'s components', async () => {
      const browser = await open('/')
      await browser.navigate('/login')
      // Only this route's: in a full suite run, polling timers other test files
      // leave behind also call the global fetch this browser installed.
      expect(browser.requests.filter(request => request.endsWith(' /login')))
        .toEqual(serve === 'fragment' ? ['fragment /login', 'document /login'] : ['fragment /login'])
      expect(browser.document.querySelector('nav')).toBeNull()
      expect(text(browser, 'main h1')).toBe('Login')

      const badge = browser.window.__badge as Counters
      expect(counts(badge)).toBe('setups 1, mounts 1, destroys 0')
      dispatch(browser, 'badge:open')
      await settle()
      expect(text(browser, '#badge-text')).toBe('open')
    })

    it('a different layout destroys the outgoing layout\'s components at the swap', async () => {
      const browser = await open('/')
      const repro = browser.window.__repro as Counters
      const badge = browser.window.__badge as Counters

      await browser.navigate('/login')
      // Destroyed with the chrome it belonged to, and gone from the registry:
      // the only scope left is the new layout's.
      expect(counts(repro)).toBe('setups 1, mounts 1, destroys 1')
      const scopes = Object.values(browser.window.stx._scopes) as any[]
      expect(scopes.map(scope => !!scope.__el?.querySelector('[id="badge"]'))).toEqual([true])

      await browser.navigate('/other')
      expect({ repro: counts(repro), badge: counts(badge) })
        .toEqual({ repro: 'setups 2, mounts 2, destroys 1', badge: 'setups 1, mounts 1, destroys 1' })

      // Same layout from here on: the new instance is the one that stays.
      await browser.navigate('/third')
      expect(counts(repro)).toBe('setups 2, mounts 2, destroys 1')
      expect(scopeCount(browser)).toBe(1)
    })

    it('coming back to the first layout sets its component up again, bound', async () => {
      const browser = await open('/')
      await browser.navigate('/login')
      await browser.navigate('/other')
      expect(text(browser, 'main h1')).toBe('Other')
      expect(browser.document.querySelector('header')).toBeNull()

      dispatch(browser, 'repro:open')
      await settle()
      expect(text(browser, '#repro-text')).toBe('open')
      expect(shown(browser, '#repro-if')).toBe(true)
    })
  })
}

describe('what a fragment carries', () => {
  const fragment = (route: string) => extractContainerContent(app.documents.get(route)!, 'main')
  const stamps = (html: string) => html.match(/data-stx-(?:owner|instance)="[^"]*"/g) ?? []

  it('leaves out the layout components\' own scripts', () => {
    // Tag, @include, a pair through the factory, no signals, stx.mount, and a
    // non-signal @include: none of their scripts reaches a fragment.
    for (const route of ['/other', '/i/other', '/m/two', '/p/two', '/o/two', '/n/two'])
      expect({ route, stamps: stamps(fragment(route)) }).toEqual({ route, stamps: [] })
    expect(fragment('/other')).not.toContain('window.__repro.setups++')
    expect(fragment('/i/other')).not.toContain('window.__repro.setups++')
  })

  it('keeps the page\'s own instances, and the factory prelude the layout\'s pair needed', () => {
    // Inner and the tally partial, both inside the container.
    expect(stamps(fragment('/c/two'))).toHaveLength(2)
    expect(fragment('/c/two')).toContain('window.__inner.setups++')
    expect(fragment('/c/two')).toContain('window.__tally.runs++')
    // Unstamped, so still carried: it registers factories, not an instance.
    expect(fragment('/m/two')).toContain('data-stx-component-factories')
  })
})
