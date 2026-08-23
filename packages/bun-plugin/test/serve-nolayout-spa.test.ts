/**
 * A page that writes its own <html> must not look like a layout change
 * (stacksjs/stx#1958).
 *
 * The router decides whether a navigation can be a fragment swap by comparing
 * `X-STX-Layout` / `X-STX-Layout-Group` against what it reads off the live
 * document — `<meta name="stx-layout">` and `<meta name="stx-layout-group">`.
 * An `@nolayout` page carries neither, so the client falls back to
 * `deriveLayoutGroup('')`, which is `app`.
 *
 * This server used to answer `default` for the same state, from a local regex
 * with its own fallback rather than the shared helper. The two never agreed, so
 * every navigation between two layout-less pages read as a layout GROUP change:
 * the router fetched the fragment, threw it away, fetched the whole page again
 * and full-reloaded. SPA routing was off for the entire site, every click cost
 * two requests, and the discarded fragment fetch hit the page's own url — which
 * is what a CDN in front of the origin then stored and served to everyone.
 *
 * `app` is not the interesting part; agreeing with the client is. The assertion
 * is written against `deriveLayoutGroup`, the function the client's fallback
 * mirrors, so this stays true if that default is ever changed.
 */
import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { deriveLayoutGroup } from 'stx-router/layout-metadata'

setDefaultTimeout(60_000)

const PORT = 44_900 + (process.pid % 600)
const BASE = `http://localhost:${PORT}`
const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

let dir: string
let proc: ReturnType<typeof Bun.spawn> | null = null

/** A whole document of its own, the way `@nolayout` pages are written. */
function standalonePage(title: string, heading: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head><title>${title}</title></head>
  <body>
    <nav><a href="/">Home</a></nav>
    <main><h1>${heading}</h1></main>
  </body>
</html>
`
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-nolayout-spa-'))

  await Bun.write(path.join(dir, 'views', 'benefits.stx'), standalonePage('Benefits', 'A club, not a gym floor'))
  await Bun.write(path.join(dir, 'views', 'classes.stx'), standalonePage('Classes', 'Sixteen classes'))

  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${PORT} })
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

async function layoutHeaders(pathname: string) {
  const res = await fetch(`${BASE}${pathname}`, { headers: { 'X-STX-Router': 'true' } })
  return {
    isFragment: res.headers.get('X-STX-Fragment'),
    layout: res.headers.get('X-STX-Layout'),
    group: res.headers.get('X-STX-Layout-Group'),
  }
}

describe('layout headers for a page with no layout', () => {
  it('reports the group the router derives for a document with no layout meta', async () => {
    const { group } = await layoutHeaders('/benefits')
    expect(group).toBe(deriveLayoutGroup(''))
  })

  it('reports no layout name, rather than inventing one', async () => {
    // The client reads this as `r.headers.get('X-STX-Layout') || ''`, and its
    // name comparison is guarded by `curLayoutName && newLayout` — so an absent
    // or empty name is inert either way. (An empty header value is dropped on
    // the wire, which is why this accepts null.) A made-up name is NOT inert:
    // it is unequal to the empty string the client reads off a layout-less
    // document, which is the comparison that was firing on every navigation.
    const { layout } = await layoutHeaders('/benefits')
    expect(layout ?? '').toBe('')
  })

  it('agrees across two layout-less pages, so navigation between them can swap', async () => {
    const from = await layoutHeaders('/benefits')
    const to = await layoutHeaders('/classes')

    expect(from.isFragment).toBe('true')
    expect(to.isFragment).toBe('true')
    expect(to.group).toBe(from.group)
    expect(to.layout).toBe(from.layout)
  })
})
