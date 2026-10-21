import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

it('selects the replacement URL in a real picture element and clears/restores it', async () => {
  const root = join(import.meta.dir, '..')
  const component = join(root, 'src/ui/image/Image.stx')
  const html = await processDirectives(`@import('Image', '${component}')
<!doctype html><html><head></head><body>
<script client>
const url = state('/first.png')
window.probe = { url }
</script><section>
<Image src="/first.png" :src="url" alt="Photo"
  :sources="[{ type: 'image/png', srcset: '/first-alternate.png' }]" />
</section></body></html>`, {}, join(root, 'image-browser.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const png = await encode({ data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, channels: 4 }, 'png')
  const server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    fetch: request => new URL(request.url).pathname === '/'
      ? new Response(html, { headers: { 'Content-Type': 'text/html' } })
      : new Response(png, { headers: { 'Content-Type': 'image/png' } }),
  })
  const view = new WebView({ headless: true })
  const state = () => view.evaluate(`(() => {
    const image = document.querySelector('picture img');
    return { src: image.currentSrc ? new URL(image.currentSrc).pathname : '', width: image.naturalWidth };
  })()`)
  const selected = async (src: string) => {
    for (let i = 0; i < 150; i++) {
      const actual = await state() as { src: string, width: number }
      if (actual.src === src && actual.width === (src ? 1 : 0)) return actual
      await Bun.sleep(20)
    }
    return state()
  }
  try {
    await view.navigate(server.url.href)
    expect(await selected('/first-alternate.png')).toEqual({ src: '/first-alternate.png', width: 1 })
    await view.evaluate('window.probe.url.set("/replacement.png")')
    expect(await selected('/replacement.png')).toEqual({ src: '/replacement.png', width: 1 })
    await view.evaluate('window.probe.url.set(null)')
    expect(await selected('')).toEqual({ src: '', width: 0 })
    await view.evaluate('window.probe.url.set("/first.png")')
    expect(await selected('/first-alternate.png')).toEqual({ src: '/first-alternate.png', width: 1 })
  }
  finally {
    view.close()
    server.stop(true)
  }
}, 30_000)
