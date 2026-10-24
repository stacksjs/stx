/**
 * The shared list and switching components look like the platform's on a
 * native host: iOS inset groups with hairline separators and cells that
 * highlight while pressed, and UISegmentedControl's track for a segmented
 * control and a tab strip - from the same source as the web page, whose
 * markup is unchanged.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { renderWeb } from './shared-native-web'

const ui = join(import.meta.dir, '../../../components/src/ui')
const source = `@import('GroupedList', '${ui}/grouped-list/GroupedList.stx')
@import('GroupedListRow', '${ui}/grouped-list/GroupedListRow.stx')
@import('SectionCard', '${ui}/mobile/SectionCard.stx')
@import('ListRow', '${ui}/mobile/ListRow.stx')
@import('SegmentedControl', '${ui}/segmented-control/SegmentedControl.stx')
@import('TabList', '${ui}/tabs/TabList.stx')
@import('Tab', '${ui}/tabs/Tab.stx')
<script client>
const opened = state(0)
const period = state('week')
const tab = state('plans')
const firstShown = state(true)
window.probe = { opened, period, tab, firstShown }
</script>
<section>
  <GroupedList title="Account" footer="Signed in">
    <GroupedListRow testID="profile" title="Profile" chevron icon="<svg viewBox='0 0 24 24'><circle cx='12' cy='12' r='4' /></svg>" tint="success" @select="opened.set(opened() + 1)" />
    <GroupedListRow testID="plan" title="Plan" value="Pro" separator />
  </GroupedList>
  <SectionCard testID="inbox" title="Inbox">
    <ListRow :if="firstShown" title="Welcome" detail="From HQ" href="/inbox/1" />
    <ListRow title="Second" meta="2m" />
    <ListRow title="Third" trailing="3" />
  </SectionCard>
  <SegmentedControl testID="period" v-model:value="period" stretch :options="[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]" />
  <TabList v-model:value="tab" label="Sections">
    <Tab value="plans" testID="tab-plans">Plans</Tab>
    <Tab value="history" testID="tab-history">History</Tab>
  </TabList>
</section>`

afterEach(unmountAllNativeScreens)

describe.each(['ios', 'android'] as const)('shared lists on %s', (platform) => {
  it.each([false, true])('draw an inset group of cells with hairlines (minify=%s)', async (minify) => {
    const { code } = await compileNativeScreen(source, { minify })
    const phone = mountNativeScreen(code, 'Screen', { platform, capabilities: ['nativePlatformControls'] })
    await phone.settle()
    const profile = phone.byTestID('profile')!
    expect(profile.type).toBe('TouchableHighlight')
    expect(profile.props.underlayColor).toBe('#7676803d')
    expect(profile.style.minHeight).toBe(44)
    const group = phone.find(node => node.style.borderRadius === 10 && node.style.backgroundColor === '#ffffff' && node.style.marginHorizontal === 16)!
    expect(group).toBeDefined()
    const separator = phone.find(node => node.style.height === 0.5 && node.style.backgroundColor === '#c6c6c8' && node.style.display !== 'none')!
    expect(separator.style.marginLeft).toBe(16)
    expect(phone.ofType('Icon').some(icon => icon.props.symbol === 'chevron.right' && icon.style.color === '#c4c4c7')).toBe(true)
    expect(phone.find(node => node.style.backgroundColor === '#34c759' && node.style.width === 29)).toBeDefined()
    expect(phone.find(node => node.type === 'Text' && node.children[0] === 'Pro')!.style.color).toBe('#8a8a8e')
    expect(phone.find(node => node.type === 'Text' && node.children[0] === 'Account')!.style).toMatchObject({ fontSize: 13, color: '#6d6d72' })

    phone.press(profile)
    await phone.settle()
    expect(phone.context.probe.opened()).toBe(1)

    phone.appearance('dark')
    await phone.settle()
    expect(group.style.backgroundColor).toBe('#1c1c1e')
    expect(separator.style.backgroundColor).toBe('#38383a')
  })

  it('parts a section card\'s rows with the system separator, following which row is first', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform, capabilities: ['nativePlatformControls'] })
    await phone.settle()
    const card = phone.find(node => node.style.borderRadius === 10 && node.children.length === 3)!
    expect(card).toBeDefined()
    const rows = () => card.children.filter((child): child is typeof card => typeof child !== 'string')
    const divided = () => rows().filter(row => row.style.display !== 'none').map(row => row.style.borderTopWidth ?? 0)
    expect(divided()).toEqual([0, 0.5, 0.5])
    expect(rows()[1]!.style.borderColor).toBe('#c6c6c8')
    expect(rows()[0]!.type).toBe('TouchableHighlight')
    expect(phone.texts()).toEqual(expect.arrayContaining(['From HQ']))

    phone.context.probe.firstShown.set(false)
    await phone.settle()
    expect(divided()).toEqual([0, 0.5])

    phone.context.probe.firstShown.set(true)
    await phone.settle()
    expect(divided()).toEqual([0, 0.5, 0.5])

    phone.appearance('dark')
    await phone.settle()
    expect(rows()[1]!.style.borderColor).toBe('#38383a')
  })

  it('draws a segmented control and a tab strip as UISegmentedControl does', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform, capabilities: ['nativePlatformControls'] })
    await phone.settle()
    const period = phone.byTestID('period')!
    expect(period.type).toBe('SegmentedControl')
    expect(period.props.items).toEqual([
      { value: 'week', label: 'Week', spoken: 'Week', disabled: false },
      { value: 'month', label: 'Month', spoken: 'Month', disabled: false },
    ])
    expect(period.children).toEqual([])
    phone.press(period, 'onValueChange', { value: 'month', index: 1 })
    await phone.settle()
    expect(phone.context.probe.period()).toBe('month')
    expect(period.props.value).toBe('month')

    const plans = phone.byTestID('tab-plans')!
    const history = phone.byTestID('tab-history')!
    const strip = phone.find(node => node.props.accessibilityRole === 'tablist')!
    expect(strip.style).toMatchObject({ backgroundColor: '#7676801f', borderRadius: 9 })
    expect(plans.style).toMatchObject({ backgroundColor: '#ffffff', fontWeight: '600', borderRadius: 7 })
    expect(history.style.backgroundColor ?? null).toBeNull()
    phone.press(history)
    await phone.settle()
    expect(phone.context.probe.tab()).toBe('history')
    expect(history.style.backgroundColor).toBe('#ffffff')
    // Cleared, not left raised: the host is told to drop the fill.
    expect(plans.style.backgroundColor ?? null).toBeNull()
    expect(plans.style.fontWeight).toBe('500')

    phone.appearance('dark')
    await phone.settle()
    expect(history.style.backgroundColor).toBe('#636366')
  })
})

describe('shared lists on the web', () => {
  it('keep their web markup', async () => {
    const html = await renderWeb(source)
    expect(html).toContain('divide-y divide-line')
    expect(html).toContain('bg-surface-sunken')
    expect(html).toContain('aria-selected:border-accent')
    expect(html).not.toContain('TouchableHighlight')
    expect(html).not.toContain('#c6c6c8')
  })
})


describe('shared scrolling List', () => {
  it('keeps keyed rows at the native recycling boundary and forwards paging and refresh', async () => {
    const source = `@import('List', '${ui}/list/List.stx')
<script client>
const rows = state([{ id: 1, title: 'First' }, { id: 2, title: 'Second' }])
const pages = state(0)
const refreshes = state(0)
window.probe = { rows, pages, refreshes }
</script>
<List :contentContainerStyle="{ paddingBottom: 92, paddingTop: 7 }" testID="collection" @end-reached="pages.set(pages() + 1)" @refresh="refreshes.set(refreshes() + 1)">
  <div key="controls" listRole="header"><p>Filters</p></div>
  <div :for="row in rows" :key="row.id"><p :text="row.title"></p></div>
</List>`
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform: 'ios' })
    await phone.settle()
    const list = phone.byTestID('collection')!
    expect(list.type).toBe('FlatList')
    expect(list.props.contentContainerStyle).toEqual({ paddingBottom: 92, paddingTop: 7 })
    expect(list.children.filter(child => typeof child !== 'string').length).toBe(3)
    expect(list.events.onEndReached).toBeDefined()
    phone.press(list, 'onEndReached', {})
    phone.press(list, 'onRefresh', {})
    await phone.settle()
    expect(phone.context.probe.pages()).toBe(1)
    expect(phone.context.probe.refreshes()).toBe(1)
    phone.context.probe.rows.set([{ id: 2, title: 'Updated' }, { id: 3, title: 'Third' }])
    await phone.settle()
    expect(phone.texts()).toContain('Updated')
    expect(phone.texts()).not.toContain('First')
    const html = await renderWeb(source)
    expect(html).toContain('data-stx-list')
    expect(html).toContain('overflow-y-auto')
  })
})
