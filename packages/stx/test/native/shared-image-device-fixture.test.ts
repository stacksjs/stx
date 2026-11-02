import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('uses the same shared Image device fixture (%s, minify=%s)', async (platform, minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-image-device.stx'), { root, minify })
  expect(result.dependencies).toContain(join(root, 'packages/components/src/ui/image/Image.stx'))
  expect(result.dependencies).toContain(join(root, 'packages/stx/src/native/primitives/Image.stx'))
  expect(result.diagnostics.filter(item => !['dropped-subtree: script', 'dropped-subtree: style'].includes(item.message))).toEqual([])
  const phone = mountNativeScreen(result.code, 'Screen', { platform })
  try {
    await phone.settle()
    const image = phone.byTestID('shared-photo')!
    const legacy = phone.byTestID('legacy-photo')!
    const probe = phone.context.imageProbe
    expect(image.type).toBe('Image')
    expect(image.style).toMatchObject({ objectFit: 'scale-down', objectPosition: 'right bottom' })
    expect(image.props.source).toBe(probe.wide)
    expect(legacy.props).toMatchObject({ source: { uri: probe.wide }, resizeMode: 'contain' })
    phone.press(image, 'onLoad', { width: 20, height: 10 })
    expect(probe.loads()).toBe(1)
    const start = phone.operations().length
    phone.press(phone.byTestID('image-fit')!)
    phone.press(phone.byTestID('image-position')!)
    await phone.settle()
    expect(phone.byTestID('shared-photo')).toBe(image)
    expect(image.style).toMatchObject({ objectFit: 'contain', objectPosition: 'left top' })
    expect(phone.operations().slice(start).some(op => op.op === 'updateNode' && op.patch.props?.source !== undefined)).toBe(false)
    phone.press(phone.byTestID('image-source')!)
    await phone.settle()
    expect(image.props.source).toBe(probe.tall)
    expect(phone.byTestID('shared-photo')).toBe(image)
    phone.press(phone.byTestID('image-defaults')!)
    await phone.settle()
    expect(image.style).toMatchObject({ objectFit: 'cover', objectPosition: 'center' })
    phone.press(phone.byTestID('image-toggle')!)
    await phone.settle()
    expect(phone.byTestID('shared-photo')).toBeUndefined()
    phone.press(image, 'onLoad', { width: 99 })
    expect(probe.loads()).toBe(1)
    probe.source.set(probe.wide)
    probe.fit.set('none')
    phone.press(phone.byTestID('image-toggle')!)
    await phone.settle()
    expect(phone.byTestID('shared-photo')!.style.objectFit).toBe('none')
    expect(phone.byTestID('shared-photo')!.props.source).toBe(probe.wide)
    expect(phone.byTestID('legacy-photo')).toBe(legacy)
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.source.set(probe.tall)
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)
