import { afterEach, expect, it } from 'bun:test'
import { generateSignalsRuntime } from '../../src/signals'
import { scopedActionsCaller, scopedActionsTable } from '../../test-utils/scoped-slot-actions-fixture'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'

afterEach(closeBrowser)

it.each(['default', 'compile'])('%s hydrates real Buttons in scoped row slots and retains the clicked row after replacement (#2101)', async (mode) => {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/Table.stx': scopedActionsTable,
    'components/Button.stx': await Bun.file(new URL('../../../components/src/ui/button/Button.stx', import.meta.url)).text(),
    'pages/probe.stx': page('app', scopedActionsCaller()),
  }, { '/probe': 'pages/probe.stx' }, mode === 'compile' ? { buildMode: 'compile' } : {})
  try {
    if (mode === 'compile') {
      // The production builder supplies this external runtime; the DOM harness
      // executes inline scripts only (as in minified-client-bundles.test.ts).
      const runtimeTag = '<script data-stx-runtime src="/__stx/runtime.__STX_HASH__.js"></script>'
      const html = app.documents.get('/probe')!
      expect(html).toContain(runtimeTag)
      app.documents.set('/probe', html.replace(runtimeTag, () => `<script data-stx-runtime>${generateSignalsRuntime()}</script>`))
    }
    const browser = await boot(app, '/probe')
    await settle()
    expect(browser.errors).toEqual([])
    const buttons = () => [...browser.document.querySelectorAll('tbody button')]
    expect(buttons()).toHaveLength(50)
    expect(buttons().every(button => button.textContent?.trim() === 'Edit')).toBe(true)
    buttons()[17].dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true }))
    expect(browser.window.editedRows).toEqual([17])
    browser.window.actionsRows.set([{ id: 49, name: 'updated' }, { id: 0, name: 'first' }])
    await settle()
    expect(buttons()).toHaveLength(2)
    buttons()[0].dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true }))
    buttons()[1].dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true }))
    expect(browser.window.editedRows).toEqual([17, 49, 0])
    browser.window.actionsRows.set([])
    await settle()
    expect(buttons()).toHaveLength(0)
  }
  finally {
    await app.dispose()
  }
}, 30_000)
