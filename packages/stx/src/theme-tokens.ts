/**
 * Role-named colours, so a component can say what a colour is FOR.
 *
 * `@stacksjs/components` named palette shades directly — `bg-gray-100`,
 * `text-gray-600`, `ring-indigo-600` — with a `dark:` variant beside each. That
 * renders correctly and is impossible for a host app to redirect by meaning: you
 * can remap `gray`, but you cannot say "every border in the library comes from
 * `--stx-line`", because nothing distinguishes a gray that is a border from a
 * gray that is muted text (stacksjs/stx#1930).
 *
 * These tokens are added to the BASE theme rather than shipped as an opt-in
 * preset. That matters for one reason: a component that says `text-fg-muted`
 * must resolve in every app, or adopting the component library would silently
 * require a config change and render unstyled without it. Adding names is purely
 * additive — no existing utility changes, and no opacity modifier on an existing
 * palette colour turns into `color-mix()`.
 *
 * ## Where the values come from
 *
 * Each token names a shade in css's own palette rather than carrying a hex
 * value, and the light/dark pairs are the ones the component library already
 * used most — measured, not invented:
 *
 *     text-gray-900 dark:text-gray-100   ×70   ->  text-fg
 *     text-gray-500 dark:text-gray-400   ×24   ->  text-fg-soft
 *     border-gray-200 dark:border-gray-700 ×21 ->  border-line
 *
 * So migrating a component to a token is appearance-preserving wherever its
 * pairing was the dominant one, and the defaults stay in step with the palette
 * because they are resolved from it rather than copied.
 *
 * ## How dark mode works
 *
 * Each token resolves to `var(--stx-<name>, <light value>)`, and
 * {@link semanticTokenCSS} emits `:root` and `.dark` blocks that set the
 * variable. So `text-fg-muted` is one class that is correct in both modes, and
 * an app overrides a role by setting the variable — at runtime, with no rebuild.
 *
 * The fallback is deliberately the LIGHT value. If the variable block ever fails
 * to reach a page, light mode is still correct and dark mode falls back to the
 * light colour: degraded, but readable. The alternative — no fallback — would
 * render the token as an invalid colour and take the whole component's styling
 * with it.
 *
 * @module theme-tokens
 */

/** A role, and the palette shades that back it in each mode. */
export interface SemanticToken {
  /** Shade reference, e.g. `gray-900`. Resolved against the live palette. */
  light: string
  dark: string
  /** What the role means, for the generated docs and for anyone reading here. */
  description: string
}

/**
 * The role vocabulary.
 *
 * Five text roles rather than the usual three because the library genuinely
 * distinguishes five: 900, 700, 600, 500 and 400 all appear as body-ish text
 * with different dark partners. Collapsing them here would have been a redesign
 * rather than a migration.
 */
export const SEMANTIC_TOKENS: Record<string, SemanticToken> = {
  // Text
  'fg': { light: 'gray-900', dark: 'gray-100', description: 'Primary text' },
  'fg-strong': { light: 'gray-700', dark: 'gray-300', description: 'Labels, secondary headings' },
  'fg-muted': { light: 'gray-600', dark: 'gray-400', description: 'Supporting text' },
  'fg-soft': { light: 'gray-500', dark: 'gray-400', description: 'De-emphasised text' },
  'fg-subtle': { light: 'gray-400', dark: 'gray-500', description: 'Placeholders, disabled text' },

  // Surfaces
  'surface': { light: 'gray-50', dark: 'gray-800', description: 'Page and panel background' },
  'surface-raised': { light: 'gray-100', dark: 'gray-700', description: 'Cards, popovers' },
  'surface-sunken': { light: 'gray-200', dark: 'gray-700', description: 'Wells, track backgrounds' },

  // Edges — borders, rings and dividers share a role
  'line': { light: 'gray-200', dark: 'gray-700', description: 'Default border, divider' },
  'line-strong': { light: 'gray-300', dark: 'gray-600', description: 'Input border, focus ring track' },

  /*
   * Status and emphasis.
   *
   * `accent` was indigo and is now blue, because the library had two competing
   * accents - 73 blue uses against 34 indigo, both meaning "primary" - and a
   * role vocabulary cannot have two. Blue won on count, so the painted
   * majority (Button's primary, the inputs, the focus states) keeps its
   * appearance and the indigo minority moves (stacksjs/stx#1993).
   *
   * That leaves `accent` and `info` with the same DEFAULT, which is fine and
   * deliberate: they are different roles, so an app re-pointing --stx-accent
   * does not touch informational emphasis. They were separate before because
   * the hues differed; they are separate now because the meanings do.
   */
  'accent': { light: 'blue-600', dark: 'blue-400', description: 'Primary action, selected state' },
  'info': { light: 'blue-600', dark: 'blue-400', description: 'Informational emphasis, links' },
  'danger': { light: 'red-600', dark: 'red-400', description: 'Errors, destructive actions' },
  'success': { light: 'green-600', dark: 'green-400', description: 'Confirmation' },
  /*
   * 600, like the other four. It was yellow-500, which disagreed with every
   * component that paints caution TEXT (`text-yellow-600`) and with the four
   * sibling roles. Changed rather than worked around because nothing used it
   * yet - zero uses in the library at the time - so there was no appearance to
   * preserve.
   */
  'warning': { light: 'yellow-600', dark: 'yellow-400', description: 'Caution' },

  /*
   * The same hues as a SOLID FILL, which is a different role and needs a
   * different dark value.
   *
   * Coloured text on a dark background has to get lighter to stay legible —
   * 600 → 400 — while a solid button background barely moves, 600 → 500, or it
   * stops reading as the same button. Folding the two together turned every
   * primary button noticeably paler in dark mode, which is how this pair got
   * separated: the migration reported it as a "normalization" and it was a
   * regression.
   */
  /*
   * 500 light / 600 dark, which is what the components actually paint:
   * `bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700` is
   * Button's primary, repeated across the painted half of the library.
   *
   * These were 600 light / 500 dark, on the reasoning that a solid fill should
   * not get paler in dark mode. The components disagree - they go one step
   * DARKER - and there were 11 uses of the old spelling against 73 of the
   * pattern above, so the table follows the library rather than the other way
   * round. The 11 shift by one shade; the 73 are unchanged.
   */
  'accent-solid': { light: 'blue-500', dark: 'blue-600', description: 'Primary button fill' },
  'info-solid': { light: 'blue-500', dark: 'blue-600', description: 'Informational fill' },
  'danger-solid': { light: 'red-500', dark: 'red-600', description: 'Destructive button fill' },
  'success-solid': { light: 'green-500', dark: 'green-600', description: 'Confirmation fill' },
  'warning-solid': { light: 'yellow-500', dark: 'yellow-600', description: 'Caution fill' },

  /*
   * The hover state of a solid fill, one step further in the same direction.
   *
   * A role rather than a `hover:` on the base token, because an app that
   * re-points --stx-accent-solid has to be able to re-point what it becomes on
   * hover too - and `hover:bg-accent-solid` would just repaint it the same
   * colour.
   */
  'accent-solid-hover': { light: 'blue-600', dark: 'blue-700', description: 'Primary button fill, hovered' },
  'info-solid-hover': { light: 'blue-600', dark: 'blue-700', description: 'Informational fill, hovered' },
  'danger-solid-hover': { light: 'red-600', dark: 'red-700', description: 'Destructive fill, hovered' },
  'success-solid-hover': { light: 'green-600', dark: 'green-700', description: 'Confirmation fill, hovered' },
  'warning-solid-hover': { light: 'yellow-600', dark: 'yellow-700', description: 'Caution fill, hovered' },

  /*
   * The text ON a solid fill.
   *
   * Components wrote `text-white` next to every solid background, which is
   * correct for the stock hues and wrong the moment an app points a fill at a
   * light colour - white on a themed yellow or lime is unreadable, and the
   * caller has no way to say so. A paired ink role moves with the fill.
   *
   * `warning-ink` is dark for exactly that reason: white on yellow-500 is
   * around 1.9:1, which fails at any text size.
   */
  'accent-ink': { light: 'white', dark: 'white', description: 'Text on a primary fill' },
  'info-ink': { light: 'white', dark: 'white', description: 'Text on an informational fill' },
  'danger-ink': { light: 'white', dark: 'white', description: 'Text on a destructive fill' },
  'success-ink': { light: 'white', dark: 'white', description: 'Text on a confirmation fill' },
  'warning-ink': { light: 'gray-900', dark: 'gray-900', description: 'Text on a caution fill' },

  /*
   * A tinted fill and its text — a badge, a status chip, an inline callout.
   *
   * 100/800 in light and 900/200 in dark, which is the pattern Badge already
   * used for all seven of its variants and the only one in the library for
   * this shape. Two roles rather than one because the text has to move with
   * the tint: an app pointing --stx-accent-soft at something darker needs the
   * ink to follow or the chip becomes unreadable.
   */
  'accent-soft': { light: 'blue-100', dark: 'blue-900', description: 'Tinted primary fill' },
  'accent-soft-ink': { light: 'blue-800', dark: 'blue-200', description: 'Text on a tinted primary fill' },
  'info-soft': { light: 'blue-100', dark: 'blue-900', description: 'Tinted informational fill' },
  'info-soft-ink': { light: 'blue-800', dark: 'blue-200', description: 'Text on a tinted informational fill' },
  'danger-soft': { light: 'red-100', dark: 'red-900', description: 'Tinted destructive fill' },
  'danger-soft-ink': { light: 'red-800', dark: 'red-200', description: 'Text on a tinted destructive fill' },
  'success-soft': { light: 'green-100', dark: 'green-900', description: 'Tinted confirmation fill' },
  'success-soft-ink': { light: 'green-800', dark: 'green-200', description: 'Text on a tinted confirmation fill' },
  'warning-soft': { light: 'yellow-100', dark: 'yellow-900', description: 'Tinted caution fill' },
  'warning-soft-ink': { light: 'yellow-800', dark: 'yellow-200', description: 'Text on a tinted caution fill' },
}

/** The CSS custom property that backs a role. */
export function tokenVariable(name: string): string {
  return `--stx-${name}`
}

type Palette = Record<string, unknown>

/**
 * Resolve a `family-shade` reference against a css palette.
 *
 * Returns undefined rather than guessing when the family or shade is absent, so
 * a token backed by nothing is dropped instead of emitting `var(--stx-x, )`.
 */
function resolveShade(palette: Palette, reference: string): string | undefined {
  const split = reference.lastIndexOf('-')
  if (split === -1)
    return typeof palette[reference] === 'string' ? palette[reference] as string : undefined

  const family = palette[reference.slice(0, split)]
  if (!family || typeof family !== 'object')
    return undefined

  const value = (family as Record<string, unknown>)[reference.slice(split + 1)]
  return typeof value === 'string' ? value : undefined
}

/**
 * The palette entries to merge into `theme.colors`.
 *
 * Every entry is `var(--stx-<name>, <light value>)`, so the name works as an
 * ordinary utility (`bg-surface`, `text-fg-muted`, `ring-line-strong`) and an
 * app can move it by setting the variable.
 */
export function semanticColors(palette: Palette): Record<string, string> {
  const colors: Record<string, string> = {}

  for (const [name, token] of Object.entries(SEMANTIC_TOKENS)) {
    const light = resolveShade(palette, token.light)
    if (light === undefined)
      continue
    colors[name] = `var(${tokenVariable(name)}, ${light})`
  }

  return colors
}

/**
 * The `:root` / `.dark` block that gives each role its value per mode.
 *
 * Emitted ahead of the generated utilities so an app's own stylesheet — which
 * comes after — can override any of it without a specificity fight.
 *
 * `.dark` matches the class strategy the rest of stx uses (`dark:` variants
 * compile to `.dark .dark\:x`), so a token and a `dark:` utility on the same
 * page agree about what dark mode is.
 */
export function semanticTokenCSS(palette: Palette): string {
  const light: string[] = []
  const dark: string[] = []

  for (const [name, token] of Object.entries(SEMANTIC_TOKENS)) {
    const lightValue = resolveShade(palette, token.light)
    const darkValue = resolveShade(palette, token.dark)
    if (lightValue === undefined)
      continue
    light.push(`  ${tokenVariable(name)}: ${lightValue};`)
    if (darkValue !== undefined)
      dark.push(`  ${tokenVariable(name)}: ${darkValue};`)
  }

  if (light.length === 0)
    return ''

  return [
    '/* stx role tokens — override any of these to re-theme by meaning. */',
    ':root {',
    ...light,
    '}',
    '.dark {',
    ...dark,
    '}',
    '',
  ].join('\n')
}

/** Every variable a role token reads, for documentation and tooling. */
export function semanticTokenNames(): string[] {
  return Object.keys(SEMANTIC_TOKENS).map(tokenVariable)
}
