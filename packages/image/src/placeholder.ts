const DEFAULT_BLUR_WIDTH = 20
const DEFAULT_BLUR_HEIGHT = 20
const DEFAULT_COLOR = '#e2e8f0'

export function generateBlurDataUrl(width?: number, height?: number, color?: string): string {
  const w = width ?? DEFAULT_BLUR_WIDTH
  const h = height ?? DEFAULT_BLUR_HEIGHT
  const c = color ?? DEFAULT_COLOR

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><filter id="b"><feGaussianBlur stdDeviation="3"/></filter><rect width="100%" height="100%" fill="${c}" filter="url(#b)"/></svg>`

  const encoded = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${encoded}`
}

export function dominantColor(hex?: string): string {
  if (!hex)
    return DEFAULT_COLOR

  // Normalize hex color
  let normalized = hex.startsWith('#') ? hex : `#${hex}`

  // Expand shorthand (#abc -> #aabbcc)
  if (normalized.length === 4) {
    normalized = `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
  }

  return normalized
}

export function generatePlaceholderStyle(options: { type: 'blur' | 'color', color?: string, width?: number, height?: number }): string {
  if (options.type === 'color') {
    const color = dominantColor(options.color)
    return `background-color: ${color};`
  }

  const dataUrl = generateBlurDataUrl(options.width, options.height, options.color)
  return `background-image: url("${dataUrl}"); background-size: cover;`
}
