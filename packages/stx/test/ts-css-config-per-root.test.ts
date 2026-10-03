/**
 * The css config is per app root.
 *
 * It was one module-level slot filled from whichever root generated CSS first,
 * so a second root - another app served by the same process, a build for
 * another package, the next test file - got the first one's shortcuts and
 * theme. In the full suite that made the #2000 shortcut tests fail whenever
 * another file had generated CSS first.
 */
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'bun:test'
import { generateCss } from '../src/dev-server/ts-css'

const REPO = path.resolve(import.meta.dir, '../../..')
const roots: string[] = []

function app(shortcut: string): string {
  const root = mkdtempSync(path.join(tmpdir(), 'stx-css-root-'))
  writeFileSync(path.join(root, 'css.config.ts'), `export default { shortcuts: { 'btn': '${shortcut}' } }\n`)
  symlinkSync(path.join(REPO, 'node_modules'), path.join(root, 'node_modules'))
  roots.push(root)
  return root
}

afterAll(() => {
  for (const root of roots)
    rmSync(root, { recursive: true, force: true })
})

describe('css config per app root', () => {
  it('gives each root its own shortcuts in one process', async () => {
    const red = app('bg-red-600')
    const green = app('bg-green-600')

    const first = await generateCss('<div class="btn"></div>', red)
    const second = await generateCss('<div class="btn"></div>', green)

    const btn = (css: string) => css.match(/(?:^|\n)\.btn\s*\{([^}]*)\}/)?.[1]?.trim()
    // red-600 and green-600, as the engine writes them.
    expect(btn(first)).toBe('background-color: oklch(57.7% 0.245 27.325);')
    expect(btn(second)).toBe('background-color: oklch(62.7% 0.194 149.214);')
  })
})
