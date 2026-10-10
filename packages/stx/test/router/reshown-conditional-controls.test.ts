/** A hydrated parent may be hidden while a previously-false child becomes
 * true. Showing that parent again must resume the child's deferred hydration. */
import { afterEach, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

afterEach(closeBrowser)

it('binds and uncloaks new controls when an already-hydrated parent returns', async () => {
  const app = await renderApp({
    'layouts/default.stx': layout(''),
    'views/reader.stx': page('default', `<script client>
const selected = state(true)
const folder = state('Drafts')
const clicks = state(0)
window.READER_SELECT = value => selected.set(value)
window.READER_FOLDER = value => folder.set(value)
</script>
<article :if="selected">
  <button :if="folder !== 'Drafts'" @click="clicks.update(value => value + 1)">Reply</button>
  <span :text="clicks"></span>
</article>`),
  }, { '/reader': 'views/reader.stx' })
  try {
    const browser = await boot(app, '/reader')
    browser.window.READER_SELECT(false)
    browser.window.READER_FOLDER('INBOX')
    await settle()
    browser.window.READER_SELECT(true)
    await settle()
    const button = browser.document.querySelector('button')
    expect(button).not.toBeNull()
    expect(button.hasAttribute('x-cloak')).toBe(false)
    expect(button.hasAttribute('@click')).toBe(false)
    button.dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    await settle()
    expect(browser.document.querySelector('span').textContent).toBe('1')
  }
  finally { await app.dispose() }
})
