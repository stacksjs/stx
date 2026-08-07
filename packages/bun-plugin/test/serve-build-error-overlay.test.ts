/**
 * A client script that will not bundle reaches the browser (stacksjs/stx#1884
 * ask 2), end-to-end against a real serve() subprocess.
 *
 * The bundler falls back to shipping the ORIGINAL, unbundled source so the page
 * still renders. That is right for a dev server and wrong as the *only* signal:
 * the imports never resolve, so every binding in that script quietly does
 * nothing, and the only evidence was a `console.warn` scrolling past in a
 * terminal the author may not be looking at. The build half of this now exits
 * non-zero (`c33162a8f1`); this is the dev half.
 *
 * The replay-on-connect case is the one worth pinning. On a full page load the
 * response is sent BEFORE the browser opens its EventSource, so broadcasting
 * alone reaches only the previous page's connection — the overlay would never
 * appear on the very load that failed. A test that only edits a file after
 * connecting would pass while that was broken.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

setDefaultTimeout(90_000)

const PORT = 45_100 + (process.pid % 600)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-build-err-'))

  // A client script importing a module that does not exist.
  await Bun.write(path.join(dir, 'views', 'broken.stx'), `<main><h1>Broken</h1></main>
<script client>
import { missing } from './does-not-exist'
const n = state(0)
missing(n)
</script>
`)
  // A syntax error, deliberately far down the file. The bundler compiles a temp
  // entry containing only the script body, so Bun's reported line is nowhere
  // near the real one — line 3 of the entry is line 11 here.
  // A relative import is what makes the bundler run at all — bundling is opt-in
  // on detecting USER imports, and `from 'stx'` is a known non-user import.
  await Bun.write(path.join(dir, 'views', 'helper.ts'), 'export const help = 1\n')
  await Bun.write(path.join(dir, 'views', 'syntax.stx'), `<main>
  <h1>Syntax</h1>
  <p>padding</p>
  <p>padding</p>
  <p>padding</p>
  <p>padding</p>
</main>
<script client>
import { help } from './helper'
const broken = ===
</script>
`)
  await Bun.write(path.join(dir, 'views', 'fine.stx'), '<main><h1>Fine</h1></main>\n')
  await Bun.write(path.join(dir, 'stx.config.ts'), 'export default {}\n')
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT}, watch: true, watchDirs: ['views'] })
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
})

afterAll(async () => {
  proc?.kill()
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

/**
 * Read HMR events on a FRESH connection until one satisfies `want`.
 *
 * Used only for the replay-on-connect case, where a new connection is the point.
 */
async function awaitEventOnNewConnection(want: (event: any) => boolean, timeoutMs = 15_000): Promise<any> {
  const response = await fetch(`${BASE}/_stx/hmr`)
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  const deadline = Date.now() + timeoutMs
  try {
    while (Date.now() < deadline) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data:')) continue
        try {
          const event = JSON.parse(line.slice(5))
          if (want(event)) return event
        }
        catch { /* keep-alive or partial chunk */ }
      }
    }
  }
  finally {
    await reader.cancel().catch(() => {})
  }
  return undefined
}

/**
 * Every event seen on ONE long-lived connection, which is what a browser has.
 *
 * A fresh connection per assertion would miss any event broadcast between the
 * request and the connect, and would make the clearing case untestable.
 */
const seen: any[] = []

async function openPersistentStream(): Promise<void> {
  const response = await fetch(`${BASE}/_stx/hmr`)
  const reader = response.body!.getReader()
  void (async () => {
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data:')) continue
          try { seen.push(JSON.parse(line.slice(5))) }
          catch { /* keep-alive or partial chunk */ }
        }
      }
    }
    catch { /* stream closed with the server */ }
  })()
  await Bun.sleep(300)
}

/** Wait for an event on the persistent stream. */
async function awaitOnStream(want: (event: any) => boolean, timeoutMs = 15_000): Promise<any> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const found = seen.find(want)
    if (found) return found
    await Bun.sleep(50)
  }
  return undefined
}

describe('a client script that will not bundle', () => {
  it('still renders the page', async () => {
    // The fallback is deliberate: a dev server you cannot load is worse than one
    // showing you the error.
    const res = await fetch(`${BASE}/broken`)

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Broken')
  })

  it('reaches a browser that connects after the failing render', async () => {
    await fetch(`${BASE}/broken`)

    const event = await awaitEventOnNewConnection(e => e.type === 'build-error' && e.errors.length > 0)

    expect(event).toBeDefined()
    expect(event.errors[0].file).toContain('broken.stx')
    expect(event.errors[0].message).toMatch(/resolve|does-not-exist/i)
  })

  it('carries a code frame at the line in the .stx file, not in the temp entry', async () => {
    // `const broken = ===` is line 10 of syntax.stx and line 3 of the temp entry
    // the bundler compiles. Passing Bun's number straight through would point
    // the overlay at `<p>padding</p>` — so 3 is the value that must NOT appear.
    await fetch(`${BASE}/syntax`)

    const event = await awaitEventOnNewConnection(e =>
      e.type === 'build-error' && e.errors.some((x: any) => x.file?.includes('syntax.stx')))
    const error = event?.errors.find((x: any) => x.file?.includes('syntax.stx'))

    expect(error.line).toBe(10)

    const marked = error.frame.find((f: any) => f.isError)
    expect(marked.number).toBe(10)
    expect(marked.text).toContain('===')
    // The frame shows context either side, which is what makes it readable.
    expect(error.frame.length).toBeGreaterThan(1)
  })

  it('reports no line rather than a wrong one when it cannot be corroborated', async () => {
    // An unresolved import comes back from Bun as line -1 with no source text to
    // match on. Absent is the honest answer; a confident wrong line sends the
    // reader to code that is fine.
    await fetch(`${BASE}/broken`)

    const event = await awaitEventOnNewConnection(e =>
      e.type === 'build-error' && e.errors.some((x: any) => x.file?.includes('broken.stx')))
    const error = event?.errors.find((x: any) => x.file?.includes('broken.stx'))

    expect(error.line).toBeUndefined()
    expect(error.frame).toEqual([])
    // The message still names what could not be found.
    expect(error.message).toMatch(/does-not-exist/)
  })

  it('injects the overlay renderer into the page', async () => {
    const html = await fetch(`${BASE}/broken`).then(r => r.text())

    expect(html).toContain('__stxOverlay')
    expect(html).toContain('build-error')
  })
})

describe('recovery', () => {
  it('clears once a render bundles cleanly', async () => {
    // The overlay has to take itself down, or it becomes something to dismiss
    // rather than something to trust. Observed on ONE connection, as a browser
    // has: the clearing broadcast goes to whoever is already listening, so a
    // fresh connection per assertion would miss it entirely.
    await openPersistentStream()

    await fetch(`${BASE}/broken`)
    expect(await awaitOnStream(e => e.type === 'build-error' && e.errors.length > 0)).toBeDefined()

    await fetch(`${BASE}/fine`)
    const cleared = await awaitOnStream(e => e.type === 'build-error' && e.errors.length === 0)

    expect(cleared).toBeDefined()
  })
})
