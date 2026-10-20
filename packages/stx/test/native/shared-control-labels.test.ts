import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const checkbox = join(import.meta.dir, '../../../components/src/ui/checkbox/Checkbox.stx')
const toggle = join(import.meta.dir, '../../../components/src/ui/switch/Switch.stx')
const source = `@import('Checkbox', '${checkbox}')
@import('Switch', '${toggle}')
<script client>
const label = state('')
const shown = state(true)
window.probe = { label, shown }
</script>
<section :if="shown">
  <Checkbox id="consent" :label="label" required />
  <Switch :label="label" />
</section>`

afterEach(closeBrowser)

describe.each([false, true])('shared control labels (minify=%s)', (minify) => {
  it('names native physical controls, updates visible text and does not render a screen-reader-only duplicate', async () => {
    const { code } = await compileNativeScreen(source, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const checkbox = () => phone.ofType('Checkbox')[0]!
      const toggle = () => phone.ofType('Pressable')[0]!
      expect(toggle().props.accessibilityLabel).toBe('Toggle switch')
      expect(phone.ofType('Text').some(node => node.children.includes('Toggle switch'))).toBe(false)
      phone.context.probe.label.set('Receive updates')
      await phone.settle()
      expect(checkbox().props.accessibilityLabel).toBe('Receive updates')
      expect(toggle().props.accessibilityLabel).toBe('Receive updates')
      expect(phone.ofType('Text').filter(node => node.children.includes('Receive updates'))).toHaveLength(2)
      expect(phone.all().find(node => node.props.for === 'consent')!.style.flexDirection).toBe('row')
      phone.context.probe.shown.set(false)
      await phone.settle()
      phone.context.probe.label.set('Account notices')
      phone.context.probe.shown.set(true)
      await phone.settle()
      expect(checkbox().props.accessibilityLabel).toBe('Account notices')
      expect(toggle().props.accessibilityLabel).toBe('Account notices')
      phone.context.probe.label.set('')
      await phone.settle()
      expect(checkbox().props.accessibilityLabel ?? null).toBeNull()
      expect(toggle().props.accessibilityLabel).toBe('Toggle switch')
      expect(phone.ofType('Text').some(node => node.children.includes('Account notices'))).toBe(false)
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const count = phone.messages.length
      phone.context.probe.label.set('After teardown')
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 30_000)

  it('keeps browser names and visible labels aligned, including late labels and removal', async () => {
    const root = createTempDir('stx-control-labels-')
    const html = await processDirectives(`<!DOCTYPE html><html><head></head><body>${source}</body></html>`, {}, join(root, 'Screen.stx'), {
      ...defaultConfig, root, cache: false, buildMode: undefined, debug: !minify,
    }, new Set())
    const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
    await settle()
    const checkbox = () => find(browser, '#consent')
    const toggle = () => find(browser, 'button[role="switch"]')
    const visible = () => find(browser, 'label[for="consent"]')
    expect(toggle().getAttribute('aria-label')).toBe('Toggle switch')
    expect(toggle().querySelector('.sr-only')).toBeNull()
    browser.window.probe.label.set('Receive updates')
    await settle()
    expect(checkbox().getAttribute('aria-label')).toBe('Receive updates')
    expect(toggle().getAttribute('aria-label')).toBe('Receive updates')
    expect(visible().textContent).toContain('Receive updates')
    expect(visible().textContent).toContain('*')
    browser.window.probe.shown.set(false)
    await settle()
    browser.window.probe.label.set('Account notices')
    browser.window.probe.shown.set(true)
    await settle()
    expect(checkbox().getAttribute('aria-label')).toBe('Account notices')
    expect(toggle().getAttribute('aria-label')).toBe('Account notices')
    expect(visible().textContent).toContain('Account notices')
    browser.window.probe.label.set('')
    await settle()
    expect(checkbox().getAttribute('aria-label')).toBeNull()
    expect(toggle().getAttribute('aria-label')).toBe('Toggle switch')
    expect(visible()).toBeNull()
    expect(browser.errors).toEqual([])
  }, 30_000)
})
