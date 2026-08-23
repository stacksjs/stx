/**
 * `stx dev` answering with the status its page decided.
 *
 * The fourth host that renders stx views. It read
 * `definePageMeta({ status })` out of the source — right for a page that is
 * always an error page, no use to a page addressed by a dynamic segment, which
 * cannot know whether the record exists until it has looked — and had no way to
 * hear the answer afterwards. `/thing/nonsense` rendered "no such thing" under
 * a 200.
 *
 * Driven as a subprocess because `serveApp` starts watchers and an HMR server
 * and hands back no stop handle.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(60_000)

const PORT = 44_100 + (process.pid % 400)
const BASE = `http://localhost:${PORT}`
const SERVE_APP_SRC = path.join(import.meta.dir, '..', '..', 'src', 'dev-server', 'serve-app.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-serve-app-status-'))

  // One file, two answers, and only the render knows which.
  await Bun.write(path.join(dir, 'pages', 'thing', '[id].stx'), `<script server>
const found = params.id === 'known'
if (!found)
  notFound()
const label = found ? 'here it is' : 'no such thing'
</script>
<main>{{ label }}</main>
`)

  // The template spelling, in the branch that already knows.
  await Bun.write(path.join(dir, 'pages', 'feature', '[slug].stx'), `<script server>
const feature = params.slug === 'queues' ? { title: 'Queues' } : null
</script>
<main>
@if (!feature)
  @status(404)
  <h1>No feature by that name.</h1>
@else
  <h1>{{ feature.title }}</h1>
@endif
</main>
`)

  // A static page. The status has to survive the startup build cache, which
  // returns HTML without re-rendering.
  await Bun.write(path.join(dir, 'pages', 'retired.stx'), `<script server>
setResponseStatus(410)
setResponseHeader('X-Robots-Tag', 'noindex')
</script>
<main>gone</main>
`)

  await Bun.write(path.join(dir, 'pages', 'index.stx'), `<main>home</main>\n`)

  await Bun.write(path.join(dir, 'driver.ts'), `import { serveApp } from ${JSON.stringify(SERVE_APP_SRC)}

await serveApp(${JSON.stringify(dir)}, { port: ${PORT}, watch: false, hotReload: false })
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(`${BASE}/`)
      break
    }
    catch {
      if (Date.now() > deadline)
        throw new Error('serveApp() never came up')
      await Bun.sleep(120)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  await rm(dir, { recursive: true, force: true })
})

describe('serveApp and the status a page asked for', () => {
  it('answers 404 for notFound() on a dynamic route, 200 for the record that exists', async () => {
    const missing = await fetch(`${BASE}/thing/anything-else`)
    const found = await fetch(`${BASE}/thing/known`)

    expect(missing.status).toBe(404)
    // Blank markup here would mean the call took the rest of the script down.
    expect(await missing.text()).toContain('no such thing')

    expect(found.status).toBe(200)
    expect(await found.text()).toContain('here it is')
  })

  it('answers 404 for @status() in the branch that rendered', async () => {
    const missing = await fetch(`${BASE}/feature/nonsense`)
    const found = await fetch(`${BASE}/feature/queues`)

    expect(missing.status).toBe(404)
    expect(await missing.text()).toContain('No feature by that name.')

    expect(found.status).toBe(200)
    expect(await found.text()).toContain('Queues')
  })

  it('keeps a static page\'s status and headers across the build cache', async () => {
    // The startup build renders once and the cache answers every request after,
    // so a status held only in the render context is right once and 200 after.
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${BASE}/retired`)
      expect(res.status).toBe(410)
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex')
    }
  })

  it('leaves an ordinary page at 200', async () => {
    expect((await fetch(`${BASE}/`)).status).toBe(200)
  })
})
