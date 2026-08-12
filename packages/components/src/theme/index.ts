/**
 * A seam for an app's own theme (stacksjs/stx#1930).
 *
 * 62 of the 91 components name Tailwind palette shades directly —
 * `bg-gray-100`, `text-gray-600`, `ring-indigo-600`. Dark mode is handled, via
 * the `dark:` variant. What was not handled is an app with its own palette: it
 * installs `<Button>` and gets `bg-gray-100`, which matches nothing around it.
 *
 * ## What already works, without this module
 *
 * A project's `crosswind.config.ts` `theme.colors` **deep-merges** over the base
 * palette, and stx generates CSS by scanning the rendered page — so redefining
 * a shade re-themes every component that names it, with no component edits:
 *
 * ```ts
 * // crosswind.config.ts
 * export default { theme: { colors: { gray: { 600: '#3f3f46' } } } }
 * ```
 *
 * Shades you do not name keep their defaults. That is a build-time seam and it
 * is the right one for a fixed brand palette.
 *
 * ## What this module adds
 *
 * A **runtime** seam, and **semantic** names.
 *
 * `stxThemePreset()` returns a `theme.colors` fragment in which every neutral
 * shade resolves through a CSS custom property with today's value as the
 * fallback, plus role-named tokens (`surface`, `fg-muted`, `line`, `accent`, …)
 * on top. Spread it into your crosswind config and nothing changes visually;
 * set a variable and every component follows, without a rebuild:
 *
 * ```ts
 * // crosswind.config.ts
 * import { stxThemePreset } from '@stacksjs/components/theme'
 * export default { theme: { colors: stxThemePreset() } }
 * ```
 *
 * ```css
 * :root      { --stx-color-gray-600: #52525b; --stx-surface: #fbfbfd; }
 * .dark      { --stx-color-gray-600: #a1a1aa; --stx-surface: #18181b; }
 * [data-tenant="acme"] { --stx-accent: #e11d48; }
 * ```
 *
 * The fallbacks are read from crosswind's own default palette rather than
 * copied, so this cannot drift from the values the components are drawn
 * against — a hand-copied table is the failure mode this whole file exists to
 * remove, and duplicating it here would reintroduce it one level up.
 *
 * ## The trade this makes
 *
 * An opacity modifier on a variable-backed colour compiles to `color-mix()`
 * rather than a baked `oklch(… / 0.5)`, because the value is not known at build
 * time. That is why this is opt-in and not the framework default: it is a real
 * change to the generated CSS, and it is the app's call to make.
 *
 * @module theme
 */

/** A crosswind palette entry: one colour, or a map of shades. */
export type PaletteValue = string | Record<string, string>
export type Palette = Record<string, PaletteValue>

/**
 * Colour families the components actually draw with.
 *
 * Deliberately not "every family in the palette". A variable per shade of every
 * colour would be several hundred declarations an app has no use for, and the
 * point is a list someone can read. `red`, `green` and `yellow` are here
 * because they carry the status roles below.
 */
export const THEMED_FAMILIES = ['gray', 'neutral', 'slate', 'zinc', 'red', 'green', 'yellow', 'blue', 'indigo'] as const

/** Prefix for the per-shade variables, e.g. `--stx-color-gray-600`. */
export const SHADE_VAR_PREFIX = '--stx-color'

/**
 * Role-named tokens, and the shade each one falls back to.
 *
 * These are the seam an app should prefer: `--stx-surface` says what the colour
 * is FOR, where `--stx-color-gray-50` only says what it is. The fallback chain
 * means an app that sets neither still gets today's appearance, one that sets
 * only the palette gets a consistent shift, and one that sets the role token
 * gets exactly what it asked for.
 *
 * Light-mode values only. Dark mode is the app's to declare (`.dark { … }`),
 * because the components' own `dark:` variants already cover the default look
 * and a second opinion baked in here would fight them.
 */
export const SEMANTIC_TOKENS: Record<string, { family: string, shade: string }> = {
  'surface': { family: 'gray', shade: '50' },
  'surface-raised': { family: 'gray', shade: '100' },
  'surface-sunken': { family: 'gray', shade: '200' },
  'fg': { family: 'gray', shade: '900' },
  'fg-muted': { family: 'gray', shade: '600' },
  'fg-subtle': { family: 'gray', shade: '400' },
  'line': { family: 'gray', shade: '200' },
  'line-strong': { family: 'gray', shade: '300' },
  'accent': { family: 'indigo', shade: '600' },
  'accent-hover': { family: 'indigo', shade: '500' },
  'danger': { family: 'red', shade: '600' },
  'success': { family: 'green', shade: '600' },
  'warning': { family: 'yellow', shade: '500' },
}

/** `var(--name, fallback)`, or `var(--name)` when there is nothing to fall back to. */
function cssVar(name: string, fallback?: string): string {
  return fallback === undefined ? `var(${name})` : `var(${name}, ${fallback})`
}

/**
 * Build the palette fragment.
 *
 * @param defaults - Crosswind's default `theme.colors`. Pass the one your
 * project resolves; omitted, the returned entries carry no fallback, which is
 * only useful if you intend to define every variable yourself.
 */
export function stxThemePreset(defaults: Palette = {}): Palette {
  const palette: Palette = {}

  for (const family of THEMED_FAMILIES) {
    const shades = defaults[family]
    if (!shades || typeof shades === 'string')
      continue

    const themed: Record<string, string> = {}
    for (const [shade, value] of Object.entries(shades))
      themed[shade] = cssVar(`${SHADE_VAR_PREFIX}-${family}-${shade}`, value)

    palette[family] = themed
  }

  for (const [token, { family, shade }] of Object.entries(SEMANTIC_TOKENS)) {
    const shades = defaults[family]
    const base = shades && typeof shades !== 'string' ? shades[shade] : undefined
    // Two levels: the role token, falling back to the shade variable, falling
    // back to the stock value. Setting the palette alone still moves the roles.
    palette[token] = cssVar(`--stx-${token}`, cssVar(`${SHADE_VAR_PREFIX}-${family}-${shade}`, base))
  }

  return palette
}

/**
 * Every variable the preset reads, in declaration order.
 *
 * The issue asked for "a documented list of the variables each family reads",
 * and a list generated from the same source as the palette cannot disagree with
 * it. Useful for emitting a starter stylesheet or documenting the surface.
 */
export function themeVariableNames(defaults: Palette = {}): string[] {
  const names: string[] = []

  for (const family of THEMED_FAMILIES) {
    const shades = defaults[family]
    if (!shades || typeof shades === 'string')
      continue
    for (const shade of Object.keys(shades))
      names.push(`${SHADE_VAR_PREFIX}-${family}-${shade}`)
  }

  for (const token of Object.keys(SEMANTIC_TOKENS))
    names.push(`--stx-${token}`)

  return names
}
