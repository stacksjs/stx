import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { defaultConfig, loadStxConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const plugin = join(import.meta.dir, '../../../components/stx-plugin.ts')
const shared = (name: string) => join(import.meta.dir, `../../../components/src/ui/${name.toLowerCase()}/${name}.stx`)
afterEach(closeBrowser)
async function fixture(source: string) {
  const root = createTempDir('stx-checked-resolution-')
  const file = join(root, 'Screen.stx')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(plugin)}] }`)
  await Bun.write(file, source)
  return { root, file }
}

describe.each(['Checkbox', 'Switch'])('%s usage-based native resolution', (name) => {
  it.each(['checked', ':checked="false"', 'x-checked="false"', 'checked={false}', 'v-model:checked="selected"', '@change="noop()"', '@change.once="noop()"', 'value="accepted" checked'])('selects shared source for %s', async (attributes) => {
    const source = `<script client>const selected = state(false)</script><${name} ${attributes} />`
    const { file, root } = await fixture(source)
    const result = await compileScreenSource(source, file, { root })
    expect(result.dependencies).toContain(shared(name))
    expect(result.dependencies).not.toContain(join(nativePrimitivesDir(), `${name}.stx`))
  }, 30_000)

  // `:value` with `@change` is how apps wrote the primitive before the shared
  // control existed: `change` has always been its value-change alias.
  it.each(['', 'value="true"', ':value="false"', '@value-change="noop()"', 'checked @value-change="noop()"', ':value="selected()" @change="noop()"', 'value="true" @change.once="noop()"'])('preserves primitive source for legacy usage %s', async (attributes) => {
    const source = `<${name} ${attributes} />`
    const { file, root } = await fixture(source)
    const result = await compileScreenSource(source, file, { root })
    expect(result.dependencies).toContain(join(nativePrimitivesDir(), `${name}.stx`))
    expect(result.dependencies).not.toContain(shared(name))
  }, 30_000)

  it('keeps explicit imports and screen-local overrides ahead of both policies', async () => {
    const source = `<${name} checked /><${name} value="true" />`
    const { file, root } = await fixture(source)
    const override = join(root, 'components', `${name}.stx`)
    await Bun.write(override, '<button>App override</button>')
    for (const input of [source, `@import('${name}', '${override}')${source}`]) {
      const result = await compileScreenSource(input, file, { root })
      expect(result.dependencies).toContain(override)
      expect(result.dependencies).not.toContain(shared(name))
      expect(result.dependencies).not.toContain(join(nativePrimitivesDir(), `${name}.stx`))
    }
  }, 30_000)
})

it.each([false, true])('keeps legacy and shared controls independent on the same screen (minify=%s)', async (minify) => {
  const source = `<script client>
const checked = state(false)
const legacy = state(false)
const shown = state(true)
window.probe = { checked, legacy, shown }
</script><section :if="shown">
<Checkbox testID="shared-checkbox" value="accepted" :checked="checked" @change="checked.set($event)" />
<Switch testID="shared-switch" :checked="checked" @change="checked.set($event)" />
<Switch testID="model-switch" v-model:checked="checked" />
<Checkbox testID="legacy-checkbox" :value="legacy" @value-change="legacy.set($event.value)" />
<Switch testID="legacy-switch" :value="legacy" @value-change="legacy.set($event.value)" />
</section>`
  const { file, root } = await fixture(source)
  const result = await compileSharedScreenBundle(file, { root, minify })
  for (const name of ['Checkbox', 'Switch']) {
    expect(result.dependencies).toContain(shared(name))
    expect(result.dependencies).toContain(join(nativePrimitivesDir(), `${name}.stx`))
  }
  const phone = mountNativeScreen(result.code)
  try {
    await phone.settle()
    expect(phone.byTestID('shared-checkbox')!.props.formValue).toBe('accepted')
    // Both are the platform switch natively; the shared one carries its ARIA
    // state, the primitive only its value.
    expect(phone.byTestID('shared-switch')!.type).toBe('Switch')
    expect(phone.byTestID('shared-switch')!.props['aria-checked']).toBe('false')
    expect(phone.byTestID('legacy-switch')!.type).toBe('Switch')
    expect(phone.byTestID('legacy-switch')!.props['aria-checked']).toBeUndefined()
    phone.press(phone.byTestID('shared-checkbox')!, 'onValueChange', { value: true })
    await phone.settle()
    expect(phone.context.probe.checked()).toBe(true)
    expect(phone.context.probe.legacy()).toBe(false)
    expect(phone.byTestID('shared-switch')!.props.accessibilityState).toMatchObject({ checked: true })
    expect(phone.byTestID('model-switch')!.props.accessibilityState).toMatchObject({ checked: true })
    phone.press(phone.byTestID('legacy-switch')!, 'onValueChange', { value: true })
    await phone.settle()
    expect(phone.context.probe.legacy()).toBe(true)
    expect(phone.byTestID('legacy-checkbox')!.props.value).toBe(true)
    phone.press(phone.byTestID('model-switch')!, 'onValueChange', { value: false })
    await phone.settle()
    expect(phone.context.probe.checked()).toBe(false)
    phone.press(phone.byTestID('model-switch')!, 'onValueChange', { value: true })
    await phone.settle()
    expect(phone.context.probe.checked()).toBe(true)
    phone.press(phone.byTestID('shared-switch')!, 'onValueChange', { value: false })
    await phone.settle()
    expect(phone.context.probe.checked()).toBe(false)
    expect(phone.context.probe.legacy()).toBe(true)
    phone.context.probe.shown.set(false)
    await phone.settle()
    expect(phone.byTestID('shared-switch')).toBeUndefined()
    expect(phone.byTestID('legacy-switch')).toBeUndefined()
    phone.context.probe.shown.set(true)
    await phone.settle()
    expect(phone.byTestID('shared-checkbox')!.props.value).toBe(false)
    expect(phone.byTestID('legacy-checkbox')!.props.value).toBe(true)
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)

it.each([false, true])('keeps browser discovery on those same shared files (minify=%s)', async (minify) => {
  const source = `<script client>
const checked = state(false)
window.probe = { checked }
</script><Checkbox id="consent" value="accepted" :checked="checked" @change="checked.set($event)" />
<Switch label="Alerts" v-model:checked="checked" />`
  const { root, file } = await fixture(source)
  const loaded = await loadStxConfig(root)
  const dependencies = new Set<string>()
  const html = await processDirectives(`<!DOCTYPE html><html><head></head><body>${source}</body></html>`, {}, file, {
    ...defaultConfig, ...loaded, root, cache: false, buildMode: undefined, debug: !minify,
  }, dependencies)
  for (const name of ['Checkbox', 'Switch']) expect(dependencies.has(shared(name))).toBe(true)
  const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
  await settle()
  const checkbox = find(browser, '#consent')
  expect(checkbox.value).toBe('accepted')
  checkbox.checked = true
  checkbox.dispatchEvent(new browser.window.Event('change', { bubbles: true }))
  await settle()
  expect(browser.window.probe.checked()).toBe(true)
  expect(find(browser, 'button[role="switch"]').getAttribute('aria-checked')).toBe('true')
  find(browser, 'button[role="switch"]').click()
  await settle()
  expect(browser.window.probe.checked()).toBe(false)
  expect(checkbox.checked).toBe(false)
  expect(browser.errors).toEqual([])
}, 30_000)
