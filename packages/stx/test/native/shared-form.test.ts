import { describe, expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

async function formScreen() {
  const root = createTempDir('stx-shared-form-')
  mkdirSync(path.join(root, 'components'))
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
  for (const [name, source] of Object.entries({ SharedForm: 'form/Form', SharedInput: 'input/TextInput', SharedButton: 'button/Button' })) {
    await Bun.write(path.join(root, 'components', `${name}.stx`), Bun.file(path.join(import.meta.dir, '../../../components/src/ui', `${source}.stx`)))
  }
  const source = `<script client>
const formRef = useRef('profile')
window.formRef = formRef
window.submissions = []
window.failures = []
</script>
<div x-ref="profile"><SharedForm :initialValues="{ source: 'profile' }" :validationSchema="{ name: { required: true } }" validateOnChange validateOnBlur @submit="window.submissions.push($event)" @error="window.failures.push($event)">
  <SharedInput name="name" value="Ada" />
  <input type="hidden" name="token" value="saved-token" />
  <SharedButton type="submit" testID="save">Save</SharedButton>
</SharedForm></div>`
  const file = path.join(root, 'Profile.stx')
  await Bun.write(file, source)
  const { code } = await compileSharedScreenBundle(file, { root })
  return mountNativeScreen(code, 'Profile')
}

describe('shared Form on a native host (#2088)', () => {
  it('submits current shared-control values from a real submit-button press', async () => {
    const phone = await formScreen()
    await phone.settle()
    const input = phone.ofType('TextInput').find(node => node.props.name === 'name')!
    expect(input).toBeTruthy()
    phone.type(input, 'Grace')
    await phone.settle()
    const root = phone.context.formRef()
    expect(root).toBeTruthy()
    const owner = phone.context.__stx_host.descendants(root).find((node: any) => node.__stx_exposed?.validateForm)
    const api = owner?.__stx_exposed
    expect(api).toBeTruthy()
    expect(api.values().name).toBe('Grace')
    const submit = phone.ofType('Button').find(node => node.props.type === 'submit')!
    expect(submit).toBeTruthy()
    expect(submit.events.onPress).toBeTruthy()
    phone.press(submit)
    await phone.settle()
    expect(JSON.parse(JSON.stringify(phone.context.submissions))).toEqual([{ name: 'Grace', token: 'saved-token', source: 'profile' }])
    expect(phone.context.failures).toHaveLength(0)
  }, 30_000)
})
