/**
 * A project's `fonts` reach the stylesheet once, and first.
 *
 * Every engine generator writes the configured fonts at the top of its own
 * output, and the dev-server path builds a sheet from two of them (shortcuts,
 * then utilities), so each self-hosted `@font-face` came out twice. The role
 * tokens were prepended ahead of both, so a Google `@import` sat behind a
 * rule, where browsers ignore it and the family never loads.
 */
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { generateCss } from '../src/dev-server/ts-css'
import { mergeCssConfig, renderFontCSS } from '../src/ts-css-config'

const REPO = path.resolve(import.meta.dir, '../../..')
let root = ''

const FACE = `@font-face { font-family: 'Geist'; src: url('/fonts/geist.woff2') format('woff2'); font-display: swap; }`

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), 'stx-fonts-'))
  writeFileSync(
    path.join(root, 'css.config.ts'),
    `export default {
  shortcuts: { 'btn': 'px-4 py-2 text-sm' },
  fonts: { google: ['Inter:wght@400;700'], faces: [${JSON.stringify(FACE)}] },
}\n`,
  )
  symlinkSync(path.join(REPO, 'node_modules'), path.join(root, 'node_modules'))
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('web fonts in the generated sheet', () => {
  it('writes each @font-face once, beside a shortcut', async () => {
    const css = await generateCss('<div class="btn text-xs"></div>', root)
    expect(css.match(/@font-face/g)?.length).toBe(1)
  })

  it('opens the sheet with the Google @import', async () => {
    const css = await generateCss('<div class="btn mt-2"></div>', root)
    expect(css.startsWith('@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;700')).toBe(true)
    expect(css.match(/@import/g)?.length).toBe(1)
  })

  it('keeps fonts out of the config handed to the generators', () => {
    const merged = mergeCssConfig({}, { fonts: { faces: [FACE] } })
    expect(merged.config.fonts).toBeUndefined()
    expect(merged.fonts).toEqual({ faces: [FACE] })
  })

  it('renders nothing when no fonts are declared', () => {
    const merged = mergeCssConfig({}, {})
    expect(renderFontCSS(class { toCSS() { return 'x' } } as any, merged)).toBe('')
  })
})
