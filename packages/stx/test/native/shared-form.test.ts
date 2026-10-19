import { describe, expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen, type NativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

let compiled: Promise<string> | undefined

async function formBundle() {
  const root = createTempDir('stx-shared-form-')
  mkdirSync(path.join(root, 'components'))
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
  for (const [name, source] of Object.entries({ SharedForm: 'form/Form', SharedInput: 'input/TextInput', SharedButton: 'button/Button', SharedCheckbox: 'checkbox/Checkbox' })) {
    await Bun.write(path.join(root, 'components', `${name}.stx`), Bun.file(path.join(import.meta.dir, '../../../components/src/ui', `${source}.stx`)))
  }
  const source = `<script client>
const formRef = useRef('profile')
window.formRef = formRef
window.submissions = []
window.failures = []
const schema = { name: { required: true, validate: value => value === 'blocked' ? 'Reserved name' : null } }
function captureSubmission(values, helpers) { window.submissions.push(values); window.helpers = helpers }
</script>
<div x-ref="profile"><SharedForm :initialValues="{ source: 'profile' }" :validationSchema="schema" validateOnChange validateOnBlur @submit="captureSubmission" @error="window.failures.push($event)">
  <SharedInput name="name" value="Ada" showCount maxLength="40" />
  <SharedCheckbox name="agree" value="yes" />
  <input type="hidden" name="token" value="saved-token" />
  <SharedButton type="submit" testID="save">Save</SharedButton>
  <SharedButton type="reset">Reset</SharedButton>
</SharedForm></div>`
  const file = path.join(root, 'Profile.stx')
  await Bun.write(file, source)
  const { code } = await compileSharedScreenBundle(file, { root })
  return code
}

async function formScreen() {
  return mountNativeScreen(await (compiled ??= formBundle()), 'Profile')
}

function formApi(phone: NativeScreen) {
  const root = phone.context.formRef()
  expect(root).toBeTruthy()
  const owner = phone.context.__stx_host.descendants(root).find((node: any) => node.__stx_exposed?.validateForm)
  expect(owner).toBeTruthy()
  return { api: owner.__stx_exposed, owner }
}

describe('shared Form on a native host (#2088)', () => {
  it('tracks checked values and omits an unchecked shared checkbox', async () => {
    const phone = await formScreen()
    await phone.settle()
    const { api } = formApi(phone)
    const checkbox = phone.ofType('Checkbox').find(node => node.props.name === 'agree')!
    expect(checkbox).toBeTruthy()
    phone.press(checkbox, 'onValueChange', { value: true })
    await phone.settle()
    expect(api.values().agree).toBe('yes')
    phone.press(phone.ofType('Pressable').find(node => node.props.type === 'submit')!)
    await phone.settle()
    expect(phone.context.submissions[0].agree).toBe('yes')
    phone.press(checkbox, 'onValueChange', { value: false })
    await phone.settle()
    expect(api.values().agree).toBeUndefined()
    phone.press(phone.ofType('Pressable').find(node => node.props.type === 'submit')!)
    await phone.settle()
    expect(phone.context.submissions[1].agree).toBeUndefined()
  }, 30_000)

  it('submits current shared-control values from a real submit-button press', async () => {
    const phone = await formScreen()
    await phone.settle()
    const input = phone.ofType('TextInput').find(node => node.props.name === 'name')!
    expect(input).toBeTruthy()
    phone.type(input, 'Grace')
    await phone.settle()
    const { api } = formApi(phone)
    expect(api.values().name).toBe('Grace')
    const submit = phone.ofType('Pressable').find(node => node.props.type === 'submit')!
    expect(submit).toBeTruthy()
    expect(submit.events.onPress).toBeTruthy()
    phone.press(submit)
    await phone.settle()
    expect(JSON.parse(JSON.stringify(phone.context.submissions))).toEqual([{ name: 'Grace', token: 'saved-token', source: 'profile' }])
    expect(phone.context.failures).toHaveLength(0)
  }, 30_000)

  it('runs required and custom rules on edits, blur, and submit', async () => {
    const phone = await formScreen()
    await phone.settle()
    const { api } = formApi(phone)
    const input = phone.ofType('TextInput').find(node => node.props.name === 'name')!
    phone.type(input, '')
    await phone.settle()
    expect(api.errors().name).toBe('name is required')
    phone.press(phone.ofType('Pressable').find(node => node.props.type === 'submit')!)
    await phone.settle()
    expect(phone.context.submissions).toHaveLength(0)
    expect(phone.context.failures[0].name).toBe('name is required')
    expect(api.isSubmitting()).toBe(false)
    phone.type(input, 'blocked')
    await phone.settle()
    expect(api.errors().name).toBe('Reserved name')
    api.errors.set({})
    phone.press(input, 'onBlur')
    await phone.settle()
    expect(api.errors().name).toBe('Reserved name')
    phone.type(input, 'Grace')
    await phone.settle()
    expect(api.errors().name).toBeUndefined()
  }, 30_000)

  it('delivers submit helpers and resets state and visible controls without a DOM argument', async () => {
    const phone = await formScreen()
    await phone.settle()
    const { api, owner } = formApi(phone)
    const submitting: boolean[] = []
    phone.context.__stx_host.listen(owner, 'submit', (event: any) => {
      if (event.target === owner) submitting.push(api.isSubmitting())
    })
    const input = phone.ofType('TextInput').find(node => node.props.name === 'name')!
    phone.type(input, 'Grace')
    await phone.settle()
    phone.press(phone.ofType('Pressable').find(node => node.props.type === 'submit')!)
    await phone.settle()
    expect(submitting).toEqual([true])
    expect(api.isSubmitting()).toBe(false)
    expect(api.submitCount()).toBe(1)
    expect(typeof phone.context.helpers?.resetForm).toBe('function')
    phone.context.helpers.resetForm()
    await phone.settle()
    expect(phone.ofType('TextInput').find(node => node.props.name === 'name')!.props.value).toBe('Ada')
    const inputOwner = phone.context.__stx_host.descendants(owner).find((node: any) => node.__stx_exposed?.clear)
    expect(inputOwner.__stx_exposed.value()).toBe('Ada')
    expect(api.values().source).toBe('profile')
    expect(api.submitCount()).toBe(0)
    expect(Object.keys(api.errors())).toHaveLength(0)
  }, 30_000)

  it('honors cancellation and resets through a real shared reset button', async () => {
    const phone = await formScreen()
    await phone.settle()
    const { api, owner } = formApi(phone)
    const host = phone.context.__stx_host
    const form = host.descendants(owner).find((node: any) => typeof node.reset === 'function')
    expect(form).toBeTruthy()
    phone.type(phone.ofType('TextInput').find(node => node.props.name === 'name')!, 'Grace')
    await phone.settle()
    host.listen(form, 'reset', (event: any) => event.preventDefault(), { once: true })
    const button = phone.ofType('Pressable').find(node => node.props.type === 'reset')!
    phone.press(button)
    await phone.settle()
    expect(api.values().name).toBe('Grace')
    expect(phone.ofType('TextInput').find(node => node.props.name === 'name')!.props.value).toBe('Grace')
    phone.press(button)
    await phone.settle()
    expect(api.values().name).toBeUndefined()
    expect(phone.ofType('TextInput').find(node => node.props.name === 'name')!.props.value).toBe('Ada')
  }, 30_000)
})
