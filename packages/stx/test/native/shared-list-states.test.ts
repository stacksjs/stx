/**
 * The list and screen-state components, one source on both targets:
 * GroupedList / GroupedListRow, EmptyState, ErrorState and ChoiceChips.
 *
 * Each is selected through the components plugin as an app selects it, and
 * the same screen runs on the native test host and in a browser. What has to
 * hold on a phone: a row's title and subtitle stay two labels, the hairline is
 * drawn only where asked, words follow their props after the first paint, the
 * error is announced and its retry runs once, and the chips scroll sideways
 * and say which one is chosen.
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
const ui = join(import.meta.dir, '../../../components/src/ui')

const SCREEN = `<script client>
const rows = state([{ id: 1, name: 'Ridge loop', miles: '4.2 mi' }, { id: 2, name: 'Old mill', miles: '' }])
const opened = state([])
const empty = state('No clubs yet')
const problem = state('The server did not answer.')
const busy = state(false)
const retries = state(0)
const filter = state('all')
const filters = state([{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread', count: 3 }, { value: 'kudos', label: 'Kudos' }])
window.probe = { rows, opened, empty, problem, busy, retries, filter, filters }
</script><div>
  <ChoiceChips testID="filter" label="Show" v-model:value="filter" :options="filters" />
  <GroupedList testID="trails" title="Trails" footer="Two saved">
    <GroupedListRow :for="(row, index) in rows()" :key="row.id" testID="trail-row" :title="row.name" :subtitle="row.miles" value="Run" chevron :separator="index > 0" @select="opened.set([...opened(), row.id])" />
  </GroupedList>
  <EmptyState testID="empty" variant="bare" :title="empty()" description="Join one to train together." />
  <ErrorState testID="problem" title="Couldn't load your clubs" :message="problem()" :busy="busy()" @retry="retries.set(retries() + 1)" />
</div>`

async function fixture() {
  const root = createTempDir('stx-list-states-')
  const file = join(root, 'Screen.stx')
  await Bun.write(join(root, 'stx.config.ts'), `export default { root: '.', plugins: ${JSON.stringify([plugin])} }`)
  await Bun.write(file, SCREEN)
  return { root, file }
}

afterEach(() => {
  unmountAllNativeScreens()
  return closeBrowser()
})

describe('list and state components on a native host', () => {
  it('lays out, updates, announces and responds from the shared source', async () => {
    const { root, file } = await fixture()
    const compiled = await compileScreenSource(SCREEN, file, { root })
    for (const name of ['grouped-list/GroupedList.stx', 'grouped-list/GroupedListRow.stx', 'empty-state/EmptyState.stx', 'error-state/ErrorState.stx', 'choice-chips/ChoiceChips.stx'])
      expect(compiled.dependencies).toContain(join(ui, name))
    const { code } = await compileSharedScreenBundle(file, { root })
    const errors: unknown[][] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
    await phone.settle()
    const texts = () => phone.texts()

    // Rows: two labels each, the value, and a hairline only above the second.
    const rows = phone.all().filter(node => node.props.testID === 'trail-row')
    expect(rows).toHaveLength(2)
    expect(rows[0].type).toBe('Pressable')
    expect(texts()).toEqual(expect.arrayContaining(['Ridge loop', '4.2 mi', 'Old mill', 'Run', 'Trails', 'Two saved']))
    expect(texts()).not.toContain('Ridge loop4.2 mi')
    const rules = phone.all().filter(node => node.props['aria-hidden'] === true && node.type === 'View' && node.style.height === 0.5)
    expect(rules.map(rule => rule.style.display ?? 'flex')).toEqual(['none', 'flex'])
    phone.press(rows[1])
    await phone.settle()
    expect(phone.context.probe.opened()).toEqual([2])

    // Words follow their props.
    phone.context.probe.empty.set('Nothing under this filter')
    await phone.settle()
    expect(texts()).toContain('Nothing under this filter')

    // The error is an alert, and its retry runs once while busy.
    const alert = phone.byTestID('problem')!
    expect(alert.props.accessibilityRole).toBe('alert')
    expect(texts()).toContain('The server did not answer.')
    phone.press(phone.byTestID('problem-retry')!)
    await phone.settle()
    expect(phone.context.probe.retries()).toBe(1)
    phone.context.probe.busy.set(true)
    await phone.settle()
    expect(phone.byTestID('problem-retry')!.props.accessibilityState).toMatchObject({ busy: true })
    phone.press(phone.byTestID('problem-retry')!)
    await phone.settle()
    expect(phone.context.probe.retries()).toBe(1)
    expect(texts()).toContain('Trying again…')

    // Chips scroll sideways and announce the chosen one.
    const row = phone.byTestID('filter')!
    expect(row.type).toBe('ScrollView')
    expect(row.props.horizontal).toBe(true)
    expect(texts()).toContain('Unread 3')
    expect(phone.byTestID('filter-all')!.props.accessibilityState).toMatchObject({ selected: true })
    phone.press(phone.byTestID('filter-unread')!)
    await phone.settle()
    expect(phone.context.probe.filter()).toBe('unread')
    expect(phone.byTestID('filter-unread')!.props.accessibilityState).toMatchObject({ selected: true })
    expect(phone.byTestID('filter-all')!.props.accessibilityState).toMatchObject({ selected: false })
    expect(errors).toEqual([])
  }, 30_000)
})

describe('list and state components in a browser', () => {
  it('renders the same source with its web semantics', async () => {
    const { root, file } = await fixture()
    const loaded = await loadStxConfig(root)
    const html = await processDirectives(`<!DOCTYPE html><html><head><title>States</title></head><body>${SCREEN}</body></html>`, {}, file, { ...defaultConfig, ...loaded, root, cache: false, autoShell: true, buildMode: undefined, debug: true }, new Set())
    const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
    await settle()
    expect(browser.errors).toEqual([])

    const rows = [...browser.window.document.querySelectorAll('[data-stx-grouped-list-row] button')] as HTMLButtonElement[]
    expect(rows.map(row => row.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['Ridge loop 4.2 mi Run', 'Old mill Run'])
    rows[0].click()
    await settle()
    expect(browser.window.probe.opened()).toEqual([1])

    const alert = find(browser, '[data-stx-error-state]')
    expect(alert.getAttribute('role')).toBe('alert')
    alert.querySelector('button')!.click()
    await settle()
    expect(browser.window.probe.retries()).toBe(1)

    browser.window.probe.empty.set('Nothing under this filter')
    await settle()
    expect(find(browser, '[data-stx-empty-state] h3').textContent).toBe('Nothing under this filter')

    const chips = [...find(browser, '[data-stx-choice-chips]').querySelectorAll('button')] as HTMLButtonElement[]
    expect(chips.map(chip => chip.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false'])
    chips[2].click()
    await settle()
    expect(browser.window.probe.filter()).toBe('kudos')
  }, 30_000)
})
