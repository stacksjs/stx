import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { rm, utimes } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

/**
 * `renderCachePersist` end to end (stacksjs/stx#2133): one server renders a
 * page and stops; the next one serves that render without running the page's
 * server script, unless something it depends on changed while nothing ran.
 */

const SERVE_SOURCE = path.join(import.meta.dir, '..', 'src', 'serve.ts')
let fixtureDir = ''

beforeAll(async () => {
  fixtureDir = createTempDir('stx-render-persist-')
  await Bun.write(path.join(fixtureDir, 'data', 'label.json'), '"alpha"')
  // A fresh marker on every render: the same marker twice means one render.
  await Bun.write(path.join(fixtureDir, 'views', 'index.stx'), `<script server>
const marker = crypto.randomUUID()
const label = await Bun.file('data/label.json').json()
</script>
<html><head><title>persist</title></head><body><main>marker:{{ marker }} label:{{ label }}</main></body></html>
`)
})

afterAll(async () => {
  await rm(fixtureDir, { recursive: true, force: true })
})

/** Start a server, fetch `/`, stop it. */
async function renderOnce(persist: boolean, buildId: string): Promise<string> {
  const port = freePort()
  await Bun.write(path.join(fixtureDir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SOURCE)}
serve({
  patterns: ['views'],
  port: ${port},
  quiet: true,
  renderCache: true,
  renderCacheVary: 'source',
  renderCachePersist: ${persist},
  imageWarmup: false,
  watchDirs: ['data'],
})
`)
  const server = Bun.spawn(['bun', 'driver.ts'], { cwd: fixtureDir, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, STX_BUILD_ID: buildId } })
  try {
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      const html = await fetch(`http://localhost:${port}/`).then(response => response.ok ? response.text() : null, () => null)
      if (html)
        return html
      await Bun.sleep(100)
    }
    throw new Error('persist fixture server did not start')
  }
  finally {
    server.kill()
    await server.exited
  }
}

const marker = (html: string): string => /marker:([\w-]+)/.exec(html)?.[1] ?? ''

describe('renderCachePersist', () => {
  test('a restarted server serves the kept render, under its own build id', async () => {
    const first = await renderOnce(true, 'build-one')
    // The background write lands after the response; give it a moment.
    await Bun.sleep(300)
    const second = await renderOnce(true, 'build-two')

    expect(marker(first)).not.toBe('')
    expect(marker(second)).toBe(marker(first))
    expect(second).toContain('<meta name="stx-build" content="build-two">')
    expect(second).not.toContain('build-one')
  }, 90_000)

  test('a watched file changed while nothing ran is a miss', async () => {
    const before = await renderOnce(true, 'build-three')
    await Bun.sleep(300)
    const file = path.join(fixtureDir, 'data', 'label.json')
    await Bun.write(file, '"beta"')
    const later = new Date(Date.now() + 5_000)
    await utimes(file, later, later)

    const after = await renderOnce(true, 'build-four')
    expect(marker(after)).not.toBe(marker(before))
    expect(after).toContain('label:beta')
  }, 90_000)

  test('without the option, every process renders for itself', async () => {
    const first = await renderOnce(false, 'build-five')
    await Bun.sleep(300)
    const second = await renderOnce(false, 'build-six')
    expect(marker(second)).not.toBe(marker(first))
  }, 90_000)
})
