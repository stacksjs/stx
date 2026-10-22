/**
 * The shared text fields draw the platform's field on a native host: 48pt,
 * filled, the system placeholder grey, and the keyboard, autofill hint and
 * secure entry their HTML type implies (text-entry.ts) - on both hosts, from
 * the same source as the web page, whose markup is unchanged.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { renderWeb } from './shared-native-web'

const ui = join(import.meta.dir, '../../../components/src/ui/input')
const source = `@import('EmailInput', '${ui}/EmailInput.stx')
@import('PasswordInput', '${ui}/PasswordInput.stx')
@import('TextInput', '${ui}/TextInput.stx')
<script client>
const email = state('')
const name = state('Ada')
const invalid = state(false)
const off = state(false)
window.probe = { email, name, invalid, off, typed: [] }
</script>
<section>
  <EmailInput testID="email" label="Email" v-model:value="email" />
  <PasswordInput testID="password" label="Password" />
  <TextInput testID="name" placeholder="Name" v-model:value="name" :error="invalid" :disabled="off" enterKeyHint="next" @input="window.probe.typed.push($event)" />
  <TextInput testID="phone" type="tel" />
  <TextInput testID="code" inputMode="numeric" autocomplete="one-time-code" />
</section>`

afterEach(unmountAllNativeScreens)

describe.each(['ios', 'android'] as const)('shared text fields on %s', (platform) => {
  it.each([false, true])('draw the platform field with its keyboard and autofill (minify=%s)', async (minify) => {
    const { code } = await compileNativeScreen(source, { minify })
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()

    const email = phone.byTestID('email')!
    expect(email.type).toBe('TextInput')
    expect(email.props).toMatchObject({ keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false, autoComplete: 'email', placeholderTextColor: '#8e8e93' })
    expect(email.style).toMatchObject({ height: 48, fontSize: 17, borderRadius: 10, backgroundColor: '#7676801f' })
    // The web's envelope glyph is a web flourish: no drawing beside the field.
    expect(phone.ofType('Svg')).toHaveLength(0)
    expect(phone.texts()).toContain('Email')

    expect(phone.byTestID('phone')!.props.keyboardType).toBe('phone-pad')
    expect(phone.byTestID('code')!.props).toMatchObject({ keyboardType: 'number-pad', autoComplete: 'one-time-code' })
    expect(phone.byTestID('name')!.props).toMatchObject({ returnKeyType: 'next', value: 'Ada' })
    expect(phone.byTestID('name')!.props.keyboardType).toBeUndefined()

    phone.type(email, 'ada@example.com')
    await phone.settle()
    expect(phone.context.probe.email()).toBe('ada@example.com')
  }, 30_000)

  it('turns secure entry off and on with the reveal button', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const field = () => phone.byTestID('password')!
    expect(field().props).toMatchObject({ secureTextEntry: true, autoComplete: 'current-password', autoCapitalize: 'none', autoCorrect: false })
    const reveal = phone.find(node => node.props.accessibilityLabel === 'Show password')!
    expect(phone.ofType('Icon').map(icon => icon.props.symbol)).toEqual(expect.arrayContaining(['eye', 'eye.slash']))

    phone.press(reveal)
    await phone.settle()
    expect(field().props.secureTextEntry).toBe(false)
    expect(reveal.props.accessibilityLabel).toBe('Hide password')

    phone.press(reveal)
    await phone.settle()
    expect(field().props.secureTextEntry).toBe(true)
  }, 30_000)

  it('outlines an invalid field in system red and stops editing a disabled one', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const field = () => phone.byTestID('name')!
    expect(field().style.borderWidth).toBe(0)

    phone.context.probe.invalid.set(true)
    await phone.settle()
    expect(field().style).toMatchObject({ borderWidth: 1, borderColor: '#ff3b30' })

    phone.context.probe.off.set(true)
    await phone.settle()
    expect(field().props).toMatchObject({ disabled: true, editable: false })
    expect(field().style.opacity).toBe(0.5)
    phone.type(field(), 'Blocked')
    await phone.settle()
    expect(phone.context.probe.name()).toBe('Ada')

    phone.context.probe.off.set(false)
    await phone.settle()
    expect(field().props.editable).toBe(true)
    phone.type(field(), 'Grace')
    await phone.settle()
    expect(phone.context.probe.typed).toEqual(['Grace'])
  }, 30_000)
})

describe('shared text fields on the web', () => {
  it('keep their web markup', async () => {
    const html = await renderWeb(source)
    expect(html).toContain('type="email"')
    expect(html).toContain('ring-1')
    expect(html).not.toContain('placeholderTextColor')
    expect(html).not.toContain('i-lucide-circle-x')
  }, 30_000)
})
