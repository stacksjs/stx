import { expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

it.each([false, true])('presents capability-gated non-modal layers without stealing focus (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`<script client>
const outer = useRef('outer')
const popup = useRef('popup')
window.showOuter = () => stx.overlays.open('outer', { root: outer(), onEscape: () => stx.overlays.close('outer') })
window.showPopup = () => stx.overlays.open('popup', {
  root: popup(), modal: false,
  onBackdrop: () => stx.overlays.close('popup'),
  onEscape: () => stx.overlays.close('popup')
})
</script><div data-native="Modal" visible="false" x-ref="outer" testID="outer">
<div data-native="Modal" visible="false" x-ref="popup" testID="popup"
  style="position:absolute;left:20px;top:40px;width:160px;height:80px"><input autofocus /></div>
</div>`, { minify })
  for (const supported of [false, true]) {
    const requests: unknown[] = []
    const phone = mountNativeScreen(code, 'Screen', {
      capabilities: ['viewFocus', 'viewReparent', ...(supported ? ['viewNonModalPresentation'] : [])],
      native(...args) { requests.push(args); return true },
    })
    try {
      await phone.settle()
      phone.context.showOuter()
      await phone.settle()
      const before = requests.length
      const popup = phone.byTestID('popup')!
      if (!supported) {
        expect(() => phone.context.showPopup()).toThrow('viewNonModalPresentation')
        expect(phone.context.stx.overlays.list()).toEqual(['outer'])
        expect(popup.props.visible).toBe(false)
        expect(popup.props.nonModal).toBeUndefined()
        continue
      }
      phone.context.showPopup()
      await phone.settle()
      expect(popup.props).toMatchObject({ visible: true, nonModal: true, dismissOnOutsideTap: true })
      expect(popup.style).toMatchObject({ position: 'absolute', left: 20, top: 40, width: 160, height: 80 })
      expect(requests).toHaveLength(before)
      const outer = phone.byTestID('outer')!
      phone.press(outer, 'onRequestClose', { reason: 'back' })
      await phone.settle()
      expect(phone.context.stx.overlays.list()).toEqual(['outer', 'popup'])
      phone.press(popup, 'onRequestClose', { reason: 'backdrop' })
      await phone.settle()
      expect(phone.context.stx.overlays.list()).toEqual(['outer'])
      expect(outer.props.visible).toBe(true)
      expect(popup.props.visible).toBe(false)
      phone.context.showPopup()
      phone.context.stx.overlays.open('popup', { onBackdrop: null })
      await phone.settle()
      expect(popup.props.dismissOnOutsideTap).toBe(false)
      phone.press(popup, 'onRequestClose', { reason: 'backdrop' })
      await phone.settle()
      expect(popup.props.visible).toBe(true)
      phone.press(popup, 'onRequestClose', { reason: 'escape' })
      await phone.settle()
      expect(popup.props.visible).toBe(false)
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }
}, 30_000)

it('opens, dismisses only the top shared overlay, reopens, and cleans up without a DOM (#2089)', async () => {
  const root = createTempDir('stx-shared-overlays-')
  mkdirSync(join(root, 'components'))
  await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
  for (const [name, source] of Object.entries({ SharedDialog: 'dialog/Dialog', SharedPanel: 'dialog/DialogPanel', SharedDrawer: 'drawer/Drawer' })) {
    await Bun.write(join(root, 'components', `${name}.stx`), Bun.file(join(import.meta.dir, '../../../components/src/ui', `${source}.stx`)))
  }
  const file = join(root, 'Screen.stx')
  await Bun.write(file, `<script client>
const outer = state(false)
const inner = state(false)
const drawer = state(false)
const present = state(true)
window.probe = { outer, inner, drawer, present }
</script><section :if="present">
<SharedDialog :open="outer" title="Outer" @close="outer.set(false)"><SharedPanel><button type="button">Outer action</button></SharedPanel></SharedDialog>
<SharedDialog :open="inner" title="Inner" @close="inner.set(false)"><SharedPanel><button type="button">Inner action</button></SharedPanel></SharedDialog>
<SharedDrawer :open="drawer" title="Drawer" @close="drawer.set(false)"><p>Drawer contents</p></SharedDrawer>
</section>`)
  const { code } = await compileSharedScreenBundle(file, { root })
  const errors: unknown[][] = []
  const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
  await phone.settle()
  expect(phone.ofType('Modal')).toHaveLength(3)
  expect(errors).toEqual([])
  const visible = () => phone.ofType('Modal').filter(node => node.props.visible === true)
  const { outer, inner, drawer, present } = phone.context.probe
  expect(visible()).toHaveLength(0)
  outer.set(true)
  await phone.settle()
  expect(visible()).toHaveLength(1)
  const first = visible()[0]!
  inner.set(true)
  await phone.settle()
  expect(visible()).toHaveLength(2)
  phone.press(first, 'onRequestClose')
  await phone.settle()
  expect(outer()).toBe(true)
  expect(inner()).toBe(true)
  phone.press(visible().find(node => node.id !== first.id)!, 'onRequestClose')
  await phone.settle()
  expect(inner()).toBe(false)
  expect(outer()).toBe(true)
  phone.press(first, 'onRequestClose')
  await phone.settle()
  expect(outer()).toBe(false)
  expect(visible()).toHaveLength(0)
  drawer.set(true)
  await phone.settle()
  expect(visible()).toHaveLength(1)
  phone.press(visible()[0]!, 'onRequestClose')
  await phone.settle()
  expect(drawer()).toBe(false)
  outer.set(true)
  await phone.settle()
  expect(visible()).toHaveLength(1)
  present.set(false)
  await phone.settle()
  expect(phone.context.stx.overlays.list()).toHaveLength(0)
  expect(errors).toEqual([])
}, 30_000)

it('honors dismissal reasons and diagnoses older hosts that cannot distinguish them', async () => {
  const root = createTempDir('stx-overlay-policy-')
  mkdirSync(join(root, 'components'))
  await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
  await Bun.write(join(root, 'components/SharedDialog.stx'), Bun.file(join(import.meta.dir, '../../../components/src/ui/dialog/Dialog.stx')))
  const file = join(root, 'Screen.stx')
  await Bun.write(file, `<script client>
const open = state(true)
window.openState = open
</script><div><SharedDialog :open="open" closeOnBackdrop="false" @close="open.set(false)"><p>Answer required</p></SharedDialog></div>`)
  const { code } = await compileSharedScreenBundle(file, { root })
  const warnings: unknown[][] = []
  const errors: unknown[][] = []
  const phone = mountNativeScreen(code, 'Screen', { globals: { console: {
    ...console,
    error: (...args: unknown[]) => errors.push(args),
    warn: (...args: unknown[]) => warnings.push(args),
  } } })
  await phone.settle()
  const modal = phone.ofType('Modal')[0]!
  expect(modal.props.visible).toBe(true)
  phone.press(modal, 'onRequestClose')
  await phone.settle()
  expect(phone.context.openState()).toBe(true)
  expect(warnings.some(args => String(args[0]).includes('must report reason=backdrop'))).toBe(true)
  const overlays = phone.context.stx.overlays
  const id = overlays.list()[0]
  expect(() => overlays.open(id, {
    root: null,
    onEscape: () => { throw new Error('Rejected overlay update must not replace the close handler') },
  })).toThrow('requires a Modal root')
  expect(() => overlays.open('unsupported-popup', { modal: false })).toThrow('host positioning capability')
  expect(overlays.list()).toEqual([id])
  phone.press(modal, 'onRequestClose', { reason: 'backdrop' })
  await phone.settle()
  expect(phone.context.openState()).toBe(true)
  phone.press(modal, 'onRequestClose', { reason: 'back' })
  await phone.settle()
  expect(phone.context.openState()).toBe(false)
  expect(phone.ofType('Modal')[0]!.props.visible).toBe(false)
  expect(errors).toEqual([])
}, 30_000)
