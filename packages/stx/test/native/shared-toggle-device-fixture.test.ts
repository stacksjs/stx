import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('runs shared and legacy toggle acceptance (%s, minify=%s)', async (platform, minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-toggle-device.stx'), { root, minify })
  for (const [name, dir] of [['Checkbox', 'checkbox'], ['Switch', 'switch']]) {
    expect(result.dependencies).toContain(join(root, `packages/components/src/ui/${dir}/${name}.stx`))
    expect(result.dependencies).toContain(join(root, `packages/stx/src/native/primitives/${name}.stx`))
  }
  expect(result.diagnostics.filter(item => !['dropped-subtree: script', 'dropped-subtree: style'].includes(item.message))).toEqual([])
  const phone = mountNativeScreen(result.code, 'Screen', { platform })
  try {
    await phone.settle()
    const check = phone.byTestID('shared-check')!, toggle = phone.byTestID('shared-switch')!
    const legacyCheck = phone.byTestID('legacy-check')!, legacyToggle = phone.byTestID('legacy-switch')!
    const probe = phone.context.toggleProbe
    expect(check.props).toMatchObject({ checked: false, formValue: 'agreement' })
    expect(toggle.props.value).toBe(false)
    for (const control of [check, toggle, legacyCheck, legacyToggle]) phone.press(control, 'onValueChange', { value: true })
    await phone.settle()
    expect(probe.checkEvents()).toEqual([true])
    expect(probe.switchEvents()).toEqual([true])
    expect(probe.legacyEvents()).toEqual([{ kind: 'checkbox', type: 'object', value: true }, { kind: 'switch', type: 'object', value: true }])
    expect([legacyCheck.props.value, legacyToggle.props.value]).toEqual([true, true])
    phone.press(phone.byTestID('toggle-disable')!)
    phone.press(phone.byTestID('toggle-mixed')!)
    await phone.settle()
    expect(check.props).toMatchObject({ disabled: true, indeterminate: true })
    expect(toggle.props.disabled).toBe(true)
    phone.press(check, 'onValueChange', { value: false })
    phone.press(toggle, 'onValueChange', { value: false })
    await phone.settle()
    expect([probe.checked(), probe.switched()]).toEqual([true, true])
    expect([probe.checkEvents().length, probe.switchEvents().length]).toEqual([1, 1])
    phone.press(phone.byTestID('toggle-defaults')!)
    await phone.settle()
    expect(check.props).toMatchObject({ checked: false, formValue: 'agreement' })
    expect(check.props.disabled).not.toBe(true)
    expect(check.props.indeterminate).not.toBe(true)
    expect(toggle.props.disabled).not.toBe(true)
    expect(toggle.props.value).toBe(false)
    expect(phone.byTestID('shared-check')).toBe(check)
    expect(phone.byTestID('shared-switch')).toBe(toggle)
    probe.checked.set(true); probe.switched.set(true)
    await phone.settle()
    probe.checked.set(undefined); probe.switched.set(undefined)
    await phone.settle()
    expect(check.props.checked).toBe(false)
    expect(toggle.props.value).toBe(false)
    expect([probe.checkEvents().length, probe.switchEvents().length]).toEqual([1, 1])
    phone.press(phone.byTestID('toggle-shown')!)
    await phone.settle()
    expect(phone.byTestID('shared-check')).toBeUndefined()
    expect(phone.byTestID('shared-switch')).toBeUndefined()
    phone.press(check, 'onValueChange', { value: false })
    phone.press(toggle, 'onValueChange', { value: false })
    expect([probe.checkEvents().length, probe.switchEvents().length]).toEqual([1, 1])
    probe.checked.set(true); probe.switched.set(true); probe.disabled.set(true); probe.mixed.set(true)
    await phone.settle()
    phone.press(phone.byTestID('toggle-shown')!)
    await phone.settle()
    expect(phone.byTestID('shared-check')!.props).toMatchObject({ checked: true, disabled: true, indeterminate: true })
    expect(phone.byTestID('shared-switch')!.props).toMatchObject({ value: true, disabled: true })
    expect(phone.byTestID('legacy-check')).toBe(legacyCheck)
    expect(phone.byTestID('legacy-switch')).toBe(legacyToggle)
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.checked.set(false); probe.switched.set(false)
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)
