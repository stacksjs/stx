import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { resetAppThemeCSS } from '../../src/native/compiler/app-theme'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

const ui = join(import.meta.dir, '../../../components/src/ui')
afterEach(() => { unmountAllNativeScreens(); resetAppThemeCSS() })

describe.each(['ios', 'android'] as const)('shared native platform contract on %s', (platform) => {
  it('keeps segment values, choices and per-option disabled state live', async () => {
    const { code } = await compileNativeScreen(`@import('SegmentedControl', '${ui}/segmented-control/SegmentedControl.stx')
<script client>
const value = state('day')
const choices = state([{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week', disabled: true }])
const changes = []
globalThis.probe = { value, choices, changes }
</script>
<SegmentedControl testID="period" v-model:value="value" :options="choices" @change="changes.push($event)" />`)
    const phone = mountNativeScreen(code, 'Screen', { platform, capabilities: ['nativePlatformControls'] })
    await phone.settle()
    const control = phone.byTestID('period')!
    expect(control.type).toBe('SegmentedControl')
    expect(control.props.value).toBe('day')
    expect(phone.context.probe.changes).toEqual([])
    phone.press(control, 'onValueChange', { value: 'week', index: 1 })
    await phone.settle()
    expect(phone.context.probe.value()).toBe('day')
    phone.context.probe.choices.set([{ value: 'day', label: 'Today' }, { value: 'week', label: 'This week' }])
    await phone.settle()
    expect(control.props.items[1].label).toBe('This week')
    phone.press(control, 'onValueChange', { value: 'week', index: 1 })
    await phone.settle()
    expect(phone.context.probe.value()).toBe('week')
    expect(phone.context.probe.changes).toEqual(['week'])
    expect(control.children).toEqual([])
    expect(phone.mutationErrors).toEqual([])
  })

  it('clears a lazy text model through the native affordance once', async () => {
    const { code } = await compileNativeScreen(`@import('TextInput', '${ui}/input/TextInput.stx')
<script client>
const value = state('Training')
const edits = []
const clears = []
globalThis.probe = { value, edits, clears }
</script>
<TextInput testID="search" clearable v-model:value.lazy="value" @input="edits.push($event)" @clear="clears.push('clear')" />`)
    const phone = mountNativeScreen(code, 'Screen', { platform, capabilities: ['nativePlatformControls'] })
    await phone.settle()
    const field = phone.byTestID('search')!
    expect(field.props.clearButtonMode).toBe('while-editing')
    phone.press(field, 'onChangeText', { text: '', clear: true })
    await phone.settle()
    expect(phone.context.probe.value()).toBe('')
    expect(phone.context.probe.edits).toEqual([''])
    expect(phone.context.probe.clears).toEqual(['clear'])
  })

  it('uses the app palette for filled buttons, their spinner, switches and checkboxes', async () => {
    const root = createTempDir('stx-platform-palette-')
    await Bun.write(join(root, 'stx.config.ts'), `export default { root: '.', css: './css.ts' }`)
    await Bun.write(join(root, 'css.ts'), `export default { roles: { accent: { light: '#746136', dark: '#ddc68b' }, 'accent-solid': '#746136', 'accent-ink': '#faf9f6' } }`)
    const source = `@import('Button', '${ui}/button/Button.stx')
@import('Switch', '${ui}/switch/Switch.stx')
@import('Checkbox', '${ui}/checkbox/Checkbox.stx')
<div><Button testID="save" loading label="Save" /><Switch testID="alerts" label="Alerts" /><Checkbox testID="agree" label="Agree" /></div>`
    const file = join(root, 'Screen.stx')
    await Bun.write(file, source)
    const { code } = await compileSharedScreenBundle(file, { root })
    const phone = mountNativeScreen(code, 'Screen', { platform, capabilities: ['nativePlatformControls'] })
    await phone.settle()
    expect(phone.byTestID('save')!.style.backgroundColor).toBe('#746136')
    expect(phone.ofType('ActivityIndicator')[0]!.style.color).toBe('#faf9f6')
    expect(phone.byTestID('alerts')!.style.color).toBe('#746136')
    expect(phone.byTestID('agree')!.style.color).toBe('#746136')
    phone.appearance('dark')
    await phone.settle()
    expect(phone.byTestID('alerts')!.style.color).toBe('#ddc68b')
    expect(phone.byTestID('agree')!.style.color).toBe('#ddc68b')
  })
})

it('uses native chrome and a horizontal scroller for the shared mobile navigation', async () => {
  const root = createTempDir('stx-platform-chrome-')
  const file = join(root, 'Screen.stx')
  await Bun.write(file, `@import('NavBar', '${ui}/mobile/NavBar.stx')
@import('TabBar', '${ui}/mobile/TabBar.stx')
@import('TabBarItem', '${ui}/mobile/TabBarItem.stx')
@import('FilterChips', '${ui}/mobile/FilterChips.stx')
@import('FilterChip', '${ui}/mobile/FilterChip.stx')
<div>
<NavBar title="Discover" backHref="/today" actions="<a href='/settings' aria-label='Settings'><i class='i-lucide-settings'></i></a>" />
<FilterChips :chips="[{ label: 'People', href: '/people', active: true }, { label: 'Workouts', href: '/workouts' }]" />
<TabBar :items="[{ label: 'Today', href: '/today', icon: '<i class=i-lucide-sun></i>' }, { label: 'Discover', href: '/discover', icon: '<i class=i-lucide-search></i>' }]" />
</div>`)
  const result = await compileSharedScreenBundle(file, { root })
  expect(result.chrome?.main?.tabs).toEqual([{ path: '/today', title: 'Today', symbol: 'sun.max' }, { path: '/discover', title: 'Discover', symbol: 'magnifyingglass' }])
  expect(result.chrome?.main?.bar).toEqual([{ path: '/settings', title: 'Settings', symbol: 'gearshape' }])
  const phone = mountNativeScreen(result.code, 'Screen')
  await phone.settle()
  expect(phone.texts()).toContain('Discover')
  expect(phone.ofType('ScrollView').some(node => node.props.horizontal && node.props.showsHorizontalScrollIndicator === false)).toBe(true)
  expect(phone.find(node => node.props.accessibilityRole === 'button' && node.props.accessibilityState?.selected === true)).toBeDefined()
})

it('retains working composed controls on an installed older native host', async () => {
  const { code } = await compileNativeScreen(`@import('SegmentedControl', '${ui}/segmented-control/SegmentedControl.stx')
@import('TextInput', '${ui}/input/TextInput.stx')
<script client>
const value = state('day')
const text = state('Training')
globalThis.probe = { value, text }
</script>
<div><SegmentedControl testID="period" v-model:value="value" :options="['day', 'week']" /><TextInput testID="search" clearable v-model:value="text" /></div>`)
  const phone = mountNativeScreen(code, 'Screen')
  await phone.settle()
  expect(phone.ofType('SegmentedControl')).toEqual([])
  phone.press(phone.byTestID('period-week')!)
  await phone.settle()
  expect(phone.context.probe.value()).toBe('week')
  expect(phone.byTestID('search')!.props.clearButtonMode).toBe('never')
  phone.press(phone.find(node => node.props.accessibilityLabel === 'Clear input')!)
  await phone.settle()
  expect(phone.context.probe.text()).toBe('')
  expect(phone.mutationErrors).toEqual([])
})
