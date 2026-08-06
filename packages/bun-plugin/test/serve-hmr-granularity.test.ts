/**
 * HMR sends the narrowest update that can carry the change
 * (stacksjs/stx#1877 asks 4 and 5), end-to-end against a real serve()
 * subprocess.
 *
 * Every source edit used to broadcast `{type:'reload'}`, and the client ran
 * `location.reload()`. On a stateful page that throws away exactly what the SPA
 * exists to preserve: one reporting app's dashboard holds date-range, filter-chip
 * and drill-down state in client signals, and a one-character edit reset all of
 * it.
 *
 * Three narrower events now exist, and the classification is the part worth
 * pinning, because getting it wrong is silent in both directions — too narrow
 * and the page shows stale markup at HTTP 200, too wide and the state is gone
 * again:
 *
 *  - a store/composable edit re-executes just that bundle;
 *  - a page or component template re-renders the route and swaps the container;
 *  - a LAYOUT edit still reloads, because the swap replaces the container's
 *    contents and chrome rendered outside it would stay stale.
 *
 * The first attempt at this classified every store edit as a plain reload:
 * `fs.watch` reports filenames relative to the WATCHED directory, and resolving
 * them against cwd put every path outside `storesDir`. Only an end-to-end
 * observation of the event stream catches that — a unit test over the predicate
 * would have been handed the already-correct absolute path.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(90_000)

const PORT = 44_100 + (process.pid % 700)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null
/** Every HMR event type seen since the stream opened. */
const seen: string[] = []

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-hmr-gran-'))

  await Bun.write(path.join(dir, 'views', 'index.stx'), '<main><h1>Home</h1></main>\n')
  await Bun.write(path.join(dir, 'layouts', 'app.stx'), `<div>@yield('content')</div>\n`)
  await Bun.write(path.join(dir, 'stores', 'counter.ts'), `export const useCounter = defineStore('counter', () => {
  const count = state(0)
  function bump() { count.set(count() + 1) }
  return { count, bump }
})
`)
  await Bun.write(path.join(dir, 'stx.config.ts'), 'export default {}\n')

  // `views` is passed as a watchDir too: the pattern directories are watched
  // lazily by discoverFiles(), which only runs once a page is requested.
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, watch: true, layoutsDir: 'layouts', watchDirs: ['views'] })
`)

  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })

  const deadline = Date.now() + 45_000
  while (true) {
    try {
      await fetch(`${BASE}/definitely-not-a-page`)
      break
    }
    catch {
      if (Date.now() > deadline)
        throw new Error('serve() did not start')
      await Bun.sleep(100)
    }
  }

  // Hold the event stream open for the whole file and record what arrives.
  const stream = await fetch(`${BASE}/_stx/hmr`)
  const reader = stream.body!.getReader()
  void (async () => {
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data:')) continue
          try { seen.push(JSON.parse(line.slice(5)).type) }
          catch { /* keep-alive or partial chunk */ }
        }
      }
    }
    catch { /* stream closed with the server */ }
  })()

  await Bun.sleep(400)
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

/** Edit a file and wait for the resulting event, returning what arrived. */
async function editAndAwait(file: string, contents: string): Promise<string | undefined> {
  const before = seen.length
  await writeFile(path.join(dir, file), contents)
  const deadline = Date.now() + 15_000
  while (seen.length === before && Date.now() < deadline)
    await Bun.sleep(50)
  return seen[before]
}

describe('the store bundle endpoint', () => {
  it('serves the stores on their own, so an edit can be applied without a reload', async () => {
    const res = await fetch(`${BASE}/_stx/stores.js`)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('counter')
  })

  it('is never cached — the whole point is that it changed', async () => {
    const res = await fetch(`${BASE}/_stx/stores.js`)

    expect(res.headers.get('cache-control')).toContain('no-store')
  })
})

describe('event granularity', () => {
  it('sends a store event for a store edit, not a reload', async () => {
    const event = await editAndAwait('stores/counter.ts', `export const useCounter = defineStore('counter', () => {
  const count = state(0)
  function bump() { count.set(count() + 5) }
  return { count, bump }
})
`)

    expect(event).toBe('store')
  })

  it('sends a fragment event for a page template edit', async () => {
    const event = await editAndAwait('views/index.stx', '<main><h1>Home edited</h1></main>\n')

    expect(event).toBe('fragment')
  })

  it('still sends a full reload for a layout edit', async () => {
    // A container swap would leave chrome rendered OUTSIDE the container stale,
    // so the page would look updated while being half-old.
    const event = await editAndAwait('layouts/app.stx', `<div class="shell">@yield('content')</div>\n`)

    expect(event).toBe('reload')
  })
})
