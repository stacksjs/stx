import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')
const source = `@import('Image', '${image}')
<script client>
const url = state('/photo.png')
const decoding = state('sync')
const shown = state(true)
window.probe = { url, decoding, shown }
</script><section><div :if="shown">
<Image testID="photo" src="/photo.png" :src="url" alt="Photo" decoding="sync" :decoding="decoding" />
</div></section>`

it.each([false, true])('preserves native Image behavior while browser decoding hints change (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(source, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const photo = () => phone.byTestID('photo')!
    const id = photo().id
    const probe = phone.context.probe
    for (const value of ['async', 'sync', 'auto', null, '', undefined]) {
      probe.decoding.set(value)
      await phone.settle()
      expect(photo().id).toBe(id)
      expect(photo().props).toMatchObject({ source: '/photo.png', alt: 'Photo', accessibilityLabel: 'Photo' })
    }
    probe.shown.set(false)
    await phone.settle()
    expect(photo()).toBeUndefined()
    probe.decoding.set('auto')
    probe.url.set('/remount.png')
    probe.shown.set(true)
    await phone.settle()
    expect(photo().id).toBe(id)
    expect(photo().props.source).toBe('/remount.png')
    probe.url.set(null)
    await phone.settle()
    expect(photo().props.source).toBeNull()
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.decoding.set('async')
    probe.url.set('/disposed.png')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)
