import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fillRouteParams, isRenderableCacheCandidate, ROUTE_PARAMS_PLACEHOLDER, serverScriptsReadParams } from '../src/serve'

const PORT = 43_000 + (process.pid % 1000)
const BASE = `http://localhost:${PORT}`
const SERVE_SOURCE = path.join(import.meta.dir, '..', 'src', 'serve.ts')

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

beforeAll(async () => {
  fixtureDir = await mkdtemp(path.join(tmpdir(), 'stx-render-cache-'))
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
  // A source-derived shell: one render serves every record. Padded to the
  // size of a real page so a per-request copy is measurable in the heap.
  await Bun.write(path.join(fixtureDir, 'views', 'trail', '[id].stx'), `<script server>
const marker = crypto.randomUUID()
</script>
<main>shell-marker:{{ marker }}</main>
<p hidden>${'x'.repeat(200_000)}</p>
`)
  // A page that renders its record server-side must not share a render.
  await Bun.write(path.join(fixtureDir, 'views', 'post', '[slug].stx'), `<script server>
const heading = 'post-' + params.slug
const marker = crypto.randomUUID()
</script>
<main>{{ heading }} marker:{{ marker }}</main>
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

serve({
  patterns: ['views'],
  port: ${PORT},
  quiet: true,
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

afterAll(async () => {
  server?.kill()
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

  test('invalidates when an explicitly watched JSON dependency changes', async () => {
    const before = await page()
    await Bun.write(path.join(fixtureDir, 'data', 'manifest.json'), 'bravo')
    const after = await waitForContent('data:bravo')

    expect(after).not.toBe(before)
  })

  test('invalidates when the route source changes', async () => {
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
    expect(markerOf(again)).toBe(markerOf(two))
    // ...and each response still carries its own params.
    expect(one).toContain('var p={"id":"1"}')
    expect(two).toContain('var p={"id":"2"}')
    expect(again).toContain('var p={"id":"2"}')
    expect(two).not.toContain(ROUTE_PARAMS_PLACEHOLDER)
  })

  test('renders a page whose server script reads its params per record', async () => {
    const first = await (await fetch(`${BASE}/post/alpha`)).text()
    const second = await (await fetch(`${BASE}/post/bravo`)).text()

    expect(first).toContain('post-alpha')
    expect(second).toContain('post-bravo')
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
