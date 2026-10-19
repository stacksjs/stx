import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const component = join(import.meta.dir, '../../../components/src/ui/switch/Switch.stx')
const source = `@import('Switch', '${component}')
<script client>
const disabled = state(false)
const checked = state(false)
const shown = state(true)
const changes = state(0)
const formRef = useRef('settings')
function values() { return Object.fromEntries(new FormData(formRef()).entries()) }
window.probe = { disabled, checked, shown, changes, values }
</script>
<form x-ref="settings"><section :if="shown"><Switch name="alerts" label="Alerts" :disabled="disabled" v-model:checked="checked" @change="changes.set(changes() + 1)" /></section></form>`

afterEach(closeBrowser)

describe.each([false, true])('shared Switch disabled state (minify=%s)', (minify) => {
  it('disables native interaction and form participation without losing the model', async () => {
    const root = createTempDir('stx-switch-state-')
    const file = join(root, 'Screen.stx')
    await Bun.write(join(root, 'stx.config.ts'), 'export default { componentPackages: [] }')
    await Bun.write(file, source)
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const phone = mountNativeScreen(code, 'Screen')
    try {
      await phone.settle()
      const control = () => phone.ofType('Pressable')[0]
      const thumb = () => phone.all().find(node => node.props['aria-hidden'] === true)!
      const probe = phone.context.probe
      expect(probe.values().alerts).toBe('false')
      expect(thumb().style.transform).toEqual([{ translateX: 0 }])
      probe.disabled.set(true)
      await phone.settle()
      expect(control().props.disabled).toBe(true)
      expect(probe.values().alerts).toBeUndefined()
      phone.press(control())
      await phone.settle()
      expect(probe.checked()).toBe(false)
      expect(probe.changes()).toBe(0)

      probe.checked.set(true)
      probe.disabled.set(false)
      await phone.settle()
      expect(control().props.disabled).toBe(false)
      expect(probe.values().alerts).toBe('true')
      expect(thumb().style.transform).toEqual([{ translateX: 36 }])
      phone.press(control())
      await phone.settle()
      expect(probe.checked()).toBe(false)
      expect(probe.changes()).toBe(1)
      expect(thumb().style.transform).toEqual([{ translateX: 0 }])

      probe.shown.set(false)
      await phone.settle()
      expect(control()).toBeUndefined()
      probe.disabled.set(true)
      probe.checked.set(true)
      probe.shown.set(true)
      await phone.settle()
      expect(control().props.disabled).toBe(true)
      expect(control().props['aria-checked']).toBe('true')
      expect(thumb().style.transform).toEqual([{ translateX: 36 }])
      expect(probe.values().alerts).toBeUndefined()
      phone.unmount()
      const count = phone.messages.length
      probe.disabled.set(false)
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 30_000)

  it('disables the browser button and hidden field, then restores interaction', async () => {
    const root = createTempDir('stx-switch-browser-')
    const html = await processDirectives(`<!DOCTYPE html><html><head></head><body>${source}</body></html>`, {}, join(root, 'Screen.stx'), {
      ...defaultConfig, root, cache: false, buildMode: undefined, debug: !minify,
    }, new Set())
    const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
    await settle()
    const control = () => find(browser, 'button[role="switch"]')
    const probe = browser.window.probe
    const values = () => Object.fromEntries(new browser.window.FormData(find(browser, 'form')).entries())
    expect(values().alerts).toBe('false')
    probe.disabled.set(true)
    await settle()
    expect(control().disabled).toBe(true)
    expect(control().getAttribute('aria-disabled')).toBe('true')
    expect(control().classList.contains('opacity-50')).toBe(true)
    expect(values().alerts).toBeUndefined()
    control().dispatchEvent(new browser.window.Event('click', { bubbles: true }))
    await settle()
    expect(probe.checked()).toBe(false)
    expect(probe.changes()).toBe(0)

    probe.checked.set(true)
    probe.disabled.set(false)
    await settle()
    expect(control().disabled).toBe(false)
    expect(control().getAttribute('aria-disabled')).toBe('false')
    expect(control().classList.contains('opacity-50')).toBe(false)
    expect(values().alerts).toBe('true')
    control().click()
    await settle()
    expect(probe.checked()).toBe(false)
    expect(probe.changes()).toBe(1)

    probe.shown.set(false)
    await settle()
    expect(control()).toBeNull()
    probe.disabled.set(true)
    probe.checked.set(true)
    probe.shown.set(true)
    await settle()
    expect(control().disabled).toBe(true)
    expect(control().getAttribute('aria-checked')).toBe('true')
    expect(values().alerts).toBeUndefined()
    expect(browser.errors).toEqual([])
  }, 30_000)
})
