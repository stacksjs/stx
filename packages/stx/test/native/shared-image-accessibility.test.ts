import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

const image = join(import.meta.dir, '../../../components/src/ui/image/Image.stx')
const source = `@import('Image', '${image}')
<script client>
const caption = state('Live caption')
const decorative = state(false)
const shown = state(true)
window.probe = { caption, decorative, shown }
</script><section><div :if="shown">
<Image testID="photo" className="photo" src="/photo.png" alt="SSR caption" :alt="caption" :decorative="decorative" />
<Image testID="initially-hidden" className="initially-hidden" src="/photo.png" decorative alt="Recovered caption" :decorative="decorative" />
<Image testID="override" src="/photo.png" alt="Fallback" :alt="caption" :decorative="decorative" accessibilityLabel="Native override" />
<Image testID="aria-override" className="aria-override" src="/photo.png" alt="Fallback" :alt="caption" aria-label="ARIA override" />
</div><Image testID="static" className="static" src="/static.png" alt="Static caption" />
<Image testID="decoration" className="decoration" src="/decoration.png" decorative /></section>`

it.each([false, true])('updates shared native Image labels and preserves explicit native overrides (minify=%s)', async (minify) => {
  const { code } = await compileNativeScreen(source, { minify })
  const phone = mountNativeScreen(code)
  try {
    await phone.settle()
    const photo = () => phone.byTestID('photo')!
    const probe = phone.context.probe
    const id = photo().id
    expect(photo().props).toMatchObject({ alt: 'Live caption', accessibilityLabel: 'Live caption', source: '/photo.png' })
    expect(phone.byTestID('initially-hidden')!.props).toMatchObject({ alt: 'Recovered caption', accessibilityLabel: 'Recovered caption' })
    expect(phone.byTestID('initially-hidden')!.props['aria-hidden'] ?? null).toBeNull()
    expect(phone.byTestID('static')!.props.accessibilityLabel).toBe('Static caption')
    expect(phone.byTestID('decoration')!.props.alt).toBe('')
    expect(phone.byTestID('decoration')!.props.accessibilityLabel ?? null).toBeNull()
    const caption = `A \"quoted\" <caption> & café`
    probe.caption.set(caption)
    await phone.settle()
    expect(photo().id).toBe(id)
    expect(photo().props).toMatchObject({ alt: caption, accessibilityLabel: caption })
    expect(phone.byTestID('aria-override')!.props.accessibilityLabel).toBe('ARIA override')
    for (const value of [true, 'true', '']) {
      probe.decorative.set(value)
      await phone.settle()
      expect(photo().props.alt).toBe('')
      expect(photo().props.accessibilityLabel).toBeNull()
      expect(String(photo().props['aria-hidden'])).toBe('true')
      expect(phone.byTestID('override')!.props.accessibilityLabel).toBe('Native override')
    }
    probe.caption.set('Changed while decorative')
    probe.decorative.set('false')
    await phone.settle()
    expect(photo().props).toMatchObject({ alt: 'Changed while decorative', accessibilityLabel: 'Changed while decorative' })
    expect(photo().props['aria-hidden']).toBeNull()
    for (const empty of ['', null]) {
      probe.caption.set(empty)
      await phone.settle()
      expect(photo().props.alt).toBe('')
      expect(photo().props.accessibilityLabel).toBeNull()
    }
    probe.shown.set(false)
    await phone.settle()
    expect(photo()).toBeUndefined()
    probe.caption.set('Remounted')
    probe.shown.set(true)
    await phone.settle()
    expect(photo().id).toBe(id)
    expect(photo().props.accessibilityLabel).toBe('Remounted')
    expect(phone.byTestID('override')!.props.accessibilityLabel).toBe('Native override')
    expect(phone.byTestID('aria-override')!.props.accessibilityLabel).toBe('ARIA override')
    expect(phone.mutationErrors).toEqual([])
    phone.unmount()
    const count = phone.messages.length
    probe.caption.set('Disposed')
    probe.decorative.set(true)
    await phone.settle()
    expect(phone.messages).toHaveLength(count)
  }
  finally { phone.unmount() }
}, 30_000)

it('updates browser alt and decorative semantics without losing SSR labels, source or identity', async () => {
  const root = join(import.meta.dir, '../../../components')
  const html = await processDirectives(`<!doctype html><html><head></head><body>${source}</body></html>`, {}, join(root, 'image-accessibility.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  expect(html).toContain('alt="SSR caption"')
  expect(html).toContain('alt="Static caption"')
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView({ headless: true })
  const snapshot = () => view.evaluate(`(() => {
    const img = document.querySelector('.photo img');
    return img ? { alt: img.getAttribute('alt'), label: img.getAttribute('aria-label'), hidden: img.getAttribute('aria-hidden'),
      same: img === window.initialImage, src: img.getAttribute('src') } : null;
  })()`)
  const waitFor = async (expected: Record<string, unknown> | null) => {
    for (let i = 0; i < 150; i++) {
      const current = await snapshot() as Record<string, unknown> | null
      if (expected === null ? current === null : current && Object.entries(expected).every(([key, value]) => current[key] === value)) return
      await Bun.sleep(20)
    }
    if (expected === null) expect(await snapshot()).toBeNull()
    else expect(await snapshot()).toMatchObject(expected)
  }
  try {
    await view.navigate(server.url.href)
    await waitFor({ alt: 'Live caption', label: null, hidden: null, src: '/photo.png' })
    await view.evaluate(`window.initialImage = document.querySelector('.photo img')`)
    expect(await view.evaluate(`document.querySelector('.initially-hidden img').alt`)).toBe('Recovered caption')
    expect(await view.evaluate(`document.querySelector('.initially-hidden img').getAttribute('aria-hidden')`)).toBeNull()
    const caption = `A \"quoted\" <caption> & café`
    await view.evaluate(`window.probe.caption.set(${JSON.stringify(caption)})`)
    await waitFor({ alt: caption, label: null, same: true })
    for (const value of [true, 'true', '']) {
      await view.evaluate(`window.probe.decorative.set(${JSON.stringify(value)})`)
      await waitFor({ alt: '', label: null, hidden: 'true', same: true })
    }
    await view.evaluate(`(() => { window.probe.caption.set('Changed while decorative'); window.probe.decorative.set('false') })()`)
    await waitFor({ alt: 'Changed while decorative', label: null, hidden: null })
    for (const empty of ['', null]) {
      await view.evaluate(`window.probe.caption.set(${JSON.stringify(empty)})`)
      await waitFor({ alt: '', label: null, hidden: null })
    }
    await view.evaluate(`window.probe.shown.set(false)`)
    await waitFor(null)
    await view.evaluate(`(() => { window.probe.caption.set('Remounted'); window.probe.shown.set(true) })()`)
    await waitFor({ alt: 'Remounted', label: null, hidden: null, src: '/photo.png' })
    expect(await view.evaluate(`document.querySelector('.static img').alt`)).toBe('Static caption')
    expect(await view.evaluate(`document.querySelector('.decoration img').alt`)).toBe('')
    expect(await view.evaluate(`document.querySelector('.decoration img').getAttribute('aria-hidden')`)).toBe('true')
    expect(await view.evaluate(`document.querySelector('.aria-override').getAttribute('aria-label')`)).toBe('ARIA override')
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
