/**
 * A component's emitted `error` reaches its caller and stops there
 * (stacksjs/stx#2201).
 *
 * An emit is a bubbling CustomEvent, and an `error` that bubbles reaches
 * window, where every error tracker listens: a mistyped confirmation email
 * on <Signup> was reported as a page crash with the message "undefined".
 * The caller's @error still runs; window and the elements around the
 * component no longer hear it. Every other emit bubbles as before.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../stx/test-utils/browser-timeout'
import type { BrowserPage } from './support/browser-page'
import { openBrowserPage } from './support/browser-page'

allowForARealBrowser()

let page: BrowserPage

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'emitted-error-stays-local',
    width: 600,
    height: 900,
    ready: `!!document.querySelector('#outer form')`,
    body: `
<script client>
const heard = []
window.heard = heard
window.reported = []
window.addEventListener('error', function(e) { window.reported.push(String(e.message)) })
</script>
<div id="outer" @error="heard.push(['outer error'])" @social="heard.push(['outer social', $event.detail])">
  <Signup @error="heard.push(['error', $event])" @social="heard.push(['social', $event])" />
</div>`,
  })
}, 60_000)

afterAll(() => page?.close())

const fill = `
  const form = document.querySelector('#outer form')
  const set = (name, value) => { const input = form.querySelector('[name="' + name + '"]'); input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })) }
  const later = fn => new Promise(done => setTimeout(() => done(fn()), 150))
`

describe('an emitted error', () => {
  it('reaches the caller\'s @error, and neither window nor the elements around it', async () => {
    const result = await page.json(`${fill}
      set('name', 'Ada'); set('email', 'ada@example.com'); set('confirm_email', 'ada@example.org'); set('password', 'correct horse')
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      return later(() => ({ heard: heard.splice(0), reported: window.reported.splice(0) }))`)
    expect(result).toEqual({ heard: [['error', { message: 'Emails do not match' }]], reported: [] })
    expect(await page.errors()).toEqual([])
  })
})

describe('any other emit', () => {
  it('still bubbles to the elements around the component', async () => {
    const result = await page.json(`${fill}
      const social = Array.from(form.closest('#outer').querySelectorAll('button')).find(b => /google|github|twitter|social/i.test(b.textContent + ' ' + (b.getAttribute('aria-label') || '')))
      if (!social) return { missing: true }
      social.click()
      return later(() => ({ heard: heard.splice(0).map(entry => entry[0]) }))`)
    expect(result).toEqual({ heard: ['social', 'outer social'] })
  })
})
