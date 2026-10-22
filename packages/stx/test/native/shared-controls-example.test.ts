import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const root = join(import.meta.dir, '../../../..')
const file = join(root, 'examples/shared-controls.stx')
afterEach(closeBrowser)

describe.each([false, true])('runnable shared-controls example (minify=%s)', (minify) => {
  it('exercises controls, density, appearance and remount through native events', async () => {
    const result = await compileSharedScreenBundle(file, { root, minify })
    for (const component of ['button/Button', 'card/Card', 'input/TextInput', 'checkbox/Checkbox', 'switch/Switch'])
      expect(result.dependencies).toContain(join(root, 'packages/components/src/ui', `${component}.stx`))
    expect(result.diagnostics.some(item => item.message.endsWith(': rounded-control'))).toBe(false)
    // The field is the platform's natively (TextInput.stx), with no web ring
    // to report as unsupported.
    expect(result.diagnostics.some(item => item.message.endsWith(': ring-inset'))).toBe(false)
    const phone = mountNativeScreen(result.code)
    const byId = (id: string) => phone.all().find(node => node.props.id === id)!
    try {
      await phone.settle()
      const field = () => phone.ofType('TextInput')[0]!
      expect(field().props.value).toBe('Ada')
      const platformField = { height: 48, borderRadius: 10, paddingHorizontal: 16, fontSize: 17 }
      expect(field().style).toMatchObject(platformField)
      const light = field().style.backgroundColor
      phone.appearance('dark')
      await phone.settle()
      expect(field().style.backgroundColor).not.toBe(light)
      phone.press(field(), 'onChangeText', { text: 'Grace' })
      phone.press(phone.ofType('Checkbox')[0]!, 'onValueChange', { value: true })
      phone.press(byId('sample-alerts'), 'onValueChange', { value: true })
      phone.press(byId('toggle-density'))
      await phone.settle()
      expect(phone.texts()).toContain('Grace | consent=true | alerts=true')
      // Density re-shapes the card; the platform field keeps the platform's size.
      expect(field().style).toMatchObject(platformField)
      expect(byId('sample-card').style.borderRadius).toBe(20)
      phone.press(byId('toggle-controls'))
      await phone.settle()
      expect(phone.ofType('TextInput')).toHaveLength(0)
      phone.press(byId('toggle-controls'))
      await phone.settle()
      expect(field().props.value).toBe('Grace')
      expect(phone.ofType('Checkbox')[0]!.props.value).toBe(true)
      expect(byId('sample-alerts').props.accessibilityState).toMatchObject({ checked: true })
      phone.press(byId('toggle-density'))
      phone.appearance('light')
      await phone.settle()
      expect(field().style).toMatchObject({ ...platformField, backgroundColor: light })
      expect(byId('sample-card').style.borderRadius).toBe(8)
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)

  it('runs the same source and actions in the browser runtime', async () => {
    const source = await Bun.file(file).text()
    const html = await processDirectives(`<!DOCTYPE html><html><head></head><body>${source}</body></html>`, {}, file, {
      ...defaultConfig, root, cache: false, buildMode: undefined, debug: !minify,
    }, new Set())
    const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
    await settle()
    const field = find(browser, '#sample-name')
    field.value = 'Grace'
    field.dispatchEvent(new browser.window.Event('input', { bubbles: true }))
    const checkbox = find(browser, '#sample-consent')
    checkbox.checked = true
    checkbox.dispatchEvent(new browser.window.Event('change', { bubbles: true }))
    find(browser, 'button[role="switch"]').click()
    find(browser, '#toggle-density').click()
    await settle()
    expect(find(browser, '#sample-status').textContent).toBe('Grace | consent=true | alerts=true')
    expect(find(browser, 'main').style.getPropertyValue('--stx-radius-control')).toBe('12px')
    find(browser, '#toggle-controls').click()
    await settle()
    expect(find(browser, '#sample-name')).toBeNull()
    find(browser, '#toggle-controls').click()
    await settle()
    expect(find(browser, '#sample-name').value).toBe('Grace')
    expect(find(browser, '#sample-consent').checked).toBe(true)
    expect(find(browser, 'button[role="switch"]').getAttribute('aria-checked')).toBe('true')
    find(browser, '#toggle-density').click()
    await settle()
    expect(find(browser, 'main').style.getPropertyValue('--stx-radius-control')).toBe('')
    expect(browser.errors).toEqual([])
  }, 30_000)
})
