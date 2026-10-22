import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

it.each([false, true])('retains imported HUD state, events, keyed controls and disposal (minify=%s, #2109)', async (minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/native-hud-device.stx'), { root, minify })
  expect(result.dependencies).toContain(join(import.meta.dir, 'fixtures/native-hud-model.ts'))
  for (let repetition = 0; repetition < 2; repetition++) {
    const phone = mountNativeScreen(result.code)
    try {
      await phone.settle()
      const { model } = phone.context.hudProbe
      expect(model.subscriberCount()).toBe(1)
      const field = phone.byTestID('draft-a')!
      phone.press(field, 'onFocus')
      phone.type(field, 'Ada')
      await phone.settle()
      expect(model.rows()[0].draft).toBe('Ada')
      expect(phone.texts()).toContain('Draft: Ada')
      phone.press(phone.byTestID('increment')!)
      await phone.settle()
      expect([model.count(), phone.context.hudProbe.events()]).toEqual([1, 1])
      expect(phone.texts()).toContain('Count: 1')
      phone.press(phone.byTestID('invalid')!)
      await phone.settle()
      expect([model.count(), phone.context.hudProbe.events()]).toEqual([1, 1])
      expect(phone.texts()).toContain('Invalid amount')
      phone.press(phone.byTestID('reorder')!)
      await phone.settle()
      expect(phone.byTestID('draft-a')!.id).toBe(field.id)
      expect(phone.byTestID('draft-a')!.props.value).toBe('Ada')
      phone.type(field, 'Adax')
      await phone.settle()
      expect(model.rows().find((row: { id: string }) => row.id === 'a').draft).toBe('Adax')
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      expect(model.subscriberCount()).toBe(0)
      const before = phone.messages.length
      model.increment(1)
      model.reorder()
      await phone.settle()
      expect(phone.messages).toHaveLength(before)
    }
    finally { phone.unmount() }
  }
}, 30_000)
