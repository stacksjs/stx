import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

describe.each([false, true])('reactive native inline styles (minify=%s)', (minify) => {
  it('keeps hidden form inputs out of native layout through style, appearance and lifecycle updates', async () => {
    const { code } = await compileNativeScreen(`<script client>
const styles = state({ display: 'flex' })
const shown = state(true)
const value = state('first')
window.probe = { styles, shown, value }
</script><div><input :if="shown" type="hidden" testID="hidden" :value="value" :style="styles" /></div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      expect(phone.byTestID('hidden')!.style.display).toBe('none')
      phone.context.probe.styles.set('display:grid;padding:12px')
      phone.context.probe.value.set('second')
      phone.appearance('dark')
      await phone.settle()
      expect(phone.byTestID('hidden')!.style.display).toBe('none')
      expect(phone.byTestID('hidden')!.props.value).toBe('second')
      phone.context.probe.shown.set(false)
      await phone.settle()
      phone.context.probe.styles.set(null)
      phone.context.probe.shown.set(true)
      await phone.settle()
      expect(phone.byTestID('hidden')!.style.display).toBe('none')
    }
    finally { phone.unmount() }
  }, 30_000)

  it('delivers explicit grid rows through the compiled native bundle and clears changed tracks', async () => {
    const { code } = await compileNativeScreen(`<script client>
const tracks = state({ gridTemplateRows: 'repeat(2, 1fr)' })
</script><View testID="grid" style="display:grid;height:84px" :style="tracks">
  <View testID="static-grid" style={{"display":"grid","gridTemplateRows":"repeat(2, 1fr)","height":84}} />
  <Button testID="change" @click="tracks.set({gridTemplateRows:3})">Change rows</Button>
  <Button testID="clear" @click="tracks.set({})">Clear rows</Button>
</View>`, { minify })
    const phone = mountNativeScreen(code, 'Screen')
    await phone.settle()
    expect(phone.byTestID('static-grid')!.style).toMatchObject({ display: 'grid', height: 84, gridTemplateRows: 'repeat(2, 1fr)' })
    expect(phone.byTestID('grid')!.style).toMatchObject({ display: 'grid', height: 84, gridTemplateRows: 'repeat(2, 1fr)' })
    phone.press(phone.byTestID('change')!)
    await phone.settle()
    expect(phone.byTestID('grid')!.style.gridTemplateRows).toBe(3)
    phone.press(phone.byTestID('clear')!)
    await phone.settle()
    expect(phone.byTestID('grid')!.style.gridTemplateRows).toBeNull()
    phone.unmount()
  }, 30_000)

  it('normalizes CSS and objects, clears previous values, and protects hidden nodes', async () => {
    const { code } = await compileNativeScreen(`<script client>
const styles = state('padding-left:12px;font-size:1.5rem;width:50%;font-weight:700')
const visible = state(true)
window.probe = { styles, visible }
</script><div>
  <div testID="static" style="padding-left:12px;font-size:1.5rem;width:50%;font-weight:700">Static</div>
  <div testID="bound" class="p-4 bg-white dark:bg-slate-950" style="padding-left:9px" :style="styles" :show="visible">Bound</div>
</div>`, { minify })
    const warnings: string[] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, warn: (...args: unknown[]) => warnings.push(args.join(' ')) } } })
    await phone.settle()
    const style = () => phone.byTestID('bound')!.style
    expect(style()).toMatchObject(phone.byTestID('static')!.style)
    expect(style()).toMatchObject({ padding: 16, paddingLeft: 12, fontSize: 24, width: '50%', fontWeight: '700' })
    phone.context.probe.styles.set({ paddingLeft: '2rem', width: '24px', fontWeight: 600 })
    await phone.settle()
    expect(style()).toMatchObject({ paddingLeft: 32, width: 24, fontWeight: '600', fontSize: null })
    phone.context.probe.visible.set(false)
    phone.context.probe.styles.set('padding-left:6px;display:flex')
    phone.appearance('dark')
    await phone.settle()
    expect(style()).toMatchObject({ display: 'none', paddingLeft: 6, backgroundColor: '#020617' })
    expect(warnings).toEqual([])
    phone.context.probe.styles.set({ paddingLeft: 'var(--space)', width: Infinity, cursor: 'pointer', fontSize: '1.2.3px' })
    await phone.settle()
    expect(style()).toMatchObject({ display: 'none', paddingLeft: 9, padding: 16 })
    for (const name of ['paddingLeft', 'width', 'cursor', 'fontSize'])
      expect(warnings.some(w => w.includes(name) && w.includes(phone.byTestID('bound')!.id))).toBe(true)
    expect(style().width).toBeNull()
    expect(style().fontSize).toBeNull()
    expect(style().cursor).toBeUndefined()
    phone.context.probe.styles.set({ shadowOffset: { width: 0, height: 2 }, transform: [{ rotate: '45deg' }] })
    await phone.settle()
    expect(style()).toMatchObject({ shadowOffset: { width: 0, height: 2 }, transform: [{ rotate: '45deg' }] })
    phone.context.probe.styles.set(null)
    phone.context.probe.visible.set(true)
    await phone.settle()
    expect(style()).toMatchObject({ paddingLeft: 9, shadowOffset: null, transform: null })
    expect(style().display).not.toBe('none')
    phone.unmount()
  }, 30_000)
})
