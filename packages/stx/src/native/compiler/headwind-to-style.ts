/* eslint-disable style/max-statements-per-line */
/**
 * Headwind to Native Style Compiler
 *
 * Converts Headwind/Tailwind utility classes to native style objects
 * that can be consumed by iOS (UIKit), Android, and web renderers.
 */

import type { STXStyle } from './ir'

// ============================================================================
// Color Palette (Tailwind v3 colors)
// ============================================================================

const colors: Record<string, Record<string, string> | string> = {
  transparent: 'transparent',
  current: 'currentColor',
  black: '#000000',
  white: '#ffffff',

  slate: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a', 950: '#020617',
  },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827', 950: '#030712',
  },
  zinc: {
    50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8',
    400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46',
    800: '#27272a', 900: '#18181b', 950: '#09090b',
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
    800: '#9a3412', 900: '#7c2d12', 950: '#431407',
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03',
  },
  yellow: {
    50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
    400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
    800: '#854d0e', 900: '#713f12', 950: '#422006',
  },
  green: {
    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
    400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
    800: '#166534', 900: '#14532d', 950: '#052e16',
  },
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
    800: '#065f46', 900: '#064e3b', 950: '#022c22',
  },
  teal: {
    50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
    400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
    800: '#115e59', 900: '#134e4a', 950: '#042f2e',
  },
  cyan: {
    50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9',
    400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490',
    800: '#155e75', 900: '#164e63', 950: '#083344',
  },
  sky: {
    50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
    400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
    800: '#075985', 900: '#0c4a6e', 950: '#082f49',
  },
  lime: {
    50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264',
    400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 700: '#4d7c0f',
    800: '#3f6212', 900: '#365314', 950: '#1a2e05',
  },
  fuchsia: {
    50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc',
    400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf',
    800: '#86198f', 900: '#701a75', 950: '#4a044e',
  },
  neutral: {
    50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
    400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
    800: '#262626', 900: '#171717', 950: '#0a0a0a',
  },
  stone: {
    50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
    400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
    800: '#292524', 900: '#1c1917', 950: '#0c0a09',
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
  },
  violet: {
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
    400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
    800: '#6b21a8', 900: '#581c87', 950: '#3b0764',
  },
  pink: {
    50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
    400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
    800: '#9d174d', 900: '#831843', 950: '#500724',
  },
  rose: {
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
    400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
    800: '#9f1239', 900: '#881337', 950: '#4c0519',
  },
}

// ============================================================================
// Spacing Scale
// ============================================================================

const spacing: Record<string, number> = {
  px: 1,
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
}

// ============================================================================
// Font Sizes
// ============================================================================

const fontSizes: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
}

// ============================================================================
// Border Radius
// ============================================================================

const borderRadius: Record<string, number> = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
}

// ============================================================================
// Helper Functions
// ============================================================================

function resolveColor(colorClass: string): string | undefined {
  // An opacity modifier: `emerald-500/10`, `[#0f172a]/80`. The renderers read
  // `#rrggbbaa`, so the alpha becomes the last two hex digits.
  const slash = colorClass.lastIndexOf('/')
  if (slash > 0 && !colorClass.endsWith(']')) {
    const base = resolveColor(colorClass.slice(0, slash))
    const amount = colorClass.slice(slash + 1)
    const alpha = /^\[(.+)\]$/.test(amount) ? Number.parseFloat(amount.slice(1, -1)) * (amount.includes('%') ? 1 : 100) : Number.parseFloat(amount)
    if (!base || !Number.isFinite(alpha)) return undefined
    return withAlpha(base, alpha / 100)
  }

  // Handle special cases
  if (colorClass === 'transparent') return 'transparent'
  if (colorClass === 'current') return 'currentColor'
  if (colorClass === 'black') return '#000000'
  if (colorClass === 'white') return '#ffffff'

  // Handle palette colors (e.g., "blue-500", "gray-900")
  const parts = colorClass.split('-')
  if (parts.length === 2) {
    const [colorName, shade] = parts
    const palette = colors[colorName]
    if (palette && typeof palette === 'object') {
      return palette[shade]
    }
  }

  // Handle hex colors (e.g., "[#ff0000]")
  if (colorClass.startsWith('[') && colorClass.endsWith(']')) {
    const inner = colorClass.slice(1, -1)
    // Only if it is shaped like a color. An arbitrary LENGTH reaching here is
    // how `text-[11px]` used to compile to `color: "11px"` -- an invalid color
    // that also lost the font size it was asking for.
    return /^(#|rgba?\(|hsla?\(|[a-z]+$)/i.test(inner) ? inner : undefined
  }

  return undefined
}

/** `#rgb`/`#rrggbb` (or a palette name already resolved to one) with an alpha. */
function withAlpha(color: string, alpha: number): string | undefined {
  if (color === 'transparent') return color
  let hex = color.startsWith('#') ? color.slice(1) : ''
  if (hex.length === 3) hex = hex.split('').map(digit => digit + digit).join('')
  if (hex.length === 8) hex = hex.slice(0, 6)
  if (hex.length !== 6) return undefined
  const byte = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
  return `#${hex}${byte.toString(16).padStart(2, '0')}`
}

/** `[12px]`, `[0.5rem]`, `[-0.02em]` (an em is relative to `fontSize`, default 16). */
function arbitraryLength(value: string, emBase = 16): number | undefined {
  if (!value.startsWith('[') || !value.endsWith(']')) return undefined
  const inner = value.slice(1, -1)
  const number = Number.parseFloat(inner)
  if (!Number.isFinite(number)) return undefined
  if (inner.endsWith('rem')) return number * 16
  if (inner.endsWith('em')) return number * emBase
  return number
}

function resolveSpacing(value: string): number | undefined {
  // Handle arbitrary values (e.g., "[20px]", "[1.5rem]")
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1)
    const length = inner.endsWith('rem')
      ? Number.parseFloat(inner) * 16
      : Number.parseFloat(inner)
    // `h-[calc(100%-2rem)]` parsed to NaN and was assigned anyway, so the IR
    // carried `"height": null`. A value this function cannot read is a value
    // it does not have.
    return Number.isFinite(length) ? length : undefined
  }

  return spacing[value]
}

// ============================================================================
// Class Parsers
// ============================================================================

// eslint-disable-next-line pickier/no-unused-vars
type ClassParser = (value: string, style: STXStyle) => boolean

const classParsers: Record<string, ClassParser> = {
  // Display
  flex: (_, style) => { style.display = 'flex'; return true },
  hidden: (_, style) => { style.display = 'none'; return true },
  // Craft's native stack lays out an equal-column grid (`gridColumns`).
  grid: (_, style) => { style.display = 'grid'; return true },

  // Flex direction
  'flex-row': (_, style) => { style.flexDirection = 'row'; return true },
  'flex-col': (_, style) => { style.flexDirection = 'column'; return true },
  'flex-row-reverse': (_, style) => { style.flexDirection = 'row-reverse'; return true },
  'flex-col-reverse': (_, style) => { style.flexDirection = 'column-reverse'; return true },

  // Flex wrap
  'flex-wrap': (_, style) => { style.flexWrap = 'wrap'; return true },
  'flex-nowrap': (_, style) => { style.flexWrap = 'nowrap'; return true },
  'flex-wrap-reverse': (_, style) => { style.flexWrap = 'wrap-reverse'; return true },

  // Flex grow/shrink
  // The web's `flex: 1 1 0%`: grow, shrink and start from nothing, so siblings
  // share a row instead of the widest one pushing the rest off screen.
  'flex-1': (_, style) => { style.flex = 1; style.flexGrow = 1; style.flexShrink = 1; style.flexBasis = 0; return true },
  'flex-auto': (_, style) => { style.flexGrow = 1; style.flexShrink = 1; return true },
  'flex-initial': (_, style) => { style.flexGrow = 0; style.flexShrink = 1; return true },
  'flex-none': (_, style) => { style.flexGrow = 0; style.flexShrink = 0; return true },
  'grow': (_, style) => { style.flexGrow = 1; return true },
  'grow-0': (_, style) => { style.flexGrow = 0; return true },
  'shrink': (_, style) => { style.flexShrink = 1; return true },
  'shrink-0': (_, style) => { style.flexShrink = 0; return true },

  // Justify content
  'justify-start': (_, style) => { style.justifyContent = 'flex-start'; return true },
  'justify-center': (_, style) => { style.justifyContent = 'center'; return true },
  'justify-end': (_, style) => { style.justifyContent = 'flex-end'; return true },
  'justify-between': (_, style) => { style.justifyContent = 'space-between'; return true },
  'justify-around': (_, style) => { style.justifyContent = 'space-around'; return true },
  'justify-evenly': (_, style) => { style.justifyContent = 'space-evenly'; return true },

  // Align items
  'items-start': (_, style) => { style.alignItems = 'flex-start'; return true },
  'items-center': (_, style) => { style.alignItems = 'center'; return true },
  'items-end': (_, style) => { style.alignItems = 'flex-end'; return true },
  'items-stretch': (_, style) => { style.alignItems = 'stretch'; return true },
  'items-baseline': (_, style) => { style.alignItems = 'baseline'; return true },

  // Align self
  'self-auto': (_, style) => { style.alignSelf = 'auto'; return true },
  'self-start': (_, style) => { style.alignSelf = 'flex-start'; return true },
  'self-center': (_, style) => { style.alignSelf = 'center'; return true },
  'self-end': (_, style) => { style.alignSelf = 'flex-end'; return true },
  'self-stretch': (_, style) => { style.alignSelf = 'stretch'; return true },
  'self-baseline': (_, style) => { style.alignSelf = 'baseline'; return true },
  'min-w-0': (_, style) => { style.minWidth = 0; return true },
  'aspect-square': (_, style) => { style.aspectRatio = 1; return true },
  'inset-0': (_, style) => { style.top = 0; style.right = 0; style.bottom = 0; style.left = 0; return true },
  'tracking-tighter': (_, style) => { style.letterSpacing = -0.8; return true },
  'tracking-tight': (_, style) => { style.letterSpacing = -0.4; return true },
  'tracking-normal': (_, style) => { style.letterSpacing = 0; return true },
  'tracking-wide': (_, style) => { style.letterSpacing = 0.4; return true },
  'tracking-wider': (_, style) => { style.letterSpacing = 0.8; return true },
  'tracking-widest': (_, style) => { style.letterSpacing = 1.6; return true },
  // Web-only concerns with no native meaning, accepted so they are not
  // reported as unknown: tabular figures, the block display, pointer cues.
  'tabular-nums': () => true,
  'block': () => true,
  'inline-flex': (_, style) => { style.display = 'flex'; return true },
  'truncate': () => true,

  // Position
  relative: (_, style) => { style.position = 'relative'; return true },
  absolute: (_, style) => { style.position = 'absolute'; return true },

  // Overflow
  'overflow-visible': (_, style) => { style.overflow = 'visible'; return true },
  'overflow-hidden': (_, style) => { style.overflow = 'hidden'; return true },
  'overflow-scroll': (_, style) => { style.overflow = 'scroll'; return true },

  // Font weight
  'font-thin': (_, style) => { style.fontWeight = '100'; return true },
  'font-extralight': (_, style) => { style.fontWeight = '200'; return true },
  'font-light': (_, style) => { style.fontWeight = '300'; return true },
  'font-normal': (_, style) => { style.fontWeight = '400'; return true },
  'font-medium': (_, style) => { style.fontWeight = '500'; return true },
  'font-semibold': (_, style) => { style.fontWeight = '600'; return true },
  'font-bold': (_, style) => { style.fontWeight = 'bold'; return true },
  'font-extrabold': (_, style) => { style.fontWeight = '800'; return true },
  'font-black': (_, style) => { style.fontWeight = '900'; return true },

  // Font style
  italic: (_, style) => { style.fontStyle = 'italic'; return true },
  'not-italic': (_, style) => { style.fontStyle = 'normal'; return true },

  // Text align
  'text-left': (_, style) => { style.textAlign = 'left'; return true },
  'text-center': (_, style) => { style.textAlign = 'center'; return true },
  'text-right': (_, style) => { style.textAlign = 'right'; return true },
  'text-justify': (_, style) => { style.textAlign = 'justify'; return true },

  // Text transform
  uppercase: (_, style) => { style.textTransform = 'uppercase'; return true },
  lowercase: (_, style) => { style.textTransform = 'lowercase'; return true },
  capitalize: (_, style) => { style.textTransform = 'capitalize'; return true },
  'normal-case': (_, style) => { style.textTransform = 'none'; return true },

  // Text decoration
  underline: (_, style) => { style.textDecorationLine = 'underline'; return true },
  'line-through': (_, style) => { style.textDecorationLine = 'line-through'; return true },
  'no-underline': (_, style) => { style.textDecorationLine = 'none'; return true },
}

// ============================================================================
// Pattern-Based Parsers
// ============================================================================

function parseBackgroundColor(className: string, style: STXStyle): boolean {
  if (!className.startsWith('bg-')) return false
  const colorClass = className.slice(3)
  const color = resolveColor(colorClass)
  if (color) {
    style.backgroundColor = color
    return true
  }
  return false
}

function parseTextColor(className: string, style: STXStyle): boolean {
  if (!className.startsWith('text-')) return false
  const value = className.slice(5)

  // Check if it's a font size
  if (fontSizes[value]) {
    style.fontSize = fontSizes[value]
    return true
  }

  // An arbitrary length is a font size, not a color: `text-[11px]`.
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1)
    if (/^-?[\d.]+(?:px|r?em)?$/.test(inner)) {
      const size = inner.endsWith('rem') || inner.endsWith('em')
        ? Number.parseFloat(inner) * 16
        : Number.parseFloat(inner)
      if (Number.isFinite(size)) {
        style.fontSize = size
        return true
      }
    }
  }

  // Otherwise it's a color
  const color = resolveColor(value)
  if (color) {
    style.color = color
    return true
  }
  return false
}

function parsePadding(className: string, style: STXStyle): boolean {
  // p-{size}
  if (className.startsWith('p-')) {
    const size = resolveSpacing(className.slice(2))
    if (size !== undefined) {
      style.padding = size
      return true
    }
  }
  // px-{size}
  if (className.startsWith('px-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.paddingHorizontal = size
      return true
    }
  }
  // py-{size}
  if (className.startsWith('py-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.paddingVertical = size
      return true
    }
  }
  // pt-{size}
  if (className.startsWith('pt-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.paddingTop = size
      return true
    }
  }
  // pr-{size}
  if (className.startsWith('pr-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.paddingRight = size
      return true
    }
  }
  // pb-{size}
  if (className.startsWith('pb-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.paddingBottom = size
      return true
    }
  }
  // pl-{size}
  if (className.startsWith('pl-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.paddingLeft = size
      return true
    }
  }
  return false
}

function parseMargin(className: string, style: STXStyle): boolean {
  // m-{size}
  if (className.startsWith('m-')) {
    const size = resolveSpacing(className.slice(2))
    if (size !== undefined) {
      style.margin = size
      return true
    }
  }
  // mx-{size}
  if (className.startsWith('mx-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.marginHorizontal = size
      return true
    }
  }
  // my-{size}
  if (className.startsWith('my-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.marginVertical = size
      return true
    }
  }
  // mt-{size}
  if (className.startsWith('mt-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.marginTop = size
      return true
    }
  }
  // mr-{size}
  if (className.startsWith('mr-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.marginRight = size
      return true
    }
  }
  // mb-{size}
  if (className.startsWith('mb-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.marginBottom = size
      return true
    }
  }
  // ml-{size}
  if (className.startsWith('ml-')) {
    const size = resolveSpacing(className.slice(3))
    if (size !== undefined) {
      style.marginLeft = size
      return true
    }
  }
  return false
}

function parseWidth(className: string, style: STXStyle): boolean {
  if (!className.startsWith('w-')) return false
  const value = className.slice(2)

  if (value === 'full') {
    style.width = '100%'
    return true
  }
  if (value === 'screen') {
    style.width = '100%' // Use 100% for native
    return true
  }
  if (value === 'auto') {
    style.width = 'auto'
    return true
  }

  // Fractional widths
  if (value.includes('/')) {
    const [num, denom] = value.split('/')
    const percent = (Number.parseInt(num) / Number.parseInt(denom)) * 100
    style.width = `${percent}%`
    return true
  }

  const size = resolveSpacing(value)
  if (size !== undefined) {
    style.width = size
    return true
  }

  return false
}

function parseHeight(className: string, style: STXStyle): boolean {
  if (!className.startsWith('h-')) return false
  const value = className.slice(2)

  if (value === 'full') {
    style.height = '100%'
    return true
  }
  if (value === 'screen') {
    style.height = '100%'
    return true
  }
  if (value === 'auto') {
    style.height = 'auto'
    return true
  }

  const size = resolveSpacing(value)
  if (size !== undefined) {
    style.height = size
    return true
  }

  return false
}

function parseBorderRadius(className: string, style: STXStyle): boolean {
  if (!className.startsWith('rounded')) return false

  if (className === 'rounded') {
    style.borderRadius = borderRadius.DEFAULT
    return true
  }

  const value = className.slice(8) // Remove 'rounded-'
  if (value === '') return false

  // `rounded-[10px]`, and the corner forms `rounded-t-[2px]`.
  const corner = /^(?:(t|b|l|r)-)?(\[[^\]]+\])$/.exec(value)
  if (corner) {
    const r = arbitraryLength(corner[2])
    if (r === undefined) return false
    const corners: Record<string, Array<keyof STXStyle>> = {
      t: ['borderTopLeftRadius', 'borderTopRightRadius'],
      b: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
      l: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
      r: ['borderTopRightRadius', 'borderBottomRightRadius'],
    }
    for (const key of corner[1] ? corners[corner[1]] : ['borderRadius' as keyof STXStyle])
      (style as Record<string, unknown>)[key] = r
    return true
  }

  // Handle corner-specific
  if (value.startsWith('t-')) {
    const r = borderRadius[value.slice(2)] ?? borderRadius.DEFAULT
    style.borderTopLeftRadius = r
    style.borderTopRightRadius = r
    return true
  }
  if (value.startsWith('b-')) {
    const r = borderRadius[value.slice(2)] ?? borderRadius.DEFAULT
    style.borderBottomLeftRadius = r
    style.borderBottomRightRadius = r
    return true
  }
  if (value.startsWith('l-')) {
    const r = borderRadius[value.slice(2)] ?? borderRadius.DEFAULT
    style.borderTopLeftRadius = r
    style.borderBottomLeftRadius = r
    return true
  }
  if (value.startsWith('r-')) {
    const r = borderRadius[value.slice(2)] ?? borderRadius.DEFAULT
    style.borderTopRightRadius = r
    style.borderBottomRightRadius = r
    return true
  }

  const radius = borderRadius[value]
  if (radius !== undefined) {
    style.borderRadius = radius
    return true
  }

  return false
}

function parseBorderWidth(className: string, style: STXStyle): boolean {
  if (!className.startsWith('border')) return false

  if (className === 'border') {
    style.borderWidth = 1
    return true
  }

  // border-{n}
  const match = className.match(/^border-(\d+)$/)
  if (match) {
    style.borderWidth = Number.parseInt(match[1])
    return true
  }

  // border-{side}-{n}
  const sideMatch = className.match(/^border-(t|r|b|l)-?(\d*)$/)
  if (sideMatch) {
    const [, side, width] = sideMatch
    const w = width ? Number.parseInt(width) : 1
    switch (side) {
      case 't': style.borderTopWidth = w; break
      case 'r': style.borderRightWidth = w; break
      case 'b': style.borderBottomWidth = w; break
      case 'l': style.borderLeftWidth = w; break
    }
    return true
  }

  return false
}

function parseBorderColor(className: string, style: STXStyle): boolean {
  if (!className.startsWith('border-')) return false
  const colorClass = className.slice(7)
  const color = resolveColor(colorClass)
  if (color) {
    style.borderColor = color
    return true
  }
  return false
}

function parseOpacity(className: string, style: STXStyle): boolean {
  if (!className.startsWith('opacity-')) return false
  const value = Number.parseInt(className.slice(8))
  if (!Number.isNaN(value)) {
    style.opacity = value / 100
    return true
  }
  return false
}

/** `tracking-[-0.02em]` and `leading-[18px]`, `leading-5`, `leading-tight`. */
function parseTypography(className: string, style: STXStyle): boolean {
  if (className.startsWith('tracking-[')) {
    const value = arbitraryLength(className.slice(9), typeof style.fontSize === 'number' ? style.fontSize : 16)
    if (value === undefined) return false
    style.letterSpacing = value
    return true
  }
  if (className.startsWith('leading-')) {
    const value = className.slice(8)
    const size = typeof style.fontSize === 'number' ? style.fontSize : 16
    const ratios: Record<string, number> = { none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 }
    const length = value.startsWith('[')
      ? (/^\[[\d.]+\]$/.test(value) ? Number.parseFloat(value.slice(1, -1)) * size : arbitraryLength(value, size))
      : ratios[value] !== undefined ? ratios[value] * size : spacing[value]
    if (length === undefined || !Number.isFinite(length)) return false
    style.lineHeight = length
    return true
  }
  return false
}

/** `grid-cols-3`: equal columns, as Craft's native grid draws them. */
function parseGridColumns(className: string, style: STXStyle): boolean {
  const match = /^grid-cols-(\d+)$/.exec(className)
  if (!match) return false
  style.gridColumns = Number(match[1])
  return true
}

/** `size-5` is `w-5 h-5`. */
function parseSize(className: string, style: STXStyle): boolean {
  if (!className.startsWith('size-')) return false
  const value = className.slice(5)
  const size = value === 'full' ? '100%' : resolveSpacing(value)
  if (size === undefined) return false
  style.width = size
  style.height = size
  return true
}

/** `top-0`, `left-[12px]`, `-top-1`. */
function parsePosition(className: string, style: STXStyle): boolean {
  const match = /^(-?)(top|right|bottom|left)-(.+)$/.exec(className)
  if (!match) return false
  const size = match[3] === 'full' ? '100%' : resolveSpacing(match[3])
  if (size === undefined) return false
  ;(style as Record<string, unknown>)[match[2]] = typeof size === 'number' && match[1] ? -size : size
  return true
}

/** `space-y-3` lays children out the way `gap` does on a native stack. */
function parseSpace(className: string, style: STXStyle): boolean {
  const match = /^space-(x|y)-(.+)$/.exec(className)
  if (!match) return false
  const size = resolveSpacing(match[2])
  if (size === undefined) return false
  style.gap = size
  return true
}

function parseGap(className: string, style: STXStyle): boolean {
  if (className.startsWith('gap-')) {
    const size = resolveSpacing(className.slice(4))
    if (size !== undefined) {
      style.gap = size
      return true
    }
  }
  if (className.startsWith('gap-x-')) {
    const size = resolveSpacing(className.slice(6))
    if (size !== undefined) {
      style.columnGap = size
      return true
    }
  }
  if (className.startsWith('gap-y-')) {
    const size = resolveSpacing(className.slice(6))
    if (size !== undefined) {
      style.rowGap = size
      return true
    }
  }
  return false
}

// ============================================================================
// Main Compiler Function
// ============================================================================

export interface ClassStyles {
  /** The style for the light appearance (and every appearance without `dark:`). */
  style: STXStyle
  /** What `dark:` classes change on top of `style`, when there are any. */
  dark?: STXStyle
  /** Classes nothing understood, for a compile warning. */
  unknown: string[]
  /** `truncate` is one line, `line-clamp-3` three: a Text prop, not a style. */
  numberOfLines?: number
  /** The Iconify class in the list (`i-lucide-sun`), for an `<Icon>`. */
  icon?: string
}

/**
 * The class list as styles, with `dark:` variants kept apart.
 *
 * A native view has no hover, focus or breakpoints, so every other variant is
 * dropped. `dark:` matters, because the host knows the appearance.
 */
export function compileClassStyles(classes: string): ClassStyles {
  const plain: string[] = []
  const dark: string[] = []
  for (const name of classes.split(/\s+/).filter(Boolean)) {
    if (name.startsWith('dark:')) dark.push(name.slice(5))
    else if (!name.includes(':') || name.startsWith('[')) plain.push(name)
  }
  const unknown: string[] = []
  const style = compileHeadwindToStyle(plain.join(' '), unknown)
  const result: ClassStyles = { style, unknown }
  if (dark.length) result.dark = compileHeadwindToStyle(dark.join(' '), unknown)
  for (const name of plain) {
    if (name === 'truncate') result.numberOfLines = 1
    const clamp = /^line-clamp-(\d+)$/.exec(name)
    if (clamp) result.numberOfLines = Number(clamp[1])
    if (!result.icon && /^i-[a-z0-9]+-[a-z0-9-]+$/.test(name)) result.icon = name
  }
  result.unknown = unknown.filter(name => !/^line-clamp-\d+$/.test(name))
  return result
}

export function compileHeadwindToStyle(classes: string, unknown?: string[]): STXStyle {
  const style: STXStyle = {}
  const classNames = classes.split(/\s+/).filter(Boolean)

  for (const className of classNames) {
    // An Iconify class names the glyph of an <Icon>, not a style.
    if (/^i-[a-z0-9]+-/.test(className)) continue

    // Try exact match parsers first
    const exactParser = classParsers[className]
    if (exactParser) {
      exactParser('', style)
      continue
    }

    // Try pattern-based parsers
    if (parseBackgroundColor(className, style)) continue
    if (parseTextColor(className, style)) continue
    if (parsePadding(className, style)) continue
    if (parseMargin(className, style)) continue
    if (parseWidth(className, style)) continue
    if (parseHeight(className, style)) continue
    if (parseBorderRadius(className, style)) continue
    if (parseBorderWidth(className, style)) continue
    if (parseBorderColor(className, style)) continue
    if (parseOpacity(className, style)) continue
    if (parseGap(className, style)) continue
    if (parseTypography(className, style)) continue
    if (parseSize(className, style)) continue
    if (parseGridColumns(className, style)) continue
    if (parsePosition(className, style)) continue
    if (parseSpace(className, style)) continue

    unknown?.push(className)
    // Unknown class - log warning in development. `process` is absent in the
    // JavaScriptCore bundle, which runs this same function for `:class`.
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.warn(`[STX Native] Unknown Headwind class: ${className}`)
    }
  }

  return style
}

// ============================================================================
// Exports
// ============================================================================

export { colors, spacing, fontSizes, borderRadius }
