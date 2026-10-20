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
    // Unsupported visual features must remain visible to the host-validation owner.
    expect(result.diagnostics.some(item => item.message.endsWith(': ring-inset'))).toBe(true)
    const phone = mountNativeScreen(result.code)
    const byId = (id: string) => phone.all().find(node => node.props.id === id)!
    try {
      await phone.settle()
      const field = () => phone.ofType('TextInput')[0]!
      expect(field().props.value).toBe('Ada')
      expect(field().style).toMatchObject({ borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8 })
      const light = field().style.backgroundColor
      phone.appearance('dark')
      await phone.settle()
      expect(field().style.backgroundColor).not.toBe(light)
      phone.press(field(), 'onChangeText', { text: 'Grace' })
      phone.press(phone.ofType('Checkbox')[0]!, 'onValueChange', { value: true })
      phone.press(byId('sample-alerts'))
      phone.press(byId('toggle-density'))
      await phone.settle()
      expect(phone.texts()).toContain('Grace | consent=true | alerts=true')
      expect(field().style).toMatchObject({ borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, fontSize: 14 })
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
      expect(field().style).toMatchObject({ borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: light })
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
