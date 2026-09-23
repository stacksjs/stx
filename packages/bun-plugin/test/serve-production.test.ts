import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 45_700 + (process.pid % 200)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-production-'))
  await Bun.write(
    path.join(dir, 'views', 'index.stx'),
    `<script>const count = state(0)</script><main>${'production '.repeat(300)}<span x-text="count"></span></main>`,
  )
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, renderCache: true, renderCacheVary: 'source' })
`)

  proc = Bun.spawn(['bun', 'driver.ts'], {
    cwd: dir,
    env: { ...process.env, APP_ENV: 'production', NODE_ENV: 'production' },
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(BASE)
      break
    }
    catch {
      if (Date.now() > deadline)
        throw new Error('production serve() subprocess never came up')
      await Bun.sleep(100)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

describe('production serve', () => {
  it('ships no HMR client or event stream', async () => {
    const html = await (await fetch(BASE)).text()
    const hmr = await fetch(`${BASE}/_stx/hmr`)

    expect(html).not.toContain('data-stx-hmr')
    expect(html).not.toContain('/_stx/hmr')
    expect(hmr.status).toBe(404)
  })

  it('compresses documents while keeping shared runtimes external', async () => {
    const response = await fetch(BASE, { headers: { 'Accept-Encoding': 'gzip' } })
    const html = await response.text()

    expect(response.headers.get('content-encoding')).toBe('gzip')
    expect(response.headers.get('vary')).toContain('Accept-Encoding')
    expect(html).toMatch(/src="\/_stx\/runtime\.[0-9a-f]{16}\.js"/)
    expect(html).toMatch(/src="\/_stx\/router\.[0-9a-f]{16}\.js"/)
    expect(html).not.toContain('window.stx.state')
  })

  it('caches the content-addressed runtime and router forever', async () => {
    const html = await (await fetch(BASE)).text()
    const runtimeUrl = html.match(/src="(\/_stx\/runtime\.[0-9a-f]{16}\.js)"/)?.[1]
    const routerUrl = html.match(/src="(\/_stx\/router\.[0-9a-f]{16}\.js)"/)?.[1]
    expect(runtimeUrl).toBeTruthy()
    expect(routerUrl).toBeTruthy()

    const runtime = await fetch(`${BASE}${runtimeUrl}`)
    const router = await fetch(`${BASE}${routerUrl}`)

    expect(runtime.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(router.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(await router.text()).toContain('__stxRouter')
  })

  it('keeps the fixed URLs working for HTML rendered before hashing, without letting them be kept', async () => {
    // `no-cache`, not a short max-age: Cloudflare raises a short max-age to its
    // own four-hour browser TTL, which is how the old URL served a previous
    // release's router for hours after a deploy.
    const runtime = await fetch(`${BASE}/_stx/runtime.js`)
    const router = await fetch(`${BASE}/_stx/router.js`)

    expect(runtime.status).toBe(200)
    expect(router.status).toBe(200)
    expect(runtime.headers.get('cache-control')).toBe('no-cache')
    expect(router.headers.get('cache-control')).toBe('no-cache')
    expect(runtime.headers.get('etag')).toBeTruthy()
    expect(router.headers.get('etag')).toBeTruthy()
  })

  it('answers a previous release\'s hash with the current script, uncached', async () => {
    // A page from before the deploy still loads a working router; the bytes
    // must not be cached under a hash they do not match.
    const router = await fetch(`${BASE}/_stx/router.0123456789abcdef.js`)

    expect(router.status).toBe(200)
    expect(router.headers.get('cache-control')).toBe('no-cache')
    expect(await router.text()).toContain('__stxRouter')
  })
})
