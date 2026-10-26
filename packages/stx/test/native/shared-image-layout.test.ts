import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')
const source = `@import('Image', '${image}')
<script client>
const width = state(120)
const height = state(80)
const ratio = state('3/2')
const position = state('right top')
const primary = state('')
const shown = state(true)
window.probe = { width, height, ratio, position, primary, shown }
</script><section><div :if="shown">
<Image testID="photo" className="photo" src="/photo.png" alt="Photo"
  width="100" height="100" :width="width" :height="height" :aspectRatio="ratio"
  :position="position" :objectPosition="primary" />
</div><Image className="static" src="/static.png" alt="Static" width="64" height="32" objectPosition="left bottom" /></section>`

it.each([false, true])('updates shared native Image dimensions and frame ratio without replacing its host (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(source, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const photo = () => phone.byTestID('photo')!
    const frames = () => phone.ofType('View').filter(node => node.style.aspectRatio != null)
    const probe = phone.context.probe
    const id = photo().id
    expect(photo().props).toMatchObject({ width: 120, height: 80, source: '/photo.png' })
    expect(frames().map(node => node.style.aspectRatio)).toEqual([1.5])
    probe.width.set(240)
    probe.height.set(160)
    probe.ratio.set('9 / 16')
    await phone.settle()
    expect(photo().id).toBe(id)
    expect(photo().props).toMatchObject({ width: 240, height: 160 })
    expect(frames().map(node => node.style.aspectRatio)).toEqual([9 / 16])
    for (const value of [null, '', '1/0', '-1', 'bogus']) {
      probe.ratio.set(value)
      await phone.settle()
      expect(frames()).toEqual([])
    }
    probe.width.set(null)
    probe.height.set(null)
    await phone.settle()
    expect(photo().props.width).toBeNull()
    expect(photo().props.height).toBeNull()
    probe.shown.set(false)
    await phone.settle()
    expect(photo()).toBeUndefined()
    probe.ratio.set(2)
    probe.width.set(200)
    probe.height.set(100)
    probe.shown.set(true)
    await phone.settle()
    expect(photo().id).toBe(id)
    expect(photo().props).toMatchObject({ width: 200, height: 100 })
    expect(frames().map(node => node.style.aspectRatio)).toEqual([2])
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.width.set(300)
    probe.ratio.set(3)
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)

it('updates actual browser Image dimensions, position aliases and frame ratio across clearing and remount', async () => {
  const root = join(import.meta.dir, '../../../components')
  const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'image-layout.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  expect(html).toContain('width="64"')
  expect(html).toContain('object-position: left bottom')
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView({ headless: true })
  const snapshot = () => view.evaluate(`(() => {
    const img = document.querySelector('.photo img');
    if (!img) return null;
    const frame = img.closest('picture');
    return { width: img.getAttribute('width'), height: img.getAttribute('height'),
      position: getComputedStyle(img).objectPosition, ratio: getComputedStyle(frame).aspectRatio,
      same: img === window.initialImage, fit: getComputedStyle(img).objectFit,
      source: img.getAttribute('src'), display: getComputedStyle(frame).display };
  })()`)
  const waitFor = async (expected: Record<string, unknown> | null) => {
    for (let i = 0; i < 150; i++) {
      const current = await snapshot() as Record<string, unknown> | null
      if (expected === null ? current === null : current && Object.entries(expected).every(([key, value]) => current[key] === value)) return current
      await Bun.sleep(20)
    }
    if (expected === null) expect(await snapshot()).toBeNull()
    else expect(await snapshot()).toMatchObject(expected)
  }
  try {
    await view.navigate(server.url.href)
    await waitFor({ width: '120', height: '80', position: '100% 0%', ratio: '3 / 2' })
    await view.evaluate(`window.initialImage = document.querySelector('.photo img')`)
    await view.evaluate(`(() => { window.probe.width.set(240); window.probe.height.set(160); window.probe.ratio.set('9/16'); window.probe.primary.set('left bottom') })()`)
    await waitFor({ width: '240', height: '160', position: '0% 100%', ratio: '9 / 16', same: true, fit: 'cover', source: '/photo.png', display: 'block' })
    await view.evaluate(`window.probe.position.set('25% 75%')`)
    await waitFor({ position: '0% 100%' })
    await view.evaluate(`window.probe.primary.set(null)`)
    await waitFor({ position: '25% 75%' })
    await view.evaluate(`(() => { window.probe.position.set(null); window.probe.width.set(null); window.probe.height.set(null); window.probe.ratio.set(null) })()`)
    await waitFor({ width: null, height: null, ratio: 'auto', position: '50% 50%' })
    await view.evaluate(`window.probe.shown.set(false)`)
    await waitFor(null)
    await view.evaluate(`(() => { window.probe.ratio.set(2); window.probe.width.set(200); window.probe.height.set(100); window.probe.position.set('right'); window.probe.shown.set(true) })()`)
    await waitFor({ width: '200', height: '100', position: '100% 50%', ratio: '2 / 1' })
    expect(await view.evaluate(`document.querySelector('.static img').getAttribute('width')`)).toBe('64')
    expect(await view.evaluate(`getComputedStyle(document.querySelector('.static img')).objectPosition`)).toBe('0% 100%')
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
