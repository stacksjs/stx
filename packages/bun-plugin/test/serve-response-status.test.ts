import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * A page deciding its own status while it renders.
 *
 * `definePageMeta({ status })` is read out of the source before anything runs,
 * which is right for a page that is always an error page and no use to a page
 * that is only sometimes one. A page addressed by a dynamic segment - a
 * repository, a user, an order - cannot know whether the thing exists until it
 * has looked, and had no way to say so afterwards: it rendered "no such
 * repository" under a 200, which tells a crawler, a cache and an uptime check
 * that the page is fine.
 *
 * `setResponseStatus(code)` is that missing half, and the render cache carries
 * the status with the HTML so a second request answers what the first did.
 */

setDefaultTimeout(60_000)

const PORT = 43_100 + (process.pid % 400)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-serve-status-'))

  // The case this exists for: one file, two answers, and only the render knows
  // which. `known` is a thing that exists; anything else is not.
  await Bun.write(path.join(dir, 'views', 'thing', '[id].stx'), `<script server>
const found = id === 'known'
if (!found)
  setResponseStatus(404)
</script>
<main>{{ found ? 'here it is' : 'no such thing' }}</main>
`)

  // A static page, to prove the API is not dynamic-route-only.
  await Bun.write(path.join(dir, 'views', 'gone.stx'), `<script server>
setResponseStatus(410)
</script>
<main>gone</main>
`)

  // Out of range, and the wrong type. Neither is worth failing a page that has
  // already rendered, so both are ignored and the page answers 200.
  await Bun.write(path.join(dir, 'views', 'nonsense.stx'), `<script server>
setResponseStatus(999)
setResponseStatus(-1)
</script>
<main>still fine</main>
`)

  // Last call wins, so a page can look, decide, then change its mind.
  await Bun.write(path.join(dir, 'views', 'reconsidered.stx'), `<script server>
setResponseStatus(404)
setResponseStatus(200)
</script>
<main>found after all</main>
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

describe('setResponseStatus', () => {
  it('lets one dynamic route answer 200 or 404 depending on what it found', async () => {
    const found = await fetch(`${BASE}/thing/known`)
    const missing = await fetch(`${BASE}/thing/anything-else`)

    expect(found.status).toBe(200)
    expect(await found.text()).toContain('here it is')

    expect(missing.status).toBe(404)
    expect(await missing.text()).toContain('no such thing')
  })

  it('works on a static page too', async () => {
    expect((await fetch(`${BASE}/gone`)).status).toBe(410)
  })

  it('ignores a status that is not one, rather than failing the page', async () => {
    const res = await fetch(`${BASE}/nonsense`)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('still fine')
  })

  it('takes the last call, so a page can decide late', async () => {
    expect((await fetch(`${BASE}/reconsidered`)).status).toBe(200)
  })

  /**
   * A slash on the end names the same page. A link written with one, or a
   * browser that added one, used to 404 on a page that plainly exists.
   */
  it('answers the same on a path with a trailing slash', async () => {
    const withSlash = await fetch(`${BASE}/thing/known/`)

    expect(withSlash.status).toBe(200)
    expect(await withSlash.text()).toContain('here it is')

    expect((await fetch(`${BASE}/gone/`)).status).toBe(410)
  })

  /**
   * The one that would have shipped broken. The cache fast path returns before
   * any server script runs, so a cached "not found" page would have answered
   * 200 from its second request onward - a bug that only appears once a page
   * is popular enough to be cached.
   */
  it('keeps the status when the render is served from cache', async () => {
    for (let attempt = 0; attempt < 3; attempt++)
      expect((await fetch(`${BASE}/thing/still-missing`)).status).toBe(404)

    for (let attempt = 0; attempt < 3; attempt++)
      expect((await fetch(`${BASE}/thing/known`)).status).toBe(200)
  })
})
