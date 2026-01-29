/**
 * STX Media - Placeholder Generation
 *
 * Generate low-quality image placeholders (LQIP) for blur-up lazy loading effects.
 * Supports multiple strategies: blur, thumbhash, blurhash, pixelate, dominant-color.
 *
 * @module media/image/placeholder
 */

import type { PlaceholderOptions, PlaceholderResult, PlaceholderStrategy } from '../types'

// =============================================================================
// Constants
// =============================================================================

/**
 * Default placeholder options
 */
export const DEFAULT_PLACEHOLDER_OPTIONS: PlaceholderOptions = {
  strategy: 'thumbhash',
  width: 20,
  quality: 50,
  blurLevel: 40,
  transitionDuration: 300,
  easing: 'ease-out',
}

/**
 * CSS for blur-up transition
 */
export const BLUR_UP_CSS = `
.stx-img-placeholder {
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.stx-img-placeholder img {
  opacity: 0;
  transition: opacity var(--stx-img-transition-duration, 300ms) var(--stx-img-transition-easing, ease-out);
}

.stx-img-placeholder.stx-img-loaded img {
  opacity: 1;
}

.stx-img-blur {
  filter: blur(20px);
  transform: scale(1.1);
  transition: filter var(--stx-img-transition-duration, 300ms) var(--stx-img-transition-easing, ease-out),
              transform var(--stx-img-transition-duration, 300ms) var(--stx-img-transition-easing, ease-out);
}

.stx-img-loaded .stx-img-blur {
  filter: blur(0);
  transform: scale(1);
}
`.trim()

// =============================================================================
// Placeholder Generation (with ts-images integration)
// =============================================================================

/**
 * Try to import ts-images dynamically
 * Falls back gracefully if not available
 */
async function getTsImages(): Promise<typeof import('ts-images') | null> {
  try {
    return await import('ts-images')
  } catch {
    return null
  }
}

/**
 * Generate a placeholder for an image using the specified strategy
 *
 * @param src - Image source path
 * @param options - Placeholder options
 * @returns Placeholder result with data URL
 *
 * @example
 * ```typescript
 * const placeholder = await generatePlaceholder('/images/hero.jpg', {
 *   strategy: 'thumbhash',
 * })
 * console.log(placeholder.dataURL) // data:image/png;base64,...
 * ```
 */
export async function generatePlaceholder(
  src: string,
  options: Partial<PlaceholderOptions> = {},
): Promise<PlaceholderResult> {
  const opts = { ...DEFAULT_PLACEHOLDER_OPTIONS, ...options }

  // Try to use ts-images for high-quality placeholder generation
  const tsImages = await getTsImages()

  if (tsImages) {
    try {
      return await generateWithTsImages(src, opts, tsImages)
    } catch (error) {
      console.warn(`[stx-media] ts-images placeholder generation failed, using fallback: ${error}`)
    }
  }

  // Fallback to simple placeholder
  return generateFallbackPlaceholder(src, opts)
}

/**
 * Generate placeholder using ts-images library
 */
async function generateWithTsImages(
  src: string,
  options: PlaceholderOptions,
  tsImages: typeof import('ts-images'),
): Promise<PlaceholderResult> {
  const { generatePlaceholder: tsGeneratePlaceholder, generateThumbHash } = tsImages

  // Map our strategy to ts-images strategy
  const strategyMap: Record<PlaceholderStrategy, string> = {
    blur: 'blur',
    thumbhash: 'thumbhash',
    blurhash: 'thumbhash', // ts-images uses thumbhash as primary
    pixelate: 'pixelate',
    'dominant-color': 'dominant-color',
    none: 'blur', // Fallback
  }

  const tsStrategy = strategyMap[options.strategy] || 'blur'

  if (options.strategy === 'thumbhash') {
    // Use dedicated thumbhash generation for best results
    const result = await generateThumbHash(src)
    return {
      dataURL: result.dataUrl,
      width: 32, // Thumbhash generates 32x32
      height: 32,
      aspectRatio: 1, // Will be determined from original
      originalWidth: 0,
      originalHeight: 0,
      strategy: 'thumbhash',
    }
  }

  // Use general placeholder generation
  const result = await tsGeneratePlaceholder(src, {
    width: options.width,
    height: options.height,
    quality: options.quality,
    blurLevel: options.blurLevel,
    strategy: tsStrategy as 'blur' | 'pixelate' | 'thumbhash' | 'dominant-color',
    base64Encode: true,
  })

  return {
    dataURL: result.dataURL,
    width: result.width,
    height: result.height,
    aspectRatio: result.aspectRatio,
    originalWidth: result.originalWidth,
    originalHeight: result.originalHeight,
    strategy: options.strategy,
    dominantColor: result.dominantColor,
    css: result.css,
  }
}

/**
 * Generate a simple fallback placeholder without ts-images
 */
function generateFallbackPlaceholder(
  _src: string,
  options: PlaceholderOptions,
): PlaceholderResult {
  // Generate a simple gray placeholder SVG
  const width = options.width || 20
  const height = options.height || width
  const color = '#e5e7eb' // Gray-200

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect fill="${color}" width="${width}" height="${height}"/></svg>`
  const dataURL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  return {
    dataURL,
    width,
    height,
    aspectRatio: width / height,
    originalWidth: 0,
    originalHeight: 0,
    strategy: options.strategy,
    dominantColor: color,
  }
}

// =============================================================================
// Thumbhash Utilities
// =============================================================================

/**
 * Generate a thumbhash placeholder specifically
 *
 * @param src - Image source path
 * @returns Thumbhash data URL
 */
export async function generateThumbhashPlaceholder(src: string): Promise<string> {
  const tsImages = await getTsImages()

  if (tsImages) {
    try {
      const result = await tsImages.generateThumbHash(src)
      return result.dataUrl
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback
  const placeholder = await generateFallbackPlaceholder(src, {
    strategy: 'thumbhash',
    width: 32,
    height: 32,
  } as PlaceholderOptions)

  return placeholder.dataURL
}

/**
 * Decode a thumbhash string to a data URL (client-side)
 *
 * This is a minimal thumbhash decoder for client-side use
 * Based on https://github.com/evanw/thumbhash
 */
export function decodeThumbhash(hash: Uint8Array): string {
  // Extract header information
  const header = hash[0] | (hash[1] << 8) | (hash[2] << 16)
  const l_dc = (header & 63) / 63
  const p_dc = ((header >> 6) & 63) / 31.5 - 1
  const q_dc = ((header >> 12) & 63) / 31.5 - 1
  const l_scale = ((header >> 18) & 31) / 31
  const hasAlpha = (header >> 23) !== 0

  const header2 = hash[3] | (hash[4] << 8)
  const p_scale = ((header2 >> 3) & 63) / 63
  const q_scale = ((header2 >> 9) & 63) / 63
  const isLandscape = (header2 >> 15) !== 0

  const lx = Math.max(3, isLandscape ? (hasAlpha ? 5 : 7) : (hasAlpha ? 5 : 7))
  const ly = Math.max(3, isLandscape ? (hasAlpha ? 5 : 7) : (hasAlpha ? 5 : 7))

  // Generate a small preview (simplified - full implementation in client runtime)
  const width = 32
  const height = 32

  // Create a simple gradient based on DC values
  const r = Math.max(0, Math.min(255, Math.round((l_dc + p_dc) * 255)))
  const g = Math.max(0, Math.min(255, Math.round(l_dc * 255)))
  const b = Math.max(0, Math.min(255, Math.round((l_dc - p_dc) * 255)))

  // Generate SVG with gradient
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect fill="rgb(${r},${g},${b})" width="${width}" height="${height}"/>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// =============================================================================
// LQIP (Low Quality Image Placeholder) Generation
// =============================================================================

/**
 * Generate a low-quality image placeholder with blur
 *
 * @param src - Image source path
 * @param width - Placeholder width (default: 20)
 * @param quality - JPEG quality (default: 50)
 */
export async function generateLQIP(
  src: string,
  width: number = 20,
  quality: number = 50,
): Promise<PlaceholderResult> {
  return generatePlaceholder(src, {
    strategy: 'blur',
    width,
    quality,
    blurLevel: 40,
  })
}

// =============================================================================
// Dominant Color Extraction
// =============================================================================

/**
 * Extract dominant color from an image
 *
 * @param src - Image source path
 * @returns Hex color string
 */
export async function extractDominantColor(src: string): Promise<string> {
  const tsImages = await getTsImages()

  if (tsImages) {
    try {
      const result = await tsImages.generatePlaceholder(src, {
        strategy: 'dominant-color',
      })
      return result.dominantColor || '#e5e7eb'
    } catch {
      // Fall through
    }
  }

  // Fallback to gray
  return '#e5e7eb'
}

/**
 * Generate a solid color placeholder
 */
export function generateColorPlaceholder(color: string, width: number = 1, height: number = 1): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect fill="${color}" width="${width}" height="${height}"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// =============================================================================
// CSS Generation
// =============================================================================

/**
 * Generate CSS for placeholder with specific options
 */
export function generatePlaceholderCSS(
  id: string,
  placeholder: PlaceholderResult,
  options: Partial<PlaceholderOptions> = {},
): string {
  const duration = options.transitionDuration || 300
  const easing = options.easing || 'ease-out'

  return `
#${id} {
  --stx-img-transition-duration: ${duration}ms;
  --stx-img-transition-easing: ${easing};
  background-image: url('${placeholder.dataURL}');
  background-size: cover;
  background-position: center;
}

#${id} img {
  opacity: 0;
  transition: opacity var(--stx-img-transition-duration) var(--stx-img-transition-easing);
}

#${id}.stx-img-loaded img {
  opacity: 1;
}
`.trim()
}

/**
 * Generate inline style for placeholder background
 */
export function generatePlaceholderStyle(placeholder: PlaceholderResult): string {
  return `background-image: url('${placeholder.dataURL}'); background-size: cover; background-position: center;`
}

// =============================================================================
// Placeholder Cache
// =============================================================================

/**
 * In-memory placeholder cache
 */
const placeholderCache = new Map<string, PlaceholderResult>()

/**
 * Get placeholder from cache or generate new
 */
export async function getCachedPlaceholder(
  src: string,
  options: Partial<PlaceholderOptions> = {},
): Promise<PlaceholderResult> {
  const cacheKey = `${src}:${JSON.stringify(options)}`

  if (placeholderCache.has(cacheKey)) {
    return placeholderCache.get(cacheKey)!
  }

  const placeholder = await generatePlaceholder(src, options)
  placeholderCache.set(cacheKey, placeholder)

  return placeholder
}

/**
 * Clear the placeholder cache
 */
export function clearPlaceholderCache(): void {
  placeholderCache.clear()
}

/**
 * Get cache statistics
 */
export function getPlaceholderCacheStats(): { size: number; keys: string[] } {
  return {
    size: placeholderCache.size,
    keys: Array.from(placeholderCache.keys()),
  }
}
