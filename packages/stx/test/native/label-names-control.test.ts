/**
 * What a screen reader is told a form control is called, on a phone.
 *
 * Two HTML habits did not survive the trip to a native host, and a simulator
 * run of the shared form components (stacksjs/stx#2184) showed what that
 * sounded like:
 *
 * - `<label for>` named nothing. A field under the label "Full name" was
 *   announced by its placeholder, "Ada Lovelace, text field", and a picker by
 *   whichever option it held, while the label was read as a line of its own.
 * - `aria-hidden` hid nothing. A decorative image was still a stop for
 *   VoiceOver, which said "image" and nothing else.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { projectAccessibility } from '../../src/native/accessibility'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import type { STXNode } from '../../src/native/compiler/ir'

const ui = join(import.meta.dir, '../../../components/src/ui')

afterEach(unmountAllNativeScreens)

function find(node: STXNode, match: (node: STXNode) => boolean): STXNode | undefined {
  if (match(node)) return node
  for (const child of node.children) {
    const found = typeof child === 'string' ? undefined : find(child, match)
    if (found) return found
  }
  return undefined
}

describe('a <label for> names its control', () => {
  it('gives the control the label words and takes the label out of the reading order', async () => {
    const { root } = await translateHtmlToIR(`<div>
      <label for="name">Full <b>name</b></label><input id="name" placeholder="Ada Lovelace" />
      <label for="sport">Sport</label><select id="sport"><option value="run">Run</option></select>
      <label for="notes">Notes</label><textarea id="notes"></textarea>
    </div>`)
    for (const [id, name] of [['name', 'Full name'], ['sport', 'Sport'], ['notes', 'Notes']] as const) {
      const control = find(root, node => node.props.id === id)!
      expect(control.props.accessibilityLabel).toBe(name)
      const label = find(root, node => node.props.for === id)!
      // Read once, as the name: not a second time as a line of its own.
      expect(label.props.accessibilityRole).toBe('none')
    }
  })

  it('leaves a control that names itself, and its label, as written', async () => {
    const { root } = await translateHtmlToIR(`<div>
      <label for="a">Email</label><input id="a" aria-label="Work email" />
      <label for="b">Phone</label><input id="b" accessibilityLabel="Mobile number" />
      <label for="c">Code</label><input id="c" :aria-label="hint()" />
    </div>`)
    expect(find(root, node => node.props.id === 'a')!.props.accessibilityLabel).toBe('Work email')
    expect(find(root, node => node.props.id === 'b')!.props.accessibilityLabel).toBe('Mobile number')
    expect(find(root, node => node.props.id === 'c')!.props.accessibilityLabel).toBeUndefined()
    for (const id of ['a', 'b', 'c'])
      expect(find(root, node => node.props.for === id)!.props.accessibilityRole).toBeUndefined()
  })

  it('names nothing from a label whose words are bound, or one pointing at a box', async () => {
    const { root } = await translateHtmlToIR(`<div>
      <label for="a" :text="caption()"></label><input id="a" />
      <label for="b">{{ caption() }}</label><input id="b" />
      <label for="c">Group</label><div id="c"><span>Inside</span></div>
      <label for="missing">Nowhere</label>
    </div>`)
    for (const id of ['a', 'b', 'c']) {
      expect(find(root, node => node.props.id === id)!.props.accessibilityLabel).toBeUndefined()
      expect(find(root, node => node.props.for === id)!.props.accessibilityRole).toBeUndefined()
    }
    expect(find(root, node => node.props.for === 'missing')!.props.accessibilityRole).toBeUndefined()
  })
})

describe('aria-hidden reaches the host', () => {
  it('is the role a host leaves out, and wins over the role the node had', () => {
    expect(projectAccessibility({ 'aria-hidden': 'true' })).toEqual({ accessibilityRole: 'none' })
    expect(projectAccessibility({ 'aria-hidden': '' })).toEqual({ accessibilityRole: 'none' })
    expect(projectAccessibility({ 'aria-hidden': 'true', 'role': 'button', 'aria-label': 'Close' })).toMatchObject({ accessibilityRole: 'none' })
    expect(projectAccessibility({ 'aria-hidden': 'false', 'role': 'button' })).toEqual({ accessibilityRole: 'button' })
    expect(projectAccessibility({ 'aria-hidden': null, 'role': 'button' })).toEqual({ accessibilityRole: 'button' })
    // The native spelling is deliberate when both are written.
    expect(projectAccessibility({ 'aria-hidden': 'true', 'accessibilityRole': 'image' })).toEqual({ accessibilityRole: 'image' })
  })

  it.each(['ios', 'android'] as const)('follows a bound value on %s', async (platform) => {
    const { code } = await compileNativeScreen(`<script client>
const quiet = state(true)
window.probe = { quiet }
</script>
<section><span testID="note" role="img" aria-label="Sparkles" :aria-hidden="quiet() ? 'true' : null">*</span></section>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    expect(phone.byTestID('note')!.props.accessibilityRole).toBe('none')
    phone.context.probe.quiet.set(false)
    await phone.settle()
    expect(phone.byTestID('note')!.props.accessibilityRole).toBe('image')
    phone.context.probe.quiet.set(true)
    await phone.settle()
    expect(phone.byTestID('note')!.props.accessibilityRole).toBe('none')
  }, 30_000)
})

describe.each(['ios', 'android'] as const)('the shared form controls on %s', (platform) => {
  it('write a typed password back through v-model:value, as the other fields do', async () => {
    const { code } = await compileNativeScreen(`@import('TextInput', '${ui}/input/TextInput.stx')
@import('PasswordInput', '${ui}/input/PasswordInput.stx')
<script client>
const name = state('')
const secret = state('')
window.probe = { name, secret }
</script>
<section>
  <TextInput testID="name" v-model:value="name" />
  <PasswordInput testID="password" v-model:value="secret" />
</section>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    phone.press(phone.byTestID('name')!, 'onChangeText', { text: 'Ada' })
    phone.press(phone.byTestID('password')!, 'onChangeText', { text: 'hunter2' })
    await phone.settle()
    expect([phone.context.probe.name(), phone.context.probe.secret()]).toEqual(['Ada', 'hunter2'])
    expect(phone.byTestID('password')!.props).toMatchObject({ secureTextEntry: true, value: 'hunter2' })
  }, 30_000)

  it('are named by their label, and a decorative image is not announced', async () => {
    const { code } = await compileNativeScreen(`@import('TextInput', '${ui}/input/TextInput.stx')
@import('EmailInput', '${ui}/input/EmailInput.stx')
@import('PasswordInput', '${ui}/input/PasswordInput.stx')
@import('Select', '${ui}/select/Select.stx')
@import('Image', '${ui}/image/Image.stx')
<script client>
const name = state('')
const email = state('')
const secret = state('')
const sport = state('')
const decorative = state(true)
window.probe = { decorative }
</script>
<section>
  <TextInput testID="name" label="Full name" placeholder="Ada Lovelace" v-model:value="name" />
  <TextInput testID="named" label="Phone" accessibilityLabel="Mobile number" v-model:value="name" />
  <EmailInput testID="email" label="Email" v-model:value="email" />
  <PasswordInput testID="password" label="Password" v-model:value="secret" />
  <Select testID="sport" label="Sport" v-model:value="sport" :options="[{ value: 'run', label: 'Run' }]" />
  <Image testID="ornament" src="/flag.png" :decorative="decorative" fit="contain" placeholder="none" />
</section>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const named = (id: string): unknown => phone.byTestID(id)!.props.accessibilityLabel
    expect([named('name'), named('email'), named('password'), named('sport')]).toEqual(['Full name', 'Email', 'Password', 'Sport'])
    expect(named('named')).toBe('Mobile number')
    const captions = phone.all().filter(node => node.type === 'Text' && typeof node.props.for === 'string')
    expect(captions.map(node => node.props.accessibilityRole)).toEqual(['none', undefined, 'none', 'none', 'none'])

    expect(phone.byTestID('ornament')!.props.accessibilityRole).toBe('none')
    phone.context.probe.decorative.set(false)
    await phone.settle()
    expect(phone.byTestID('ornament')!.props.accessibilityRole).not.toBe('none')
  }, 30_000)
})
