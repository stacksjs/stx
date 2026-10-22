import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

// This is also the source supplied to Craft's maintained iOS UI harness.
// Keep the public fixture's IDs/labels stable rather than compiling a second
// hand-written renderer implementation for device validation.
it.each([false, true])('compiles the maintained device fixture from actual shared controls (minify=%s)', async (minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-controls-device.stx'), { root, minify })
  for (const [directory, name] of [['button', 'Button'], ['input', 'TextInput']])
    expect(result.dependencies).toContain(join(root, 'packages/components/src/ui', directory, `${name}.stx`))
  expect(result.diagnostics.filter(item => item.message !== 'dropped-subtree: script')).toEqual([])
  const phone = mountNativeScreen(result.code)
  try {
    await phone.settle()
    const field = phone.byTestID('name-input')!
    const button = phone.byTestID('increment')!
    expect(field.type).toBe('TextInput')
    expect(button.type).toBe('Pressable')
    phone.press(field, 'onFocus', { text: '' })
    phone.type(field, 'Ada')
    await phone.settle()
    expect(phone.texts()).toContain('Hello Ada')
    for (let count = 1; count <= 3; count++) {
      phone.press(button)
      phone.type(field, `Ada${'x'.repeat(count)}`)
      await phone.settle()
      expect(phone.byTestID('name-input')!.id).toBe(field.id)
      expect(phone.byTestID('name-input')!.props.value).toBe(`Ada${'x'.repeat(count)}`)
      expect(phone.texts()).toContain(`Hello Ada${'x'.repeat(count)}`)
      expect(phone.texts()).toContain(`Count: ${count}`)
    }
    expect(phone.mutationErrors).toEqual([])
  }
  finally { phone.unmount() }
}, 30_000)
