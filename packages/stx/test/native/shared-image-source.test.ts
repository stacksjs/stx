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
const shown = state(true)
window.probe = { url, shown }
</script><section><div :if="shown">
<Image testID="photo" className="photo" src="/first.png" :src="url" alt="Photo"
  webpSrc="/first.webp" srcSet="/first.png 1x, /first-large.png 2x" />
</div><Image testID="dynamic" className="dynamic" :src="url" alt="Dynamic" />
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
      const id = photo().id
      probe.url.set('/second.png')
      await phone.settle()
      expect(photo().id).toBe(id)
      expect(photo().props.source).toBe('/second.png')
      for (const empty of ['', null]) {
        probe.url.set('/before-clear.png')
        await phone.settle()
        probe.url.set(empty)
        await phone.settle()
        expect(photo().props.source).toBeNull()
        expect(phone.byTestID('dynamic')!.props.source).toBeNull()
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
      await phone.settle()
      expect(phone.messages).toHaveLength(count)
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
