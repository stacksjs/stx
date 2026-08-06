/**
 * One merge for the crosswind config, used by every render path.
 *
 * There were two, and they disagreed (stacksjs/stx#1867). The dev-server path
 * read only `theme.extend` and pinned the result after the user spread, so a
 * project writing `theme: { colors: { … } }` the Tailwind-classic way lost its
 * entire theme with no error and no warning. The serve path shallow-spread the
 * same key instead, so there the user's `colors` replaced the whole stock
 * palette — the opposite failure, from the same config file, decided by which
 * binary rendered the page. It also read only `safelist`, `shortcuts` and
 * `theme`, dropping `darkMode`, `preflights`, `cssVariables`, `rules`,
 * `blocklist` and `variants` entirely.
 *
 * ## Why theme keys merge instead of replacing
 *
 * Tailwind treats a non-`extend` `theme.colors` as a replacement for the
 * default palette. That semantic depends on generation being driven by
 * globbing source files: an unused default color costs bytes, so dropping the
 * stock palette is the point.
 *
 * Here it is driven by scanning the rendered page — a color nothing references
 * generates nothing, so carrying the base palette along is free. Replacement
 * would mean adding one token to `theme.colors` silently kills `bg-red-500`
 * everywhere, which is a far worse failure than an unused key costing nothing.
 * So base and user theme keys deep-merge, and `extend` is passed through
 * untouched for CSSGenerator to apply on top.
 *
 * @module crosswind-config
 */

type Dict = Record<string, any>

function isPlainObject(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Deep-merge `source` over `target`, recursing into plain objects only.
 *
 * Arrays replace rather than concatenate — a theme's `fontFamily: ['Inter',
 * 'sans-serif']` is a complete stack, not an addition to one.
 */
export function deepMergeThemes(target: Dict, source: Dict): Dict {
  const out: Dict = { ...target }
  for (const [key, value] of Object.entries(source)) {
    out[key] = isPlainObject(value) && isPlainObject(out[key])
      ? deepMergeThemes(out[key], value)
      : value
  }
  return out
}

export interface MergedCrosswindConfig {
  /** Ready to hand to `new CSSGenerator(...)`. */
  config: Dict
  /** Merged safelist, also needed by callers to pre-generate those classes. */
  safelist: string[]
  /** Merged shortcuts, needed by callers that emit grouped shortcut rules. */
  shortcuts: Record<string, string>
  /** Honours the user's `preflight` key (default true). */
  includePreflight: boolean
  /** Honours the user's `minify` key (default false). */
  minify: boolean
}

/**
 * Merge a project's crosswind config over the package defaults.
 *
 * `content` and `output` are stx-owned and pinned last: classes come from
 * scanning the rendered page, not from globbing, and the CSS is returned rather
 * than written to disk (#1822).
 */
export function mergeCrosswindConfig(base: Dict = {}, user: Dict = {}): MergedCrosswindConfig {
  const baseTheme: Dict = base.theme || {}
  const userTheme: Dict = user.theme || {}

  // `extend` is CSSGenerator's own concern — it deep-merges that on top of the
  // resolved theme. Everything else merges here.
  const { extend: userExtend, ...userThemeKeys } = userTheme
  const { extend: baseExtend, ...baseThemeKeys } = baseTheme

  const theme: Dict = deepMergeThemes(baseThemeKeys, userThemeKeys)
  const extend = deepMergeThemes(baseExtend || {}, userExtend || {})
  if (Object.keys(extend).length > 0)
    theme.extend = extend

  const safelist: string[] = [
    ...(base.safelist || []),
    ...(user.safelist || []),
  ]

  const shortcuts: Record<string, string> = {
    ...(base.shortcuts || {}),
    ...(user.shortcuts || {}),
  }

  // Additive by nature — silently dropping the built-in layer because a project
  // added one font-face rule loses the whole base (#1822).
  const preflights = [
    ...(base.preflights || []),
    ...(user.preflights || []),
  ]

  const config: Dict = {
    ...base,
    ...user,
    theme,
    safelist,
    shortcuts,
    ...(preflights.length > 0 ? { preflights } : {}),
    content: [],
    output: '',
  }

  return {
    config,
    safelist,
    shortcuts,
    includePreflight: user.preflight !== false,
    minify: user.minify === true,
  }
}
