/**
 * STX Head Management
 *
 * Manage document head (title, meta, links, scripts) with a simple API.
 *
 * @example
 * ```typescript
 * import { useHead, useSeoMeta, definePageMeta } from 'stx'
 *
 * // Full control
 * useHead({
 *   title: 'My Page',
 *   meta: [{ name: 'description', content: '...' }]
 * })
 *
 * // SEO shorthand
 * useSeoMeta({
 *   title: 'My Page',
 *   description: 'Page description',
 *   ogImage: '/og.png'
 * })
 *
 * // Page configuration
 * definePageMeta({
 *   title: 'My Page',
 *   layout: 'default'
 * })
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface MetaTag {
  name?: string
  property?: string
  content: string
  httpEquiv?: string
  charset?: string
}

export interface LinkTag {
  rel: string
  href: string
  type?: string
  sizes?: string
  crossorigin?: string
  as?: string
  media?: string
}

export interface ScriptTag {
  src?: string
  type?: string
  async?: boolean
  defer?: boolean
  content?: string
  id?: string
}

export interface HeadConfig {
  title?: string
  titleTemplate?: string | ((title: string) => string)
  base?: { href?: string; target?: string }
  meta?: MetaTag[]
  link?: LinkTag[]
  script?: ScriptTag[]
  style?: { content: string; type?: string }[]
  htmlAttrs?: Record<string, string>
  bodyAttrs?: Record<string, string>
}

export interface SeoMeta {
  title?: string
  titleTemplate?: string
  description?: string
  keywords?: string | string[]
  author?: string
  robots?: string
  canonical?: string
  // Open Graph
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  ogType?: string
  ogSiteName?: string
  ogLocale?: string
  // Twitter
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  twitterSite?: string
  twitterCreator?: string
  // Article (for blog posts)
  articleAuthor?: string
  articlePublishedTime?: string
  articleModifiedTime?: string
  articleSection?: string
  articleTags?: string[]
}

export interface PageMeta {
  title?: string
  description?: string
  layout?: string | false
  middleware?: string | string[]
  transition?: string | { name: string; mode?: string }
  keepAlive?: boolean
  key?: string | ((route: unknown) => string)
  [key: string]: unknown
}

// =============================================================================
// Head State
// =============================================================================

/** Current head configuration */
let currentHead: HeadConfig = {}

/** Head config stack for nested components */
const headStack: HeadConfig[] = []

/** Page meta for current page */
let currentPageMeta: PageMeta = {}

/**
 * Get the current accumulated head config.
 */
export function getHead(): HeadConfig {
  return currentHead
}

/**
 * Get current page meta.
 */
export function getPageMeta(): PageMeta {
  return currentPageMeta
}

/**
 * Reset head state (for SSR).
 */
export function resetHead(): void {
  currentHead = {}
  headStack.length = 0
  currentPageMeta = {}
}

// =============================================================================
// useHead
// =============================================================================

/**
 * Set document head configuration.
 *
 * @example
 * ```typescript
 * useHead({
 *   title: 'My Page',
 *   meta: [
 *     { name: 'description', content: 'Page description' },
 *     { property: 'og:image', content: '/og.png' }
 *   ],
 *   link: [
 *     { rel: 'canonical', href: 'https://example.com/page' }
 *   ],
 *   script: [
 *     { src: 'https://example.com/analytics.js', async: true }
 *   ]
 * })
 * ```
 */
export function useHead(config: HeadConfig): void {
  // Merge with current head
  currentHead = mergeHead(currentHead, config)
}

/**
 * Merge two head configs.
 */
function mergeHead(base: HeadConfig, override: HeadConfig): HeadConfig {
  return {
    title: override.title ?? base.title,
    titleTemplate: override.titleTemplate ?? base.titleTemplate,
    base: override.base ?? base.base,
    meta: [...(base.meta || []), ...(override.meta || [])],
    link: [...(base.link || []), ...(override.link || [])],
    script: [...(base.script || []), ...(override.script || [])],
    style: [...(base.style || []), ...(override.style || [])],
    htmlAttrs: { ...base.htmlAttrs, ...override.htmlAttrs },
    bodyAttrs: { ...base.bodyAttrs, ...override.bodyAttrs }
  }
}

// =============================================================================
// useSeoMeta
// =============================================================================

/**
 * Set SEO meta tags with a simplified API.
 *
 * @example
 * ```typescript
 * useSeoMeta({
 *   title: 'My Page',
 *   description: 'This is my awesome page',
 *   ogImage: 'https://example.com/og.png',
 *   twitterCard: 'summary_large_image'
 * })
 * ```
 */
export function useSeoMeta(config: SeoMeta): void {
  const meta: MetaTag[] = []

  // Basic meta
  if (config.description) {
    meta.push({ name: 'description', content: config.description })
  }
  if (config.keywords) {
    const keywords = Array.isArray(config.keywords)
      ? config.keywords.join(', ')
      : config.keywords
    meta.push({ name: 'keywords', content: keywords })
  }
  if (config.author) {
    meta.push({ name: 'author', content: config.author })
  }
  if (config.robots) {
    meta.push({ name: 'robots', content: config.robots })
  }

  // Open Graph
  const ogTitle = config.ogTitle ?? config.title
  const ogDescription = config.ogDescription ?? config.description

  if (ogTitle) {
    meta.push({ property: 'og:title', content: ogTitle })
  }
  if (ogDescription) {
    meta.push({ property: 'og:description', content: ogDescription })
  }
  if (config.ogImage) {
    meta.push({ property: 'og:image', content: config.ogImage })
  }
  if (config.ogUrl) {
    meta.push({ property: 'og:url', content: config.ogUrl })
  }
  if (config.ogType) {
    meta.push({ property: 'og:type', content: config.ogType })
  }
  if (config.ogSiteName) {
    meta.push({ property: 'og:site_name', content: config.ogSiteName })
  }
  if (config.ogLocale) {
    meta.push({ property: 'og:locale', content: config.ogLocale })
  }

  // Twitter
  const twitterTitle = config.twitterTitle ?? config.title
  const twitterDescription = config.twitterDescription ?? config.description
  const twitterImage = config.twitterImage ?? config.ogImage

  if (config.twitterCard) {
    meta.push({ name: 'twitter:card', content: config.twitterCard })
  }
  if (twitterTitle) {
    meta.push({ name: 'twitter:title', content: twitterTitle })
  }
  if (twitterDescription) {
    meta.push({ name: 'twitter:description', content: twitterDescription })
  }
  if (twitterImage) {
    meta.push({ name: 'twitter:image', content: twitterImage })
  }
  if (config.twitterSite) {
    meta.push({ name: 'twitter:site', content: config.twitterSite })
  }
  if (config.twitterCreator) {
    meta.push({ name: 'twitter:creator', content: config.twitterCreator })
  }

  // Article meta
  if (config.articleAuthor) {
    meta.push({ property: 'article:author', content: config.articleAuthor })
  }
  if (config.articlePublishedTime) {
    meta.push({ property: 'article:published_time', content: config.articlePublishedTime })
  }
  if (config.articleModifiedTime) {
    meta.push({ property: 'article:modified_time', content: config.articleModifiedTime })
  }
  if (config.articleSection) {
    meta.push({ property: 'article:section', content: config.articleSection })
  }
  if (config.articleTags) {
    for (const tag of config.articleTags) {
      meta.push({ property: 'article:tag', content: tag })
    }
  }

  // Canonical link
  const link: LinkTag[] = []
  if (config.canonical) {
    link.push({ rel: 'canonical', href: config.canonical })
  }

  // Apply to head
  useHead({
    title: config.title,
    titleTemplate: config.titleTemplate,
    meta,
    link
  })
}

// =============================================================================
// definePageMeta
// =============================================================================

/**
 * Define page-level metadata.
 *
 * @example
 * ```typescript
 * definePageMeta({
 *   title: 'Dashboard',
 *   layout: 'admin',
 *   middleware: ['auth', 'admin'],
 *   keepAlive: true
 * })
 * ```
 */
export function definePageMeta(config: PageMeta): void {
  currentPageMeta = { ...currentPageMeta, ...config }

  // Also set title/description in head
  if (config.title || config.description) {
    useSeoMeta({
      title: config.title,
      description: config.description
    })
  }
}

// =============================================================================
// useTitle
// =============================================================================

/**
 * Set just the page title.
 *
 * @example
 * ```typescript
 * useTitle('My Page')
 * useTitle(() => `${productName} - My Store`)
 * ```
 */
export function usePageTitle(title: string | (() => string)): void {
  const resolvedTitle = typeof title === 'function' ? title() : title
  useHead({ title: resolvedTitle })
}

// =============================================================================
// Head Rendering
// =============================================================================

/**
 * Render head config to HTML string.
 */
export function renderHead(config: HeadConfig = currentHead): string {
  const parts: string[] = []

  // Title
  if (config.title) {
    let title = config.title
    if (config.titleTemplate) {
      title = typeof config.titleTemplate === 'function'
        ? config.titleTemplate(title)
        : config.titleTemplate.replace('%s', title)
    }
    parts.push(`<title>${escapeHtml(title)}</title>`)
  }

  // Base
  if (config.base) {
    const attrs = Object.entries(config.base)
      .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
      .join(' ')
    parts.push(`<base ${attrs}>`)
  }

  // Meta tags
  for (const meta of config.meta || []) {
    const attrs = Object.entries(meta)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => {
        const key = k === 'httpEquiv' ? 'http-equiv' : k
        return `${key}="${escapeHtml(String(v))}"`
      })
      .join(' ')
    parts.push(`<meta ${attrs}>`)
  }

  // Link tags
  for (const link of config.link || []) {
    const attrs = Object.entries(link)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}="${escapeHtml(String(v))}"`)
      .join(' ')
    parts.push(`<link ${attrs}>`)
  }

  // Script tags
  for (const script of config.script || []) {
    const { content, ...attrs } = script
    const attrStr = Object.entries(attrs)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => {
        if (typeof v === 'boolean') return v ? k : ''
        return `${k}="${escapeHtml(String(v))}"`
      })
      .filter(Boolean)
      .join(' ')

    if (content) {
      parts.push(`<script ${attrStr}>${content}</script>`)
    } else {
      parts.push(`<script ${attrStr}></script>`)
    }
  }

  // Style tags
  for (const style of config.style || []) {
    const type = style.type ? ` type="${style.type}"` : ''
    parts.push(`<style${type}>${style.content}</style>`)
  }

  return parts.join('\n')
}

/**
 * Get HTML attributes string.
 */
export function renderHtmlAttrs(config: HeadConfig = currentHead): string {
  if (!config.htmlAttrs) return ''
  return Object.entries(config.htmlAttrs)
    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
    .join(' ')
}

/**
 * Get body attributes string.
 */
export function renderBodyAttrs(config: HeadConfig = currentHead): string {
  if (!config.bodyAttrs) return ''
  return Object.entries(config.bodyAttrs)
    .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
    .join(' ')
}

/**
 * Escape HTML entities.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// =============================================================================
// Client-side Head Updates
// =============================================================================

/**
 * Apply head config to the actual document (client-side).
 */
export function applyHead(config: HeadConfig = currentHead): void {
  if (typeof document === 'undefined') return

  // Update title
  if (config.title) {
    let title = config.title
    if (config.titleTemplate) {
      title = typeof config.titleTemplate === 'function'
        ? config.titleTemplate(title)
        : config.titleTemplate.replace('%s', title)
    }
    document.title = title
  }

  // Update meta tags
  for (const meta of config.meta || []) {
    const selector = meta.name
      ? `meta[name="${meta.name}"]`
      : meta.property
        ? `meta[property="${meta.property}"]`
        : null

    if (selector) {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        if (meta.name) el.setAttribute('name', meta.name)
        if (meta.property) el.setAttribute('property', meta.property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', meta.content)
    }
  }

  // Update link tags
  for (const link of config.link || []) {
    const selector = `link[rel="${link.rel}"]${link.href ? `[href="${link.href}"]` : ''}`
    let el = document.querySelector(selector)
    if (!el) {
      el = document.createElement('link')
      document.head.appendChild(el)
    }
    for (const [key, value] of Object.entries(link)) {
      if (value !== undefined) {
        el.setAttribute(key, String(value))
      }
    }
  }

  // Update html attributes
  if (config.htmlAttrs) {
    for (const [key, value] of Object.entries(config.htmlAttrs)) {
      document.documentElement.setAttribute(key, value)
    }
  }

  // Update body attributes
  if (config.bodyAttrs) {
    for (const [key, value] of Object.entries(config.bodyAttrs)) {
      document.body.setAttribute(key, value)
    }
  }
}

// =============================================================================
// Template Directive Processing
// =============================================================================

/**
 * Process @head directive.
 *
 * @example
 * ```html
 * @head
 *   <title>My Page</title>
 *   <meta name="description" content="...">
 * @endhead
 * ```
 */
export function processHeadDirective(content: string): { content: string; headContent: string } {
  let headContent = ''

  const processed = content.replace(
    /@head\s*([\s\S]*?)@endhead/g,
    (_, inner) => {
      headContent += inner.trim() + '\n'
      return ''
    }
  )

  return { content: processed, headContent: headContent.trim() }
}

/**
 * Process @title directive.
 *
 * @example
 * ```html
 * @title('My Page Title')
 * @title(pageTitle)
 * ```
 */
export function processTitleDirective(
  content: string,
  context: Record<string, unknown>
): string {
  return content.replace(
    /@title\s*\(\s*(['"`]?)([^)]+)\1\s*\)/g,
    (_, quote, title) => {
      // If quoted, use literal string; otherwise evaluate from context
      const resolvedTitle = quote
        ? title
        : (context[title.trim()] as string) ?? title
      useHead({ title: resolvedTitle })
      return ''
    }
  )
}

/**
 * Process @meta directive.
 *
 * @example
 * ```html
 * @meta('description', 'Page description')
 * @meta('og:image', ogImageUrl)
 * ```
 */
export function processMetaDirective(
  content: string,
  context: Record<string, unknown>
): string {
  return content.replace(
    /@meta\s*\(\s*(['"`])([^'"]+)\1\s*,\s*(['"`]?)([^)]+)\3\s*\)/g,
    (_, _q1, name, q2, value) => {
      const resolvedValue = q2
        ? value
        : (context[value.trim()] as string) ?? value

      const isProperty = name.includes(':')
      const meta: MetaTag = isProperty
        ? { property: name, content: resolvedValue }
        : { name, content: resolvedValue }

      useHead({ meta: [meta] })
      return ''
    }
  )
}

// =============================================================================
// Exports
// =============================================================================

export {
  usePageTitle as useTitle
}
