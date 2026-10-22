/**
 * The shared Button, Switch, Checkbox and Select draw the platform's own
 * controls on a native host: a filled system-blue button that dims while
 * pressed, the platform switch, the native checkbox and a picker fed with
 * items - from the same source as the web page, whose markup is unchanged.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { renderWeb } from './shared-native-web'

const ui = join(import.meta.dir, '../../../components/src/ui')
const source = `@import('Button', '${ui}/button/Button.stx')
@import('Switch', '${ui}/switch/Switch.stx')
@import('Checkbox', '${ui}/checkbox/Checkbox.stx')
@import('Select', '${ui}/select/Select.stx')
<script client>
const saves = state(0)
const busy = state(false)
const alerts = state(false)
const agreed = state(false)
const sport = state('')
const sports = state([{ value: 'run', label: 'Run' }, { value: 'ride', label: 'Ride' }])
const locked = state(false)
window.probe = { saves, busy, alerts, agreed, sport, sports, locked, changes: [] }
</script>
<section>
  <Button testID="save" :loading="busy" @click="saves.set(saves() + 1)">Save</Button>
  <Button testID="cancel" variant="secondary">Cancel</Button>
  <Button testID="delete" variant="danger" size="lg" fullWidth>Delete</Button>
  <Button testID="more" variant="ghost" size="sm">More</Button>
  <Switch testID="alerts" label="Alerts" :checked="alerts" :disabled="locked" @change="alerts.set($event); window.probe.changes.push($event)" />
  <Checkbox testID="agree" label="I agree" :checked="agreed" @change="agreed.set($event)" />
  <Select testID="sport" label="Sport" v-model:value="sport" :options="sports" />
</section>`

afterEach(unmountAllNativeScreens)

describe.each(['ios', 'android'] as const)('shared controls on %s', (platform) => {
  it.each([false, true])('draw filled system-blue buttons that press and load (minify=%s)', async (minify) => {
    const { code } = await compileNativeScreen(source, { minify })
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const save = phone.byTestID('save')!
    expect(save.type).toBe('Pressable')
    expect(save.props.activeOpacity).toBe(0.6)
    expect(save.style).toMatchObject({ height: 44, borderRadius: 10, backgroundColor: '#007aff' })
    const label = (node: typeof save) => node.children.find((child): child is typeof save => typeof child !== 'string' && child.type === 'Text' && child.style.display !== 'none')!
    expect(label(save).style).toMatchObject({ color: '#ffffff', fontSize: 17, fontWeight: '600' })
    expect(phone.byTestID('cancel')!.style.backgroundColor).toBe('#7676801f')
    expect(label(phone.byTestID('cancel')!).style.color).toBe('#007aff')
    expect(phone.byTestID('delete')!.style).toMatchObject({ height: 50, borderRadius: 12, backgroundColor: '#ff3b30', width: '100%' })
    expect(phone.byTestID('more')!.style.backgroundColor).toBeUndefined()
    expect(phone.byTestID('more')!.style.height).toBe(34)

    phone.press(save)
    await phone.settle()
    expect(phone.context.probe.saves()).toBe(1)

    const spinner = phone.ofType('ActivityIndicator').find(node => node.props.color === '#ffffff')!
    expect(spinner.style.display).toBe('none')
    phone.context.probe.busy.set(true)
    await phone.settle()
    expect(spinner.style.display).not.toBe('none')
    expect(save.props.disabled).toBe(true)
    expect(save.style.opacity).toBe(0.5)
    phone.press(save)
    await phone.settle()
    expect(phone.context.probe.saves()).toBe(1)
  })

  it('draws the platform switch and checkbox and reports their values', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const toggle = phone.byTestID('alerts')!
    expect(toggle.type).toBe('Switch')
    expect(toggle.props).toMatchObject({ value: false, accessibilityLabel: 'Alerts', accessibilityRole: 'switch' })
    expect(phone.ofType('Pressable').some(node => node.props.role === 'switch')).toBe(false)
    expect(phone.texts()).toContain('Alerts')

    phone.press(toggle, 'onValueChange', { value: true })
    await phone.settle()
    expect(phone.context.probe.alerts()).toBe(true)
    expect(phone.context.probe.changes).toEqual([true])
    expect(toggle.props.value).toBe(true)

    phone.context.probe.alerts.set(false)
    await phone.settle()
    expect(toggle.props.value).toBe(false)

    phone.context.probe.locked.set(true)
    await phone.settle()
    expect(toggle.props.disabled).toBe(true)
    expect(toggle.style.opacity).toBe(0.5)
    phone.press(toggle, 'onValueChange', { value: true })
    await phone.settle()
    expect(phone.context.probe.changes).toEqual([true])

    const box = phone.byTestID('agree')!
    expect(box.type).toBe('Checkbox')
    expect(box.style.color).toBe('#007aff')
    phone.press(box, 'onValueChange', { value: true })
    await phone.settle()
    expect(phone.context.probe.agreed()).toBe(true)
  })

  it('feeds the picker its items, live, without option children', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const picker = phone.byTestID('sport')!
    expect(picker.type).toBe('Picker')
    expect(picker.children).toEqual([])
    // Nothing chosen yet: the placeholder leads, as the web's first option does.
    expect(picker.props.items).toEqual([{ value: '', label: 'Select an option' }, { value: 'run', label: 'Run' }, { value: 'ride', label: 'Ride' }])

    phone.press(picker, 'onValueChange', { value: 'ride', index: 2 })
    await phone.settle()
    expect(phone.context.probe.sport()).toBe('ride')
    expect(picker.props.items).toEqual([{ value: 'run', label: 'Run' }, { value: 'ride', label: 'Ride' }])

    phone.context.probe.sports.set([{ value: 'ride', label: 'Ride' }, { value: 'swim', label: 'Swim' }])
    await phone.settle()
    expect(picker.props.items).toEqual([{ value: 'ride', label: 'Ride' }, { value: 'swim', label: 'Swim' }])
    expect(picker.props.value).toBe('ride')
    expect(phone.mutationErrors).toEqual([])
  })
})

describe('shared controls on the web', () => {
  it('keep their web markup', async () => {
    const html = await renderWeb(source)
    expect(html).toContain('role="switch"')
    expect(html).toContain('<select')
    expect(html).toContain('<option')
    expect(html).not.toContain('data-native="Switch"')
    expect(html).not.toContain('data-native="Picker"')
    expect(html).not.toContain('data-native="ActivityIndicator"')
    expect(html).not.toContain('#007aff')
  })
})
