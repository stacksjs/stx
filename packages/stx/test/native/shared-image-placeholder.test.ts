import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')

describe.each([false, true])('shared Image placeholder compatibility (minify=%s)', (minify) => {
  it.each([undefined, 'color'])('preserves native source, labels and identity across placeholder defaults/remounts (authored=%s)', async (authored) => {
    const { code } = await compileNativeScreen(`@import('Image', '${image}')
<script client>
const mode = state(${JSON.stringify(authored)})
const color = state('#123456')
const url = state('/photo.png')
const shown = state(true)
window.probe = { mode, color, url, shown }
</script><section><div :if="shown">
<Image testID="photo" src="/photo.png" :src="url" alt="Photo" rounded="true"
  ${authored ? `placeholder="${authored}"` : ''} placeholderColor="#123456" :placeholder="mode" :placeholderColor="color" />
</div></section>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const photo = () => phone.byTestID('photo')!
      const id = photo().id
      const probe = phone.context.probe
      const check = (source = '/photo.png') => {
        expect(photo().id).toBe(id)
        expect(photo().props).toMatchObject({ source, alt: 'Photo', accessibilityLabel: 'Photo' })
        expect(photo().style.borderRadius).toBe(8)
      }
      check()
      for (const value of ['color', 'blur', 'thumbhash', 'none', 'empty', '/preview.png', 'linear-gradient(red, blue)', null, '', undefined]) {
        probe.mode.set(value)
        probe.color.set(value == null ? value : '#abcdef')
        await phone.settle()
        check()
      }
      probe.url.set('/replacement.png')
      await phone.settle()
      check('/replacement.png')
      probe.shown.set(false)
      await phone.settle()
      expect(photo()).toBeUndefined()
      probe.mode.set('color')
      probe.color.set(null)
      probe.url.set('/remount.png')
      probe.shown.set(true)
      await phone.settle()
      check('/remount.png')
      probe.mode.set(undefined)
      probe.color.set(undefined)
      await phone.settle()
      check('/remount.png')
      probe.url.set(null)
      await phone.settle()
      expect(photo().props.source).toBeNull()
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const count = phone.messages.length
      probe.mode.set('blur')
      probe.color.set('#fedcba')
      probe.url.set('/disposed.png')
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 30_000)
})
