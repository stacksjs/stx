import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

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
const API_PORT = freePort()
const BASE = `http://127.0.0.1:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = createTempDir('stx-on-request-server-')

  await Bun.write(path.join(dir, 'views', 'index.stx'), '<h1>home</h1>')
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

Bun.serve({
  port: ${API_PORT},
  fetch(request) {
    if (request.headers.get('origin') !== 'https://lsu.example')
      return new Response('Origin refused', { status: 403 })
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': 'https://lsu.example',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, X-HQ-Day, X-Org-Id',
      'Vary': 'Origin',
    } })
  },
})
serve({
  patterns: ['views'],
  port: ${PORT},
  hostname: '127.0.0.1',
  async onRequest(req, server) {
    if (new URL(req.url).pathname.startsWith('/api/'))
      return fetch('http://127.0.0.1:${API_PORT}' + new URL(req.url).pathname, { method: req.method, headers: req.headers })
    if (new URL(req.url).pathname !== '/__peer')
      return null
    return Response.json({ peer: server.requestIP(req)?.address ?? null, hostname: server.hostname })
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
    const body = await res.json() as { peer: string | null, hostname: string }

    expect(body.peer).toMatch(/^(?:127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/)
    expect(body.hostname).toBe('127.0.0.1')
  })

  it('still falls through to page rendering when the hook returns nothing', async () => {
    const res = await fetch(`${BASE}/`)

    expect(await res.text()).toContain('home')
  })

  it('forwards API preflight to its proxy with the configured origin and headers', async () => {
    const res = await fetch(`${BASE}/api/health/metrics`, { method: 'OPTIONS', headers: {
      Origin: 'https://lsu.example',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization,x-hq-day,x-org-id',
    } })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe('https://lsu.example')
    expect(res.headers.get('access-control-allow-headers')).toContain('X-HQ-Day')
    expect(res.headers.get('vary')).toBe('Origin')
  })

  it('keeps the upstream refusal instead of granting a wildcard preflight', async () => {
    const res = await fetch(`${BASE}/api/health/metrics`, { method: 'OPTIONS', headers: { Origin: 'https://foreign.example' } })
    expect(res.status).toBe(403)
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('retains the generic asset preflight when the hook does not answer', async () => {
    const res = await fetch(`${BASE}/`, { method: 'OPTIONS' })
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
  })

})
