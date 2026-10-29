/**
 * The shared Dialog and Drawer present as the phone's sheet on a native host:
 * a Modal that slides up, a panel anchored to the bottom edge with 10pt top
 * corners, the system grabber and room for the home indicator - from the
 * same source as the web page, whose markup is unchanged.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { renderWeb } from './shared-native-web'

const ui = join(import.meta.dir, '../../../components/src/ui')
const source = `@import('Dialog', '${ui}/dialog/Dialog.stx')
@import('DialogPanel', '${ui}/dialog/DialogPanel.stx')
@import('DialogBackdrop', '${ui}/dialog/DialogBackdrop.stx')
@import('DialogTitle', '${ui}/dialog/DialogTitle.stx')
@import('DialogDescription', '${ui}/dialog/DialogDescription.stx')
@import('Drawer', '${ui}/drawer/Drawer.stx')
<script client>
const confirm = state(false)
const alert = state(false)
const filters = state(false)
window.probe = { confirm, alert, filters }
</script>
<section>
  <Dialog testID="confirm" :open="confirm" @close="confirm.set(false)">
    <DialogBackdrop />
    <DialogPanel><DialogTitle>Delete plan?</DialogTitle><DialogDescription>It cannot be undone.</DialogDescription></DialogPanel>
  </Dialog>
  <Dialog testID="alert" :open="alert" animationType="fade" @close="alert.set(false)">
    <DialogPanel variant="center"><DialogTitle>Saved</DialogTitle></DialogPanel>
  </Dialog>
  <Drawer testID="filters" :open="filters" title="Filters" @close="filters.set(false)"><p>Sport</p></Drawer>
</section>`

afterEach(unmountAllNativeScreens)

describe.each(['ios', 'android'] as const)('shared overlays on %s', (platform) => {
  it.each([false, true])('present a dialog as a sheet that slides up (minify=%s)', async (minify) => {
    const { code } = await compileNativeScreen(source, { minify })
    const warnings: string[] = []
    const phone = mountNativeScreen(code, 'Screen', { platform, globals: {
      console: { ...console, warn: (...args: unknown[]) => warnings.push(args.map(String).join(' ')) },
    } })
    await phone.settle()
    const modal = phone.byTestID('confirm')!
    expect(modal.type).toBe('Modal')
    expect(modal.props.animationType).toBe('slide')
    expect(modal.props.sheetDetents).toEqual(['medium', 'large'])
    expect(modal.props.visible).not.toBe(true)

    phone.context.probe.confirm.set(true)
    await phone.settle()
    expect(modal.props.visible).toBe(true)
    const panel = phone.find(node => node.style.borderTopLeftRadius === 10 && node.style.paddingBottom === 34)!
    expect(panel.style).toMatchObject({ width: '100%', backgroundColor: '#ffffff', borderTopRightRadius: 10 })
    const wrapper = phone.all().find(node => node.children.includes(panel))!
    expect(wrapper.style.justifyContent).toBe('flex-end')
    // UIKit moves Modal content into a sheet controller. An absolute-only
    // content root can measure as empty there; keep a full-size flow box.
    expect(wrapper.style).toMatchObject({ width: '100%', height: '100%' })
    expect(wrapper.style.position).not.toBe('absolute')
    const grabber = panel.children[0] as typeof panel
    expect(grabber.style).toMatchObject({ height: 5, width: 36, backgroundColor: '#c6c6c8' })
    const title = phone.find(node => node.type === 'Text' && String(node.children[0]).trim() === 'Delete plan?')!
    expect(title.style).toMatchObject({ fontSize: 17, fontWeight: '600', color: '#000000' })

    phone.press(modal, 'onRequestClose')
    await phone.settle()
    expect(phone.context.probe.confirm()).toBe(false)
    expect(modal.props.visible).toBe(false)

    phone.appearance('dark')
    phone.context.probe.confirm.set(true)
    await phone.settle()
    expect(panel.style.backgroundColor).toBe('#1c1c1e')
    expect(phone.byTestID('confirm')).toBe(modal)
    expect(modal.props.sheetDetents).toEqual(['medium', 'large'])
    expect(warnings.filter(message => message.includes('unknown-binding:'))).toEqual([])
  })

  it.each([false, true])('preserves explicit detent arrays and empty arrays through reopen (minify=%s)', async (minify) => {
    const customSource = source
      .replace('<Dialog testID="confirm"', '<Dialog :sheetDetents="[\'large\']" testID="confirm"')
      .replace('<Drawer testID="filters"', '<Drawer :sheetDetents="[]" testID="filters"')
    const { code } = await compileNativeScreen(customSource, { minify })
    const warnings: string[] = []
    const phone = mountNativeScreen(code, 'Screen', { platform, globals: {
      console: { ...console, warn: (...args: unknown[]) => warnings.push(args.map(String).join(' ')) },
    } })
    await phone.settle()
    const dialog = phone.byTestID('confirm')!
    const drawer = phone.byTestID('filters')!
    for (const open of [true, false, true]) {
      phone.context.probe.confirm.set(open)
      phone.context.probe.filters.set(open)
      await phone.settle()
      expect(phone.byTestID('confirm')).toBe(dialog)
      expect(phone.byTestID('filters')).toBe(drawer)
      expect(dialog.props.visible).toBe(open)
      expect(drawer.props.visible).toBe(open)
      expect(dialog.props.sheetDetents).toEqual(['large'])
      expect(drawer.props.sheetDetents).toEqual([])
    }
    expect(warnings.filter(message => message.includes('unknown-binding:'))).toEqual([])
  })

  it('keeps an asked-for centred card and its fade', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    phone.context.probe.alert.set(true)
    await phone.settle()
    const modal = phone.byTestID('alert')!
    expect(modal.props.animationType).toBe('fade')
    const card = phone.find(node => node.style.borderRadius === 14)!
    expect(card.style).toMatchObject({ maxWidth: 400, backgroundColor: '#ffffff' })
    expect(phone.all().find(node => node.children.includes(card))!.style).toMatchObject({ alignItems: 'center', justifyContent: 'center' })
  })

  it('presents a drawer as a sheet with a title bar and close button', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    phone.context.probe.filters.set(true)
    await phone.settle()
    const modal = phone.byTestID('filters')!
    expect(modal.props).toMatchObject({ animationType: 'slide', visible: true, sheetDetents: ['medium', 'large'] })
    const sheet = phone.find(node => node.props.accessibilityLabel === 'Filters' && node.style.borderTopLeftRadius === 10)!
    expect(sheet.style.backgroundColor).toBe('#f2f2f7')
    expect(phone.find(node => node.type === 'Text' && node.children[0] === 'Filters')!.style).toMatchObject({ fontSize: 17, fontWeight: '600' })
    const close = phone.find(node => node.props.accessibilityLabel === 'Close panel')!
    expect(close.children.some(child => typeof child !== 'string' && child.type === 'Icon' && child.props.symbol === 'xmark')).toBe(true)
    expect(phone.texts()).toContain('Sport')

    phone.press(close)
    await phone.settle()
    expect(phone.context.probe.filters()).toBe(false)
    expect(modal.props.visible).toBe(false)
  })
})

describe('shared overlays on the web', () => {
  it('keep their web markup', async () => {
    const html = await renderWeb(source)
    expect(html).toContain('fixed inset-0')
    expect(html).toContain('slideInRight')
    expect(html).not.toContain('animationType="slide"')
    expect(html).not.toContain(':sheetDetents=')
    expect(html).not.toContain('#f2f2f7')
  })
})
