/**
 * Tests for client-script-bundler cache invalidation on transitive import
 * changes (stacksjs/stx#1723).
 *
 * Pre-fix, the cache key was `md5(code + filePath)`. If a `<script client>`
 * block imported `./helper.ts` and the helper changed (but the script
 * itself didn't), the cache key was unchanged → cache hit → stale output.
 * The user observed: "I edited functions/format.ts but the page still
 * shows the old formatting."
 *
 * Fix: alongside the cached bundle, persist a `.deps.json` sidecar listing
 * every input file resolved through the plugin's onResolve hooks, with
 * each file's mtime at bundle time. On cache lookup, re-stat the
 * recorded deps; a single mtime mismatch invalidates the entry.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

const TMP = path.join(import.meta.dir, 'temp-bundler')

describe('client-script-bundler transitive cache (#1723)', () => {
  let projectRoot: string
  let cacheDir: string
  let helperPath: string
  let templatePath: string

  beforeEach(async () => {
    projectRoot = path.join(TMP, `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
    cacheDir = path.join(projectRoot, '.stx', 'bundle-cache')
    helperPath = path.join(projectRoot, 'functions', 'format.ts')
    templatePath = path.join(projectRoot, 'pages', 'index.stx')

    await fs.promises.mkdir(path.dirname(helperPath), { recursive: true })
    await fs.promises.mkdir(path.dirname(templatePath), { recursive: true })
    await fs.promises.mkdir(cacheDir, { recursive: true })
  })

  afterEach(async () => {
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  // The script block content is fixed across the test — only the
  // transitively-imported helper changes. If the cache were keyed only
  // on the script text (the pre-fix behavior), bundle #2 would hit
  // cache and the test would fail.
  const scriptCode = `import { formatPrice } from '@/functions/format'\nconst out = formatPrice(10)`

  it('rebundles when a transitively-imported helper changes', async () => {
    await Bun.write(helperPath, 'export function formatPrice(n: number) { return `$${n}.00 V1` }')

    const first = await bundleClientScript(scriptCode, templatePath, { projectRoot, cacheDir })
    expect(first).toContain('V1')

    // Edit the helper. Bump the mtime so the cache invalidation check
    // fires reliably on coarse-grained filesystems (some have 1s mtime
    // resolution and a same-second rewrite reads as unchanged).
    const future = new Date(Date.now() + 2000)
    await Bun.write(helperPath, 'export function formatPrice(n: number) { return `$${n}.00 V2` }')
    fs.utimesSync(helperPath, future, future)

    const second = await bundleClientScript(scriptCode, templatePath, { projectRoot, cacheDir })
    expect(second).toContain('V2')
    expect(second).not.toContain('V1')
  })

  it('hits cache when nothing changed (no spurious rebundles)', async () => {
    await Bun.write(helperPath, 'export function formatPrice(n: number) { return `$${n}.00 STABLE` }')

    const first = await bundleClientScript(scriptCode, templatePath, { projectRoot, cacheDir })
    expect(first).toContain('STABLE')

    // No edits — second call must be byte-identical AND a cache hit.
    // We can't directly observe "was cache hit" from the return value,
    // but identical output is a necessary condition.
    const second = await bundleClientScript(scriptCode, templatePath, { projectRoot, cacheDir })
    expect(second).toBe(first)
  })

  it('persists a .deps.json sidecar alongside the bundle', async () => {
    await Bun.write(helperPath, 'export function formatPrice(n: number) { return `$${n}` }')

    await bundleClientScript(scriptCode, templatePath, { projectRoot, cacheDir })

    // There should be exactly one .js + one .deps.json in the cache dir.
    const entries = await fs.promises.readdir(cacheDir)
    const jsFiles = entries.filter(e => e.endsWith('.js'))
    const depsFiles = entries.filter(e => e.endsWith('.deps.json'))
    expect(jsFiles).toHaveLength(1)
    expect(depsFiles).toHaveLength(1)

    // The sidecar must reference the helper.
    const sidecar = JSON.parse(await Bun.file(path.join(cacheDir, depsFiles[0])).text())
    const filePaths = sidecar.files.map((f: { path: string }) => f.path)
    expect(filePaths).toContain(helperPath)
  })

  it('invalidates when a recorded dep is deleted (defensive)', async () => {
    await Bun.write(helperPath, 'export function formatPrice(n: number) { return `$${n}.00 X` }')
    await bundleClientScript(scriptCode, templatePath, { projectRoot, cacheDir })

    // Delete the helper. Next bundle must miss cache (helper gone),
    // surface the bundle failure, and not silently return the cached
    // string. We expect the catch path to swallow and return the
    // original code unmodified — that's not the test point. The point
    // is the cache lookup does NOT hit and serve a stale bundle.
    fs.rmSync(helperPath)

    const second = await bundleClientScript(scriptCode, templatePath, { projectRoot, cacheDir })
    // Either fallback to original `scriptCode` OR a fresh bundle attempt
    // (which will fail). Either way, the stale `X` must NOT be in the
    // result.
    expect(second).not.toContain('V1')
    expect(second).not.toContain('X')
  })
})
