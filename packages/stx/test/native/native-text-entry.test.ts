/**
 * HTML's text-field attributes reach a native host as the props it reads
 * (text-entry.ts): a web view's own <input type="email"> brings the email
 * keyboard on a phone, and a bound `:type` turns secure entry on and off.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { projectTextEntry, textEntryChanges } from '../../src/native/text-entry'

afterEach(unmountAllNativeScreens)

describe('projectTextEntry', () => {
  it('derives the keyboard, secure entry and return key from HTML', () => {
    expect(projectTextEntry('TextInput', { type: 'email' })).toEqual({ keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false, autoComplete: 'email' })
    expect(projectTextEntry('TextInput', { type: 'password' })).toEqual({ secureTextEntry: true, autoCapitalize: 'none', autoCorrect: false })
    expect(projectTextEntry('TextInput', { type: 'number' })).toEqual({ keyboardType: 'decimal-pad' })
    expect(projectTextEntry('TextInput', { type: 'search' })).toEqual({ keyboardType: 'web-search', returnKeyType: 'search' })
    expect(projectTextEntry('TextInput', { type: 'text', inputmode: 'numeric', enterkeyhint: 'send' })).toEqual({ keyboardType: 'number-pad', returnKeyType: 'send' })
    expect(projectTextEntry('TextInput', { type: 'text' })).toEqual({})
  })

  it('reads HTML spellings of capitalisation and correction, and disabled/readonly as not editable', () => {
    expect(projectTextEntry('TextInput', { autoCapitalize: 'off', spellcheck: 'false' })).toEqual({ autoCapitalize: 'none', autoCorrect: false })
    expect(projectTextEntry('TextInput', { autoCapitalize: 'words', autoCorrect: 'on' })).toEqual({ autoCorrect: true })
    expect(projectTextEntry('TextInput', { readonly: '' })).toEqual({ editable: false })
    expect(projectTextEntry('TextInput', { disabled: true })).toEqual({ editable: false })
    expect(projectTextEntry('TextInput', { disabled: false })).toEqual({})
  })

  it('leaves an authored native prop alone and touches no other node type', () => {
    expect(projectTextEntry('TextInput', { type: 'email', keyboardType: 'default', autoComplete: 'username' })).toEqual({ autoCapitalize: 'none', autoCorrect: false })
    expect(projectTextEntry('View', { type: 'email' })).toEqual({})
  })

  it('reports what a change removes, so the host clears it', () => {
    const before = projectTextEntry('TextInput', { type: 'password' })
    expect(textEntryChanges('TextInput', { type: 'text' }, before)).toEqual({ secureTextEntry: false, autoCapitalize: null, autoCorrect: null })
    expect(textEntryChanges('TextInput', { disabled: false }, projectTextEntry('TextInput', { disabled: true }))).toEqual({ editable: true })
  })
})

describe.each(['ios', 'android'] as const)('a web view\'s own fields on %s', (platform) => {
  it.each([false, true])('reach the host as native text-field props (minify=%s)', async (minify) => {
    const { code } = await compileNativeScreen(`<script client>
const reveal = state(false)
const locked = state(false)
window.probe = { reveal, locked }
</script>
<form>
  <input testID="email" type="email" name="email" autocomplete="username" />
  <input testID="secret" :type="reveal() ? 'text' : 'password'" autocomplete="new-password" :disabled="locked()" />
  <input testID="pin" inputmode="numeric" enterkeyhint="done" keyboardType="phone-pad" />
</form>`, { minify })
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    expect(phone.byTestID('email')!.props).toMatchObject({ keyboardType: 'email-address', autoComplete: 'username', autoCapitalize: 'none', autoCorrect: false })
    // An authored native prop wins over the one inputmode implies.
    expect(phone.byTestID('pin')!.props).toMatchObject({ keyboardType: 'phone-pad', returnKeyType: 'done' })
    const secret = () => phone.byTestID('secret')!
    expect(secret().props).toMatchObject({ secureTextEntry: true, autoComplete: 'new-password' })

    phone.context.probe.reveal.set(true)
    await phone.settle()
    expect(secret().props.secureTextEntry).toBe(false)
    phone.context.probe.reveal.set(false)
    phone.context.probe.locked.set(true)
    await phone.settle()
    expect(secret().props).toMatchObject({ secureTextEntry: true, editable: false })
  })
})
