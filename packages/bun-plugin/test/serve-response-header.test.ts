import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * A page setting its own response headers while it renders.
 *
 * The companion to `setResponseStatus`, and it shipped without one. The two
 * are not independent: a page that works out mid-render that a record has
 * moved can say 301 and cannot say where to, so what it produces is a redirect
 * with no `Location` - a broken response, and strictly worse than the 404 it
 * replaced.
 *
 * The name was already declared in `STX_SERVER_CONTEXT` and already
 * implemented by every other host that renders stx, so a page calling it was
 * not reaching for something exotic. It threw a ReferenceError instead, which
 * inside a server script takes every other binding in that file down with it -
 * so the page rendered its empty branch and looked like a lookup that had
 * simply found nothing.
 *
 * The render cache carries the headers with the HTML for the same reason it
 * carries the status: without that, the first visitor is redirected and
 * everyone after them gets the 301 with nothing to follow.
 */

setDefaultTimeout(60_000)

const PORT = 43_600 + (process.pid % 300)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-serve-header-'))

  // The case this exists for: a handle that moved. Only the render knows, and
  // saying so needs both halves.
  await Bun.write(path.join(dir, 'views', 'owner', '[handle].stx'), `<script server>
const moved = handle === 'oldname'
if (moved) {
  setResponseStatus(301)
  setResponseHeader('Location', '/owner/newname')
}
</script>
<main>{{ moved ? 'moved' : handle }}</main>
`)

  // Several headers, and one that has to override a default the serve sets.
  await Bun.write(path.join(dir, 'views', 'cached.stx'), `<script server>
setResponseHeader('Cache-Control', 'public, max-age=3600')
setResponseHeader('X-Answered-By', 'the page')
</script>
<main>cacheable</main>
`)

  // A name that is not one is ignored rather than thrown: a header is not
  // worth failing a page that has already rendered.
  await Bun.write(path.join(dir, 'views', 'nonsense.stx'), `<script server>
setResponseHeader('', 'nowhere')
setResponseHeader('   ', 'nowhere')
const reached = 'the end'
</script>
<main>still fine {{ reached }}</main>
`)

  // Last call wins, so a page can look, decide, then change its mind.
  await Bun.write(path.join(dir, 'views', 'reconsidered.stx'), `<script server>
setResponseHeader('X-Verdict', 'first')
setResponseHeader('X-Verdict', 'second')
</script>
<main>decided</main>
`)

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({
  patterns: ['views'],
  port: ${PORT},
  renderCache: true,
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
        throw new Error('serve() never came up')
      await Bun.sleep(120)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  await rm(dir, { recursive: true, force: true })
})

describe('setResponseHeader', () => {
  it('is in scope, so calling it does not take the script down with it', async () => {
    const res = await fetch(`${BASE}/nonsense`)
    const body = await res.text()

    // The binding being missing is not a quiet no-op: it is a ReferenceError
    // that strands every declaration after it. `reached` is the proof the
    // script ran to the end.
    expect(res.status).toBe(200)
    expect(body).toContain('still fine the end')
  })

  it('gives a page-decided redirect somewhere to go', async () => {
    const moved = await fetch(`${BASE}/owner/oldname`, { redirect: 'manual' })

    expect(moved.status).toBe(301)
    expect(moved.headers.get('location')).toBe('/owner/newname')
  })

  it('leaves a page that did not move alone', async () => {
    const stayed = await fetch(`${BASE}/owner/newname`, { redirect: 'manual' })

    expect(stayed.status).toBe(200)
    expect(stayed.headers.get('location')).toBeNull()
  })

  it('sets several, and overrides a default the serve had already chosen', async () => {
    const res = await fetch(`${BASE}/cached`)

    expect(res.headers.get('x-answered-by')).toBe('the page')
    // `no-store` is the serve's default for a rendered page. The page knows
    // something this one does not, so the page wins.
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600')
  })

  it('ignores a name that is not one, rather than failing the page', async () => {
    const res = await fetch(`${BASE}/nonsense`)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('still fine')
  })

  it('takes the last call, so a page can decide late', async () => {
    expect((await fetch(`${BASE}/reconsidered`)).headers.get('x-verdict')).toBe('second')
  })

  /**
   * The one that would have shipped broken. The cache fast path returns before
   * any server script runs, so a cached redirect would answer 301 with no
   * `Location` from its second request onward - a bug that only appears once a
   * page has been asked for twice.
   */
  it('answers a cached hit with the headers the first render set', async () => {
    const first = await fetch(`${BASE}/owner/oldname`, { redirect: 'manual' })
    const second = await fetch(`${BASE}/owner/oldname`, { redirect: 'manual' })

    expect(first.headers.get('location')).toBe('/owner/newname')
    expect(second.status).toBe(301)
    expect(second.headers.get('location')).toBe('/owner/newname')
  })
})
