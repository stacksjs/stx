/**
 * Upgrading a package a `<script client>` imports invalidates the SSG cache.
 *
 * A page script's package imports are left external and served from the
 * page's module registry (#1957), a second bundle inlined into the same page.
 * The page's own bundle therefore records none of the package's files, and the
 * registry recorded its inputs against itself, not the page. The page cached
 * with no dependency on the package at all: upgrading it reported the route
 * `Cached` and shipped the previous version inlined.
 *
 * Found in a desktop app whose `@stacksjs/desktop/browser` import kept
 * resolving to the release before the one that added `sidebar`, with the new
 * release installed and the build green.
 */

import { afterAll, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generateStaticSite } from '../../src/ssg'

const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stx-registry-cache-')))
const pagesDir = path.join(TMP, 'pages')
const outputDir = path.join(TMP, 'dist')
const cacheDir = path.join(TMP, 'cache')
const pkg = path.join(TMP, 'node_modules', 'fake-ui')
const previousCwd = process.cwd()

afterAll(() => {
  process.chdir(previousCwd)
  fs.rmSync(TMP, { recursive: true, force: true })
})

/** Install a version of the package: a new release, as `bun install` lays it down. */
async function install(version: string): Promise<void> {
  fs.rmSync(pkg, { recursive: true, force: true })
  await Bun.write(path.join(pkg, 'package.json'), JSON.stringify({ name: 'fake-ui', version, type: 'module', main: './index.js' }))
  await Bun.write(path.join(pkg, 'index.js'), `export const version = '${version}'\n`)
}

beforeEach(async () => {
  // The registry resolves package ids from the working directory.
  process.chdir(TMP)
  fs.rmSync(pagesDir, { recursive: true, force: true })
  fs.rmSync(cacheDir, { recursive: true, force: true })
  fs.rmSync(outputDir, { recursive: true, force: true })
  await fs.promises.mkdir(pagesDir, { recursive: true })

  await install('1.0.0')
  await Bun.write(
    path.join(pagesDir, 'index.stx'),
    [
      '<html><head><title>Home</title></head><body><h1>Home</h1>',
      '<script client>',
      "  import { version } from 'fake-ui'",
      '  console.log(version)',
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

function page(): string {
  return fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8')
}

describe('a package imported by <script client>', () => {
  it('is served from the page module registry', async () => {
    // The premise: if the package were inlined into the page's own bundle,
    // this would be the client-import case, already covered.
    await build()
    expect(page()).toContain('npm:fake-ui')
    expect(page()).toContain('1.0.0')
  })

  it('is cached on an unchanged rebuild', async () => {
    await build()
    expect((await build()).cachedCount).toBe(1)
  })

  it('invalidates the page when the package is upgraded', async () => {
    await build()
    expect((await build()).cachedCount).toBe(1)

    await install('2.0.0')

    const afterUpgrade = await build()
    expect(afterUpgrade.cachedCount).toBe(0)
    expect(page()).toContain('2.0.0')
    expect(page()).not.toContain('1.0.0')
  })
})
