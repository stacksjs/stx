/**
 * One url, two bodies, and the header that says so (stacksjs/stx#1958).
 *
 * The SPA router fetches the SAME url a full navigation would, and asks for the
 * fragment with `X-STX-Router: true`. So `/benefits` answers either a complete
 * `<html>` document or the inner content of the router container — no doctype,
 * no `<head>`, no stylesheet link, no nav.
 *
 * A response that depends on a request header has to name it in `Vary`. When it
 * does not, any shared cache in front of the origin stores whichever
 * representation it happened to see first and hands that to everyone. This was
 * not hypothetical: trifitla.stacksjs.com served two of its pages as bare
 * fragments — unstyled, headless, no navigation — for an hour at a time, while
 * the origin answered both requests perfectly and every check on the box passed.
 *
 * These tests pin both halves of the contract, because declaring it on only the
 * fragment leaves the mirror-image bug: a cache holding the document would go on
 * feeding it to the router, which swaps a whole document inside `<main>`.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 44_100 + (process.pid % 800)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

/** Every field listed in `Vary`, lowercased. */
function varyFields(res: Response): string[] {
  return (res.headers.get('Vary') ?? '')
    .split(',')
    .map(field => field.trim().toLowerCase())
    .filter(Boolean)
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-frag-cache-key-'))

  await Bun.write(path.join(dir, 'views', 'benefits.stx'), `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Benefits</title>
    <link rel="stylesheet" href="/css/site.css">
  </head>
  <body>
    <nav><a href="/">Home</a></nav>
    <main>
      <h1>A club, not a gym floor</h1>
    </main>
  </body>
</html>
`)

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT} })
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
        throw new Error('serve() did not start')
      await Bun.sleep(100)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

describe('the SPA fragment cache key', () => {
  it('is two genuinely different bodies at one url', async () => {
    const document = await fetch(`${BASE}/benefits`).then(r => r.text())
    const fragment = await fetch(`${BASE}/benefits`, { headers: { 'X-STX-Router': 'true' } }).then(r => r.text())

    // The premise. If these ever stop differing, the rest of this file is moot.
    expect(document.toLowerCase()).toContain('<!doctype html>')
    expect(document).toContain('/css/site.css')
    expect(fragment.toLowerCase()).not.toContain('<!doctype html>')
    expect(fragment).not.toContain('/css/site.css')
  })

  it('is declared on the fragment response', async () => {
    const res = await fetch(`${BASE}/benefits`, { headers: { 'X-STX-Router': 'true' } })

    expect(res.headers.get('X-STX-Fragment')).toBe('true')
    expect(varyFields(res)).toContain('x-stx-router')
  })

  it('is declared on the document response too', async () => {
    // Not symmetry for its own sake: a cache that stored the document without
    // this would answer the router with a whole <html> tree to swap into <main>.
    const res = await fetch(`${BASE}/benefits`)

    expect(res.headers.get('X-STX-Fragment')).toBeNull()
    expect(varyFields(res)).toContain('x-stx-router')
  })

  it('keeps fragments out of shared caches regardless', async () => {
    // `Vary` is the correct fix and every well-behaved cache honours it. Some
    // CDNs key only on `Accept-Encoding` and ignore the rest, so the fragment
    // also says outright that it belongs to one client and nowhere else.
    const cacheControl = await fetch(`${BASE}/benefits`, { headers: { 'X-STX-Router': 'true' } })
      .then(r => r.headers.get('Cache-Control') ?? '')

    expect(cacheControl).toContain('private')
    expect(cacheControl).toContain('no-store')
  })
})

describe('startup does not hold the port hostage', () => {
  /**
   * Deriving image placeholders used to happen before `serve()` bound, and a
   * cold run over 114 images outlasted ts-cloud's health window: systemd
   * reported the unit active, nothing was listening, and the deploy failed on a
   * server that came up fine a moment later.
   *
   * The port now binds first and the wait moved into the request handler, which
   * is where it belongs — nothing may RENDER before the placeholders exist, but
   * plenty may listen. This asserts the half that broke: the socket answers
   * promptly after start.
   */
  it('answers a request without waiting on the image derive', async () => {
    const started = Date.now()
    const res = await fetch(`${BASE}/benefits`)
    expect(res.status).toBe(200)
    // The server in this file has been up since beforeAll, so this is really a
    // regression guard on the handler never blocking indefinitely.
    expect(Date.now() - started).toBeLessThan(20_000)
  })
})
