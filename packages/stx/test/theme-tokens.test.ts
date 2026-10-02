/**
 * Role-named colours resolve in every app, with no config (stacksjs/stx#1930).
 *
 * `@stacksjs/components` named palette shades directly, so a host app could
 * remap `gray` but could not say "every border in the library comes from
 * `--stx-line`" — nothing distinguished a gray that was a border from a gray
 * that was muted text.
 *
 * The tokens go into the BASE theme rather than an opt-in preset, and that is
 * the property most worth pinning: a component that says `text-fg-muted` has to
 * work in an app that has never heard of the token vocabulary. Shipping them
 * separately from the components that use them would mean adopting the library
 * silently required a config change, and skipping it rendered every component
 * unstyled.
 *
 * Three failure modes are each asserted directly, because each is silent:
 *
 *  1. **Additive.** Adding names must not disturb an existing utility. If
 *     `gray-600` started resolving through a variable, every opacity modifier in
 *     every app would turn into `color-mix()` — a real change to emitted CSS
 *     that nobody asked for.
 *  2. **Fallback present.** Each token carries its light value inside the
 *     `var()`. If the `:root`/`.dark` block ever fails to reach a page, light
 *     mode stays correct and dark mode degrades to the light colour. Without the
 *     fallback the same failure renders an invalid colour and takes the
 *     component's styling with it.
 *  3. **Still overridable.** The tokens are merged as BASE colours, so a
 *     project redefining `accent` in its own config still wins.
 */

import { describe, expect, it } from 'bun:test'
import { mergeCssConfig } from '../src/ts-css-config'
import { SEMANTIC_TOKENS, semanticColors, semanticTokenCSS, semanticTokenNames, tokenVariable } from '../src/theme-tokens'

const PALETTE = {
  /*
   * COMPLETE, deliberately: every family and step any role names.
   *
   * It was not, twice, and both times a test went green while checking
   * nothing. Yellow stopped at 500, so `warning` moving to 600/700 dropped it
   * out of the emitted CSS unnoticed; cyan and purple were absent entirely, so
   * `info` and `secondary` and all ten of their siblings were never emitted
   * either. `semanticColors` drops a role the palette cannot back - which is
   * correct behaviour and exactly what makes an incomplete fixture silent.
   *
   * `declares every role for both modes` now asserts the fixture backs each
   * role before checking it, so the next missing family fails here by name
   * rather than quietly shrinking the test.
   */

  /*
   * The neutral roles name the `neutral` family, not `gray`: achromatic rather
   * than blue-tinted, which is a house choice about saturation and changes no
   * lightness (stacksjs/stx#1993). `gray` stays in the fixture because the
   * palette has it and a role must not silently fall back to it.
   */
  neutral: { 50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717' },
  gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' },
  indigo: { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5' },
  blue: { 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
  cyan: { 100: '#cffafe', 200: '#a5f3fc', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63' },
  purple: { 100: '#f3e8ff', 200: '#e9d5ff', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87' },
  red: { 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
  green: { 100: '#dcfce7', 200: '#bbf7d0', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d' },
  yellow: { 100: '#fef9c3', 200: '#fef08a', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12' },
  white: '#fff',
}

describe('semanticColors', () => {
  it('resolves each role to a variable with the stock value behind it', () => {
    const colors = semanticColors(PALETTE)

    expect(colors['fg-muted']).toBe('var(--stx-fg-muted, #525252)')
    expect(colors.line).toBe('var(--stx-line, #e5e5e5)')
    // blue-600, not indigo-600: the library had two competing accents - 73 blue
    // uses against 34 indigo, both meaning "primary" - and blue won on count,
    // so the painted majority kept its appearance (stacksjs/stx#1993).
    expect(colors.accent).toBe('var(--stx-accent, #2563eb)')
  })

  it('gives a solid fill a different dark value from its text counterpart', () => {
    /*
     * The property this protects: coloured TEXT lightens on a dark background
     * for legibility, a solid FILL does not. Folding the two together turned
     * every primary button paler in dark mode, which is what separated them.
     *
     * Both halves still hold, in opposite directions - text 600 -> 400 lightens,
     * the fill 500 -> 600 darkens - so they cannot share a role.
     */
    expect(SEMANTIC_TOKENS.danger.dark).toBe('red-400')
    expect(SEMANTIC_TOKENS['danger-solid'].dark).toBe('red-600')

    /*
     * The LIGHT values used to be asserted equal, so that a button and its
     * label matched. They no longer are, and that is a trade rather than a
     * slip: the components paint a fill at 500 (`bg-red-500 hover:bg-red-600`,
     * 73 uses) while painting danger text at 600, so the table claimed an
     * agreement the library never honoured. Following the components keeps
     * every one of those fills unchanged; the cost is that a `text-danger`
     * label beside a `bg-danger-solid` button is one shade apart, which is
     * what it already was on screen (stacksjs/stx#1993).
     */
    expect(SEMANTIC_TOKENS['danger-solid'].light).toBe('red-500')
    expect(SEMANTIC_TOKENS.danger.light).toBe('red-600')
  })

  it('drops a token the palette cannot back rather than emitting a dangling var', () => {
    const colors = semanticColors({ neutral: { 600: '#525252' } })

    expect(colors['fg-muted']).toBe('var(--stx-fg-muted, #525252)')
    expect(colors.accent).toBeUndefined()
  })

  /*
   * The neutral roles name `neutral`, so a palette carrying only `gray` backs
   * none of them. Asserted because the fallback would be invisible: a role that
   * silently resolved against a near-identical family would look right and
   * leave the library with two neutrals again.
   */
  it('does not fall back to a near-identical family', () => {
    const colors = semanticColors({ gray: { 600: '#4b5563' } })

    expect(colors['fg-muted']).toBeUndefined()
  })
})

describe('semanticTokenCSS', () => {
  /*
   * This checked one role - `fg-muted` - while claiming in its name to check
   * every one, and the gap was not academic. The fixture carried yellow only at
   * 400 and 500, so when `warning` moved to 600/700 the role vanished from BOTH
   * the `:root` and `.dark` blocks and this test stayed green. A role missing
   * from the emitted CSS is the one failure that cannot be caught downstream:
   * the utility still compiles, to a `var()` whose fallback quietly becomes the
   * only value, so light mode looks right and dark mode never changes.
   *
   * It now does what it says, which means a new role whose family the fixture
   * cannot back fails here rather than opting itself out of the check.
   */
  it('declares every role for both modes', () => {
    const css = semanticTokenCSS(PALETTE)
    const dark = css.slice(css.indexOf('.dark {'))
    const colors = semanticColors(PALETTE)

    expect(css).toContain(':root {')
    expect(css).toContain('.dark {')

    for (const role of Object.keys(SEMANTIC_TOKENS)) {
      // The fixture has to back it in the first place, or the loop below would
      // pass by finding nothing to check.
      expect(colors[role], `fixture palette cannot back role ${role}`).toBeDefined()
      expect(css, `${role} missing from :root`).toContain(`${tokenVariable(role)}:`)
      expect(dark, `${role} missing from .dark`).toContain(`${tokenVariable(role)}:`)
    }
  })

  it('gives a role a different value in each mode, or no dark entry at all', () => {
    /*
     * A dark block that repeats the light value is a role that does not respond
     * to dark mode - which is what four of the neutral HOVER pairs amounted to
     * before they became roles (stacksjs/stx#1993). `-ink` is the deliberate
     * exception: white text on a fill stays white.
     */
    const css = semanticTokenCSS(PALETTE)
    const dark = css.slice(css.indexOf('.dark {'))
    const read = (block: string, role: string) =>
      new RegExp(`${tokenVariable(role)}: ([^;]+);`).exec(block)?.[1]

    for (const role of Object.keys(SEMANTIC_TOKENS)) {
      if (role.endsWith('-ink')) continue

      expect(read(dark, role), `${role} does not change in dark mode`).not.toBe(read(css, role))
    }
  })

  it('uses the .dark class, matching how dark: variants compile', () => {
    // A media query here would disagree with `dark:` utilities on the same page
    // whenever the user has overridden the OS preference.
    expect(semanticTokenCSS(PALETTE)).toContain('.dark {')
    expect(semanticTokenCSS(PALETTE)).not.toContain('prefers-color-scheme')
  })

  it('emits nothing when the palette backs none of it', () => {
    expect(semanticTokenCSS({})).toBe('')
  })

  it('names its variables consistently with the palette entries', () => {
    const names = semanticTokenNames()
    const colors = semanticColors(PALETTE)

    for (const [token] of Object.entries(SEMANTIC_TOKENS)) {
      expect(names).toContain(tokenVariable(token))
      if (colors[token])
        expect(colors[token]).toContain(tokenVariable(token))
    }
  })
})

describe('the merged config every render path uses', () => {
  it('carries the role tokens with no user config at all', () => {
    // The property that lets a component say `text-fg-muted` unconditionally.
    const { config, tokenCSS } = mergeCssConfig({ theme: { colors: PALETTE } }, {})

    expect(config.theme.colors['fg-muted']).toBe('var(--stx-fg-muted, #525252)')
    expect(tokenCSS).toContain('--stx-fg-muted')
  })

  it('leaves the existing palette untouched', () => {
    // Additive. If `gray-600` resolved through a variable instead, every opacity
    // modifier in every app would become `color-mix()` — a real change to the
    // emitted CSS that nobody asked for.
    const { config } = mergeCssConfig({ theme: { colors: PALETTE } }, {})

    expect(config.theme.colors.gray['600']).toBe('#4b5563')
    expect(config.theme.colors.white).toBe('#fff')
  })

  it('lets a project redefine a role outright', () => {
    // Merged as BASE colours, so the user's own config still wins.
    const { config } = mergeCssConfig(
      { theme: { colors: PALETTE } },
      { theme: { colors: { accent: '#e11d48' } } },
    )

    expect(config.theme.colors.accent).toBe('#e11d48')
    // …without disturbing the roles it did not name.
    expect(config.theme.colors['fg-muted']).toBe('var(--stx-fg-muted, #525252)')
  })

  it('survives a base config with no palette', () => {
    const { config, tokenCSS } = mergeCssConfig({}, {})

    /*
     * No palette means no COLOUR roles: every one of them resolves a shade
     * reference, so with nothing to resolve against they are dropped rather
     * than emitted as a dangling `var(--stx-fg, )`.
     *
     * The SHAPE roles are still there, and should be: a radius carries a
     * literal value and depends on no palette, so there is nothing for a
     * missing one to break (stacksjs/stx#1993).
     */
    expect(tokenCSS).not.toContain('--stx-fg')
    expect(tokenCSS).not.toContain('role tokens')
    expect(tokenCSS).toContain('--stx-radius-control: 0.375rem;')
    expect(config.theme.colors).toEqual({})
  })

  it('carries the shape roles as border radii a utility can name', () => {
    const { config } = mergeCssConfig({}, {})

    expect(config.theme.borderRadius.control).toBe('var(--stx-radius-control, 0.375rem)')
    expect(config.theme.borderRadius.panel).toBe('var(--stx-radius-panel, 0.5rem)')
    expect(config.theme.borderRadius.pill).toBe('var(--stx-radius-pill, 9999px)')
  })

  /*
   * Additive, like the colours. `rounded-md` has to keep compiling to a baked
   * value: turning an existing utility into a variable would change the CSS of
   * every app that never asked for it.
   */
  it('leaves the stock radii alone', () => {
    const { config } = mergeCssConfig({ theme: { borderRadius: { md: '0.375rem', lg: '0.5rem' } } }, {})

    expect(config.theme.borderRadius.md).toBe('0.375rem')
    expect(config.theme.borderRadius.lg).toBe('0.5rem')
  })
})
