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
    return colorClass.slice(1, -1)
  }

  return undefined
}

function resolveSpacing(value: string): number | undefined {
  // Handle arbitrary values (e.g., "[20px]", "[1.5rem]")
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1)
    if (inner.endsWith('px')) {
      return Number.parseFloat(inner)
    }
    if (inner.endsWith('rem')) {
      return Number.parseFloat(inner) * 16
    }
    return Number.parseFloat(inner)
  }

  return spacing[value]
}

// ============================================================================
// Class Parsers
// ============================================================================

type ClassParser = (value: string, style: STXStyle) => boolean

const classParsers: Record<string, ClassParser> = {
  // Display
  flex: (_, style) => { style.display = 'flex'; return true },
  hidden: (_, style) => { style.display = 'none'; return true },

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
  'flex-1': (_, style) => { style.flex = 1; return true },
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

export function compileHeadwindToStyle(classes: string): STXStyle {
  const style: STXStyle = {}
  const classNames = classes.split(/\s+/).filter(Boolean)

  for (const className of classNames) {
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

    // Unknown class - log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[STX Native] Unknown Headwind class: ${className}`)
    }
  }

  return style
}

// ============================================================================
// Exports
// ============================================================================

export { colors, spacing, fontSizes, borderRadius }
