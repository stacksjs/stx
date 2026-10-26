import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

it.each(['srcSet', 'srcset'])('selects live %s candidates and sizes in a real browser without stale picture sources', async (prop) => {
  const root = join(import.meta.dir, '..')
  const image = join(root, 'src/ui/image/Image.stx')
  const html = await processDirectives(`@import('Image', '${image}')
<!doctype html><html><head></head><body><script client>
const url = state('/fallback.png')
const candidates = state('/small.png 200w, /large.png 2000w')
const size = state('1px')
const shown = state(true)
window.probe = { url, candidates, size, shown }
</script><section><div :if="shown">
<Image className="photo" src="/fallback.png" :src="url" alt="Photo" loading="eager"
  ${prop}="/initial.png 200w" :${prop}="candidates" sizes="10px" :sizes="size"
  :sources="[{ type: 'image/png', srcset: '/initial-source.png 200w', sizes: '25px' }]"
  webpSrc="/initial.webp" />
</div></section></body></html>`, {}, join(root, 'image-responsive.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  expect(html).toContain('srcset="/initial.png 200w"')
  expect(html).toContain('sizes="10px"')
  const pixels = (width: number) => new Uint8Array(width * 4).fill(255)
  const small = await encode({ data: pixels(200), width: 200, height: 1, channels: 4 }, 'png')
  const large = await encode({ data: pixels(2000), width: 2000, height: 1, channels: 4 }, 'png')
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => {
    const path = new URL(request.url).pathname
    return path === '/' ? new Response(html, { headers: { 'Content-Type': 'text/html' } })
      : new Response(path.includes('large') ? large : small, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } })
  } })
  const view = new WebView({ headless: true, backend: process.env.STX_IMAGE_BROWSER === 'chrome' ? { type: 'chrome', url: false } : undefined })
  const snapshot = () => view.evaluate(`(() => {
    const img = document.querySelector('.photo img');
    if (!img) return null;
    return { selected: img.currentSrc ? new URL(img.currentSrc).pathname : '',
      decoded: img.complete && img.naturalWidth > 0, candidates: img.getAttribute('srcset'), sizes: img.getAttribute('sizes'),
      sources: [...img.closest('picture').querySelectorAll('source')].map(s => s.getAttribute('srcset')),
      sourceSizes: [...img.closest('picture').querySelectorAll('source')].map(s => s.getAttribute('sizes')) };
  })()`)
  const selected = async (expected: Record<string, unknown> | null) => {
    for (let i = 0; i < 150; i++) {
      const actual = await snapshot() as Record<string, unknown> | null
      if (JSON.stringify(expected === null ? actual : Object.fromEntries(Object.keys(expected).map(key => [key, actual?.[key]]))) === JSON.stringify(expected)) return actual
      await Bun.sleep(20)
    }
    if (expected === null) expect(await snapshot()).toBeNull()
    else expect(await snapshot()).toMatchObject(expected)
  }
  try {
    await view.navigate(server.url.href)
    await selected({ selected: '/small.png', decoded: true, sizes: '1px', sources: [null, null], sourceSizes: ['25px', '1px'] })
    await view.evaluate(`(() => { window.originalImage = document.querySelector('.photo img'); window.probe.size.set('10000px') })()`)
    await selected({ selected: '/large.png', decoded: true, sizes: '10000px', sourceSizes: ['25px', '10000px'] })
    await view.evaluate(`(() => { window.probe.url.set('/replacement.png'); window.probe.candidates.set('/replacement-small.png 200w, /replacement-large.png 2000w'); window.probe.size.set('1px') })()`)
    await selected({ selected: '/replacement-small.png', decoded: true, sources: [null, null] })
    expect(await view.evaluate(`document.querySelector('.photo img') === window.originalImage`)).toBe(true)
    for (const value of [null, '']) {
      await view.evaluate(`(() => { window.probe.candidates.set(${JSON.stringify(value)}); window.probe.size.set(${JSON.stringify(value)}) })()`)
      await selected({ selected: '/replacement.png', decoded: true, candidates: null, sizes: null })
    }
    await view.evaluate(`(() => { window.probe.url.set('/fallback.png'); window.probe.candidates.set('/initial.png 200w'); window.probe.size.set('1px') })()`)
    await selected({ selected: '/initial-source.png', decoded: true, sources: ['/initial-source.png 200w', '/initial.webp'] })
    await view.evaluate(`window.probe.shown.set(false)`)
    await selected(null)
    await view.evaluate(`(() => { window.probe.candidates.set('/remount-small.png 200w'); window.probe.shown.set(true) })()`)
    await selected({ selected: '/remount-small.png', decoded: true, sources: [null, null] })
    await view.evaluate(`window.probe.url.set(null)`)
    await selected({ selected: '', candidates: null, sources: [null, null] })
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
