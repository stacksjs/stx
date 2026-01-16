/**
 * STX Image Component
 *
 * Renders optimized responsive images with srcset, sizes, and lazy loading.
 */

import {
  type ImageFormat,
  type ImageVariant,
  type ProcessedImage,
  DEFAULT_FORMATS,
  DEFAULT_QUALITY,
  DEFAULT_WIDTHS,
  generateSrcSet,
  generateSizes,
  getFallbackVariant,
  groupVariantsByFormat,
  getMimeType,
} from './processor'

// ============================================================================
// Types
// ============================================================================

export interface ImageComponentProps {
  /** Source image path */
  src: string
  /** Alt text (required for accessibility) */
  alt: string
  /** Display width */
  width?: number | string
  /** Display height */
  height?: number | string
  /** Responsive sizes attribute */
  sizes?: string | Record<string, string>
  /** Loading strategy */
  loading?: 'lazy' | 'eager'
  /** Preload for above-fold images */
  priority?: boolean
  /** Output quality (1-100) */
  quality?: number
  /** Placeholder type */
  placeholder?: 'blur' | 'color' | 'none'
  /** Output formats */
  formats?: ImageFormat[]
  /** Output widths */
  widths?: number[]
  /** Additional CSS class */
  class?: string
  /** Inline styles */
  style?: string
  /** Decoding hint */
  decoding?: 'sync' | 'async' | 'auto'
  /** Fetch priority */
  fetchpriority?: 'high' | 'low' | 'auto'
  /** Object fit */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  /** Object position */
  objectPosition?: string
}

export interface ImageRenderContext {
  /** Processed image data (if pre-processed) */
  processedImage?: ProcessedImage
  /** Generated variants (if available) */
  variants?: ImageVariant[]
  /** Whether optimization is enabled */
  optimize?: boolean
  /** Development mode */
  isDev?: boolean
}

export interface ImageRenderResult {
  /** Generated HTML */
  html: string
  /** Preload link tag (if priority) */
  preloadLink?: string
  /** CSS for placeholder */
  placeholderCss?: string
}

// ============================================================================
// Image Component Renderer
// ============================================================================

/**
 * Render an optimized <Image> component
 */
export function renderImageComponent(
  props: ImageComponentProps,
  context: ImageRenderContext = {},
): ImageRenderResult {
  const {
    src,
    alt,
    width,
    height,
    sizes = '100vw',
    loading = 'lazy',
    priority = false,
    quality = DEFAULT_QUALITY,
    placeholder = 'none',
    formats = DEFAULT_FORMATS,
    widths = DEFAULT_WIDTHS,
    decoding = 'async',
    fetchpriority,
    objectFit,
    objectPosition,
  } = props

  const className = props.class
  const style = props.style
  const { processedImage, variants, optimize = true, isDev = false } = context

  // If we have processed variants, use them
  if (variants && variants.length > 0) {
    return renderPicture(props, variants, processedImage)
  }

  // In development or without optimization, render simple img
  if (isDev || !optimize) {
    return renderSimpleImg(props)
  }

  // Without pre-processed variants, render with data attributes for client-side handling
  return renderPlaceholder(props)
}

/**
 * Render full <picture> element with sources
 */
function renderPicture(
  props: ImageComponentProps,
  variants: ImageVariant[],
  processedImage?: ProcessedImage,
): ImageRenderResult {
  const {
    src,
    alt,
    width,
    height,
    sizes = '100vw',
    loading = 'lazy',
    priority = false,
    decoding = 'async',
    fetchpriority,
    objectFit,
    objectPosition,
    placeholder = 'none',
  } = props

  const className = props.class
  const style = props.style

  // Group variants by format
  const grouped = groupVariantsByFormat(variants)

  // Get fallback image
  const fallback = getFallbackVariant(variants)

  // Calculate sizes string
  const sizesAttr = typeof sizes === 'object' ? generateSizes(sizes) : sizes

  // Build aspect ratio style
  const aspectRatio = processedImage
    ? processedImage.aspectRatio
    : width && height
      ? Number(width) / Number(height)
      : undefined

  // Build style string
  const styleAttrs: string[] = []
  if (aspectRatio) styleAttrs.push(`aspect-ratio: ${aspectRatio}`)
  if (objectFit) styleAttrs.push(`object-fit: ${objectFit}`)
  if (objectPosition) styleAttrs.push(`object-position: ${objectPosition}`)
  if (style) styleAttrs.push(style)

  const styleAttr = styleAttrs.length > 0 ? ` style="${styleAttrs.join('; ')}"` : ''

  // Build class attribute
  const classAttr = className ? ` class="${className}"` : ''

  // Build loading attributes
  const loadingAttr = priority ? '' : ` loading="${loading}"`
  const decodingAttr = ` decoding="${decoding}"`
  const priorityAttr = fetchpriority ? ` fetchpriority="${fetchpriority}"` : (priority ? ' fetchpriority="high"' : '')

  // Build sources for each format (prefer modern formats first)
  const formatOrder: ImageFormat[] = ['avif', 'webp', 'jpeg', 'png']
  const sources: string[] = []

  for (const format of formatOrder) {
    const formatVariants = grouped.get(format)
    if (formatVariants && formatVariants.length > 0) {
      const srcset = generateSrcSet(formatVariants)
      const mimeType = getMimeType(format)
      sources.push(`  <source type="${mimeType}" srcset="${srcset}" sizes="${sizesAttr}" />`)
    }
  }

  // Build placeholder wrapper if needed
  let wrapperStart = ''
  let wrapperEnd = ''
  let placeholderCss: string | undefined

  if (placeholder !== 'none' && processedImage?.placeholder) {
    const placeholderId = `img-${Math.random().toString(36).slice(2, 8)}`
    wrapperStart = `<div class="stx-image-wrapper" id="${placeholderId}">`
    wrapperEnd = '</div>'

    if (placeholder === 'blur') {
      placeholderCss = `
#${placeholderId} {
  position: relative;
  background-image: url('${processedImage.placeholder}');
  background-size: cover;
  background-position: center;
}
#${placeholderId} img {
  transition: opacity 0.3s ease;
}
#${placeholderId}.loaded img {
  opacity: 1;
}
`.trim()
    }
    else if (placeholder === 'color') {
      placeholderCss = `
#${placeholderId} {
  background-color: ${processedImage.placeholder};
}
`.trim()
    }
  }

  // Build final HTML
  const widthAttr = width ? ` width="${width}"` : (processedImage ? ` width="${processedImage.width}"` : '')
  const heightAttr = height ? ` height="${height}"` : (processedImage ? ` height="${processedImage.height}"` : '')

  const html = `${wrapperStart}<picture>
${sources.join('\n')}
  <img
    src="${fallback?.url || src}"
    alt="${escapeHtml(alt)}"${widthAttr}${heightAttr}${classAttr}${styleAttr}${loadingAttr}${decodingAttr}${priorityAttr}
  />
</picture>${wrapperEnd}`

  // Build preload link for priority images
  let preloadLink: string | undefined
  if (priority && fallback) {
    // Preload the WebP version if available
    const webpVariants = grouped.get('webp')
    const preloadVariant = webpVariants?.[Math.floor(webpVariants.length / 2)] || fallback
    const mimeType = getMimeType(preloadVariant.format)

    preloadLink = `<link rel="preload" as="image" href="${preloadVariant.url}" type="${mimeType}" />`
  }

  return { html, preloadLink, placeholderCss }
}

/**
 * Render simple <img> tag (development mode)
 */
function renderSimpleImg(props: ImageComponentProps): ImageRenderResult {
  const {
    src,
    alt,
    width,
    height,
    loading = 'lazy',
    decoding = 'async',
    priority = false,
    fetchpriority,
    objectFit,
    objectPosition,
  } = props

  const className = props.class
  const style = props.style

  // Build style string
  const styleAttrs: string[] = []
  if (objectFit) styleAttrs.push(`object-fit: ${objectFit}`)
  if (objectPosition) styleAttrs.push(`object-position: ${objectPosition}`)
  if (style) styleAttrs.push(style)

  const styleAttr = styleAttrs.length > 0 ? ` style="${styleAttrs.join('; ')}"` : ''
  const classAttr = className ? ` class="${className}"` : ''
  const widthAttr = width ? ` width="${width}"` : ''
  const heightAttr = height ? ` height="${height}"` : ''
  const loadingAttr = priority ? '' : ` loading="${loading}"`
  const decodingAttr = ` decoding="${decoding}"`
  const priorityAttr = fetchpriority ? ` fetchpriority="${fetchpriority}"` : (priority ? ' fetchpriority="high"' : '')

  const html = `<img src="${src}" alt="${escapeHtml(alt)}"${widthAttr}${heightAttr}${classAttr}${styleAttr}${loadingAttr}${decodingAttr}${priorityAttr} />`

  return { html }
}

/**
 * Render placeholder with data attributes for client-side optimization
 */
function renderPlaceholder(props: ImageComponentProps): ImageRenderResult {
  const {
    src,
    alt,
    width,
    height,
    sizes = '100vw',
    loading = 'lazy',
    priority = false,
    quality = DEFAULT_QUALITY,
    formats = DEFAULT_FORMATS,
    widths = DEFAULT_WIDTHS,
    decoding = 'async',
    fetchpriority,
    objectFit,
    objectPosition,
  } = props

  const className = props.class
  const style = props.style

  // Build style string
  const styleAttrs: string[] = []
  if (objectFit) styleAttrs.push(`object-fit: ${objectFit}`)
  if (objectPosition) styleAttrs.push(`object-position: ${objectPosition}`)
  if (style) styleAttrs.push(style)

  const styleAttr = styleAttrs.length > 0 ? ` style="${styleAttrs.join('; ')}"` : ''
  const classAttr = className ? ` class="${className}"` : ''
  const widthAttr = width ? ` width="${width}"` : ''
  const heightAttr = height ? ` height="${height}"` : ''
  const loadingAttr = priority ? '' : ` loading="${loading}"`
  const decodingAttr = ` decoding="${decoding}"`
  const priorityAttr = fetchpriority ? ` fetchpriority="${fetchpriority}"` : (priority ? ' fetchpriority="high"' : '')

  // Data attributes for client-side processing
  const sizesAttr = typeof sizes === 'object' ? generateSizes(sizes) : sizes
  const dataAttrs = `
    data-stx-image
    data-src="${src}"
    data-sizes="${sizesAttr}"
    data-quality="${quality}"
    data-formats="${formats.join(',')}"
    data-widths="${widths.join(',')}"
  `.replace(/\s+/g, ' ').trim()

  const html = `<img src="${src}" alt="${escapeHtml(alt)}"${widthAttr}${heightAttr}${classAttr}${styleAttr}${loadingAttr}${decodingAttr}${priorityAttr} ${dataAttrs} />`

  return { html }
}

// ============================================================================
// Component Registration for STX
// ============================================================================

/**
 * Parse Image component from template
 */
export function parseImageComponent(content: string): ImageComponentProps | null {
  // Match <Image ... /> or <Image ...>...</Image>
  const match = content.match(/<Image\s+([^>]*?)\/?>/)
  if (!match) return null

  const attrsStr = match[1]
  const props: Partial<ImageComponentProps> = {}

  // Parse attributes
  const attrRegex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|(\{[^}]+\})))?/g
  let attrMatch: RegExpExecArray | null

  while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
    const [, name, doubleQuoted, singleQuoted, braced] = attrMatch
    const value = doubleQuoted ?? singleQuoted ?? braced ?? true

    switch (name) {
      case 'src':
        props.src = String(value)
        break
      case 'alt':
        props.alt = String(value)
        break
      case 'width':
        props.width = Number(value) || value
        break
      case 'height':
        props.height = Number(value) || value
        break
      case 'sizes':
        props.sizes = String(value)
        break
      case 'loading':
        props.loading = value as 'lazy' | 'eager'
        break
      case 'priority':
        props.priority = value === true || value === 'true'
        break
      case 'quality':
        props.quality = Number(value)
        break
      case 'placeholder':
        props.placeholder = value as 'blur' | 'color' | 'none'
        break
      case 'class':
        props.class = String(value)
        break
      case 'style':
        props.style = String(value)
        break
      case 'decoding':
        props.decoding = value as 'sync' | 'async' | 'auto'
        break
      case 'fetchpriority':
        props.fetchpriority = value as 'high' | 'low' | 'auto'
        break
      case 'objectFit':
        props.objectFit = value as ImageComponentProps['objectFit']
        break
      case 'objectPosition':
        props.objectPosition = String(value)
        break
    }
  }

  // Validate required props
  if (!props.src || !props.alt) {
    return null
  }

  return props as ImageComponentProps
}

/**
 * Process Image components in template content
 */
export async function processImageComponents(
  content: string,
  processor: (props: ImageComponentProps) => Promise<ImageRenderResult>,
): Promise<{ html: string; preloadLinks: string[]; styles: string[] }> {
  const imagePattern = /<Image\s+[^>]*?\/?>/g
  const preloadLinks: string[] = []
  const styles: string[] = []

  let result = content
  let match: RegExpExecArray | null

  // Find all Image components
  const matches: Array<{ match: string; index: number }> = []
  while ((match = imagePattern.exec(content)) !== null) {
    matches.push({ match: match[0], index: match.index })
  }

  // Process in reverse order to maintain indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const { match: imageTag } = matches[i]
    const props = parseImageComponent(imageTag)

    if (props) {
      const renderResult = await processor(props)
      result = result.replace(imageTag, renderResult.html)

      if (renderResult.preloadLink) {
        preloadLinks.push(renderResult.preloadLink)
      }
      if (renderResult.placeholderCss) {
        styles.push(renderResult.placeholderCss)
      }
    }
  }

  return { html: result, preloadLinks, styles }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
