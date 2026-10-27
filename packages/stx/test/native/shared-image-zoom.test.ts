import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')

it.each([false, true])('keeps browser Image hover zoom out of native styles and survives remounts (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(`@import('Image', '${image}')
<script client>
const zoom = state(true)
const shown = state(true)
const url = state('/photo.png')
window.probe = { zoom, shown, url }
</script><section><div :if="shown">
<Image testID="photo" src="/photo.png" :src="url" alt="Photo" rounded="true" zoomOnHover="true" :zoomOnHover="zoom" />
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
      expect(photo().style.transform).toBeUndefined()
      expect(photo().style).not.toHaveProperty('scale')
      expect(photo().style).not.toHaveProperty('transition')
    }
    check()
    for (const value of [false, 'false', 'off', null, undefined, true, 'true', '']) {
      probe.zoom.set(value)
      await phone.settle()
      check()
    }
    probe.shown.set(false)
    await phone.settle()
    expect(photo()).toBeUndefined()
    probe.zoom.set(false)
    probe.url.set('/remount.png')
    probe.shown.set(true)
    await phone.settle()
    check('/remount.png')
    probe.zoom.set(true)
    await phone.settle()
    check('/remount.png')
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.zoom.set(false)
    probe.url.set('/disposed.png')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)
