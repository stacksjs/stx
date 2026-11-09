import { afterEach, describe, expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { boot, closeBrowser, find, settle } from '../router/spa-harness'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')
const source = `@import('Image', '${image}')
<script client>
const url = state('/first.png')
const candidates = state('/responsive.png 1x')
const size = state('50vw')
const shown = state(true)
window.probe = { url, candidates, size, shown }
</script><section><div :if="shown">
<Image testID="photo" className="photo" src="/first.png" :src="url" alt="Photo"
  webpSrc="/first.webp" srcSet="/first.png 1x, /first-large.png 2x" />
</div><Image testID="dynamic" className="dynamic" :src="url" alt="Dynamic" />
<Image testID="responsive" src="/first.png" :src="url" :srcSet="candidates" :sizes="size" alt="Responsive" />
<Image testID="static" className="static" src="/static.png" alt="Static" /></section>`

afterEach(closeBrowser)

describe.each([false, true])('shared Image source (minify=%s)', (minify) => {
  it('updates and clears the physical native image, preserves identity and survives remount', async () => {
    const { code } = await compileNativeScreen(source, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const photo = () => phone.byTestID('photo')!
      const probe = phone.context.probe
      expect(photo().type).toBe('Image')
      expect(photo().props.source).toBe('/first.png')
      expect(phone.byTestID('static')!.props.source).toBe('/static.png')
      const responsiveId = phone.byTestID('responsive')!.id
      for (const value of ['/different.png 200w, /larger.png 2000w', null, '']) {
        probe.candidates.set(value)
        probe.size.set(value ? '100vw' : value)
        await phone.settle()
        expect(phone.byTestID('responsive')!.id).toBe(responsiveId)
        expect(phone.byTestID('responsive')!.props.source).toBe('/first.png')
      }
      const id = photo().id
      probe.url.set('/second.png')
      await phone.settle()
      expect(photo().id).toBe(id)
      expect(photo().props.source).toBe('/second.png')
      expect(phone.byTestID('responsive')!.props.source).toBe('/second.png')
      for (const empty of ['', null]) {
        probe.url.set('/before-clear.png')
        await phone.settle()
        probe.url.set(empty)
        await phone.settle()
        expect(photo().props.source).toBeNull()
        expect(phone.byTestID('dynamic')!.props.source).toBeNull()
        expect(phone.byTestID('responsive')!.props.source).toBeNull()
      }
      probe.shown.set(false)
      await phone.settle()
      expect(photo()).toBeUndefined()
      probe.url.set('/remounted.png')
      probe.shown.set(true)
      await phone.settle()
      expect(photo().props.source).toBe('/remounted.png')
      expect(phone.mutationErrors).toEqual([])
      phone.unmount()
      const count = phone.messages.length
      probe.url.set('/disposed.png')
      probe.candidates.set('/disposed-candidate.png 1x')
      probe.size.set('75vw')
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
    }
    finally { phone.unmount() }
  }, 30_000)

  it('takes the native source under either shape, typed payload or reflected JSON', async () => {
    // The parent binding hands the caller's real value to the component, so a
    // `{ uri }` payload stays an object, while the attribute it also reflects
    // carries that object as JSON. useReactiveProp's `parse` is not applied to
    // the typed value -- that is what typed delivery is for -- so a component
    // normalising a prop has to do it where it reads it. Reading this one with
    // String() gave every such image the URL "[object Object]".
    const legacy = `@import('Image', '${image}')
<script client>
const payload = state({ uri: '/one.png' })
const plain = state('/plain.png')
window.probe = { payload, plain }
</script><section>
<Image testID="payload" :source="payload" alt="Payload" resizeMode="contain" />
<Image testID="plain" :source="plain" alt="Plain" resizeMode="cover" />
<Image testID="fixed" source="/fixed.png" alt="Fixed" resizeMode="stretch" />
</section>`
    const { code } = await compileNativeScreen(legacy, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const sourceOf = (id: string): unknown => phone.byTestID(id)!.props.source
      expect(sourceOf('payload')).toBe('/one.png')
      expect(sourceOf('plain')).toBe('/plain.png')
      expect(sourceOf('fixed')).toBe('/fixed.png')
      // resizeMode drove the fit on each, under the native name.
      expect(phone.byTestID('payload')!.style.objectFit).toBe('contain')
      expect(phone.byTestID('plain')!.style.objectFit).toBe('cover')
      expect(phone.byTestID('fixed')!.style.objectFit).toBe('fill')
      // A replacement payload is followed, and identity is kept across it.
      const id = phone.byTestID('payload')!.id
      phone.context.probe.payload.set({ uri: '/two.png' })
      phone.context.probe.plain.set('/second-plain.png')
      await phone.settle()
      expect(phone.byTestID('payload')!.id).toBe(id)
      expect(sourceOf('payload')).toBe('/two.png')
      expect(sourceOf('plain')).toBe('/second-plain.png')
      // An emptied payload clears the image rather than painting "undefined".
      for (const empty of [{ uri: '' }, {}, null]) {
        phone.context.probe.payload.set(empty)
        await phone.settle()
        expect(sourceOf('payload')).toBeNull()
      }
      phone.context.probe.payload.set({ uri: '/back.png' })
      await phone.settle()
      expect(sourceOf('payload')).toBe('/back.png')
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)

  it('preserves initial browser candidates, drops stale ones on changes, and restores them with the original URL', async () => {
    const root = createTempDir('stx-shared-image-')
    try {
      const dependencies = new Set<string>()
      const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'Screen.stx'), {
        ...defaultConfig, root, cache: false, buildMode: undefined, debug: !minify,
      }, dependencies)
      expect(dependencies.has(image)).toBe(true) // not the builtin Image alias
      expect(html.includes('src="/static.png"')).toBe(true) // still useful without hydration
      const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
      await settle()
      const photo = () => find(browser, '.photo img')
      const candidate = () => find(browser, '.photo source')
      const probe = browser.window.probe
      const original = photo()
      expect(original.getAttribute('src')).toBe('/first.png')
      expect(original.getAttribute('srcset')).toBe('/first.png 1x, /first-large.png 2x')
      expect(candidate().getAttribute('srcset')).toBe('/first.webp')
      expect(find(browser, '.static img').getAttribute('src')).toBe('/static.png')
      probe.url.set('/second.png')
      await settle()
      expect(photo()).toBe(original)
      expect(photo().getAttribute('src')).toBe('/second.png')
      expect(photo().hasAttribute('srcset')).toBe(false)
      expect(candidate().hasAttribute('srcset')).toBe(false)
      for (const empty of ['', null]) {
        probe.url.set('/before-clear.png')
        await settle()
        probe.url.set(empty)
        await settle()
        expect(photo().hasAttribute('src')).toBe(false)
        expect(photo().hasAttribute('srcset')).toBe(false)
        expect(candidate().hasAttribute('srcset')).toBe(false)
        expect(find(browser, '.dynamic img').hasAttribute('src')).toBe(false)
      }
      probe.url.set('/first.png')
      await settle()
      expect(photo().getAttribute('srcset')).toBe('/first.png 1x, /first-large.png 2x')
      expect(candidate().getAttribute('srcset')).toBe('/first.webp')
      probe.shown.set(false)
      await settle()
      probe.url.set('/remounted.png')
      probe.shown.set(true)
      await settle()
      expect(photo().getAttribute('src')).toBe('/remounted.png')
      expect(photo().hasAttribute('srcset')).toBe(false)
      expect(browser.errors).toEqual([])
    }
    finally {
      closeBrowser()
      await rm(root, { recursive: true, force: true })
    }
  }, 30_000)
})
