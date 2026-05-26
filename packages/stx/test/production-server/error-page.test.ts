/**
 * Tests for the production-server error-page lookup (stacksjs/stx#1722).
 *
 * Before the fix, when a route matched in the manifest but its compiled
 * template was missing/broken (try/catch at production-server.ts:114
 * swallowed the load failure), the response was a bare `Internal Server
 * Error` text string — even when the user shipped a branded
 * `pages/500.stx`. After the fix, the server mirrors the existing /404
 * lookup pattern at line ~229: look up `exactRoutes.get('/500')`, serve
 * its compiled HTML if available, fall back to plain text otherwise.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { generateManifest, writeManifest, type ManifestRoute } from '../../src/manifest'
import { startProductionServer } from '../../src/production-server'

const TMP = path.join(import.meta.dir, 'temp-error-page')

interface CompiledFixture {
  pattern: string
  html: string
  /** When true, only the manifest entry is written — no compiled JSON file
   * exists on disk. This is the scenario that triggers production-server's
   * 500 path (`if (!compiled)` at line ~265). */
  brokenCompiled?: boolean
}

async function writeFixtures(outputDir: string, fixtures: CompiledFixture[]): Promise<ManifestRoute[]> {
  await fs.promises.mkdir(path.join(outputDir, 'compiled'), { recursive: true })
  await fs.promises.mkdir(path.join(outputDir, 'fragments'), { recursive: true })

  const routes: ManifestRoute[] = []
  for (const f of fixtures) {
    // Derive a safe filename from the pattern.
    const slug = f.pattern.replace(/[/]/g, '_').replace(/^_+/, '') || 'root'
    const compiledPath = `compiled/${slug}.json`
    const fragmentPath = `fragments/${slug}.html`

    if (!f.brokenCompiled) {
      await Bun.write(
        path.join(outputDir, compiledPath),
        JSON.stringify({
          route: f.pattern,
          sourceFile: `${slug}.stx`,
          html: f.html,
          fragment: f.html,
          placeholders: {},
          hasServerScripts: false,
          serverScriptContent: [],
          dependencies: [],
          contentHash: 'test',
        }),
      )
      await Bun.write(path.join(outputDir, fragmentPath), f.html)
    }

    routes.push({
      pattern: f.pattern,
      compiledPath,
      fragmentPath,
      isDynamic: false,
      hasParams: false,
    })
  }

  const manifest = generateManifest(
    routes,
    { runtime: 'runtime.js', router: 'router.js' },
    outputDir,
  )
  writeManifest(manifest, outputDir)
  return routes
}

// Each test uses a unique port to avoid races when bun runs them in parallel.
let nextPort = 4710
function pickPort(): number {
  return nextPort++
}

describe('production-server error page lookup (#1722)', () => {
  let server: { stop: () => void } | null = null

  beforeEach(async () => {
    await fs.promises.mkdir(TMP, { recursive: true })
  })

  afterEach(async () => {
    if (server) {
      server.stop()
      server = null
    }
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('serves the user\'s 500.stx when a matched route has no compiled template', async () => {
    await writeFixtures(TMP, [
      // This route is in the manifest but its compiled JSON is missing,
      // so the server's startup loader catches and the in-memory
      // compiledTemplates map has no entry for the pattern. The route
      // still resolves at request time (it's in exactRoutes), but
      // `compiled` is undefined → hits the 500 path.
      { pattern: '/broken', html: '', brokenCompiled: true },
      // The 500.stx page must be a normal compiled template.
      { pattern: '/500', html: '<!doctype html><html><body><h1>Branded 500</h1></body></html>' },
    ])

    const port = pickPort()
    server = await startProductionServer({ outputDir: TMP, port })

    const res = await fetch(`http://localhost:${port}/broken`)
    expect(res.status).toBe(500)
    const body = await res.text()
    expect(body).toContain('Branded 500')
    expect(res.headers.get('Content-Type') ?? '').toContain('text/html')
  })

  it('falls back to plain text when no /500.stx is present', async () => {
    await writeFixtures(TMP, [
      { pattern: '/broken', html: '', brokenCompiled: true },
      // Deliberately no /500 in the manifest.
    ])

    const port = pickPort()
    server = await startProductionServer({ outputDir: TMP, port })

    const res = await fetch(`http://localhost:${port}/broken`)
    expect(res.status).toBe(500)
    const body = await res.text()
    expect(body).toBe('Internal Server Error')
  })

  it('does not affect the existing /404 path (sanity check)', async () => {
    await writeFixtures(TMP, [
      { pattern: '/exists', html: '<!doctype html><html><body>exists</body></html>' },
      { pattern: '/404', html: '<!doctype html><html><body><h1>Branded 404</h1></body></html>' },
    ])

    const port = pickPort()
    server = await startProductionServer({ outputDir: TMP, port })

    const res = await fetch(`http://localhost:${port}/totally-unknown`)
    expect(res.status).toBe(404)
    const body = await res.text()
    expect(body).toContain('Branded 404')
  })
})
