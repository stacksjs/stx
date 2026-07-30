import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Request context + dynamic params in `<script server>` (stacksjs/stacks#1967).
 *
 * Pins three fixes, end-to-end against a real serve() subprocess:
 *
 * 1. `params` — the documented name→value object for `[param].stx` routes is
 *    populated (it used to be always `{}` on the serve path), URL-decoded, and
 *    `useRoute().params`/`useRoute().query` agree with it server-side.
 * 2. `__stxServeContext` — the full request snapshot (url/path/search/cookies)
 *    is an ambient binding in every server script, and a plain-object return
 *    from `onRequest` is merged into it (the race-free app channel).
 * 3. The singleton race — a request whose handling suspends at an await while
 *    ANOTHER request completes (resetting the module-level activeServe*
 *    singletons in its `finally`) must still see ITS OWN cookies/search.
 *    Before the per-request snapshot was threaded through, the suspended
 *    render read the reset singletons: empty cookie, empty search.
 */

setDefaultTimeout(60_000)

const PORT = 42_000 + (process.pid % 1000)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
  const res = await fetch(url, { headers })
  return await res.text()
}

/** Extract and parse the PROBE::…::END JSON a fixture page renders ({{ }} HTML-escapes quotes). */
function parseProbe(html: string): Record<string, unknown> {
  const m = html.match(/PROBE::(.*?)::END/s)
  if (!m)
    throw new Error(`no probe marker in response:\n${html.slice(0, 400)}`)
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-serve-ctx-'))

  // A dynamic route probing every request-context surface at once.
  await Bun.write(path.join(dir, 'views', 'probe', '[id].stx'), `<script server>
const route = useRoute()
const probe = {
  bareId: typeof id !== 'undefined' ? id : null,
  paramsId: params?.id ?? null,
  cookieToken: cookies?.token ?? null,
  search: typeof __stxServeSearch !== 'undefined' ? __stxServeSearch : null,
  ctxPath: typeof __stxServeContext !== 'undefined' ? __stxServeContext.path : null,
  ctxUrl: typeof __stxServeContext !== 'undefined' ? __stxServeContext.url : null,
  merged: typeof __stxServeContext !== 'undefined' ? (__stxServeContext.mergedFromHook ?? null) : null,
  routeParamsId: route.params.id ?? null,
  routeQueryX: route.query.x ?? null,
}
const probeJson = JSON.stringify(probe)
</script>
<div id="probe">PROBE::{{ probeJson }}::END</div>
`)

  // A static route whose HANDLING is delayed in onRequest — long enough for a
  // concurrent request to complete and reset the module singletons.
  await Bun.write(path.join(dir, 'views', 'slow.stx'), `<script server>
const probe = {
  cookieToken: cookies?.token ?? null,
  search: typeof __stxServeSearch !== 'undefined' ? __stxServeSearch : null,
}
const probeJson = JSON.stringify(probe)
</script>
<div id="probe">PROBE::{{ probeJson }}::END</div>
`)

  await Bun.write(path.join(dir, 'views', 'title-alpha.stx'), `
@title('Alpha title')
<main><p>Alpha page</p></main>
`)
  await Bun.write(path.join(dir, 'views', 'title-bravo.stx'), `
@title('Bravo title')
<main><p>Bravo page</p></main>
`)
  await Bun.write(path.join(dir, 'views', 'seo-alpha.stx'), `<script server>
await Bun.sleep(15)
useSeoMeta({ title: 'Alpha SEO', description: 'Alpha description' })
</script>
<main><p>Alpha SEO page</p></main>
`)
  await Bun.write(path.join(dir, 'views', 'seo-bravo.stx'), `<script server>
await Bun.sleep(5)
useSeoMeta({ title: 'Bravo SEO', description: 'Bravo description' })
</script>
<main><p>Bravo SEO page</p></main>
`)

  // Driver: boots serve() from source with an onRequest hook that (a) delays
  // /slow so the race window is wide open, and (b) returns a plain object so
  // the merge-into-context contract is exercised.
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({
  patterns: ['views'],
  port: ${PORT},
  async onRequest(req) {
    const { pathname } = new URL(req.url)
    if (pathname.startsWith('/slow'))
      await Bun.sleep(250)
    return { mergedFromHook: 'hook-value' }
  },
})
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  // Wait for the server to accept requests.
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
  await rm(dir, { recursive: true, force: true })
})

describe('dynamic route params in <script server>', () => {
  it('populates params, the bare identifier, and useRoute() — URL-decoded', async () => {
    const html = await fetchText(`${BASE}/probe/caf%C3%A9-42?x=1`, { cookie: 'token=tok123' })
    const probe = parseProbe(html)
    expect(probe.bareId).toBe('café-42')
    expect(probe.paramsId).toBe('café-42')
    expect(probe.routeParamsId).toBe('café-42')
    expect(probe.routeQueryX).toBe('1')
  })

  it('carries escaped client route params in SPA fragments', async () => {
    const res = await fetch(`${BASE}/probe/%3Cjob-15%3E`, {
      headers: { 'X-STX-Router': 'true' },
    })
    const html = await res.text()

    expect(res.headers.get('X-STX-Fragment')).toBe('true')
    expect(html).toContain('data-stx-route-params')
    expect(html).toContain('window.stx.setRouteParams')
    expect(html).toContain('\\u003Cjob-15>')
    expect(html).not.toContain('var p={"id":"<job-15>"}')
  })
})

describe('__stxServeContext in <script server>', () => {
  it('exposes url/path/search/cookies and the merged onRequest object', async () => {
    const html = await fetchText(`${BASE}/probe/abc?x=7`, { cookie: 'token=tok456' })
    const probe = parseProbe(html)
    expect(probe.cookieToken).toBe('tok456')
    expect(probe.search).toBe('?x=7')
    expect(probe.ctxPath).toBe('/probe/abc')
    expect(String(probe.ctxUrl)).toContain('/probe/abc?x=7')
    expect(probe.merged).toBe('hook-value')
  })

  it('a query-less request sees an EMPTY search, not the previous request\'s', async () => {
    await fetchText(`${BASE}/probe/first?stale=1`) // leaves ?stale=1 behind pre-fix
    const probe = parseProbe(await fetchText(`${BASE}/probe/second`))
    expect(probe.search).toBe('')
  })
})

describe('concurrent-request singleton race (the #1967 nondeterminism)', () => {
  it('a render suspended at an await keeps its own cookies/search', async () => {
    // A: handling suspends 250ms in onRequest before the render runs.
    const a = fetchText(`${BASE}/slow?mine=1`, { cookie: 'token=slowAAA' })
    // B: lands mid-suspension, completes fast, and its `finally` resets the
    // module singletons — which is what A's render used to read.
    await Bun.sleep(80)
    await fetchText(`${BASE}/definitely-not-a-page`)
    const probe = parseProbe(await a)
    expect(probe.cookieToken).toBe('slowAAA')
    expect(probe.search).toBe('?mine=1')
  })

  it('keeps directive head state isolated between concurrent renders', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, async (_, index) => {
        const page = index % 2 === 0 ? 'alpha' : 'bravo'
        return {
          page,
          html: await fetchText(`${BASE}/title-${page}`),
        }
      }),
    )

    for (const response of responses) {
      const expected = response.page === 'alpha' ? 'Alpha title' : 'Bravo title'
      expect(response.html).toContain(`<title>${expected}</title>`)
    }
  })

  it('keeps server-script SEO state isolated between concurrent renders', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, async (_, index) => {
        const page = index % 2 === 0 ? 'alpha' : 'bravo'
        return {
          page,
          html: await fetchText(`${BASE}/seo-${page}`),
        }
      }),
    )

    for (const response of responses) {
      const expectedTitle = response.page === 'alpha' ? 'Alpha SEO' : 'Bravo SEO'
      const expectedDescription = response.page === 'alpha' ? 'Alpha description' : 'Bravo description'
      const otherDescription = response.page === 'alpha' ? 'Bravo description' : 'Alpha description'
      expect(response.html).toContain(`<title>${expectedTitle}</title>`)
      expect(response.html).toContain(`content="${expectedDescription}"`)
      expect(response.html).not.toContain(otherDescription)
    }
  })
})
