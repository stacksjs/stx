import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import type { ServeMode, SpaApp } from './spa-harness'
import { boot, closeBrowser, find, layout, page, renderApp, settle, text } from './spa-harness'

const HEADER = `<script client>
  const userName = state('Pawel Example')
  const menuOpen = state(false)
  function toggleMenu() { menuOpen.set(!menuOpen()) }
</script>
<nav id="account">
  <span id="account-name">{{ userName }}</span>
  <button id="account-button" @click="toggleMenu()" :aria-expanded="menuOpen">Account</button>
  <div id="account-menu" :show="menuOpen" style="display:none">
    <a href="/profile">Profile</a>
    <a href="/settings">Settings</a>
    <button>Logout</button>
  </div>
</nav>`

let app: SpaApp
beforeAll(async () => {
  app = await renderApp({
    'partials/account.stx': HEADER,
    'layouts/settings.stx': layout('<header>Settings</header>'),
    'layouts/coach.stx': layout(`@include('account')
      <aside data-stx-scope="not_registered"><span id="unhydrated" x-cloak>Unhydrated</span></aside>`),
    'pages/settings.stx': page('settings', '<script client>const userName = state(\'Settings\')</script><h1 :text="userName"></h1>'),
    'pages/coach.stx': page('coach', '<h1>Coach</h1>'),
    'pages/plans.stx': page('coach', '<h1>Plans</h1>'),
  }, {
    '/settings': 'pages/settings.stx',
    '/coaches': 'pages/coach.stx',
    '/coaches/plans': 'pages/plans.stx',
  })
})
afterAll(async () => { await app?.dispose() })

for (const mode of ['fragment', 'document'] as ServeMode[]) {
  describe(`SPA layout scope cloak (${mode})`, () => {
    it('reveals the hydrated header while preserving hidden and unhydrated content', async () => {
      const browser = await boot(app, '/settings', { mode })
      try {
        await browser.navigate('/coaches')
        expect(text(browser, '#account-name')).toBe('Pawel Example')
        expect(find(browser, '#account-name').hasAttribute('x-cloak')).toBe(false)
        expect(find(browser, '#account-menu').hasAttribute('x-cloak')).toBe(false)
        expect(find(browser, '#account-menu').style.display).toBe('none')
        expect(find(browser, '#unhydrated').hasAttribute('x-cloak')).toBe(true)

        find(browser, '#account-button').click()
        await settle()
        expect(find(browser, '#account-button').getAttribute('aria-expanded')).toBe('true')
        expect(find(browser, '#account-menu').style.display).not.toBe('none')
        expect(text(browser, '#account-menu')).toContain('Profile')
        expect(text(browser, '#account-menu')).toContain('Logout')

        const header = find(browser, '#account')
        await browser.navigate('/coaches/plans')
        expect(find(browser, '#account')).toBe(header)
        expect(find(browser, '#account-name').hasAttribute('x-cloak')).toBe(false)
        expect(find(browser, '#account-menu').hasAttribute('x-cloak')).toBe(false)
        expect(find(browser, '#unhydrated').hasAttribute('x-cloak')).toBe(true)
        find(browser, '#account-button').click()
        await settle()
        expect(find(browser, '#account-button').getAttribute('aria-expanded')).toBe('false')
        expect(find(browser, '#account-menu').style.display).toBe('none')
      }
      finally {
        closeBrowser()
      }
    })
  })
}
