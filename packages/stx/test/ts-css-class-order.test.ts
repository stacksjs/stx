/**
 * A stylesheet depends on the classes a page uses, not on the order it uses
 * them in.
 *
 * The engine keeps rules of equal weight in the order they were generated,
 * and generation followed the order classes were found in the page. The cache,
 * in memory and on disk, is keyed on the sorted class set. So moving a class
 * from one element to another changed what a fresh build wrote, while a
 * machine with a cache kept writing the old order: a generated stylesheet
 * committed from a working checkout was called stale by CI.
 */
import { rmSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'bun:test'
import { generateCss } from '../src/dev-server/ts-css'
import { createTempDir } from '../src/temp-dir'

const REPO = path.resolve(import.meta.dir, '../../..')
const roots: string[] = []

/** An app root with its own cache slot: an unused shortcut changes the config fingerprint and nothing else. */
function app(unused: string): string {
  const root = createTempDir('stx-css-order-')
  writeFileSync(path.join(root, 'css.config.ts'), `export default { shortcuts: { '${unused}': 'p-1' } }\n`)
  symlinkSync(path.join(REPO, 'node_modules'), path.join(root, 'node_modules'))
  roots.push(root)
  return root
}

afterAll(() => {
  for (const root of roots)
    rmSync(root, { recursive: true, force: true })
})

describe('css for a class set', () => {
  it('is the same whatever order the page uses the classes in', async () => {
    const one = await generateCss('<a class="text-fg-soft hover:text-fg"></a><b class="hover:bg-surface-hover"></b>', app('unused-one'))
    const other = await generateCss('<b class="hover:bg-surface-hover"></b><a class="hover:text-fg text-fg-soft"></a>', app('unused-other'))

    expect(one).toContain('.hover\\:text-fg:hover')
    expect(other).toBe(one)
  })
})
