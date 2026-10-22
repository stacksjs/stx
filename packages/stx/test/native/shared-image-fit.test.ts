import { WebView } from 'bun'
import { expect, it, spyOn } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')
const source = `@import('Image', '${image}')
<script client>
const fit = state('contain')
const primary = state('')
const shown = state(true)
window.probe = { fit, primary, shown }
</script><section><div :if="shown">
<Image testID="photo" className="photo" src="/photo.png" alt="Photo" :fit="fit" :objectFit="primary" />
</div><Image testID="static" className="static" src="/photo.png" alt="Static" objectFit="fill" /></section>`

it.each([false, true])('updates shared native Image fit, precedence, defaults and lifecycle (minify=%s)', async (minify) => {
  const { code, diagnostics } = await compileNativeScreen(source, { minify })
  expect(diagnostics.filter(item => item.message.includes('objectFit'))).toEqual([])
  const phone = mountNativeScreen(code)
  const warnings: string[] = []
  const warning = spyOn(console, 'warn').mockImplementation((...args) => { warnings.push(args.join(' ')) })
  try {
    await phone.settle()
    const photo = () => phone.byTestID('photo')!
    const probe = phone.context.probe
    const id = photo().id
    expect(photo().type).toBe('Image')
    expect(photo().style.resizeMode).toBe('contain')
    expect(phone.byTestID('static')!.style.resizeMode).toBe('stretch')
    for (const [fit, mode] of [['cover', 'cover'], ['fill', 'stretch'], ['none', 'center'], ['contain', 'contain']]) {
      probe.fit.set(fit)
      await phone.settle()
      expect(photo().id).toBe(id)
      expect(photo().style.resizeMode).toBe(mode)
      expect(photo().props.source).toBe('/photo.png')
    }
    probe.primary.set('fill')
    probe.fit.set('none')
    await phone.settle()
    expect(photo().style.resizeMode).toBe('stretch')
    probe.primary.set('scale-down')
    await phone.settle()
    expect(warnings.some(message => message.includes('unknown-style') && message.includes('objectFit:scale-down'))).toBe(true)
    // Unsupported bindings are omitted; the authored cover default survives.
    expect(photo().style.resizeMode).toBe('cover')
    probe.primary.set(null)
    await phone.settle()
    expect(photo().style.resizeMode).toBe('center')
    probe.fit.set(null)
    await phone.settle()
    expect(photo().style.resizeMode).toBe('cover')
    probe.shown.set(false)
    await phone.settle()
    expect(photo()).toBeUndefined()
    probe.fit.set('contain')
    probe.shown.set(true)
    await phone.settle()
    expect(photo().style.resizeMode).toBe('contain')
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.fit.set('fill')
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount(); warning.mockRestore() }
}, 30_000)

it('updates actual browser object-fit without changing SSR, source or other image styles', async () => {
  const root = join(import.meta.dir, '../../../components')
  const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'fit.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  expect(html).toContain('object-fit: fill')
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView({ headless: true })
  const waitForFit = async (fit: string) => {
    for (let i = 0; i < 150; i++) {
      if (await view.evaluate(`(() => { const img = document.querySelector('.photo img'); return img && getComputedStyle(img).objectFit === ${JSON.stringify(fit)} })()`)) return
      await Bun.sleep(20)
    }
    throw new Error(`Browser Image did not reach object-fit: ${fit}`)
  }
  try {
    await view.navigate(server.url.href)
    await waitForFit('contain')
    await view.evaluate(`window.initialImage = document.querySelector('.photo img')`)
    for (const fit of ['cover', 'fill', 'none', 'scale-down']) {
      await view.evaluate(`window.probe.fit.set(${JSON.stringify(fit)})`)
      await waitForFit(fit)
    }
    await view.evaluate(`window.probe.primary.set('fill')`)
    await waitForFit('fill')
    await view.evaluate(`window.probe.primary.set(null)`)
    await waitForFit('scale-down')
    await view.evaluate(`window.probe.fit.set(null)`)
    await waitForFit('cover')
    expect(await view.evaluate(`document.querySelector('.photo img') === window.initialImage`)).toBe(true)
    expect(await view.evaluate(`document.querySelector('.photo img').getAttribute('src')`)).toBe('/photo.png')
    expect(await view.evaluate(`getComputedStyle(document.querySelector('.static img')).objectFit`)).toBe('fill')
    expect(await view.evaluate(`document.querySelector('.photo img').style.width`)).toBe('100%')
    await view.evaluate(`window.probe.shown.set(false)`)
    for (let i = 0; i < 150 && await view.evaluate(`!!document.querySelector('.photo img')`); i++) await Bun.sleep(20)
    expect(await view.evaluate(`!!document.querySelector('.photo img')`)).toBe(false)
    await view.evaluate(`(() => { window.probe.fit.set('contain'); window.probe.shown.set(true) })()`)
    await waitForFit('contain')
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
