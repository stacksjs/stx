import type { ImageDeliveryManifest } from 'ts-images/delivery'
// Seed the same module the component's server script imports, not a source-only copy.
import { clearImagePlaceholders, setImagePlaceholder } from '@stacksjs/stx'
import { WebView } from 'bun'
import { afterEach, beforeEach, expect, it } from 'bun:test'
import { join } from 'node:path'
import { installImageDelivery, snapshotImageDelivery } from '../../stx/src/builtins/image-delivery'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const root = join(import.meta.dir, '..')
const image = join(root, 'src/ui/image/Image.stx')
const src = '/reactive-placeholder.png'
const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYFEAAAAASUVORK5CYII='
const fallback: ImageDeliveryManifest['fallback'] = { path: '/unused.png', url: '/_stx/images/placeholder.png', width: 1, height: 1, bytes: 100, format: 'png', mimeType: 'image/png', cacheKey: 'placeholder-test' }
const manifest: ImageDeliveryManifest = { source: { width: 1, height: 1, hash: 'placeholder-test' }, variants: [fallback],
  sources: { png: `${fallback.url} 1w` }, fallback, placeholder: { hash: 'preview-test', dataUrl: preview } }
let previous: ReturnType<typeof snapshotImageDelivery>
beforeEach(() => {
  previous = snapshotImageDelivery()
  installImageDelivery({ entries: [[src, manifest]], transparent: [] })
  setImagePlaceholder(src, { dataUrl: preview, color: '#654321', transparent: false })
})
afterEach(() => { installImageDelivery(previous); clearImagePlaceholders() })

async function boot(authored: string | undefined) {
  const html = await processDirectives(`@import('Image', '${image}')
<!doctype html><html><head><style>.photo { background: rgb(9, 8, 7) }</style></head><body><script client>
const mode = state(${JSON.stringify(authored)})
const color = state('#123456')
const url = state('${src}')
const candidates = state(undefined)
const shown = state(true)
window.probe = { mode, color, url, candidates, shown }
</script><section><div :if="shown">
<Image className="photo" src="${src}" :src="url" :srcSet="candidates" alt="Photo"
  ${authored ? `placeholder="${authored}"` : ''} placeholderColor="#123456" :placeholder="mode" :placeholderColor="color" />
</div></section></body></html>`, {}, join(root, 'image-placeholder.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView({ headless: true, backend: process.env.STX_IMAGE_BROWSER === 'chrome' ? { type: 'chrome', url: false } : undefined })
  const snapshot = () => view.evaluate(`(() => {
    if (!window.probe) return null;
    const img = document.querySelector('.photo img');
    if (!img) return null;
    const frame = img.closest('picture'), style = getComputedStyle(frame);
    return { color: style.backgroundColor, preview: style.backgroundImage.includes(${JSON.stringify(preview)}),
      custom: style.backgroundImage.includes('/custom-preview.png'), gradient: style.backgroundImage.includes('linear-gradient('),
      noImage: style.backgroundImage === 'none', inline: frame.style.background, imageBackground: getComputedStyle(img).backgroundColor,
      same: img === window.initialImage, sameFrame: frame === window.initialFrame,
      src: img.getAttribute('src'), candidates: img.getAttribute('srcset') };
  })()`)
  const selected = async (expected: Record<string, unknown> | null) => {
    for (let i = 0; i < 150; i++) {
      const actual = await snapshot() as Record<string, unknown> | null
      if (expected === null ? actual === null : actual && Object.entries(expected).every(([key, value]) => actual[key] === value)) {
        if (expected === null) expect(actual).toBeNull()
        else expect(actual).toMatchObject(expected)
        return
      }
      await Bun.sleep(20)
    }
    if (expected === null) expect(await snapshot()).toBeNull()
    else expect(await snapshot()).toMatchObject(expected)
  }
  const set = (key: string, value: unknown) => view.evaluate(`window.probe.${key}.set(${JSON.stringify(value)})`)
  return { html, url: server.url.href, view, selected, set, snapshot, close() { view.close(); server.stop(true) } }
}

it.each([undefined, 'color'])('updates Image placeholder modes/colors, defaults and retained remounts (authored=%s)', async (authored) => {
  const browser = await boot(authored)
  const { html, view, set, selected, snapshot } = browser
  const clear = { inline: '', noImage: true, color: 'rgb(9, 8, 7)' }
  const retained = { same: true, sameFrame: true, imageBackground: 'rgba(0, 0, 0, 0)' }
  try {
    const frame = html.match(/<picture\b[^>]*>/)![0]
    expect(frame).toContain(authored ? 'background: #123456' : 'data:image/png;base64,')
    await view.navigate(browser.url)
    await selected(authored ? { color: 'rgb(18, 52, 86)', noImage: true } : { preview: true })
    await view.evaluate(`(() => { window.initialImage = document.querySelector('.photo img'); window.initialFrame = document.querySelector('.photo') })()`)
    await set('mode', 'color')
    await selected({ color: 'rgb(18, 52, 86)', noImage: true, ...retained })
    await set('color', '#abcdef')
    await selected({ color: 'rgb(171, 205, 239)', ...retained })
    for (const value of [null, '']) {
      await set('color', value)
      await selected({ color: 'rgb(101, 67, 33)', ...retained })
      await set('color', undefined)
      await selected({ color: 'rgb(18, 52, 86)', ...retained })
    }
    for (const value of ['blur', 'thumbhash']) {
      await set('mode', value)
      await selected({ preview: true, ...retained })
    }
    for (const value of ['none', 'empty']) {
      await set('mode', value)
      await selected({ ...clear, ...retained })
    }
    await set('mode', '/custom-preview.png')
    await selected({ custom: true, preview: false, ...retained })
    await set('mode', 'linear-gradient(red, blue)')
    await selected({ gradient: true, custom: false, ...retained })
    await set('mode', '#112233')
    await selected({ color: 'rgb(17, 34, 51)', noImage: true, ...retained })
    for (const value of [null, '']) {
      await set('mode', value)
      await selected({ preview: true, ...retained })
    }
    await set('mode', undefined)
    await selected({ ...(authored ? { color: 'rgb(18, 52, 86)' } : { preview: true }), ...retained })
    await set('mode', 'blur')
    await selected({ preview: true })
    await set('url', '/replacement.png')
    await selected({ inline: 'none', preview: false, src: '/replacement.png', candidates: null, ...retained })
    await set('color', '#fedcba')
    await selected({ inline: 'none', ...retained })
    await set('url', src)
    await selected({ preview: true, src: fallback.url, candidates: manifest.sources.png, ...retained })
    await set('candidates', '/other.png 1w')
    await selected({ inline: 'none', preview: false, ...retained })
    await set('candidates', undefined)
    await selected({ preview: true, ...retained })
    for (const [mode, color, expected] of [
      ['none', '#fedcba', clear],
      ['color', null, { color: 'rgb(101, 67, 33)', noImage: true }],
      [undefined, undefined, authored ? { color: 'rgb(18, 52, 86)', noImage: true } : { preview: true }],
    ] as const) {
      await set('shown', false)
      await selected(null)
      await set('mode', mode)
      await set('color', color)
      await set('shown', true)
      await selected({ ...expected, ...retained })
    }
    expect(await snapshot()).toMatchObject({ src: fallback.url, candidates: manifest.sources.png, ...retained })
  }
  finally { browser.close() }
}, 30_000)

it('does not paint automatic modes behind transparent images, including after remount', async () => {
  installImageDelivery({ entries: [[src, manifest]], transparent: [src] })
  setImagePlaceholder(src, { dataUrl: preview, color: '#654321', transparent: true })
  const browser = await boot('color')
  const { view, set, selected } = browser
  const clear = { inline: '', color: 'rgb(9, 8, 7)', noImage: true, imageBackground: 'rgba(0, 0, 0, 0)' }
  try {
    expect(browser.html.match(/<picture\b[^>]*>/)![0]).not.toContain('background:')
    await view.navigate(browser.url)
    await selected(clear)
    await view.evaluate(`(() => { window.initialImage = document.querySelector('.photo img'); window.initialFrame = document.querySelector('.photo') })()`)
    for (const mode of ['color', 'blur', 'thumbhash', 'none', null, '', undefined]) {
      await set('mode', mode)
      await set('color', '#fedcba')
      await selected({ ...clear, same: true, sameFrame: true })
    }
    // A caller's explicit CSS background is still intentional, even for alpha.
    await set('mode', '#112233')
    await selected({ color: 'rgb(17, 34, 51)', same: true })
    await set('shown', false)
    await selected(null)
    await set('mode', 'blur')
    await set('shown', true)
    await selected({ ...clear, same: true, sameFrame: true })
  }
  finally { browser.close() }
}, 30_000)

it('uses the neutral fallback without prepared metadata and restores authored color after remount', async () => {
  installImageDelivery({ entries: [], transparent: [] })
  clearImagePlaceholders()
  const browser = await boot('color')
  const { view, set, selected } = browser
  try {
    await view.navigate(browser.url)
    await selected({ color: 'rgb(18, 52, 86)', noImage: true })
    await view.evaluate(`window.initialImage = document.querySelector('.photo img')`)
    await set('color', null)
    await selected({ color: 'rgb(229, 231, 235)', noImage: true, same: true })
    for (const value of ['blur', 'thumbhash']) {
      await set('mode', value)
      await selected({ color: 'rgb(229, 231, 235)', noImage: true, same: true })
    }
    await set('shown', false)
    await selected(null)
    await set('mode', undefined)
    await set('color', undefined)
    await set('shown', true)
    await selected({ color: 'rgb(18, 52, 86)', noImage: true, same: true })
    await set('mode', '')
    await selected({ color: 'rgb(9, 8, 7)', inline: '', same: true })
  }
  finally { browser.close() }
}, 30_000)
