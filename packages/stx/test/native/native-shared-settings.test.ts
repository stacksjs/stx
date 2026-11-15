/**
 * The Settings window on Craft's AppKit host: the same components and the
 * same props as the web one, drawn as the host's own views. A sidebar with
 * the system's search field and tinted icon tiles, the selected item a blue
 * pill, and beside it the open pane: groups of rows on a raised card with
 * hairlines between them.
 *
 * The window is driven through stx's host adapter (settings/native.ts), so
 * these press what a person would press and read the tree the host draws.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import type { NativeNode, NativeScreen } from '../../src/native/testing'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { renderWeb } from './shared-native-web'

const ui = join(import.meta.dir, '../../../components/src/ui')
const settings = `${ui}/settings`
/** What Craft's AppKit host advertises (CraftMacRuntime.capabilities). */
const MAC = ['desktop', 'fetch', 'eventStream', 'storage', 'secureStorage', 'clipboard', 'dialog', 'linking', 'haptics', 'notifications']

const imports = `@import('SettingsWindow', '${settings}/SettingsWindow.stx')
@import('SettingsSidebarGroup', '${settings}/SettingsSidebarGroup.stx')
@import('SettingsSidebarItem', '${settings}/SettingsSidebarItem.stx')
@import('SettingsPane', '${settings}/SettingsPane.stx')
@import('SettingsPaneHeader', '${settings}/SettingsPaneHeader.stx')
@import('SettingsGroup', '${settings}/SettingsGroup.stx')
@import('SettingsRow', '${settings}/SettingsRow.stx')
@import('SettingsUpdateRow', '${settings}/SettingsUpdateRow.stx')
@import('AppearancePicker', '${ui}/appearance-picker/AppearancePicker.stx')
@import('Switch', '${ui}/switch/Switch.stx')
@import('Select', '${ui}/select/Select.stx')`

const source = `${imports}
<script client>
const pane = state('general')
const login = state(true)
const size = state('medium')
const mode = state('auto')
const locked = state(false)
const heard = state([])
const hear = (name, detail) => heard.set([...heard(), name + ':' + (detail.id ?? detail.query)])
window.probe = { pane, login, size, mode, locked, heard }
</script>
<SettingsWindow id="settings" title="Settings" storageKey="app" v-model:pane="pane" @pane="hear('pane', $event)" @navigate="hear('navigate', $event)" @search="hear('search', $event)">
  <template #account><Text testID="account">Ada Lovelace</Text></template>
  <template #sidebar>
    <SettingsSidebarGroup>
      <SettingsSidebarItem id="general" label="General" icon="i-f7-gear-alt-fill" symbol="gearshape.fill" tone="grey" />
      <SettingsSidebarItem id="appearance" label="Appearance" symbol="circle.lefthalf.filled" tone="ink" keywords="dark light" />
    </SettingsSidebarGroup>
    <SettingsSidebarGroup label="App">
      <SettingsSidebarItem id="updates" label="Updates" symbol="arrow.down.circle.fill" tone="blue" badge="1" />
    </SettingsSidebarGroup>
  </template>

  <SettingsPane id="general" title="General" active>
    <SettingsPaneHeader symbol="gearshape.fill" tone="grey" title="General" description="How the app behaves." />
    <SettingsGroup header="Startup" footer="Runs in the background.">
      <SettingsRow label="Open at login" description="When you sign in." setting="open-at-login" keywords="launch boot">
        <Switch variant="mac" v-model:checked="login" />
      </SettingsRow>
      <SettingsRow label="Icon size" setting="icon-size">
        <Select variant="mac" v-model:value="size" placeholder="" :options="['small', 'medium', 'large']" />
      </SettingsRow>
      <SettingsRow label="About" to="about" value="2.4" symbol="info.circle.fill" tone="blue" setting="about" />
      <SettingsRow label="Erase everything" destructive :disabled="locked()" setting="erase" />
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="about" title="About" parent="general">
    <SettingsGroup>
      <SettingsRow label="Version" setting="version"><Text>2.4</Text></SettingsRow>
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="appearance" title="Appearance">
    <SettingsGroup>
      <SettingsRow label="Appearance" layout="stacked" setting="theme">
        <AppearancePicker v-model:value="mode" label="Appearance" />
      </SettingsRow>
      <SettingsRow label="Notes" multiline description="A longer note." setting="notes" />
    </SettingsGroup>
  </SettingsPane>

  <SettingsPane id="updates" title="Updates">
    <SettingsGroup><SettingsRow label="Automatic updates" setting="auto-update" /></SettingsGroup>
  </SettingsPane>
</SettingsWindow>`

afterEach(unmountAllNativeScreens)

async function open(options: Parameters<typeof mountNativeScreen>[2] = {}): Promise<NativeScreen> {
  const { code } = await compileNativeScreen(source)
  const mac = mountNativeScreen(code, 'Screen', { platform: 'macos', capabilities: MAC, ...options })
  await mac.settle()
  return mac
}

const flag = (name: string) => (node: NativeNode): boolean => node.props[name] !== undefined
const shownNode = (node: NativeNode): boolean => node.style.display !== 'none'
const kids = (node: NativeNode): NativeNode[] => node.children.filter((child): child is NativeNode => typeof child !== 'string')
const words = (node: NativeNode): string => node.children.map(child => typeof child === 'string' ? child : words(child)).join('')

function parts(mac: NativeScreen) {
  const item = (id: string): NativeNode => mac.find(node => node.props['data-settings-item'] === id)!
  const pane = (id: string): NativeNode => mac.find(node => node.props['data-settings-pane'] === id)!
  const row = (id: string): NativeNode => mac.find(node => node.props['data-setting'] === id)!
  return {
    item,
    pane,
    row,
    shownPanes: () => mac.all().filter(node => node.props['data-settings-pane'] && shownNode(node)).map(node => node.props['data-settings-pane']),
    shownItems: () => mac.all().filter(node => node.props['data-settings-item'] && shownNode(node)).map(node => node.props['data-settings-item']),
    selected: () => mac.all().filter(node => node.props['data-settings-item'] && node.props['aria-selected'] === 'true').map(node => node.props['data-settings-item']),
    title: () => words(mac.find(flag('data-settings-title'))!),
    back: () => mac.find(flag('data-settings-back'))!,
    forward: () => mac.find(flag('data-settings-forward'))!,
    search: () => mac.find(flag('data-settings-search-input'))!,
    results: () => mac.all().filter(flag('data-settings-result')),
    heard: () => mac.context.probe.heard() as string[],
  }
}

describe('the Settings window on the AppKit host', () => {
  it('draws two columns: a sidebar on the sidebar material with the system search field, and the open pane', async () => {
    const mac = await open()
    const { item, pane, title, back, forward, search, shownPanes, selected } = parts(mac)

    const sidebar = mac.find(flag('data-settings-sidebar'))!
    expect(sidebar.props.material).toBe('sidebar')
    expect(sidebar.style).toMatchObject({ width: 226, flexDirection: 'column', backgroundColor: '#f2f1f0' })
    expect(search().type).toBe('TextInput')
    expect(search().props).toMatchObject({ type: 'search', placeholder: 'Search' })
    expect(search().style).toMatchObject({ height: 28, fontSize: 13 })
    expect(mac.find(flag('data-settings-nav'))!.type).toBe('ScrollView')
    expect(mac.byTestID('account')).toBeDefined()

    // A sidebar item: a pressable row, a tinted rounded tile holding an SF Symbol, its label.
    const general = item('general')
    expect(general.type).toBe('Pressable')
    expect(general.style).toMatchObject({ flexDirection: 'row', height: 30, borderRadius: 8, backgroundColor: '#007aff' })
    const [tile, label] = kids(general)
    expect(tile!.style).toMatchObject({ width: 20, height: 20, borderRadius: 5.5, backgroundColor: '#8e8e93' })
    expect(kids(tile!)[0]!.type).toBe('Icon')
    expect(kids(tile!)[0]!.props.symbol).toBe('gearshape.fill')
    expect(kids(tile!)[0]!.style).toMatchObject({ width: 13, height: 13, color: '#ffffff' })
    // The selected one is the blue pill with white words; the others are plain ink.
    expect(label!.type).toBe('Text')
    expect(label!.style).toMatchObject({ fontSize: 13, color: '#ffffff' })
    const appearance = item('appearance')
    expect(appearance.style.backgroundColor ?? null).toBeNull()
    expect(kids(appearance)[1]!.style.color).toBe('#000000d9')
    expect(kids(kids(appearance)[0]!)[0]!.props.symbol).toBe('circle.lefthalf.filled')
    expect(kids(appearance)[0]!.style.backgroundColor).toBe('#1d1d1f')
    expect(words(kids(item('updates'))[2]!)).toBe('1')
    expect(selected()).toEqual(['general'])
    // A group's caption, and the gap above every group but the first.
    expect(mac.texts()).toContain('App')
    expect(mac.all().filter(flag('data-settings-group-gap')).map(shownNode)).toEqual([false, true])

    // The detail column: back, forward and the pane's name, large, over the pane.
    expect(mac.find(flag('data-settings-detail'))!.style.backgroundColor).toBe('#ffffff')
    expect(back().type).toBe('Button')
    expect(back().props).toMatchObject({ symbol: 'chevron.left', iconOnly: true, variant: 'toolbar', disabled: true })
    expect(forward().props).toMatchObject({ symbol: 'chevron.right', disabled: true })
    expect(title()).toBe('General')
    expect(mac.find(flag('data-settings-title'))!.style).toMatchObject({ fontSize: 20, fontWeight: '600' })
    expect(pane('general').type).toBe('ScrollView')
    expect(shownPanes()).toEqual(['general'])
    expect(kids(pane('general'))[0]!.style).toMatchObject({ paddingHorizontal: 20 })
  })

  it('draws a group as a raised card of rows with a hairline above every row but the first', async () => {
    const mac = await open()
    const { row } = parts(mac)

    const card = mac.all().filter(flag('data-settings-card'))[0]!
    expect(card.style).toMatchObject({ borderRadius: 12, backgroundColor: '#0000000a', flexDirection: 'column' })
    const rules = mac.all().filter(flag('data-settings-row-rule')).slice(0, 4)
    expect(rules.map(shownNode)).toEqual([false, true, true, true])
    expect(rules[1]!.style).toMatchObject({ height: 0.5, marginHorizontal: 10, backgroundColor: '#0000001a' })
    expect(mac.find(node => node.type === 'Text' && words(node) === 'Startup')!.style).toMatchObject({ fontSize: 13, fontWeight: 'bold' })
    expect(mac.find(node => node.type === 'Text' && words(node) === 'Runs in the background.')!.style).toMatchObject({ fontSize: 11, color: '#00000080' })

    // A row: the label over its description at the leading edge, the control at the trailing one.
    const login = row('open-at-login')
    expect(login.type).toBe('View')
    expect(login.style).toMatchObject({ flexDirection: 'row', alignItems: 'center', minHeight: 38, paddingHorizontal: 10 })
    const [text, control] = kids(login)
    expect(text!.style).toMatchObject({ flex: 1, flexDirection: 'column' })
    expect(kids(text!).map(words)).toEqual(['Open at login', 'When you sign in.'])
    expect(kids(text!)[0]!.style).toMatchObject({ fontSize: 13, color: '#000000d9' })
    expect(kids(text!)[1]!.style).toMatchObject({ fontSize: 11, color: '#00000080' })
    expect(control!.style).toMatchObject({ flexDirection: 'row', justifyContent: 'flex-end' })

    // The controls inside are the host's own: an NSSwitch and an NSPopUpButton fed its choices.
    const toggle = mac.ofType('Switch')[0]!
    expect(toggle.props.value).toBe(true)
    mac.press(toggle, 'onValueChange', { value: false })
    await mac.settle()
    expect(mac.context.probe.login()).toBe(false)
    expect(toggle.props.value).toBe(false)
    const picker = mac.ofType('Picker')[0]!
    expect(picker.props.options).toEqual([{ value: 'small', label: 'small' }, { value: 'medium', label: 'medium' }, { value: 'large', label: 'large' }])
    expect(picker.props.value).toBe('medium')
    expect(picker.style.width).toBeUndefined()
    mac.press(picker, 'onValueChange', { value: 'large' })
    await mac.settle()
    expect(mac.context.probe.size()).toBe('large')

    // Destructive paints the label; disabled dims the row and follows its binding.
    const erase = row('erase')
    expect(kids(kids(erase)[0]!)[0]!.style.color).toBe('#ff3b30')
    expect(erase.style.opacity ?? 1).toBe(1)
    mac.context.probe.locked.set(true)
    await mac.settle()
    expect(erase.style.opacity).toBe(0.5)
    expect(erase.props['aria-disabled']).toBe('true')

    // The header card: a large tile, the pane's name, a sentence.
    const hero = mac.find(flag('data-settings-pane-header'))!
    expect(hero.type).toBe('View')
    expect(hero.style).toMatchObject({ alignItems: 'center', borderRadius: 12, padding: 22 })
    expect(kids(hero)[0]!.style).toMatchObject({ width: 48, height: 48, backgroundColor: '#8e8e93' })
    expect(kids(kids(hero)[0]!)[0]!.props.symbol).toBe('gearshape.fill')
    expect(kids(hero).slice(1).map(words)).toEqual(['General', 'How the app behaves.'])
  })

  it('lays out a stacked row, a multiline row and the appearance picker', async () => {
    const mac = await open()
    const { row } = parts(mac)

    const theme = row('theme')
    expect(theme.style).toMatchObject({ flexDirection: 'column', alignItems: 'stretch' })
    expect(row('notes').style.alignItems).toBe('flex-start')

    const choices = mac.all().filter(flag('data-mode'))
    expect(choices.map(node => [node.type, node.props['data-mode'], node.props['aria-checked']])).toEqual([
      ['Pressable', 'light', 'false'],
      ['Pressable', 'dark', 'false'],
      ['Pressable', 'auto', 'true'],
    ])
    const frame = (node: NativeNode): NativeNode => kids(node)[0]!
    expect(frame(choices[2]!).style).toMatchObject({ borderWidth: 2, borderColor: '#007aff' })
    expect(frame(choices[0]!).style.borderColor).toBe('transparent')
    // The picture: all light, all dark, and half of each for Auto.
    const halves = (node: NativeNode): string[] => kids(kids(frame(node))[0]!).map(half => half.style.backgroundColor)
    expect(choices.map(halves)).toEqual([['#e9e9eb', '#e9e9eb'], ['#2c2c2e', '#2c2c2e'], ['#e9e9eb', '#2c2c2e']])
    expect(choices.map(node => words(kids(node)[1]!))).toEqual(['Light', 'Dark', 'Auto'])

    mac.press(choices[1]!)
    await mac.settle()
    expect(mac.context.probe.mode()).toBe('dark')
    const after = mac.all().filter(flag('data-mode'))
    expect(after.map(node => node.props['aria-checked'])).toEqual(['false', 'true', 'false'])
    expect(frame(after[1]!).style.borderColor).toBe('#007aff')
  })

  it('opens a pane from its sidebar item, from the model and from the component API, with back and forward', async () => {
    const mac = await open()
    const { item, shownPanes, selected, title, back, forward, heard } = parts(mac)
    expect(heard()).toEqual(['pane:general'])

    mac.press(item('updates'))
    await mac.settle()
    expect(shownPanes()).toEqual(['updates'])
    expect(selected()).toEqual(['updates'])
    expect(title()).toBe('Updates')
    expect(item('updates').style.backgroundColor).toBe('#007aff')
    expect(item('general').style.backgroundColor ?? null).toBeNull()
    expect(kids(item('general'))[1]!.style.color).toBe('#000000d9')
    expect(mac.context.probe.pane()).toBe('updates')
    expect(heard()).toEqual(['pane:general', 'pane:updates'])
    expect(back().props.disabled).toBe(false)
    expect(forward().props.disabled).toBe(true)

    mac.press(back())
    await mac.settle()
    expect(shownPanes()).toEqual(['general'])
    expect(forward().props.disabled).toBe(false)
    mac.press(forward())
    await mac.settle()
    expect(shownPanes()).toEqual(['updates'])

    // v-model:pane is an instruction too.
    mac.context.probe.pane.set('appearance')
    await mac.settle()
    expect(shownPanes()).toEqual(['appearance'])
    expect(selected()).toEqual(['appearance'])

    // componentApi('settings') on a screen with no DOM.
    const api = (mac.context.__stxComponentApis as Record<string, any>).settings
    expect(api.showPane('general')).toBe(true)
    expect(api.showPane('nowhere')).toBe(false)
    await mac.settle()
    expect(api.getPane()).toBe('general')
    api.back()
    await mac.settle()
    expect(api.getPane()).toBe('appearance')
    api.forward()
    await mac.settle()
    expect(shownPanes()).toEqual(['general'])
    // The host gives a field the keyboard when its autoFocus turns on.
    expect(parts(mac).search().props.autoFocus).toBe(false)
    api.focusSearch()
    await Bun.sleep(10)
    await mac.settle()
    expect(parts(mac).search().props.autoFocus).toBe(true)
  })

  it('opens a sub-pane from a navigation row, a chevron at its end, and goes back', async () => {
    const mac = await open()
    const { row, shownPanes, selected, title, back, heard } = parts(mac)

    const about = row('about')
    expect(about.type).toBe('Pressable')
    expect(about.props['data-navigate']).toBe('about')
    expect(about.style.minHeight).toBe(44)
    const children = kids(about)
    expect(children[0]!.style).toMatchObject({ width: 24, height: 24, borderRadius: 6, backgroundColor: '#007aff' })
    expect(words(children[2]!)).toBe('2.4')
    expect(children[2]!.style.color).toBe('#00000080')
    expect(children[3]!.type).toBe('Icon')
    expect(children[3]!.props.symbol).toBe('chevron.right')

    mac.press(about)
    await mac.settle()
    expect(shownPanes()).toEqual(['about'])
    expect(title()).toBe('About')
    // The item of the pane it was reached from stays selected.
    expect(selected()).toEqual(['general'])
    expect(heard()).toEqual(['pane:general', 'pane:about', 'navigate:about'])

    mac.press(back())
    await mac.settle()
    expect(shownPanes()).toEqual(['general'])
  })

  it('filters the sidebar and lists matching settings as the search field is typed in', async () => {
    const mac = await open()
    const { search, shownItems, shownPanes, results, row, heard } = parts(mac)
    expect(shownItems()).toEqual(['general', 'appearance', 'updates'])

    // A keyword of a row: no sidebar item matches, the setting is listed with its pane.
    mac.type(search(), 'launch')
    await mac.settle()
    expect(shownItems()).toEqual([])
    expect(results().map(words)).toEqual(['Open at loginGeneral'])
    expect(mac.find(flag('data-settings-account'))!.style.display).toBe('none')
    expect(mac.find(flag('data-settings-empty'))!.style.display).toBe('none')
    expect(heard()).toContain('search:launch')

    // A keyword of a sidebar item.
    mac.type(search(), 'dark')
    await mac.settle()
    expect(shownItems()).toEqual(['appearance'])
    // A label, which also finds the pane's own rows.
    mac.type(search(), 'upd')
    await mac.settle()
    expect(shownItems()).toEqual(['updates'])
    expect(results().map(words)).toEqual(['Automatic updatesUpdates'])

    // Choosing a setting opens its pane and washes the row for a moment.
    mac.press(results()[0]!)
    await mac.settle()
    expect(shownPanes()).toEqual(['updates'])
    expect(row('auto-update').style.backgroundColor).toBe('#007aff33')

    mac.type(search(), 'zzz')
    await mac.settle()
    expect(shownItems()).toEqual([])
    expect(results()).toEqual([])
    expect(mac.find(flag('data-settings-empty'))!.style.display).not.toBe('none')

    // Escape in the field, which the host reports as a desktop command, clears it.
    mac.craftEvent('craftDesktopCommand', { id: 'escape' })
    await mac.settle()
    expect(shownItems()).toEqual(['general', 'appearance', 'updates'])
    expect(search().props.value).toBe('')
    expect(mac.find(flag('data-settings-account'))!.style.display).not.toBe('none')

    // revealSetting opens the pane that holds the row.
    const api = (mac.context.__stxComponentApis as Record<string, any>).settings
    expect(api.revealSetting('open-at-login')).toBe(true)
    expect(api.revealSetting('nothing')).toBe(false)
    await mac.settle()
    expect(shownPanes()).toEqual(['general'])
    expect(row('open-at-login').style.backgroundColor).toBe('#007aff33')
  })

  it('remembers the open pane in the app storage and opens on it next time', async () => {
    const mac = await open()
    mac.press(parts(mac).item('appearance'))
    await mac.settle()
    expect(mac.stored['stx.localStorage:stx:settings:app']).toBe('appearance')

    const again = await open({ storage: { 'stx.localStorage:stx:settings:app': 'updates' } })
    expect(parts(again).shownPanes()).toEqual(['updates'])
    expect(parts(again).selected()).toEqual(['updates'])
    expect(again.context.probe.pane()).toBe('updates')
  })

  it('follows the appearance', async () => {
    const mac = await open({ colorScheme: 'dark' })
    const { item, row } = parts(mac)
    expect(mac.find(flag('data-settings-sidebar'))!.style.backgroundColor).toBe('#2a2a2a')
    expect(mac.find(flag('data-settings-detail'))!.style.backgroundColor).toBe('#1e1e1e')
    expect(item('general').style.backgroundColor).toBe('#0a84ff')
    expect(kids(item('appearance'))[1]!.style.color).toBe('#ffffffd9')
    // The ink tile is light in a dark window, and its glyph dark.
    expect(kids(item('appearance'))[0]!.style.backgroundColor).toBe('#dcdce0')
    expect(kids(kids(item('appearance'))[0]!)[0]!.style.color).toBe('#1d1d1f')
    expect(mac.all().filter(flag('data-settings-card'))[0]!.style.backgroundColor).toBe('#ffffff0d')
    expect(kids(kids(row('open-at-login'))[0]!)[0]!.style.color).toBe('#ffffffd9')

    mac.appearance('light')
    await mac.settle()
    expect(item('general').style.backgroundColor).toBe('#007aff')
    expect(mac.find(flag('data-settings-detail'))!.style.backgroundColor).toBe('#ffffff')
  })
})

describe('the update row', () => {
  const screen = `${imports}
<script client>
const status = state(null)
const heard = state([])
window.probe = { status, heard }
onMount(async () => {
  onDestroy(craft.updater.onChange(next => status.set(next)))
  status.set(await craft.updater.status())
})
</script>
<SettingsGroup header="Software Update">
  <SettingsUpdateRow appName="Library" :status="status()" @check="heard.set([...heard(), 'check'])" @install="heard.set([...heard(), 'install'])" @relaunch="heard.set([...heard(), 'relaunch'])" />
</SettingsGroup>`

  async function mount(first: Record<string, unknown>) {
    const { code } = await compileNativeScreen(screen)
    const mac = mountNativeScreen(code, 'Screen', {
      platform: 'macos',
      capabilities: [...MAC, 'updater'],
      appVersion: '2.4',
      native: (module, method) => module === 'Updater' && method === 'status' ? { currentVersion: '2.4', selfUpdating: true, ...first } : null,
    })
    await mac.settle()
    const button = (): NativeNode | undefined => mac.ofType('Button').find(shownNode)
    const move = async (next: Record<string, unknown>): Promise<void> => {
      mac.craftEvent('craftUpdaterChange', { currentVersion: '2.4', selfUpdating: true, ...next })
      await mac.settle()
    }
    return { mac, button, move, heard: () => mac.context.probe.heard() as string[] }
  }

  it('says the app and its version and offers the button for each state', async () => {
    const { mac, button, move, heard } = await mount({ state: 'idle' })
    expect(mac.natives).toContain('Updater.status')
    const row = mac.find(node => node.props['data-setting'] === 'software-update')!
    expect(row.props['data-label']).toBe('Library 2.4')
    expect(mac.texts()).toEqual(expect.arrayContaining(['Library 2.4', 'Check for a newer version.']))
    // The plain push button, as AppKit draws one.
    expect(button()!.props).toMatchObject({ title: 'Check Now', disabled: false })
    expect(button()!.props.variant).toBeUndefined()
    mac.press(button()!)
    await mac.settle()
    expect(heard()).toEqual(['check'])

    await move({ state: 'checking' })
    expect(mac.texts()).toContain('Checking for updates...')
    expect(button()!.props).toMatchObject({ title: 'Check Now', disabled: true })

    await move({ state: 'current' })
    expect(mac.texts()).toContain('Library is up to date.')
    expect(button()!.props).toMatchObject({ title: 'Check Now', disabled: false })

    await move({ state: 'available', version: '2.5' })
    expect(mac.texts()).toContain('Version 2.5 is available.')
    expect(button()!.props).toMatchObject({ title: 'Download and Install', variant: 'primary', disabled: false })
    mac.press(button()!)
    await mac.settle()
    expect(heard()).toEqual(['check', 'install'])

    await move({ state: 'downloading', version: '2.5', progress: 0.42 })
    expect(mac.texts()).toEqual(expect.arrayContaining(['Downloading version 2.5...', '42%']))
    expect(button()!.props).toMatchObject({ title: 'Download and Install', disabled: true })
    const progress = mac.find(node => node.props['data-settings-update-progress'] !== undefined)!
    expect(progress.style).toMatchObject({ fontSize: 11, color: '#00000080' })
    await move({ state: 'downloading', version: '2.5', progress: 0.9 })
    expect(mac.texts()).toContain('90%')

    await move({ state: 'installing', version: '2.5' })
    expect(mac.texts()).toContain('Installing version 2.5...')
    expect(progress.style.display).toBe('none')
    expect(button()!.props.disabled).toBe(true)

    await move({ state: 'installed', version: '2.5' })
    expect(mac.texts()).toContain('Version 2.5 is installed. Restart Library to finish updating.')
    expect(button()!.props).toMatchObject({ title: 'Restart to Update', variant: 'primary', disabled: false })
    mac.press(button()!)
    await mac.settle()
    expect(heard()).toEqual(['check', 'install', 'relaunch'])

    await move({ state: 'error', error: 'The download was interrupted.' })
    expect(mac.texts()).toContain('The download was interrupted.')
    expect(button()!.props.title).toBe('Check Now')
  })

  it('offers no install to an app that cannot replace itself', async () => {
    const { mac, button, move } = await mount({ state: 'unavailable', selfUpdating: false, reason: 'Updates come from the Mac App Store.' })
    expect(mac.texts()).toContain('Updates come from the Mac App Store.')
    expect(button()).toBeUndefined()

    await move({ state: 'available', version: '2.5', selfUpdating: false, reason: 'Move Library to the Applications folder to update it.' })
    expect(mac.texts()).toContain('Version 2.5 is available. Move Library to the Applications folder to update it.')
    expect(button()!.props.title).toBe('Check Now')
  })
})

describe('the Settings components on the web', () => {
  it('keep their web markup, with `symbol` left to the native host', async () => {
    const html = await renderWeb(source)
    expect(html).toContain('class="stx-settings ')
    expect(html).toContain('stx-settings-item')
    expect(html).toContain('i-f7-gear-alt-fill')
    expect(html).toContain('stx-settings-row-chevron')
    expect(html).toContain('stx-appearance-option')
    expect(html).toContain('data-settings-search-input')
    expect(html).not.toContain('data-native="Pressable"')
    expect(html).not.toContain('<div data-settings-row-rule')
    // The symbol is the native host's: no element carries it, and no native icon is drawn.
    expect(html).not.toContain('symbol="gearshape.fill"')
    expect(html).not.toContain('data-native="Icon"')
    // None of the native class lists reach the page.
    expect(html).not.toContain('aria-selected:bg-')
    expect(html).not.toContain('bg-[#e9e9eb]')
    expect(html).not.toContain('#007aff33')
  })
})
