/**
 * StxImage Builtin Component
 *
 * Full-featured image component matching NuxtImage capabilities:
 *
 * - Auto `loading="lazy"` + `decoding="async"`
 * - Responsive `srcset` + `sizes` auto-generation from breakpoints
 * - Density descriptors (`1x`, `2x`, `3x`)
 * - `<picture>` wrapper with format negotiation (avif, webp fallback)
 * - Blur-up / color / empty placeholder modes
 * - Aspect ratio preservation (CLS prevention)
 * - Preload hint injection (`<link rel="preload">`)
 * - CDN provider support (Cloudinary, imgix, custom)
 *
 * Usage:
 *   <StxImage src="/images/hero.jpg" alt="Hero" />
 *   <StxImage src="/images/hero.jpg" alt="Hero" width="800" height="600" />
 *   <StxImage src="/images/hero.jpg" alt="Hero" sizes="sm:100vw md:50vw lg:33vw" />
 *   <StxImage src="/images/hero.jpg" alt="Hero" densities="1x 2x" />
 *   <StxImage src="/images/hero.jpg" alt="Hero" format="webp" />
 *   <StxImage src="/images/hero.jpg" alt="Hero" placeholder="blur" />
 *   <StxImage src="/images/hero.jpg" alt="Hero" placeholder="thumbhash" />
 *   <StxImage src="/images/hero.jpg" alt="Hero" preload />
 *   <StxImage src="/images/hero.jpg" alt="Hero" provider="cloudinary" />
 *
 * @module builtins/stx-image
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

// Default responsive breakpoints (matching Tailwind defaults)
const DEFAULT_BREAKPOINTS: Record<string, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

// Default widths for srcset generation
const DEFAULT_SRCSET_WIDTHS = [320, 640, 768, 1024, 1280, 1536, 1920]

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  const val = props.static[key]
  if (typeof val === 'string') return val
  return undefined
}

function resolveBoolProp(props: ResolvedProps, key: string, defaultVal = false): boolean {
  const dynamic = props.serverDynamic[key]
  if (dynamic !== undefined) return dynamic !== false && dynamic !== 'false'
  const stat = props.static[key]
  if (stat !== undefined) return stat !== 'false' && stat !== false
  return defaultVal
}

/**
 * Parse sizes prop: "sm:100vw md:50vw lg:33vw" → proper sizes attribute
 * Also accepts raw sizes string: "(max-width: 768px) 100vw, 50vw"
 */
function parseSizes(sizesStr: string): string {
  // If it already contains media queries, pass through
  if (sizesStr.includes('(') || sizesStr.includes(',')) return sizesStr

  const parts = sizesStr.trim().split(/\s+/)
  const conditions: string[] = []

  for (const part of parts) {
    if (part.includes(':')) {
      const [bp, size] = part.split(':')
      const width = DEFAULT_BREAKPOINTS[bp]
      if (width) {
        conditions.push(`(max-width: ${width}px) ${size}`)
      }
      else {
        // Numeric breakpoint: "800:50vw"
        const numWidth = Number.parseInt(bp)
        if (!Number.isNaN(numWidth)) {
          conditions.push(`(max-width: ${numWidth}px) ${size}`)
        }
      }
    }
    else {
      // Default size (no breakpoint prefix)
      conditions.push(part)
    }
  }

  return conditions.join(', ')
}

/**
 * Generate srcset from widths: "/img.jpg 320w, /img.jpg 640w, ..."
 * For local images, just generates width descriptors.
 * For CDN providers, generates resized URLs.
 */
function generateSrcset(
  src: string,
  widths: number[],
  provider?: string,
  format?: string,
): string {
  return widths
    .map(w => `${transformSrc(src, w, undefined, provider, format)} ${w}w`)
    .join(', ')
}

/**
 * Generate density srcset: "/img.jpg 1x, /img@2x.jpg 2x"
 */
function generateDensitySrcset(
  src: string,
  densities: number[],
  width: number | undefined,
  provider?: string,
  format?: string,
): string {
  return densities
    .map(d => {
      const w = width ? width * d : undefined
      return `${transformSrc(src, w, undefined, provider, format)} ${d}x`
    })
    .join(', ')
}

/**
 * Transform src URL based on provider.
 * For local images, returns as-is (optimization happens at build time via stx's image pipeline).
 * For CDN providers, generates the appropriate URL.
 */
function transformSrc(
  src: string,
  width?: number,
  height?: number,
  provider?: string,
  format?: string,
): string {
  if (!provider || provider === 'local' || provider === 'static') {
    // Local image — return as-is. Build-time optimization is handled
    // separately by stx's image optimization pipeline.
    return src
  }

  if (provider === 'cloudinary') {
    // https://res.cloudinary.com/demo/image/upload/w_800,f_webp/sample.jpg
    const transforms: string[] = []
    if (width) transforms.push(`w_${width}`)
    if (height) transforms.push(`h_${height}`)
    if (format) transforms.push(`f_${format}`)
    transforms.push('q_auto')
    const transformStr = transforms.join(',')
    // Insert transforms before the file path
    return src.replace('/upload/', `/upload/${transformStr}/`)
  }

  if (provider === 'imgix') {
    // https://example.imgix.net/image.jpg?w=800&fm=webp&auto=format
    const params = new URLSearchParams()
    if (width) params.set('w', String(width))
    if (height) params.set('h', String(height))
    if (format) params.set('fm', format)
    params.set('auto', 'format')
    const sep = src.includes('?') ? '&' : '?'
    return `${src}${sep}${params.toString()}`
  }

  if (provider === 'bunny') {
    // Bunny CDN: ?width=800&format=webp
    const params = new URLSearchParams()
    if (width) params.set('width', String(width))
    if (height) params.set('height', String(height))
    if (format) params.set('format', format)
    const sep = src.includes('?') ? '&' : '?'
    return `${src}${sep}${params.toString()}`
  }

  return src
}

/**
 * Generate a tiny SVG placeholder for blur-up effect
 */
function generateBlurPlaceholder(width: number, height: number, color = '#e5e7eb'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/></svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export const StxImageBuiltin: BuiltinComponentDef = {
  name: 'StxImage',
  aliases: ['stx-image', 'stx-img'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const src = resolveProp(props, 'src') || ''
    const alt = resolveProp(props, 'alt') || ''
    const width = resolveProp(props, 'width')
    const height = resolveProp(props, 'height')
    const sizes = resolveProp(props, 'sizes')
    const srcset = resolveProp(props, 'srcset')
    const densities = resolveProp(props, 'densities')
    const format = resolveProp(props, 'format')
    const placeholder = resolveProp(props, 'placeholder')
    const placeholderColor = resolveProp(props, 'placeholderColor') || '#e5e7eb'
    const provider = resolveProp(props, 'provider')
    const className = resolveProp(props, 'class') || resolveProp(props, 'className') || ''
    const style = resolveProp(props, 'style') || ''
    const quality = resolveProp(props, 'quality')

    const lazy = resolveBoolProp(props, 'lazy', true)
    const preload = resolveBoolProp(props, 'preload', false)
    const usePicture = resolveBoolProp(props, 'picture', false) || !!format

    const numWidth = width ? Number.parseInt(width) : undefined
    const numHeight = height ? Number.parseInt(height) : undefined

    // ── Build srcset ──────────────────────────────────────────────
    let finalSrcset = srcset || ''
    let finalSizes = ''

    if (!finalSrcset && sizes) {
      // Auto-generate responsive srcset from breakpoint sizes
      finalSrcset = generateSrcset(src, DEFAULT_SRCSET_WIDTHS, provider, format)
      finalSizes = parseSizes(sizes)
    }
    else if (!finalSrcset && densities) {
      // Density descriptors: "1x 2x 3x"
      const densityValues = densities.split(/\s+/).map(d => Number.parseFloat(d.replace('x', '')))
      finalSrcset = generateDensitySrcset(src, densityValues, numWidth, provider, format)
    }
    else if (sizes) {
      finalSizes = parseSizes(sizes)
    }

    // ── Aspect ratio for CLS prevention ──────────────────────────
    const styles: string[] = []
    if (style) styles.push(style)

    if (numWidth && numHeight) {
      styles.push(`aspect-ratio:${numWidth}/${numHeight}`)
    }

    // ── Placeholder ──────────────────────────────────────────────
    // `blur`, `color`, and `thumbhash` all fall through to a synthetic CSS
    // gradient at component-render time — the builtin doesn't have access
    // to actual source pixel data here. For a real per-image thumbhash
    // dataURL, run images through the @image directive (or build plugin)
    // which calls `generatePlaceholder({ placeholder: 'thumbhash' })` on
    // the actual source and stores the result; alternatively pass a
    // pre-computed `placeholder="data:image/png;base64,…"` URL directly.
    if (placeholder === 'blur' || placeholder === 'color' || placeholder === 'thumbhash') {
      const placeholderUrl = generateBlurPlaceholder(
        numWidth || 16,
        numHeight || 9,
        placeholderColor,
      )
      styles.push(`background-image:url(${placeholderUrl})`)
      styles.push('background-size:cover')
      styles.push('background-repeat:no-repeat')
    }
    else if (placeholder && placeholder !== 'empty' && placeholder !== 'none') {
      // Custom placeholder URL — accept any dataURL the consumer pre-computed
      // (e.g. a real thumbhash run through ts-images' `generatePlaceholder`
      // at build time).
      styles.push(`background-image:url(${escapeAttr(placeholder)})`)
      styles.push('background-size:cover')
      styles.push('background-repeat:no-repeat')
    }

    // ── Transform src for provider ───────────────────────────────
    const finalSrc = transformSrc(src, numWidth, numHeight, provider, format)

    // ── Build <img> attributes ───────────────────────────────────
    const imgAttrs: string[] = []

    imgAttrs.push(`src="${escapeAttr(finalSrc)}"`)
    imgAttrs.push(`alt="${escapeAttr(alt)}"`)

    if (width) imgAttrs.push(`width="${escapeAttr(width)}"`)
    if (height) imgAttrs.push(`height="${escapeAttr(height)}"`)
    if (lazy) imgAttrs.push('loading="lazy"')
    imgAttrs.push('decoding="async"')
    if (className) imgAttrs.push(`class="${escapeAttr(className)}"`)
    if (styles.length > 0) imgAttrs.push(`style="${escapeAttr(styles.join(';'))}"`)
    if (finalSrcset) imgAttrs.push(`srcset="${escapeAttr(finalSrcset)}"`)
    if (finalSizes) imgAttrs.push(`sizes="${escapeAttr(finalSizes)}"`)

    // Forward extra static attributes not consumed above
    const consumedStatic = new Set([
      'src', 'alt', 'width', 'height', 'lazy', 'sizes', 'srcset',
      'placeholder', 'placeholderColor', 'class', 'className', 'style',
      'format', 'provider', 'quality', 'densities', 'preload', 'picture',
    ])
    for (const [key, value] of Object.entries(props.static)) {
      if (consumedStatic.has(key)) continue
      if (typeof value === 'boolean') {
        if (value) imgAttrs.push(escapeAttr(key))
      }
      else {
        imgAttrs.push(`${escapeAttr(key)}="${escapeAttr(value)}"`)
      }
    }

    const imgTag = `<img ${imgAttrs.join(' ')} />`

    // ── Preload hint ─────────────────────────────────────────────
    let preloadTag = ''
    if (preload) {
      const preloadAs = 'image'
      const preloadType = format === 'webp' ? 'image/webp' : format === 'avif' ? 'image/avif' : ''
      preloadTag = `<link rel="preload" as="${preloadAs}" href="${escapeAttr(finalSrc)}"${preloadType ? ` type="${preloadType}"` : ''}${finalSrcset ? ` imagesrcset="${escapeAttr(finalSrcset)}"` : ''}${finalSizes ? ` imagesizes="${escapeAttr(finalSizes)}"` : ''} />\n`
    }

    // ── <picture> wrapper for format negotiation ─────────────────
    if (usePicture) {
      const sources: string[] = []

      // Add avif source if format is avif or auto
      if (format === 'avif' || format === 'auto') {
        const avifSrc = transformSrc(src, numWidth, numHeight, provider, 'avif')
        const avifSrcset = finalSrcset
          ? generateSrcset(src, DEFAULT_SRCSET_WIDTHS, provider, 'avif')
          : `${avifSrc}`
        sources.push(`<source type="image/avif" srcset="${escapeAttr(avifSrcset)}"${finalSizes ? ` sizes="${escapeAttr(finalSizes)}"` : ''} />`)
      }

      // Add webp source
      if (format === 'webp' || format === 'auto') {
        const webpSrc = transformSrc(src, numWidth, numHeight, provider, 'webp')
        const webpSrcset = finalSrcset
          ? generateSrcset(src, DEFAULT_SRCSET_WIDTHS, provider, 'webp')
          : `${webpSrc}`
        sources.push(`<source type="image/webp" srcset="${escapeAttr(webpSrcset)}"${finalSizes ? ` sizes="${escapeAttr(finalSizes)}"` : ''} />`)
      }

      return `${preloadTag}<picture>\n${sources.join('\n')}\n${imgTag}\n</picture>`
    }

    return `${preloadTag}${imgTag}`
  },
}
