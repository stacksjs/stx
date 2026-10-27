import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')
const tokens = { full: 9999, sm: 2, md: 6, lg: 8, xl: 12, '2xl': 16 } as const

describe.each([false, true])('shared Image rounding (minify=%s)', (minify) => {
  it.each([false, true, ...Object.keys(tokens)])('updates image and frame radii, restores defaults and retains identity (authored rounded=%s)', async (initial) => {
    const { code } = await compileNativeScreen(`@import('Image', '${image}')
<script client>
const rounded = state(${JSON.stringify(initial)})
const shown = state(true)
const url = state('/photo.png')
window.probe = { rounded, shown, url }
</script><section><div :if="shown">
<Image testID="photo" src="/photo.png" :src="url" alt="Photo" ${initial ? `rounded="${initial}"` : ''} :rounded="rounded" />
</div></section>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const photo = () => phone.byTestID('photo')!
      const frame = () => phone.all().find(node => node.children.some(child => typeof child !== 'string' && child.id === photo().id))!
      const id = photo().id
      const frameId = frame().id
      const probe = phone.context.probe
      const check = (value: boolean | string, source = '/photo.png') => {
        const radius = typeof value === 'string' ? tokens[value as keyof typeof tokens] : value ? 8 : null
        expect(photo().id).toBe(id)
        expect(frame().id).toBe(frameId)
        expect(photo().style.borderRadius ?? null).toBe(radius)
        expect(frame().style.borderRadius ?? null).toBe(radius)
        expect(photo().props).toMatchObject({ source, alt: 'Photo', accessibilityLabel: 'Photo' })
      }
      check(initial)
      for (const value of [true, 'true', 'on', 'yes', '', 1, 'unknown', '__proto__', 'constructor', 'toString']) {
        probe.rounded.set(value)
        await phone.settle()
        check(true)
      }
      for (const value of [false, 'false', '0', 'off', 'no', null, 0]) {
        probe.rounded.set(value)
        await phone.settle()
        check(false)
      }
      for (const value of Object.keys(tokens)) {
        probe.rounded.set(value)
        await phone.settle()
        check(value)
      }
      probe.rounded.set(undefined)
      await phone.settle()
      check(initial)
      for (const value of [true, false, null, ...Object.keys(tokens), undefined]) {
        probe.shown.set(false)
        await phone.settle()
        expect(photo()).toBeUndefined()
        probe.rounded.set(value)
        probe.shown.set(true)
        await phone.settle()
        check(value === undefined ? initial : value ?? false)
      }
      probe.rounded.set(!initial)
      await phone.settle()
      check(!initial)
      probe.rounded.set('full')
      probe.url.set('/replacement.png')
      await phone.settle()
      check('full', '/replacement.png')
      probe.url.set('/photo.png')
      await phone.settle()
      check('full')
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
