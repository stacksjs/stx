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
 * @example
 * ```typescript
 * const result = await renderImgComponent({
 *   src: '/images/hero.jpg',
 *   alt: 'Hero image',
 *   sizes: '(max-width: 768px) 100vw, 50vw',
 *   placeholder: 'thumbhash',
 *   lazy: true,
 * })
 * console.log(result.html)
 * ```
 */
export async function renderImgComponent(
  props: ImgProps,
  context: ImageRenderContext = {},
): Promise<ImageRenderResult> {
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
