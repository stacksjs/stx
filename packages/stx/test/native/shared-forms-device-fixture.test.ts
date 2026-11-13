import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

// The screen the iOS gate runs as `--suite forms`, replayed against the
// protocol so an ordinary test run catches what the simulator would.
it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('runs the shared forms acceptance screen (%s, minify=%s)', async (platform, minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-forms-device.stx'), { root, minify })
  for (const file of ['input/TextInput', 'input/EmailInput', 'input/PasswordInput', 'select/Select', 'segmented-control/SegmentedControl'])
    expect(result.dependencies).toContain(join(root, `packages/components/src/ui/${file}.stx`))
  expect(result.diagnostics.filter(item => !['dropped-subtree: script', 'dropped-subtree: style'].includes(item.message))).toEqual([])

  const phone = mountNativeScreen(result.code, 'Screen', { platform })
  try {
    await phone.settle()
    const named = (id: string): unknown => phone.byTestID(id)!.props.accessibilityLabel
    expect(['form-name', 'form-email', 'form-password', 'form-sport'].map(named)).toEqual(['Full name', 'Email', 'Password', 'Sport'])
    // The captions drawn above the fields are read as the names, not again as lines.
    const captions = phone.all().filter(node => typeof node.props.for === 'string')
    expect(captions.map(node => node.props.accessibilityRole)).toEqual(['none', 'none', 'none', 'none'])
    expect(phone.byTestID('form-password')!.props).toMatchObject({ secureTextEntry: true, autoComplete: 'current-password' })
    expect(phone.byTestID('form-email')!.props).toMatchObject({ keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email' })

    phone.press(phone.byTestID('form-name')!, 'onChangeText', { text: 'Ada' })
    phone.press(phone.byTestID('form-email')!, 'onChangeText', { text: 'ada@example.com' })
    phone.press(phone.byTestID('form-password')!, 'onChangeText', { text: 'hunter2' })
    phone.press(phone.byTestID('form-sport')!, 'onValueChange', { value: 'run' })
    phone.press(phone.byTestID('form-period-month')!)
    await phone.settle()
    expect(phone.byTestID('form-summary')!.children).toEqual(['Summary: Ada, ada@example.com, 7 characters, run, month'])

    const reveal = phone.find(node => node.props.accessibilityLabel === 'Show password')!
    phone.press(reveal)
    await phone.settle()
    expect(reveal.props.accessibilityLabel).toBe('Hide password')
    expect(phone.byTestID('form-password')!.props.secureTextEntry).not.toBe(true)
  }
  finally {
    phone.unmount()
  }
}, 30_000)
