/**
 * A served page resolves the native primitives, as `renderTemplate` with the
 * loaded config does.
 *
 * `loadStxConfig` puts the primitives on the config as components of last
 * resort (`nativePrimitives`). `serve()` builds its own per-render config and
 * left that behind, so a page with `<FloatingActions>` or `<View>` rendered
 * fine in a test and answered `component "floating-actions" could not be
 * resolved` from the dev server.
 */
import type { Subprocess } from 'bun'
import { afterAll, beforeAll, expect, it } from 'bun:test'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const SERVE_SRC = path.resolve(import.meta.dir, '../src/serve.ts')
const PORT = 49831
const BASE = `http://127.0.0.1:${PORT}`
let dir = ''
let proc: Subprocess | null = null

beforeAll(async () => {
  dir = await realpath(await mkdtemp(path.join(tmpdir(), 'stx-serve-primitives-')))
  await Bun.write(path.join(dir, 'stx.config.ts'), 'export default {}')
  await Bun.write(path.join(dir, 'views', 'index.stx'), `<script client>
const list = state([{ path: '/messages', label: 'Messages', symbol: 'message.fill' }])
</script>
<main><View class="p-4"><Text>Inbox</Text></View><FloatingActions :actions="list" /></main>
`)
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}
serve({ patterns: ['views'], port: ${PORT}, quiet: true })
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
        throw new Error('serve() subprocess never came up')
      await Bun.sleep(150)
    }
  }
}, 40_000)

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

it('serves a page that uses the native primitives', async () => {
  const html = await (await fetch(`${BASE}/`)).text()
  expect(html).not.toContain('could not be resolved')
  expect(html).toContain('data-native="View"')
  expect(html).toContain('>Inbox</span>')
  // `<FloatingActions>` takes no room, and carries what draws it in a browser.
  expect(html).toContain('data-floating-actions')
  expect(html).toContain('mountFloatingActionsWeb')
})
