import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')
const source = `@import('Image', '${image}')
<script client>
const url = state('/photo.png')
const priority = state(false)
const lazy = state(true)
const loading = state('lazy')
const fetchpriority = state('low')
const shown = state(true)
window.probe = { url, priority, lazy, loading, fetchpriority, shown }
</script><section><div :if="shown">
<Image testID="photo" src="/photo.png" :src="url" alt="Photo" loading="lazy" fetchpriority="low"
  :priority="priority" :lazy="lazy" :loading="loading" :fetchpriority="fetchpriority" />
</div></section>`

it.each([false, true])('preserves native Image source, labels and identity while browser hints change (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(source, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const photo = () => phone.byTestID('photo')!
    const id = photo().id
    const probe = phone.context.probe
    for (const value of [true, false, 'false', 'off', '', null, undefined]) {
      probe.priority.set(value)
      probe.lazy.set(value)
      probe.loading.set(value == null ? value : 'eager')
      probe.fetchpriority.set(value == null ? value : 'high')
      await phone.settle()
      expect(photo().id).toBe(id)
      expect(photo().props).toMatchObject({ source: '/photo.png', alt: 'Photo', accessibilityLabel: 'Photo' })
    }
    probe.url.set('/replacement.png')
    await phone.settle()
    expect(photo().props.source).toBe('/replacement.png')
    probe.url.set(null)
    await phone.settle()
    expect(photo().props.source).toBeNull()
    probe.shown.set(false)
    await phone.settle()
    expect(photo()).toBeUndefined()
    probe.priority.set(true)
    probe.url.set('/remount.png')
    probe.shown.set(true)
    await phone.settle()
    expect(photo().id).toBe(id)
    expect(photo().props.source).toBe('/remount.png')
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.priority.set(false)
    probe.lazy.set(false)
    probe.loading.set('lazy')
    probe.fetchpriority.set('low')
    probe.url.set('/disposed.png')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)
