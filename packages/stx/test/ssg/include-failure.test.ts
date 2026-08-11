/**
 * A failed `@include` fails the build instead of shipping an error banner.
 *
 * `processIncludes` renders the failure where the markup should have been and
 * carries on. In dev that is right — you see it the moment you look at the page.
 * In a BUILD it writes a file nobody would knowingly deploy, and nothing else in
 * the pipeline can see it: one app shipped pre-rendered pages whose header,
 * footer, hero, CTA and every layout include had been replaced by an ENOENT
 * banner, ANSI escape codes included, while the build printed
 *
 *     Total: 37 pages
 *     Success: 37
 *     Failed: 0
 *
 * and exited 0. Fifteen failed includes on the home page alone. `dist/index.html`
 * was a 6KB shell where it should have been 95KB, and it stayed that way for
 * three weeks, because lint, typecheck and the build summary were all blind to
 * it — the only way to find it was to read the emitted HTML, which is exactly
 * what nobody does when the build says success (stacksjs/stx#1921).
 *
 * The two things that make it a ten-second fix instead: the run has to FAIL, and
 * the message has to name the directory the include was resolved against, since
 * "it looked in the wrong place" is the usual cause.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { SSGResult } from '../../src/ssg'

let dir = ''
const originalCwd = process.cwd()

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-include-fail-'))
  await Bun.write(path.join(dir, 'partials', 'Thing.stx'), '<p>THING MARKUP</p>\n')
})

afterEach(async () => {
  process.chdir(originalCwd)
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

/** Write a page whose layout-level include is `target`, then build. */
async function buildWith(target: string, options: Record<string, unknown> = {}): Promise<SSGResult> {
  await Bun.write(path.join(dir, 'views', 'index.stx'), `<main>@include('${target}')</main>\n`)
  process.chdir(dir)
  const { generateStaticSite } = await import('../../src/ssg')
  return generateStaticSite({
    pagesDir: 'views',
    outputDir: 'dist',
    sitemap: false,
    robots: false,
    minify: false,
    cache: false,
    ...options,
  })
}

function output(): string {
  const file = path.join(dir, 'dist', 'index.html')
  return existsSync(file) ? readFileSync(file, 'utf8') : ''
}

describe('an include that cannot be resolved', () => {
  it('fails the build rather than reporting success', async () => {
    const result = await buildWith('Bench/ConfirmHost')

    expect(result.failedCount).toBe(1)
    expect(result.successCount).toBe(0)
  })

  it('does not write the page it would have shipped', async () => {
    // The reported symptom was a deployable artifact, not a log line. Counting
    // the failure while still emitting the file would leave the bad HTML on disk
    // for whatever copies `dist/` next.
    await buildWith('Bench/ConfirmHost')

    expect(output()).not.toContain('Error loading include')
    expect(output()).toBe('')
  })

  it('names the directory it looked in', async () => {
    // "It resolved against the wrong directory" is the usual cause, and the
    // resolved path is the whole diagnosis. Without it the message says a file
    // is missing from a location it never states.
    const result = await buildWith('Bench/ConfirmHost')
    const message = result.errors[0]?.error?.message ?? ''

    expect(message).toContain('Bench/ConfirmHost')
    expect(message).toContain('partialsDir:')
    expect(message).toContain(path.join(dir, 'partials'))
  })

  it('builds normally when the include resolves', async () => {
    // The guard must not fire on a working page, or it is just a broken build.
    const result = await buildWith('Thing')

    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(1)
    expect(output()).toContain('THING MARKUP')
  })

  it('can be opted out of, leaving the old behaviour exactly as it was', async () => {
    // Anyone relying on the render-in-place behaviour keeps it, banner and all.
    const result = await buildWith('Bench/ConfirmHost', { failOnIncludeError: false })

    expect(result.failedCount).toBe(0)
    expect(result.successCount).toBe(1)
    expect(output()).toContain('Error loading include')
  })
})

describe('the partials directory the build resolves against', () => {
  it('can be set by the caller', async () => {
    // `pagesDir`, `publicDir` and `outputDir` were all overridable and this was
    // not, so a caller could point the build at one layout and silently get
    // another for its partials.
    await Bun.write(path.join(dir, 'elsewhere', 'Thing.stx'), '<p>FROM ELSEWHERE</p>\n')

    const result = await buildWith('Thing', { partialsDir: 'elsewhere' })

    expect(result.failedCount).toBe(0)
    expect(output()).toContain('FROM ELSEWHERE')
    expect(output()).not.toContain('THING MARKUP')
  })
})
