import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { defaultConfig, loadStxConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const plugin = join(import.meta.dir, '../../../components/stx-plugin.ts')
const sharedButton = join(import.meta.dir, '../../../components/src/ui/button/Button.stx')

async function fixture(source: string, withPlugin = true) {
  const root = createTempDir('stx-shared-resolution-')
  const file = join(root, 'Screen.stx')
  await Bun.write(join(root, 'stx.config.ts'), `export default { root: '.', plugins: ${JSON.stringify(withPlugin ? [plugin] : [])} }`)
  await Bun.write(file, source)
  return { root, file }
}

afterEach(closeBrowser)

describe.each([false, true])('shared Button resolution (minify=%s)', (minify) => {
  it('selects the same shipped file and retains reactive behavior and lifecycle on both targets', async () => {
    const source = `<script client>
const shown = state(true)
const disabled = state(false)
const loading = state(false)
const label = state('Save')
const clicks = state(0)
window.probe = { shown, disabled, loading, label, clicks }
</script><div><section :if="shown"><Button testID="save" id="save" :label="label" :disabled="disabled" :loading="loading" @click="clicks.set(clicks() + 1)" /></section></div>`
    const { root, file } = await fixture(source)
    const native = await compileScreenSource(source, file, { root })
    expect(native.dependencies).toContain(sharedButton)
    expect(native.dependencies).not.toContain(join(nativePrimitivesDir(), 'Button.stx'))
    const loaded = await loadStxConfig(root)
    const dependencies = new Set<string>()
    const html = await processDirectives(`<!DOCTYPE html><html><head><title>Shared</title></head><body>${source}</body></html>`, {}, file, { ...defaultConfig, ...loaded, root, cache: false, autoShell: true, buildMode: undefined, debug: !minify }, dependencies)
    expect(dependencies.has(sharedButton)).toBe(true)
    const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
    await settle()
    expect(browser.errors).toEqual([])
    expect(browser.window.probe).toBeTruthy()
    const button = () => find(browser, '#save')
    expect(button().textContent).toContain('Save')
    browser.window.probe.label.set('Changed')
    browser.window.probe.loading.set(true)
    await settle()
    expect(button().textContent).toContain('Changed')
    expect(button().disabled).toBe(true)
    browser.window.probe.loading.set(false)
    await settle()
    button().click()
    await settle()
    expect(browser.window.probe.clicks()).toBe(1)
    browser.window.probe.shown.set(false)
    await settle()
    expect(button()).toBeNull()
    browser.window.probe.label.set('Remounted')
    browser.window.probe.shown.set(true)
    await settle()
    expect(button().textContent).toContain('Remounted')
    expect(browser.errors).toEqual([])
    closeBrowser()

    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const errors: unknown[][] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
    await phone.settle()
    const nativeButton = () => phone.byTestID('save')!
    expect(phone.texts()).toContain('Save')
    phone.press(nativeButton())
    await phone.settle()
    expect(phone.context.probe.clicks()).toBe(1)
    phone.context.probe.label.set('Changed')
    phone.context.probe.loading.set(true)
    await phone.settle()
    expect(phone.texts()).toContain('Changed')
    expect(nativeButton().props.disabled).toBe(true)
    phone.press(nativeButton())
    await phone.settle()
    expect(phone.context.probe.clicks()).toBe(1)
    phone.context.probe.loading.set(false)
    phone.context.probe.shown.set(false)
    const old = nativeButton()
    await phone.settle()
    expect(phone.byTestID('save')).toBeUndefined()
    phone.press(old)
    await phone.settle()
    expect(phone.context.probe.clicks()).toBe(1)
    phone.context.probe.label.set('Remounted')
    phone.context.probe.shown.set(true)
    await phone.settle()
    expect(phone.texts()).toContain('Remounted')
    phone.press(nativeButton())
    await phone.settle()
    expect(phone.context.probe.clicks()).toBe(2)
    phone.unmount()
    phone.context.probe.label.set('After unmount')
    expect(errors).toEqual([])
  }, 30_000)
})

it('preserves native Button text/press spellings when the shared plugin is installed', async () => {
  const { root, file } = await fixture(`<script client>
const label = state('Native label')
window.presses = 0
window.label = label
</script><View><Button testID="legacy" text="Static text" accessibilityLabel="Legacy" @press="window.presses++" /><Button testID="bound" :text="label" @click="window.presses++" /></View>`)
  const { code } = await compileSharedScreenBundle(file, { root })
  const phone = mountNativeScreen(code, 'Screen')
  await phone.settle()
  expect(phone.byTestID('legacy')!.props).toMatchObject({ accessibilityLabel: 'Legacy' })
  expect(phone.texts()).toContain('Static text')
  phone.press(phone.byTestID('legacy')!)
  phone.press(phone.byTestID('bound')!)
  await phone.settle()
  expect(phone.context.presses).toBe(2)
  phone.context.label.set('Updated')
  await phone.settle()
  expect(phone.texts()).toContain('Updated')
  phone.unmount()
}, 30_000)

it.each([false, true])('applies reactive native host attributes to the shared control (minify=%s)', async (minify) => {
  const { root, file } = await fixture(`<script client>
const classes = state('text-[20px]')
const styles = state({ paddingLeft: 3 })
const label = state('Accessible one')
const testID = state('first')
const shown = state(true)
window.probe = { classes, styles, label, testID, shown }
</script><section :if="shown"><Button id="control" :class="classes" :style="styles" :accessibilityLabel="label" :testID="testID">Save</Button></section><Button testID="untouched">Other</Button>`)
  const { code } = await compileSharedScreenBundle(file, { root, minify })
  const phone = mountNativeScreen(code, 'Screen')
  await phone.settle()
  const control = () => phone.all().find(node => node.props.id === 'control')!
  expect(control().style).toMatchObject({ fontSize: 20, paddingLeft: 3 })
  expect(control().props).toMatchObject({ testID: 'first', accessibilityLabel: 'Accessible one' })
  phone.context.probe.classes.set('text-[24px]')
  phone.context.probe.styles.set({ paddingLeft: 7 })
  phone.context.probe.label.set('Accessible two')
  phone.context.probe.testID.set('second')
  await phone.settle()
  expect(control().style).toMatchObject({ fontSize: 24, paddingLeft: 7 })
  expect(control().props).toMatchObject({ testID: 'second', accessibilityLabel: 'Accessible two' })
  // The other button keeps its own styling; natively a button's text size
  // is its label's (Button.stx), so its root carries none.
  expect(phone.byTestID('untouched')!.style.fontSize ?? null).toBeNull()
  phone.context.probe.shown.set(false)
  await phone.settle()
  expect(control()).toBeUndefined()
  phone.context.probe.classes.set('text-[28px]')
  phone.context.probe.styles.set({ paddingLeft: 9 })
  phone.context.probe.shown.set(true)
  await phone.settle()
  expect(control().style).toMatchObject({ fontSize: 28, paddingLeft: 9 })
  phone.context.probe.classes.set('')
  phone.context.probe.styles.set({})
  phone.context.probe.label.set(null)
  phone.context.probe.testID.set(null)
  await phone.settle()
  expect(control().style.fontSize).toBeNull()
  expect(control().style.paddingLeft).toBeNull()
  expect(control().props.accessibilityLabel).toBeNull()
  expect(control().props.testID).toBeNull()
  phone.unmount()
}, 30_000)

it('keeps consumed props private and layers forwarded styling over reactive component styling', async () => {
  const { root, file } = await fixture(`<script client>
const classes = state('text-[24px]')
const styles = state({ paddingLeft: 9 })
const variant = state('alternate')
window.probe = { classes, styles, variant }
</script><Custom id="custom" :class="classes" :style="styles" :variant="variant" />`, false)
  await Bun.write(join(root, 'components/Custom.stx'), `<script client>
const variant = useReactiveProp('variant', 'base')
const ownClass = derived(() => variant() === 'base' ? 'text-[12px]' : 'text-[16px]')
const ownStyle = derived(() => ({ paddingLeft: variant() === 'base' ? 2 : 4 }))
</script><button :class="ownClass" :style="ownStyle">Custom</button>`)
  const { code } = await compileSharedScreenBundle(file, { root })
  const phone = mountNativeScreen(code, 'Screen')
  await phone.settle()
  const control = () => phone.all().find(node => node.props.id === 'custom')!
  expect(control().props.variant).toBeUndefined()
  expect(control().style).toMatchObject({ fontSize: 24, paddingLeft: 9 })
  phone.context.probe.variant.set('base')
  await phone.settle()
  expect(control().style).toMatchObject({ fontSize: 24, paddingLeft: 9 })
  phone.context.probe.classes.set(['text-[20px]', false])
  await phone.settle()
  expect(control().style.fontSize).toBe(20)
  phone.context.probe.classes.set({ 'text-[28px]': true, 'text-[32px]': false })
  await phone.settle()
  expect(control().style.fontSize).toBe(28)
  phone.context.probe.classes.set(null)
  phone.context.probe.styles.set(null)
  await phone.settle()
  expect(control().style).toMatchObject({ fontSize: 12, paddingLeft: 2 })
  phone.unmount()
}, 30_000)

it.each(['.', 'resources'])('honors the configured component directory on both targets (root=%s)', async (configRoot) => {
  const source = '<Button>Configured</Button>'
  const { root, file } = await fixture(source, false)
  await Bun.write(join(root, 'stx.config.ts'), `export default { root: ${JSON.stringify(configRoot)}, componentsDir: 'shared-ui', componentPackages: [] }`)
  const configured = join(root, configRoot, 'shared-ui/Button.stx')
  await Bun.write(configured, '<button data-origin="configured"><slot /></button>')
  const native = await compileScreenSource(source, file, { root })
  expect(native.dependencies).toContain(configured)
  expect(native.html).toContain('data-origin="configured"')
  const loaded = await loadStxConfig(root)
  const dependencies = new Set<string>()
  const web = await processDirectives(source, {}, file, { ...defaultConfig, ...loaded, cache: false }, dependencies)
  expect(dependencies.has(configured)).toBe(true)
  expect(web).toContain('data-origin="configured"')

  const override = join(root, 'explicit/Button.stx')
  await Bun.write(override, '<button data-origin="explicit"><slot /></button>')
  const overridden = await compileScreenSource(source, file, { root, componentsDir: join(root, 'explicit') })
  expect(overridden.dependencies).toContain(override)
  expect(overridden.dependencies).not.toContain(configured)
  expect(overridden.html).toContain('data-origin="explicit"')
})

it('keeps primitive fallbacks and screen-local, explicit and conventional overrides', async () => {
  const fallback = await fixture('<Button testID="fallback">Save</Button>', false)
  expect((await compileScreenSource('<Button testID="fallback">Save</Button>', fallback.file, fallback)).dependencies).toContain(join(nativePrimitivesDir(), 'Button.stx'))
  for (const directory of ['components', 'resources/components', 'resources/views/components', 'src/components', 'custom']) {
    const { root, file } = await fixture('<Button>Save</Button><Checkbox />')
    const override = join(root, directory, 'Button.stx')
    await Bun.write(override, '<button data-class="marker" class=bg-red-500 data-source="override"><slot /></button>')
    const result = await compileScreenSource('<Button class="text-[15px]">Save</Button><Checkbox />', file, { root, ...(directory === 'custom' ? { componentsDir: join(root, directory) } : {}) })
    expect(result.dependencies).toContain(override)
    expect(result.dependencies).not.toContain(sharedButton)
    expect(result.html).toContain('data-class="marker"')
    expect(result.html).toContain('class="bg-red-500 text-[15px]"')
    // Unmigrated overlaps retain their existing primitive contract.
    expect(result.dependencies).toContain(join(nativePrimitivesDir(), 'Checkbox.stx'))
  }
}, 30_000)
