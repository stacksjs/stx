import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const ui = join(import.meta.dir, '../../../components/src/ui')
const imports = `@import('Tooltip', '${ui}/tooltip/Tooltip.stx')
@import('Popover', '${ui}/popover/Popover.stx')
@import('PopoverButton', '${ui}/popover/PopoverButton.stx')
@import('PopoverPanel', '${ui}/popover/PopoverPanel.stx')`

it.each([false, true])('shared Tooltip presents, repositions, disables and tears down without reparenting (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`${imports}
<script client>
const disabled = state(false)
const present = state(true)
const taps = state(0)
window.probe = { disabled, present, taps }
</script><div :if="present"><Tooltip content="Helpful hint" :disabled="disabled"><button testID="help" @click="taps.set(taps() + 1)">Help</button></Tooltip></div>`, { minify })
  let anchorX = 100
  let measurements = 0
  const errors: unknown[] = []
  const warnings: string[] = []
  const phone = mountNativeScreen(code, 'Screen', {
    capabilities: ['viewMeasure', 'viewNonModalPresentation'],
    globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args), warn: (message: string) => warnings.push(message) } },
    native(module, method, args) {
      expect([module, method]).toEqual(['View', 'measure'])
      measurements++
      const popup = phone.ofType('Modal').some(node => node.id === (args[0] as any).nodeId)
      return { x: popup ? 0 : anchorX, y: popup ? 0 : 200, width: popup ? 100 : 30, height: popup ? 40 : 30, viewportWidth: 390, viewportHeight: 844, unit: 'points', coordinateSpace: 'screenViewport' }
    },
  })
  try {
    await phone.settle()
    const panel = phone.ofType('Modal')[0]!
    const trigger = phone.ofType('Pressable')[0]!
    expect(panel.props.visible).toBe(false)
    expect(measurements).toBe(0)
    phone.press(phone.byTestID('help')!)
    await phone.settle()
    expect(phone.context.probe.taps()).toBe(1)
    expect(panel.props).toMatchObject({ visible: true, nonModal: true, dismissOnOutsideTap: true })
    expect(panel.style).toMatchObject({ left: 65, top: 152, transform: [] })
    const id = panel.id
    anchorX = 200
    await Bun.sleep(300)
    await phone.settle()
    expect(panel.style.left).toBe(165)
    phone.press(panel, 'onRequestClose', { reason: 'backdrop' })
    await phone.settle()
    expect(panel.props.visible).toBe(false)
    phone.press(trigger)
    await phone.settle()
    expect(phone.ofType('Modal')[0]!.id).toBe(id)
    expect(panel.props.visible).toBe(true)
    phone.context.probe.disabled.set(true)
    await phone.settle()
    expect(panel.props.visible).toBe(false)
    expect(phone.context.stx.overlays.list()).toEqual([])
    phone.context.probe.disabled.set(false)
    await phone.settle()
    expect(panel.props.visible).toBe(true)
    phone.context.probe.present.set(false)
    await phone.settle()
    const before = measurements
    await Bun.sleep(300)
    expect(measurements).toBe(before)
    expect(phone.context.stx.overlays.list()).toEqual([])
    expect(phone.mutationErrors).toEqual([])
    expect(errors).toEqual([])
    expect(warnings.filter(message => /\[stx:(popup|tooltip)\]/.test(message))).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)

it('unsupported hosts reject shared popups with actionable feedback and no partial layer', async () => {
  const { code } = await compileNativeScreen(`${imports}
<Tooltip content="Hint" show><span>Help</span></Tooltip>
<Popover><PopoverButton>More</PopoverButton><PopoverPanel>Content</PopoverPanel></Popover>`)
  for (const capabilities of [[], ['viewMeasure']]) {
    const warnings: string[] = []
    const phone = mountNativeScreen(code, 'Screen', {
      capabilities,
      globals: { console: { ...console, warn: (message: string) => warnings.push(message) } },
    })
    try {
      await phone.settle()
      phone.press(phone.ofType('Button')[0]!)
      await phone.settle()
      const expected = capabilities.length ? 'viewNonModalPresentation' : 'viewMeasure'
      expect(warnings.filter(message => message.includes(expected))).toHaveLength(2)
      expect(phone.context.stx.overlays.list()).toEqual([])
      expect(phone.ofType('Modal').every(node => node.props.visible === false)).toBe(true)
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }
}, 30_000)

it('nested shared popovers dismiss only the top panel and keep each anchor independent', async () => {
  const { code } = await compileNativeScreen(`${imports}
<Popover><PopoverButton>Outer</PopoverButton><PopoverPanel>
  <Popover><PopoverButton>Inner</PopoverButton><PopoverPanel>Inner content</PopoverPanel></Popover>
</PopoverPanel></Popover>`)
  const phone = mountNativeScreen(code, 'Screen', {
    capabilities: ['viewMeasure', 'viewNonModalPresentation'],
    native() { return { x: 100, y: 200, width: 80, height: 40, viewportWidth: 390, viewportHeight: 844, unit: 'points', coordinateSpace: 'screenViewport' } },
  })
  try {
    await phone.settle()
    const [outer, inner] = phone.ofType('Button')
    phone.press(outer!)
    await phone.settle()
    const outerPanel = phone.ofType('Modal').find(node => node.props.visible)!
    phone.press(inner!)
    await phone.settle()
    expect(phone.context.stx.overlays.list()).toHaveLength(2)
    const innerPanel = phone.ofType('Modal').find(node => node.id !== outerPanel.id)!
    phone.press(outerPanel, 'onRequestClose', { reason: 'backdrop' })
    await phone.settle()
    expect(phone.context.stx.overlays.list()).toHaveLength(2)
    phone.press(innerPanel, 'onRequestClose', { reason: 'backdrop' })
    await phone.settle()
    expect(innerPanel.props.visible).toBe(false)
    expect(outerPanel.props.visible).toBe(true)
    expect(phone.context.stx.overlays.list()).toHaveLength(1)
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)

it.each([false, true])('shared Popover uses its physical panel and preserves interactive contents (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`${imports}
<script client>
const count = state(0)
const present = state(true)
const disabled = state(true)
window.probe = { count, present, disabled }
</script><div :if="present"><Popover>
<PopoverButton :disabled="disabled">More</PopoverButton>
<PopoverPanel><button testID="inside" @click="count.set(count() + 1)">Increment</button></PopoverPanel>
</Popover></div>`, { minify })
  const errors: unknown[] = []
  const phone = mountNativeScreen(code, 'Screen', {
    capabilities: ['viewMeasure', 'viewNonModalPresentation'],
    globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args), warn() {} } },
    native(module, method, args) {
      expect([module, method]).toEqual(['View', 'measure'])
      const popup = phone.ofType('Modal').some(node => node.id === (args[0] as any).nodeId)
      return { x: 100, y: 200, width: popup ? 100 : 30, height: popup ? 40 : 30, viewportWidth: 390, viewportHeight: 844, unit: 'dp', coordinateSpace: 'screenViewport' }
    },
  })
  try {
    await phone.settle()
    const panel = phone.ofType('Modal')[0]!
    expect(panel.props.visible).toBe(false)
    const trigger = phone.ofType('Button').find(node => node.id !== phone.byTestID('inside')!.id)!
    phone.press(trigger)
    await phone.settle()
    expect(panel.props.visible).toBe(false)
    phone.context.probe.disabled.set(false)
    await phone.settle()
    phone.press(trigger)
    await phone.settle()
    expect(panel.props).toMatchObject({ visible: true, nonModal: true, dismissOnOutsideTap: true })
    expect(panel.style).toMatchObject({ left: 65, top: 238 })
    const inside = phone.byTestID('inside')!
    phone.press(inside)
    await phone.settle()
    expect(phone.context.probe.count()).toBe(1)
    phone.press(panel, 'onRequestClose', { reason: 'back' })
    await phone.settle()
    expect(panel.props.visible).toBe(false)
    phone.press(trigger)
    await phone.settle()
    expect(panel.props.visible).toBe(true)
    expect(phone.byTestID('inside')!.id).toBe(inside.id)
    phone.context.probe.present.set(false)
    await phone.settle()
    expect(phone.context.stx.overlays.list()).toEqual([])
    expect(phone.mutationErrors).toEqual([])
    expect(errors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
