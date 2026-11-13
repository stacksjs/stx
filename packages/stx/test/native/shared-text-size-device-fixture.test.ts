import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

// The screen the iOS gate runs as `--suite text-size`, replayed against the
// protocol. What a host does with a text size is the host's; what is checked
// here is that nothing the shared controls send it holds them to a height.
it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('runs the shared text-size acceptance screen (%s, minify=%s)', async (platform, minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-text-size-device.stx'), { root, minify })
  const phone = mountNativeScreen(result.code, 'Screen', { platform })
  try {
    await phone.settle()
    // A fixed height on something holding words is what cut them off at the
    // larger sizes: 17 points is drawn at 48 there, in a box held to 44 or 48.
    const holdsWords = (node: { type: string, children: unknown[] }): boolean => node.type === 'TextInput'
      || node.children.some(child => typeof child === 'string' || holdsWords(child as { type: string, children: unknown[] }))
    const fixed = phone.all().filter(node => typeof node.style.height === 'number' && node.type !== 'Icon' && holdsWords(node))
    expect(fixed.map(node => `${node.type} ${node.props.testID ?? ''} ${node.style.height}`)).toEqual([])
    expect(phone.byTestID('size-name')!.style.minHeight).toBe(48)
    expect(phone.byTestID('size-password')!.style.minHeight).toBe(48)
    expect(phone.byTestID('size-save')!.style.minHeight).toBe(44)

    phone.press(phone.byTestID('size-name')!, 'onChangeText', { text: 'Ada' })
    phone.press(phone.byTestID('size-password')!, 'onChangeText', { text: 'pw' })
    phone.press(phone.byTestID('size-terms')!, 'onValueChange', { value: true })
    phone.press(phone.byTestID('size-alerts')!, 'onValueChange', { value: true })
    phone.press(phone.byTestID('size-row')!)
    phone.press(phone.byTestID('size-save')!)
    await phone.settle()
    expect(phone.byTestID('size-summary')!.children).toEqual(['Saved 1, opened 1, Ada, 2, agreed, on'])
  }
  finally {
    phone.unmount()
  }
}, 30_000)
