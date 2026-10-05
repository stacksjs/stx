/**
 * `buildViews` fails on a failed `<script server>` too.
 *
 * The companion to `server-script-failure.test.ts`: the same hole existed in
 * the other builder, and the same argument applies, because the output is the
 * same -- a written file with the content its script produces missing, from a
 * run that reported success (stacksjs/stx#2035).
 *
 * This path needs its own test rather than trusting the shared option, because
 * `renderView` strips the view's own `<script server>` and extracts it itself
 * before `processDirectives` runs. A hook threaded only through the render
 * config would report a failure in any component the page uses and stay silent
 * about the page's own script, which is the one most likely to fail.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildViews } from '../../src/build-views'

let dir = ''

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-build-views-fail-'))
  await Bun.write(path.join(dir, 'lib', 'copy.ts'), `export const headline = 'REAL HEADLINE'\n`)
})

afterEach(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

async function build(script: string) {
  await Bun.write(
    path.join(dir, 'views', 'index.stx'),
    `<script server>\n${script}\n</script>\n<main><h1>{{ headline }}</h1></main>\n`,
  )
  return buildViews({
    viewsDir: path.join(dir, 'views'),
    outputDir: path.join(dir, 'out'),
  })
}

function wrote(): boolean {
  return existsSync(path.join(dir, 'out', 'index.html'))
}

describe('buildViews and a failed server script', () => {
  it('fails the build and names the view', async () => {
    const result = await build(`import { headline } from '../lib/missing'`)

    expect(result.success).toBe(false)
    expect(result.errors[0]?.file).toBe('index.stx')
    expect(result.errors[0]?.error ?? '').toContain('module-resolution')
  })

  it('does not write the view it would have shipped', async () => {
    // The point of failing: no artifact for something else to copy onward.
    await build(`import { headline } from '../lib/missing'`)

    expect(wrote()).toBe(false)
  })

  it('builds normally when the import resolves', async () => {
    const result = await build(`import { headline } from '../lib/copy'`)

    expect(result.success).toBe(true)
    expect(wrote()).toBe(true)
  })

  it('does not fail on a script reaching for a browser global', async () => {
    const result = await build(`export const headline = window.location.href`)

    expect(result.success).toBe(true)
    expect(wrote()).toBe(true)
  })
})
