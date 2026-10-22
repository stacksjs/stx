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

  it('keeps a switch where the user put it until the screen says otherwise', async () => {
    // The pattern HQ's settings use: the switch shows the attempt while the
    // save is pending, and a refusal puts the saved settings back.
    const { code } = await compileNativeScreen(`<script client>
const accepted = state(false)
const settings = state({ on: false })
let refuse = () => {}
window.probe = { accepted, settings, decline: () => refuse() }
function save(value) { refuse = () => settings.set({ ...settings() }) }
</script><View><Switch testID="accepted" :value="accepted()" @change="accepted.set($event.value)" /><Switch testID="pending" :value="settings().on" @change="save($event.value)" /></View>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const accepting = phone.byTestID('accepted')!
      const before = phone.operations().length
      phone.press(accepting, 'onValueChange', { value: true })
      await phone.settle()
      expect(accepting.props.value).toBe(true)
      expect(phone.context.probe.accepted()).toBe(true)
      // Taken as given: nothing puts it back first.
      const writes = phone.operations().slice(before).filter((op: any) => op.id === accepting.id && op.patch?.props && 'value' in op.patch.props)
      expect(writes.map((op: any) => op.patch.props.value)).not.toContain(false)

      const pending = phone.byTestID('pending')!
      phone.press(pending, 'onValueChange', { value: true })
      await phone.settle()
      // Still saving: the switch shows what the user chose.
      expect(pending.props.value).toBe(true)
      // Refused: the saved settings are set again, and the switch follows them.
      phone.context.probe.decline()
      await phone.settle()
      expect(pending.props.value).toBe(false)
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
      // The shared Switch is the platform switch natively and reports its value.
      phone.press(phone.ofType('Switch')[0]!, 'onValueChange', { value: true })
      await phone.settle()
      expect(Array.from(phone.context.received)).toEqual([true, true])
      expect(phone.context.probe.checked()).toBe(true)
      expect(phone.context.probe.enabled()).toBe(true)
      phone.context.probe.checked.set(false)
      phone.context.probe.enabled.set(false)
      await phone.settle()
      expect(control.props.value).toBe(false)
      expect(control.props.formValue).toBe('accepted')
      expect(phone.ofType('Switch')[0]!.props['aria-checked']).toBe('false')
      expect(phone.ofType('Switch')[0]!.props.value).toBe(false)
    }
    finally { phone.unmount() }
  }, 30_000)
})
