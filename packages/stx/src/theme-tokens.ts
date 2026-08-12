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
 * Each token names a shade in crosswind's own palette rather than carrying a hex
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

  // Status and emphasis. Separate hues rather than one `primary`, because the
  // library uses indigo and blue for genuinely different things and collapsing
  // them would be a visible change rather than a rename.
  'accent': { light: 'indigo-600', dark: 'indigo-400', description: 'Primary action, selected state' },
  'info': { light: 'blue-600', dark: 'blue-400', description: 'Informational emphasis, links' },
  'danger': { light: 'red-600', dark: 'red-400', description: 'Errors, destructive actions' },
  'success': { light: 'green-600', dark: 'green-400', description: 'Confirmation' },
  'warning': { light: 'yellow-500', dark: 'yellow-400', description: 'Caution' },

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
  'accent-solid': { light: 'indigo-600', dark: 'indigo-500', description: 'Primary button fill' },
  'info-solid': { light: 'blue-600', dark: 'blue-500', description: 'Informational fill' },
  'danger-solid': { light: 'red-600', dark: 'red-500', description: 'Destructive button fill' },
  'success-solid': { light: 'green-600', dark: 'green-500', description: 'Confirmation fill' },
}

/** The CSS custom property that backs a role. */
export function tokenVariable(name: string): string {
  return `--stx-${name}`
}

type Palette = Record<string, unknown>

/**
 * Resolve a `family-shade` reference against a crosswind palette.
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
