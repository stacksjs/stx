/**
 * Tests for locating an icon collection on disk.
 *
 * Regression focus: resolution only understood the monolithic `@iconify/json`
 * package (~120MB, every collection). Projects overwhelmingly install the
 * per-collection `@iconify-json/<prefix>` packages instead, and for those every
 * `<Icon>` on every page rendered as an empty string with no error — a blank
 * nav and blank buttons with nothing in the markup to explain it.
 */

import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it } from 'bun:test'
import { resolveCollectionPath } from '../src/builtins/icon'

const originalCwd = process.cwd()
const roots: string[] = []

// realpath because macOS hands out /var/folders/… which is a symlink to
// /private/var/folders/…, and `process.cwd()` reports the resolved form.
function makeRoot(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'stx-icons-')))
  roots.push(root)
  return root
}

/** Write a stub collection at `relativePath` under `root`. */
function writeCollection(root: string, relativePath: string): string {
  const full = join(root, relativePath)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, JSON.stringify({ icons: { play: { body: '<path/>' } } }))
  return full
}

afterEach(() => {
  process.chdir(originalCwd)
  for (const root of roots.splice(0)) {
    if (existsSync(root)) rmSync(root, { recursive: true, force: true })
  }
})

describe('icon collection resolution', () => {
  it('finds a per-collection @iconify-json package in node_modules', () => {
    const root = makeRoot()
    const expected = writeCollection(root, 'node_modules/@iconify-json/lucide/icons.json')
    process.chdir(root)

    expect(resolveCollectionPath('lucide')).toBe(expected)
  })

  it('finds a per-collection package vendored in pantry', () => {
    const root = makeRoot()
    const expected = writeCollection(root, 'pantry/@iconify-json/lucide/icons.json')
    process.chdir(root)

    expect(resolveCollectionPath('lucide')).toBe(expected)
  })

  it('still finds the monolithic @iconify/json package', () => {
    const root = makeRoot()
    const expected = writeCollection(root, 'node_modules/@iconify/json/json/lucide.json')
    process.chdir(root)

    expect(resolveCollectionPath('lucide')).toBe(expected)
  })

  it('prefers the per-collection package when both are present', () => {
    const root = makeRoot()
    const perCollection = writeCollection(root, 'node_modules/@iconify-json/lucide/icons.json')
    writeCollection(root, 'node_modules/@iconify/json/json/lucide.json')
    process.chdir(root)

    expect(resolveCollectionPath('lucide')).toBe(perCollection)
  })

  it('returns null when the collection is installed under neither convention', () => {
    const root = makeRoot()
    process.chdir(root)

    expect(resolveCollectionPath('definitely-not-a-collection')).toBeNull()
  })

  it("prefers the project's own install over one vendored inside stx", () => {
    // `require.resolve` resolves relative to the stx module, so without the
    // cwd check first a collection sitting in stx's own dependencies would
    // shadow the one the app actually declared.
    const root = makeRoot()
    const projectCopy = writeCollection(root, 'node_modules/@iconify-json/hugeicons/icons.json')
    process.chdir(root)

    expect(resolveCollectionPath('hugeicons')).toBe(projectCopy)
  })
})
