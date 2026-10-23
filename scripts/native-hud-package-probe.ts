import assert from 'node:assert/strict'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '@stacksjs/stx/native/compiler/bundle'
import { mountNativeScreen } from '@stacksjs/stx/native/testing'

// Run from an installed consumer, never resolve compiler/runtime from src.
// The screen and child import the same model; two inlined copies fail here.
const root = process.cwd()
for (const minify of [false, true]) {
  const result = await compileSharedScreenBundle(join(root, 'fixtures/native-hud-device.stx'), { root, minify })
  for (let repetition = 0; repetition < 2; repetition++) {
    const phone = mountNativeScreen(result.code, 'main')
    try {
      await phone.settle()
      const { model } = phone.context.hudProbe
      assert.equal(model.subscriberCount(), 1, 'screen and child must share module state')
      const field = phone.byTestID('draft-a')!
      phone.type(field, 'Ada')
      phone.press(phone.byTestID('reorder')!)
      await phone.settle()
      assert.equal(phone.byTestID('draft-a')!.id, field.id, 'keyed field identity changed')
      assert.equal(phone.byTestID('draft-a')!.props.value, 'Ada')
      phone.press(phone.byTestID('increment')!)
      await phone.settle()
      assert.equal(model.count(), 1)
      assert.equal(phone.context.hudEvents(), 1)
      phone.press(phone.byTestID('invalid')!)
      await phone.settle()
      assert.equal(model.count(), 1)
      assert(phone.texts().includes('Invalid amount'))
      const previousEvents = phone.context.hudEvents
      phone.press(phone.byTestID('toggle-hud')!)
      await phone.settle()
      assert.equal(model.subscriberCount(), 0, 'removed HUD leaked a subscription')
      model.increment(1)
      await phone.settle()
      assert.equal(previousEvents(), 1, 'removed HUD received an event')
      phone.press(phone.byTestID('toggle-hud')!)
      await phone.settle()
      assert.equal(model.subscriberCount(), 1, 'remounted HUD must subscribe exactly once')
      assert.equal(phone.context.hudEvents(), 0)
      assert.equal(phone.byTestID('draft-a')!.props.value, 'Ada')
      phone.press(phone.byTestID('increment')!)
      await phone.settle()
      assert.equal(model.count(), 3)
      assert.equal(phone.context.hudEvents(), 1)
      assert.deepEqual(phone.mutationErrors, [])
      phone.unmount()
      assert.equal(model.subscriberCount(), 0, 'screen unmount leaked a subscription')
      const before = phone.messages.length
      model.increment(1)
      await phone.settle()
      assert.equal(phone.messages.length, before, 'unmounted screen sent host mutations')
    }
    finally { phone.unmount() }
  }
}
console.log('installed native HUD contract passed (normal/minified, two mounts each)')
