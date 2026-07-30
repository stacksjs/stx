/**
 * Concurrent bundling of the same script.
 *
 * A dev server renders several pages at once and they all extend the same
 * layout, so the identical `<script client>` block is bundled concurrently.
 * Every one of those builds wrote the same temp entry file and the same output
 * directory, and every one removed both in its `finally` — so the first build
 * to finish deleted the inputs of the ones still running.
 *
 * The losers came back empty, and an empty bundle was written to the cache like
 * any other result. From then on the page was served a layout whose entire
 * controller had vanished: no toasts, no navigation wiring, no error. It looked
 * like the code had never been written, and it survived edits to the file
 * because a later edit produced a different hash while the old empty entry kept
 * answering for the old one.
 *
 * Two guarantees are pinned here:
 *
 *   1. Concurrent callers for the same script all get the real bundle.
 *   2. A build that loses every binding is never cached, so a transient
 *      failure cannot become permanent.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { bundleClientScript } from '../../src/client-script-bundler'

const TMP = path.join(import.meta.dir, 'temp-concurrent')

const SCRIPT = `
import { formatDate } from './helper'

const label = formatDate(new Date())
function greet() { return 'hi ' + label }
`.trim()

describe('client-script-bundler concurrency', () => {
  let projectRoot: string
  let cacheDir: string
  let templatePath: string

  beforeEach(async () => {
    projectRoot = path.join(TMP, `project-${Math.random().toString(36).slice(2, 10)}`)
    cacheDir = path.join(projectRoot, '.stx', 'bundle-cache')
    templatePath = path.join(projectRoot, 'pages', 'index.stx')

    await fs.promises.mkdir(path.join(projectRoot, 'pages'), { recursive: true })
    await fs.promises.mkdir(cacheDir, { recursive: true })
    await fs.promises.writeFile(
      path.join(projectRoot, 'pages', 'helper.ts'),
      'export function formatDate(d) { return String(d) }\n',
    )
  })

  afterEach(async () => {
    if (fs.existsSync(TMP))
      await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('gives every concurrent caller the same complete bundle', async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        bundleClientScript(SCRIPT, templatePath, { projectRoot, cacheDir })),
    )

    for (const output of results) {
      // The declarations survived: this is exactly what went missing.
      expect(output).toContain('greet')
      expect(output).toContain('label')
      // And the import was actually inlined rather than left dangling.
      expect(output).not.toContain('./helper')
    }

    // All identical — no caller got a degraded build.
    expect(new Set(results).size).toBe(1)
  })

  it('never leaves an empty bundle in the cache', async () => {
    await Promise.all(
      Array.from({ length: 8 }, () =>
        bundleClientScript(SCRIPT, templatePath, { projectRoot, cacheDir })),
    )

    const cached = (await fs.promises.readdir(cacheDir)).filter(f => f.endsWith('.js'))
    expect(cached.length).toBeGreaterThan(0)

    for (const file of cached) {
      const body = await fs.promises.readFile(path.join(cacheDir, file), 'utf8')
      // The signature of the poisoned entry: a bundle that returns nothing.
      expect(body).not.toMatch(/return\s*\{\s*\}\s*;?\s*\}\)\(\)/)
      expect(body).toContain('greet')
    }
  })

  it('serves the same bundle on a later call, from cache', async () => {
    const first = await bundleClientScript(SCRIPT, templatePath, { projectRoot, cacheDir })
    const second = await bundleClientScript(SCRIPT, templatePath, { projectRoot, cacheDir })

    expect(second).toBe(first)
    expect(second).toContain('greet')
  })
})
