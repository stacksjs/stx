import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'

/**
 * The ambient `ip` a page sees, and the render cache it can fragment.
 *
 * `ip` used to fall back to the left-most `X-Forwarded-For` entry, which is
 * whatever the client wrote. It is now the socket peer, or whatever the
 * application's `clientAddress` resolver says - the application is the one
 * that knows which proxies it runs.
 *
 * A real per-visitor address makes every visitor a distinct render-cache key
 * under `renderCacheVary: 'request'`, so the cache is bounded.
 */

setDefaultTimeout(60_000)

const PORT = freePort()
const PLAIN = `http://127.0.0.1:${PORT}`
const RESOLVED = `http://127.0.0.1:${PORT + 1}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

async function render(base: string, headers: Record<string, string> = {}): Promise<{ ip: string, marker: string }> {
  const html = await (await fetch(`${base}/`, { headers })).text()
  return {
    ip: html.match(/ip:([^<]*)</)?.[1] ?? '',
    marker: html.match(/marker:([\w-]+)/)?.[1] ?? '',
  }
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-client-address-'))

  await Bun.write(path.join(dir, 'views', 'index.stx'), `<script server>
const seen = typeof ip === 'string' ? ip : 'none'
const marker = crypto.randomUUID()
</script>
<main><p>ip:{{ seen }}</p><p>marker:{{ marker }}</p></main>
`)
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, quiet: true })

serve({
  patterns: ['views'],
  port: ${PORT + 1},
  quiet: true,
  renderCache: true,
  renderCacheVary: 'request',
  renderCacheLimit: 2,
  clientAddress: (req, server) => req.headers.get('x-test-client') ?? server.requestIP(req)?.address,
})
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  const deadline = Date.now() + 30_000
  for (const base of [PLAIN, RESOLVED]) {
    while (true) {
      try {
        await fetch(`${base}/definitely-not-a-page`)
        break
      }
      catch {
        if (Date.now() > deadline)
          throw new Error('serve() subprocess never came up')
        await Bun.sleep(150)
      }
    }
  }
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

describe('ambient ip', () => {
  it('is the socket peer, whatever X-Forwarded-For claims', async () => {
    const { ip } = await render(PLAIN, { 'x-forwarded-for': '198.51.100.1' })

    expect(ip).toMatch(/^(?:127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/)
  })

  it('is what the application\'s resolver says when it has one', async () => {
    expect((await render(RESOLVED, { 'x-test-client': '203.0.113.7' })).ip).toBe('203.0.113.7')
  })
})

describe('render cache', () => {
  it('keeps the most recently used entries and lets the coldest go', async () => {
    // A fixed CSRF cookie: without one, each visit mints a token into the
    // request context and is its own key whatever its address.
    const as = (client: string) => render(RESOLVED, { 'x-test-client': client, 'cookie': 'X-CSRF-Token=fixed' })

    const a = await as('192.0.2.1')
    const b = await as('192.0.2.2')
    expect((await as('192.0.2.1')).marker).toBe(a.marker)

    // A third visitor over a limit of two evicts the coldest: b, since a was just read.
    await as('192.0.2.3')
    expect((await as('192.0.2.2')).marker).not.toBe(b.marker)
    expect((await as('192.0.2.3')).marker).not.toBe('')
  })
})
