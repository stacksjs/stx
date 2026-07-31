import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 44_000 + (process.pid % 1000)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-shared-assets-'))

  await Bun.write(
    path.join(dir, 'views', 'index.stx'),
    '<script>const count = state(0)</script><main class="flex">{{ count() }}</main>',
  )
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({
  patterns: ['views'],
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
})
