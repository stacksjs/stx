/**
 * A bound prop naming something the screen destructured stays the screen's.
 *
 * An app's auto-imported functions are globals in the process that builds its
 * screens. A bound component prop is evaluated at build time when every name
 * in it resolves there, unless the screen's own client script declares that
 * name. Declarations were collected at depth zero only after blanking every
 * bracket, which blanked the names of a destructuring pattern too:
 *
 *   const { say, email } = setupNativeView()
 *
 * declared nothing. With an app-wide say() that returns nothing, a
 * placeholder bound to say('...') was evaluated while building, came back
 * undefined and was dropped, so the field reached the phone with no
 * placeholder and no accessibility label. A test process has no such globals,
 * so the same screen passed there and was blank on the device.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { collectTopLevelDeclarations } from '../../src/stx-virtual-ts'
import { renderWeb } from './shared-native-web'

const ui = join(import.meta.dir, '../../../components/src/ui/input')
/**
 * Both fields an app can mean by the tag: the host's own primitive, which is
 * what a bare tag with an input listener resolves to, and the shared component
 * when the screen imports it.
 */
const fields = {
  'the host primitive': '',
  'the shared component': `@import('TextInput', '${ui}/TextInput.stx')\n`,
}
const screen = (field: keyof typeof fields): string => `${fields[field]}<script client>
function setupScreen() {
  const words = { 'field.email': 'New email', 'field.name': 'Your name' }
  const say = key => words[key]
  const email = state('ada@example.com')
  const draft = state('')
  return { say, email, draft }
}
const { say, email, draft: typed } = setupScreen()
const [first, second = 'two'] = ['one']
</script>
<section>
  <TextInput testID="said" :value="typed()" :placeholder="say('field.email')" :accessibilityLabel="say('field.email')" />
  <TextInput testID="signal" :value="typed()" :placeholder="email()" />
  <TextInput testID="listed" :value="typed()" :placeholder="first + second" />
</section>`

/** What an app's auto-imports look like to the process building its screens. */
const appGlobals: Record<string, unknown> = {
  say: (_text: string): void => {},
  email: async (): Promise<string> => 'sent',
  first: 'app-wide',
  second: 'app-wide',
}

beforeEach(() => {
  for (const [name, value] of Object.entries(appGlobals))
    (globalThis as Record<string, unknown>)[name] = value
})

afterEach(() => {
  unmountAllNativeScreens()
  for (const name of Object.keys(appGlobals))
    delete (globalThis as Record<string, unknown>)[name]
})

describe('top-level declarations include destructured names', () => {
  it('reads object and array patterns, renames, defaults and rest', () => {
    expect(collectTopLevelDeclarations(`
      const { say, email: mail, ...others } = setup()
      const [first, , third = 3, ...tail] = list
      let { a: { deep }, b = 2 } = obj
      const plain = 1
    `)).toEqual(['b', 'deep', 'first', 'mail', 'others', 'plain', 'say', 'tail', 'third'])
  })

  it('still leaves out what a function declares for itself', () => {
    expect(collectTopLevelDeclarations(`
      function setup() { const { hidden } = source; const [inner] = list; return hidden }
      const visible = setup()
    `)).toEqual(['setup', 'visible'])
  })

  it('is not misled by a default value that holds brackets', () => {
    expect(collectTopLevelDeclarations(`
      const { options = { a: [1, 2] }, list = [{ b: 1 }] } = props
    `)).toEqual(['list', 'options'])
  })
})

const cases = (['ios', 'android'] as const).flatMap(platform =>
  (Object.keys(fields) as Array<keyof typeof fields>).map(field => [platform, field] as const))

describe.each(cases)('bound props over destructured names on %s, on %s', (platform, field) => {
  const source = screen(field)

  it('reach the field although the app has globals of the same names', async () => {
    const { code } = await compileNativeScreen(source)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()

    expect(phone.byTestID('said')!.props).toMatchObject({ placeholder: 'New email', accessibilityLabel: 'New email' })
    expect(phone.byTestID('signal')!.props.placeholder).toBe('ada@example.com')
    expect(phone.byTestID('listed')!.props.placeholder).toBe('onetwo')
  }, 30_000)

  it('keep following the signal they read', async () => {
    const source2 = source.replace('</script>', 'window.probe = { email }\n</script>')
    const { code } = await compileNativeScreen(source2)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()

    phone.context.probe.email.set('grace@example.com')
    await phone.settle()
    expect(phone.byTestID('signal')!.props.placeholder).toBe('grace@example.com')
  }, 30_000)
})

describe('the shared field on the web', () => {
  it('serves a written placeholder and binds a bound one', async () => {
    const html = await renderWeb(`@import('TextInput', '${ui}/TextInput.stx')
<script client>
const hint = state('Search')
</script>
<TextInput id="written" placeholder="Your name" />
<TextInput id="bound" :placeholder="hint()" />`)

    const written = html.match(/<input\b[^>]*id="written"[^>]*>/)![0]
    expect(written).toContain('placeholder="Your name"')
    // The bound one reaches the component's scope as a parent binding, which
    // its own placeholder binding then follows.
    expect(html).toMatch(/data-stx-parent-bindings="[^"]*\bplaceholder\b/)
    expect(html.match(/<input\b[^>]*id="bound"[^>]*>/)![0]).toContain(':placeholder=')
  }, 30_000)
})

describe.each(['ios', 'android'] as const)('a bound placeholder on the other shared fields on %s', (platform) => {
  it('reaches the field and follows its signal', async () => {
    const kit = join(ui, '..')
    const { code } = await compileNativeScreen(`@import('PasswordInput', '${kit}/input/PasswordInput.stx')
@import('NumberInput', '${kit}/input/NumberInput.stx')
@import('Textarea', '${kit}/textarea/Textarea.stx')
<script client>
const hint = state('first')
window.probe = { hint }
</script>
<section>
  <PasswordInput :placeholder="hint()" />
  <NumberInput :placeholder="hint()" />
  <Textarea :placeholder="hint()" />
</section>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    // By type, not testID: the number field and the text area have no native
    // drawing of their own yet, so a testID lands on the box around the field.
    const hints = () => phone.ofType('TextInput').map(field => field.props.placeholder)
    expect(hints()).toEqual(['first', 'first', 'first'])

    phone.context.probe.hint.set('second')
    await phone.settle()
    expect(hints()).toEqual(['second', 'second', 'second'])
  }, 30_000)
})

