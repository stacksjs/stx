/**
 * Extract color value from CSS
 */
export function extractColorFromCSS(css: string): string | null {
  // RGB/RGBA
  const rgbMatch = css.match(/rgba?\(([^)]+)\)/)
  if (rgbMatch)
    return `rgb${rgbMatch[0].includes('rgba') ? 'a' : ''}(${rgbMatch[1]})`

  // Hex colors
  const hexMatch = css.match(/#([0-9a-fA-F]{3,8})\b/)
  if (hexMatch)
    return `#${hexMatch[1]}`

  // HSL/HSLA
  const hslMatch = css.match(/hsla?\(([^)]+)\)/)
  if (hslMatch)
    return `hsl${hslMatch[0].includes('hsla') ? 'a' : ''}(${hslMatch[1]})`

  // OKLCH
  const oklchMatch = css.match(/oklch\(([^)]+)\)/)
  if (oklchMatch)
    return `oklch(${oklchMatch[1]})`

  // Color keywords
  const colorKeywords = [
    'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange',
    'black', 'white', 'gray', 'grey', 'transparent', 'current',
  ]

  for (const keyword of colorKeywords) {
    if (css.includes(keyword))
      return keyword
  }

  return null
}

/**
 * Check if a utility class is color-related
 */
export function isColorClass(className: string): boolean {
  const colorPrefixes = [
    'bg-',
    'text-',
    'border-',
    'outline-',
    'ring-',
    'decoration-',
    'divide-',
    'shadow-',
    'from-',
    'via-',
    'to-',
    'accent-',
    'caret-',
    'fill-',
    'stroke-',
  ]

  return colorPrefixes.some(prefix => className.startsWith(prefix))
}

/**
 * Extract all color properties from CSS declarations
 */
export interface ColorInfo {
  property: string
  value: string
}

export function extractAllColors(css: string): ColorInfo[] {
  const colors: ColorInfo[] = []
  const lines = css.split(';').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    const [property, value] = line.split(':').map(s => s?.trim())
    if (!property || !value)
      continue

    const color = extractColorFromCSS(value)
    if (color) {
      colors.push({
        property,
        value: color,
      })
    }
  }

  return colors
}
