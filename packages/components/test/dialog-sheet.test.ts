/**
 * A dialog presented as a sheet on a phone: anchored to the bottom edge with
 * a grabber and the home indicator's inset, the centred card from `sm` up.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
import { render } from './utils/render-component'

describe('DialogPanel variant="sheet"', () => {
  it('anchors to the bottom on a phone and centres from sm up', async () => {
    const html = await render('<DialogPanel variant="sheet"><p>Unfollow?</p></DialogPanel>')
    expect(html).toContain('items-end')
    expect(html).toContain('sm:items-center')
    expect(html).toContain('rounded-t-panel')
    expect(html).toContain('env(safe-area-inset-bottom)')
    expect(html).toMatch(/aria-hidden="true"[^>]*sm:hidden/)
  })

  it('leaves the padding to its sections when flush', async () => {
    const html = await render('<DialogPanel variant="sheet" flush><header class="px-6">Plan</header></DialogPanel>')
    const panel = html.match(/<div class="([^"]*)"[^>]*data-stx-dialog-panel/)![1]
    expect(panel.split(' ')).toEqual(expect.arrayContaining(['flex', 'flex-col', 'rounded-t-panel']))
    expect(panel).not.toMatch(/(^| )p-[56]( |$)/)
    expect(panel).not.toContain('sm:p-6')
    expect(html).toContain('padding-bottom: env(safe-area-inset-bottom);')
    expect(html).toMatch(/aria-hidden="true" class="[^"]*mt-2\.5[^"]*"/)
  })

  it('keeps the centred card by default', async () => {
    const html = await render('<DialogPanel><p>Confirm</p></DialogPanel>')
    expect(html).toContain('items-center justify-center p-4')
    expect(html).not.toContain('rounded-t-panel')
    expect(html).not.toContain('safe-area-inset-bottom')
  })
})

const UI = path.join(import.meta.dir, '..', 'src', 'ui')
const FILES = {
  'layouts/app.stx': layout(''),
  'components/Dialog.stx': readFileSync(path.join(UI, 'dialog/Dialog.stx'), 'utf-8'),
  'pages/toggle.stx': page('app', `<script client>
const shown = state(false)
window.probe = { shown }
</script>
<Dialog :open="shown()" title="Unfollow"><p>body</p></Dialog>`),
}

describe('Dialog data-state', () => {
  afterEach(() => closeBrowser())

  it('says whether it is open, for page CSS that steps aside under it', async () => {
    const app = await renderApp(FILES, { '/toggle': 'pages/toggle.stx' })
    const browser = await boot(app, '/toggle')
    await settle()
    const dialog = () => browser.document.querySelector('[role="dialog"]')!
    expect(dialog().getAttribute('data-state')).toBe('closed')
    browser.window.probe.shown.set(true)
    await settle()
    expect(dialog().getAttribute('data-state')).toBe('open')
  })
})
