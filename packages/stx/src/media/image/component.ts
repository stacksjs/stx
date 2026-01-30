/**
 * STX Media - Image Component
 *
 * Render optimized responsive images with srcset, lazy loading,
 * and blur-up placeholder effects.
 *
 * @module media/image/component
 */

import type {
  ImageFormat,
  ImageRenderContext,
  ImageRenderResult,
  ImgProps,
  PlaceholderResult,
  EnhancedImgProps,
  TsImagesConfig,
  ProcessedImageResult,
  ResponsiveVariantSet,
} from '../types'
import {
  DEFAULT_FORMATS,
  DEFAULT_WIDTHS,
  generateSizesAttribute,
  generateWidthSrcset,
  generateDprSrcset,
  getMimeType,
  buildImageUrl,
} from './srcset'
import {
  getCachedPlaceholder,
  generatePlaceholderCSS,
  BLUR_UP_CSS,
} from './placeholder'

// =============================================================================
// ts-images Integration
// =============================================================================

/**
 * Lazy import processor to avoid blocking module initialization
 */
async function getProcessor(): Promise<typeof import('./processor') | null> {
  try {
    return await import('./processor')
  } catch (error) {
    // Log warning only once per session
    if (!processorWarningLogged) {
      console.warn('[stx-media] Image processor not available, some features disabled:', error)
      processorWarningLogged = true
    }
    return null
  }
}

let processorWarningLogged = false

/**
 * Extended image render context with ts-images config
 */
export interface ExtendedImageRenderContext extends ImageRenderContext {
  /** ts-images configuration */
  tsImagesConfig?: TsImagesConfig
  /** Processed image result (pre-computed) */
  processedResult?: ProcessedImageResult
  /** Responsive variants (pre-computed) */
  responsiveVariants?: ResponsiveVariantSet
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_QUALITY = 80
const DEFAULT_DECODING = 'async'
const DEFAULT_LOADING = 'lazy'

// Global CSS injection tracker
let cssInjected = false

// =============================================================================
// Component Rendering
// =============================================================================

/**
 * Render an optimized <Img> component
 *
 * Supports both standard ImgProps and EnhancedImgProps with ts-images integration.
 *
 * @example
 * ```typescript
 * // Standard usage
 * const result = await renderImgComponent({
 *   src: '/images/hero.jpg',
 *   alt: 'Hero image',
 *   sizes: '(max-width: 768px) 100vw, 50vw',
 *   placeholder: 'thumbhash',
 *   lazy: true,
 * })
 *
 * // With ts-images processing
 * const result = await renderImgComponent({
 *   src: '/images/hero.jpg',
 *   alt: 'Hero image',
 *   process: true,
 *   preset: 'web',
 *   responsiveWidths: [320, 640, 1024, 1920],
 * }, { tsImagesConfig: { enabled: true, outputDir: 'dist/images' } })
 * ```
 */
export async function renderImgComponent(
  props: ImgProps | EnhancedImgProps,
  context: ImageRenderContext | ExtendedImageRenderContext = {},
): Promise<ImageRenderResult> {
  const extendedContext = context as ExtendedImageRenderContext
  const enhancedProps = props as EnhancedImgProps

  // Check if ts-images processing is requested
  if (enhancedProps.process && !enhancedProps.skipOptimization) {
    const tsImagesConfig = extendedContext.tsImagesConfig
    if (tsImagesConfig?.enabled && !extendedContext.isDev) {
      return renderWithTsImages(enhancedProps, extendedContext)
    }
  }

  // Check if we have pre-computed processed results
  if (extendedContext.processedResult?.processed) {
    return renderFromProcessedResult(props, extendedContext.processedResult, context)
  }

  // Check if we have pre-computed responsive variants
  if (extendedContext.responsiveVariants) {
    return renderFromResponsiveVariants(props, extendedContext.responsiveVariants, context)
  }

  const {
    src,
    alt,
    width,
    height,
    sizes,
    widths = DEFAULT_WIDTHS,
    dpr,
    formats = DEFAULT_FORMATS,
    quality = DEFAULT_QUALITY,
    params = {},
    placeholder: placeholderStrategy = 'none',
    placeholderOptions = {},
    lazy = true,
    priority = false,
    loading = priority ? 'eager' : DEFAULT_LOADING,
    decoding = DEFAULT_DECODING,
    fetchpriority,
    objectFit,
    objectPosition,
    crossorigin,
    referrerpolicy,
  } = props

  const className = props.class
  const style = props.style
  const id = props.id
  const dataAttrs = props.data || {}

  const { isDev = false, baseUrl = '' } = context

  // In development mode without optimization, render simple img
  if (isDev && !context.optimize) {
    return renderSimpleImg(props)
  }

  // Generate placeholder if needed
  let placeholder: PlaceholderResult | undefined
  let placeholderCss: string | undefined
  const componentId = id || `stx-img-${Math.random().toString(36).slice(2, 8)}`

  if (placeholderStrategy !== 'none' && !priority) {
    try {
      placeholder = await getCachedPlaceholder(src, {
        strategy: placeholderStrategy,
        ...placeholderOptions,
      })
      placeholderCss = generatePlaceholderCSS(componentId, placeholder, placeholderOptions)
    } catch {
      // Continue without placeholder
    }
  }

  // Determine if using DPR-based or width-based srcset
  const usesDprSrcset = dpr !== undefined && width !== undefined

  // Build the HTML
  let html: string

  if (usesDprSrcset) {
    // DPR-based srcset for fixed-width images
    html = renderDprBasedImg(props, componentId, placeholder, context)
  } else {
    // Width-based srcset with <picture> element
    html = await renderPictureElement(props, componentId, placeholder, context)
  }

  // Build preload link for priority images
  let preloadLink: string | undefined
  if (priority) {
    const fallbackFormat = formats.includes('webp') ? 'webp' : formats[0]
    const preloadSrcset = generateWidthSrcset(src, widths, { ...params, q: quality }, fallbackFormat)
    const sizesAttr = typeof sizes === 'object' ? generateSizesAttribute(sizes) : (sizes || '100vw')
    preloadLink = `<link rel="preload" as="image" imagesrcset="${preloadSrcset}" imagesizes="${sizesAttr}" />`
  }

  // Collect CSS (include global blur-up styles once)
  const cssStyles: string[] = []
  if (!cssInjected && placeholderStrategy !== 'none') {
    cssStyles.push(BLUR_UP_CSS)
    cssInjected = true
  }
  if (placeholderCss) {
    cssStyles.push(placeholderCss)
  }

  // Generate client script for lazy loading
  const script = lazy ? generateLazyLoadScript(componentId) : undefined

  return {
    html,
    preloadLink,
    css: cssStyles.length > 0 ? cssStyles.join('\n') : undefined,
    script,
  }
}

/**
 * Render a <picture> element with multiple sources
 */
async function renderPictureElement(
  props: ImgProps,
  componentId: string,
  placeholder: PlaceholderResult | undefined,
  context: ImageRenderContext,
): Promise<string> {
  const {
    src,
    alt,
    width,
    height,
    sizes,
    widths = DEFAULT_WIDTHS,
    formats = DEFAULT_FORMATS,
    quality = DEFAULT_QUALITY,
    params = {},
    lazy = true,
    priority = false,
    loading = priority ? 'eager' : DEFAULT_LOADING,
    decoding = DEFAULT_DECODING,
    fetchpriority,
    objectFit,
    objectPosition,
    crossorigin,
    referrerpolicy,
  } = props

  const className = props.class
  const style = props.style
  const dataAttrs = props.data || {}

  // Calculate sizes attribute
  const sizesAttr = typeof sizes === 'object' ? generateSizesAttribute(sizes) : (sizes || '100vw')

  // Generate sources for each format (in order of preference)
  const sources: string[] = []
  for (const format of formats) {
    const srcset = generateWidthSrcset(src, widths, { ...params, q: quality }, format)
    const mimeType = getMimeType(format)

    if (lazy && !priority) {
      // Lazy loading: use data-srcset
      sources.push(`  <source type="${mimeType}" data-srcset="${srcset}" data-sizes="${sizesAttr}" />`)
    } else {
      sources.push(`  <source type="${mimeType}" srcset="${srcset}" sizes="${sizesAttr}" />`)
    }
  }

  // Build fallback img attributes
  const imgAttrs = buildImgAttributes({
    src: buildImageUrl(src, { ...params, q: quality }),
    alt,
    width,
    height,
    loading: priority ? undefined : loading,
    decoding,
    fetchpriority: priority ? 'high' : fetchpriority,
    objectFit,
    objectPosition,
    crossorigin,
    referrerpolicy,
    className: buildClassName(className, placeholder),
    style: buildStyle(style, objectFit, objectPosition, placeholder),
    lazy: lazy && !priority,
    data: dataAttrs,
  })

  // Build wrapper if using placeholder
  let html: string
  if (placeholder) {
    const wrapperStyle = `background-image: url('${placeholder.dataURL}'); background-size: cover; background-position: center;`
    html = `<div id="${componentId}" class="stx-img-placeholder" style="${wrapperStyle}">
  <picture>
${sources.join('\n')}
    <img ${imgAttrs} />
  </picture>
</div>`
  } else {
    html = `<picture${componentId ? ` id="${componentId}"` : ''}>
${sources.join('\n')}
  <img ${imgAttrs} />
</picture>`
  }

  return html
}

/**
 * Render DPR-based img element for fixed-width images
 */
function renderDprBasedImg(
  props: ImgProps,
  componentId: string,
  placeholder: PlaceholderResult | undefined,
  context: ImageRenderContext,
): string {
  const {
    src,
    alt,
    width,
    height,
    dpr = [1, 2, 3],
    quality = DEFAULT_QUALITY,
    params = {},
    lazy = true,
    priority = false,
    loading = priority ? 'eager' : DEFAULT_LOADING,
    decoding = DEFAULT_DECODING,
    fetchpriority,
    objectFit,
    objectPosition,
    crossorigin,
    referrerpolicy,
  } = props

  const className = props.class
  const style = props.style
  const dataAttrs = props.data || {}

  const numericWidth = typeof width === 'number' ? width : Number.parseInt(String(width), 10)
  const srcset = generateDprSrcset(src, numericWidth, dpr, { ...params, q: quality })

  const imgAttrs = buildImgAttributes({
    src: buildImageUrl(src, { ...params, w: numericWidth, q: quality }),
    alt,
    width,
    height,
    loading: priority ? undefined : loading,
    decoding,
    fetchpriority: priority ? 'high' : fetchpriority,
    objectFit,
    objectPosition,
    crossorigin,
    referrerpolicy,
    className: buildClassName(className, placeholder),
    style: buildStyle(style, objectFit, objectPosition, placeholder),
    lazy: lazy && !priority,
    data: dataAttrs,
  })

  const srcsetAttr = lazy && !priority ? `data-srcset="${srcset}"` : `srcset="${srcset}"`

  if (placeholder) {
    const wrapperStyle = `background-image: url('${placeholder.dataURL}'); background-size: cover; background-position: center;`
    return `<div id="${componentId}" class="stx-img-placeholder" style="${wrapperStyle}">
  <img ${imgAttrs} ${srcsetAttr} />
</div>`
  }

  return `<img ${componentId ? `id="${componentId}" ` : ''}${imgAttrs} ${srcsetAttr} />`
}

/**
 * Render a simple <img> tag (development fallback)
 */
function renderSimpleImg(props: ImgProps): ImageRenderResult {
  const {
    src,
    alt,
    width,
    height,
    loading = DEFAULT_LOADING,
    decoding = DEFAULT_DECODING,
    fetchpriority,
    objectFit,
    objectPosition,
    crossorigin,
    referrerpolicy,
    priority = false,
  } = props

  const className = props.class
  const style = props.style
  const id = props.id
  const dataAttrs = props.data || {}

  const imgAttrs = buildImgAttributes({
    src,
    alt,
    width,
    height,
    loading: priority ? undefined : loading,
    decoding,
    fetchpriority: priority ? 'high' : fetchpriority,
    objectFit,
    objectPosition,
    crossorigin,
    referrerpolicy,
    className,
    style: buildStyle(style, objectFit, objectPosition),
    id,
    data: dataAttrs,
  })

  return {
    html: `<img ${imgAttrs} />`,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

interface ImgAttrsOptions {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  loading?: 'lazy' | 'eager'
  decoding?: 'sync' | 'async' | 'auto'
  fetchpriority?: 'high' | 'low' | 'auto'
  objectFit?: string
  objectPosition?: string
  crossorigin?: 'anonymous' | 'use-credentials'
  referrerpolicy?: string
  className?: string
  style?: string
  id?: string
  lazy?: boolean
  data?: Record<string, string>
}

/**
 * Build img element attributes string
 */
function buildImgAttributes(opts: ImgAttrsOptions): string {
  const attrs: string[] = []

  // Required attributes
  if (opts.lazy) {
    attrs.push(`data-src="${escapeAttr(opts.src)}"`)
    attrs.push(`src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"`)
  } else {
    attrs.push(`src="${escapeAttr(opts.src)}"`)
  }
  attrs.push(`alt="${escapeAttr(opts.alt)}"`)

  // Optional attributes
  if (opts.width) attrs.push(`width="${opts.width}"`)
  if (opts.height) attrs.push(`height="${opts.height}"`)
  if (opts.loading) attrs.push(`loading="${opts.loading}"`)
  if (opts.decoding) attrs.push(`decoding="${opts.decoding}"`)
  if (opts.fetchpriority) attrs.push(`fetchpriority="${opts.fetchpriority}"`)
  if (opts.crossorigin) attrs.push(`crossorigin="${opts.crossorigin}"`)
  if (opts.referrerpolicy) attrs.push(`referrerpolicy="${opts.referrerpolicy}"`)
  if (opts.className) attrs.push(`class="${escapeAttr(opts.className)}"`)
  if (opts.style) attrs.push(`style="${escapeAttr(opts.style)}"`)
  if (opts.id) attrs.push(`id="${escapeAttr(opts.id)}"`)

  // Data attributes
  if (opts.data) {
    for (const [key, value] of Object.entries(opts.data)) {
      attrs.push(`data-${key}="${escapeAttr(value)}"`)
    }
  }

  // Lazy loading marker
  if (opts.lazy) {
    attrs.push('data-stx-lazy')
  }

  return attrs.join(' ')
}

/**
 * Build className with placeholder class
 */
function buildClassName(className?: string, placeholder?: PlaceholderResult): string {
  const classes: string[] = []
  if (className) classes.push(className)
  if (placeholder) classes.push('stx-img-blur')
  return classes.join(' ') || ''
}

/**
 * Build style string with object-fit
 */
function buildStyle(
  style?: string,
  objectFit?: string,
  objectPosition?: string,
  placeholder?: PlaceholderResult,
): string {
  const styles: string[] = []
  if (objectFit) styles.push(`object-fit: ${objectFit}`)
  if (objectPosition) styles.push(`object-position: ${objectPosition}`)
  if (placeholder) styles.push('opacity: 0; transition: opacity 300ms ease-out')
  if (style) styles.push(style)
  return styles.join('; ')
}

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

/**
 * Generate lazy load initialization script
 */
function generateLazyLoadScript(componentId: string): string {
  return `
(function() {
  const container = document.getElementById('${componentId}');
  if (!container) return;

  const img = container.querySelector('img[data-stx-lazy]') || container;
  if (!img.dataset.src && !img.dataset.srcset) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Load image
        if (img.dataset.src) img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;

        // Load sources
        const sources = container.querySelectorAll('source[data-srcset]');
        sources.forEach(source => {
          if (source.dataset.srcset) source.srcset = source.dataset.srcset;
          if (source.dataset.sizes) source.sizes = source.dataset.sizes;
        });

        // Handle load completion
        img.onload = () => {
          img.style.opacity = '1';
          if (container.classList.contains('stx-img-placeholder')) {
            container.classList.add('stx-img-loaded');
          }
        };

        observer.disconnect();
      }
    });
  }, { rootMargin: '50px' });

  observer.observe(container);
})();
`.trim()
}

// =============================================================================
// Component Parser (for <Img> tags in templates)
// =============================================================================

/**
 * Parse <Img> component from template content
 */
export function parseImgComponent(content: string): ImgProps | null {
  const match = content.match(/<Img\s+([^>]*?)\/?>/)
  if (!match) return null

  const attrsStr = match[1]
  const props: Partial<ImgProps> = {}

  // Parse attributes
  const attrRegex = /(:?)(\w+)(?:=(?:"([^"]*)"|'([^']*)'|\{([^}]+)\}))?/g
  let attrMatch: RegExpExecArray | null

  while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
    const [, binding, name, doubleQuoted, singleQuoted, braced] = attrMatch
    const value = doubleQuoted ?? singleQuoted ?? braced ?? true
    const isBound = binding === ':'

    // Handle bound values (would need context evaluation)
    if (isBound && typeof value === 'string') {
      try {
        ;(props as Record<string, unknown>)[name] = JSON.parse(value)
      } catch {
        ;(props as Record<string, unknown>)[name] = value
      }
    } else {
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
        case 'quality':
          props.quality = Number(value)
          break
        case 'placeholder':
          props.placeholder = value as ImgProps['placeholder']
          break
        case 'lazy':
          props.lazy = value === true || value === 'true'
          break
        case 'priority':
          props.priority = value === true || value === 'true'
          break
        case 'class':
          props.class = String(value)
          break
        case 'style':
          props.style = String(value)
          break
        case 'id':
          props.id = String(value)
          break
        case 'loading':
          props.loading = value as 'lazy' | 'eager'
          break
        case 'decoding':
          props.decoding = value as 'sync' | 'async' | 'auto'
          break
        case 'fetchpriority':
          props.fetchpriority = value as 'high' | 'low' | 'auto'
          break
        case 'objectFit':
          props.objectFit = value as ImgProps['objectFit']
          break
        case 'objectPosition':
          props.objectPosition = String(value)
          break
        case 'crossorigin':
          props.crossorigin = value as 'anonymous' | 'use-credentials'
          break
      }
    }
  }

  // Validate required props
  if (!props.src || !props.alt) {
    return null
  }

  return props as ImgProps
}

/**
 * Process all <Img> components in template content
 */
export async function processImgComponents(
  content: string,
  context: ImageRenderContext = {},
): Promise<{ html: string; preloadLinks: string[]; styles: string[]; scripts: string[] }> {
  const imgPattern = /<Img\s+[^>]*?\/?>/g
  const preloadLinks: string[] = []
  const styles: string[] = []
  const scripts: string[] = []

  let result = content
  const matches: Array<{ match: string; index: number }> = []
  let match: RegExpExecArray | null

  while ((match = imgPattern.exec(content)) !== null) {
    matches.push({ match: match[0], index: match.index })
  }

  // Process in reverse order to maintain indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const { match: imgTag } = matches[i]
    const props = parseImgComponent(imgTag)

    if (props) {
      const renderResult = await renderImgComponent(props, context)
      result = result.replace(imgTag, renderResult.html)

      if (renderResult.preloadLink) {
        preloadLinks.push(renderResult.preloadLink)
      }
      if (renderResult.css) {
        styles.push(renderResult.css)
      }
      if (renderResult.script) {
        scripts.push(renderResult.script)
      }
    }
  }

  return { html: result, preloadLinks, styles, scripts }
}

// =============================================================================
// ts-images Integration Functions
// =============================================================================

/**
 * Render image using ts-images processor
 */
async function renderWithTsImages(
  props: EnhancedImgProps,
  context: ExtendedImageRenderContext,
): Promise<ImageRenderResult> {
  const processor = await getProcessor()
  if (!processor) {
    // Fallback to standard rendering
    return renderImgComponent({ ...props, process: false } as ImgProps, context)
  }

  const tsConfig = context.tsImagesConfig!

  // Determine if we need responsive variants or single image
  const needsResponsive = (props.responsiveWidths && props.responsiveWidths.length > 0) ||
    (props.widths && props.widths.length > 0) ||
    (!props.width && !props.dpr)

  if (needsResponsive) {
    // Generate responsive variants
    const variants = await processor.generateResponsiveVariants(props.src, props, tsConfig)
    if (variants) {
      return renderFromResponsiveVariants(props, variants, context)
    }
  } else {
    // Process single image
    const processed = await processor.processImage(props.src, props, tsConfig)
    if (processed.processed) {
      return renderFromProcessedResult(props, processed, context)
    }
  }

  // Fallback if processing failed
  return renderImgComponent({ ...props, process: false } as ImgProps, context)
}

/**
 * Render from pre-processed result
 */
async function renderFromProcessedResult(
  props: ImgProps | EnhancedImgProps,
  processed: ProcessedImageResult,
  context: ImageRenderContext,
): Promise<ImageRenderResult> {
  const {
    alt,
    width,
    height,
    lazy = true,
    priority = false,
    objectFit,
    objectPosition,
    crossorigin,
    referrerpolicy,
  } = props

  const className = props.class
  const style = props.style
  const id = props.id || `stx-img-${Math.random().toString(36).slice(2, 8)}`
  const dataAttrs = props.data || {}

  // Get best variant for fallback
  const variants = processed.variants || []
  const fallbackVariant = variants.find(v => v.format === 'jpeg') ||
    variants.find(v => v.format === 'webp') ||
    variants[0]

  const fallbackSrc = fallbackVariant?.url || props.src

  // Build srcset from variants
  const srcset = variants
    .filter(v => v.format === (fallbackVariant?.format || 'jpeg'))
    .map(v => `${v.url} ${v.width}w`)
    .join(', ')

  // Group variants by format for picture element
  const formatGroups = new Map<string, typeof variants>()
  for (const variant of variants) {
    if (!formatGroups.has(variant.format)) {
      formatGroups.set(variant.format, [])
    }
    formatGroups.get(variant.format)!.push(variant)
  }

  // Build sources for picture element
  const sources: string[] = []
  const formatOrder = ['avif', 'webp', 'jpeg', 'png']
  for (const format of formatOrder) {
    const formatVariants = formatGroups.get(format)
    if (formatVariants && formatVariants.length > 0) {
      const formatSrcset = formatVariants.map(v => `${v.url} ${v.width}w`).join(', ')
      const mimeType = getMimeType(format as any)

      if (lazy && !priority) {
        sources.push(`  <source type="${mimeType}" data-srcset="${formatSrcset}" />`)
      } else {
        sources.push(`  <source type="${mimeType}" srcset="${formatSrcset}" />`)
      }
    }
  }

  // Build img attributes
  const imgAttrs: string[] = []

  if (lazy && !priority) {
    imgAttrs.push(`data-src="${escapeAttr(fallbackSrc)}"`)
    imgAttrs.push(`src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"`)
    if (srcset) imgAttrs.push(`data-srcset="${srcset}"`)
  } else {
    imgAttrs.push(`src="${escapeAttr(fallbackSrc)}"`)
    if (srcset) imgAttrs.push(`srcset="${srcset}"`)
  }

  imgAttrs.push(`alt="${escapeAttr(alt)}"`)

  // Use processed dimensions if available
  const imgWidth = width || processed.originalWidth
  const imgHeight = height || processed.originalHeight
  if (imgWidth) imgAttrs.push(`width="${imgWidth}"`)
  if (imgHeight) imgAttrs.push(`height="${imgHeight}"`)

  if (!priority) imgAttrs.push(`loading="${lazy ? 'lazy' : 'eager'}"`)
  imgAttrs.push('decoding="async"')
  if (priority) imgAttrs.push('fetchpriority="high"')
  if (crossorigin) imgAttrs.push(`crossorigin="${crossorigin}"`)
  if (referrerpolicy) imgAttrs.push(`referrerpolicy="${referrerpolicy}"`)

  // Build style
  const styleProps: string[] = []
  if (objectFit) styleProps.push(`object-fit: ${objectFit}`)
  if (objectPosition) styleProps.push(`object-position: ${objectPosition}`)
  if (processed.placeholder && lazy) styleProps.push('opacity: 0; transition: opacity 300ms ease-out')
  if (style) styleProps.push(style)
  if (styleProps.length > 0) imgAttrs.push(`style="${styleProps.join('; ')}"`)

  // Build class
  const classNames: string[] = []
  if (className) classNames.push(className)
  if (processed.placeholder) classNames.push('stx-img-blur')
  if (classNames.length > 0) imgAttrs.push(`class="${classNames.join(' ')}"`)

  if (lazy && !priority) imgAttrs.push('data-stx-lazy')

  for (const [key, value] of Object.entries(dataAttrs)) {
    imgAttrs.push(`data-${key}="${escapeAttr(value)}"`)
  }

  // Build HTML
  let html: string
  if (processed.placeholder || (processed.dominantColor && (props as EnhancedImgProps).useDominantColor)) {
    const bgStyle = processed.placeholder
      ? `background-image: url('${processed.placeholder}'); background-size: cover; background-position: center;`
      : `background-color: ${processed.dominantColor};`

    html = `<div id="${id}" class="stx-img-placeholder" style="${bgStyle}">
  <picture>
${sources.join('\n')}
    <img ${imgAttrs.join(' ')} />
  </picture>
</div>`
  } else {
    html = `<picture${id ? ` id="${id}"` : ''}>
${sources.join('\n')}
  <img ${imgAttrs.join(' ')} />
</picture>`
  }

  // Collect CSS
  const cssStyles: string[] = []
  if (processed.placeholder) {
    cssStyles.push(BLUR_UP_CSS)
  }

  // Generate lazy load script
  const script = lazy ? generateLazyLoadScript(id) : undefined

  // Generate preload link for priority images
  let preloadLink: string | undefined
  if (priority && srcset) {
    preloadLink = `<link rel="preload" as="image" imagesrcset="${srcset}" />`
  }

  return {
    html,
    preloadLink,
    css: cssStyles.length > 0 ? cssStyles.join('\n') : undefined,
    script,
  }
}

/**
 * Render from responsive variants
 */
async function renderFromResponsiveVariants(
  props: ImgProps | EnhancedImgProps,
  variants: ResponsiveVariantSet,
  context: ImageRenderContext,
): Promise<ImageRenderResult> {
  // Convert to processed result format and use that renderer
  const processed: ProcessedImageResult = {
    src: variants.src,
    processed: true,
    variants: [],
    placeholder: variants.placeholder?.dataURL,
    originalWidth: variants.placeholder?.width,
    originalHeight: variants.placeholder?.height,
  }

  // Flatten all format variants
  for (const [format, formatVariants] of Object.entries(variants.byFormat)) {
    if (formatVariants) {
      processed.variants!.push(...formatVariants as any)
    }
  }

  return renderFromProcessedResult(props, processed, context)
}

/**
 * Generate lazy load initialization script
 */
function generateLazyLoadScript(componentId: string): string {
  return `
(function() {
  const container = document.getElementById('${componentId}');
  if (!container) return;

  const img = container.querySelector('img[data-stx-lazy]') || container;
  if (!img.dataset.src && !img.dataset.srcset) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Load image
        if (img.dataset.src) img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;

        // Load sources
        const sources = container.querySelectorAll('source[data-srcset]');
        sources.forEach(source => {
          if (source.dataset.srcset) source.srcset = source.dataset.srcset;
          if (source.dataset.sizes) source.sizes = source.dataset.sizes;
        });

        // Handle load completion
        img.onload = () => {
          img.style.opacity = '1';
          if (container.classList.contains('stx-img-placeholder')) {
            container.classList.add('stx-img-loaded');
          }
        };

        observer.disconnect();
      }
    });
  }, { rootMargin: '50px' });

  observer.observe(container);
})();
`.trim()
}
