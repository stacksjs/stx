import { describe, expect, it } from 'bun:test'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen, type NativeScreenOptions } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

/**
 * The app-frame components (@stacksjs/components `ui/app-frame`) on a native
 * screen: one component, the layout a phone needs and the one a Mac window
 * needs, from the same props.
 */
const LIBRARY = path.join(import.meta.dir, '../../../components/src/ui/app-frame')

async function mount(source: string, options: NativeScreenOptions = {}) {
  const root = createTempDir('stx-app-frame-')
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
  for (const file of readdirSync(LIBRARY).filter(name => name.endsWith('.stx')))
    await Bun.write(path.join(root, 'components', file), Bun.file(path.join(LIBRARY, file)))
  const file = path.join(root, 'Screen.stx')
  await Bun.write(file, source)
  const { code } = await compileSharedScreenBundle(file, { root })
  const screen = mountNativeScreen(code, 'Screen', options)
  await screen.settle()
  return screen
}

const sidebar = `<script client>
const rows = state([
  { label: 'Inbox', symbol: 'tray', active: true, closable: true, testId: 'row-inbox' },
  { label: 'Drafts', symbol: 'doc', closable: true, testId: 'row-drafts' },
])
const touch = useMediaQuery('(hover: none)')
const picked = state('')
window.probe = { rows, picked }
</script>
<View>
  <SidebarRow :for="row in rows()" :key="row.testId" :item="row" :theme="{ tint: '#11143f', activeBackground: '#ffffff', touch: touch() }" @select="picked.set('select ' + row.label)" @close="picked.set('close ' + row.label)" @rename="picked.set('rename ' + $event)" />
  <Text>{{ picked() }}</Text>
</View>`

describe('SidebarRow', () => {
  it("draws Arc's 40pt rows for a pointer, with the close button only under it", async () => {
    const screen = await mount(sidebar, { platform: 'macos', viewportWidth: 1280 })
    expect(screen.texts()).toEqual(expect.arrayContaining(['Inbox', 'Drafts']))
    const inbox = screen.byTestID('row-inbox')!
    expect(inbox.style).toMatchObject({ height: 40, backgroundColor: '#ffffff' })
    expect(screen.byTestID('row-drafts')!.style.backgroundColor).toBe('#00000000')
    expect(screen.byTestID('row-drafts-close')).toBeUndefined()
    screen.press(screen.byTestID('row-drafts')!, 'onHoverChange', { hovered: true })
    await screen.settle()
    const close = screen.byTestID('row-drafts-close')!
    screen.press(close)
    await screen.settle()
    expect(screen.texts()).toContain('close Drafts')
  })

  it('grows to the 44pt touch target on a phone and always shows its button', async () => {
    const screen = await mount(sidebar, { platform: 'ios', viewportWidth: 390 })
    expect(screen.byTestID('row-inbox')!.style.height).toBe(44)
    expect(screen.byTestID('row-drafts-close')).toBeDefined()
    screen.press(screen.byTestID('row-drafts')!)
    await screen.settle()
    expect(screen.texts()).toContain('select Drafts')
  })

  it('renames in place and hands back the new text', async () => {
    const screen = await mount(sidebar, { platform: 'macos', viewportWidth: 1280 })
    screen.context.probe.rows.set([{ label: 'Inbox', editing: true, testId: 'row-inbox' }])
    await screen.settle()
    const field = screen.byTestID('row-inbox-rename')!
    screen.type(field, 'Later')
    screen.press(field, 'onSubmitEditing', { text: 'Later' })
    await screen.settle()
    expect(screen.texts()).toContain('rename Later')
  })
})

describe('TileGrid', () => {
  it('fills rows of four and keeps a short last row the same width', async () => {
    const screen = await mount(`<script client>
const tiles = Array.from({ length: 6 }, (_, i) => ({ id: 't' + i, symbol: 'globe', active: i === 0, testId: 'tile-' + i }))
const picked = state('')
</script><View><TileGrid :items="tiles" @select="picked.set($event)" /><Text>{{ 'picked ' + picked() }}</Text></View>`, { platform: 'macos', viewportWidth: 1280 })
    const tiles = screen.all().filter(node => String(node.props.testID ?? '').startsWith('tile-'))
    expect(tiles.length).toBe(6)
    // Two rows of four cells: six tiles and two empty cells holding the width.
    const cells = screen.all().filter(node => node.type === 'View' && node.style?.flex === 1 || node.style?.flexGrow === 1)
    expect(cells.length).toBeGreaterThanOrEqual(8)
    expect(screen.byTestID('tile-0')!.style.height).toBe(47)
    screen.press(screen.byTestID('tile-4')!)
    await screen.settle()
    expect(screen.texts()).toContain('picked t4')
  })
})

describe('AddressField and CommandBar', () => {
  const field = `<script client>const opened = state(0)</script><View><AddressField text="example.com" :controls="true" @open="opened.set(opened() + 1)" /><Text>{{ 'opened ' + opened() }}</Text></View>`

  it("keeps the field's buttons for the pointer on a Mac", async () => {
    const screen = await mount(field, { platform: 'macos', viewportWidth: 1280 })
    expect(screen.byTestID('address-copy')).toBeUndefined()
    screen.press(screen.byTestID('address')!, 'onHoverChange', { hovered: true })
    await screen.settle()
    expect(screen.byTestID('address-copy')).toBeDefined()
    expect(screen.byTestID('site-controls')).toBeDefined()
  })

  it('shows them on a phone, which has no pointer', async () => {
    const screen = await mount(field, { platform: 'ios', viewportWidth: 390 })
    expect(screen.byTestID('address-copy')).toBeDefined()
    screen.press(screen.byTestID('address')!)
    await screen.settle()
    expect(screen.texts()).toContain('opened 1')
  })

  const bar = `<script client>const picked = state(-1)
const results = [{ key: 'a', title: 'Alpha', detail: 'Switch to Tab' }, { key: 'b', title: 'Beta', symbol: 'clock' }]</script>
<View><CommandBar value="al" :results="results" :highlighted="0" @pick="picked.set($event)" /><Text>{{ 'picked ' + picked() }}</Text></View>`

  it('is 680pt in a window and the full width on a phone', async () => {
    const wide = await mount(bar, { platform: 'macos', viewportWidth: 1280 })
    expect(wide.texts()).toEqual(expect.arrayContaining(['Alpha', 'Beta', 'Switch to Tab']))
    const panelWidth = (screen: Awaited<ReturnType<typeof mount>>) => screen.all().find(node => node.props.material === 'hud')?.style.width
    expect(panelWidth(wide)).toBe(680)
    wide.press(wide.byTestID('result-1')!)
    await wide.settle()
    expect(wide.texts()).toContain('picked 1')
    const phone = await mount(bar, { platform: 'ios', viewportWidth: 390 })
    expect(panelWidth(phone)).toBe('94%')
  })
})
