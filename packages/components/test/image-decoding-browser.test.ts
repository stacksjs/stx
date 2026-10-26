import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const root = join(import.meta.dir, '..')
const image = join(root, 'src/ui/image/Image.stx')

it.each([undefined, 'sync'])('keeps Image decoding reactive across clears and remounts (authored=%s)', async (authored) => {
  const initial = authored || 'async'
  const html = await processDirectives(`@import('Image', '${image}')
<!doctype html><html><head></head><body><script client>
const decoding = state('${initial}')
const shown = state(true)
window.probe = { decoding, shown }
</script><section><div :if="shown">
<Image className="photo" src="/photo.png" srcSet="/photo.png 1x" alt="Photo"
  ${authored ? `decoding="${authored}"` : ''} :decoding="decoding" />
</div></section></body></html>`, {}, join(root, 'image-decoding.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  expect(html.match(/<img\b[^>]*>/)![0]).toContain(`decoding="${initial}"`)
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView({ headless: true, backend: process.env.STX_IMAGE_BROWSER === 'chrome' ? { type: 'chrome', url: false } : undefined })
  const snapshot = () => view.evaluate(`(() => {
    if (!window.probe) return null;
    const img = document.querySelector('.photo img');
    return img ? { decoding: img.decoding, attribute: img.getAttribute('decoding'), same: img === window.initialImage,
      src: img.getAttribute('src'), candidates: img.getAttribute('srcset'), alt: img.alt } : null;
  })()`)
  const selected = async (expected: string | null) => {
    for (let i = 0; i < 150; i++) {
      const actual = await snapshot() as { decoding: string, attribute: string } | null
      if (expected === null ? actual === null : actual?.decoding === expected && actual.attribute === expected) return
      await Bun.sleep(20)
    }
    if (expected === null) expect(await snapshot()).toBeNull()
    else expect(await snapshot()).toMatchObject({ decoding: expected, attribute: expected })
  }
  const set = (value: unknown) => view.evaluate(`window.probe.decoding.set(${JSON.stringify(value)})`)
  const retained = async () => expect(await snapshot()).toMatchObject({ same: true, src: '/photo.png', candidates: '/photo.png 1x', alt: 'Photo' })
  try {
    await view.navigate(server.url.href)
    await selected(initial)
    await view.evaluate(`window.initialImage = document.querySelector('.photo img')`)
    for (const value of ['auto', 'sync', 'async', 'auto']) {
      await set(value)
      await selected(value)
      await retained()
    }
    for (const value of [null, '']) {
      await set(value)
      await selected('async')
      await set(undefined)
      await selected(initial)
    }
    // Writes made while the child is detached must replay on the retained node.
    for (const value of ['sync', 'auto', null, undefined]) {
      await view.evaluate('window.probe.shown.set(false)')
      await selected(null)
      await set(value)
      await view.evaluate('window.probe.shown.set(true)')
      await selected(value === undefined ? initial : value || 'async')
      await retained()
    }
    await set('auto')
    await selected('auto')
    await retained()
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
