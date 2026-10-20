import { afterEach, expect, it } from 'bun:test'
import { scopedSlotTable, scopedSlotTableCaller } from '../../test-utils/scoped-slot-table-fixture'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'

afterEach(closeBrowser)

it('hydrates interpolation alongside attributes in nested conditional table slots (#2095)', async () => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Probe.stx': scopedSlotTable,
    'pages/probe.stx': page('app', scopedSlotTableCaller),
  }, { '/probe': 'pages/probe.stx' })
  try {
    const browser = await boot(app, '/probe')
    await settle()
    const cells = () => [...browser.document.querySelectorAll('.interpolation')].map(el => el.textContent)
    const attrs = () => [...browser.document.querySelectorAll('.attribute')].map(el => [el.textContent, el.getAttribute('title')])
    const names = Array.from({ length: 50 }, (_, id) => `row-${id}`)
    expect(attrs()).toEqual(names.map(name => [name, name]))
    expect(cells()).toEqual(names.map(name => `INTERP:${name}`))
    expect(browser.document.querySelector('.interpolation')?.closest('[x-cloak]')).toBeNull()
    browser.window.slotTableRows.set([{ id: 49, name: 'updated' }, { id: 0, name: 'first' }])
    await settle()
    expect(cells()).toEqual(['INTERP:updated', 'INTERP:first'])
    browser.window.slotTableColumns.set([{ key: 'name', slotted: false }])
    await settle()
    expect(cells()).toEqual([])
    browser.window.slotTableColumns.set([{ key: 'name', slotted: true }])
    await settle()
    expect(cells()).toEqual(['INTERP:updated', 'INTERP:first'])
  }
  finally {
    await app.dispose()
  }
})
