import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { encode } from 'ts-images'

setDefaultTimeout(60_000)

const PORT = 44_000 + (process.pid % 1000)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-shared-assets-'))

  await Bun.write(
    path.join(dir, 'framework-components', 'FactoryProbe.stx'),
    '<script client>const factoryProbe = state(0)</script><span x-text="factoryProbe"></span>',
  )
  await Bun.write(
    path.join(dir, 'resources', 'components', 'ProjectPanel.stx'),
    '<section data-project-component><slot /></section>',
  )
  await Bun.write(
    path.join(dir, 'views', 'index.stx'),
    '<script>const count = state(0)</script><main class="flex">{{ count() }}<ProjectPanel>Project component</ProjectPanel><FactoryProbe /><FactoryProbe /><Image src="/images/hero.png" alt="Responsive hero" /><script data-stx-scoped client>window.__fragmentProbeRuns = (window.__fragmentProbeRuns || 0) + 1</script></main>',
  )
  await Bun.write(
    path.join(dir, 'views', '[...all].stx'),
    '<script server>definePageMeta({ status: 404 })</script><main data-not-found>Missing</main>',
  )
  await Bun.write(
    path.join(dir, 'public', 'images', 'favicon.svg'),
    '<svg data-public-favicon></svg>',
  )
  const pixels = new Uint8Array(32 * 16 * 4)
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels[offset] = (offset * 3) % 256
    pixels[offset + 1] = (offset * 7) % 256
    pixels[offset + 2] = (offset * 11) % 256
    pixels[offset + 3] = 255
  }
  await Bun.write(path.join(dir, 'public', 'images', 'hero.png'), await encode({ data: pixels, width: 32, height: 16, channels: 4 }, 'png'))
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({
  patterns: ['views'],
  componentsDir: ${JSON.stringify(path.join(dir, 'framework-components'))},
  port: ${PORT},
  onRequest(req) {
    if (new URL(req.url).pathname.startsWith('/_stx/'))
      return new Response('internal assets must bypass app hooks', { status: 401 })
  },
})
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(BASE)
      break
    }
    catch {
      if (Date.now() > deadline)
        throw new Error('serve() subprocess never came up')
      await Bun.sleep(150)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

describe('serve shared STX assets', () => {
  it('serves public assets before a catch-all page', async () => {
    const response = await fetch(`${BASE}/images/favicon.svg`)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/svg+xml')
    expect(body).toBe('<svg data-public-favicon></svg>')
  })

  it('resolves project components alongside an explicit framework component directory', async () => {
    const html = await (await fetch(BASE)).text()

    expect(html).toContain('<section data-project-component>Project component</section>')
    expect(html).not.toContain('<ProjectPanel')
    expect(html).not.toContain('<FactoryProbe')
  })

  it('renders and serves optimized responsive images in dynamic serve mode', async () => {
    const html = await (await fetch(BASE)).text()
    const generatedUrl = html.match(/\/(?:_stx\/images\/[^" ]+\.(?:avif|webp|png))/)?.[0]

    expect(html).toContain('<picture>')
    expect(html).toContain('background-image:url(data:image/bmp;base64,')
    expect(generatedUrl).toBeTruthy()

    const response = await fetch(`${BASE}${generatedUrl}`)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(response.headers.get('content-type')).toMatch(/^image\/(?:avif|webp|png)$/)
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0)
  })

  it('preflights every supported API method and dashboard request header', async () => {
    const response = await fetch(BASE, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'authorization,x-csrf-token',
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS')
    expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type, Authorization, X-CSRF-Token, X-Requested-With')
  })

  it('references shared runtime and router scripts from rendered pages', async () => {
    const html = await (await fetch(BASE)).text()

    expect(html).toContain('<script data-stx-runtime src="/_stx/runtime.js"></script>')
    expect(html).toContain('<script data-stx-router src="/_stx/router.js"></script>')
    expect(html).toMatch(/<link data-crosswind="generated" rel="stylesheet" href="\/_stx\/crosswind\.[a-f0-9]{16}\.css">/)
    expect(html).not.toContain('window.stx.state')
    expect(html).not.toContain('__stxRouter=true')
  })

  it('serves the shared scripts before application request hooks', async () => {
    const runtime = await fetch(`${BASE}/_stx/runtime.js`)
    const router = await fetch(`${BASE}/_stx/router.js`)

    expect(runtime.status).toBe(200)
    expect(runtime.headers.get('content-type')).toBe('application/javascript; charset=utf-8')
    expect(runtime.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
    expect(runtime.headers.get('etag')).toBeTruthy()
    expect(await runtime.text()).toContain('window.stx')

    expect(router.status).toBe(200)
    expect(router.headers.get('etag')).toBeTruthy()
    expect(await router.text()).toContain('__stxRouter')
  })

  it('revalidates shared scripts with ETags', async () => {
    const first = await fetch(`${BASE}/_stx/runtime.js`)
    const etag = first.headers.get('etag')
    expect(etag).toBeTruthy()

    const revalidated = await fetch(`${BASE}/_stx/runtime.js`, {
      headers: { 'If-None-Match': etag! },
    })

    expect(revalidated.status).toBe(304)
    expect(await revalidated.text()).toBe('')
  })

  it('serves content-addressed Crosswind CSS immutably', async () => {
    const html = await (await fetch(BASE)).text()
    const href = html.match(/href="(\/_stx\/crosswind\.[a-f0-9]{16}\.css)"/)?.[1]
    expect(href).toBeTruthy()

    const response = await fetch(`${BASE}${href}`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/css; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(await response.text()).toContain('display: flex')
  })

  it('does not append scripts already present inside a page fragment', async () => {
    const response = await fetch(BASE, {
      headers: { 'X-STX-Router': 'true' },
    })
    const html = await response.text()
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
      .map(match => match[1].trim())
      .filter(Boolean)
    const uniqueScripts = new Set(scripts)

    expect(response.headers.get('x-stx-fragment')).toBe('true')
    expect(html).toContain('__fragmentProbeRuns')
    expect(uniqueScripts.size).toBe(scripts.length)
  })

  it('places pooled component factories before their fragment instances', async () => {
    const response = await fetch(BASE, {
      headers: { 'X-STX-Router': 'true' },
    })
    const html = await response.text()
    const factoryPreludeIndex = html.indexOf('data-stx-component-factories')
    const firstInstanceIndex = html.indexOf('window.__stxComponentFactories[')

    expect(response.headers.get('x-stx-fragment')).toBe('true')
    expect(factoryPreludeIndex).toBeGreaterThanOrEqual(0)
    expect(firstInstanceIndex).toBeGreaterThan(factoryPreludeIndex)
    expect((html.match(/const factoryProbe = state\(0\);/g) || [])).toHaveLength(1)
    expect((html.match(/window\.__stxComponentFactories\[[^\n]+/g) || [])).toHaveLength(2)
  })

  it('honors page response status for full and fragment responses', async () => {
    const fullResponse = await fetch(`${BASE}/missing-page`)
    const fragmentResponse = await fetch(`${BASE}/missing-page`, {
      headers: { 'X-STX-Router': 'true' },
    })

    expect(fullResponse.status).toBe(404)
    expect(await fullResponse.text()).toContain('data-not-found')
    expect(fragmentResponse.status).toBe(404)
    expect(fragmentResponse.headers.get('x-stx-fragment')).toBe('true')
    expect(await fragmentResponse.text()).toContain('Missing')
  })
})
