import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const root = join(import.meta.dir, '..')
const image = join(root, 'src/ui/image/Image.stx')

async function boot(initial: boolean, reduced = false) {
  const html = await processDirectives(`@import('Image', '${image}')
<!doctype html><html><head><style>body { margin: 40px } .fixture { width: 200px; height: 120px } .photo img { transform: translateX(3px) }</style></head><body>
<script client>
const zoom = state(${initial})
const shown = state(true)
const url = state('/photo.png')
window.probe = { zoom, shown, url }
</script><div class="fixture"><div :if="shown">
<Image className="photo" src="/photo.png" :src="url" srcSet="/photo.png 1x" alt="Photo" width="200" height="120"
  zoomOnHover="${initial}" :zoomOnHover="zoom" />
</div></div></body></html>`, {}, join(root, 'image-zoom.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  // Headless Linux has no mouse: use Playwright's desktop pointer defaults.
  // Touch emulation below still exercises hover: none.
  const view = new WebView({ headless: true, width: 800, height: 600, backend: { type: 'chrome', url: false, argv: ['--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'] } })
  const media = (reduce: boolean) => view.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] })
  const move = (x: number, y: number) => view.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  const hover = async () => {
    const point = await view.evaluate<{ x: number, y: number }>(`(() => { const r = document.querySelector('.photo').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
    await move(point.x, point.y)
  }
  const snapshot = () => view.evaluate(`(() => {
    if (!window.probe) return null;
    const img = document.querySelector('.photo img');
    if (!img) return null;
    const frame = img.closest('picture'), style = getComputedStyle(img);
    return { scale: style.scale, transform: style.transform, duration: style.transitionDuration,
      clipped: getComputedStyle(frame).overflow === 'hidden', enlarged: img.getBoundingClientRect().width > img.clientWidth + 1,
      enabled: frame.hasAttribute('data-stx-image-zoom'), reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      hover: matchMedia('(hover: hover)').matches, animations: img.getAnimations().length,
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
  try {
    await view.navigate('about:blank')
    await media(reduced)
    await view.cdp('Emulation.setTouchEmulationEnabled', { enabled: false })
    await view.navigate(server.url.href)
    await move(1, 1)
  }
  catch (error) { view.close(); server.stop(true); throw error }
  return { view, media, move, hover, selected, set, snapshot, close() { view.close(); server.stop(true) } }
}

// Chrome launch flags are first-call-wins process-wide in Bun. Isolate this
// pointer suite from earlier browser tests without closing anyone else's view.
if (process.env.STX_IMAGE_ZOOM_CHILD !== '1') {
  it('verifies Image hover, reduced motion and touch in an isolated desktop browser', async () => {
    const child = Bun.spawn([process.execPath, 'test', import.meta.path], {
      env: { ...process.env, STX_IMAGE_ZOOM_CHILD: '1' }, stdout: 'pipe', stderr: 'pipe',
    })
    const [exitCode, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
    if (exitCode !== 0) throw new Error(`Image hover browser regressions failed:\n${stdout}\n${stderr}`)
    expect(`${stdout}\n${stderr}`).toContain('3 pass')
    expect(exitCode).toBe(0)
  }, 180_000)
}
else {
  it.each([false, true])('zooms Image on real hover, follows live props/media and retains remount identity (authored=%s)', async (initial) => {
    const browser = await boot(initial)
    const { view, media, move, hover, selected, set } = browser
    const retained = { same: true, sameFrame: true, transform: 'matrix(1, 0, 0, 1, 3, 0)', clipped: true }
    try {
      await selected({ scale: 'none', hover: true, reduced: false })
      await view.evaluate(`(() => { window.initialImage = document.querySelector('.photo img'); window.initialFrame = document.querySelector('.photo') })()`)
      await hover()
      await set('zoom', true)
      await selected({ enabled: true, scale: '1.05', enlarged: true, duration: '0.3s', ...retained })
      for (const value of [false, 'false', '0', 'off', 'no', null, 0]) {
        await set('zoom', value)
        await selected({ enabled: false, scale: 'none', enlarged: false, ...retained })
      }
      for (const value of [true, 'true', 'on', 'yes', '', 1]) {
        await set('zoom', value)
        await selected({ enabled: true, scale: '1.05', ...retained })
      }
      await move(1, 1)
      await selected({ scale: 'none', enabled: true, ...retained })
      await hover()
      await selected({ scale: '1.05' })
      await media(true)
      await selected({ scale: 'none', duration: '0s', animations: 0, reduced: true, ...retained })
      await media(false)
      await selected({ scale: '1.05', reduced: false, ...retained })
      await view.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
      await selected({ hover: false, scale: 'none', duration: '0s', ...retained })
      await view.cdp('Emulation.setTouchEmulationEnabled', { enabled: false })
      await hover()
      await selected({ hover: true, scale: '1.05', ...retained })
      await set('zoom', undefined)
      await selected({ enabled: initial, scale: initial ? '1.05' : 'none', ...retained })
      await set('zoom', true)
      await selected({ scale: '1.05', src: '/photo.png', candidates: '/photo.png 1x' })
      await set('shown', false)
      await selected(null)
      await move(1, 1)
      await set('shown', true)
      await selected({ scale: 'none', enabled: true, ...retained })
      await hover()
      await selected({ scale: '1.05', ...retained })
      await set('shown', false)
      await selected(null)
      await set('zoom', false)
      await set('shown', true)
      await hover()
      await selected({ scale: 'none', enabled: false, ...retained })
      await set('zoom', true)
      await selected({ scale: '1.05', ...retained })
      await set('url', '/replacement.png')
      await selected({ scale: '1.05', src: '/replacement.png', candidates: null, ...retained })
    }
    finally { browser.close() }
  }, 60_000)

  it('does not zoom or animate on an initially reduced-motion page', async () => {
    const browser = await boot(true, true)
    try {
      await browser.hover()
      await browser.selected({ reduced: true, scale: 'none', duration: '0s', animations: 0 })
      await browser.media(false)
      await browser.selected({ reduced: false, scale: '1.05', enlarged: true })
    }
    finally { browser.close() }
  }, 30_000)
}
