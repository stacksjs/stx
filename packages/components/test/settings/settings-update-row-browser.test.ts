/**
 * <SettingsUpdateRow> on the web, in a real browser: the row an app that
 * updates itself shows, drawn from the status its updater reports.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { allowForARealBrowser } from '../../../stx/test-utils/browser-timeout'
import type { BrowserPage } from '../support/browser-page'
import { openBrowserPage } from '../support/browser-page'

allowForARealBrowser()

let page: BrowserPage

const HELPERS = `
  const row = () => document.querySelector('[data-setting="software-update"]')
  const text = sel => (row().querySelector(sel) || { textContent: '' }).textContent.trim()
  const buttons = () => Array.from(row().querySelectorAll('button')).filter(b => b.getBoundingClientRect().width > 0)
  const later = (fn, ms) => new Promise(done => setTimeout(() => done(fn()), ms || 120))
  const read = () => ({
    label: text('.stx-settings-row-label'),
    sentence: text('.stx-settings-row-description'),
    progress: (() => { const p = row().querySelector('[data-settings-update-progress]'); return p && p.getBoundingClientRect().width > 0 ? p.textContent.trim() : '' })(),
    buttons: buttons().map(b => [b.textContent.trim(), b.getAttribute('data-intent'), b.disabled]),
  })
  const move = (next) => { probe.status.set({ currentVersion: '2.4', selfUpdating: true, ...next }); return later(read) }
`
const on = (body: string): string => `${HELPERS}\n${body}`

beforeAll(async () => {
  page = await openBrowserPage({
    name: 'settings-update-row-browser',
    width: 560,
    height: 300,
    ready: `document.querySelectorAll('[data-setting="software-update"]').length === 1`,
    body: `
<script client>
const status = state({ currentVersion: '2.4', state: 'idle', selfUpdating: true })
const heard = []
window.probe = { status, heard }
</script>
<SettingsGroup header="Software Update">
  <SettingsUpdateRow appName="Library" :status="status()" @check="heard.push('check')" @install="heard.push('install')" @relaunch="heard.push('relaunch')" />
</SettingsGroup>`,
  })
}, 60_000)

afterAll(() => page?.close())

describe('the update row on the web', () => {
  it('raises no script errors and is a settings row a search can find', async () => {
    expect(await page.errors()).toEqual([])
    expect(await page.json(on(`return later(() => ({ ...read(), found: row().getAttribute('data-label'), keywords: row().getAttribute('data-keywords'), inCard: !!row().closest('.stx-settings-card') }))`))).toEqual({
      label: 'Library 2.4',
      sentence: 'Check for a newer version.',
      progress: '',
      buttons: [['Check Now', 'default', false]],
      found: 'Library 2.4',
      keywords: 'update version upgrade release',
      inCard: true,
    })
  })

  it('shows the button for each state and emits its action', async () => {
    await page.json(on(`buttons()[0].click(); return later(() => true)`))
    expect(await page.json(on(`return move({ state: 'checking' })`))).toMatchObject({ sentence: 'Checking for updates...', buttons: [['Check Now', 'default', true]] })
    expect(await page.json(on(`return move({ state: 'current' })`))).toMatchObject({ sentence: 'Library is up to date.', buttons: [['Check Now', 'default', false]] })

    expect(await page.json(on(`return move({ state: 'available', version: '2.5' })`))).toMatchObject({ sentence: 'Version 2.5 is available.', buttons: [['Download and Install', 'primary', false]] })
    await page.json(on(`buttons()[0].click(); return later(() => true)`))

    expect(await page.json(on(`return move({ state: 'downloading', version: '2.5', progress: 0.42 })`))).toMatchObject({ sentence: 'Downloading version 2.5...', progress: '42%', buttons: [['Download and Install', 'primary', true]] })
    // A button that cannot be pressed emits nothing.
    await page.json(on(`buttons()[0].click(); return later(() => true)`))
    expect(await page.json(on(`return move({ state: 'installing', version: '2.5' })`))).toMatchObject({ sentence: 'Installing version 2.5...', progress: '' })

    expect(await page.json(on(`return move({ state: 'installed', version: '2.5' })`))).toMatchObject({ sentence: 'Version 2.5 is installed. Restart Library to finish updating.', buttons: [['Restart to Update', 'primary', false]] })
    await page.json(on(`buttons()[0].click(); return later(() => true)`))

    expect(await page.json(`return probe.heard`)).toEqual(['check', 'install', 'relaunch'])
  })

  it('offers nothing to press to an app that cannot update itself', async () => {
    expect(await page.json(on(`return move({ state: 'unavailable', selfUpdating: false, reason: 'Updates come from the Mac App Store.' })`))).toMatchObject({ sentence: 'Updates come from the Mac App Store.', buttons: [] })
    expect(await page.json(on(`return move({ state: 'error', error: 'The download was interrupted.' })`))).toMatchObject({ sentence: 'The download was interrupted.', buttons: [['Check Now', 'default', false]] })
    expect(await page.errors()).toEqual([])
  })
})
