/**
 * The Mac theme, and every component that carries a copy of it.
 *
 * A component's `<style>` block is extracted from its source before anything
 * is interpolated, so a component cannot import the theme: it carries the
 * generated CSS as literal text. This holds every copy to
 * `macThemeCss()`, so a token changed in one place cannot leave a control
 * drawn with last month's value.
 */
import { describe, expect, it } from 'bun:test'
import { Glob } from 'bun'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MAC_DARK, MAC_LIGHT, MAC_METRICS, macThemeCss } from '../src/utils/mac-theme'

const SRC = resolve(import.meta.dir, '../src')
const components = [...new Glob('**/*.stx').scanSync({ cwd: SRC })].sort()
const sourceOf = (file: string): string => readFileSync(resolve(SRC, file), 'utf8')
const usesTheme = (source: string): boolean => /var\(--stx-mac-/.test(source)

describe('the Mac theme', () => {
  it('has a dark value for every colour and no others', () => {
    expect(Object.keys(MAC_DARK).sort()).toEqual(Object.keys(MAC_LIGHT).sort())
  })

  it('writes every token once per mode, at no specificity', () => {
    const css = macThemeCss()

    for (const name of [...Object.keys(MAC_LIGHT), ...Object.keys(MAC_METRICS)])
      expect(css).toContain(`  --stx-mac-${name}: `)
    expect(css.startsWith(':where(:root) {')).toBe(true)
    expect(css).toContain(':where(.dark) {')
    // Dark follows the class the role tokens follow, never the system alone:
    // a control must not go dark on a page that stayed light.
    expect(css).not.toContain('prefers-color-scheme')
  })

  it('takes its accent from the library accent', () => {
    expect(MAC_LIGHT.accent).toBe('var(--stx-accent, #007aff)')
    expect(MAC_DARK.accent).toBe('var(--stx-accent, #0a84ff)')
  })

  it('draws a hairline a display can show, and firmer lines when asked for contrast', () => {
    const css = macThemeCss()

    expect(css).toContain('@media (max-resolution: 1.5dppx)')
    expect(css).toContain('@media (prefers-contrast: more)')
  })
})

describe('components drawn with it', () => {
  const themed = components.filter(file => usesTheme(sourceOf(file)))

  it('exist', () => {
    expect(themed.length).toBeGreaterThan(0)
  })

  for (const file of themed) {
    it(`${file} carries the theme exactly as generated`, () => {
      expect(sourceOf(file)).toContain(macThemeCss())
    })
  }
})
