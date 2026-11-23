/**
 * Native styles for single utilities, resolved by ts-css.
 *
 * The native compiler carried its own copy of the utility table, and the two
 * drifted: measured against ts-css on the same classes, native dropped the
 * line-height a `text-*` utility sets, resolved `leading-*` and `tracking-*`
 * against a fixed 16pt instead of the font size, and carried the Tailwind v3
 * palette where the web has v4 (red-500 was #ef4444 here and #fb2c36 there).
 * This asks ts-css instead, so a fix to the engine reaches both (stacksjs/ts-css#38).
 *
 * BUILD ONLY. It imports the ts-css engine, which is about 200 KB minified and
 * reads Node APIs, so it must never be reached from the device runtime:
 * `native-host.ts` resolves utilities from the table the build ships instead.
 *
 * It maps the declarations ts-css returns onto `STXStyle`, and takes a utility
 * only when it can map EVERY declaration. Anything else -- a shadow composed
 * from the engine's internal variables, a gradient, a transform, an `auto`
 * margin that native writes as `alignSelf` -- answers undefined, and the
 * caller keeps its own handling for it. So the line between the two is drawn
 * by CSS properties, not by guessing at class-name prefixes.
 */
import type { CSSGenerator } from '@stacksjs/ts-css/engine'
import type { LeafEntry, NativeLeaf } from './utilities-to-style'
import type { STXStyle } from './ir'
import { colorToCSS, colorToHex, CSSGenerator as Generator, defaultConfig, extractClasses, isInSrgbGamut, resolveColor, resolveLength, resolveUtility } from '@stacksjs/ts-css/engine'
import { applyLeafEntry, leafFromEntries } from './utilities-to-style'

type Mutable = Record<string, unknown>

const COLOR_PROPERTIES: Record<string, keyof STXStyle> = {
  'color': 'color',
  'background-color': 'backgroundColor',
  'border-color': 'borderColor',
  'border-top-color': 'borderTopColor',
  'border-right-color': 'borderRightColor',
  'border-bottom-color': 'borderBottomColor',
  'border-left-color': 'borderLeftColor',
}

const LENGTH_PROPERTIES: Record<string, keyof STXStyle> = {
  'padding': 'padding',
  'padding-top': 'paddingTop',
  'padding-right': 'paddingRight',
  'padding-bottom': 'paddingBottom',
  'padding-left': 'paddingLeft',
  'margin': 'margin',
  'margin-top': 'marginTop',
  'margin-right': 'marginRight',
  'margin-bottom': 'marginBottom',
  'margin-left': 'marginLeft',
  'gap': 'gap',
  'row-gap': 'rowGap',
  'column-gap': 'columnGap',
  'border-radius': 'borderRadius',
  'border-top-left-radius': 'borderTopLeftRadius',
  'border-top-right-radius': 'borderTopRightRadius',
  'border-bottom-left-radius': 'borderBottomLeftRadius',
  'border-bottom-right-radius': 'borderBottomRightRadius',
  'border-width': 'borderWidth',
  'border-top-width': 'borderTopWidth',
  'border-right-width': 'borderRightWidth',
  'border-bottom-width': 'borderBottomWidth',
  'border-left-width': 'borderLeftWidth',
}

/** Keyword properties whose CSS value is already the native one. */
const KEYWORD_PROPERTIES: Record<string, { key: keyof STXStyle, values: ReadonlySet<string>, rename?: Record<string, string> }> = {
  'font-style': { key: 'fontStyle', values: new Set(['normal', 'italic']) },
  'text-align': { key: 'textAlign', values: new Set(['left', 'center', 'right', 'justify', 'start', 'end']), rename: { start: 'left', end: 'right' } },
  'text-transform': { key: 'textTransform', values: new Set(['none', 'uppercase', 'lowercase', 'capitalize']) },
  'text-decoration-line': { key: 'textDecorationLine', values: new Set(['none', 'underline', 'line-through']) },
}

/**
 * `#rrggbb`, `#rrggbbaa` or `transparent`, as every native host reads colours,
 * and the Display P3 value too when sRGB clamps the colour: 82 of the 242
 * default palette colours. A host that draws P3 gets that instead.
 */
function nativeColor(value: string): { hex: string, p3?: string } | undefined {
  if (value.trim().toLowerCase() === 'transparent')
    return { hex: 'transparent' }
  const color = resolveColor(value, { space: 'srgb' })
  if (color === undefined)
    return undefined
  const hex = colorToHex(color)
  const wide = resolveColor(value, { space: 'display-p3' })
  return wide !== undefined && !isInSrgbGamut(wide) ? { hex, p3: colorToCSS(wide) } : { hex }
}

/** `font-weight: 700` is `bold` natively; every other weight stays numeric. */
function nativeWeight(value: string): string | undefined {
  if (!/^[1-9]00$/.test(value.trim()))
    return undefined
  return value.trim() === '700' ? 'bold' : value.trim()
}

/** Fold equal sides into the shorthand native layout reads. */
function foldSides(style: Mutable, base: 'padding' | 'margin'): void {
  const side = (name: string) => style[`${base}${name}`]
  const left = side('Left')
  const top = side('Top')
  if (left !== undefined && left === side('Right')) {
    style[`${base}Horizontal`] = left
    delete style[`${base}Left`]
    delete style[`${base}Right`]
  }
  if (top !== undefined && top === side('Bottom')) {
    style[`${base}Vertical`] = top
    delete style[`${base}Top`]
    delete style[`${base}Bottom`]
  }
}

const UNITLESS = /^-?(?:\d+\.?\d*|\.\d+)$/
const EM = /^(-?(?:\d+\.?\d*|\.\d+))em$/

/**
 * Map one utility's declarations onto a leaf entry, or undefined if any of
 * them has no mapping here.
 *
 * A unitless line-height and an em letter-spacing are relative to the font
 * size the text is drawn at, which only the whole class list decides, so they
 * are kept as multiples in `em` rather than resolved against a guess. That
 * guess was the bug: native used a fixed 16 for every size. A utility that sets
 * its own size (`text-sm/[1.5]`) is resolved against it here instead.
 */
export function leafEntryFromDeclarations(properties: Record<string, string>): LeafEntry | undefined {
  const style: Mutable = {}
  const em: NonNullable<LeafEntry['em']> = {}
  const p3: Record<string, string> = {}
  const declaredSize = properties['font-size']
  // A font-size in em is relative to the PARENT's size, which is unknown here.
  if (declaredSize !== undefined && EM.test(declaredSize.trim()))
    return undefined
  const ownSize = declaredSize === undefined ? undefined : resolveLength(declaredSize)

  for (const [property, value] of Object.entries(properties)) {
    const trimmed = value.trim()
    if (COLOR_PROPERTIES[property]) {
      const color = nativeColor(trimmed)
      if (color === undefined)
        return undefined
      style[COLOR_PROPERTIES[property]] = color.hex
      if (color.p3 !== undefined) p3[color.hex] = color.p3
      continue
    }
    if (LENGTH_PROPERTIES[property]) {
      // Only text metrics may be font-relative here.
      if (EM.test(trimmed))
        return undefined
      const length = resolveLength(trimmed)
      if (length === undefined)
        return undefined
      style[LENGTH_PROPERTIES[property]] = length
      continue
    }
    if (KEYWORD_PROPERTIES[property]) {
      const { key, values, rename } = KEYWORD_PROPERTIES[property]
      if (!values.has(trimmed))
        return undefined
      style[key] = rename?.[trimmed] ?? trimmed
      continue
    }
    switch (property) {
      case 'font-size':
        if (ownSize === undefined)
          return undefined
        style.fontSize = ownSize
        continue
      case 'line-height':
      case 'letter-spacing': {
        const key = property === 'line-height' ? 'lineHeight' : 'letterSpacing'
        // Unitless only means a multiple for line-height; for letter-spacing
        // a bare number other than zero is not a length.
        const multiple = (property === 'line-height' && UNITLESS.test(trimmed)) ? Number.parseFloat(trimmed) : EM.test(trimmed) ? Number.parseFloat(EM.exec(trimmed)![1]!) : undefined
        if (multiple !== undefined) {
          if (ownSize !== undefined) style[key] = multiple * ownSize
          else em[key] = multiple
          continue
        }
        const length = resolveLength(trimmed)
        if (length === undefined)
          return undefined
        style[key] = length
        continue
      }
      case 'font-weight': {
        const weight = nativeWeight(trimmed)
        if (weight === undefined)
          return undefined
        style.fontWeight = weight
        continue
      }
      case 'opacity': {
        const opacity = Number.parseFloat(trimmed)
        if (!Number.isFinite(opacity))
          return undefined
        style.opacity = trimmed.endsWith('%') ? opacity / 100 : opacity
        continue
      }
      default:
        return undefined
    }
  }

  foldSides(style, 'padding')
  foldSides(style, 'margin')
  const entry: LeafEntry = { style: style as STXStyle }
  if (Object.keys(em).length > 0) entry.em = em
  if (Object.keys(p3).length > 0) entry.p3 = p3
  return entry
}

/** The style one utility's declarations give at a font size, or undefined. */
export function nativeStyleFromDeclarations(properties: Record<string, string>, fontSize: number): STXStyle | undefined {
  const entry = leafEntryFromDeclarations(properties)
  return entry === undefined ? undefined : applyLeafEntry(entry, fontSize)
}

/**
 * Resolve a utility to its leaf entry through a ts-css generator built from
 * the app's own config, so the app's theme -- colours, spacing, fonts --
 * resolves exactly as the web build resolves it. Undefined when ts-css does
 * not know the utility, when it sets nothing (`group`), or when a declaration
 * has no mapping, leaving the native parsers to it.
 *
 * Only a plain utility is taken: the caller has already routed the variants
 * into layers.
 */
export function tsCssLeafEntries(generator: CSSGenerator): (utility: string) => LeafEntry | undefined {
  const memo = new Map<string, LeafEntry | undefined>()
  return (utility) => {
    if (memo.has(utility))
      return memo.get(utility)
    const rules = resolveUtility(utility, generator)
    let entry: LeafEntry | undefined
    const only = rules.length === 1 ? rules[0]! : undefined
    if (only && only.variants.length === 0 && only.mediaQuery === undefined && only.childSelector === undefined && Object.keys(only.properties).length > 0)
      entry = leafEntryFromDeclarations(only.properties)
    memo.set(utility, entry)
    return entry
  }
}

/** The build's leaf: ts-css, applied the same way a device applies its table. */
export function tsCssLeaf(generator: CSSGenerator): NativeLeaf {
  return leafFromEntries(tsCssLeafEntries(generator))
}

/**
 * The project's leaf entries: a generator built from its CSS config with the
 * same merge the web build uses (`mergeCssConfig`), so the app's theme
 * resolves natively exactly as it does on its pages. Built once per native build.
 */
export async function projectLeafEntries(root: string): Promise<(utility: string) => LeafEntry | undefined> {
  const { loadCssEngineConfig } = await import('../../dev-server/ts-css')
  const { mergeCssConfig } = await import('../../ts-css-config')
  const user = await loadCssEngineConfig(root)
  const merged = mergeCssConfig(defaultConfig as Record<string, any>, (user ?? {}) as Record<string, any>)
  return tsCssLeafEntries(new Generator(merged.config as never))
}

/**
 * The class names a bound `:class` expression can produce, read with the
 * engine's code-string extractor -- the same one the web build uses, so native
 * follows the web's rule that a class must appear whole in the source.
 * Fragments (`bg-` out of `'bg-' + tone`) are left out: they name nothing.
 */
export function boundClassNames(expression: string): string[] {
  return [...extractClasses(expression)].filter(name => !name.endsWith('-'))
}

/**
 * Whether a `:class` expression builds a class name out of pieces, which no
 * build can see and so no device can resolve: `'bg-' + tone`, `` `bg-${tone}-500` ``.
 * The web has the same limit; this is how the author finds out on native.
 */
export function buildsClassNames(expression: string): boolean {
  return [...extractClasses(expression)].some(name => name.endsWith('-'))
    || /['"`][^'"`]*[\w-]-['"`]\s*\+/.test(expression)
    || /[\w]-\$\{/.test(expression)
}
