import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { isRenderableCacheCandidate } from '../src/serve'

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
})
