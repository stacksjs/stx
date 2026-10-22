import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

it.each([false, true])('executes the device overlay fixture from shared component sources (minify=%s)', async (minify) => {
  const root = join(import.meta.dir, '../../../..')
  const compiled = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-overlays-device.stx'), { root, minify })
  for (const name of ['Tooltip', 'Popover', 'PopoverButton', 'PopoverPanel', 'Dialog', 'DialogPanel', 'Drawer', 'TabList', 'Tab', 'Button'])
    expect(compiled.dependencies.some(file => file.endsWith(`/${name}.stx`) && file.includes('/components/src/ui/'))).toBe(true)
  const phone = mountNativeScreen(compiled.code, 'Screen', {
    capabilities: ['viewMeasure', 'viewNonModalPresentation', 'viewFocus'],
    native(_module, method) {
      return method === 'measure'
        ? { x: 16, y: 100, width: 220, height: 100, viewportWidth: 390, viewportHeight: 844, coordinateSpace: 'screenViewport', unit: 'points' }
        : true
    },
  })
  try {
    await phone.settle()
    phone.press(phone.byTestID('popup-trigger')!)
    await phone.settle()
    const popup = phone.byTestID('popup-panel')!
    expect(popup.props).toMatchObject({ visible: true, nonModal: true })
    phone.press(phone.byTestID('popup-action')!)
    await phone.settle()
    expect(phone.texts()).toContain('Clicks: 1')
    phone.press(popup, 'onRequestClose', { reason: 'backdrop' })
    await phone.settle()
    expect(popup.props.visible).toBe(false)
    phone.press(phone.byTestID('tooltip-trigger')!)
    await phone.settle()
    expect(phone.texts()).toContain('Help taps: 1')
    expect(phone.context.stx.overlays.list()).toHaveLength(1)
    const tooltip = phone.ofType('Modal').find(node => node.props.visible)!
    phone.press(tooltip, 'onRequestClose', { reason: 'backdrop' })
    await phone.settle()
    expect(phone.context.stx.overlays.list()).toEqual([])
    phone.press(phone.byTestID('open-dialog')!)
    await phone.settle()
    phone.press(phone.byTestID('open-inner')!)
    await phone.settle()
    expect(phone.context.stx.overlays.list()).toHaveLength(2)
    const visible = () => phone.ofType('Modal').filter(node => node.props.visible)
    phone.press(visible().at(-1)!, 'onRequestClose', { reason: 'backdrop' })
    await phone.settle()
    expect(phone.context.stx.overlays.list()).toHaveLength(1)
    phone.press(visible()[0]!, 'onRequestClose', { reason: 'backdrop' })
    await phone.settle()
    phone.press(phone.byTestID('tab-second')!)
    await phone.settle()
    expect(phone.texts()).toContain('Selected: second')
    phone.press(phone.byTestID('open-drawer')!)
    await phone.settle()
    expect(phone.context.stx.overlays.list()).toHaveLength(1)
    phone.press(phone.byTestID('close-drawer')!)
    await phone.settle()
    expect(phone.context.stx.overlays.list()).toEqual([])
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
