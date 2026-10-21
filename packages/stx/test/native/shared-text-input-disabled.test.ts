import { afterEach, describe, expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const input = join(import.meta.dir, '../../../components/src/ui/input/TextInput.stx')
const source = `@import('TextInput', '${input}')
<script client>
const disabled = state(false)
const value = state('Seed')
const shown = state(true)
window.probe = { disabled, value, shown, inputs: [], clears: 0 }
</script><section><div :if="shown">
<TextInput id="field" testID="field" clearable :disabled="disabled" v-model:value="value"
  @input="window.probe.inputs.push($event)" @clear="window.probe.clears++" />
</div><TextInput id="literal" testID="literal" disabled value="Static" />
<TextInput id="readonly" testID="readonly" readonly :disabled="disabled" value="Read only" />
</section>`

afterEach(closeBrowser)

describe.each([false, true])('shared TextInput disabled state (minify=%s)', (minify) => {
  it('updates the physical native input and rejects edits/clears while disabled, including after remount', async () => {
    const { code } = await compileNativeScreen(source, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const field = () => phone.byTestID('field')!
      const probe = phone.context.probe
      const clear = phone.all().find(node => node.props.accessibilityLabel === 'Clear input')!
      expect(clear).toBeDefined()
      expect(field().type).toBe('TextInput')
      expect(field().props.disabled).not.toBe(true)
      phone.type(field(), 'Edited')
      await phone.settle()
      expect(probe.value()).toBe('Edited')
      expect(probe.inputs).toEqual(['Edited'])

      probe.disabled.set(true)
      await phone.settle()
      expect(field().props.disabled).toBe(true)
      expect(field().style.opacity).toBe(0.5)
      phone.type(field(), 'Blocked')
      phone.press(clear)
      await phone.settle()
      expect(probe.value()).toBe('Edited')
      expect(probe.inputs).toEqual(['Edited'])
      expect(probe.clears).toBe(0)
      probe.value.set('From parent')
      await phone.settle()
      expect(field().props.value).toBe('From parent')

      probe.disabled.set(false)
      await phone.settle()
      expect(field().props.disabled).toBe(false)
      expect(field().style.opacity).not.toBe(0.5)
      phone.type(field(), 'Enabled again')
      await phone.settle()
      expect(probe.inputs).toEqual(['Edited', 'Enabled again'])
      phone.press(clear)
      await phone.settle()
      expect(probe.value()).toBe('')
      expect(probe.inputs).toEqual(['Edited', 'Enabled again', ''])
      expect(probe.clears).toBe(1)

      const old = field()
      probe.shown.set(false)
      await phone.settle()
      expect(field()).toBeUndefined()
      phone.type(old, 'Stale')
      probe.disabled.set(true)
      probe.value.set('Remounted')
      probe.shown.set(true)
      await phone.settle()
      expect(field().props).toMatchObject({ disabled: true, value: 'Remounted' })
      phone.type(field(), 'Still blocked')
      await phone.settle()
      expect(probe.value()).toBe('Remounted')
      expect(phone.byTestID('literal')!.props.disabled).toBe(true)
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const count = phone.messages.length
      probe.disabled.set(false)
      phone.type(old, 'Disposed')
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 30_000)

  it('updates browser attributes/classes and guards input, change and clear actions', async () => {
    const root = createTempDir('stx-text-input-disabled-')
    try {
      const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'Screen.stx'), {
        ...defaultConfig, root, cache: false, buildMode: undefined, debug: !minify,
      }, new Set())
      const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
      await settle()
      const field = () => find(browser, '#field')
      const probe = browser.window.probe
      const clear = browser.document.querySelector('[aria-label="Clear input"]')!
      const operate = async (value: string, event: string) => {
        field().value = value
        field().dispatchEvent(new browser.window.Event(event, { bubbles: true }))
        await settle()
      }
      expect(field().disabled).toBe(false)
      await operate('Edited', 'input')
      expect(probe.value()).toBe('Edited')
      expect(probe.inputs).toEqual(['Edited'])
      probe.disabled.set(true)
      await settle()
      expect(field().disabled).toBe(true)
      expect(field().hasAttribute('disabled')).toBe(true)
      expect(field().classList.contains('opacity-50')).toBe(true)
      expect(field().classList.contains('bg-field')).toBe(false)
      expect(clear.parentElement.style.display).toBe('none')
      await operate('Blocked input', 'input')
      await operate('Blocked change', 'change')
      clear.dispatchEvent(new browser.window.Event('click', { bubbles: true }))
      await settle()
      expect(probe.value()).toBe('Edited')
      expect(field().value).toBe('Edited')
      expect(probe.inputs).toEqual(['Edited'])
      expect(probe.clears).toBe(0)
      probe.value.set('From parent')
      await settle()
      expect(field().value).toBe('From parent')

      probe.disabled.set(false)
      await settle()
      expect(field().disabled).toBe(false)
      expect(field().hasAttribute('disabled')).toBe(false)
      expect(field().classList.contains('opacity-50')).toBe(false)
      expect(field().classList.contains('cursor-not-allowed')).toBe(false)
      expect(field().classList.contains('bg-field')).toBe(true)
      expect(field().classList.contains('bg-surface')).toBe(false)
      expect(find(browser, '#readonly').classList.contains('bg-surface')).toBe(true)
      expect(find(browser, '#readonly').classList.contains('cursor-default')).toBe(true)
      expect(clear.parentElement.style.display).not.toBe('none')
      await operate('Enabled again', 'input')
      expect(probe.inputs).toEqual(['Edited', 'Enabled again'])
      clear.dispatchEvent(new browser.window.Event('click', { bubbles: true }))
      await settle()
      expect(probe.value()).toBe('')
      expect(probe.clears).toBe(1)
      probe.shown.set(false)
      await settle()
      probe.disabled.set(true)
      probe.value.set('Remounted')
      probe.shown.set(true)
      await settle()
      expect(field().disabled).toBe(true)
      expect(field().value).toBe('Remounted')
      expect(find(browser, '#literal').disabled).toBe(true)
      expect(browser.errors).toEqual([])
    }
    finally {
      closeBrowser()
      await rm(root, { recursive: true, force: true })
    }
  }, 30_000)
})
