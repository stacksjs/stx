/**
 * Static Site Generation (SSG) with Incremental Static Regeneration (ISR)
 *
 * Pre-renders pages at build time for optimal performance and SEO.
 * Supports on-demand revalidation for dynamic content.
 *
 * ## Features
 *
 * - Build-time page generation from file-based routes
 * - Dynamic route handling with getStaticPaths()
 * - Incremental Static Regeneration (ISR)
 * - Automatic sitemap generation
 * - RSS feed generation
 * - Content source integrations (Markdown, CMS, API)
 * - Parallel page generation
 * - Build caching for faster rebuilds
 *
 * ## Usage
 *
 * ```typescript
 * import { generateStaticSite, defineStaticPaths } from 'stx/ssg'
 *
 * // Generate entire site
 * await generateStaticSite({
 *   pagesDir: 'pages',
 *   outputDir: 'dist',
 *   revalidate: 3600, // ISR: revalidate every hour
 * })
 * ```
 *
 * For dynamic routes, export getStaticPaths in your template:
 * ```html
 * <script server>
 * export async function getStaticPaths() {
 *   const posts = await fetchPosts()
 *   return posts.map(post => ({
 *     params: { slug: post.slug },
 *     props: { post }
 *   }))
 * }
 * </script>
 * ```
 *
 * @module ssg
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRouter, type Route } from './router'
import { processDirectives } from './process'
import { config } from './config'

// =============================================================================
// Types
// =============================================================================

export interface SSGConfig {
  /** Directory containing pages (default: 'pages') */
  pagesDir?: string
  /** Output directory for generated files (default: 'dist') */
  outputDir?: string
  /** Base URL for the site (default: '/') */
  baseUrl?: string
  /** Site domain for absolute URLs */
  domain?: string
  /** Enable ISR with revalidation time in seconds */
  revalidate?: number | false
  /** Generate sitemap.xml */
  sitemap?: boolean
  /** Generate RSS feed */
  rss?: boolean | RSSConfig
  /** Parallel page generation limit (default: 10) */
  concurrency?: number
  /** Enable build caching (default: true) */
  cache?: boolean
  /** Cache directory (default: '.stx/ssg-cache') */
  cacheDir?: string
  /** Custom content loaders */
  contentLoaders?: ContentLoader[]
  /** Pre-render hooks */
  hooks?: SSGHooks
  /** Minify HTML output (default: true in production) */
  minify?: boolean
  /** Generate 404 page */
  generate404?: boolean
  /** Additional files to copy to output */
  publicDir?: string
  /** Trailing slash behavior */
  trailingSlash?: boolean
  /** Clean output directory before build */
  cleanOutput?: boolean
}

export interface RSSConfig {
  title: string
  description: string
  link: string
  language?: string
  copyright?: string
  /** Function to get items for RSS feed */
  getItems?: () => Promise<RSSItem[]>
}

export interface RSSItem {
  title: string
  link: string
  description?: string
  pubDate?: Date
  author?: string
  categories?: string[]
  guid?: string
}

export interface StaticPath {
  /** Route parameters */
  params: Record<string, string>
  /** Props to pass to the page */
  props?: Record<string, unknown>
  /** Page-specific revalidation time (overrides global) */
  revalidate?: number | false
}

export interface StaticPathsResult {
  paths: StaticPath[]
  /** Fallback behavior for paths not returned */
  fallback?: 'blocking' | 'static' | false
}

export interface ContentLoader {
  /** Name of the loader */
  name: string
  /** File extensions this loader handles */
  extensions: string[]
  /** Load content from file */
  load: (filePath: string) => Promise<ContentResult>
}

export interface ContentResult {
  /** Rendered HTML content */
  content: string
  /** Frontmatter/metadata */
  data: Record<string, unknown>
  /** Table of contents (for markdown) */
  toc?: TocItem[]
}

export interface TocItem {
  id: string
  text: string
  level: number
  children?: TocItem[]
}

export interface SSGHooks {
  /** Called before build starts */
  onBuildStart?: () => void | Promise<void>
  /** Called after build completes */
  onBuildEnd?: (result: SSGResult) => void | Promise<void>
  /** Called before each page is rendered */
  onPageStart?: (route: string) => void | Promise<void>
  /** Called after each page is rendered */
  onPageEnd?: (route: string, html: string) => void | Promise<void>
  /** Called on build error */
  onError?: (error: Error, route?: string) => void | Promise<void>
}

export interface SSGResult {
  /** Total pages generated */
  totalPages: number
  /** Successfully generated pages */
  successCount: number
  /** Failed pages */
  failedCount: number
  /** Pages that were cached */
  cachedCount: number
  /** Build time in milliseconds */
  buildTime: number
  /** Generated sitemap path */
  sitemapPath?: string
  /** Generated RSS path */
  rssPath?: string
  /** Individual page results */
  pages: PageResult[]
  /** Errors encountered */
  errors: PageError[]
}

export interface PageResult {
  route: string
  outputPath: string
  size: number
  cached: boolean
  revalidateAt?: number
}

export interface PageError {
  route: string
  error: Error
}

export interface ISRCache {
  /** Get cached page */
  get: (route: string) => Promise<CachedPage | null>
  /** Set cached page */
  set: (route: string, page: CachedPage) => Promise<void>
  /** Invalidate cached page */
  invalidate: (route: string) => Promise<void>
  /** Invalidate all pages matching pattern */
  invalidatePattern: (pattern: RegExp) => Promise<void>
  /** Check if page needs revalidation */
  needsRevalidation: (route: string) => Promise<boolean>
}

export interface CachedPage {
  html: string
  generatedAt: number
  revalidateAfter: number
  etag: string
  headers?: Record<string, string>
}

// =============================================================================
// Build Cache
// =============================================================================

interface BuildCacheEntry {
  hash: string
  html: string
  generatedAt: number
  dependencies: string[]
}

class BuildCache {
  private cacheDir: string
  private cache: Map<string, BuildCacheEntry> = new Map()
  private loaded = false

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir
  }

  async load(): Promise<void> {
    if (this.loaded) return

    const cacheFile = path.join(this.cacheDir, 'build-cache.json')
    if (fs.existsSync(cacheFile)) {
      try {
        const data = JSON.parse(await Bun.file(cacheFile).text())
        for (const [key, value] of Object.entries(data)) {
          this.cache.set(key, value as BuildCacheEntry)
        }
      } catch {
        // Ignore corrupt cache
      }
    }
    this.loaded = true
  }

  async save(): Promise<void> {
    await fs.promises.mkdir(this.cacheDir, { recursive: true })
    const cacheFile = path.join(this.cacheDir, 'build-cache.json')
    const data: Record<string, BuildCacheEntry> = {}
    for (const [key, value] of this.cache) {
      data[key] = value
    }
    await Bun.write(cacheFile, JSON.stringify(data))
  }

  getHash(filePath: string, dependencies: string[]): string {
    const stats = fs.statSync(filePath)
    let hashInput = `${filePath}:${stats.mtimeMs}`

    for (const dep of dependencies) {
      if (fs.existsSync(dep)) {
        const depStats = fs.statSync(dep)
        hashInput += `:${dep}:${depStats.mtimeMs}`
      }
    }

    // Simple hash
    let hash = 0
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  get(route: string, filePath: string, dependencies: string[]): string | null {
    const entry = this.cache.get(route)
    if (!entry) return null

    const currentHash = this.getHash(filePath, dependencies)
    if (entry.hash !== currentHash) {
      this.cache.delete(route)
      return null
    }

    return entry.html
  }

  set(route: string, filePath: string, dependencies: string[], html: string): void {
    const hash = this.getHash(filePath, dependencies)
    this.cache.set(route, {
      hash,
      html,
      generatedAt: Date.now(),
      dependencies,
    })
  }
}

// =============================================================================
// ISR Cache Implementation
// =============================================================================

class FileISRCache implements ISRCache {
  private cacheDir: string

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir
  }

  private getFilePath(route: string): string {
    const safeName = route.replace(/[^a-zA-Z0-9]/g, '_') + '.json'
    return path.join(this.cacheDir, 'isr', safeName)
  }

  async get(route: string): Promise<CachedPage | null> {
    const filePath = this.getFilePath(route)
    if (!fs.existsSync(filePath)) return null

    try {
      const data = JSON.parse(await Bun.file(filePath).text())
      return data as CachedPage
    } catch {
      return null
    }
  }

  async set(route: string, page: CachedPage): Promise<void> {
    const filePath = this.getFilePath(route)
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
    await Bun.write(filePath, JSON.stringify(page))
  }

  async invalidate(route: string): Promise<void> {
    const filePath = this.getFilePath(route)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  }

  async invalidatePattern(pattern: RegExp): Promise<void> {
    const isrDir = path.join(this.cacheDir, 'isr')
    if (!fs.existsSync(isrDir)) return

    const files = await fs.promises.readdir(isrDir)
    for (const file of files) {
      const route = file.replace(/_/g, '/').replace('.json', '')
      if (pattern.test(route)) {
        await fs.promises.unlink(path.join(isrDir, file))
      }
    }
  }

  async needsRevalidation(route: string): Promise<boolean> {
    const cached = await this.get(route)
    if (!cached) return true
    return Date.now() > cached.revalidateAfter
  }
}

// =============================================================================
// Route Discovery
// =============================================================================

/**
 * Extract getStaticPaths from a template file
 */
async function extractStaticPaths(filePath: string): Promise<StaticPathsResult | null> {
  try {
    const content = await Bun.file(filePath).text()

    // Look for <script server> block with getStaticPaths
    const serverScriptMatch = content.match(/<script\s+server\b[^>]*>([\s\S]*?)<\/script>/i)
    if (!serverScriptMatch) return null

    const scriptContent = serverScriptMatch[1]
    if (!scriptContent.includes('getStaticPaths')) return null

    // Extract and evaluate the function
    const fnMatch = scriptContent.match(
      /(?:export\s+)?(?:async\s+)?function\s+getStaticPaths\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/
    )
    if (!fnMatch) return null

    // Create a safe evaluation context
    const asyncFn = new Function(`
      return (async function getStaticPaths() {
        ${fnMatch[1]}
      })()
    `)

    const result = await asyncFn()
    return result as StaticPathsResult
  } catch (error) {
    console.error(`Error extracting static paths from ${filePath}:`, error)
    return null
  }
}

/**
 * Generate all static paths for a route
 */
async function generatePathsForRoute(route: Route): Promise<Array<{
  url: string
  params: Record<string, string>
  props?: Record<string, unknown>
  revalidate?: number | false
}>> {
  const results: Array<{
    url: string
    params: Record<string, string>
    props?: Record<string, unknown>
    revalidate?: number | false
  }> = []

  if (!route.isDynamic) {
    // Static route - single path
    results.push({
      url: route.pattern,
      params: {},
    })
  } else {
    // Dynamic route - need getStaticPaths
    const staticPaths = await extractStaticPaths(route.filePath)

    if (!staticPaths || staticPaths.paths.length === 0) {
      console.warn(`Warning: Dynamic route ${route.pattern} has no getStaticPaths or returned empty paths`)
      return results
    }

    for (const pathConfig of staticPaths.paths) {
      // Build URL from params
      let url = route.pattern
      for (const [key, value] of Object.entries(pathConfig.params)) {
        url = url.replace(`:${key}`, value).replace(`:${key}*`, value)
      }

      results.push({
        url,
        params: pathConfig.params,
        props: pathConfig.props,
        revalidate: pathConfig.revalidate,
      })
    }
  }

  return results
}

// =============================================================================
// Page Generation
// =============================================================================

/**
 * Render a single page
 */
async function renderPage(
  route: Route,
  params: Record<string, string>,
  props: Record<string, unknown> = {},
  options: SSGConfig
): Promise<string> {
  const content = await Bun.file(route.filePath).text()

  // Merge params and props into context
  const context = {
    ...props,
    params,
    $route: {
      path: route.pattern,
      params,
    },
  }

  // Process the template with proper arguments
  const dependencies = new Set<string>()
  const stxOptions = {
    ...config,
    debug: false,
    cache: false,
  }

  const html = await processDirectives(
    content,
    context,
    route.filePath,
    stxOptions,
    dependencies
  )

  // Minify if enabled
  if (options.minify !== false) {
    return minifyHtml(html)
  }

  return html
}

/**
 * Simple HTML minification
 */
function minifyHtml(html: string): string {
  return html
    // Remove HTML comments (except conditional comments)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace between tags
    .replace(/>\s+</g, '><')
    // Trim
    .trim()
}

/**
 * Generate ETag for content
 */
function generateETag(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `"${Math.abs(hash).toString(36)}"`
}

// =============================================================================
// Sitemap Generation
// =============================================================================

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

/**
 * Generate sitemap.xml
 */
function generateSitemap(entries: SitemapEntry[], domain: string): string {
  const urls = entries.map(entry => {
    const loc = new URL(entry.loc, domain).href
    let xml = `  <url>\n    <loc>${escapeXml(loc)}</loc>`

    if (entry.lastmod) {
      xml += `\n    <lastmod>${entry.lastmod}</lastmod>`
    }
    if (entry.changefreq) {
      xml += `\n    <changefreq>${entry.changefreq}</changefreq>`
    }
    if (entry.priority !== undefined) {
      xml += `\n    <priority>${entry.priority}</priority>`
    }

    xml += '\n  </url>'
    return xml
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

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

// =============================================================================
// RSS Feed Generation
// =============================================================================

/**
 * Generate RSS feed
 */
function generateRSSFeed(rssConfig: RSSConfig, items: RSSItem[]): string {
  const itemsXml = items.map(item => {
    let xml = '    <item>'
    xml += `\n      <title>${escapeXml(item.title)}</title>`
    xml += `\n      <link>${escapeXml(item.link)}</link>`

    if (item.description) {
      xml += `\n      <description>${escapeXml(item.description)}</description>`
    }
    if (item.pubDate) {
      xml += `\n      <pubDate>${item.pubDate.toUTCString()}</pubDate>`
    }
    if (item.author) {
      xml += `\n      <author>${escapeXml(item.author)}</author>`
    }
    if (item.categories) {
      for (const cat of item.categories) {
        xml += `\n      <category>${escapeXml(cat)}</category>`
      }
    }
    if (item.guid) {
      xml += `\n      <guid>${escapeXml(item.guid)}</guid>`
    }

    xml += '\n    </item>'
    return xml
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(rssConfig.title)}</title>
    <link>${escapeXml(rssConfig.link)}</link>
    <description>${escapeXml(rssConfig.description)}</description>
    ${rssConfig.language ? `<language>${rssConfig.language}</language>` : ''}
    ${rssConfig.copyright ? `<copyright>${escapeXml(rssConfig.copyright)}</copyright>` : ''}
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${rssConfig.link}/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml.join('\n')}
  </channel>
</rss>`
}

// =============================================================================
// Main SSG Functions
// =============================================================================

/**
 * Generate static site
 */
export async function generateStaticSite(options: SSGConfig = {}): Promise<SSGResult> {
  const startTime = Date.now()

  const cfg: Required<SSGConfig> = {
    pagesDir: options.pagesDir || 'pages',
    outputDir: options.outputDir || 'dist',
    baseUrl: options.baseUrl || '/',
    domain: options.domain || 'http://localhost',
    revalidate: options.revalidate ?? false,
    sitemap: options.sitemap ?? true,
    rss: options.rss ?? false,
    concurrency: options.concurrency || 10,
    cache: options.cache ?? true,
    cacheDir: options.cacheDir || '.stx/ssg-cache',
    contentLoaders: options.contentLoaders || [],
    hooks: options.hooks || {},
    minify: options.minify ?? (process.env.NODE_ENV === 'production'),
    generate404: options.generate404 ?? true,
    publicDir: options.publicDir || 'public',
    trailingSlash: options.trailingSlash ?? false,
    cleanOutput: options.cleanOutput ?? true,
  }

  const result: SSGResult = {
    totalPages: 0,
    successCount: 0,
    failedCount: 0,
    cachedCount: 0,
    buildTime: 0,
    pages: [],
    errors: [],
  }

  // Build hooks
  await cfg.hooks.onBuildStart?.()

  try {
    // Clean output directory
    if (cfg.cleanOutput && fs.existsSync(cfg.outputDir)) {
      await fs.promises.rm(cfg.outputDir, { recursive: true })
    }
    await fs.promises.mkdir(cfg.outputDir, { recursive: true })

    // Initialize caches
    const buildCache = new BuildCache(cfg.cacheDir)
    if (cfg.cache) {
      await buildCache.load()
    }

    // Discover routes
    const routes = createRouter('.', { pagesDir: cfg.pagesDir })
    console.log(`Found ${routes.length} routes`)

    // Collect all pages to generate
    const pagesToGenerate: Array<{
      route: Route
      url: string
      params: Record<string, string>
      props?: Record<string, unknown>
      revalidate?: number | false
    }> = []

    for (const route of routes) {
      const paths = await generatePathsForRoute(route)
      for (const pathInfo of paths) {
        pagesToGenerate.push({
          route,
          url: pathInfo.url,
          params: pathInfo.params,
          props: pathInfo.props,
          revalidate: pathInfo.revalidate ?? cfg.revalidate,
        })
      }
    }

    result.totalPages = pagesToGenerate.length
    console.log(`Generating ${result.totalPages} pages...`)

    // Sitemap entries
    const sitemapEntries: SitemapEntry[] = []

    // Generate pages in parallel batches
    const chunks: typeof pagesToGenerate[] = []
    for (let i = 0; i < pagesToGenerate.length; i += cfg.concurrency) {
      chunks.push(pagesToGenerate.slice(i, i + cfg.concurrency))
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(async (page) => {
        const { route, url, params, props, revalidate } = page

        try {
          await cfg.hooks.onPageStart?.(url)

          // Check cache
          let html: string | null = null
          let cached = false

          if (cfg.cache) {
            html = buildCache.get(url, route.filePath, [])
            if (html) {
              cached = true
              result.cachedCount++
            }
          }

          // Render if not cached
          if (!html) {
            html = await renderPage(route, params, props, cfg)

            if (cfg.cache) {
              buildCache.set(url, route.filePath, [], html)
            }
          }

          // Determine output path
          let outputPath: string
          if (cfg.trailingSlash) {
            outputPath = path.join(cfg.outputDir, url, 'index.html')
          } else {
            outputPath = url === '/'
              ? path.join(cfg.outputDir, 'index.html')
              : path.join(cfg.outputDir, `${url}.html`)
          }

          // Write file
          await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })
          await Bun.write(outputPath, html)

          // Add to sitemap
          sitemapEntries.push({
            loc: url,
            lastmod: new Date().toISOString().split('T')[0],
            priority: url === '/' ? 1.0 : 0.8,
          })

          const pageResult: PageResult = {
            route: url,
            outputPath,
            size: Buffer.byteLength(html, 'utf8'),
            cached,
          }

          if (revalidate !== false) {
            pageResult.revalidateAt = Date.now() + (revalidate as number) * 1000
          }

          result.pages.push(pageResult)
          result.successCount++

          await cfg.hooks.onPageEnd?.(url, html)

        } catch (error) {
          result.failedCount++
          result.errors.push({
            route: url,
            error: error as Error,
          })
          await cfg.hooks.onError?.(error as Error, url)
          console.error(`Error generating ${url}:`, error)
        }
      }))
    }

    // Save build cache
    if (cfg.cache) {
      await buildCache.save()
    }

    // Generate 404 page
    if (cfg.generate404) {
      const notFoundPath = path.join(cfg.pagesDir, '404.stx')
      if (fs.existsSync(notFoundPath)) {
        const notFoundDeps = new Set<string>()
        const notFoundOptions = { ...config, debug: false, cache: false }
        const html = await processDirectives(
          await Bun.file(notFoundPath).text(),
          {},
          notFoundPath,
          notFoundOptions,
          notFoundDeps
        )
        await Bun.write(path.join(cfg.outputDir, '404.html'), html)
      } else {
        // Generate default 404
        const default404 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .container { text-align: center; }
    h1 { font-size: 6rem; margin: 0; color: #333; }
    p { color: #666; }
    a { color: #0066cc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>Page not found</p>
    <a href="/">Go home</a>
  </div>
</body>
</html>`
        await Bun.write(path.join(cfg.outputDir, '404.html'), default404)
      }
    }

    // Generate sitemap
    if (cfg.sitemap && sitemapEntries.length > 0) {
      const sitemap = generateSitemap(sitemapEntries, cfg.domain)
      const sitemapPath = path.join(cfg.outputDir, 'sitemap.xml')
      await Bun.write(sitemapPath, sitemap)
      result.sitemapPath = sitemapPath
      console.log(`Generated sitemap.xml with ${sitemapEntries.length} URLs`)
    }

    // Generate RSS feed
    if (cfg.rss) {
      const rssConfig = typeof cfg.rss === 'object' ? cfg.rss : {
        title: 'Site Feed',
        description: 'Latest updates',
        link: cfg.domain,
      }

      let items: RSSItem[] = []
      if (rssConfig.getItems) {
        items = await rssConfig.getItems()
      }

      const rssFeed = generateRSSFeed(rssConfig, items)
      const rssPath = path.join(cfg.outputDir, 'rss.xml')
      await Bun.write(rssPath, rssFeed)
      result.rssPath = rssPath
      console.log(`Generated rss.xml with ${items.length} items`)
    }

    // Copy public directory
    if (cfg.publicDir && fs.existsSync(cfg.publicDir)) {
      await copyDirectory(cfg.publicDir, cfg.outputDir)
      console.log(`Copied public assets from ${cfg.publicDir}`)
    }

  } catch (error) {
    await cfg.hooks.onError?.(error as Error)
    throw error
  }

  result.buildTime = Date.now() - startTime

  // Build complete hook
  await cfg.hooks.onBuildEnd?.(result)

  console.log(`
Build complete!
  Total: ${result.totalPages} pages
  Success: ${result.successCount}
  Cached: ${result.cachedCount}
  Failed: ${result.failedCount}
  Time: ${result.buildTime}ms
`)

  return result
}

/**
 * Copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  const entries = await fs.promises.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await fs.promises.mkdir(destPath, { recursive: true })
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.promises.copyFile(srcPath, destPath)
    }
  }
}

// =============================================================================
// ISR Functions
// =============================================================================

/**
 * Create ISR handler for runtime revalidation
 */
export function createISRHandler(options: SSGConfig = {}): {
  get: (route: string) => Promise<{ html: string; headers: Record<string, string> } | null>
  revalidate: (route: string) => Promise<void>
  invalidate: (route: string | RegExp) => Promise<void>
} {
  const cacheDir = options.cacheDir || '.stx/ssg-cache'
  const cache = new FileISRCache(cacheDir)
  const revalidateTime = options.revalidate || 3600

  return {
    async get(route: string) {
      const cached = await cache.get(route)

      if (!cached) {
        return null
      }

      const needsRevalidation = Date.now() > cached.revalidateAfter

      // Return stale content while revalidating in background
      if (needsRevalidation) {
        // Trigger background revalidation
        this.revalidate(route).catch(console.error)
      }

      return {
        html: cached.html,
        headers: {
          'Cache-Control': `public, max-age=${revalidateTime}, stale-while-revalidate=${revalidateTime * 2}`,
          'ETag': cached.etag,
          'X-ISR-Generated': new Date(cached.generatedAt).toISOString(),
          ...cached.headers,
        },
      }
    },

    async revalidate(route: string) {
      const routes = createRouter('.', { pagesDir: options.pagesDir || 'pages' })
      const matchedRoute = routes.find(r => {
        const match = route.match(r.regex)
        return match !== null
      })

      if (!matchedRoute) {
        console.warn(`Route not found for revalidation: ${route}`)
        return
      }

      // Extract params from URL
      const match = route.match(matchedRoute.regex)
      const params: Record<string, string> = {}
      if (match) {
        matchedRoute.params.forEach((param, index) => {
          params[param] = match[index + 1]
        })
      }

      // Re-render the page
      const html = await renderPage(matchedRoute, params, {}, options)

      // Update cache
      await cache.set(route, {
        html,
        generatedAt: Date.now(),
        revalidateAfter: Date.now() + (revalidateTime as number) * 1000,
        etag: generateETag(html),
      })

      console.log(`Revalidated: ${route}`)
    },

    async invalidate(route: string | RegExp) {
      if (typeof route === 'string') {
        await cache.invalidate(route)
      } else {
        await cache.invalidatePattern(route)
      }
    },
  }
}

/**
 * Define static paths for dynamic routes (used in templates)
 */
export function defineStaticPaths(
  pathsFn: () => Promise<StaticPath[]> | StaticPath[]
): () => Promise<StaticPathsResult> {
  return async () => {
    const paths = await pathsFn()
    return { paths, fallback: false }
  }
}

// =============================================================================
// Content Loaders
// =============================================================================

/**
 * Create a markdown content loader
 */
export function createMarkdownLoader(): ContentLoader {
  return {
    name: 'markdown',
    extensions: ['.md', '.mdx'],
    async load(filePath: string): Promise<ContentResult> {
      const content = await Bun.file(filePath).text()

      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      let data: Record<string, unknown> = {}
      let body = content

      if (frontmatterMatch) {
        // Parse YAML frontmatter (simple parser)
        const frontmatter = frontmatterMatch[1]
        body = content.slice(frontmatterMatch[0].length).trim()

        for (const line of frontmatter.split('\n')) {
          const colonIndex = line.indexOf(':')
          if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim()
            let value: unknown = line.slice(colonIndex + 1).trim()

            // Parse value types
            if (value === 'true') value = true
            else if (value === 'false') value = false
            else if (/^\d+$/.test(value as string)) value = parseInt(value as string, 10)
            else if (/^\d+\.\d+$/.test(value as string)) value = parseFloat(value as string)
            else if ((value as string).startsWith('[') && (value as string).endsWith(']')) {
              value = (value as string).slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
            }

            data[key] = value
          }
        }
      }

      // Simple markdown to HTML (would use a proper parser in production)
      const html = body
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
        .replace(/\n/gim, '<br>')

      // Generate TOC
      const toc: TocItem[] = []
      const headingRegex = /<h([1-6])>([^<]+)<\/h[1-6]>/gi
      let match
      while ((match = headingRegex.exec(html)) !== null) {
        const level = parseInt(match[1], 10)
        const text = match[2]
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        toc.push({ id, text, level })
      }

      return { content: html, data, toc }
    },
  }
}

// =============================================================================
// Exports
// =============================================================================

export default {
  generateStaticSite,
  createISRHandler,
  defineStaticPaths,
  createMarkdownLoader,
}
