import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../stx/src/native/testing'

const source = `<script client>
const value = state('2026-12-01T14:30:00Z'); const shown = state(true); const changes = []
function changed(detail) { changes.push(detail); value.set(detail.value) }
window.pickerProbe = { value, shown, changes }
</script><div :if="shown"><DateTimePicker :value="value" timeZone="America/New_York" @change="changed" /></div>`

describe.each([false, true])('shared native DateTimePicker (minify=%s)', minify => {
  it.each(['ios', 'android'] as const)('selects through Calendar and cleans up its popup (%s)', async platform => {
    const { code } = await compileNativeScreen(source, { minify })
    const errors: unknown[] = []
    const warnings: string[] = []
    let measurements = 0
    const phone = mountNativeScreen(code, 'Screen', {
      platform,
      capabilities: ['viewMeasure', 'viewNonModalPresentation'],
      globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args), warn: (message: string) => warnings.push(message) } },
      native(module, method, args) {
        expect([module, method]).toEqual(['View', 'measure'])
        measurements++
        const popup = phone.ofType('Modal').some(node => node.id === (args[0] as any).nodeId)
        return { x: popup ? 0 : 100, y: popup ? 0 : 100, width: popup ? 320 : 80, height: popup ? 500 : 40, viewportWidth: 390, viewportHeight: 844, unit: 'points', coordinateSpace: 'screenViewport' }
      },
    })
    try {
      await phone.settle()
      const trigger = phone.find(node => node.props.accessibilityLabel === 'Schedule')!
      expect(trigger).toBeDefined()
      phone.press(trigger)
      await phone.settle()
      expect(phone.ofType('Modal').some(node => node.props.visible === true && node.props.nonModal === true)).toBe(true)
      expect(phone.ofType('Modal')[0].style).toMatchObject({ left: 8, top: 148 })
      const day = phone.find(node => node.props.accessibilityLabel === '12/2/2026')!
      expect(day).toBeDefined()
      phone.press(day)
      await phone.settle()
      expect(phone.context.pickerProbe.changes.length).toBe(0)
      const apply = phone.find(node => node.props['data-date-time-apply'] !== undefined)!
      phone.press(apply)
      await phone.settle()
      expect(phone.context.pickerProbe.value()).toBe('2026-12-02T14:30:00.000Z')
      expect(phone.context.pickerProbe.changes.length).toBe(1)
      expect(phone.context.stx.overlays.list()).toEqual([])
      phone.press(trigger)
      phone.context.pickerProbe.shown.set(false)
      await phone.settle()
      const count = measurements
      await Bun.sleep(300)
      expect(measurements).toBe(count)
      expect(phone.context.stx.overlays.list()).toEqual([])
      expect(phone.mutationErrors).toEqual([])
      expect(errors).toEqual([])
      expect(warnings.filter(message => /\[stx:(popup|date-time-picker)\]/.test(message))).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)
})

it('fails closed on hosts missing popup capabilities', async () => {
  const { code } = await compileNativeScreen(source)
  const warnings: string[] = []
  const errors: unknown[] = []
  const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, warn: (message: string) => warnings.push(message), error: (...args: unknown[]) => errors.push(args) } } })
  try {
    await phone.settle()
    phone.press(phone.find(node => node.props.accessibilityLabel === 'Schedule')!)
    await phone.settle()
    expect(warnings.some(message => message.includes('viewMeasure and viewNonModalPresentation'))).toBe(true)
    expect(phone.context.stx.overlays.list()).toEqual([])
    expect(phone.ofType('Modal').every(node => node.props.visible !== true)).toBe(true)
    expect(errors).toEqual([])
  }
  finally { phone.unmount() }
})
