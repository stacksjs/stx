/**
 * A page's own names win over a layout component's after SPA navigation.
 *
 * Every component scope is merged into one shared scope object, and the stx:load
 * walk after a navigation merged the scopes of layout components that stayed on
 * the page — ones it then skipped as already bound — AFTER the destination
 * page's setup. A layout component and a page that both declared `connected`
 * therefore rendered the page with the component's value: on wildloop.org the
 * Settings page's Garmin card read "Connected" (the offline banner's
 * `connected = state(true)`) for an account that had never connected, but only
 * when reached by a link; a full load was right.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import type { ServeMode, SpaApp } from './spa-harness'
import { boot, closeBrowser, layout, page, renderApp, settle, text } from './spa-harness'

setDefaultTimeout(60_000)

/** Stands in for the offline banner: always in the layout, always online. */
const BANNER = `<script client>
  const connected = state(true)
</script>

<div id="banner">{{ connected() ? 'online' : 'offline' }}</div>
`

const FILES: Record<string, string> = {
  'components/Banner.stx': BANNER,
  'layouts/default.stx': layout('<footer><Banner /></footer>'),
  'pages/index.stx': page('default', '<h1>Home</h1>'),
  'pages/settings.stx': page('default', `<script client>
  const connected = state(false)
</script>

<p id="card">{{ connected() ? 'Connected' : 'Not connected' }}</p>`),
}

const ROUTES: Record<string, string> = {
  '/': 'pages/index.stx',
  '/settings': 'pages/settings.stx',
}

let app: SpaApp

beforeAll(async () => {
  app = await renderApp(FILES, ROUTES)
})

afterAll(async () => {
  await app?.dispose()
})

afterEach(closeBrowser)

const MODES: ServeMode[] = ['fragment', 'document']

for (const serve of MODES) {
  describe(`a name a layout component shares with the page, served as a ${serve}`, () => {
    it('reads the page\'s own value after navigating to it', async () => {
      const browser = await boot(app, '/', { serve })
      await settle()
      await browser.navigate('/settings')
      await settle()

      expect(text(browser, '#card')).toBe('Not connected')
      // The component keeps its own binding.
      expect(text(browser, '#banner')).toBe('online')
      expect(browser.errors).toEqual([])
    })
  })
}
