import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const root = join(import.meta.dir, '..')
const image = join(root, 'src/ui/image/Image.stx')
const tokens = { full: ['9999px', '9999px'], sm: ['0.125rem', '2px'], md: ['0.375rem', '6px'], lg: ['0.5rem', '8px'], xl: ['0.75rem', '12px'], '2xl': ['1rem', '16px'] } as const

it.each([false, true, ...Object.keys(tokens)])('updates both Image radii, restores defaults and retains nodes across remounts (authored rounded=%s)', async (initial) => {
  const html = await processDirectives(`@import('Image', '${image}')
<!doctype html><html><head><style>html { font-size: 16px } .photo { border-radius: 13px } .photo img { border-radius: 11px }</style></head><body><script client>
const rounded = state(${JSON.stringify(initial)})
const shown = state(true)
const url = state('/photo.png')
window.probe = { rounded, shown, url }
</script><section><div :if="shown">
<Image className="photo" src="/photo.png" :src="url" srcSet="/photo.png 1x" alt="Photo" ${initial ? `rounded="${initial}"` : ''} :rounded="rounded" />
</div></section></body></html>`, {}, join(root, 'image-rounded.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  for (const tag of [html.match(/<picture\b[^>]*>/)![0], html.match(/<img\b[^>]*>/)![0]]) {
    if (initial) expect(tag).toContain(`border-radius: ${typeof initial === 'string' ? tokens[initial as keyof typeof tokens][0] : '0.5rem'}`)
    else expect(tag).not.toContain('border-radius:')
  }
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView({ headless: true, backend: process.env.STX_IMAGE_BROWSER === 'chrome' ? { type: 'chrome', url: false } : undefined })
  const snapshot = () => view.evaluate(`(() => {
    if (!window.probe) return null;
    const img = document.querySelector('.photo img');
    if (!img) return null;
    const frame = img.closest('picture');
    return { imageRadius: getComputedStyle(img).borderTopLeftRadius, frameRadius: getComputedStyle(frame).borderTopLeftRadius,
      imageInline: img.style.borderRadius, frameInline: frame.style.borderRadius,
      same: img === window.initialImage, sameFrame: frame === window.initialFrame,
      src: img.getAttribute('src'), candidates: img.getAttribute('srcset'), alt: img.alt };
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
  const radii = (value: boolean | string) => {
    const [inline, computed] = typeof value === 'string' ? tokens[value as keyof typeof tokens] : value ? ['0.5rem', '8px'] : ['', '']
    return { imageRadius: computed || '11px', frameRadius: computed || '13px', imageInline: inline, frameInline: inline }
  }
  const retained = { same: true, sameFrame: true, src: '/photo.png', candidates: '/photo.png 1x', alt: 'Photo' }
  const set = (value: unknown) => view.evaluate(`window.probe.rounded.set(${JSON.stringify(value)})`)
  try {
    await view.navigate(server.url.href)
    await selected(radii(initial))
    await view.evaluate(`(() => { window.initialImage = document.querySelector('.photo img'); window.initialFrame = document.querySelector('.photo') })()`)
    for (const value of [true, 'true', 'on', 'yes', '', 1, 'unknown', '__proto__', 'constructor', 'toString']) {
      await set(value)
      await selected({ ...radii(true), ...retained })
    }
    for (const value of [false, 'false', '0', 'off', 'no', null, 0]) {
      await set(value)
      await selected({ ...radii(false), ...retained })
    }
    for (const value of Object.keys(tokens)) {
      await set(value)
      await selected({ ...radii(value), ...retained })
    }
    // Exercise attribute parsing as well as the parent's typed signal bridge.
    for (const value of [...Object.keys(tokens), 'false']) {
      await view.evaluate(`document.querySelector('.photo img').closest('[data-stx-scope]').setAttribute('rounded', ${JSON.stringify(value)})`)
      await selected({ ...radii(value === 'false' ? false : value), ...retained })
    }
    await set(undefined)
    await selected({ ...radii(initial), ...retained })
    for (const value of [true, false, null, ...Object.keys(tokens), undefined]) {
      await view.evaluate('window.probe.shown.set(false)')
      await selected(null)
      await set(value)
      await view.evaluate('window.probe.shown.set(true)')
      await selected({ ...radii(value === undefined ? initial : value ?? false), ...retained })
    }
    await set(!initial)
    await selected({ ...radii(!initial), ...retained })
    await set('full')
    await view.evaluate("window.probe.url.set('/replacement.png')")
    await selected({ ...radii('full'), ...retained, src: '/replacement.png', candidates: null })
    await view.evaluate("window.probe.url.set('/photo.png')")
    await selected({ ...radii('full'), ...retained })
  }
  finally { view.close(); server.stop(true) }
}, 60_000)

it.each(['unknown', '__proto__', 'constructor', 'toString'])('keeps the legacy SSR radius fallback for %s', async (value) => {
  const html = await processDirectives(`@import('Image', '${image}')
<Image src="/photo.png" alt="Photo" rounded="${value}" />`, {}, join(root, 'image-rounded-fallback.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  for (const tag of [html.match(/<picture\b[^>]*>/)![0], html.match(/<img\b[^>]*>/)![0]])
    expect(tag).toContain('border-radius: 0.5rem')
})
