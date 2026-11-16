import { afterAll, beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { freePort } from '../../stx/test-utils/test-port'
import { createTempDir } from '../../stx/src/temp-dir'

/**
 * A request for "/" renders the index once.
 *
 * The server asked whether an index existed by rendering it, used the answer
 * only to decide between the page and a redirect to /home, and then rendered
 * the same page again for the response. Every server script on the home page
 * ran twice per request and the first page was thrown away: on one app that
 * was half of a three-second home render. Anything a server script does
 * besides return markup (a query, a write, a counter) happened twice too.
 *
 * The redirect stays: an app with no index and a /home page is sent there.
 */

setDefaultTimeout(60_000)

const SERVE_SRC = path.join(import.meta.dir, '..', 'src', 'serve.ts')

interface Fixture { dir: string, base: string, proc: ReturnType<typeof Bun.spawn> }

async function start(prefix: string, views: Record<string, string>): Promise<Fixture> {
  const dir = createTempDir(prefix)
  const port = freePort()
  for (const [name, source] of Object.entries(views))
    await Bun.write(path.join(dir, 'views', name), source)
  await Bun.write(path.join(dir, 'driver.ts'), `import { serve } from ${JSON.stringify(SERVE_SRC)}

serve({ patterns: ['views'], port: ${port}, quiet: true })
`)
  const proc = Bun.spawn(['bun', 'driver.ts'], { cwd: dir, stdout: 'pipe', stderr: 'pipe' })
  const base = `http://localhost:${port}`
  const deadline = Date.now() + 30_000
  while (true) {
    try {
      await fetch(`${base}/__not_a_page`, { redirect: 'manual' })
      return { dir, base, proc }
    }
    catch {
      if (Date.now() > deadline)
        throw new Error(`${prefix} fixture server did not start`)
      await Bun.sleep(100)
    }
  }
}

async function stop(fixture?: Fixture): Promise<void> {
  if (!fixture)
    return
  fixture.proc.kill()
  await fixture.proc.exited
  await rm(fixture.dir, { recursive: true, force: true })
}

async function renders(fixture: Fixture): Promise<number> {
  const log = await readFile(path.join(fixture.dir, 'renders.log'), 'utf8').catch(() => '')
  return log.length
}

let withIndex: Fixture | undefined
let withoutIndex: Fixture | undefined

beforeAll(async () => {
  // Each run of the index's server script leaves one character in the log,
  // and the page says which run it was in a header.
  const index = `<script server>
const fs = require('node:fs')
fs.appendFileSync('renders.log', 'x')
const run = fs.readFileSync('renders.log', 'utf8').length
setResponseHeader('X-Render-Run', String(run))
</script>
<main>home page, run {{ run }}</main>
`
  ;[withIndex, withoutIndex] = await Promise.all([
    start('stx-root-once-', { 'index.stx': index, 'about.stx': '<main>about</main>\n' }),
    start('stx-root-home-', { 'home.stx': '<main>the dashboard</main>\n' }),
  ])
})

afterAll(async () => {
  await Promise.all([stop(withIndex), stop(withoutIndex)])
})

describe('a request for "/"', () => {
  it('runs the index page\'s server script once', async () => {
    const before = await renders(withIndex!)
    const response = await fetch(`${withIndex!.base}/`)
    const html = await response.text()
    const after = await renders(withIndex!)

    expect(response.status).toBe(200)
    expect(after - before).toBe(1)
    // The page sent is the render that ran, with that render's header.
    expect(response.headers.get('X-Render-Run')).toBe(String(after))
    expect(html).toContain(`home page, run ${after}`)
  })

  it('stays at one render a request across requests', async () => {
    const before = await renders(withIndex!)
    for (let i = 0; i < 3; i++)
      expect((await fetch(`${withIndex!.base}/`)).status).toBe(200)
    expect(await renders(withIndex!) - before).toBe(3)
  })

  it('reaches the index through /index the same way', async () => {
    const before = await renders(withIndex!)
    const response = await fetch(`${withIndex!.base}/index`)
    expect(response.status).toBe(200)
    expect(await renders(withIndex!) - before).toBe(1)
  })

  it('leaves other pages alone', async () => {
    const before = await renders(withIndex!)
    const response = await fetch(`${withIndex!.base}/about`)
    expect(await response.text()).toContain('about')
    expect(await renders(withIndex!) - before).toBe(0)
  })

  it('still sends an app with no index to /home', async () => {
    const response = await fetch(`${withoutIndex!.base}/`, { redirect: 'manual' })
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/home')
    const home = await fetch(`${withoutIndex!.base}/home`)
    expect(await home.text()).toContain('the dashboard')
  })
})
