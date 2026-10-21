/**
 * The bundle cache survives the project moving to another directory.
 *
 * A deploy unpacks every release into a new directory. The cache used to key
 * entries on the page's absolute path and validate them by the absolute paths
 * and mtimes of their inputs, so every release started with nothing and
 * rebuilt every page's client bundle, one build at a time, on its first
 * visitors (or its warm-up). Entries now key on project-relative paths and
 * record each input's size and content hash, so an unchanged page in the next
 * release is a cache hit, and a changed one still is not.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleCacheDir, bundleClientScript } from '../../src/client-script-bundler'
import { clearRenderMemos } from '../../src/render-memo'

const TMP = path.join(import.meta.dir, 'temp-relocatable')
const MARKER = 'var served_from_cache = true'

describe('relocatable bundle cache', () => {
  let releaseA: string
  let releaseB: string
  let cacheDir: string

  const script = `import { formatPrice } from '@/functions/format'\nconst out = formatPrice(10)`

  async function writeRelease(root: string, label: string): Promise<void> {
    await fs.promises.mkdir(path.join(root, 'functions'), { recursive: true })
    await fs.promises.mkdir(path.join(root, 'pages'), { recursive: true })
    await Bun.write(path.join(root, 'functions', 'format.ts'), `export function formatPrice(n: number) { return \`$\${n} ${label}\` }`)
  }

  /** Replace the one cached bundle with a marker, so a later hit is visible. */
  async function markCachedBundle(): Promise<void> {
    const js = (await fs.promises.readdir(cacheDir)).filter(entry => entry.endsWith('.js'))
    expect(js).toHaveLength(1)
    await Bun.write(path.join(cacheDir, js[0]), MARKER)
    clearRenderMemos()
  }

  beforeEach(async () => {
    const run = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    releaseA = path.join(TMP, run, 'releases', 'aaaaaaa')
    releaseB = path.join(TMP, run, 'releases', 'bbbbbbb')
    cacheDir = path.join(TMP, run, 'shared', 'stx-bundles')
    clearRenderMemos()
  })

  afterEach(async () => {
    clearRenderMemos()
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('serves the next release an unchanged page from the cache the previous one wrote', async () => {
    await writeRelease(releaseA, 'SAME')
    const first = await bundleClientScript(script, path.join(releaseA, 'pages', 'index.stx'), { projectRoot: releaseA, cacheDir, externalizeUserModules: false })
    expect(first).toContain('SAME')
    await markCachedBundle()

    // Unpacked later: same contents, new directory, new mtimes.
    await Bun.sleep(20)
    await writeRelease(releaseB, 'SAME')
    const next = await bundleClientScript(script, path.join(releaseB, 'pages', 'index.stx'), { projectRoot: releaseB, cacheDir, externalizeUserModules: false })
    expect(next).toBe(MARKER)
  })

  it('rebuilds when an input changed, even at the same size and an older mtime', async () => {
    await writeRelease(releaseA, 'ONE')
    await bundleClientScript(script, path.join(releaseA, 'pages', 'index.stx'), { projectRoot: releaseA, cacheDir, externalizeUserModules: false })
    await markCachedBundle()

    await writeRelease(releaseB, 'TWO')
    const past = new Date(Date.now() - 60_000)
    fs.utimesSync(path.join(releaseB, 'functions', 'format.ts'), past, past)
    const next = await bundleClientScript(script, path.join(releaseB, 'pages', 'index.stx'), { projectRoot: releaseB, cacheDir, externalizeUserModules: false })
    expect(next).toContain('TWO')
    expect(next).not.toContain('served_from_cache')
  })

  // The page module registry's entry imports each module by absolute path,
  // so the project root sits inside the code being keyed.
  it('keys code that names the project root by where it points inside the project', async () => {
    const registryEntry = (root: string) => `import * as m from ${JSON.stringify(path.join(root, 'functions', 'format.ts'))};\nglobalThis.__m = m;`
    await writeRelease(releaseA, 'SAME')
    await bundleClientScript(registryEntry(releaseA), path.join(releaseA, '.stx-module-registry.ts'), { projectRoot: releaseA, cacheDir, externalizeUserModules: false })
    await markCachedBundle()

    await writeRelease(releaseB, 'SAME')
    const next = await bundleClientScript(registryEntry(releaseB), path.join(releaseB, '.stx-module-registry.ts'), { projectRoot: releaseB, cacheDir, externalizeUserModules: false })
    expect(next).toBe(MARKER)
  })

  it('lives under STX_BUNDLE_CACHE_DIR when it is set', () => {
    const original = process.env.STX_BUNDLE_CACHE_DIR
    try {
      process.env.STX_BUNDLE_CACHE_DIR = cacheDir
      expect(bundleCacheDir(releaseA)).toBe(path.resolve(cacheDir))
      delete process.env.STX_BUNDLE_CACHE_DIR
      expect(bundleCacheDir(releaseA)).toContain(path.join(releaseA))
    }
    finally {
      if (original === undefined)
        delete process.env.STX_BUNDLE_CACHE_DIR
      else
        process.env.STX_BUNDLE_CACHE_DIR = original
    }
  })
})
