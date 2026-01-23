/**
 * STX Image Directive
 *
 * @image directive for declarative image optimization in templates.
 *
 * @example
 * ```html
 * @image('/images/hero.jpg', 'Hero image', { width: 800, lazy: true })
 * @image('/images/photo.png', 'Photo')
 * @image(imagePath, alt)
 * ```
 */

import { defineDirective } from '../directive-api'
import type { CustomDirective } from '../types'
import {
  type ImageFormat,
  type ImageOptions,
  type ProcessedImage,
  type ImageVariant,
  DEFAULT_FORMATS,
  DEFAULT_QUALITY,
  DEFAULT_WIDTHS,
  processImage,
  generateSrcSet,
  getMimeType,
  isImageFile,
  isSharpAvailable,
} from './processor'

// ============================================================================
// Types
// ============================================================================

export interface ImageDirectiveOptions {
  /** Target width (single image) */
  width?: number
  /** Target height (calculated from aspect ratio if not provided) */
  height?: number
  /** Output quality (1-100) */
  quality?: number
  /** Lazy loading */
  lazy?: boolean
  /** Output formats */
  formats?: ImageFormat[]
  /** Responsive widths */
  widths?: number[]
  /** Sizes attribute */
  sizes?: string
  /** CSS class */
  class?: string
  /** Inline styles */
  style?: string
  /** Preload (high priority) */
  priority?: boolean
  /** Placeholder type */
  placeholder?: 'blur' | 'color' | 'none'
}

// ============================================================================
// Image Cache
// ============================================================================

const imageCache = new Map<string, ProcessedImage>()

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
  imageCache.clear()
}

/**
 * Get cached image or process new
 */
async function getCachedImage(
  src: string,
  options: ImageOptions,
): Promise<ProcessedImage | null> {
  const cacheKey = `${src}:${JSON.stringify(options)}`

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!
  }

  try {
    const processed = await processImage(src, options)
    imageCache.set(cacheKey, processed)
    return processed
  }
  catch {
    return null
  }
}

// ============================================================================
// Directive Definition
// ============================================================================

/**
 * Create the @image directive
 */
export function createImageDirective(): CustomDirective {
  return defineDirective<{
    src: string
    alt: string
    options: ImageDirectiveOptions
  }>({
    name: 'image',
    hasEndTag: false,
    description: 'Render an optimized image with responsive variants',

    transform: async (content, params, context) => {
      // Parse arguments from content if params not structured
      const { src, alt, options } = parseImageArgs(content, params, context)

      if (!src) {
        console.warn('@image directive: missing src argument')
        return '<!-- @image: missing src -->'
      }

      // Build image options
      const imageOptions: ImageOptions = {
        widths: options.widths || (options.width ? [options.width] : DEFAULT_WIDTHS),
        formats: options.formats || DEFAULT_FORMATS,
        quality: options.quality || DEFAULT_QUALITY,
        placeholder: options.placeholder || 'none',
      }

      // Check if sharp is available for full optimization
      const hasSharp = await isSharpAvailable()

      // In development or without sharp, render simple img
      if (!hasSharp) {
        return renderSimpleImage(src, alt || '', options)
      }

      // Try to process image
      const processed = await getCachedImage(src, imageOptions)

      if (!processed) {
        // Fallback to simple image if processing fails
        return renderSimpleImage(src, alt || '', options)
      }

      // Render optimized picture element
      return renderOptimizedImage(processed, alt || '', options)
    },
  })
}

// ============================================================================
// Argument Parsing
// ============================================================================

/**
 * Parse @image directive arguments
 *
 * Supports:
 * - @image('/path/to/image.jpg', 'Alt text', { width: 800 })
 * - @image('/path/to/image.jpg', 'Alt text')
 * - @image('/path/to/image.jpg')
 * - @image(imagePath, alt, options)
 */
function parseImageArgs(
  content: string,
  params: Record<string, unknown>,
  context: Record<string, unknown>,
): { src: string; alt: string; options: ImageDirectiveOptions } {
  // If params already structured, use them
  if (params.src) {
    return {
      src: String(params.src),
      alt: String(params.alt || ''),
      options: (params.options || {}) as ImageDirectiveOptions,
    }
  }

  // Parse from content string: @image('src', 'alt', { options })
  const trimmed = content.trim()

  // Remove @image( prefix and ) suffix if present
  let args = trimmed
  if (args.startsWith('@image(') || args.startsWith('(')) {
    args = args.replace(/^@image\(/, '').replace(/^\(/, '').replace(/\)$/, '')
  }

  // Parse arguments
  const parsed = parseArguments(args)

  // Resolve variable references from context
  let src = parsed[0] || ''
  let alt = parsed[1] || ''
  let options: ImageDirectiveOptions = {}

  // If src is a variable name (no quotes), try to resolve from context
  if (src && !src.startsWith('/') && !src.startsWith('.') && !src.startsWith('http')) {
    const contextValue = context[src]
    if (typeof contextValue === 'string') {
      src = contextValue
    }
  }

  // Parse options object if present
  if (parsed[2]) {
    try {
      // Handle both string and object
      if (typeof parsed[2] === 'string') {
        options = JSON.parse(parsed[2])
      }
      else {
        options = parsed[2] as ImageDirectiveOptions
      }
    }
    catch {
      // Options parsing failed, use empty
    }
  }

  return { src, alt, options }
}

/**
 * Parse comma-separated arguments with proper quote handling
 */
function parseArguments(argsStr: string): unknown[] {
  const args: unknown[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let braceDepth = 0
  let bracketDepth = 0

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]
    const prevChar = i > 0 ? argsStr[i - 1] : ''

    // Handle string delimiters
    if ((char === '"' || char === '\'') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      }
      else if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      else {
        current += char
      }
      continue
    }

    // Track braces/brackets when not in string
    if (!inString) {
      if (char === '{') braceDepth++
      if (char === '}') braceDepth--
      if (char === '[') bracketDepth++
      if (char === ']') bracketDepth--

      // Comma delimiter at top level
      if (char === ',' && braceDepth === 0 && bracketDepth === 0) {
        args.push(current.trim())
        current = ''
        continue
      }
    }

    current += char
  }

  // Push last argument
  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

// ============================================================================
// Rendering
// ============================================================================

/**
 * Render simple <img> tag (fallback)
 */
function renderSimpleImage(
  src: string,
  alt: string,
  options: ImageDirectiveOptions,
): string {
  const attrs: string[] = [`src="${escapeAttr(src)}"`]

  if (alt) attrs.push(`alt="${escapeAttr(alt)}"`)
  if (options.width) attrs.push(`width="${options.width}"`)
  if (options.height) attrs.push(`height="${options.height}"`)
  if (options.class) attrs.push(`class="${escapeAttr(options.class)}"`)
  if (options.style) attrs.push(`style="${escapeAttr(options.style)}"`)
  if (options.lazy !== false) attrs.push('loading="lazy"')
  attrs.push('decoding="async"')

  return `<img ${attrs.join(' ')} />`
}

/**
 * Render optimized <picture> element
 */
function renderOptimizedImage(
  processed: ProcessedImage,
  alt: string,
  options: ImageDirectiveOptions,
): string {
  const { variants, placeholder, width, height, aspectRatio } = processed

  // Group variants by format
  const byFormat = new Map<ImageFormat, ImageVariant[]>()
  for (const variant of variants) {
    const existing = byFormat.get(variant.format) || []
    existing.push(variant)
    byFormat.set(variant.format, existing)
  }

  // Build sources (prefer modern formats)
  const formatOrder: ImageFormat[] = ['avif', 'webp', 'jpeg', 'png']
  const sources: string[] = []

  for (const format of formatOrder) {
    const formatVariants = byFormat.get(format)
    if (formatVariants && formatVariants.length > 0) {
      const srcset = generateSrcSet(formatVariants)
      const mimeType = getMimeType(format)
      const sizes = options.sizes || '100vw'
      sources.push(`  <source type="${mimeType}" srcset="${srcset}" sizes="${sizes}" />`)
    }
  }

  // Get fallback variant (middle resolution JPEG or first available)
  const jpegs = byFormat.get('jpeg') || []
  const fallback = jpegs.length > 0
    ? jpegs[Math.floor(jpegs.length / 2)]
    : variants[Math.floor(variants.length / 2)]

  // Build img attributes
  const imgAttrs: string[] = [
    `src="${fallback?.url || processed.src}"`,
    `alt="${escapeAttr(alt)}"`,
  ]

  if (options.width || width) imgAttrs.push(`width="${options.width || width}"`)
  if (options.height || height) imgAttrs.push(`height="${options.height || height}"`)
  if (options.class) imgAttrs.push(`class="${escapeAttr(options.class)}"`)

  // Build style with aspect ratio
  const styles: string[] = []
  if (aspectRatio) styles.push(`aspect-ratio: ${aspectRatio.toFixed(4)}`)
  if (options.style) styles.push(options.style)
  if (styles.length > 0) imgAttrs.push(`style="${styles.join('; ')}"`)

  // Loading attributes
  if (options.lazy !== false && !options.priority) imgAttrs.push('loading="lazy"')
  imgAttrs.push('decoding="async"')
  if (options.priority) imgAttrs.push('fetchpriority="high"')

  // Build HTML
  let html = '<picture>\n'
  html += sources.join('\n') + '\n'
  html += `  <img ${imgAttrs.join(' ')} />\n`
  html += '</picture>'

  // Add placeholder wrapper if needed
  if (options.placeholder && placeholder) {
    const wrapperId = `stx-img-${Math.random().toString(36).slice(2, 8)}`

    if (options.placeholder === 'blur') {
      html = `<div id="${wrapperId}" class="stx-image-placeholder" style="background-image: url('${placeholder}'); background-size: cover;">\n${html}\n</div>`
    }
    else if (options.placeholder === 'color') {
      html = `<div id="${wrapperId}" class="stx-image-placeholder" style="background-color: ${placeholder};">\n${html}\n</div>`
    }
  }

  // Add preload link for priority images
  if (options.priority && fallback) {
    const preloadMime = getMimeType(fallback.format)
    html = `<link rel="preload" as="image" href="${fallback.url}" type="${preloadMime}" />\n` + html
  }

  return html
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Escape HTML attribute value
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// ============================================================================
// Export
// ============================================================================

/**
 * The @image directive instance
 */
export const imageDirective = createImageDirective()
