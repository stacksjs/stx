/**
 * Every colour the native compiler emits is one a native host can draw.
 *
 * Both hosts parse `#rgb[a]`, `#rrggbb[aa]`, `rgb()`/`rgba()` and
 * `transparent`, and nothing else -- and they do not reject the rest. iOS hands
 * an unknown form to a hex parser that reads from the first character, so
 * `oklch(...)`, `var(...)` or `color(display-p3 ...)` draws a near-black blue;
 * Android throws inside a handler that swallows it and keeps the host default.
 * Nothing fails, so this sweep is what keeps it from happening silently.
 *
 * Until now the native parsers passed an arbitrary colour straight through,
 * so `bg-[oklch(...)]`, `bg-[var(--x)]`, `bg-[hsl(...)]` and `text-current` all
 * reached the device in a form it could not draw.
 */
import { describe, expect, it } from 'bun:test'
import { CSSGenerator, defaultConfig } from '@stacksjs/ts-css/engine'
import type { STXStyle } from '../../src/native/compiler/ir'
import { compileClassStyles, compileHeadwindToStyle, isNativeColor, withNativeLeaf } from '../../src/native/compiler/utilities-to-style'
import { tsCssLeaf, tsCssLeafEntries } from '../../src/native/compiler/ts-css-leaf'

const COLOR_KEYS = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'textDecorationColor', 'shadowColor', 'tintColor', 'fill', 'stroke', 'gradientFrom', 'gradientVia', 'gradientTo']

const generator = new CSSGenerator(defaultConfig as never)
const leaf = tsCssLeaf(generator)

const FAMILIES = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const PREFIXES = ['bg', 'text', 'border', 'border-t', 'decoration', 'fill', 'stroke', 'from', 'via', 'to']

/** The palette under every colour utility, with and without opacity. */
const PALETTE = FAMILIES.flatMap(family => SHADES.flatMap(shade => PREFIXES.flatMap(prefix => [`${prefix}-${family}-${shade}`, `${prefix}-${family}-${shade}/50`])))

/** Forms no host can draw, which must be reported rather than emitted. */
const UNDRAWABLE = ['bg-[oklch(60%_0.1_200)]', 'bg-[var(--x)]', 'bg-[hsl(200_50%_50%)]', 'text-[color(display-p3_1_0_0)]', 'text-current', 'bg-[rgb(1_2_3)]']

function colorsIn(style: STXStyle | undefined): [string, unknown][] {
  if (!style) return []
  return COLOR_KEYS.map(key => [key, (style as Record<string, unknown>)[key]] as [string, unknown]).filter(([, value]) => value !== undefined)
}

function undrawable(styles: Iterable<[string, STXStyle | undefined]>): string[] {
  const bad: string[] = []
  for (const [name, style] of styles) {
    for (const [key, value] of colorsIn(style))
      if (!isNativeColor(value)) bad.push(`${name} -> ${key}: ${JSON.stringify(value)}`)
  }
  return bad
}

describe('native colours', () => {
  it('should sweep the whole palette through the build\'s leaf', () => {
    const entries = tsCssLeafEntries(generator)
    expect(undrawable(PALETTE.map(name => [name, entries(name)?.style]))).toEqual([])
  })

  it('should sweep the whole palette through the build', async () => {
    await withNativeLeaf(leaf, async () => {
      expect(undrawable(PALETTE.map(name => [name, compileHeadwindToStyle(name)]))).toEqual([])
    })
  })

  /** What the device compiles with no leaf: its own parsers. */
  it('should sweep the whole palette through the device\'s parsers', () => {
    expect(undrawable(PALETTE.map(name => [name, compileHeadwindToStyle(name)]))).toEqual([])
  })

  const reportsEach = (names: string[]) => {
    for (const name of names) {
      const unknown: string[] = []
      const style = compileHeadwindToStyle(name, unknown)
      expect(colorsIn(style)).toEqual([])
      expect(unknown).toEqual([name])
    }
  }

  /** The device's parsers have no engine to convert with, so these are reported. */
  it('should report an undrawable colour on the device instead of emitting it', () => {
    reportsEach(UNDRAWABLE)
  })

  /**
   * At build time an oklch or rgb() arbitrary value is not lost: ts-css reads
   * it (an underscore is a space there, so `rgb(1_2_3)` is `rgb(1 2 3)`) and
   * the leaf converts it to sRGB hex. What neither can resolve is still reported.
   */
  it('should convert an oklch or rgb() arbitrary colour at build time, and report the rest', async () => {
    await withNativeLeaf(leaf, async () => {
      expect(compileHeadwindToStyle('bg-[oklch(60%_0.1_200)]')).toEqual({ backgroundColor: '#0d9298' })
      expect(compileHeadwindToStyle('bg-[rgb(1_2_3)]')).toEqual({ backgroundColor: '#010203' })
      reportsEach(UNDRAWABLE.filter(name => !name.startsWith('bg-[oklch') && !name.startsWith('bg-[rgb')))
    })
  })

  /** The rest of the list is unaffected: the earlier class keeps its colour. */
  it('should keep what an earlier class set when a later one is undrawable', () => {
    const unknown: string[] = []
    const style = compileHeadwindToStyle('bg-red-500 bg-[oklch(60%_0.1_200)]', unknown)
    expect(style.backgroundColor).toBe('#ef4444')
    expect(unknown).toEqual(['bg-[oklch(60%_0.1_200)]'])
  })

  /** And through every layer a class list compiles to. */
  it('should keep dark, focus and pointer layers drawable', async () => {
    await withNativeLeaf(leaf, async () => {
      const compiled = compileClassStyles('bg-white dark:bg-slate-900 focus:border-blue-500 hover:bg-gray-100 text-[var(--x)]', undefined, { focus: true, pointer: true })
      const layers: [string, STXStyle | undefined][] = [
        ['style', compiled.style],
        ['dark', compiled.dark],
        ['focus', compiled.focus?.style],
        ['hover', compiled.pointer?.hover?.style],
      ]
      expect(undrawable(layers)).toEqual([])
      expect(compiled.unknown).toContain('text-[var(--x)]')
    })
  })

  it('should agree on what is drawable', () => {
    for (const ok of ['#fff', '#ffffff80', 'rgb(1, 2, 3)', 'rgb(1 2 3 / 50%)', 'rgba(1,2,3,0.5)', 'transparent'])
      expect(isNativeColor(ok)).toBe(true)
    for (const no of ['oklch(60% 0.1 200)', 'var(--x)', 'hsl(1 2% 3%)', 'color(display-p3 1 0 0)', 'currentColor', 'rgb(1_2_3)', 'red', '#ggg', '#fffff'])
      expect(isNativeColor(no)).toBe(false)
  })
})
