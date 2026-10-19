import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { shimAttributes } from '../../src/testing'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const checkbox = join(import.meta.dir, '../../../components/src/ui/checkbox/Checkbox.stx')
const source = `@import('Checkbox', '${checkbox}')
<script client>
const disabled = state(false)
const mixed = state(false)
const checked = state(false)
const shown = state(true)
const changes = state(0)
function changed(value) { checked.set(value); changes.set(changes() + 1) }
window.probe = { disabled, mixed, checked, shown, changes }
</script>
<section :if="shown"><Checkbox id="control" :disabled="disabled" :indeterminate="mixed" :checked="checked" @change="changed($event)" label="Agree" /></section>
<Checkbox id="literal" disabled indeterminate label="Static" />`

afterEach(closeBrowser)

it('models indeterminate as a live input property, not a reflected attribute', () => {
  const input = document.createElement('input')
  input.setAttribute('indeterminate', '')
  shimAttributes(input)
  expect(input.indeterminate).toBe(false)
  input.indeterminate = true
  input.removeAttribute('indeterminate')
  shimAttributes(input)
  expect(input.indeterminate).toBe(true)
  expect(input.hasAttribute('indeterminate')).toBe(false)
  const div = document.createElement('div')
  shimAttributes(div)
  expect('indeterminate' in div).toBe(false)
})

describe.each([false, true])('shared Checkbox reactive state (minify=%s)', (minify) => {
  it('disables the physical native control, updates mixed state and survives remount', async () => {
    const root = createTempDir('stx-checkbox-state-')
    const file = join(root, 'Screen.stx')
    await Bun.write(join(root, 'stx.config.ts'), 'export default { componentPackages: [] }')
    await Bun.write(file, source)
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const errors: string[] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args.map(String).join(' ')) } } })
    try {
      await phone.settle()
      const control = () => phone.all().find(node => node.props.id === 'control')!
      const probe = phone.context.probe
      expect(control().type).toBe('Checkbox')
      expect(control().props.disabled).not.toBe(true)
      probe.disabled.set(true)
      probe.mixed.set(true)
      await phone.settle()
      expect(control().props).toMatchObject({ disabled: true, indeterminate: true })
      phone.press(control(), 'onValueChange', { value: true })
      await phone.settle()
      expect(probe.checked()).toBe(false)
      expect(probe.changes()).toBe(0)

      probe.disabled.set(false)
      probe.mixed.set(false)
      await phone.settle()
      expect(control().props).toMatchObject({ disabled: false, indeterminate: false })
      phone.press(control(), 'onValueChange', { value: true })
      await phone.settle()
      expect(probe.checked()).toBe(true)
      expect(probe.changes()).toBe(1)

      probe.shown.set(false)
      await phone.settle()
      expect(control()).toBeUndefined()
      probe.disabled.set(true)
      probe.mixed.set(true)
      probe.shown.set(true)
      await phone.settle()
      expect(control().props).toMatchObject({ disabled: true, indeterminate: true, checked: true })
      expect(phone.all().find(node => node.props.id === 'literal')!.props).toMatchObject({ disabled: true, indeterminate: true })
      phone.unmount()
      const count = phone.messages.length
      probe.disabled.set(false)
      probe.mixed.set(false)
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
      expect(errors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)

  it('updates the browser properties and rejects a dispatched change while disabled', async () => {
    const root = createTempDir('stx-checkbox-browser-')
    const html = await processDirectives(`<!DOCTYPE html><html><head></head><body>${source}</body></html>`, {}, join(root, 'Screen.stx'), {
      ...defaultConfig, root, cache: false, buildMode: undefined, debug: !minify,
    }, new Set())
    const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
    await settle()
    const control = () => find(browser, '#control')
    const probe = browser.window.probe
    let nativeChanges = 0
    browser.window.document.addEventListener('change', (event: Event) => {
      if (event.target === control()) nativeChanges++
    })
    expect(control().disabled).toBe(false)
    probe.disabled.set(true)
    probe.mixed.set(true)
    await settle()
    expect(control().disabled).toBe(true)
    expect(control().indeterminate).toBe(true)
    expect(control().classList.contains('opacity-50')).toBe(true)
    control().checked = true
    control().dispatchEvent(new browser.window.Event('change', { bubbles: true }))
    await settle()
    expect(control().checked).toBe(false)
    expect(probe.checked()).toBe(false)
    expect(probe.changes()).toBe(0)
    expect(nativeChanges).toBe(1)

    probe.disabled.set(false)
    probe.mixed.set(false)
    await settle()
    expect(control().disabled).toBe(false)
    expect(control().indeterminate).toBe(false)
    expect(control().classList.contains('opacity-50')).toBe(false)
    control().checked = true
    control().dispatchEvent(new browser.window.Event('change', { bubbles: true }))
    await settle()
    expect(probe.checked()).toBe(true)
    expect(probe.changes()).toBe(1)
    expect(nativeChanges).toBe(2)

    probe.shown.set(false)
    await settle()
    probe.disabled.set(true)
    probe.mixed.set(true)
    probe.shown.set(true)
    await settle()
    expect(control().disabled).toBe(true)
    expect(control().indeterminate).toBe(true)
    expect(control().checked).toBe(true)
    expect(find(browser, '#literal').disabled).toBe(true)
    expect(find(browser, '#literal').indeterminate).toBe(true)
    expect(browser.errors).toEqual([])
  }, 30_000)
})
