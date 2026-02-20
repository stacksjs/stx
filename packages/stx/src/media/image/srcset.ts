/**
 * STX Media - Srcset Generation
 *
 * Generate responsive srcset attributes for images following imgix.js patterns.
 * Supports both width-based srcsets and DPR-based srcsets for fixed-width images.
 *
 * @module media/image/srcset
 */

import type {
  Breakpoint,
  ImageFormat,
  ImageParams,
  ImageVariant,
  SrcsetData,
  SrcsetOptions,
} from '../types'

// =============================================================================
// Constants
// =============================================================================

/**
 * Default breakpoint widths for responsive images
 */
export const DEFAULT_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1536, 1920, 2560]

/**
 * Default DPR values for fixed-width images
 */
export const DEFAULT_DPR_VALUES = [1, 1.5, 2, 3]

/**
 * Default output formats in order of preference
 */
export const DEFAULT_FORMATS: ImageFormat[] = ['avif', 'webp', 'jpeg']

/**
 * MIME types for each format
 */
export const MIME_TYPES: Record<ImageFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
}

/**
 * File extensions for each format
 */
export const FORMAT_EXTENSIONS: Record<ImageFormat, string> = {
  avif: 'avif',
  webp: 'webp',
  jpeg: 'jpg',
  png: 'png',
  gif: 'gif',
}

// =============================================================================
// Width-Based Srcset Generation
// =============================================================================

/**
 * Generate a width-based srcset string
 *
 * @example
 * ```typescript
 * const srcset = generateWidthSrcset('/images/hero.jpg', [320, 640, 1024])
 * // Result: "/images/hero.jpg?w=320 320w, /images/hero.jpg?w=640 640w, /images/hero.jpg?w=1024 1024w"
 * ```
 */
export function generateWidthSrcset(
  src: string,
  widths: number[] = DEFAULT_WIDTHS,
  params: ImageParams = {},
  format?: ImageFormat,
): string {
  return widths
    .sort((a, b) => a - b)
    .map((width) => {
      const url = buildImageUrl(src, { ...params, w: width, fm: format })
      return `${url} ${width}w`
    })
    .join(', ')
}

/**
 * Generate width-based srcset with automatic width calculation
 *
 * Uses a tolerance-based approach similar to imgix.js to calculate optimal widths
 * between min and max values.
 *
 * @param src - Image source URL
 * @param minWidth - Minimum width (default: 320)
 * @param maxWidth - Maximum width (default: 2560)
 * @param tolerance - Width tolerance factor (default: 0.08 = 8%)
 */
export function generateAutoWidthSrcset(
  src: string,
  minWidth: number = 320,
  maxWidth: number = 2560,
  tolerance: number = 0.08,
  params: ImageParams = {},
  format?: ImageFormat,
): string {
  const widths = calculateOptimalWidths(minWidth, maxWidth, tolerance)
  return generateWidthSrcset(src, widths, params, format)
}

/**
 * Calculate optimal widths between min and max using tolerance factor
 *
 * Similar to imgix.js srcset generation algorithm
 */
export function calculateOptimalWidths(
  minWidth: number,
  maxWidth: number,
  tolerance: number = 0.08,
): number[] {
  const widths: number[] = []
  let currentWidth = minWidth

  while (currentWidth < maxWidth) {
    widths.push(Math.round(currentWidth))
    currentWidth *= 1 + tolerance * 2
  }

  // Always include max width
  if (widths[widths.length - 1] !== maxWidth) {
    widths.push(maxWidth)
  }

  return widths
}

// =============================================================================
// DPR-Based Srcset Generation
// =============================================================================

/**
 * Generate a DPR-based srcset for fixed-width images
 *
 * @example
 * ```typescript
 * const srcset = generateDprSrcset('/images/avatar.jpg', 200, [1, 2, 3])
 * // Result: "/images/avatar.jpg?w=200 1x, /images/avatar.jpg?w=400 2x, /images/avatar.jpg?w=600 3x"
 * ```
 */
export function generateDprSrcset(
  src: string,
  width: number,
  dprValues: number[] = DEFAULT_DPR_VALUES,
  params: ImageParams = {},
  format?: ImageFormat,
): string {
  return dprValues
    .sort((a, b) => a - b)
    .map((dpr) => {
      const actualWidth = Math.round(width * dpr)
      const url = buildImageUrl(src, { ...params, w: actualWidth, dpr, fm: format })
      return `${url} ${dpr}x`
    })
    .join(', ')
}

/**
 * Generate DPR-based srcset with variable quality
 *
 * Reduces quality for higher DPR values to maintain reasonable file sizes
 * (similar to imgix variable quality feature)
 */
export function generateDprSrcsetWithVariableQuality(
  src: string,
  width: number,
  dprValues: number[] = DEFAULT_DPR_VALUES,
  baseQuality: number = 80,
  params: ImageParams = {},
  format?: ImageFormat,
): string {
  // Quality mapping: higher DPR = lower quality (files are larger at higher DPR)
  const qualityMap: Record<number, number> = {
    1: baseQuality,
    1.5: Math.round(baseQuality * 0.9),
    2: Math.round(baseQuality * 0.8),
    3: Math.round(baseQuality * 0.7),
    4: Math.round(baseQuality * 0.6),
    5: Math.round(baseQuality * 0.5),
  }

  return dprValues
    .sort((a, b) => a - b)
    .map((dpr) => {
      const actualWidth = Math.round(width * dpr)
      const quality = qualityMap[dpr] || Math.round(baseQuality * Math.max(0.5, 1 - dpr * 0.1))
      const url = buildImageUrl(src, { ...params, w: actualWidth, q: quality, dpr, fm: format })
      return `${url} ${dpr}x`
    })
    .join(', ')
}

// =============================================================================
// Sizes Attribute Generation
// =============================================================================

/**
 * Generate a sizes attribute from breakpoint definitions
 *
 * @example
 * ```typescript
 * const sizes = generateSizesAttribute({
 *   '768px': '100vw',
 *   '1024px': '50vw',
 * })
 * // Result: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 100vw"
 * ```
 */
export function generateSizesAttribute(
  breakpoints: Record<string, string>,
  defaultSize: string = '100vw',
): string {
  if (!breakpoints || Object.keys(breakpoints).length === 0) {
    return defaultSize
  }

  const entries = Object.entries(breakpoints)
    .map(([breakpoint, size]) => {
      // Ensure breakpoint has a unit
      const bp = /^\d+$/.test(breakpoint) ? `${breakpoint}px` : breakpoint
      return { bp, size, numericBp: Number.parseInt(bp) || 0 }
    })
    .sort((a, b) => a.numericBp - b.numericBp)

  const parts = entries.map(({ bp, size }) => `(max-width: ${bp}) ${size}`)
  parts.push(defaultSize)

  return parts.join(', ')
}

/**
 * Generate sizes from named breakpoints
 */
export function generateSizesFromBreakpoints(
  breakpoints: Breakpoint[],
  defaultSize: string = '100vw',
): string {
  if (!breakpoints || breakpoints.length === 0) {
    return defaultSize
  }

  const sorted = [...breakpoints].sort((a, b) => (a.maxWidth || 0) - (b.maxWidth || 0))

  const parts = sorted
    .filter((bp) => bp.maxWidth)
    .map((bp) => `(max-width: ${bp.maxWidth}px) ${bp.imageWidth}`)

  parts.push(defaultSize)
  return parts.join(', ')
}

/**
 * Common responsive sizes patterns
 */
export const COMMON_SIZES = {
  /** Full width on all screens */
  fullWidth: '100vw',
  /** Half width on desktop, full on mobile */
  halfDesktop: '(max-width: 768px) 100vw, 50vw',
  /** Third width on desktop, full on mobile */
  thirdDesktop: '(max-width: 768px) 100vw, 33.33vw',
  /** Quarter width on desktop, half on tablet, full on mobile */
  quarterDesktop: '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw',
  /** Content width (centered with max-width) */
  contentWidth: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 960px',
} as const

// =============================================================================
// URL Building
// =============================================================================

/**
 * Build an image URL with transformation parameters
 *
 * @example
 * ```typescript
 * const url = buildImageUrl('/images/hero.jpg', { w: 800, h: 600, fit: 'crop', q: 85 })
 * // Result: "/images/hero.jpg?w=800&h=600&fit=crop&q=85"
 * ```
 */
export function buildImageUrl(src: string, params: ImageParams = {}): string {
  const filteredParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Handle array values (like auto: ['format', 'compress'])
      if (Array.isArray(value)) {
        return [key, value.join(',')]
      }
      return [key, String(value)]
    })

  if (filteredParams.length === 0) {
    return src
  }

  const queryString = filteredParams.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')

  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}${queryString}`
}

/**
 * Parse image parameters from a URL
 */
export function parseImageUrl(url: string): { src: string; params: ImageParams } {
  const [src, queryString] = url.split('?')
  const params: ImageParams = {}

  if (queryString) {
    const searchParams = new URLSearchParams(queryString)
    searchParams.forEach((value, key) => {
      // Convert numeric values
      if (/^\d+$/.test(value)) {
        ;(params as Record<string, unknown>)[key] = Number.parseInt(value, 10)
      } else if (/^\d+\.\d+$/.test(value)) {
        ;(params as Record<string, unknown>)[key] = Number.parseFloat(value)
      } else if (value === 'true') {
        ;(params as Record<string, unknown>)[key] = true
      } else if (value === 'false') {
        ;(params as Record<string, unknown>)[key] = false
      } else {
        ;(params as Record<string, unknown>)[key] = value
      }
    })
  }

  return { src, params }
}

// =============================================================================
// Full Srcset Data Generation
// =============================================================================

/**
 * Generate complete srcset data for all formats
 *
 * @returns Array of srcset data for each format
 */
export function generateSrcsetData(options: SrcsetOptions): SrcsetData[] {
  const { src, widths, dprValues, fixedWidth, formats = DEFAULT_FORMATS, baseUrl = '', params = {} } = options

  const results: SrcsetData[] = []

  for (const format of formats) {
    let srcset: string
    let variants: ImageVariant[]

    if (fixedWidth !== undefined && dprValues) {
      // DPR-based srcset for fixed-width images
      srcset = generateDprSrcset(src, fixedWidth, dprValues, params, format)
      variants = dprValues.map((dpr) => ({
        path: '',
        url: buildImageUrl(src, { ...params, w: Math.round(fixedWidth * dpr), fm: format }),
        width: Math.round(fixedWidth * dpr),
        height: 0, // Unknown without processing
        format,
        size: 0,
        dpr,
      }))
    } else {
      // Width-based srcset
      const usedWidths = widths || DEFAULT_WIDTHS
      srcset = generateWidthSrcset(src, usedWidths, params, format)
      variants = usedWidths.map((width) => ({
        path: '',
        url: buildImageUrl(src, { ...params, w: width, fm: format }),
        width,
        height: 0,
        format,
        size: 0,
      }))
    }

    results.push({
      srcset,
      format,
      mimeType: MIME_TYPES[format],
      variants,
    })
  }

  return results
}

/**
 * Generate a complete <picture> element's source tags
 */
export function generateSourceTags(
  srcsetData: SrcsetData[],
  sizes: string = '100vw',
): string {
  return srcsetData
    .map(
      ({ srcset, mimeType }) =>
        `<source type="${mimeType}" srcset="${srcset}" sizes="${sizes}" />`,
    )
    .join('\n')
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the best variant for a given width from a list of variants
 */
export function getBestVariant(variants: ImageVariant[], targetWidth: number): ImageVariant | undefined {
  if (variants.length === 0) return undefined

  // Sort by width
  const sorted = [...variants].sort((a, b) => a.width - b.width)

  // Find the smallest variant that's >= target width
  const larger = sorted.find((v) => v.width >= targetWidth)
  if (larger) return larger

  // Otherwise return the largest available
  return sorted[sorted.length - 1]
}

/**
 * Get the fallback variant (middle resolution JPEG)
 */
export function getFallbackVariant(variants: ImageVariant[], preferFormat?: ImageFormat): ImageVariant | undefined {
  const filtered = preferFormat ? variants.filter((v) => v.format === preferFormat) : variants

  if (filtered.length === 0) {
    // Fall back to any format
    const jpegVariants = variants.filter((v) => v.format === 'jpeg')
    const source = jpegVariants.length > 0 ? jpegVariants : variants
    return source[Math.floor(source.length / 2)]
  }

  const sorted = filtered.sort((a, b) => a.width - b.width)
  return sorted[Math.floor(sorted.length / 2)]
}

/**
 * Group variants by format
 */
export function groupVariantsByFormat(variants: ImageVariant[]): Map<ImageFormat, ImageVariant[]> {
  const grouped = new Map<ImageFormat, ImageVariant[]>()

  for (const variant of variants) {
    const existing = grouped.get(variant.format) || []
    existing.push(variant)
    grouped.set(variant.format, existing)
  }

  return grouped
}

/**
 * Get MIME type for a format
 */
export function getMimeType(format: ImageFormat): string {
  return MIME_TYPES[format] || 'application/octet-stream'
}

/**
 * Get file extension for a format
 */
export function getFormatExtension(format: ImageFormat): string {
  return FORMAT_EXTENSIONS[format] || format
}

/**
 * Detect image format from file extension or URL
 */
export function detectFormat(src: string): ImageFormat | undefined {
  const ext = src.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    case 'avif':
      return 'avif'
    case 'gif':
      return 'gif'
    default:
      return undefined
  }
}
