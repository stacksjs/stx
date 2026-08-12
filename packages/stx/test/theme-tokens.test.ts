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
import { mergeCrosswindConfig } from '../src/crosswind-config'
import { SEMANTIC_TOKENS, semanticColors, semanticTokenCSS, semanticTokenNames, tokenVariable } from '../src/theme-tokens'

const PALETTE = {
  gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827' },
  indigo: { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5' },
  blue: { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' },
  red: { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
  green: { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
  yellow: { 400: '#facc15', 500: '#eab308' },
  white: '#fff',
}

describe('semanticColors', () => {
  it('resolves each role to a variable with the stock value behind it', () => {
    const colors = semanticColors(PALETTE)

    expect(colors['fg-muted']).toBe('var(--stx-fg-muted, #4b5563)')
    expect(colors.line).toBe('var(--stx-line, #e5e7eb)')
    expect(colors.accent).toBe('var(--stx-accent, #4f46e5)')
  })

  it('gives a solid fill a different dark value from its text counterpart', () => {
    // Coloured text lightens on a dark background for legibility (600 -> 400);
    // a solid button barely moves (600 -> 500), or it stops reading as the same
    // button. Folding the two together turned every primary button paler in
    // dark mode, which is what separated them.
    expect(SEMANTIC_TOKENS.danger.dark).toBe('red-400')
    expect(SEMANTIC_TOKENS['danger-solid'].dark).toBe('red-500')
    // …while the light value is the same colour, so a button and its label agree.
    expect(SEMANTIC_TOKENS.danger.light).toBe(SEMANTIC_TOKENS['danger-solid'].light)
  })

  it('drops a token the palette cannot back rather than emitting a dangling var', () => {
    const colors = semanticColors({ gray: { 600: '#4b5563' } })

    expect(colors['fg-muted']).toBe('var(--stx-fg-muted, #4b5563)')
    expect(colors.accent).toBeUndefined()
  })
})

describe('semanticTokenCSS', () => {
  it('declares every role for both modes', () => {
    const css = semanticTokenCSS(PALETTE)

    expect(css).toContain(':root {')
    expect(css).toContain('.dark {')
    expect(css).toContain('--stx-fg-muted: #4b5563;')
    // The dark block is what makes one class correct in both modes.
    expect(css.slice(css.indexOf('.dark {'))).toContain('--stx-fg-muted: #9ca3af;')
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
    const { config, tokenCSS } = mergeCrosswindConfig({ theme: { colors: PALETTE } }, {})

    expect(config.theme.colors['fg-muted']).toBe('var(--stx-fg-muted, #4b5563)')
    expect(tokenCSS).toContain('--stx-fg-muted')
  })

  it('leaves the existing palette untouched', () => {
    // Additive. If `gray-600` resolved through a variable instead, every opacity
    // modifier in every app would become `color-mix()` — a real change to the
    // emitted CSS that nobody asked for.
    const { config } = mergeCrosswindConfig({ theme: { colors: PALETTE } }, {})

    expect(config.theme.colors.gray['600']).toBe('#4b5563')
    expect(config.theme.colors.white).toBe('#fff')
  })

  it('lets a project redefine a role outright', () => {
    // Merged as BASE colours, so the user's own config still wins.
    const { config } = mergeCrosswindConfig(
      { theme: { colors: PALETTE } },
      { theme: { colors: { accent: '#e11d48' } } },
    )

    expect(config.theme.colors.accent).toBe('#e11d48')
    // …without disturbing the roles it did not name.
    expect(config.theme.colors['fg-muted']).toBe('var(--stx-fg-muted, #4b5563)')
  })

  it('survives a base config with no palette', () => {
    const { config, tokenCSS } = mergeCrosswindConfig({}, {})

    expect(tokenCSS).toBe('')
    expect(config.theme.colors).toEqual({})
  })
})
