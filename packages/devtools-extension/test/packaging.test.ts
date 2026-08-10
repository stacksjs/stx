/**
 * The extension is packaged the way a store will accept it (stacksjs/stx#1754).
 *
 * The engineering was done in #1747; what was left was the packaging, and
 * packaging has failure modes that only surface at upload time — after which
 * the fix is another submission and another review wait.
 *
 * The two pinned here are the ones that bite on a SECOND submission rather than
 * a first, which is the worst kind: the manifest version had been hardcoded at
 * `0.2.70` while the package moved to `0.2.170`, and the store rejects an
 * upload whose version does not exceed the published one.
 */

import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')

describe('the manifest a store receives', () => {
  it('declares all four icon sizes, and they exist', async () => {
    const manifest = await Bun.file(join(root, 'public', 'manifest.json')).json()

    expect(Object.keys(manifest.icons).sort()).toEqual(['128', '16', '32', '48'])

    for (const relative of Object.values(manifest.icons) as string[])
      expect(existsSync(join(root, 'public', relative))).toBe(true)
  })

  it('ships icons at the size they claim', async () => {
    // A 128px icon that is really 800px scaled in the browser looks fine and
    // is rejected by review.
    for (const size of [16, 32, 48, 128]) {
      const bytes = new Uint8Array(await Bun.file(join(root, 'public', 'icons', `icon-${size}.png`)).arrayBuffer())
      // PNG IHDR: width and height are big-endian uint32 at offsets 16 and 20.
      const view = new DataView(bytes.buffer)

      expect(view.getUint32(16)).toBe(size)
      expect(view.getUint32(20)).toBe(size)
    }
  })

  it('asks for no permissions, which is what the privacy note claims', async () => {
    // The listing tells reviewers the extension collects nothing. If this ever
    // grows an entry, that text stops being true.
    const manifest = await Bun.file(join(root, 'public', 'manifest.json')).json()

    expect(manifest.permissions).toEqual([])
  })
})

describe('the built artifact', () => {
  it('stamps the package version rather than a hardcoded one', async () => {
    /*
     * The source manifest deliberately carries a stale version — it is stamped
     * at build time — so this asserts the BUILD does the stamping rather than
     * asserting the two files happen to match today.
     */
    const { build } = await import('../build.ts')
    const outDir = join(root, '.tmp-packaging-test')

    await build(outDir)

    try {
      const built = await Bun.file(join(outDir, 'manifest.json')).json()
      const pkg = await Bun.file(join(root, 'package.json')).json()

      expect(built.version).toBe(pkg.version)
    }
    finally {
      await Bun.$`rm -rf ${outDir}`.quiet()
    }
  })
})
