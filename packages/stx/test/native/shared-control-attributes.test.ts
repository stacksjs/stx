import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

describe.each([false, true])('shared control native attribute targets (minify=%s)', (minify) => {
  it('forwards caller props/styles to physical controls and retains component state and label fallbacks', async () => {
    const checkbox = join(import.meta.dir, '../../../components/src/ui/checkbox/Checkbox.stx')
    const toggle = join(import.meta.dir, '../../../components/src/ui/switch/Switch.stx')
    const { code } = await compileNativeScreen(`@import('Checkbox', '${checkbox}')
@import('Switch', '${toggle}')
<script client>
const suffix = state('one')
const label = state('Native name')
const styles = state({ paddingLeft: 3 })
const classes = state('w-12 opacity-30')
const checked = state(false)
const shown = state(true)
window.probe = { suffix, label, styles, classes, checked, shown }
</script><section :if="shown">
<Checkbox label="Consent" :testID="'checkbox-' + suffix" :accessibilityLabel="label"
  :style="styles" :class="classes" :checked="checked" @change="checked.set($event)" />
<Switch name="alerts" label="Alerts" :testID="'switch-' + suffix" :accessibilityLabel="label"
  :style="styles" :class="classes" :checked="checked" @change="checked.set($event)" />
</section>
<Checkbox testID="static-checkbox" accessibilityLabel="Static checkbox" />
<Switch testID="static-switch" accessibilityLabel="Static switch" />`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      for (const [prefix, type] of [['checkbox', 'Checkbox'], ['switch', 'Pressable']]) {
        const control = phone.byTestID(`${prefix}-one`)!
        expect(control.type).toBe(type)
        expect(control.props.accessibilityLabel).toBe('Native name')
        expect(control.style).toMatchObject({ paddingLeft: 3, opacity: 0.3, width: 48 })
        expect(phone.byTestID(`static-${prefix}`)!.type).toBe(type)
      }
      phone.press(phone.byTestID('checkbox-one')!, 'onValueChange', { value: true })
      await phone.settle()
      expect(phone.context.probe.checked()).toBe(true)
      expect(phone.byTestID('switch-one')!.props.accessibilityState).toMatchObject({ checked: true })
      phone.context.probe.suffix.set('two')
      phone.context.probe.label.set('Updated name')
      phone.context.probe.styles.set({ paddingLeft: 7 })
      phone.context.probe.classes.set('w-16 opacity-70')
      await phone.settle()
      for (const prefix of ['checkbox', 'switch']) {
        expect(phone.byTestID(`${prefix}-one`)).toBeUndefined()
        expect(phone.byTestID(`${prefix}-two`)!.props.accessibilityLabel).toBe('Updated name')
        expect(phone.byTestID(`${prefix}-two`)!.style).toMatchObject({ paddingLeft: 7, opacity: 0.7, width: 64 })
      }
      phone.press(phone.byTestID('switch-two')!)
      await phone.settle()
      expect(phone.context.probe.checked()).toBe(false)
      phone.context.probe.shown.set(false)
      await phone.settle()
      phone.context.probe.suffix.set('three')
      phone.context.probe.label.set(null)
      phone.context.probe.styles.set({})
      phone.context.probe.classes.set('')
      phone.context.probe.shown.set(true)
      await phone.settle()
      for (const [prefix, name] of [['checkbox', 'Consent'], ['switch', 'Alerts']]) {
        const control = phone.byTestID(`${prefix}-three`)!
        expect(control.props.accessibilityLabel).toBe(name)
        expect(control.style.paddingLeft ?? null).toBeNull()
        expect(control.style.opacity ?? null).toBeNull()
        expect(control.style.width).toBe(prefix === 'checkbox' ? 20 : 74)
      }
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const messages = phone.messages.length
      phone.context.probe.styles.set({ paddingLeft: 99 })
      await phone.settle()
      expect(phone.messages).toHaveLength(messages)
    }
    finally { phone.unmount() }
  }, 30_000)
})
