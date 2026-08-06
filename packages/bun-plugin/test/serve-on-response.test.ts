import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * `onResponse` — the post-response mirror of `onRequest`.
 *
 * It exists because `onRequest` cannot attach anything to a response the
 * server itself produced: returning a Response there SHORT-CIRCUITS the
 * pipeline, so a hook that only wants to set a header would have to
 * re-implement page rendering to have a response to set it on.
 *
 * The motivating case is a framework seeding a CSRF double-submit cookie on
 * safe requests. The token has to ride the HTML response that carries the
 * form; without this hook the page ships with no cookie and its very first
 * POST is rejected by the framework's own CSRF check — login impossible.
 */

setDefaultTimeout(60_000)

const PORT = 43_000 + (process.pid % 1000)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-on-response-'))

  await Bun.write(path.join(dir, 'views', 'index.stx'), '<h1>home</h1>')

  // The hook covers three contracts at once, keyed off the request so one
  // server can exercise all of them: attach-a-header, replace-outright, and
  // observe-what-the-server-produced (including a 404 nobody handled).
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

const seen: number[] = []

serve({
  patterns: ['views'],
  port: ${PORT},
  routes: {
    '/__seen': () => new Response(JSON.stringify(seen), { headers: { 'Content-Type': 'application/json' } }),
  },
  onResponse(req, res) {
    const { pathname } = new URL(req.url)
    if (pathname === '/__seen')
      return
    seen.push(res.status)
    if (pathname === '/replace')
      return new Response('replaced', { status: 418 })
    if (pathname === '/untouched')
      return undefined
    res.headers.append('Set-Cookie', 'X-CSRF-Token=abc123; Path=/; SameSite=Lax')
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

describe('serve onResponse', () => {
  it('attaches a header to a rendered page without replacing the body', async () => {
    const res = await fetch(`${BASE}/`)

    expect(res.headers.get('set-cookie')).toContain('X-CSRF-Token=abc123')
    expect(await res.text()).toContain('home')
  })

  it('lets the hook replace the response outright', async () => {
    const res = await fetch(`${BASE}/replace`)

    expect(res.status).toBe(418)
    expect(await res.text()).toBe('replaced')
  })

  it('leaves the response alone when the hook returns nothing', async () => {
    const res = await fetch(`${BASE}/untouched`)

    // Asserted against the hook's own value rather than "no cookie at all":
    // serve now mints a CSRF token for document requests, so a page response
    // carries a `Set-Cookie` whether or not a hook touched it. What this test
    // is about is the hook, and the hook's marker is `abc123`.
    expect(res.headers.get('set-cookie') ?? '').not.toContain('abc123')
  })

  it('runs for responses the server produced on its own, including 404s', async () => {
    await fetch(`${BASE}/definitely-not-a-page`)

    const seen = await (await fetch(`${BASE}/__seen`)).json() as number[]
    expect(seen).toContain(404)
    expect(seen).toContain(200)
  })
})
