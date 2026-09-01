/**
 * Editing a module a `<script client>` imports invalidates the SSG cache.
 *
 * The page cache keys on each page's `.stx` file plus the dependencies
 * collected while rendering it - the `@include`d partials. A module imported
 * by a `<script client>` block is in neither: those imports are resolved later,
 * by Bun.build inside the client bundler. So editing a helper produced a build
 * that reported every route `Cached`, exited 0, and shipped the previous
 * build's JavaScript.
 *
 * The same shape as the Crosswind config bug (#1940), and it fails the same
 * way: green build, correct source on disk, browser running code that no
 * longer exists. Nothing downstream looks wrong, so the time goes on debugging
 * the application instead of the build - which is exactly what happened.
 *
 * The bundler already re-validates its own inputs (#1723), so the bundle would
 * have been rebuilt. It was never asked, because the page above it was served
 * from cache.
 *
 * Asserted through `cachedCount`, the number the build prints, rather than
 * through the emitted JavaScript: what is under test is whether the second
 * build re-rendered the page at all.
 */

import { afterAll, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generateStaticSite } from '../../src/ssg'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-client-import-cache-'))
const pagesDir = path.join(TMP, 'pages')
const outputDir = path.join(TMP, 'dist')
const cacheDir = path.join(TMP, 'cache')
const helper = path.join(pagesDir, 'helper.ts')

afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

async function writeHelper(value: string): Promise<void> {
  await Bun.write(helper, `export const greeting = '${value}'\n`)
}

beforeEach(async () => {
  fs.rmSync(pagesDir, { recursive: true, force: true })
  fs.rmSync(cacheDir, { recursive: true, force: true })
  fs.rmSync(outputDir, { recursive: true, force: true })
  await fs.promises.mkdir(pagesDir, { recursive: true })

  await writeHelper('first')
  await Bun.write(
    path.join(pagesDir, 'index.stx'),
    [
      '<html><head><title>Home</title></head><body><h1>Home</h1>',
      '<script client>',
      "  import { greeting } from './helper'",
      '  console.log(greeting)',
      '</script>',
      '</body></html>',
    ].join('\n'),
  )
})

function build() {
  return generateStaticSite({
    pagesDir,
    outputDir,
    cacheDir,
    sitemap: false,
    robots: false,
    cache: true,
    cleanOutput: false,
  })
}

describe('a module imported by <script client>', () => {
  it('is cached on an unchanged rebuild', async () => {
    // The control: without it, a fix that just stopped caching would pass
    // every other assertion here.
    const first = await build()
    expect(first.cachedCount).toBe(0)
    expect(first.successCount).toBe(1)

    expect((await build()).cachedCount).toBe(1)
  })

  it('invalidates the page when the imported module changes', async () => {
    await build()
    expect((await build()).cachedCount).toBe(1)

    // Nothing in the .stx moved. Only the helper it imports.
    await writeHelper('second')

    const afterEdit = await build()
    expect(afterEdit.cachedCount).toBe(0)
    expect(afterEdit.successCount).toBe(1)
  })

  it('settles back to hitting once the module stops changing', async () => {
    // A dependency that looked changed every build would "fix" this by never
    // caching anything again.
    await writeHelper('third')
    await build()

    expect((await build()).cachedCount).toBe(1)
  })
})
