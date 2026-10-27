import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')

describe.each([false, true])('shared Image rounding (minify=%s)', (minify) => {
  it.each([false, true])('updates image and frame radii, restores defaults and retains identity (authored rounded=%s)', async (initial) => {
    const { code } = await compileNativeScreen(`@import('Image', '${image}')
<script client>
const rounded = state(${initial})
const shown = state(true)
window.probe = { rounded, shown }
</script><section><div :if="shown">
<Image testID="photo" src="/photo.png" alt="Photo" ${initial ? 'rounded="true"' : ''} :rounded="rounded" />
</div></section>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const photo = () => phone.byTestID('photo')!
      const frame = () => phone.all().find(node => node.children.some(child => typeof child !== 'string' && child.id === photo().id))!
      const id = photo().id
      const frameId = frame().id
      const probe = phone.context.probe
      const check = (enabled: boolean) => {
        expect(photo().id).toBe(id)
        expect(frame().id).toBe(frameId)
        expect(photo().style.borderRadius ?? null).toBe(enabled ? 8 : null)
        expect(frame().style.borderRadius ?? null).toBe(enabled ? 8 : null)
        expect(photo().props).toMatchObject({ source: '/photo.png', alt: 'Photo', accessibilityLabel: 'Photo' })
      }
      check(initial)
      for (const value of [true, 'true', 'on', 'yes', '', 1]) {
        probe.rounded.set(value)
        await phone.settle()
        check(true)
      }
      for (const value of [false, 'false', '0', 'off', 'no', null, 0]) {
        probe.rounded.set(value)
        await phone.settle()
        check(false)
      }
      probe.rounded.set(undefined)
      await phone.settle()
      check(initial)
      for (const value of [true, false, null, undefined]) {
        probe.shown.set(false)
        await phone.settle()
        expect(photo()).toBeUndefined()
        probe.rounded.set(value)
        probe.shown.set(true)
        await phone.settle()
        check(value === undefined ? initial : value === true)
      }
      probe.rounded.set(!initial)
      await phone.settle()
      check(!initial)
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const count = phone.messages.length
      probe.rounded.set(initial)
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 30_000)
})
