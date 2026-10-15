/**
 * A page whose dev server restarts reloads once the server is back, not
 * while it is still down.
 *
 * The HMR client reloaded 400ms after its stream closed. A restart takes
 * longer than that, so the reload asked a server that was not there: the
 * browser showed its error page, or an offline worker stood in with a screen
 * it had kept (HQ's coach calendar came back as the phone app's Today, which
 * then sent the desktop to the home page). The client now reconnects with
 * backoff and reloads when the stream answers again.
 *
 * The client is taken from a page the real dev server rendered and run
 * against a fake EventSource, so each step of a restart can be played.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

setDefaultTimeout(120_000)

const PORT = freePort()
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null
let client = ''

beforeAll(async () => {
  dir = createTempDir('stx-hmr-reconnect-')
  await Bun.write(path.join(dir, 'views', 'index.stx'), '<main><h1>index</h1></main>\n')
  await Bun.write(path.join(dir, 'layouts', 'app.stx'), `<div>@yield('content')</div>\n`)
  await Bun.write(path.join(dir, 'stx.config.ts'), 'export default {}\n')
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, watch: true, layoutsDir: 'layouts', watchDirs: ['views'] })
`)
  proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe', env: { ...process.env, NODE_ENV: 'development' } })
  const deadline = Date.now() + 45_000
  while (!client) {
    try {
      const html = await (await fetch(`${BASE}/`)).text()
      client = /<script data-stx-hmr>([\s\S]*?)<\/script>/.exec(html)?.[1] || ''
    }
    catch {}
    if (!client) {
      if (Date.now() > deadline)
        throw new Error('serve() did not render a page with its HMR client')
      await Bun.sleep(100)
    }
  }
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

/** The client running in a fake page: its streams, its timers, its reloads. */
function run() {
  const streams: any[] = []
  const timers: Array<() => void> = []
  const page = { reloads: 0 }
  class FakeEventSource {
    readyState = 0
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: (() => void) | null = null
    constructor(public url: string) { streams.push(this) }
    close() { this.readyState = 2 }
    send(message: object) { this.readyState = 1; this.onmessage?.({ data: JSON.stringify(message) }) }
    fail() { this.readyState = 2; this.onerror?.() }
  }
  const win: any = {
    EventSource: FakeEventSource,
    location: { reload: () => { page.reloads++ } },
    setTimeout: (fn: () => void) => { timers.push(fn); return timers.length },
    addEventListener: () => {},
    document: { querySelectorAll: () => [], getElementById: () => null },
  }
  win.window = win
  // eslint-disable-next-line no-new-func
  new Function('window', 'EventSource', 'location', 'setTimeout', 'addEventListener', 'document', client)(
    win, win.EventSource, win.location, win.setTimeout, win.addEventListener, win.document,
  )
  return { streams, timers, page, tick: () => timers.splice(0).forEach(fn => fn()) }
}

describe('the HMR client across a dev server restart', () => {
  it('waits for the server to come back before it reloads', () => {
    const { streams, page, tick } = run()
    expect(streams).toHaveLength(1)
    streams[0].send({ type: 'connected', version: 0 })
    expect(page.reloads).toBe(0)

    // The server goes away: no reload yet, a reconnect is scheduled.
    streams[0].fail()
    expect(page.reloads).toBe(0)
    tick()
    expect(streams).toHaveLength(2)

    // Still down: it keeps trying and still does not reload.
    streams[1].fail()
    tick()
    expect(streams).toHaveLength(3)
    expect(page.reloads).toBe(0)

    // Back, on the same version a fresh server starts at: the page reloads
    // anyway, since a restart is what usually follows a change.
    streams[2].send({ type: 'connected', version: 0 })
    expect(page.reloads).toBe(1)
  })

  it('does not reload on a stream that never dropped', () => {
    const { streams, page } = run()
    streams[0].send({ type: 'connected', version: 0 })
    streams[0].send({ type: 'connected', version: 0 })
    expect(page.reloads).toBe(0)
  })
})
