/**
 * A failed `<script server>` fails the build instead of shipping a page with
 * its content missing.
 *
 * The same condition as `include-failure.test.ts` next door, for the other half
 * of the page, and it shipped the same way. A server script that fails leaves
 * every variable it declared undefined, so the markup around it renders empty
 * and `{{ name }}` reaches the browser as literal text. In dev an error
 * boundary says so on the page. In a BUILD nothing could see it: one app
 * shipped 13 of 46 pages as nothing but a banner printing an absolute
 * build-machine path to visitors, while the build reported
 *
 *     Total: 45 pages
 *     Success: 45
 *     Failed: 0
 *
 * and exited 0. What caught it was an unrelated responsive check noticing the
 * banner's long unwrapped path overflowed a 390px viewport -- lint, typecheck,
 * the test suite and the build summary were all blind to it (stacksjs/stx#2035).
 *
 * The boundary could never have covered this on its own: it is development-only
 * and disabled under test, so the configuration that ships the broken page is
 * the one configuration nothing was watching. This fires regardless of it.
 */

import type { SSGResult } from '../../src/ssg'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

let dir = ''
const originalCwd = process.cwd()

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-server-script-fail-'))
  await Bun.write(path.join(dir, 'lib', 'copy.ts'), `export const headline = 'REAL HEADLINE'\n`)
  await Bun.write(
    path.join(dir, 'layouts', 'default.stx'),
    `<!doctype html>\n<html><body><main>@yield('content')</main></body></html>\n`,
  )
})

afterEach(async () => {
  process.chdir(originalCwd)
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

/** Build a single page whose server script is `script`. */
async function buildPage(script: string, options: Record<string, unknown> = {}): Promise<SSGResult> {
  await Bun.write(
    path.join(dir, 'views', 'index.stx'),
    `<script server>\n${script}\n</script>\n<main><h1>{{ headline }}</h1></main>\n`,
  )
  process.chdir(dir)
  const { generateStaticSite } = await import('../../src/ssg')
  return generateStaticSite({
    pagesDir: 'views',
    outputDir: 'dist',
    layoutsDir: 'layouts',
    sitemap: false,
    robots: false,
    cache: false,
    ...options,
  })
}

function output(file = 'index.html'): string {
  const full = path.join(dir, 'dist', file)
  return existsSync(full) ? readFileSync(full, 'utf8') : ''
}

describe('a server script whose import cannot be resolved', () => {
  it('fails the build rather than reporting success', async () => {
    const result = await buildPage(`import { headline } from '../lib/missing'`)

    expect(result.failedCount).toBe(1)
    expect(result.successCount).toBe(0)
  })

  it('does not write the page it would have shipped', async () => {
    // The reported symptom was a deployable artifact, not a log line: counting
    // the failure while still emitting the file leaves the hollow HTML on disk
    // for whatever copies `dist/` next.
    await buildPage(`import { headline } from '../lib/missing'`)

    expect(output()).toBe('')
  })

  it('names the file to go and fix, and the module it could not find', async () => {
    const result = await buildPage(`import { headline } from '../lib/missing'`)
    const message = result.errors[0]?.error?.message ?? ''

    expect(message).toContain(path.join('views', 'index.stx'))
    expect(message).toContain('module-resolution')
    expect(message).toContain(path.join('lib', 'missing'))
  })

  it('does not point at stx\'s own internals', async () => {
    /*
     * Bun names the file that called `import()` as the referrer, which is
     * always inside stx -- so the one path in the message that looks like an
     * answer sent the reader into the framework. The report quoted it as
     * `from node_modules/@stacksjs/stx/dist/chunk-…` and had to work the rest
     * out unaided.
     */
    const result = await buildPage(`import { headline } from '../lib/missing'`)
    const message = result.errors[0]?.error?.message ?? ''

    expect(message).not.toContain('variable-extractor')
    expect(message).not.toContain('@stacksjs/stx')
  })

  it('builds normally when the import resolves', async () => {
    // The guard must not fire on a working page, or it is just a broken build.
    const result = await buildPage(`import { headline } from '../lib/copy'`)

    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(1)
    expect(output()).toContain('REAL HEADLINE')
  })

  it('can be opted out of, leaving the old behaviour exactly as it was', async () => {
    const result = await buildPage(
      `import { headline } from '../lib/missing'`,
      { failOnServerScriptError: false },
    )

    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(1)
    // The page it used to ship: the heading rendered, empty.
    expect(output()).toContain('<h1></h1>')
  })
})

describe('which failures count', () => {
  it('counts a script that does not parse', async () => {
    const result = await buildPage(`export const headline = (`)

    expect(result.failedCount).toBe(1)
    expect(result.errors[0]?.error?.message ?? '').toContain('syntax')
  })

  it('does not count a script reaching for a browser global', async () => {
    /*
     * The line that keeps this from being a broken build. A server script
     * reading `window`, or constructing something that only exists in a
     * browser, is classified `unknown` by the extractor precisely because it
     * is legitimate on pages that work -- the page renders, that binding is
     * undefined, and that is the author's business.
     */
    const result = await buildPage(`export const headline = window.location.href`)

    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(1)
  })
})

describe('a view that extends a layout', () => {
  it('names the view, not the layout the script was extracted in', async () => {
    /*
     * A view's script is moved into its layout's content section and the
     * combined document is extracted with the LAYOUT's path, so the obvious
     * implementation reports the layout -- which is not the file anyone can fix,
     * and reads as the layout being broken on every page that uses it.
     */
    await Bun.write(
      path.join(dir, 'views', 'deep', 'page.stx'),
      `@extends('default')\n@section('content')\n<script server>\nimport { headline } from '../../lib/missing'\n</script>\n<h1>{{ headline }}</h1>\n@endsection\n`,
    )
    process.chdir(dir)
    const { generateStaticSite } = await import('../../src/ssg')
    const result = await generateStaticSite({
      pagesDir: 'views',
      outputDir: 'dist',
      layoutsDir: 'layouts',
      sitemap: false,
      robots: false,
      cache: false,
    })
    const message = result.errors.map(e => e.error?.message ?? '').join('\n')

    expect(result.failedCount).toBe(1)
    expect(message).toContain(path.join('views', 'deep', 'page.stx'))
    expect(message).not.toContain(path.join('layouts', 'default.stx'))
  })
})
