/**
 * The programmatic `serve()` answering with the status its page decided.
 *
 * This is the third host to render stx views and the third to discard the
 * answer. It was worse than discarding it: nothing put `setResponseStatus` in
 * scope here, so the call threw a ReferenceError *inside the server script's
 * own IIFE* and took every other binding in the file with it — the page then
 * rendered its empty branch under a 200, which reads as the feature working.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { serve } from '../../src/serve'

const DIR = path.join(import.meta.dir, 'fixtures-response-status')

let server: Awaited<ReturnType<typeof serve>> | null = null
// Filled in by beforeAll from the address the server actually bound. Picking a
// number here instead -- this drew one at random from 9400-9799 -- races every
// other test that starts a server: serve.test.ts walked a counter through the
// same range, and when the two met, the fetches below reached ITS server and
// got 404 for every fixture this file had written.
let BASE = ''

beforeAll(async () => {
  await fs.promises.mkdir(DIR, { recursive: true })

  await Bun.write(path.join(DIR, 'retired.stx'), `<script server>
const heading = 'This page is gone.'
setResponseStatus(410)
</script>
<h1>{{ heading }}</h1>
`)

  await Bun.write(path.join(DIR, 'missing.stx'), `<script server>
const heading = 'No such record.'
notFound()
</script>
<h1>{{ heading }}</h1>
`)

  await Bun.write(path.join(DIR, 'declared.stx'), `@status(404)
<h1>Declared in the template.</h1>
`)

  await Bun.write(path.join(DIR, 'moved.stx'), `<script server>
setResponseStatus(301)
setResponseHeader('Location', '/retired')
</script>
<h1>Moved.</h1>
`)

  await Bun.write(path.join(DIR, 'ordinary.stx'), `<h1>Nothing special.</h1>\n`)

  // 0 asks the OS for a free port. serve() resolves once it is listening and
  // reports where, so there is nothing left to poll for.
  server = await serve({ port: 0, root: DIR, watch: false })
  BASE = server.url.replace(/\/$/, '')
})

afterAll(async () => {
  server?.stop()
  if (fs.existsSync(DIR))
    await fs.promises.rm(DIR, { recursive: true, force: true })
})

describe('serve() and the status a page asked for', () => {
  it('answers with setResponseStatus, and still renders the rest of the script', async () => {
    const res = await fetch(`${BASE}/retired`)

    expect(res.status).toBe(410)
    // The half that used to fail silently: `heading` was collateral damage of
    // the ReferenceError, so the page came back blank.
    expect(await res.text()).toContain('This page is gone.')
  })

  it('answers with notFound()', async () => {
    const res = await fetch(`${BASE}/missing`)

    expect(res.status).toBe(404)
    expect(await res.text()).toContain('No such record.')
  })

  it('answers with @status()', async () => {
    expect((await fetch(`${BASE}/declared`)).status).toBe(404)
  })

  it('sends the headers alongside, so a redirect names its destination', async () => {
    const res = await fetch(`${BASE}/moved`, { redirect: 'manual' })

    expect(res.status).toBe(301)
    expect(res.headers.get('Location')).toBe('/retired')
  })

  it('leaves a page that asked for nothing at 200', async () => {
    expect((await fetch(`${BASE}/ordinary`)).status).toBe(200)
  })

  it('keeps the status when the response comes from the file cache', async () => {
    // The cache returns without rendering, so a status stored only in the
    // render context would be right once and 200 after — a bug that surfaces
    // only under traffic.
    for (let attempt = 0; attempt < 3; attempt++)
      expect((await fetch(`${BASE}/retired`)).status).toBe(410)
  })
})
