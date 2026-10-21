/**
 * The library `<Image>` serves the optimized variants stx prepared.
 *
 * stx encodes every local raster under the public directory into AVIF and
 * WebP at several widths, and its builtin `<StxImage>` reads that catalog. This
 * component did not. Once stx began registering this package by itself
 * whenever it is installed (#2011), a bare `<Image>` resolved here instead of
 * to the builtin, and an app's images went out as the original full-size JPEGs
 * with no modern format on offer. Nothing failed; pages just got heavier.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { encode } from 'ts-images'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { clearImageDeliveryCatalog, prepareImageDelivery } from '../../stx/src/builtins/image-delivery'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'
import { createTempDir } from '../../stx/src/temp-dir'
import { boot, closeBrowser, find, settle } from '../../stx/test/router/spa-harness'

const ROOT = path.resolve(import.meta.dir, '..')
const IMAGE_DIR = path.join(ROOT, 'src/ui/image')

async function render(markup: string): Promise<string> {
  return processDirectives(
    markup,
    {},
    path.join(ROOT, 'image-delivery.stx'),
    { componentsDir: IMAGE_DIR, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

describe('<Image> with a prepared delivery catalog', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = createTempDir('stx-components-image-')
    const publicDir = path.join(tempDir, 'public')
    await mkdir(path.join(publicDir, 'images'), { recursive: true })

    // Noisy enough that the modern formats come out smaller than the PNG
    // fallback, which is when stx offers them at all.
    const width = 64
    const height = 32
    const pixels = new Uint8Array(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4
        pixels[offset] = (x * 7 + y * 3) % 256
        pixels[offset + 1] = (x * 2 + y * 11) % 256
        pixels[offset + 2] = (x * 13 + y * 5) % 256
        pixels[offset + 3] = 255
      }
    }
    await writeFile(path.join(publicDir, 'images', 'hero.png'), await encode({ data: pixels, width, height, channels: 4 }, 'png'))

    const prepared = await prepareImageDelivery(publicDir, path.join(tempDir, 'dist'))
    expect(prepared.count).toBe(1)
  })

  afterAll(async () => {
    clearImageDeliveryCatalog()
    await rm(tempDir, { recursive: true, force: true })
  })

  it('renders the delivered variants inside its own frame', async () => {
    const html = await render('<Image src="/images/hero.png" alt="Hero" sizes="50vw" />')

    // Still this component's markup, not the builtin's.
    expect(html).toContain('<picture class="" style="position: relative')
    expect(html).toMatch(/<source\s+type="image\/(avif|webp)"\s+srcset="\/_stx\/images\/images-hero-[^"]+\.(avif|webp) \d+w/)
    expect(html).toMatch(/<img\s+src="\/_stx\/images\/images-hero-[^"]+\.png"/)
    expect(html).toMatch(/srcset="\/_stx\/images\/images-hero-[^"]+\.png \d+w/)
    expect(html).toContain('sizes="50vw"')
    // The catalog knows the intrinsic size, so the <img> reserves its space.
    expect(html).toContain('width="64"')
    expect(html).toContain('height="32"')
    // The image's own preview, painted behind it while it loads.
    expect(html).toContain('url(&quot;data:image/bmp;base64,')
  })

  it('leaves sources the caller wrote alone', async () => {
    const html = await render('<Image src="/images/hero.png" srcSet="/a.png 1x, /b.png 2x" alt="Hero" />')

    expect(html).not.toContain('/_stx/images/')
    expect(html).not.toContain('<source')
    expect(html).toMatch(/<img\s+src="\/images\/hero\.png"/)
    expect(html).toContain('srcset="/a.png 1x, /b.png 2x"')
  })

  it('renders an image outside the catalog as it always did', async () => {
    const html = await render('<Image src="/images/elsewhere.jpg" alt="Elsewhere" />')

    expect(html).not.toContain('/_stx/images/')
    expect(html).not.toContain('<source')
    expect(html).not.toContain('sizes=')
    expect(html).toMatch(/<img\s+src="\/images\/elsewhere\.jpg"/)
  })

  it('keeps optimized candidates on hydration and restores them only for their original image', async () => {
    const html = await processDirectives(`@import('Image', '${path.join(IMAGE_DIR, 'Image.stx')}')
<!doctype html><html><head></head><body>
<script client>
const url = state('/images/hero.png')
window.probe = { url }
</script>
<section><Image src="/images/hero.png" :src="url" alt="Hero" sizes="50vw" /></section>
</body></html>`, {}, path.join(ROOT, 'image-delivery.stx'), { ...defaultConfig, componentsDir: IMAGE_DIR, root: ROOT, cache: false, debug: false }, new Set())
    try {
      const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
      await settle()
      const image = find(browser, 'picture img')
      const sources = Array.from(browser.document.querySelectorAll('picture source'))
      const optimized = image.getAttribute('src')
      const candidates = image.getAttribute('srcset')
      const sourceCandidates = sources.map(source => source.getAttribute('srcset'))
      const picture = find(browser, 'picture')
      const preview = picture.style.background
      expect(preview).toContain('data:image/')
      expect(optimized).toMatch(/^\/_stx\/images\/.+\.png$/)
      expect(candidates).toContain('/_stx/images/')
      expect(sourceCandidates.length).toBeGreaterThan(0)
      expect(sourceCandidates.every(value => value?.includes('/_stx/images/'))).toBe(true)
      browser.window.probe.url.set('/images/replacement.png')
      await settle()
      expect(image.getAttribute('src')).toBe('/images/replacement.png')
      expect(image.hasAttribute('srcset')).toBe(false)
      expect(sources.every(source => !source.hasAttribute('srcset'))).toBe(true)
      expect(picture.style.background).toBe('none')
      browser.window.probe.url.set('/images/hero.png')
      await settle()
      expect(image.getAttribute('src')).toBe(optimized)
      expect(image.getAttribute('srcset')).toBe(candidates)
      expect(sources.map(source => source.getAttribute('srcset'))).toEqual(sourceCandidates)
      expect(picture.style.background).toBe(preview)
      expect(browser.errors).toEqual([])
    }
    finally { closeBrowser() }
  }, 30_000)
})
