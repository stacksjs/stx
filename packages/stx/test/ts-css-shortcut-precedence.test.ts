/**
 * A utility written beside a shortcut wins (stacksjs/stx#2000).
 *
 * `class="text-xs btn-primary"` rendered at text-sm. So did
 * `class="btn-primary text-xs"`. The utility never applied, in either order,
 * and `class="text-white bg-rose-600 btn-primary"` rendered blue.
 *
 * Two causes, both here rather than in the engine:
 *
 *  1. stx re-derived a grouped `.name { … }` rule by scraping declarations out
 *     of the already-generated stylesheet and APPENDED it — while the engine
 *     had emitted a complete, correct one all along. So every shortcut appeared
 *     twice, and the appended copy came after every utility. Both are
 *     single-class selectors, so specificity ties and source order decides.
 *  2. Even with one copy the order was wrong: the engine emits in generation
 *     order, which is class-discovery order, so whether a utility applied
 *     depended on where it sat in the class attribute.
 *
 * The reporter measured what this cost one app: 13 destructive buttons drawn
 * as safe ones — every "Delete", "Remove", "Disconnect" and "Cancel
 * membership" written with rose over a `btn-primary` shortcut and rendered in
 * primary blue, a delete confirmation styled identically to Save beside it —
 * and 36 buttons meant to be small that were not, across 14 files. None of it
 * produced a build error or a console warning.
 *
 * Asserted on BYTE ORDER rather than on presence, because presence was never
 * the problem: both rules were in the stylesheet and the wrong one was last.
 */
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { generateCss } from '../src/dev-server/ts-css'

const REPO = path.resolve(import.meta.dir, '../../..')
let root = ''

const SHORTCUT = 'inline-flex px-4 py-2 font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 rounded-xl'

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), 'stx-2000-'))
  writeFileSync(
    path.join(root, 'css.config.ts'),
    `export default { shortcuts: { 'btn-primary': '${SHORTCUT}' } }\n`,
  )
  // The engine resolves from the project, so it needs the install to reach.
  symlinkSync(path.join(REPO, 'node_modules'), path.join(root, 'node_modules'))
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

/**
 * Byte offsets of every occurrence, so "emitted twice" is visible.
 *
 * Anchored at a rule START. A plain indexOf for `.btn-primary {` also matches
 * inside `.dark .btn-primary {`, so the shortcut's own dark variant counted as
 * a duplicate and this file reported the bug as unfixed when it was fixed.
 */
function offsets(css: string, selector: string): number[] {
  const out: number[] = []
  const pattern = new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&')}\\s*\\{`, 'g')
  for (const m of css.matchAll(pattern)) out.push(m.index ?? 0)
  return out
}

describe('#2000 — a shortcut is the base, not the last word', () => {
  it('emits the shortcut exactly once', async () => {
    const css = await generateCss('<div class="text-xs btn-primary"></div>', root)

    // Was two: pretty-printed from the engine, then single-line at the end.
    expect(offsets(css, '.btn-primary').length).toBe(1)
  })

  /*
   * Both orders, because the bug was order-INDEPENDENT in the wrong direction
   * and the fix has to be order-independent in the right one. A reader should
   * not have to think about where in the attribute they put the utility.
   */
  for (const attr of ['text-xs btn-primary', 'btn-primary text-xs']) {
    it(`lets text-xs override the shortcut's text-sm with class="${attr}"`, async () => {
      const css = await generateCss(`<div class="${attr}"></div>`, root)
      const shortcut = offsets(css, '.btn-primary')
      const utility = offsets(css, '.text-xs')

      expect(shortcut.length).toBe(1)
      expect(utility.length).toBeGreaterThan(0)
      expect(utility[0]).toBeGreaterThan(shortcut[0])
    })
  }

  it('lets a destructive colour override the shortcut, which is what hurt', async () => {
    const css = await generateCss(
      '<div class="text-white bg-rose-600 hover:bg-rose-700 btn-primary"></div>',
      root,
    )
    const shortcut = offsets(css, '.btn-primary')

    for (const utility of ['.bg-rose-600', '.hover\\:bg-rose-700:hover']) {
      const at = offsets(css, utility)

      expect(at.length, `${utility} missing`).toBeGreaterThan(0)
      expect(at[0], `${utility} lands before the shortcut`).toBeGreaterThan(shortcut[0])
    }
  })

  /*
   * The scraping it replaced only knew how to handle `dark:` among variants,
   * and emitted `@media (prefers-color-scheme: dark) { .dark .name { … } }` -
   * needing the media query AND the class to match, while the rest of stx keys
   * dark mode on the class alone. So that rule could never apply in an app
   * pinned to dark on a light OS, which is the case stx's own color-mode boot
   * exists to support.
   */
  it('resolves the shortcut\'s own variants through the engine', async () => {
    const css = await generateCss('<div class="btn-primary"></div>', root)

    expect(css).toContain('.btn-primary:hover')
    expect(css).toContain('.dark .btn-primary')
    expect(css).not.toContain('prefers-color-scheme: dark) { .dark .btn-primary')
  })

  it('leaves a shortcut nobody used out of the stylesheet', async () => {
    const css = await generateCss('<div class="text-xs"></div>', root)

    expect(offsets(css, '.btn-primary').length).toBe(0)
  })
})
