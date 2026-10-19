/**
 * An app answers stx's role tokens once, in its css config, and both targets
 * follow: the web through the generated stylesheet's token block, a native
 * screen through the same answers handed to the translator as a document
 * theme (app-theme.ts).
 *
 * Before, an app wrote the `:root` / `.dark` block by hand in its own
 * stylesheet, which a native screen never compiles with, so a shared
 * component drew the app's colours on the web and stock greys on a phone.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '@stacksjs/ts-css/engine'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { nativeThemeCSS, resetAppThemeCSS } from '../../src/native/compiler/app-theme'
import { mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'
import { mergeCssConfig } from '../../src/ts-css-config'

const CONFIG = {
  roles: {
    accent: { light: 'emerald-600', dark: 'emerald-400' },
    page: { light: '#f2f4ef', dark: '#101c16' },
    fg: 'slate-900',
    // A role answered in light only keeps its stock dark value.
    line: { light: 'slate-200' },
  },
  shapes: { control: '9999px' },
}

afterEach(() => {
  unmountAllNativeScreens()
  resetAppThemeCSS()
})

function block(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)
  return start === -1 ? '' : css.slice(start, css.indexOf('}', start))
}

describe('role answers in the css config, on the web', () => {
  it('replaces the stock value in each mode and keeps the rest', () => {
    const palette = (defaultConfig as any).theme.colors
    const merged = mergeCssConfig(defaultConfig as any, CONFIG)
    const light = block(merged.tokenCSS, ':root')
    const dark = block(merged.tokenCSS, '.dark')
    expect(light).toContain(`--stx-accent: ${palette.emerald['600']};`)
    expect(dark).toContain(`--stx-accent: ${palette.emerald['400']};`)
    expect(light).toContain('--stx-page: #f2f4ef;')
    expect(dark).toContain('--stx-page: #101c16;')
    expect(light).toContain(`--stx-fg: ${palette.slate['900']};`)
    expect(dark).toContain(`--stx-fg: ${palette.slate['900']};`)
    expect(dark).toContain(`--stx-line: ${palette.neutral['700']};`)
    // An unanswered role is untouched.
    expect(light).toContain(`--stx-danger: ${palette.red['600']};`)
    expect(merged.tokenCSS).toContain('--stx-radius-control: 9999px;')
    // stx's to read, not the engine's.
    expect(merged.config.roles).toBeUndefined()
    expect(merged.unknownRoles).toEqual([])
  })

  it('names an answer stx has no role for', () => {
    const merged = mergeCssConfig(defaultConfig as any, { roles: { brand: 'emerald-600' }, shapes: { blob: '4px' } })
    expect(merged.unknownRoles).toEqual(['roles.brand', 'shapes.blob'])
  })

  it('resolves an answer against a family the app defines itself', () => {
    const merged = mergeCssConfig(defaultConfig as any, { theme: { colors: { trail: { 600: '#24724b' } } }, roles: { accent: 'trail-600' } })
    expect(block(merged.tokenCSS, ':root')).toContain('--stx-accent: #24724b;')
  })
})

describe('role answers on a native screen', () => {
  it('declares only the answered roles, in the hex a host reads', () => {
    const css = nativeThemeCSS(CONFIG)
    expect(css).toContain('--stx-accent: #059669;')
    expect(css).toContain('--stx-page: #f2f4ef;')
    expect(block(css, '.dark')).toContain('--stx-accent: #34d399;')
    expect(css).not.toContain('--stx-danger')
    expect(css).toContain('--stx-radius-control: 9999px;')
  })

  it('reaches a compiled screen and follows the appearance', async () => {
    const root = createTempDir('stx-app-theme-')
    await Bun.write(join(root, 'stx.config.ts'), `export default { root: '.', css: './css.ts' }`)
    await Bun.write(join(root, 'css.ts'), `export default ${JSON.stringify(CONFIG)}`)
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<div testID="page" class="bg-page"><p testID="ink" class="text-accent rounded-control">Trails</p></div>`)
    const { code } = await compileSharedScreenBundle(file, { root })
    const phone = mountNativeScreen(code, 'Screen')
    await phone.settle()
    expect(phone.byTestID('page')!.style.backgroundColor).toBe('#f2f4ef')
    expect(phone.byTestID('ink')!.style.color).toBe('#059669')
    expect(phone.byTestID('ink')!.style.borderRadius).toBe(9999)

    phone.appearance('dark')
    await phone.settle()
    expect(phone.byTestID('page')!.style.backgroundColor).toBe('#101c16')
    expect(phone.byTestID('ink')!.style.color).toBe('#34d399')
  }, 30_000)
})
