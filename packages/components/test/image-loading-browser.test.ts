import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { encode } from 'ts-images'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const root = join(import.meta.dir, '..')
const image = join(root, 'src/ui/image/Image.stx')
const options = { ...defaultConfig, root, cache: false, debug: false }
const browserOptions = { headless: true, backend: process.env.STX_IMAGE_BROWSER === 'chrome' ? { type: 'chrome' as const, url: false as const } : undefined }

it.each([false, true])('keeps Image loading hints reactive with authored precedence and SSR defaults (initial priority=%s)', async (initialPriority) => {
  const html = await processDirectives(`@import('Image', '${image}')
<!doctype html><html><head></head><body><script client>
const priority = state(${initialPriority})
const lazy = state(true)
const loading = state('lazy')
const fetchpriority = state('low')
const shown = state(true)
window.probe = { priority, lazy, loading, fetchpriority, shown }
</script><section><div :if="shown">
<Image className="photo" src="/photo.png" srcSet="/photo.png 1x" alt="Photo"
  priority="${initialPriority}" lazy="true" loading="lazy" fetchpriority="low"
  :priority="priority" :lazy="lazy" :loading="loading" :fetchpriority="fetchpriority" />
</div><Image className="static" src="/static.png" alt="Static" priority="off" lazy="off" fetchpriority="low" />
<Image className="default" src="/default.png" alt="Default" /></section></body></html>`, {}, join(root, 'image-loading.stx'), options, new Set())
  const initialTag = html.match(/<img\b[^>]*>/)![0]
  expect(initialTag).toContain(`loading="${initialPriority ? 'eager' : 'lazy'}"`)
  expect(initialTag).toContain(`fetchpriority="${initialPriority ? 'high' : 'low'}"`)
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView(browserOptions)
  const snapshot = () => view.evaluate(`(() => {
    const img = document.querySelector('.photo img');
    if (!img) return null;
    return { loading: img.loading, priority: img.fetchPriority, same: img === window.initialImage,
      loadingAttribute: img.getAttribute('loading'), priorityAttribute: img.getAttribute('fetchpriority'),
      src: img.getAttribute('src'), candidates: img.getAttribute('srcset') };
  })()`)
  const policy = async (loading: string, priority: string) => {
    const expected = { loading, priority, loadingAttribute: loading, priorityAttribute: priority }
    for (let i = 0; i < 150; i++) {
      const actual = await snapshot() as Record<string, unknown> | null
      if (actual && Object.entries(expected).every(([key, value]) => actual[key] === value)) {
        expect(actual).toMatchObject(expected)
        return
      }
      await Bun.sleep(20)
    }
    expect(await snapshot()).toMatchObject(expected)
  }
  const set = (key: string, value: unknown) => view.evaluate(`window.probe.${key}.set(${JSON.stringify(value)})`)
  try {
    await view.navigate(server.url.href)
    await policy(initialPriority ? 'eager' : 'lazy', initialPriority ? 'high' : 'low')
    await view.evaluate(`window.initialImage = document.querySelector('.photo img')`)
    expect(await view.evaluate(`(() => { const img = document.querySelector('.static img'); return [img.loading, img.fetchPriority] })()`)).toEqual(['eager', 'low'])
    expect(await view.evaluate(`(() => { const img = document.querySelector('.default img'); return [img.loading, img.fetchPriority] })()`)).toEqual(['lazy', 'auto'])
    for (const value of [true, 'true', 'on', 'yes', '', 1]) {
      await set('priority', value)
      await policy('eager', 'high')
    }
    for (const value of [false, 'false', '0', 'off', 'no', null, 0]) {
      await set('priority', value)
      await policy('lazy', 'low')
    }
    await set('loading', null)
    for (const value of [false, 'false', '0', 'off', 'no', 0]) {
      await set('lazy', value)
      await policy('eager', 'low')
    }
    for (const value of [true, 'true', '', null, 'on']) {
      await set('lazy', value)
      await policy('lazy', 'low')
    }
    await set('lazy', false)
    await set('loading', 'lazy')
    await policy('lazy', 'low')
    for (const value of [null, '']) {
      await set('loading', value)
      await set('fetchpriority', value)
      await policy('eager', 'auto')
    }
    await set('loading', undefined)
    await set('fetchpriority', undefined)
    await policy('lazy', 'low')
    await set('priority', true)
    await set('fetchpriority', 'auto')
    await policy('eager', 'high')
    await set('priority', false)
    await policy('lazy', 'auto')
    await set('loading', 'eager')
    await set('fetchpriority', 'high')
    await policy('eager', 'high')
    await set('priority', undefined)
    await policy('eager', 'high')
    await set('loading', undefined)
    await set('fetchpriority', undefined)
    await policy(initialPriority ? 'eager' : 'lazy', initialPriority ? 'high' : 'low')
    expect(await snapshot()).toMatchObject({ same: true, src: '/photo.png', candidates: '/photo.png 1x' })
    await set('shown', false)
    for (let i = 0; i < 150 && await snapshot() !== null; i++) await Bun.sleep(20)
    expect(await snapshot()).toBeNull()
    await view.evaluate(`(() => { window.probe.priority.set(false); window.probe.loading.set(''); window.probe.lazy.set(false); window.probe.fetchpriority.set(null); window.probe.shown.set(true) })()`)
    await policy('eager', 'auto')
    expect(await snapshot()).toMatchObject({ same: true, src: '/photo.png', candidates: '/photo.png 1x' })
  }
  finally { view.close(); server.stop(true) }
}, 30_000)

it('requests an offscreen lazy Image when priority turns on without replacing the image', async () => {
  const html = await processDirectives(`@import('Image', '${image}')
<!doctype html><html><head></head><body><script client>
const priority = state(false)
window.probe = { priority }
</script><div style="position:absolute;top:100000px;left:0;width:20px;height:20px">
<Image className="photo" src="/deferred.png" alt="Deferred" width="20" height="20" :priority="priority" />
</div></body></html>`, {}, join(root, 'image-loading-request.stx'), options, new Set())
  const png = await encode({ data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, channels: 4 }, 'png')
  let imageRequests = 0
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => {
    const path = new URL(request.url).pathname
    if (path === '/') return new Response(html, { headers: { 'Content-Type': 'text/html' } })
    if (path !== '/deferred.png') return new Response('', { status: 404 })
    imageRequests++
    return new Response(png, { headers: { 'Content-Type': 'image/png' } })
  } })
  const view = new WebView(browserOptions)
  try {
    await view.navigate(server.url.href)
    for (let i = 0; i < 150 && !await view.evaluate(`!!(window.probe && document.querySelector('.photo img')?.loading === 'lazy')`); i++) await Bun.sleep(20)
    expect(await view.evaluate(`document.querySelector('.photo img').loading`)).toBe('lazy')
    await Bun.sleep(150)
    expect(imageRequests).toBe(0)
    await view.evaluate(`(() => { window.initialImage = document.querySelector('.photo img'); window.probe.priority.set(true) })()`)
    for (let i = 0; i < 150 && !await view.evaluate(`document.querySelector('.photo img').naturalWidth === 1`); i++) await Bun.sleep(20)
    expect(imageRequests).toBe(1)
    expect(await view.evaluate(`(() => { const img = document.querySelector('.photo img'); return [img.loading, img.fetchPriority, img.naturalWidth, img === window.initialImage] })()`)).toEqual(['eager', 'high', 1, true])
    await view.evaluate('window.probe.priority.set(false)')
    for (let i = 0; i < 150 && !await view.evaluate(`document.querySelector('.photo img').loading === 'lazy'`); i++) await Bun.sleep(20)
    expect(await view.evaluate(`document.querySelector('.photo img').loading`)).toBe('lazy')
    expect(imageRequests).toBe(1) // hints cannot unload or undo a completed request
  }
  finally { view.close(); server.stop(true) }
}, 30_000)
