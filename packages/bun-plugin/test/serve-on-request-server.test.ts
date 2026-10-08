import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'

/**
 * `onRequest` receives the Bun server beside the request.
 *
 * The socket peer is the one client address a visitor cannot write: every
 * forwarding header is theirs to fill in. Only the server can name the peer
 * (`server.requestIP(req)`), and before this the hook was never given it, so
 * a framework gating requests in `onRequest` - a maintenance allow-list, a
 * rate limit - had nothing to go on but headers.
 */

setDefaultTimeout(60_000)

const PORT = freePort()
const BASE = `http://127.0.0.1:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-on-request-server-'))

  await Bun.write(path.join(dir, 'views', 'index.stx'), '<h1>home</h1>')
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({
  patterns: ['views'],
  port: ${PORT},
  onRequest(req, server) {
    if (new URL(req.url).pathname !== '/__peer')
      return null
    return Response.json({ peer: server.requestIP(req)?.address ?? null })
  },
})
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(`${BASE}/definitely-not-a-page`)
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

describe('serve onRequest', () => {
  it('is handed the server, which names the socket peer whatever the headers claim', async () => {
    const res = await fetch(`${BASE}/__peer`, { headers: { 'x-forwarded-for': '198.51.100.1' } })
    const body = await res.json() as { peer: string | null }

    expect(body.peer).toMatch(/^(?:127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/)
  })

  it('still falls through to page rendering when the hook returns nothing', async () => {
    const res = await fetch(`${BASE}/`)

    expect(await res.text()).toContain('home')
  })
})
