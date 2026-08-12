/**
 * An app can redirect the components' colours (stacksjs/stx#1930).
 *
 * 62 of 91 components name palette shades directly, and the report read that as
 * "there is no seam at all". Half of that is not so, and the half that is true
 * is more specific — so both halves are pinned here, because a seam nobody
 * documented is one refactor away from not existing.
 *
 *  1. **The build-time seam already works.** A project's `crosswind.config.ts`
 *     `theme.colors` deep-merges over the base palette, and stx generates CSS by
 *     scanning the rendered page — so redefining a shade re-themes every
 *     component that names it, with no component edits and no opt-in. Asserted
 *     against a real render, because the claim is about what an app receives.
 *
 *  2. **What was missing is a RUNTIME seam and SEMANTIC names.** `stxThemePreset`
 *     resolves each shade through a CSS custom property with today's value as
 *     the fallback, so an unstyled app is byte-identical and a themed one
 *     overrides without a rebuild — and adds role-named tokens on top, because
 *     `--stx-surface` says what a colour is for where `--stx-color-gray-50` only
 *     says what it is.
 *
 * The load-bearing assertion in both directions is the FALLBACK. A preset that
 * dropped it would silently un-style every component the moment it was adopted,
 * which is a far worse failure than the one being fixed.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { resetCrosswindCache } from '../../stx/src/dev-server/crosswind'
import { processDirectives } from '../../stx/src/process'
import { SEMANTIC_TOKENS, stxThemePreset, THEMED_FAMILIES, themeVariableNames } from '../src/theme'

const UI = join(import.meta.dir, '..', 'src', 'ui')

/** A stand-in for crosswind's default palette, in its own shape. */
const DEFAULTS = {
  gray: { 50: '#f9fafb', 600: '#4b5563', 900: '#111827' },
  indigo: { 500: '#6366f1', 600: '#4f46e5' },
  red: { 600: '#dc2626' },
  green: { 600: '#16a34a' },
  yellow: { 500: '#eab308' },
  neutral: { 800: '#262626' },
  white: '#fff',
}

const dirs: string[] = []

afterAll(() => {
  for (const dir of dirs)
    rmSync(dir, { recursive: true, force: true })
})

/**
 * Render a template as an app would, with a given crosswind config on disk.
 *
 * The config is discovered from the working directory, so this needs a real
 * one — which is also the point: it exercises the path an app actually takes.
 */
async function renderWithConfig(config: string, template: string): Promise<string> {
  // Inside the repo rather than in the system temp directory: the config
  // resolves `@cwcss/crosswind`, and that needs a node_modules to walk up to.
  // From /var/folders it fails, the config loads as null, and every assertion
  // then measures the STOCK palette while reading as a passing custom theme.
  const dir = mkdtempSync(join(import.meta.dir, '.tmp-theme-'))
  dirs.push(dir)
  await Bun.write(join(dir, 'crosswind.config.ts'), config)

  const previous = process.cwd()
  process.chdir(dir)
  // The resolved crosswind config is cached in module state for the life of the
  // process, so without this the FIRST config in the file silently answers for
  // every later one — and each assertion would pass or fail on a theme it never
  // asked for.
  resetCrosswindCache()
  try {
    const options = { ...defaultConfig, componentsDir: UI, root: dir } as any
    const out = await processDirectives(template, {}, join(dir, 'page.stx'), options, new Set<string>())
    return (out.match(/<style[\s\S]*?<\/style>/g) ?? []).join('\n')
  }
  finally {
    process.chdir(previous)
    resetCrosswindCache()
  }
}

/** The declarations of one generated rule, e.g. `.text-gray-600`. */
function ruleFor(css: string, selector: string): string {
  const at = css.indexOf(`${selector} {`)
  return at === -1 ? '' : css.slice(at, css.indexOf('}', at) + 1)
}

const BREADCRUMB = `<Breadcrumb :items="[{label:'Home',href:'/'},{label:'Here',href:'/here'}]" />`

describe('the build-time seam that already existed', () => {
  it('re-themes a component when the app redefines a shade', async () => {
    // Breadcrumb's link is `text-gray-600`, written into the component. This is
    // the answer to "an app whose colours live in a theme.extend.colors map".
    const css = await renderWithConfig(
      `export default { theme: { colors: { gray: { 600: '#ff00ff' } } } }`,
      BREADCRUMB,
    )

    expect(ruleFor(css, '.text-gray-600')).toContain('#ff00ff')
  })

  it('leaves the shades the app did not name alone', async () => {
    // Tailwind treats a non-`extend` `theme.colors` as a REPLACEMENT. Here it
    // deep-merges, so naming one shade cannot silently un-style everything else.
    const css = await renderWithConfig(
      `export default { theme: { colors: { gray: { 600: '#ff00ff' } } } }`,
      BREADCRUMB,
    )

    expect(ruleFor(css, '.dark .dark\\:text-gray-400')).not.toContain('#ff00ff')
    expect(ruleFor(css, '.dark .dark\\:text-gray-400')).toMatch(/color:\s*\S+/)
  })
})

describe('stxThemePreset', () => {
  it('routes every themed shade through a variable, with today\'s value behind it', () => {
    const palette = stxThemePreset(DEFAULTS) as Record<string, Record<string, string>>

    expect(palette.gray['600']).toBe('var(--stx-color-gray-600, #4b5563)')
    // The fallback is the whole point: without it, adopting the preset would
    // un-style every component until the app declared all of them.
    expect(palette.gray['50']).toContain('#f9fafb')
  })

  it('gives the role tokens a two-step fallback', () => {
    const palette = stxThemePreset(DEFAULTS) as Record<string, string>

    // Role → shade variable → stock value. An app that moves only the palette
    // still moves the roles with it.
    expect(palette.surface).toBe('var(--stx-surface, var(--stx-color-gray-50, #f9fafb))')
    expect(palette.accent).toBe('var(--stx-accent, var(--stx-color-indigo-600, #4f46e5))')
  })

  it('covers every family it claims to', () => {
    const palette = stxThemePreset(DEFAULTS)

    for (const family of THEMED_FAMILIES) {
      if (DEFAULTS[family as keyof typeof DEFAULTS])
        expect(palette[family]).toBeDefined()
    }
    for (const token of Object.keys(SEMANTIC_TOKENS))
      expect(palette[token]).toBeDefined()
  })

  it('skips a family the palette does not define rather than emitting a dangling var', () => {
    const palette = stxThemePreset({ gray: { 600: '#4b5563' } })

    expect(palette.indigo).toBeUndefined()
    // The role token still exists — it just has nothing stock to fall back to.
    expect(palette.accent).toBe('var(--stx-accent, var(--stx-color-indigo-600))')
  })

  it('lists its variables from the same source as the palette', () => {
    // The issue asked for "a documented list of the variables each family
    // reads". Generated rather than written down, so it cannot disagree.
    const names = themeVariableNames(DEFAULTS)

    expect(names).toContain('--stx-color-gray-600')
    expect(names).toContain('--stx-surface')
    expect(names).not.toContain('--stx-color-white-600')
  })
})

describe('the preset in a real render', () => {
  const CONFIG = `
import { stxThemePreset } from '${join(import.meta.dir, '..', 'src', 'theme')}'
const cw = await import('@cwcss/crosswind')
export default { theme: { colors: stxThemePreset(cw.defaultConfig?.theme?.colors ?? {}) } }
`

  it('emits a variable with the stock value behind it, so nothing changes by default', async () => {
    const css = await renderWithConfig(CONFIG, BREADCRUMB)
    const rule = ruleFor(css, '.text-gray-600')

    expect(rule).toContain('var(--stx-color-gray-600')
    // The stock oklch is still in there as the fallback.
    expect(rule).toContain('oklch(')
  })

  it('keeps opacity modifiers working, through color-mix', async () => {
    // The trade the preset makes, and the reason it is opt-in: an alpha
    // modifier on a value that is not known at build time cannot be baked.
    // If this silently generated nothing, every `bg-black/4` in the library
    // would vanish the moment an app adopted the preset.
    const css = await renderWithConfig(CONFIG, '<div class="bg-gray-600/50">x</div>')

    expect(ruleFor(css, '.bg-gray-600\\/50')).toContain('color-mix(')
  })

  it('makes the role tokens usable as ordinary utilities', async () => {
    const css = await renderWithConfig(CONFIG, '<div class="bg-surface text-fg-muted border-line">x</div>')

    expect(ruleFor(css, '.bg-surface')).toContain('var(--stx-surface')
    expect(ruleFor(css, '.text-fg-muted')).toContain('var(--stx-fg-muted')
    expect(ruleFor(css, '.border-line')).toContain('var(--stx-line')
  })

  it('still works under a variant, which is how dark mode reaches it', async () => {
    const css = await renderWithConfig(CONFIG, '<div class="dark:bg-surface hover:text-fg">x</div>')

    expect(ruleFor(css, '.dark .dark\\:bg-surface')).toContain('var(--stx-surface')
    expect(ruleFor(css, '.hover\\:text-fg:hover')).toContain('var(--stx-fg')
  })
})
