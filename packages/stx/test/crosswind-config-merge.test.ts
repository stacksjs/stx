/**
 * A crosswind config means the same thing on every render path
 * (stacksjs/stx#1867).
 *
 * There were two merges and they disagreed. The dev-server path read only
 * `theme.extend` and pinned the result *after* the user spread, so a project
 * writing `theme: { colors: { … } }` the Tailwind-classic way lost its whole
 * theme — no error, no warning, every `bg-panel` generating nothing. The serve
 * path shallow-spread the same key, so there the user's `colors` replaced the
 * entire stock palette instead: the opposite failure, from the same file,
 * decided by which binary rendered the page. That path also read only
 * `safelist`, `shortcuts` and `theme`, dropping `darkMode`, `preflights`,
 * `cssVariables`, `rules`, `blocklist` and `variants` outright.
 *
 * The reporting app was spared purely by accident — it happened to spell its
 * eight design tokens under `theme.extend.colors`.
 */
import { describe, expect, it } from 'bun:test'
import { deepMergeThemes, mergeCrosswindConfig } from '../src/crosswind-config'

const BASE = {
  theme: {
    colors: { red: { 500: '#ef4444' }, blue: { 500: '#3b82f6' } },
    spacing: { 1: '4px' },
  },
  safelist: ['base-safe'],
  shortcuts: { 'base-btn': 'px-4 py-2' },
  darkMode: 'class',
}

describe('a theme written without extend', () => {
  it('reaches the generator at all', () => {
    // The whole bug: this shape was read for `extend`, found none, and dropped.
    const { config } = mergeCrosswindConfig(BASE, {
      theme: { colors: { panel: 'var(--panel)', 'text-2': 'var(--text-2)' } },
    })

    expect(config.theme.colors.panel).toBe('var(--panel)')
    expect(config.theme.colors['text-2']).toBe('var(--text-2)')
  })

  it('does not take the stock palette down with it', () => {
    // The serve path's failure mode: adding one token killed `bg-red-500`
    // everywhere. Classes come from scanning the page, so an unused base color
    // costs nothing and dropping it costs everything.
    const { config } = mergeCrosswindConfig(BASE, {
      theme: { colors: { panel: 'var(--panel)' } },
    })

    expect(config.theme.colors.red[500]).toBe('#ef4444')
    expect(config.theme.colors.blue[500]).toBe('#3b82f6')
  })

  it('still lets a project override a specific base value', () => {
    const { config } = mergeCrosswindConfig(BASE, {
      theme: { colors: { red: { 500: '#dc2626' } } },
    })

    expect(config.theme.colors.red[500]).toBe('#dc2626')
    expect(config.theme.colors.blue[500]).toBe('#3b82f6')
  })
})

describe('extend keeps working', () => {
  it('is passed through for the generator to apply', () => {
    const { config } = mergeCrosswindConfig(BASE, {
      theme: { extend: { colors: { brand: '#0af' } } },
    })

    expect(config.theme.extend.colors.brand).toBe('#0af')
  })

  it('coexists with sibling theme keys', () => {
    const { config } = mergeCrosswindConfig(BASE, {
      theme: {
        colors: { panel: 'var(--panel)' },
        extend: { spacing: { 7: '28px' } },
      },
    })

    expect(config.theme.colors.panel).toBe('var(--panel)')
    expect(config.theme.extend.spacing[7]).toBe('28px')
    // `extend` must not leak into the resolved theme as a color group.
    expect(config.theme.colors.extend).toBeUndefined()
  })

  it('is absent when nobody declared one', () => {
    expect(mergeCrosswindConfig(BASE, {}).config.theme.extend).toBeUndefined()
  })
})

describe('the keys the serve path used to drop', () => {
  it('carries darkMode, rules, variants, blocklist and cssVariables through', () => {
    const { config } = mergeCrosswindConfig(BASE, {
      darkMode: 'media',
      rules: [['x', { color: 'red' }]],
      variants: ['hocus'],
      blocklist: ['container'],
      cssVariables: { '--x': '1' },
    })

    expect(config.darkMode).toBe('media')
    expect(config.rules).toHaveLength(1)
    expect(config.variants).toEqual(['hocus'])
    expect(config.blocklist).toEqual(['container'])
    expect(config.cssVariables).toEqual({ '--x': '1' })
  })

  it('merges safelist and shortcuts rather than replacing them', () => {
    const merged = mergeCrosswindConfig(BASE, {
      safelist: ['user-safe'],
      shortcuts: { 'user-btn': 'rounded' },
    })

    expect(merged.safelist).toEqual(['base-safe', 'user-safe'])
    expect(merged.shortcuts).toEqual({ 'base-btn': 'px-4 py-2', 'user-btn': 'rounded' })
  })

  it('concatenates preflights instead of losing the base layer', () => {
    const { config } = mergeCrosswindConfig(
      { ...BASE, preflights: ['base-layer'] },
      { preflights: ['user-font-face'] },
    )

    expect(config.preflights).toEqual(['base-layer', 'user-font-face'])
  })
})

describe('what stx owns regardless', () => {
  it('pins content and output even when the user sets them', () => {
    // #1822: classes come from scanning the rendered page, and the CSS is
    // returned rather than written.
    const { config } = mergeCrosswindConfig(BASE, {
      content: ['./src/**/*.stx'],
      output: 'dist/app.css',
    })

    expect(config.content).toEqual([])
    expect(config.output).toBe('')
  })

  it('honours preflight and minify instead of ignoring them', () => {
    expect(mergeCrosswindConfig(BASE, {})).toMatchObject({ includePreflight: true, minify: false })
    expect(mergeCrosswindConfig(BASE, { preflight: false, minify: true }))
      .toMatchObject({ includePreflight: false, minify: true })
  })
})

describe('deepMergeThemes', () => {
  it('recurses into plain objects', () => {
    expect(deepMergeThemes({ a: { b: 1, c: 2 } }, { a: { c: 3, d: 4 } })).toEqual({ a: { b: 1, c: 3, d: 4 } })
  })

  it('replaces arrays rather than concatenating them', () => {
    // A font stack is complete, not additive.
    expect(deepMergeThemes({ fontFamily: ['Inter', 'sans-serif'] }, { fontFamily: ['Satoshi'] }))
      .toEqual({ fontFamily: ['Satoshi'] })
  })

  it('does not mutate its inputs', () => {
    const base = { a: { b: 1 } }
    deepMergeThemes(base, { a: { c: 2 } })

    expect(base).toEqual({ a: { b: 1 } })
  })
})
