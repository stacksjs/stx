/**
 * SEO (Search Engine Optimization) Module
 *
 * Provides directives and utilities for generating SEO-related HTML:
 * - `@meta('name', 'content')` - Generate meta tags
 * - `@metaTag({ name, property, content })` - Meta tags with full control
 * - `@structuredData({ ... })` - JSON-LD structured data
 * - `@seo({ title, description, ... })` - Comprehensive SEO generation
 *
 * Also provides:
 * - Automatic SEO tag injection via `injectSeoTags()`
 * - Sitemap generation via `generateSitemap()`, `scanForSitemapEntries()`
 * - robots.txt generation via `generateRobotsTxt()`
 *
 * ## Sitemap Generation
 *
 * ```typescript
 * import { generateSitemap, scanForSitemapEntries } from 'stx'
 *
 * // Manual entries
 * const sitemap = generateSitemap([
 *   { loc: '/', priority: 1.0 },
 *   { loc: '/about', priority: 0.8 },
 * ], { baseUrl: 'https://example.com' })
 *
 * // Auto-scan directory
 * const entries = await scanForSitemapEntries('./pages', {
 *   baseUrl: 'https://example.com'
 * })
 * ```
 *
 * ## Robots.txt Generation
 *
 * ```typescript
 * import { generateRobotsTxt } from 'stx'
 *
 * const robotsTxt = generateRobotsTxt({
 *   rules: [{ userAgent: '*', allow: ['/'], disallow: ['/admin'] }],
 *   sitemap: 'https://example.com/sitemap.xml'
 * })
 * ```
 *
 * ## Configuration
 *
 * Default SEO values can be set in `stx.config.ts`:
 * ```typescript
 * export default {
 *   defaultTitle: 'My Site',
 *   defaultDescription: 'Site description',
 *   seo: {
 *     enabled: true,
 *     defaultConfig: { ... }
 *   }
 * }
 * ```
 */
import type { CustomDirective, SeoConfig, StxOptions } from './types'
import { createDetailedErrorMessage } from './utils'

// =============================================================================
// Types
// =============================================================================

interface MetaTag {
  name?: string
  property?: string
  content: string
  httpEquiv?: string
}

interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: any
}

// =============================================================================
// Meta Tag Processing
// =============================================================================

/**
 * Process @meta directive for generating meta tags.
 * Supports both simple `@meta('name', 'content')` and
 * OpenGraph `@meta('og:title')` formats.
 */
export function processMetaDirectives(
  template: string,
  context: Record<string, any>,
  _filePath: string,
  _options: StxOptions,
): string {
  let output = template

  // Process @meta directive
  output = output.replace(/@meta\(\s*['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"]\s*)?\)/g, (_, name, content) => {
    if (!content && name.includes(':')) {
      // For @meta('og:title') format, extract from context using key after colon
      const parts = name.split(':')
      const property = name
      const contextKey = parts.length > 1 ? parts[1] : ''

      // Look for the key in context
      if (contextKey && context[contextKey]) {
        content = context[contextKey]
      }
      else if (property.startsWith('og:') && context.openGraph && context.openGraph[parts[1]]) {
        // Check if defined in openGraph context property
        content = context.openGraph[parts[1]]
      }
      else {
        content = ''
      }

      return content ? `<meta property="${property}" content="${escapeHtml(content)}">` : ''
    }

    return content
      ? `<meta name="${name}" content="${escapeHtml(content)}">`
      : ''
  })

  // Process extended meta directive with attributes object
  output = output.replace(/@metaTag\(\s*(\{[^}]+\})\s*\)/g, (_, attrObject) => {
    try {
      // Parse the attribute object
      // eslint-disable-next-line no-new-func
      const evalFn = new Function(...Object.keys(context), `return ${attrObject}`)
      const attrs: MetaTag = evalFn(...Object.values(context))

      if (!attrs)
        return ''

      // Build meta tag based on provided attributes
      let tag = '<meta'
      if (attrs.name)
        tag += ` name="${escapeHtml(attrs.name)}"`
      if (attrs.property)
        tag += ` property="${escapeHtml(attrs.property)}"`
      if (attrs.httpEquiv)
        tag += ` http-equiv="${escapeHtml(attrs.httpEquiv)}"`
      if (attrs.content)
        tag += ` content="${escapeHtml(attrs.content)}"`
      tag += '>'

      return tag
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return `<!-- Error in @metaTag: ${errorMessage} -->`
    }
  })

  return output
}

// =============================================================================
// Structured Data
// =============================================================================

/**
 * Process @structuredData directive for JSON-LD.
 * Automatically adds schema.org context if not provided.
 */
export function processStructuredData(
  template: string,
  context: Record<string, any>,
  _filePath: string,
): string {
  let output = template

  // Process @structuredData directive
  output = output.replace(/@structuredData\(\s*(\{[\s\S]*?\})\s*\)/g, (_, dataObject) => {
    try {
      // Parse the data object
      // eslint-disable-next-line no-new-func
      const evalFn = new Function(...Object.keys(context), `return ${dataObject}`)
      const data: StructuredData = evalFn(...Object.values(context))

      if (!data)
        return ''

      // If @context isn't set, add schema.org as default
      if (!data['@context']) {
        data['@context'] = 'https://schema.org'
      }

      // Convert to JSON-LD script tag
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return `<!-- Error in @structuredData: ${errorMessage} -->`
    }
  })

  return output
}

// =============================================================================
// SEO Directive
// =============================================================================

/**
 * Process @seo directive for automatic meta tag generation.
 * Generates title, description, Open Graph, Twitter, and structured data tags.
 */
export function processSeoDirective(
  template: string,
  context: Record<string, any>,
  filePath: string,
  _options: StxOptions,
): string {
  let output = template

  // Process @seo directive
  output = output.replace(/@seo\(\s*(\{[\s\S]*?\})\s*\)/g, (_, seoConfig) => {
    try {
      // Parse the SEO configuration object
      // eslint-disable-next-line no-new-func
      const evalFn = new Function(...Object.keys(context), `return ${seoConfig}`)
      const config: Partial<SeoConfig> = evalFn(...Object.values(context))

      if (!config)
        return ''

      // Generate meta tags based on the configuration
      let metaTags = ''

      // Basic meta tags
      if (config.title) {
        metaTags += `<title>${escapeHtml(config.title)}</title>\n`
        metaTags += `<meta name="title" content="${escapeHtml(config.title)}">\n`
      }

      if (config.description) {
        metaTags += `<meta name="description" content="${escapeHtml(config.description)}">\n`
      }

      if (config.keywords) {
        const keywordsStr = Array.isArray(config.keywords)
          ? config.keywords.join(', ')
          : config.keywords
        metaTags += `<meta name="keywords" content="${escapeHtml(keywordsStr)}">\n`
      }

      if (config.robots) {
        metaTags += `<meta name="robots" content="${escapeHtml(config.robots)}">\n`
      }

      if (config.canonical) {
        metaTags += `<link rel="canonical" href="${escapeHtml(config.canonical)}">\n`
      }

      // Open Graph / Facebook
      if (config.openGraph) {
        const og = config.openGraph
        metaTags += `<meta property="og:type" content="${escapeHtml(og.type || 'website')}">\n`

        if (og.title || config.title) {
          const ogTitle = og.title || config.title || ''
          metaTags += `<meta property="og:title" content="${escapeHtml(ogTitle)}">\n`
        }

        if (og.description || config.description) {
          const ogDescription = og.description || config.description || ''
          metaTags += `<meta property="og:description" content="${escapeHtml(ogDescription)}">\n`
        }

        if (og.url || config.canonical) {
          const ogUrl = og.url || config.canonical || ''
          metaTags += `<meta property="og:url" content="${escapeHtml(ogUrl)}">\n`
        }

        if (og.image) {
          metaTags += `<meta property="og:image" content="${escapeHtml(og.image)}">\n`

          if (og.imageAlt) {
            metaTags += `<meta property="og:image:alt" content="${escapeHtml(og.imageAlt)}">\n`
          }

          if (og.imageWidth) {
            metaTags += `<meta property="og:image:width" content="${og.imageWidth}">\n`
          }

          if (og.imageHeight) {
            metaTags += `<meta property="og:image:height" content="${og.imageHeight}">\n`
          }
        }

        if (og.siteName) {
          metaTags += `<meta property="og:site_name" content="${escapeHtml(og.siteName)}">\n`
        }
      }

      // Twitter
      if (config.twitter) {
        const twitter = config.twitter
        metaTags += `<meta name="twitter:card" content="${escapeHtml(twitter.card || 'summary_large_image')}">\n`

        if (twitter.title || config.title) {
          const twitterTitle = twitter.title || config.title || ''
          metaTags += `<meta name="twitter:title" content="${escapeHtml(twitterTitle)}">\n`
        }

        if (twitter.description || config.description) {
          const twitterDesc = twitter.description || config.description || ''
          metaTags += `<meta name="twitter:description" content="${escapeHtml(twitterDesc)}">\n`
        }

        if (twitter.image || (config.openGraph && config.openGraph.image)) {
          const twitterImage = twitter.image || (config.openGraph ? config.openGraph.image : '') || ''
          metaTags += `<meta name="twitter:image" content="${escapeHtml(twitterImage)}">\n`
        }

        if (twitter.site) {
          metaTags += `<meta name="twitter:site" content="${escapeHtml(twitter.site)}">\n`
        }

        if (twitter.creator) {
          metaTags += `<meta name="twitter:creator" content="${escapeHtml(twitter.creator)}">\n`
        }
      }

      // Structured data
      if (config.structuredData) {
        metaTags += `<script type="application/ld+json">${JSON.stringify(config.structuredData)}</script>\n`
      }

      return metaTags.trim()
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createDetailedErrorMessage(
        'SEO Directive',
        `Error processing @seo directive: ${errorMessage}`,
        filePath,
        template,
        template.indexOf('@seo'),
        seoConfig,
      )
    }
  })

  return output
}

// =============================================================================
// Auto-Injection
// =============================================================================

/**
 * Injects default SEO tags if no @seo directive is used.
 * Respects seo.enabled config and skipDefaultSeoTags option.
 */
export function injectSeoTags(
  html: string,
  context: Record<string, any>,
  options: StxOptions,
): string {
  // Check if SEO is explicitly disabled in options
  if (options.seo?.enabled === false) {
    return html
  }

  // If the HTML already has meta tags or if auto-injection is disabled, return unchanged
  if (html.includes('<!-- stx SEO Tags -->')
    || options.skipDefaultSeoTags === true) {
    return html
  }

  // Check if document has a head tag
  if (!html.includes('<head>') && !html.includes('<head ')) {
    return html
  }

  // Check if title is already set
  const hasTitle = html.includes('<title>') || html.includes('</title>')

  // Get the title from context or fallback
  let title = ''
  if (context.title) {
    title = context.title
  }
  else if (context.meta && context.meta.title) {
    title = context.meta.title
  }
  else if (options.seo?.defaultConfig?.title) {
    title = options.seo.defaultConfig.title
  }
  else {
    title = options.defaultTitle || 'stx Project'
  }

  // Get the description from context or fallback
  let description = ''
  if (context.description) {
    description = context.description
  }
  else if (context.meta && context.meta.description) {
    description = context.meta.description
  }
  else if (options.seo?.defaultConfig?.description) {
    description = options.seo.defaultConfig.description
  }
  else {
    description = options.defaultDescription || 'A website built with stx templating engine'
  }

  // Get image from context or options
  let image = ''
  if (context.image) {
    image = context.image
  }
  else if (context.meta && context.meta.image) {
    image = context.meta.image
  }
  else if (context.openGraph && context.openGraph.image) {
    image = context.openGraph.image
  }
  else if (options.seo?.defaultImage) {
    image = options.seo.defaultImage
  }
  else if (options.defaultImage) {
    image = options.defaultImage
  }

  // Build basic SEO tags
  let seoTagsMinimal = `
<!-- stx SEO Tags -->
<meta name="title" content="${escapeHtml(title)}">
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
`

  // Add image tags if available
  if (image) {
    seoTagsMinimal += `
<meta property="og:image" content="${escapeHtml(image)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
`
  }

  // Add title tag if missing
  let result = html
  if (!hasTitle) {
    result = result.replace(/<head[^>]*>/, `$&\n<title>${escapeHtml(title)}</title>`)
  }

  // Add SEO tags
  return result.replace(/<head[^>]*>/, `$&\n${seoTagsMinimal}\n`)
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Escape HTML entities in a string.
 * Local copy to avoid circular dependencies with expressions module.
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
// Custom Directives
// =============================================================================

/**
 * SEO meta directive for basic meta tag generation
 */
export const metaDirective: CustomDirective = {
  name: 'meta',
  handler: (_content, params, _context, _filePath) => {
    if (params.length < 1) {
      return '[Error: meta directive requires at least the meta name]'
    }

    const name = params[0].replace(/['"]/g, '')
    const metaContent = params.length > 1 ? params[1].replace(/['"]/g, '') : ''

    return `<meta name="${escapeHtml(name)}" content="${escapeHtml(metaContent)}">`
  },
  hasEndTag: false,
}

/**
 * SEO structured data directive for JSON-LD generation
 */
export const structuredDataDirective: CustomDirective = {
  name: 'structuredData',
  handler: (content, _params, _context, _filePath) => {
    if (content.trim() === '') {
      return '[Error: structuredData directive requires JSON-LD content]'
    }

    try {
      // Parse the JSON content
      const data = JSON.parse(content)

      // Ensure required properties are present
      if (!data['@context']) {
        data['@context'] = 'https://schema.org'
      }

      if (!data['@type']) {
        return '[Error: structuredData requires @type property]'
      }

      // Return JSON-LD script tag
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return `<!-- Error in structuredData directive: ${errorMessage} -->`
    }
  },
  hasEndTag: true,
}

/**
 * Register SEO directives
 */
export function registerSeoDirectives(): CustomDirective[] {
  return [
    metaDirective,
    structuredDataDirective,
  ]
}

// =============================================================================
// Sitemap Generation
// =============================================================================

/**
 * URL entry for sitemap
 */
export interface SitemapEntry {
  /** Full URL of the page */
  loc: string
  /** Last modification date (ISO 8601 format) */
  lastmod?: string
  /** Change frequency */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  /** Priority (0.0 to 1.0) */
  priority?: number
}

/**
 * Sitemap generation options
 */
export interface SitemapOptions {
  /** Base URL for the site (e.g., 'https://example.com') */
  baseUrl: string
  /** Default change frequency */
  defaultChangefreq?: SitemapEntry['changefreq']
  /** Default priority */
  defaultPriority?: number
  /** Whether to include lastmod for all entries */
  includeLastmod?: boolean
}

/**
 * Generate an XML sitemap from a list of URL entries.
 *
 * @param entries - Array of sitemap entries
 * @param options - Sitemap generation options
 * @returns XML sitemap string
 *
 * @example
 * ```typescript
 * const sitemap = generateSitemap([
 *   { loc: '/', priority: 1.0 },
 *   { loc: '/about', priority: 0.8 },
 *   { loc: '/blog', changefreq: 'daily' },
 * ], { baseUrl: 'https://example.com' })
 * ```
 */
export function generateSitemap(entries: SitemapEntry[], options: SitemapOptions): string {
  const {
    baseUrl,
    defaultChangefreq = 'weekly',
    defaultPriority = 0.5,
    includeLastmod = true,
  } = options

  // Normalize base URL (remove trailing slash)
  const base = baseUrl.replace(/\/$/, '')

  const urlEntries = entries.map((entry) => {
    const loc = entry.loc.startsWith('http')
      ? entry.loc
      : `${base}${entry.loc.startsWith('/') ? '' : '/'}${entry.loc}`

    const lastmod = entry.lastmod
      || (includeLastmod ? new Date().toISOString().split('T')[0] : undefined)

    const changefreq = entry.changefreq || defaultChangefreq
    const priority = entry.priority ?? defaultPriority

    let urlXml = `  <url>\n    <loc>${escapeXml(loc)}</loc>`

    if (lastmod) {
      urlXml += `\n    <lastmod>${lastmod}</lastmod>`
    }

    urlXml += `\n    <changefreq>${changefreq}</changefreq>`
    urlXml += `\n    <priority>${priority.toFixed(1)}</priority>`
    urlXml += `\n  </url>`

    return urlXml
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`
}

/**
 * Generate a sitemap index for multiple sitemaps.
 *
 * @param sitemaps - Array of sitemap URLs
 * @param baseUrl - Base URL for the site
 * @returns XML sitemap index string
 */
export function generateSitemapIndex(sitemaps: string[], baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  const lastmod = new Date().toISOString().split('T')[0]

  const sitemapEntries = sitemaps.map((sitemap) => {
    const loc = sitemap.startsWith('http')
      ? sitemap
      : `${base}${sitemap.startsWith('/') ? '' : '/'}${sitemap}`

    return `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
</sitemapindex>`
}

/**
 * Scan a directory and generate sitemap entries.
 *
 * @param directory - Directory to scan for .stx/.html files
 * @param options - Scan options
 * @returns Array of sitemap entries
 */
export async function scanForSitemapEntries(
  directory: string,
  options: {
    extensions?: string[]
    ignore?: string[]
    baseUrl: string
  },
): Promise<SitemapEntry[]> {
  const {
    extensions = ['.stx', '.html', '.htm'],
    ignore = ['_*', '.*', 'node_modules', 'components', 'partials', 'layouts'],
  } = options

  const entries: SitemapEntry[] = []

  // Build glob pattern
  const extPattern = extensions.length === 1
    ? `*${extensions[0]}`
    : `*{${extensions.join(',')}}`

  const glob = new Bun.Glob(`**/${extPattern}`)

  for await (const file of glob.scan(directory)) {
    // Check if file matches any ignore pattern
    const shouldIgnore = ignore.some((pattern) => {
      if (pattern.startsWith('*')) {
        return file.includes(pattern.slice(1))
      }
      return file.startsWith(pattern) || file.includes(`/${pattern}`)
    })

    if (shouldIgnore)
      continue

    // Convert file path to URL path
    let urlPath = file
      .replace(/\\/g, '/') // Normalize path separators
      .replace(/index\.(stx|html|htm)$/, '') // Remove index files
      .replace(/\.(stx|html|htm)$/, '') // Remove extensions

    // Ensure leading slash
    if (!urlPath.startsWith('/')) {
      urlPath = `/${urlPath}`
    }

    // Clean up trailing slashes (except for root)
    if (urlPath !== '/' && urlPath.endsWith('/')) {
      urlPath = urlPath.slice(0, -1)
    }

    // Get file stats for lastmod
    const filePath = `${directory}/${file}`
    let lastmod: string | undefined

    try {
      const stat = await Bun.file(filePath).stat()
      if (stat) {
        lastmod = new Date(stat.mtime).toISOString().split('T')[0]
      }
    }
    catch {
      // Ignore stat errors
    }

    entries.push({
      loc: urlPath || '/',
      lastmod,
      priority: urlPath === '/' ? 1.0 : 0.5,
    })
  }

  // Sort entries by URL
  entries.sort((a, b) => a.loc.localeCompare(b.loc))

  return entries
}

// =============================================================================
// Robots.txt Generation
// =============================================================================

/**
 * Robots.txt rule
 */
export interface RobotsRule {
  /** User agent (e.g., '*', 'Googlebot', 'Bingbot') */
  userAgent: string
  /** Allowed paths */
  allow?: string[]
  /** Disallowed paths */
  disallow?: string[]
  /** Crawl delay in seconds */
  crawlDelay?: number
}

/**
 * Robots.txt generation options
 */
export interface RobotsOptions {
  /** Array of rules */
  rules: RobotsRule[]
  /** Sitemap URL(s) */
  sitemap?: string | string[]
  /** Host directive (for Yandex) */
  host?: string
}

/**
 * Generate a robots.txt file content.
 *
 * @param options - Robots.txt options
 * @returns robots.txt content string
 *
 * @example
 * ```typescript
 * const robotsTxt = generateRobotsTxt({
 *   rules: [
 *     {
 *       userAgent: '*',
 *       allow: ['/'],
 *       disallow: ['/admin', '/private'],
 *     },
 *     {
 *       userAgent: 'Googlebot',
 *       allow: ['/'],
 *       crawlDelay: 1,
 *     },
 *   ],
 *   sitemap: 'https://example.com/sitemap.xml',
 * })
 * ```
 */
export function generateRobotsTxt(options: RobotsOptions): string {
  const lines: string[] = []

  for (const rule of options.rules) {
    lines.push(`User-agent: ${rule.userAgent}`)

    if (rule.allow) {
      for (const path of rule.allow) {
        lines.push(`Allow: ${path}`)
      }
    }

    if (rule.disallow) {
      for (const path of rule.disallow) {
        lines.push(`Disallow: ${path}`)
      }
    }

    if (rule.crawlDelay !== undefined) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`)
    }

    lines.push('') // Empty line between rules
  }

  // Add sitemap(s)
  if (options.sitemap) {
    const sitemaps = Array.isArray(options.sitemap)
      ? options.sitemap
      : [options.sitemap]

    for (const sitemap of sitemaps) {
      lines.push(`Sitemap: ${sitemap}`)
    }
  }

  // Add host directive (for Yandex)
  if (options.host) {
    lines.push(`Host: ${options.host}`)
  }

  return lines.join('\n').trim()
}

/**
 * Generate a default robots.txt that allows all crawling.
 *
 * @param sitemapUrl - Optional sitemap URL
 * @returns robots.txt content string
 */
export function generateDefaultRobotsTxt(sitemapUrl?: string): string {
  return generateRobotsTxt({
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
      },
    ],
    sitemap: sitemapUrl,
  })
}

// =============================================================================
// Internal Utilities
// =============================================================================

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
