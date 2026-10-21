/**
 * The client-bundle cache is swept, not grown forever.
 *
 * Every distinct `(source, host file)` pair writes its own `{hash}.js` and
 * `{hash}.deps.json`, and nothing removed the ones that stopped being
 * reachable — so editing a `<script client>` in a loop leaves one dead pair
 * behind per edit. On the app this was found in, that reached 5,895 files and
 * 2.2GB, filled the disk, and stopped the build with ENOSPC. That reads as a
 * broken machine rather than a cache nobody was sweeping, which is what made
 * it expensive.
 *
 * Eviction is by modified time. Reachability would be the better key and is
 * not knowable from inside one build: a process only sees the pages it happens
 * to render, so a partial build would evict everything it did not touch.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { bundleCacheEntryLimit, bundleClientScript } from '../src/client-script-bundler'
import { clearRenderMemos } from '../src/render-memo'
import { createTempDir } from '../src/temp-dir'

const made: string[] = []
const originalLimit = process.env.STX_BUNDLE_CACHE_LIMIT

// The sweeps below run against a 600-entry cache; the default is larger.
beforeEach(() => {
  process.env.STX_BUNDLE_CACHE_LIMIT = '600'
})

afterEach(() => {
  if (originalLimit === undefined)
    delete process.env.STX_BUNDLE_CACHE_LIMIT
  else
    process.env.STX_BUNDLE_CACHE_LIMIT = originalLimit
  for (const dir of made.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function workspace(): { dir: string, cacheDir: string, host: string } {
  const dir = createTempDir('stx-bundle-prune-')
  made.push(dir)
  const cacheDir = path.join(dir, 'bundle-cache')
  fs.mkdirSync(cacheDir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'helper.ts'), 'export const value = 1\n')
  return { dir, cacheDir, host: path.join(dir, 'page.stx') }
}

/** A pair the way the bundler writes one, aged to a known time. */
function seedEntry(cacheDir: string, name: string, ageMs: number): void {
  const at = Date.now() - ageMs
  for (const ext of ['.js', '.deps.json']) {
    const file = path.join(cacheDir, name + ext)
    fs.writeFileSync(file, ext === '.js' ? '// cached\n' : '{"metadataVersion":1,"files":[]}')
    fs.utimesSync(file, at / 1000, at / 1000)
  }
}

describe('the bundle cache', () => {
  test('sweeps down to the limit once it is exceeded', async () => {
    const { dir, cacheDir, host } = workspace()

    // Comfortably past the limit, all older than anything written below.
    for (let i = 0; i < 900; i++) seedEntry(cacheDir, `stale${i}`, 60_000 + i)

    expect(fs.readdirSync(cacheDir).filter(f => f.endsWith('.js'))).toHaveLength(900)

    await bundleClientScript(
      "import { value } from './helper'\nconsole.log(value)\n",
      host,
      { projectRoot: dir, cacheDir },
    )

    const after = fs.readdirSync(cacheDir).filter(f => f.endsWith('.js'))
    expect(after.length).toBeLessThanOrEqual(600)
  })

  test('a sidecar never outlives the bundle it describes', async () => {
    const { dir, cacheDir, host } = workspace()
    for (let i = 0; i < 900; i++) seedEntry(cacheDir, `stale${i}`, 60_000 + i)

    await bundleClientScript(
      "import { value } from './helper'\nconsole.log(value)\n",
      host,
      { projectRoot: dir, cacheDir },
    )

    const names = fs.readdirSync(cacheDir)
    const bundles = new Set(names.filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)))

    for (const sidecar of names.filter(f => f.endsWith('.deps.json')))
      expect(bundles.has(sidecar.slice(0, -'.deps.json'.length))).toBe(true)
  })

  test('leaves a cache under the limit alone', async () => {
    const { dir, cacheDir, host } = workspace()
    for (let i = 0; i < 5; i++) seedEntry(cacheDir, `keep${i}`, 60_000 + i)

    await bundleClientScript(
      "import { value } from './helper'\nconsole.log(value)\n",
      host,
      { projectRoot: dir, cacheDir },
    )

    // The five seeded plus whatever this build wrote — nothing evicted.
    expect(fs.readdirSync(cacheDir).filter(f => f.endsWith('.js')).length).toBeGreaterThanOrEqual(5)
  })

  // A warm-up pass over a working set near the limit evicted each entry just
  // before reading it, because the sweep went by write time and a hit wrote
  // nothing. A hit is a use, and the sweep keeps what is used.
  test('keeps an entry that was read since, however long ago it was written', async () => {
    const { dir, cacheDir, host } = workspace()
    const used = "import { value } from './helper'\nconsole.log('used', value)\n"
    // Built in a scratch cache and copied in, so the write below is this
    // cache's first, which is when it sweeps.
    const scratch = path.join(dir, 'scratch-cache')
    await bundleClientScript(used, host, { projectRoot: dir, cacheDir: scratch })
    const usedFile = fs.readdirSync(scratch).find(f => f.endsWith('.js'))!
    const old = (Date.now() - 3_600_000) / 1000
    for (const name of [usedFile, usedFile.replace(/\.js$/, '.deps.json')]) {
      fs.copyFileSync(path.join(scratch, name), path.join(cacheDir, name))
      fs.utimesSync(path.join(cacheDir, name), old, old)
    }
    for (let i = 0; i < 650; i++) seedEntry(cacheDir, `newer${i}`, 60_000 + i)

    // Read it from disk (not this process's memo), then write something else,
    // which sweeps.
    clearRenderMemos()
    await bundleClientScript(used, host, { projectRoot: dir, cacheDir })
    await Bun.sleep(50)
    await bundleClientScript("import { value } from './helper'\nconsole.log('other', value)\n", host, { projectRoot: dir, cacheDir })

    const left = fs.readdirSync(cacheDir).filter(f => f.endsWith('.js'))
    expect(left.length).toBeLessThanOrEqual(600)
    expect(left).toContain(usedFile)
  })
})

describe('bundleCacheEntryLimit', () => {
  test('is 2000 unless STX_BUNDLE_CACHE_LIMIT says otherwise', () => {
    expect(bundleCacheEntryLimit({})).toBe(2000)
    expect(bundleCacheEntryLimit({ STX_BUNDLE_CACHE_LIMIT: '5000' })).toBe(5000)
    expect(bundleCacheEntryLimit({ STX_BUNDLE_CACHE_LIMIT: 'lots' })).toBe(2000)
    expect(bundleCacheEntryLimit({ STX_BUNDLE_CACHE_LIMIT: '0' })).toBe(2000)
  })
})
