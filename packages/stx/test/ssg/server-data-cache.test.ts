import { afterAll, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { generateStaticSite } from '../../src/ssg'
import { createTempDir } from '../../src/temp-dir'

const root = createTempDir('stx-ssg-server-data-')
const pagesDir = path.join(root, 'pages')
const componentsDir = path.join(root, 'components')
const cacheDir = path.join(root, 'cache')
const outputDir = path.join(root, 'dist')
let description = 'Original catalog description'
let requests = 0
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch() {
    requests++
    return Response.json({ description })
  },
})
const serverScript = `<script server>
const catalog = await (await fetch('${server.url}')).json()
</script><p>{{ catalog.description }}</p>`

afterAll(() => {
  server.stop(true)
  fs.rmSync(root, { recursive: true, force: true })
})

beforeEach(async () => {
  for (const dir of [pagesDir, componentsDir, cacheDir, outputDir])
    fs.rmSync(dir, { recursive: true, force: true })
  description = 'Original catalog description'
  requests = 0
  await Bun.write(path.join(pagesDir, 'static.stx'), '<main>Static control</main>')
  await Bun.write(path.join(pagesDir, 'client.stx'), `
    <!-- A documented <script server> is inert. -->
    <script client>console.log('client control')</script><main>Client control</main>
  `)
})

function build() {
  return generateStaticSite({
    pagesDir,
    componentsDir,
    cacheDir,
    outputDir,
    cache: true,
    cleanOutput: false,
    sitemap: false,
    robots: false,
  })
}

async function expectFreshData() {
  const first = await build()
  expect(first.failedCount).toBe(0)
  expect(first.successCount).toBe(3)
  expect(first.cachedCount).toBe(0)
  expect(requests).toBe(1)
  expect(await Bun.file(path.join(outputDir, 'index.html')).text()).toContain(description)

  // A durable entry from an earlier build must not suppress the next fetch.
  // This also exercises pre-fix entries: their persisted shape is unchanged.
  const entries = await Bun.file(path.join(cacheDir, 'build-cache.json')).json()
  expect(entries['/'].html).toContain(description)
  const sourceMtime = fs.statSync(path.join(pagesDir, 'index.stx')).mtimeMs
  description = 'Updated catalog description'

  for (let attempt = 0; attempt < 2; attempt++) {
    const next = await build()
    expect(next.failedCount).toBe(0)
    expect(next.successCount).toBe(3)
    expect(next.cachedCount).toBe(2)
    expect(requests).toBe(attempt + 2)
    const html = await Bun.file(path.join(outputDir, 'index.html')).text()
    expect(html).toContain(description)
    expect(html).not.toContain('Original catalog description')
  }
  expect(fs.statSync(path.join(pagesDir, 'index.stx')).mtimeMs).toBe(sourceMtime)
}

describe('SSG server data across cached builds', () => {
  it('refreshes a page server script without source edits', async () => {
    await Bun.write(path.join(pagesDir, 'index.stx'), serverScript)
    await expectFreshData()
  })

  it('refreshes server data in a transitive component dependency', async () => {
    await Bun.write(path.join(pagesDir, 'index.stx'), '<main><CatalogShell /></main>')
    await Bun.write(path.join(componentsDir, 'CatalogShell.stx'), '<section><CatalogOffers /></section>')
    await Bun.write(path.join(componentsDir, 'CatalogOffers.stx'), serverScript)
    await expectFreshData()
  })

  for (const suffix of ['.data.ts', '.data.js', '.stx.data.ts', '.stx.data.js']) {
    it(`refreshes a companion ${suffix} loader without source edits`, async () => {
      await Bun.write(path.join(pagesDir, 'index.stx'), '<p>{{ description }}</p>')
      await Bun.write(path.join(pagesDir, `index${suffix}`), `
        export default async function () {
          return (await fetch('${server.url}')).json()
        }
      `)
      await expectFreshData()
    })
  }
})
