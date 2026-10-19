import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

describe.each([false, true])('native/shared control compatibility (minify=%s)', (minify) => {
  it('retains legacy value-change payloads and native state without requiring a parent writeback', async () => {
    const { code } = await compileNativeScreen(`<script client>
window.received = []
function changed(event) { window.received.push(event.value) }
</script><View><Checkbox testID="checkbox" value="false" @value-change="changed($event)" /><Switch testID="switch" value="false" @value-change="changed($event)" /></View>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      for (const name of ['checkbox', 'switch']) {
        const control = phone.byTestID(name)!
        expect(control.type).toBe(name === 'checkbox' ? 'Checkbox' : 'Switch')
        phone.press(control, 'onValueChange', { value: true })
        await phone.settle()
        expect(control.props.value).toBe(true)
      }
      expect(Array.from(phone.context.received)).toEqual([true, true])
      phone.appearance('dark')
      await phone.settle()
      expect(phone.byTestID('checkbox')!.props.value).toBe(true)
      expect(phone.byTestID('switch')!.props.value).toBe(true)
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)

  it('keeps shared change payloads boolean and checkbox form values separate from checked state', async () => {
    const checkbox = join(import.meta.dir, '../../../components/src/ui/checkbox/Checkbox.stx')
    const toggle = join(import.meta.dir, '../../../components/src/ui/switch/Switch.stx')
    const { code } = await compileNativeScreen(`@import('Checkbox', '${checkbox}')
@import('Switch', '${toggle}')
<script client>
const checked = state(false)
const enabled = state(false)
window.received = []
window.probe = { checked, enabled }
function checkboxChanged(value) { window.received.push(value); checked.set(value) }
function switchChanged(value) { window.received.push(value); enabled.set(value) }
</script><div><Checkbox value="accepted" :checked="checked" @change="checkboxChanged($event)"/><Switch :checked="enabled" @change="switchChanged($event)"/></div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const control = phone.ofType('Checkbox')[0]!
      expect(control.props.formValue).toBe('accepted')
      phone.press(control, 'onValueChange', { value: true })
      phone.press(phone.ofType('Pressable')[0]!)
      await phone.settle()
      expect(Array.from(phone.context.received)).toEqual([true, true])
      expect(phone.context.probe.checked()).toBe(true)
      expect(phone.context.probe.enabled()).toBe(true)
      phone.context.probe.checked.set(false)
      phone.context.probe.enabled.set(false)
      await phone.settle()
      expect(control.props.value).toBe(false)
      expect(control.props.formValue).toBe('accepted')
      expect(phone.ofType('Pressable')[0]!.props['aria-checked']).toBe('false')
    }
    finally { phone.unmount() }
  }, 30_000)
})
