import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
import { validateButtonProps } from '../src/ui/button'

afterEach(closeBrowser)

describe('Button native text compatibility uses the shared label behavior', () => {
  it('validates both label spellings as strings', () => {
    expect(validateButtonProps({ label: 'Save', text: 'Fallback' }).valid).toBe(true)
    expect(validateButtonProps({ text: 42 }).valid).toBe(false)
  })

  it('tracks text, gives label precedence, and retains the spinner and slot fallback', async () => {
    const app = await renderApp({
      'layouts/app.stx': layout(''),
      'components/Button.stx': await Bun.file(join(import.meta.dir, '../src/ui/button/Button.stx')).text(),
      'pages/index.stx': page('app', `<script client>
const text = state('Text alias')
const label = state('')
const loading = state(false)
window.probe = { text, label, loading }
</script><Button id="button" :text="text" :label="label" :loading="loading">Fallback slot</Button><Button id="static" text="Static alias" />`),
    }, { '/': 'pages/index.stx' })
    try {
      const browser = await boot(app, '/')
      await settle()
      const button = () => find(browser, '#button')
      expect(button().textContent).toContain('Text alias')
      expect(find(browser, '#static').textContent).toContain('Static alias')
      expect(button().textContent).not.toContain('Fallback slot')
      browser.window.probe.text.set('Updated alias')
      browser.window.probe.loading.set(true)
      await settle()
      expect(button().textContent).toContain('Updated alias')
      expect(button().querySelector('svg')).not.toBeNull()
      expect(button().disabled).toBe(true)
      browser.window.probe.label.set('Preferred label')
      await settle()
      expect(button().textContent).toContain('Preferred label')
      expect(button().textContent).not.toContain('Updated alias')
      browser.window.probe.label.set('')
      browser.window.probe.text.set('')
      browser.window.probe.loading.set(false)
      await settle()
      expect(button().textContent).toContain('Fallback slot')
      expect(button().disabled).toBe(false)
      expect(browser.errors).toEqual([])
    }
    finally { await app.dispose() }
  })
})
