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
    expect(html).toContain('src="/_stx/runtime.js"')
    expect(html).toContain('src="/_stx/router.js"')
    expect(html).not.toContain('window.stx.state')
  })
})
