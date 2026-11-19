import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { access, rm } from 'node:fs/promises'
import path from 'node:path'
import { fillRouteParams, isRenderableCacheCandidate, ROUTE_PARAMS_PLACEHOLDER, serverScriptsReadParams, templatesReadParamNames, trackParamReads } from '../src/serve'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

const PORT = freePort()
const BASE = `http://localhost:${PORT}`
const SERVE_SOURCE = path.join(import.meta.dir, '..', 'src', 'serve.ts')
const STX_SOURCE = path.join(import.meta.dir, '..', '..', 'stx', 'src', 'index.ts')

let fixtureDir = ''
let server: ReturnType<typeof Bun.spawn> | null = null

async function page(): Promise<string> {
  const response = await fetch(BASE)
  expect(response.status).toBe(200)
  return await response.text()
}

async function waitForContent(expected: string): Promise<string> {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const html = await page()
    if (html.includes(expected))
      return html
    await Bun.sleep(50)
  }
  throw new Error(`render cache did not invalidate for ${expected}`)
}

// Source edits intentionally invalidate the entire render cache. A filesystem
// event from one case must not land between cache reads in another (#2183).
// Each case starts a real server only after its own source fixture is written.
beforeEach(async () => {
  fixtureDir = createTempDir('stx-render-cache-')
  await Bun.write(path.join(fixtureDir, 'data', 'manifest.json'), 'alpha')
  await Bun.write(path.join(fixtureDir, 'views', 'index.stx'), `<script server>
const marker = crypto.randomUUID()
const manifest = await Bun.file('data/manifest.json').text()
</script>
<main>cache-marker:{{ marker }} data:{{ manifest }}</main>
`)
  await Bun.write(path.join(fixtureDir, 'views', 'prewarm.stx'), `<script server>
await Bun.write('prewarmed.txt', 'ready')
const marker = crypto.randomUUID()
</script>
<main>prewarm-marker:{{ marker }}</main>
`)
  await Bun.write(path.join(fixtureDir, 'views', 'language.stx'), `<script server>
definePageMeta({ cache: false })
const language = __stxServeContext.request.headers.get('accept-language') || 'en'
</script>
<main data-language="{{ language }}">Language</main>
`)
  // A source-derived shell: one render serves every record. Padded to the
  // size of a real page so a per-request copy is measurable in the heap.
  await Bun.write(path.join(fixtureDir, 'views', 'trail', '[id].stx'), `<script server>
await Bun.sleep(20)
const marker = crypto.randomUUID()
</script>
<main>shell-marker:{{ marker }}</main>
<p hidden>${'x'.repeat(200_000)}</p>
`)
  // Runtime cache opt-outs must release queued requests even though no shell
  // was retained for them to reuse.
  await Bun.write(path.join(fixtureDir, 'views', 'transient', '[id].stx'), `<script server>
await Bun.sleep(20)
const __stx_skip_cache = Boolean('skip')
const marker = crypto.randomUUID()
</script>
<main>transient-marker:{{ marker }}</main>
`)
  // A page that renders its record server-side must not share a render.
  await Bun.write(path.join(fixtureDir, 'views', 'post', '[slug].stx'), `<script server>
const heading = 'post-' + params.slug
const marker = crypto.randomUUID()
</script>
<main>{{ heading }} marker:{{ marker }}</main>
`)
  // Pages with no server script of their own that still render their params:
  // in markup, through a bound prop, in a component's server script, and by a
  // segment's bare name (stacksjs/stx#2188). The marker shows whether a render
  // was shared.
  await Bun.write(path.join(fixtureDir, 'views', 'probe', '[model].stx'), `<main>
<p data-inline="{{ params.model }}">inline</p>
<ProbeEcho />
<ProbeProp :model="params.model" />
<MarkerProbe />
</main>
`)
  await Bun.write(path.join(fixtureDir, 'views', 'echo', '[model].stx'), `<main><ProbeEcho /><MarkerProbe /></main>
`)
  await Bun.write(path.join(fixtureDir, 'views', 'bare', '[model].stx'), `<main><p data-bare="{{ model }}">bare</p><MarkerProbe /></main>
`)
  await Bun.write(path.join(fixtureDir, 'components', 'ProbeEcho.stx'), `<script server>
const seen = typeof params === 'object' && params !== null ? String(params.model ?? '') : 'no params'
</script>
<p data-seen="{{ seen }}">echo</p>
`)
  await Bun.write(path.join(fixtureDir, 'components', 'ProbeProp.stx'), `<script server>
const { model = '' } = defineProps()
</script>
<p data-prop="{{ model }}">prop</p>
`)
  await Bun.write(path.join(fixtureDir, 'components', 'MarkerProbe.stx'), `<script server>
const marker = crypto.randomUUID()
</script>
<p>probe-marker:{{ marker }}</p>
`)
  await Bun.write(path.join(fixtureDir, 'components', 'CompilerProbe.stx'), `<script server>
const { label = '' } = defineProps()
</script>
<script client>
const count = state(0)
</script>
<button @click="count.set(count() + 1)">{{ label }}:{{ count() }}</button>
`)
  for (let index = 0; index < 8; index++) {
    await Bun.write(path.join(fixtureDir, 'views', `warm-${index}.stx`), `<script server>
await Bun.write('prewarmed-${index}.txt', 'ready')
</script>
<main><CompilerProbe label="warm-${index}" /></main>
`)
  }
  await Bun.write(path.join(fixtureDir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SOURCE)}
import * as stx from ${JSON.stringify(STX_SOURCE)}

serve({
  patterns: ['views'],
  port: ${PORT},
  quiet: true,
  stxModule: stx,
  componentsDir: 'components',
  renderCache: true,
  renderCacheVary: 'source',
  prewarmRenderCache: 8,
  watchDirs: ['data'],
  routes: {
    // The server's own heap, after a full collection, for the leak test.
    '/__heap': () => {
      Bun.gc(true)
      return Response.json({ heapSize: require('bun:jsc').heapStats().heapSize })
    },
  },
})
`)

  server = Bun.spawn(['bun', 'driver.ts'], {
    cwd: fixtureDir,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      await page()
      return
    }
    catch {
      await Bun.sleep(100)
    }
  }
  throw new Error('render-cache fixture server did not start')
})

afterEach(async () => {
  server?.kill()
  await server?.exited
  server = null
  await rm(fixtureDir, { recursive: true, force: true })
})

describe('opt-in rendered HTML cache', () => {
  test('never caches recovered compiler failures', () => {
    expect(isRenderableCacheCandidate('<main>ready</main>')).toBe(true)
    expect(isRenderableCacheCandidate('<!-- Template Processing failed: transient compiler error -->')).toBe(false)
    expect(isRenderableCacheCandidate('<!-- stx rendering error -->')).toBe(false)
  })

  test('prewarms discovered static routes without a browser request', async () => {
    const deadline = Date.now() + 10_000
    let prewarmed = false
    while (Date.now() < deadline) {
      try {
        await Promise.all([
          access(path.join(fixtureDir, 'prewarmed.txt')),
          ...Array.from({ length: 8 }, (_, index) =>
            access(path.join(fixtureDir, `prewarmed-${index}.txt`))),
        ])
        prewarmed = true
        break
      }
      catch {
        await Bun.sleep(50)
      }
    }

    expect(prewarmed).toBe(true)

    const pages = await Promise.all(
      Array.from({ length: 8 }, async (_, index) => {
        const response = await fetch(`${BASE}/warm-${index}`)
        expect(response.status).toBe(200)
        return await response.text()
      }),
    )
    for (const [index, html] of pages.entries()) {
      expect(html).toContain(`warm-${index}:`)
      expect(html).not.toContain('Template processing failed')
      expect(html).not.toContain('Unexpected end of file')
    }
  })

  test('reuses a static render for the same request context', async () => {
    const first = await page()
    const second = await page()

    expect(first).toBe(second)
    expect(first).toContain('data:alpha')
  })

  test('page metadata keeps request-specific HTML out of the source cache', async () => {
    for (const language of ['en', 'de', 'en']) {
      const response = await fetch(`${BASE}/language`, { headers: { 'accept-language': language } })
      expect(response.status).toBe(200)
      expect(await response.text()).toContain(`data-language="${language}"`)
    }
  })

  test('invalidates when an explicitly watched JSON dependency changes', async () => {
    const before = await page()
    await Bun.write(path.join(fixtureDir, 'data', 'manifest.json'), 'bravo')
    const after = await waitForContent('data:bravo')

    expect(after).not.toBe(before)
  })

  test('invalidates when the route source changes', async () => {
    await Bun.write(path.join(fixtureDir, 'data', 'manifest.json'), 'bravo')
    await waitForContent('data:bravo')
    await Bun.write(path.join(fixtureDir, 'views', 'index.stx'), `<script server>
const marker = crypto.randomUUID()
const manifest = await Bun.file('data/manifest.json').text()
</script>
<main>updated-cache-marker:{{ marker }} data:{{ manifest }}</main>
`)

    const after = await waitForContent('updated-cache-marker:')
    expect(after).toContain('data:bravo')
  })

  test('renders a dynamic route shell once and fills each request\'s params', async () => {
    const markerOf = (html: string) => /shell-marker:([\w-]+)/.exec(html)?.[1]
    const [one, two] = await Promise.all(['1', '2'].map(async (id) => {
      const response = await fetch(`${BASE}/trail/${id}`)
      expect(response.status).toBe(200)
      return await response.text()
    }))
    const again = await (await fetch(`${BASE}/trail/2`)).text()

    // One render: the server script ran once for both records.
    expect(markerOf(one)).toBeDefined()
    expect(markerOf(two)).toBe(markerOf(one))
    expect(markerOf(again)).toBe(markerOf(two))
    // ...and each response still carries its own params.
    expect(one).toContain('var p={"id":"1"}')
    expect(two).toContain('var p={"id":"2"}')
    expect(again).toContain('var p={"id":"2"}')
    expect(two).not.toContain(ROUTE_PARAMS_PLACEHOLDER)
  })

  test('releases queued requests when the source shell opts out of caching at runtime', async () => {
    const responses = await Promise.all(['1', '2', '3'].map(async (id) => {
      const response = await fetch(`${BASE}/transient/${id}`)
      expect(response.status).toBe(200)
      const html = await response.text()
      expect(html).toContain(`var p={"id":"${id}"}`)
      return /transient-marker:([\w-]+)/.exec(html)?.[1]
    }))
    expect(responses.every(Boolean)).toBe(true)
    expect(new Set(responses).size).toBe(3)
  })

  test('renders a page whose server script reads its params per record', async () => {
    const first = await (await fetch(`${BASE}/post/alpha`)).text()
    const second = await (await fetch(`${BASE}/post/bravo`)).text()

    expect(first).toContain('post-alpha')
    expect(second).toContain('post-bravo')
  })

  test('renders a script-less page that uses its params for each address (#2188)', async () => {
    const get = async (url: string) => (await fetch(`${BASE}${url}`)).text()
    const attr = (html: string, name: string) => new RegExp(`${name}="([^"]*)"`).exec(html)?.[1]
    for (const model of ['alpha', 'beta', 'alpha', 'gamma']) {
      const html = await get(`/probe/${model}`)
      expect([attr(html, 'data-inline'), attr(html, 'data-seen'), attr(html, 'data-prop')]).toEqual([model, model, model])
    }
    // Read only in a component's server script.
    for (const model of ['one', 'two'])
      expect(attr(await get(`/echo/${model}`), 'data-seen')).toBe(model)
    // Read by the segment's bare name.
    for (const model of ['red', 'blue'])
      expect(attr(await get(`/bare/${model}`), 'data-bare')).toBe(model)
  })

  test('renders such a page per address in parallel, not one shell after another', async () => {
    const markerOf = (html: string) => /probe-marker:([\w-]+)/.exec(html)?.[1]
    await fetch(`${BASE}/probe/first`)
    const pages = await Promise.all(['a', 'b', 'c'].map(async model => (await fetch(`${BASE}/probe/${model}`)).text()))
    expect(new Set(pages.map(markerOf)).size).toBe(3)
    expect(pages.map(html => /data-inline="([^"]*)"/.exec(html)?.[1])).toEqual(['a', 'b', 'c'])
  })

  test('notes a read of params wherever it happens, and only of a param', () => {
    const reads = (use: (params: Record<string, string>) => unknown) => {
      const tracked = trackParamReads({ model: 'alpha' })
      use(tracked.params)
      return tracked.read()
    }
    expect(reads(params => params.model)).toBe(true)
    expect(reads(params => 'model' in params)).toBe(true)
    expect(reads(params => ({ ...params }))).toBe(true)
    expect(reads(params => JSON.stringify(params))).toBe(true)
    // Not reads of a param: a missing key reads the same for every address,
    // and the engine probes context values for markers.
    expect(reads(params => params.other)).toBe(false)
    expect(reads(params => (params as any)._isSignal)).toBe(false)
    expect(reads(params => typeof params)).toBe(false)
    expect(reads(params => ({ context: params }))).toBe(false)
  })

  test('decides which templates use a segment by its bare name', () => {
    expect(templatesReadParamNames(['<p>{{ model }}</p>'], ['model'])).toBe(true)
    expect(templatesReadParamNames(['<p>{!! model !!}</p>'], ['model'])).toBe(true)
    expect(templatesReadParamNames(['@if(model === "team")<p>x</p>@endif'], ['model'])).toBe(true)
    expect(templatesReadParamNames(['<Thing :model="model" />'], ['model'])).toBe(true)
    expect(templatesReadParamNames(['<script server>const t = load(model)</script><p>x</p>'], ['model'])).toBe(true)
    // Not the segment: an attribute of the same name, a property, prose.
    expect(templatesReadParamNames(['<div id="map" :key="row.id">The id of it</div>'], ['id'])).toBe(false)
    expect(templatesReadParamNames(['<p>{{ club.model }}</p>'], ['model'])).toBe(false)
    expect(templatesReadParamNames(['<p>{{ marker }}</p>'], [])).toBe(false)
  })

  test('decides which server scripts read params', () => {
    expect(serverScriptsReadParams(['const x = params.id'], ['id'])).toBe(true)
    expect(serverScriptsReadParams(['const t = await load(id)'], ['id'])).toBe(true)
    expect(serverScriptsReadParams(['const m = crypto.randomUUID()'], ['id'])).toBe(false)
    // A property of the same name is not the param.
    expect(serverScriptsReadParams(['const n = club.id'], ['id'])).toBe(false)
    expect(serverScriptsReadParams([], ['id'])).toBe(false)
  })

  test('fills params literally, whatever they contain', () => {
    const shell = `<script>var p=${ROUTE_PARAMS_PLACEHOLDER};</script>`
    expect(fillRouteParams(shell, { id: '$&</script>' })).toBe('<script>var p={"id":"$&\\u003C/script>"};</script>')
  })

  test('keeps nothing per URL: a crawler walking distinct pages does not grow the heap', async () => {
    // Every rendered page used to be stored in a map keyed by its URL that
    // nothing ever read, and only a source edit cleared it. A crawler walking
    // ~600k trail URLs grew wildloop.org's server by ~1 MB a page until the
    // kernel throttled it into answering nothing.
    const heap = async () => (await (await fetch(`${BASE}/__heap`)).json()).heapSize as number
    const walk = async (from: number, count: number) => {
      for (let id = from; id < from + count; id++)
        await (await fetch(`${BASE}/trail/${id}`)).text()
    }

    await walk(10_000, 20)
    const before = await heap()
    await walk(20_000, 300)
    const after = await heap()

    // 300 pages of ~200 KB is ~60 MB (more as UTF-16) if each is kept.
    expect(after - before).toBeLessThan(20 * 1024 * 1024)
  }, 60_000)
})
