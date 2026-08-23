/**
 * The production server answering with the status the page decided.
 *
 * The precompiled path re-runs each page's `<script server>` per request —
 * that is what lets a `/features/:slug` page look the record up and find it
 * missing. What it did with the answer was nothing: `hydrateTemplateStream`
 * dropped whatever the page asked for, so "no feature by that name" went out
 * under a 200 and every crawler, cache and uptime check was told the URL is a
 * real page.
 *
 * Driven through a real `startProductionServer` rather than the hydrator,
 * because the hydrator returning the status and the server ignoring it is
 * exactly the shape of the bug.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { generateManifest, writeManifest, type ManifestRoute } from '../../src/manifest'
import { startProductionServer } from '../../src/production-server'
import { compileTemplate } from '../../src/template-compiler'

const TMP = path.join(import.meta.dir, 'temp-response-status')

/** Compile `source` for `pattern` and write it into a fake `.output/`. */
async function writePage(outputDir: string, pattern: string, source: string): Promise<ManifestRoute> {
  await fs.promises.mkdir(path.join(outputDir, 'compiled'), { recursive: true })
  await fs.promises.mkdir(path.join(outputDir, 'fragments'), { recursive: true })

  const slug = pattern.replace(/[^\w]/g, '_').replace(/^_+/, '') || 'root'
  const sourceFile = path.join(outputDir, `${slug}.stx`)
  await Bun.write(sourceFile, source)

  const compiled = await compileTemplate(sourceFile, pattern)
  const compiledPath = `compiled/${slug}.json`
  const fragmentPath = `fragments/${slug}.html`
  await Bun.write(path.join(outputDir, compiledPath), JSON.stringify(compiled))
  await Bun.write(path.join(outputDir, fragmentPath), compiled.fragment)

  return {
    pattern,
    compiledPath,
    fragmentPath,
    isDynamic: pattern.includes(':'),
    hasParams: pattern.includes(':'),
  }
}

async function buildOutput(pages: Array<{ pattern: string, source: string }>): Promise<void> {
  const routes: ManifestRoute[] = []
  for (const page of pages)
    routes.push(await writePage(TMP, page.pattern, page.source))

  writeManifest(generateManifest(routes, { runtime: 'runtime.js', router: 'router.js' }, TMP), TMP)
}

const LOOKUP_PAGE = `<script server>
const known = { queues: 'Queues' }
const title = known[params.slug]
if (!title)
  notFound()
const heading = title ?? 'No feature by that name.'
</script>
<!doctype html><html><body><h1>{{ heading }}</h1></body></html>`

let nextPort = 4760
const pickPort = (): number => nextPort++

describe('production server: a page that decides its own status', () => {
  let server: { stop: () => void } | null = null

  beforeEach(async () => {
    await fs.promises.mkdir(TMP, { recursive: true })
  })

  afterEach(async () => {
    server?.stop()
    server = null
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('answers 404 for the slug that names nothing, and 200 for the one that does', async () => {
    await buildOutput([{ pattern: '/features/:slug', source: LOOKUP_PAGE }])
    const port = pickPort()
    server = await startProductionServer({ outputDir: TMP, port })

    const missing = await fetch(`http://localhost:${port}/features/nonsense`)
    expect(missing.status).toBe(404)
    // Both halves matter: a blank 404 would mean the ReferenceError took the
    // rest of the server script down, which is how this used to fail.
    expect(await missing.text()).toContain('No feature by that name.')

    const found = await fetch(`http://localhost:${port}/features/queues`)
    expect(found.status).toBe(200)
    expect(await found.text()).toContain('Queues')
  })

  it('sends the headers a page set beside its status', async () => {
    await buildOutput([{
      pattern: '/features/jobs',
      source: `<script server>
setResponseStatus(301)
setResponseHeader('Location', '/features/queues')
</script>
<!doctype html><html><body>moved</body></html>`,
    }])
    const port = pickPort()
    server = await startProductionServer({ outputDir: TMP, port })

    const res = await fetch(`http://localhost:${port}/features/jobs`, { redirect: 'manual' })

    expect(res.status).toBe(301)
    expect(res.headers.get('Location')).toBe('/features/queues')
  })

  it('answers with a statically declared status too', async () => {
    // `definePageMeta({ status })` on a page that is always an error page. It
    // reached the dev server and stopped there; the compiled template now
    // carries it so the production server can answer with it as well.
    await buildOutput([{
      pattern: '/retired',
      source: `<script server>
definePageMeta({ title: 'Retired', status: 410 })
</script>
<!doctype html><html><body><h1>Retired</h1></body></html>`,
    }])
    const port = pickPort()
    server = await startProductionServer({ outputDir: TMP, port })

    expect((await fetch(`http://localhost:${port}/retired`)).status).toBe(410)
  })

  it('leaves an ordinary page answering 200', async () => {
    await buildOutput([{ pattern: '/', source: `<!doctype html><html><body>home</body></html>` }])
    const port = pickPort()
    server = await startProductionServer({ outputDir: TMP, port })

    expect((await fetch(`http://localhost:${port}/`)).status).toBe(200)
  })
})
