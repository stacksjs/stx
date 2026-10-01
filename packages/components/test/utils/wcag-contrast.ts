/**
 * WCAG contrast over the SHIPPED palette, which is oklch rather than hex.
 *
 * Written because the role table had three inks nobody had measured. White on
 * `cyan-500` is 2.36:1 and on `green-500` 2.22:1 - below the 3:1 floor for text
 * at any size - so `info-ink` and `success-ink` named a colour that could not
 * be read on the fill they exist for, exactly the defect `warning-ink` already
 * carried a dark value to avoid (stacksjs/stx#1993).
 *
 * The existing a11y helper's `checkColorContrast` matches class-name patterns
 * and reports what is "potentially" low, which cannot catch this: every class
 * involved was a role name, and the problem was the value behind it.
 */
import { defaultConfig } from '@stacksjs/ts-css/engine'

const palette: Record<string, unknown> = (defaultConfig as any).theme.colors

/** `neutral-900`, `white` -> the palette's CSS colour string. */
export function shadeValue(ref: string): string | undefined {
  const i = ref.lastIndexOf('-')
  if (i === -1)
    return typeof palette[ref] === 'string' ? palette[ref] as string : undefined
  const family = palette[ref.slice(0, i)]
  return family && typeof family === 'object'
    ? (family as Record<string, string>)[ref.slice(i + 1)]
    : undefined
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

/** Relative luminance of a hex or `oklch(L% C H)` colour. */
export function luminance(css: string): number {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(css.trim())
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1]
    const n = Number.parseInt(digits.slice(0, 6), 16)
    return 0.2126 * toLinear((n >> 16 & 255) / 255)
    + 0.7152 * toLinear((n >> 8 & 255) / 255)
    + 0.0722 * toLinear((n & 255) / 255)
  }

  const m = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/.exec(css.trim())
  if (!m)
    throw new Error(`cannot parse colour: ${css}`)

  // Oklch -> Oklab -> LMS -> linear sRGB, with Ottosson's matrices.
  const lightness = Number(m[1]) / 100
  const chroma = Number(m[2])
  const hue = (Number(m[3]) * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)
  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3
  const clamp = (x: number) => Math.min(1, Math.max(0, x))
  const red = clamp(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short)
  const green = clamp(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short)
  const blue = clamp(-0.0041960863 * long - 0.7034186147 * medium + 1.7076147010 * short)

  // The matrices output linear sRGB already, so no second transfer function.
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** WCAG 2.1 contrast ratio between two palette references. */
export function contrastRatio(foreground: string, background: string): number {
  const f = shadeValue(foreground)
  const b = shadeValue(background)
  if (!f || !b)
    throw new Error(`palette cannot back ${!f ? foreground : background}`)

  const lf = luminance(f)
  const lb = luminance(b)
  return (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)
}
