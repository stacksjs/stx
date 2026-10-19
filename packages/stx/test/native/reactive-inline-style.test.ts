import { describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

describe.each([false, true])('reactive native inline styles (minify=%s)', (minify) => {
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
