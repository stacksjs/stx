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

  // `notFound()` — the same decision in the spelling a dynamic page reaches
  // for, and the one that used to be declared for the type checker, implemented
  // in render.ts, and read by no server at all.
  await Bun.write(path.join(dir, 'views', 'record', '[id].stx'), `<script server>
const found = id === 'known'
if (!found)
  notFound()
const label = found ? 'here it is' : 'no such record'
</script>
<main>{{ label }}</main>
`)

  // notFound() then a change of mind. Both spellings have to share one sink,
  // or the page gets whichever the serve read last rather than the one it asked
  // for last.
  await Bun.write(path.join(dir, 'views', 'undecided.stx'), `<script server>
notFound()
setResponseStatus(200)
</script>
<main>found after all</main>
`)

  // The template spelling: the status beside the markup that explains it,
  // inside the branch that already knows.
  await Bun.write(path.join(dir, 'views', 'feature', '[slug].stx'), `<script server>
const feature = slug === 'queues' ? { title: 'Queues' } : null
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

  // A page that sets a header as well as a status. A 301 that cannot say where
  // to is worse than the 404 it replaced.
  await Bun.write(path.join(dir, 'views', 'moved.stx'), `<script server>
setResponseStatus(301)
setResponseHeader('Location', '/gone')
</script>
<main>moved</main>
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

  it('answers 404 for notFound(), and 200 for the record that exists', async () => {
    const missing = await fetch(`${BASE}/record/anything-else`)
    const found = await fetch(`${BASE}/record/known`)

    expect(missing.status).toBe(404)
    // The failure this replaces was silent in exactly this spot: the call threw
    // inside the script's own IIFE, `label` went with it, and the page rendered
    // blank under a 200 — which reads like the feature working.
    expect(await missing.text()).toContain('no such record')

    expect(found.status).toBe(200)
    expect(await found.text()).toContain('here it is')
  })

  it('lets notFound() be taken back, so the two spellings share one sink', async () => {
    expect((await fetch(`${BASE}/undecided`)).status).toBe(200)
  })

  it('sends the headers the page asked for alongside the status', async () => {
    const res = await fetch(`${BASE}/moved`, { redirect: 'manual' })

    expect(res.status).toBe(301)
    expect(res.headers.get('Location')).toBe('/gone')
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

/**
 * The template spelling. Same decision, expressed where the branch already
 * knows the answer, so the status sits beside the markup that explains it
 * rather than being re-derived from a flag at the top of the server block.
 */
describe('@status', () => {
  it('answers 404 from the branch that rendered', async () => {
    const res = await fetch(`${BASE}/feature/nonsense`)

    expect(res.status).toBe(404)
    expect(await res.text()).toContain('No feature by that name.')
    expect(await (await fetch(`${BASE}/feature/nonsense`)).text()).not.toContain('@status')
  })

  it('does not fire from the branch that lost', async () => {
    const res = await fetch(`${BASE}/feature/queues`)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Queues')
  })

  it('holds the status across a cached render', async () => {
    for (let attempt = 0; attempt < 3; attempt++)
      expect((await fetch(`${BASE}/feature/still-nonsense`)).status).toBe(404)
  })
})
