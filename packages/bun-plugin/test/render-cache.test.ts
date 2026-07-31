import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

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
  await Bun.write(path.join(fixtureDir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SOURCE)}

serve({
  patterns: ['views'],
  port: ${PORT},
  quiet: true,
  renderCache: true,
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
