/**
 * STX Media - Image Editing API
 *
 * URL-based image transformation API similar to imgix.
 * Build URLs with transformation parameters for resizing, cropping,
 * format conversion, and image adjustments.
 *
 * @module media/image/editing
 */

import type { ImageCrop, ImageFit, ImageFormat, ImageParams } from '../types'

// =============================================================================
// URL Building
// =============================================================================

/**
 * Build an image URL with transformation parameters
 *
 * @example
 * ```typescript
 * const url = buildImageUrl('/images/hero.jpg', {
 *   w: 800,
 *   h: 600,
 *   fit: 'crop',
 *   crop: 'center',
 *   q: 85,
 *   fm: 'webp'
 * })
 * // Result: "/images/hero.jpg?w=800&h=600&fit=crop&crop=center&q=85&fm=webp"
 * ```
 */
export function buildImageUrl(src: string, params: ImageParams = {}): string {
  const queryParams: string[] = []

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      queryParams.push(`${key}=${encodeURIComponent(value.join(','))}`)
    } else if (typeof value === 'boolean') {
      if (value) queryParams.push(`${key}=true`)
    } else {
      queryParams.push(`${key}=${encodeURIComponent(String(value))}`)
    }
  }

  if (queryParams.length === 0) return src

  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}${queryParams.join('&')}`
}

/**
 * Parse image parameters from a URL
 */
export function parseImageUrl(url: string): { src: string; params: ImageParams } {
  const questionIndex = url.indexOf('?')
  if (questionIndex === -1) {
    return { src: url, params: {} }
  }

  const src = url.slice(0, questionIndex)
  const queryString = url.slice(questionIndex + 1)
  const params: ImageParams = {}

  for (const pair of queryString.split('&')) {
    const [key, rawValue] = pair.split('=')
    const value = rawValue ? decodeURIComponent(rawValue) : ''

    // Convert to appropriate types
    if (value === 'true') {
      ;(params as Record<string, unknown>)[key] = true
    } else if (value === 'false') {
      ;(params as Record<string, unknown>)[key] = false
    } else if (/^-?\d+$/.test(value)) {
      ;(params as Record<string, unknown>)[key] = Number.parseInt(value, 10)
    } else if (/^-?\d+\.\d+$/.test(value)) {
      ;(params as Record<string, unknown>)[key] = Number.parseFloat(value)
    } else if (value.includes(',')) {
      ;(params as Record<string, unknown>)[key] = value.split(',')
    } else {
      ;(params as Record<string, unknown>)[key] = value
    }
  }

  return { src, params }
}

/**
 * Merge image parameters, with later values overriding earlier ones
 */
export function mergeParams(...paramSets: (ImageParams | undefined)[]): ImageParams {
  const result: ImageParams = {}

  for (const params of paramSets) {
    if (params) {
      Object.assign(result, params)
    }
  }

  return result
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Resize an image to specific dimensions
 *
 * @example
 * ```typescript
 * const url = resize('/images/photo.jpg', 800, 600)
 * // Result: "/images/photo.jpg?w=800&h=600"
 * ```
 */
export function resize(src: string, width: number, height?: number, fit?: ImageFit): string {
  const params: ImageParams = { w: width }
  if (height) params.h = height
  if (fit) params.fit = fit
  return buildImageUrl(src, params)
}

/**
 * Crop an image to specific dimensions
 *
 * @example
 * ```typescript
 * const url = crop('/images/photo.jpg', 800, 600, 'center')
 * // Result: "/images/photo.jpg?w=800&h=600&fit=crop&crop=center"
 * ```
 */
export function crop(src: string, width: number, height: number, position: ImageCrop = 'center'): string {
  return buildImageUrl(src, {
    w: width,
    h: height,
    fit: 'crop',
    crop: position,
  })
}

/**
 * Create a square thumbnail
 *
 * @example
 * ```typescript
 * const url = thumbnail('/images/photo.jpg', 200)
 * // Result: "/images/photo.jpg?w=200&h=200&fit=crop&crop=center"
 * ```
 */
export function thumbnail(src: string, size: number, cropPosition: ImageCrop = 'center'): string {
  return buildImageUrl(src, {
    w: size,
    h: size,
    fit: 'crop',
    crop: cropPosition,
  })
}

/**
 * Scale image to fit within dimensions while maintaining aspect ratio
 */
export function contain(src: string, maxWidth: number, maxHeight?: number): string {
  return buildImageUrl(src, {
    w: maxWidth,
    h: maxHeight,
    fit: 'max',
  })
}

/**
 * Scale and crop image to cover dimensions
 */
export function cover(src: string, width: number, height: number): string {
  return buildImageUrl(src, {
    w: width,
    h: height,
    fit: 'crop',
  })
}

/**
 * Apply blur effect
 *
 * @param radius - Blur radius (0-2000)
 */
export function blur(src: string, radius: number): string {
  return buildImageUrl(src, { blur: Math.min(2000, Math.max(0, radius)) })
}

/**
 * Apply sharpening
 *
 * @param amount - Sharpen amount (0-100)
 */
export function sharpen(src: string, amount: number): string {
  return buildImageUrl(src, { sharp: Math.min(100, Math.max(0, amount)) })
}

/**
 * Convert to grayscale
 */
export function grayscale(src: string): string {
  return buildImageUrl(src, { sat: -100 })
}

/**
 * Apply sepia tone
 *
 * @param amount - Sepia intensity (0-100)
 */
export function sepia(src: string, amount: number = 100): string {
  return buildImageUrl(src, { sepia: Math.min(100, Math.max(0, amount)) })
}

/**
 * Invert colors
 */
export function invert(src: string): string {
  return buildImageUrl(src, { invert: true })
}

/**
 * Adjust brightness
 *
 * @param amount - Brightness adjustment (-100 to 100)
 */
export function brightness(src: string, amount: number): string {
  return buildImageUrl(src, { bri: Math.min(100, Math.max(-100, amount)) })
}

/**
 * Adjust contrast
 *
 * @param amount - Contrast adjustment (-100 to 100)
 */
export function contrast(src: string, amount: number): string {
  return buildImageUrl(src, { con: Math.min(100, Math.max(-100, amount)) })
}

/**
 * Adjust saturation
 *
 * @param amount - Saturation adjustment (-100 to 100)
 */
export function saturation(src: string, amount: number): string {
  return buildImageUrl(src, { sat: Math.min(100, Math.max(-100, amount)) })
}

/**
 * Rotate image
 *
 * @param degrees - Rotation in degrees (0-359)
 */
export function rotate(src: string, degrees: number): string {
  return buildImageUrl(src, { rot: ((degrees % 360) + 360) % 360 })
}

/**
 * Flip image horizontally
 */
export function flipHorizontal(src: string): string {
  return buildImageUrl(src, { flip: 'h' })
}

/**
 * Flip image vertically
 */
export function flipVertical(src: string): string {
  return buildImageUrl(src, { flip: 'v' })
}

/**
 * Convert to specific format
 */
export function format(src: string, fmt: ImageFormat, quality?: number): string {
  const params: ImageParams = { fm: fmt }
  if (quality !== undefined) params.q = quality
  return buildImageUrl(src, params)
}

/**
 * Set quality
 */
export function quality(src: string, q: number): string {
  return buildImageUrl(src, { q: Math.min(100, Math.max(1, q)) })
}

/**
 * Apply auto enhancements
 *
 * @param enhancements - Array of enhancements: 'format', 'compress', 'enhance'
 */
export function auto(src: string, enhancements: string[] = ['format', 'compress']): string {
  return buildImageUrl(src, { auto: enhancements })
}

// =============================================================================
// Watermark Functions
// =============================================================================

/**
 * Add a watermark image
 */
export function watermark(
  src: string,
  markUrl: string,
  options: {
    x?: number
    y?: number
    alpha?: number
    scale?: number
    align?: string
  } = {},
): string {
  return buildImageUrl(src, {
    mark: markUrl,
    markx: options.x,
    marky: options.y,
    markalpha: options.alpha,
    markscale: options.scale,
    markalign: options.align as ImageParams['markalign'],
  })
}

// =============================================================================
// Preset Configurations
// =============================================================================

/**
 * Common image transformation presets
 */
export const PRESETS = {
  /** Optimized for web display */
  web: { fm: 'webp' as ImageFormat, q: 80, auto: ['format', 'compress'] },
  /** High quality for print/download */
  highQuality: { q: 95 },
  /** Optimized for thumbnails */
  thumb: { w: 150, h: 150, fit: 'crop' as ImageFit, crop: 'center' as ImageCrop },
  /** Avatar image */
  avatar: { w: 200, h: 200, fit: 'crop' as ImageFit, crop: 'faces' as ImageCrop },
  /** Social media share image */
  social: { w: 1200, h: 630, fit: 'crop' as ImageFit },
  /** Small preview */
  preview: { w: 400, q: 70 },
  /** Blur placeholder */
  placeholder: { w: 20, blur: 200, q: 20 },
} as const

/**
 * Apply a preset to an image URL
 */
export function applyPreset(src: string, preset: keyof typeof PRESETS, additionalParams?: ImageParams): string {
  return buildImageUrl(src, mergeParams(PRESETS[preset], additionalParams))
}

// =============================================================================
// Responsive Helpers
// =============================================================================

/**
 * Generate srcset-compatible URLs for multiple widths
 */
export function srcsetUrls(src: string, widths: number[], params?: ImageParams): string[] {
  return widths.map((w) => buildImageUrl(src, { ...params, w }))
}

/**
 * Generate DPR-aware URLs for a fixed width
 */
export function dprUrls(src: string, width: number, dprValues: number[] = [1, 2, 3], params?: ImageParams): string[] {
  return dprValues.map((dpr) =>
    buildImageUrl(src, { ...params, w: Math.round(width * dpr), dpr }),
  )
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate image parameters
 */
export function validateParams(params: ImageParams): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (params.w !== undefined && (params.w < 1 || params.w > 16383)) {
    errors.push('Width must be between 1 and 16383')
  }

  if (params.h !== undefined && (params.h < 1 || params.h > 16383)) {
    errors.push('Height must be between 1 and 16383')
  }

  if (params.q !== undefined && (params.q < 1 || params.q > 100)) {
    errors.push('Quality must be between 1 and 100')
  }

  if (params.blur !== undefined && (params.blur < 0 || params.blur > 2000)) {
    errors.push('Blur must be between 0 and 2000')
  }

  if (params.rot !== undefined && (params.rot < 0 || params.rot > 359)) {
    errors.push('Rotation must be between 0 and 359')
  }

  if (params.dpr !== undefined && (params.dpr < 1 || params.dpr > 5)) {
    errors.push('DPR must be between 1 and 5')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize image parameters (clamp to valid ranges)
 */
export function sanitizeParams(params: ImageParams): ImageParams {
  const sanitized = { ...params }

  if (sanitized.w !== undefined) sanitized.w = Math.min(16383, Math.max(1, sanitized.w))
  if (sanitized.h !== undefined) sanitized.h = Math.min(16383, Math.max(1, sanitized.h))
  if (sanitized.q !== undefined) sanitized.q = Math.min(100, Math.max(1, sanitized.q))
  if (sanitized.blur !== undefined) sanitized.blur = Math.min(2000, Math.max(0, sanitized.blur))
  if (sanitized.rot !== undefined) sanitized.rot = ((sanitized.rot % 360) + 360) % 360
  if (sanitized.dpr !== undefined) sanitized.dpr = Math.min(5, Math.max(1, sanitized.dpr))

  return sanitized
}
