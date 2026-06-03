/**
 * Regression for stacksjs/stx#1749: the dev-server crosswind pass dropped a
 * page's own utilities (`grid`, `grid-cols-*`) when the page was composed into a
 * pre-processed app shell.
 *
 * Cause: `processShell` runs the shell through `processDirectives` top-level, so
 * the shell already carries a `<style data-crosswind="generated">` covering the
 * SHELL's classes. After `composeShellWithPage`, the page-level
 * `injectCrosswindCSS` saw that marker and early-returned — so the page's own
 * classes were never scanned. `.gap-4` (used by the shell nav) survived while
 * `.grid` (only on the page) was missing → cards laid out as `display:block`.
 *
 * Fix: injectCrosswindCSS regenerates from the full composed content and replaces
 * the existing generated style, emitting the union of shell + page classes with a
 * single Preflight reset.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { composeShellWithPage, processShell } from '../../src/app-shell'
import { injectCrosswindCSS } from '../../src/dev-server/crosswind'

describe('crosswind + app shell composition (#1749)', () => {
  let dir: string
  let shellPath: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'stx-1749-'))
    shellPath = join(dir, 'shell.stx')
    // A shell whose nav uses gap-4 (so the shell's own crosswind pass emits it).
    await writeFile(
      shellPath,
      `<!DOCTYPE html>\n<html>\n<head><title>App</title></head>\n<body>\n  <nav class="flex gap-4 p-4">Nav</nav>\n  <main><slot /></main>\n</body>\n</html>\n`,
    )
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  async function serve(pageHtml: string): Promise<string> {
    const shell = await processShell(shellPath, {})
    expect(shell).not.toBeNull()
    // The shell carries its own generated crosswind style — this is the
    // precondition that used to trigger the early-return bug.
    expect(shell!.beforeSlot.includes('data-crosswind="generated"')).toBe(true)
    const composed = composeShellWithPage(shell!, pageHtml)
    return injectCrosswindCSS(composed)
  }

  it("emits the page's grid utilities even though the shell pre-injected crosswind", async () => {
    const out = await serve('<div class="grid grid-cols-6 gap-4">cards</div>')
    const css = (out.match(/<style data-crosswind="generated">[\s\S]*?<\/style>/g) || []).join('')
    // The page's own utilities must be present...
    expect(css).toMatch(/\.grid\s*\{[^}]*display:\s*grid/)
    expect(css).toMatch(/grid-template-columns/)
    // ...alongside the shell's (union, not replacement).
    expect(css).toContain('gap')
  })

  it('emits exactly one generated style with a single Preflight reset', async () => {
    const out = await serve('<div class="grid grid-cols-3">x</div>')
    const tags = out.match(/<style data-crosswind="generated">/g) || []
    expect(tags.length).toBe(1)
    // Preflight (box-sizing reset) must appear once, not duplicated.
    const resets = out.match(/box-sizing:\s*border-box/g) || []
    expect(resets.length).toBe(1)
  })
})
