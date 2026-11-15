/**
 * The shared controls on Craft's AppKit host.
 *
 * A Mac draws its own controls: a button is an NSButton, not the phone's
 * filled pressable, and what the caller binds (`:title`, `:disabled`,
 * `:symbol`) has to reach it. The shared Button resolved to the phone look on
 * every native host, read `title` once on the server, and so drew a tall
 * blue button with no words for `<Button :title="...">` on a Mac. The phone
 * keeps the look it had.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import type { NativeNode } from '../../src/native/testing'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

const ui = join(import.meta.dir, '../../../components/src/ui')
/** What Craft's AppKit host advertises (CraftMacRuntime.capabilities). */
const MAC = ['desktop', 'fetch', 'eventStream', 'storage', 'secureStorage', 'clipboard', 'dialog', 'linking', 'haptics', 'notifications']

afterEach(unmountAllNativeScreens)

async function mount(source: string, platform: 'macos' | 'ios' | 'android' = 'macos') {
  const { code } = await compileNativeScreen(source)
  const screen = mountNativeScreen(code, 'Screen', platform === 'macos' ? { platform, capabilities: MAC } : { platform, capabilities: ['nativePlatformControls'] })
  await screen.settle()
  return screen
}

const words = (node: NativeNode): string => node.children.map(child => typeof child === 'string' ? child : words(child)).join('')

describe('the shared Button on the AppKit host', () => {
  const source = `<script client>
const busy = state(false)
const creating = state(false)
const off = state(false)
const glyph = state('plus')
const clicks = state(0)
window.probe = { busy, creating, off, glyph, clicks }
</script>
<View>
  <Button testID="signin" :title="busy() ? 'One moment' : creating() ? 'Create Account' : 'Sign In'" variant="primary" :disabled="off()" @click="clicks.set(clicks() + 1)" />
  <Button testID="new" title="New List" symbol="plus" variant="ghost" class="text-[13px]" style="color: secondaryLabel" />
  <Button testID="switch" variant="ghost" :title="creating() ? 'I already have an account' : 'Create an account'" />
  <Button testID="plain" title="Sign Out" />
  <Button testID="delete" appearance="mac" variant="danger">Delete</Button>
  <Button testID="save" appearance="mac" :label="busy() ? 'Saving' : 'Save'" :loading="busy()" />
  <Button testID="add" :symbol="glyph()" iconOnly title="Add" variant="ghost" />
  <Button testID="outline" variant="outline" title="More" />
</View>`

  it('is the host push button with a reactive title, disabled state and symbol', async () => {
    const mac = await mount(source)
    const signIn = mac.byTestID('signin')!
    expect(signIn.type).toBe('Button')
    expect(signIn.props).toMatchObject({ title: 'Sign In', variant: 'primary', disabled: false })
    // Nothing of the phone's filled button: the host sizes and fills its own.
    expect(signIn.style.minHeight).toBeUndefined()
    expect(signIn.style.backgroundColor).toBeUndefined()
    expect(signIn.children).toEqual([])
    expect(mac.ofType('Pressable')).toEqual([])

    mac.press(signIn)
    await mac.settle()
    expect(mac.context.probe.clicks()).toBe(1)

    mac.context.probe.creating.set(true)
    await mac.settle()
    expect(signIn.props.title).toBe('Create Account')
    // A ghost button whose only words are a bound title used to draw nothing at all.
    expect(mac.byTestID('switch')!.props).toMatchObject({ title: 'I already have an account', variant: 'ghost' })

    mac.context.probe.busy.set(true)
    mac.context.probe.off.set(true)
    await mac.settle()
    expect(signIn.props).toMatchObject({ title: 'One moment', disabled: true })
    mac.press(signIn)
    await mac.settle()
    expect(mac.context.probe.clicks()).toBe(1)
    // Loading has no spinner in an NSButton: the button stands down.
    expect(mac.byTestID('save')!.props).toMatchObject({ title: 'Saving', disabled: true })
  })

  it('carries its symbol, the caller font size and colour, and asks the host only for a look that was written', async () => {
    const mac = await mount(source)
    const create = mac.byTestID('new')!
    expect(create.type).toBe('Button')
    expect(create.props).toMatchObject({ title: 'New List', symbol: 'plus', variant: 'ghost' })
    expect(create.style).toMatchObject({ fontSize: 13, color: 'secondaryLabel' })

    // No variant written is the plain push button, as most buttons on a Mac are.
    expect(mac.byTestID('plain')!.props.variant).toBeUndefined()
    expect(mac.byTestID('plain')!.props.title).toBe('Sign Out')
    // A look the host has no name for is the plain push button too.
    expect(mac.byTestID('outline')!.props.variant).toBeUndefined()
    // Words in the slot are the button's text; `danger` is the host's destructive button.
    const remove = mac.byTestID('delete')!
    expect(remove.props.variant).toBe('danger')
    expect(remove.props.title ?? null).toBeNull()
    expect(words(remove)).toBe('Delete')

    const add = mac.byTestID('add')!
    expect(add.props).toMatchObject({ symbol: 'plus', iconOnly: true, title: 'Add' })
    mac.context.probe.glyph.set('minus')
    await mac.settle()
    expect(add.props.symbol).toBe('minus')
  })

  it.each(['ios', 'android'] as const)('keeps the phone look on %s, with the caller attributes on it', async (platform) => {
    const phone = await mount(source, platform)
    expect(phone.ofType('Button')).toEqual([])
    const signIn = phone.byTestID('signin')!
    expect(signIn.type).toBe('Pressable')
    expect(signIn.style).toMatchObject({ minHeight: 44, borderRadius: 10 })
    expect(phone.texts()).toEqual(expect.arrayContaining(['Sign In', 'New List', 'Create an account', 'Sign Out', 'Delete', 'Save']))
    expect(phone.byTestID('new')!.style.marginTop).toBeUndefined()
    phone.context.probe.creating.set(true)
    await phone.settle()
    expect(phone.texts()).toEqual(expect.arrayContaining(['Create Account', 'I already have an account']))
    phone.press(signIn)
    await phone.settle()
    expect(phone.context.probe.clicks()).toBe(1)
  })

  it.each(['macos', 'ios'] as const)('delivers what the caller binds to the button the host keeps on %s', async (platform) => {
    const screen = await mount(`<script client>
const tone = state('red')
window.probe = { tone }
</script>
<View><Button title="A" class="mt-2" accessibilityHint="hint" :style="{ opacity: tone() === 'red' ? 1 : 0.5 }" :testID="'button-' + tone()" /></View>`, platform)
    const button = screen.byTestID('button-red')!
    expect(button.type).toBe(platform === 'macos' ? 'Button' : 'Pressable')
    expect(button.props.accessibilityHint).toBe('hint')
    expect(button.style).toMatchObject({ marginTop: 8, opacity: 1 })
    screen.context.probe.tone.set('blue')
    await screen.settle()
    expect(screen.byTestID('button-blue')).toBe(button)
    expect(button.style.opacity).toBe(0.5)
  })
})

describe('the other shared controls on the AppKit host', () => {
  const source = `@import('Switch', '${ui}/switch/Switch.stx')
@import('Select', '${ui}/select/Select.stx')
@import('SegmentedControl', '${ui}/segmented-control/SegmentedControl.stx')
@import('Checkbox', '${ui}/checkbox/Checkbox.stx')
@import('TextInput', '${ui}/input/TextInput.stx')
@import('PasswordInput', '${ui}/input/PasswordInput.stx')
<script client>
const on = state(true)
const agreed = state(false)
const size = state('medium')
const sizes = state(['small', 'medium'])
const view = state('list')
const name = state('Ada')
const secret = state('')
const hint = state('Name')
const off = state(false)
window.probe = { on, agreed, size, sizes, view, name, secret, hint, off }
</script>
<View>
  <Switch testID="switch" variant="mac" v-model:checked="on" :disabled="off()" />
  <Checkbox variant="mac" :checked="agreed()" @change="agreed.set($event)" label="Agree" :disabled="off()" />
  <Select variant="mac" v-model:value="size" placeholder="" :options="sizes()" :disabled="off()" />
  <SegmentedControl testID="view" variant="mac" v-model:value="view" :options="[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]" />
  <TextInput variant="mac" v-model:value="name" :placeholder="hint()" :disabled="off()" />
  <PasswordInput variant="mac" v-model:value="secret" />
</View>`

  it('are the host controls, each following its bindings', async () => {
    const mac = await mount(source)
    const probe = mac.context.probe

    // NSSwitch.
    const toggle = mac.byTestID('switch')!
    expect(toggle.type).toBe('Switch')
    expect(toggle.props).toMatchObject({ value: true, disabled: false })
    mac.press(toggle, 'onValueChange', { value: false })
    await mac.settle()
    expect(probe.on()).toBe(false)
    expect(toggle.props.value).toBe(false)

    // The platform checkbox beside its label at 13pt, in a row.
    const box = mac.ofType('Checkbox')[0]!
    expect(box.props).toMatchObject({ checked: false, disabled: false })
    expect(mac.find(node => node.type === 'Text' && words(node) === 'Agree')).toBeDefined()
    expect(mac.find(node => node.style.fontSize === 13 && words(node) === 'Agree')).toBeDefined()
    mac.press(box, 'onValueChange', { value: true })
    await mac.settle()
    expect(probe.agreed()).toBe(true)
    expect(box.props.checked).toBe(true)

    // NSPopUpButton reads its choices as `options`; the phone hosts read `items`.
    const picker = mac.ofType('Picker')[0]!
    const choices = [{ value: 'small', label: 'small' }, { value: 'medium', label: 'medium' }]
    expect(picker.props.options).toEqual(choices)
    expect(picker.props.items).toEqual(choices)
    expect(picker.props.value).toBe('medium')
    // As wide as its longest choice, not the row.
    expect(picker.style.width).toBeUndefined()
    probe.sizes.set(['small', 'medium', 'large'])
    await mac.settle()
    expect(picker.props.options).toHaveLength(3)
    mac.press(picker, 'onValueChange', { value: 'large' })
    await mac.settle()
    expect(probe.size()).toBe('large')

    // The host has no segmented control of its own: the segments are drawn, 24pt tall.
    expect(mac.ofType('SegmentedControl')).toEqual([])
    const segments = [mac.byTestID('view-list')!, mac.byTestID('view-grid')!]
    expect(segments.map(segment => segment.type)).toEqual(['Pressable', 'Pressable'])
    expect(segments[0]!.style).toMatchObject({ minHeight: 24, backgroundColor: '#ffffff' })
    mac.press(segments[1]!)
    await mac.settle()
    expect(probe.view()).toBe('grid')
    expect(segments[1]!.style.backgroundColor).toBe('#ffffff')

    // NSTextField at AppKit's size, with nothing of the phone's filled field.
    const [field, secure] = mac.ofType('TextInput')
    expect(field!.props).toMatchObject({ value: 'Ada', placeholder: 'Name', disabled: false })
    expect(field!.style).toMatchObject({ height: 22, fontSize: 13 })
    expect(field!.style).toMatchObject({ backgroundColor: '#00000000', minHeight: 0, borderRadius: 0, paddingHorizontal: 0 })
    mac.type(field!, 'Grace')
    await mac.settle()
    expect(probe.name()).toBe('Grace')
    probe.hint.set('Full name')
    await mac.settle()
    expect(field!.props.placeholder).toBe('Full name')

    // 170pt at the end of a row, not the row's width.
    const around = (node: NativeNode): NativeNode => mac.find(parent => parent.children.includes(node))!
    expect(around(around(field!)).style.width).toBe(170)

    // NSSecureTextField, with no reveal button over it.
    expect(secure!.props).toMatchObject({ type: 'password', secureTextEntry: true })
    expect(secure!.style).toMatchObject({ height: 22, fontSize: 13 })
    expect(mac.ofType('Icon')).toEqual([])
    mac.type(secure!, 'hunter2')
    await mac.settle()
    expect(probe.secret()).toBe('hunter2')

    probe.off.set(true)
    await mac.settle()
    expect(toggle.props.disabled).toBe(true)
    expect(box.props.disabled).toBe(true)
    expect(picker.props.disabled).toBe(true)
    expect(field!.props.disabled).toBe(true)
  })

  it('keep the phone looks on a phone', async () => {
    const phone = await mount(source, 'ios')
    const [field, secure] = phone.ofType('TextInput')
    expect(field!.style).toMatchObject({ minHeight: 48, fontSize: 17 })
    expect(secure!.style.minHeight).toBe(48)
    // The reveal button stays where the host can turn a secure field back into a plain one.
    expect(phone.ofType('Icon').map(icon => icon.props.symbol).sort()).toEqual(['eye', 'eye.slash'])
    expect(phone.ofType('SegmentedControl')).toHaveLength(1)
    expect(phone.ofType('Picker')[0]!.props.items).toHaveLength(2)
  })
})
