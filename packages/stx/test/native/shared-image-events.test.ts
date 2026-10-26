import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')
const source = `@import('Image', '${image}')
<script client>
const url = state(null)
const shown = state(true)
window.probe = { url, shown, loads: [], errors: [] }
</script><section><div :if="shown">
<Image testID="photo" className="photo" :src="url" alt="Photo"
  @load="window.probe.loads.push($event)" @error="window.probe.errors.push($event)" />
</div></section>`

it.each([false, true])('forwards shared native Image load/error payloads once and stops stale callbacks (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(source, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const photo = () => phone.byTestID('photo')!
    const probe = phone.context.probe
    probe.url.set('/photo.png')
    await phone.settle()
    phone.press(photo(), 'onLoad', { marker: 'first', source: { width: 64, height: 32 } })
    phone.press(photo(), 'onError', { marker: 'failed', error: { message: 'Missing' } })
    expect(probe.loads).toHaveLength(1)
    expect(probe.loads[0]).toMatchObject({ marker: 'first', source: { width: 64, height: 32 } })
    expect(probe.errors).toHaveLength(1)
    expect(probe.errors[0]).toMatchObject({ marker: 'failed', error: { message: 'Missing' } })
    const old = photo()
    probe.shown.set(false)
    await phone.settle()
    phone.press(old, 'onLoad', { marker: 'stale' })
    phone.press(old, 'onError', { marker: 'stale' })
    expect(probe.loads).toHaveLength(1)
    expect(probe.errors).toHaveLength(1)
    probe.shown.set(true)
    await phone.settle()
    phone.press(photo(), 'onLoad', { marker: 'again' })
    expect(probe.loads.map((event: any) => event.marker)).toEqual(['first', 'again'])
    expect(phone.mutationErrors).toEqual([])
    const removed = photo()
    phone.unmount()
    const count = phone.messages.length
    phone.press(removed, 'onLoad', {})
    phone.press(removed, 'onError', {})
    expect(probe.loads).toHaveLength(2)
    expect(probe.errors).toHaveLength(1)
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)

it('forwards real browser image load/error events, preserving the original event and physical target', async () => {
  const root = join(import.meta.dir, '../../../components')
  const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'image-events.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const png = await encode({ data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, channels: 4 }, 'png')
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => {
    const path = new URL(request.url).pathname
    return path === '/' ? new Response(html, { headers: { 'Content-Type': 'text/html' } })
      : path.startsWith('/good') ? new Response(png, { headers: { 'Content-Type': 'image/png' } })
        : new Response('', { status: 404 })
  } })
  const view = new WebView({ headless: true })
  const waitFor = async (expression: string) => {
    for (let i = 0; i < 150; i++) {
      if (await view.evaluate(expression)) return
      await Bun.sleep(20)
    }
    expect(await view.evaluate(expression)).toBe(true)
  }
  try {
    await view.navigate(server.url.href)
    await waitFor(`!!(window.probe && document.querySelector('.photo img'))`)
    await view.evaluate(`(() => {
      const img = document.querySelector('.photo img'); window.oldImage = img;
      img.addEventListener('load', e => window.actualLoad = e);
      img.addEventListener('error', e => window.actualError = e);
      window.probe.url.set('/good.png');
    })()`)
    await waitFor(`window.probe.loads.length === 1`)
    expect(await view.evaluate(`window.probe.loads[0] === window.actualLoad && window.probe.loads[0].target === window.oldImage && window.oldImage.naturalWidth === 1`)).toBe(true)
    expect(await view.evaluate(`window.probe.errors.length`)).toBe(0)
    await view.evaluate(`window.probe.url.set('/missing.png')`)
    await waitFor(`window.probe.errors.length === 1`)
    expect(await view.evaluate(`({ same: window.probe.errors[0] === window.actualError, target: window.probe.errors[0].target === window.oldImage, type: window.probe.errors[0].type })`)).toEqual({ same: true, target: true, type: 'error' })
    await view.evaluate(`window.probe.shown.set(false)`)
    await waitFor(`!document.querySelector('.photo img')`)
    await view.evaluate(`(() => { window.oldImage.dispatchEvent(new Event('load')); window.oldImage.dispatchEvent(new Event('error')) })()`)
    expect(await view.evaluate(`window.probe.loads.length === 1 && window.probe.errors.length === 1`)).toBe(true)
    await view.evaluate(`(() => { window.probe.url.set(null); window.probe.shown.set(true) })()`)
    await waitFor(`!!document.querySelector('.photo img')`)
    await view.evaluate(`window.probe.url.set('/good-again.png')`)
    await waitFor(`window.probe.loads.length === 2`)
    expect(await view.evaluate(`window.probe.errors.length === 1`)).toBe(true)
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
