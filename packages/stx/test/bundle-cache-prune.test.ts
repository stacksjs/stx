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

import { afterEach, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { bundleClientScript } from '../src/client-script-bundler'

const made: string[] = []

afterEach(() => {
  for (const dir of made.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function workspace(): { dir: string, cacheDir: string, host: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-bundle-prune-'))
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
})
