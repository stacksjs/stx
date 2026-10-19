/**
 * The shared SegmentedControl, one source on both targets.
 *
 * The shipped file is selected through the components plugin, as an app
 * selects it, and the same screen is run in a browser and on the native test
 * host. On a phone the chosen segment has to be announced as selected, which
 * is the `aria-pressed` the browser reads, translated (accessibility.ts).
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileScreenSource } from '../../src/native/compiler/render-screen'
import { mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { defaultConfig, loadStxConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const plugin = join(import.meta.dir, '../../../components/stx-plugin.ts')
const shipped = join(import.meta.dir, '../../../components/src/ui/segmented-control/SegmentedControl.stx')

const SCREEN = `<script client>
const period = state('week')
const changes = state([])
const options = state([{ value: 'week', label: 'This week' }, { value: 'month', label: 'This month' }, { value: 'all', label: 'All time', disabled: true }])
window.probe = { period, changes, options }
</script><div>
  <SegmentedControl testID="period" label="Period" stretch v-model:value="period" :options="options" @change="changes.set([...changes(), $event])" />
  <p testID="shown" :text="'Showing ' + period()"></p>
</div>`

async function fixture() {
  const root = createTempDir('stx-segmented-')
  const file = join(root, 'Screen.stx')
  await Bun.write(join(root, 'stx.config.ts'), `export default { root: '.', plugins: ${JSON.stringify([plugin])} }`)
  await Bun.write(file, SCREEN)
  return { root, file }
}

afterEach(() => {
  unmountAllNativeScreens()
  return closeBrowser()
})

describe('SegmentedControl on a native host', () => {
  it('raises the chosen segment, announces it as selected, and refuses a disabled one', async () => {
    const { root, file } = await fixture()
    const compiled = await compileScreenSource(SCREEN, file, { root })
    expect(compiled.dependencies).toContain(shipped)
    const { code } = await compileSharedScreenBundle(file, { root })
    const errors: unknown[][] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
    await phone.settle()

    const group = phone.byTestID('period')!
    expect(group.props.accessibilityLabel).toBe('Period')
    const segment = (value: string) => phone.byTestID(`period-${value}`)!
    expect(segment('week').type).toBe('Pressable')
    expect(phone.all().some(node => node.children.includes('This month'))).toBe(true)
    expect(segment('week').props.accessibilityState).toMatchObject({ selected: true })
    expect(segment('month').props.accessibilityState).toMatchObject({ selected: false })
    expect(segment('all').props.accessibilityState).toMatchObject({ selected: false, disabled: true })

    phone.press(segment('month'))
    await phone.settle()
    expect(phone.context.probe.period()).toBe('month')
    expect(phone.context.probe.changes()).toEqual(['month'])
    expect(segment('month').props.accessibilityState).toMatchObject({ selected: true })
    expect(segment('week').props.accessibilityState).toMatchObject({ selected: false })
    expect(phone.texts()).toContain('Showing month')

    phone.press(segment('all'))
    phone.press(segment('month'))
    await phone.settle()
    expect(phone.context.probe.period()).toBe('month')
    expect(phone.context.probe.changes()).toEqual(['month'])

    // A parent write moves the control, and a relabelled option changes in place.
    phone.context.probe.period.set('week')
    phone.context.probe.options.set([{ value: 'week', label: 'This week (3)' }, { value: 'month', label: 'This month' }])
    await phone.settle()
    expect(segment('week').props.accessibilityState).toMatchObject({ selected: true })
    expect(phone.texts()).toContain('This week (3)')
    expect(phone.byTestID('period-all')).toBeUndefined()
    expect(errors).toEqual([])
  }, 30_000)
})

describe('SegmentedControl in a browser', () => {
  it('renders the same source as pressed buttons in a labelled group', async () => {
    const { root, file } = await fixture()
    const loaded = await loadStxConfig(root)
    const dependencies = new Set<string>()
    const html = await processDirectives(`<!DOCTYPE html><html><head><title>Segmented</title></head><body>${SCREEN}</body></html>`, {}, file, { ...defaultConfig, ...loaded, root, cache: false, autoShell: true, buildMode: undefined, debug: true }, dependencies)
    expect(dependencies.has(shipped)).toBe(true)
    const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
    await settle()
    expect(browser.errors).toEqual([])
    const group = find(browser, '[data-stx-segmented-control]')
    expect(group.getAttribute('role')).toBe('group')
    expect(group.getAttribute('aria-label')).toBe('Period')
    const buttons = () => [...group.querySelectorAll('button')] as HTMLButtonElement[]
    expect(buttons().map(button => button.textContent?.trim())).toEqual(['This week', 'This month', 'All time'])
    expect(buttons().map(button => button.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false'])
    expect(buttons()[2].disabled).toBe(true)

    buttons()[1].click()
    await settle()
    expect(browser.window.probe.period()).toBe('month')
    expect(buttons().map(button => button.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false'])
    expect(find(browser, '[testid="shown"], [testID="shown"]')?.textContent).toBe('Showing month')
  }, 30_000)
})
