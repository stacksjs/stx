/**
 * A tab tap is a fragment swap, not a full document load.
 *
 * The mobile components emitted plain `<a href>`. The SPA router intercepts
 * `[data-stx-link]` and nothing else, so every tap on a bottom tab was a cold
 * document load: the runtime rebooted, every signal and store was discarded,
 * and the screen flashed white. On a phone the tab bar is the PRIMARY
 * navigation control, so the app's main interaction was its worst one - the
 * single largest reason a wrapped build reads as a browser rather than an app.
 * stacksjs/stx#1988.
 *
 * `<TabBar>` was otherwise carefully built - floating bar, safe-area handling,
 * a labelled nav landmark. The anchor was the one thing missed, and nothing
 * about the rendered page looks wrong; you have to watch the network panel or
 * notice the state loss.
 *
 * This is the floor, not the goal. A fragment swap still fetches BEFORE the
 * view changes, where a phone app switches instantly and loads into the screen
 * it already showed. That gap is a navigator concern and has its own issue;
 * this file is about not reloading the document.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')
const MOBILE = path.join(ROOT, 'src/ui/mobile')

async function render(markup: string): Promise<string> {
  return processDirectives(
    markup,
    {},
    path.join(ROOT, 'mobile-link-audit.stx'),
    { componentsDir: MOBILE, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/** The opening tags of every anchor in the markup, whitespace collapsed. */
function anchors(html: string): string[] {
  return [...html.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/<a\b[^>]*>/g)]
    .map(([tag]) => tag.replace(/\s+/g, ' '))
}

describe('an internal link in the mobile components is router-owned (#1988)', () => {
  const internal: [string, string][] = [
    ['<TabBarItem label="Feed" href="/feed" />', '/feed'],
    ['<TabBarItem label="Feed" href="/feed" active="true" />', '/feed'],
    ['<FilterChip label="New" href="/f/new" />', '/f/new'],
    ['<NavBar backHref="/feed" />', '/feed'],
    ['<SectionCard action="All" actionHref="/all" />', '/all'],
  ]

  for (const [markup, href] of internal) {
    it(`${markup} hands ${href} to the router`, async () => {
      const [anchor] = anchors(await render(markup))

      expect(anchor).toContain(`href="${href}"`)
      expect(anchor).toContain('data-stx-link')
    })
  }

  /*
   * The other half, which matters as much: the router does not handle an
   * absolute URL, a scheme, or a bare fragment, so claiming one would break a
   * tab that points off-site rather than improve it.
   */
  const external = [
    '<TabBarItem label="Docs" href="https://example.com/docs" />',
    '<TabBarItem label="Mail" href="mailto:a@b.c" />',
    '<TabBarItem label="Call" href="tel:+100" />',
    '<TabBarItem label="None" />',
  ]

  for (const markup of external) {
    it(`${markup} is left to the browser`, async () => {
      const [anchor] = anchors(await render(markup))

      expect(anchor).toBeString()
      expect(anchor).not.toContain('data-stx-link')
    })
  }

  it('keeps aria-current on the active tab', async () => {
    const [anchor] = anchors(await render('<TabBarItem label="Feed" href="/feed" active="true" />'))

    expect(anchor).toContain('aria-current="page"')
    expect(anchor).toContain('data-stx-link')
  })

  /*
   * A sweep, so a new mobile component with an anchor is covered the day it
   * lands. Every anchor in the directory has to be reachable by the router or
   * deliberately not: in practice that means the file consults routerOwns
   * before emitting data-stx-link.
   */
  it('leaves no anchor in the mobile directory unaccounted for', () => {
    const offenders: string[] = []
    for (const entry of readdirSync(MOBILE)) {
      if (!entry.endsWith('.stx'))
        continue
      const source = readFileSync(path.join(MOBILE, entry), 'utf-8')
      if (/<a(?=[\s\n>])/.test(source) && !source.includes('data-stx-link'))
        offenders.push(entry)
    }

    expect(offenders).toEqual([])
  })
})

describe('tapping a tab does not reload the document (#1988)', () => {
  afterEach(() => {
    closeBrowser()
  })

  const FILES = {
    'layouts/app.stx': layout(''),
    'components/TabBar.stx': readFileSync(path.join(MOBILE, 'TabBar.stx'), 'utf-8'),
    'components/TabBarItem.stx': readFileSync(path.join(MOBILE, 'TabBarItem.stx'), 'utf-8'),
    /*
     * `items` is an array prop, not slot children: TabBar has no <slot />, so
     * `<TabBar><TabBarItem /></TabBar>` renders an empty bar.
     */
    'pages/feed.stx': page('app', `<h1>FEED</h1>
<TabBar :items="[{ label: 'Feed', href: '/feed', active: true }, { label: 'Saved', href: '/saved' }]" />`),
    'pages/saved.stx': page('app', `<h1>SAVED</h1>
<TabBar :items="[{ label: 'Feed', href: '/feed' }, { label: 'Saved', href: '/saved', active: true }]" />`),
  }

  const ROUTES = { '/feed': 'pages/feed.stx', '/saved': 'pages/saved.stx' }

  it('asks the server for a fragment and swaps it in', async () => {
    const app = await renderApp(FILES, ROUTES)
    try {
      const browser = await boot(app, '/feed')
      await settle()

      const saved = [...browser.document.querySelectorAll('[data-stx-tab-bar-item]')]
        .find((item: any) => item.getAttribute('href') === '/saved')

      expect(saved).toBeTruthy()
      saved.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true, cancelable: true }))
      await settle()
      await settle()

      /*
       * The two things that say "the router took this, the browser did not":
       * it asked for a FRAGMENT, and the URL changed without a document load.
       * Before the fix neither happened - the click was the browser's, so the
       * harness saw no request at all and the page would simply have been
       * replaced.
       */
      expect(browser.requests).toContain('fragment /saved')
      expect(browser.requests).not.toContain('document /saved')
      expect(browser.window.location.pathname).toBe('/saved')
    }
    finally {
      await app.dispose()
    }
  })
})
