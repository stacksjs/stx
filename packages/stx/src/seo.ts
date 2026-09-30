/**
 * SEO (Search Engine Optimization) Module
 *
 * Provides directives and utilities for generating SEO-related HTML:
 * - `@meta('name', 'content')` / `@meta('name', expression)` - Generate meta tags
 * - `@metaTag({ name, property, content })` - Meta tags with full control
 * - `@structuredData({ ... })` / `@structuredData(expression)` - JSON-LD structured data
 * - `@seo({ title, description, ... })` / `@seo(expression)` - Comprehensive SEO generation
 *
 * Every argument is an expression evaluated against the template's context, so
 * a variable, a spread or a function call works wherever a literal does. A
 * directive that cannot produce its tag says so: an inline comment where the
 * tag would have been and a console warning naming the file.
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
import type { HeadConfig } from './head'
import type { MetaTagAttrs } from './meta-arguments'
import {
  describeValue,
  evaluateDirectiveArgument,
  isPlainRecord,
  replaceDirectiveCalls,
  reportDirectiveFailure,
  splitTopLevelArgs,
  warnDirective,
} from './directive-arguments'
import { ErrorCodes, inlineError } from './error-handling'
import { mergeHeadConfigs } from './head'
import { resolveMetaArguments } from './meta-arguments'

// =============================================================================
// Types
// =============================================================================

interface MetaTag {
  name?: string
  property?: string
  content: string
  httpEquiv?: string
}

// =============================================================================
// Meta Tag Processing
// =============================================================================

/**
 * `@name(` at a directive boundary. The lookbehind keeps an address such as
 * `hello@seo(...)` and an escaped `@@meta` from being read as a call.
 */
const META_CALL = /(?<![\w$@])@meta\s*\(/g
const META_TAG_CALL = /(?<![\w$@])@metaTag\s*\(/g
const STRUCTURED_DATA_CALL = /(?<![\w$@])@structuredData\s*\(/g
const SEO_CALL = /(?<![\w$@])@seo\s*\(/g

function unterminated(label: string, filePath: string): (call: string) => string {
  return call => reportDirectiveFailure(label, call, 'the call has no closing parenthesis', filePath, ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
}

function renderMetaTag(tag: MetaTagAttrs): string {
  return 'property' in tag
    ? `<meta property="${escapeHtml(tag.property)}" content="${escapeHtml(tag.content)}">`
    : `<meta name="${escapeHtml(tag.name)}" content="${escapeHtml(tag.content)}">`
}

/**
 * Process `@meta(...)` and `@metaTag({...})` in place, emitting the tags where
 * the directives sit.
 *
 * This is the pass a partial's directives go through (a head partial is inside
 * `<head>` already), and the page-level catch-all for any `@meta` the staging
 * directive did not take. Arguments are resolved by `resolveMetaArguments`:
 * `@meta('author', 'Jane')`, `@meta('author', author)`,
 * `@meta('og:title', post.title)`, and the one-argument `@meta('og:title')`.
 */
export function processMetaDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  _options: StxOptions,
): string {
  if (!template.includes('@meta'))
    return template

  let output = replaceDirectiveCalls(template, META_CALL, (args, call) => {
    const resolved = resolveMetaArguments(splitTopLevelArgs(args), context)
    if (resolved.kind === 'tag')
      return renderMetaTag(resolved.tag)
    if (resolved.kind === 'empty')
      return ''
    return reportDirectiveFailure('Meta', call, resolved.message, filePath, resolved.code)
  }, unterminated('Meta', filePath))

  output = replaceDirectiveCalls(output, META_TAG_CALL, (args, call) => {
    const result = evaluateDirectiveArgument(args, context)
    if (!result.ok)
      return reportDirectiveFailure('MetaTag', call, result.message, filePath, result.code)
    if (result.value === undefined || result.value === null)
      return ''
    if (!isPlainRecord(result.value)) {
      return reportDirectiveFailure('MetaTag', call, `expected an object such as { name, content }, got ${describeValue(result.value)}`, filePath, ErrorCodes.TYPE_ERROR)
    }

    const attrs = result.value as Partial<Record<keyof MetaTag, unknown>>
    if (!attrs.name && !attrs.property && !attrs.httpEquiv) {
      return reportDirectiveFailure('MetaTag', call, 'the tag needs a name, property or httpEquiv', filePath, ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
    }
    // A tag with nothing to say is left out, as @meta does, rather than
    // shipped as an empty `<meta name="author">`.
    if (attrs.content === undefined || attrs.content === null || attrs.content === '' || attrs.content === false)
      return ''

    let tag = '<meta'
    if (attrs.name)
      tag += ` name="${escapeHtml(attrs.name)}"`
    if (attrs.property)
      tag += ` property="${escapeHtml(attrs.property)}"`
    if (attrs.httpEquiv)
      tag += ` http-equiv="${escapeHtml(attrs.httpEquiv)}"`
    tag += ` content="${escapeHtml(attrs.content)}">`
    return tag
  }, unterminated('MetaTag', filePath))

  return output
}

// =============================================================================
// Structured Data
// =============================================================================

/**
 * JSON-LD with `@context` filled in where it is missing, or `null` when the
 * value is not something JSON-LD can hold. Copies rather than mutating: the
 * object usually belongs to the page's server script, and another directive
 * may read it after this one.
 */
function withSchemaContext(value: unknown): Record<string, unknown> | Record<string, unknown>[] | null {
  const fill = (item: Record<string, unknown>): Record<string, unknown> =>
    item['@context'] ? { ...item } : { ...item, '@context': 'https://schema.org' }

  if (isPlainRecord(value))
    return fill(value)
  if (Array.isArray(value) && value.length > 0 && value.every(isPlainRecord))
    return value.map(fill)
  return null
}

/**
 * The JSON-LD `<script>` for `data`.
 *
 * `</` is escaped so a value containing `</script>` cannot close the block and
 * open markup of its own; `</` would do too, but `<\/` is what every
 * existing page already ships.
 */
function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data).replace(/<\//g, '<\\/')
  return `<script type="application/ld+json">${json}</script>`
}

/**
 * Process `@structuredData(...)` for JSON-LD.
 *
 * The argument is any expression that evaluates to an object, or an array of
 * objects: `@structuredData({ '@type': 'Product', name })`,
 * `@structuredData(product)`, `@structuredData(buildSchema(post))`. schema.org
 * is filled in as the `@context` when the data has none.
 */
export function processStructuredData(
  template: string,
  context: Record<string, any>,
  filePath: string,
): string {
  if (!template.includes('@structuredData'))
    return template

  return replaceDirectiveCalls(template, STRUCTURED_DATA_CALL, (args, call) => {
    const result = evaluateDirectiveArgument(args, context)
    if (!result.ok)
      return reportDirectiveFailure('StructuredData', call, result.message, filePath, result.code)
    if (result.value === undefined || result.value === null)
      return ''

    const data = withSchemaContext(result.value)
    if (!data) {
      return reportDirectiveFailure('StructuredData', call, `expected an object or an array of objects, got ${describeValue(result.value)}`, filePath, ErrorCodes.TYPE_ERROR)
    }

    try {
      return jsonLdScript(data)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return reportDirectiveFailure('StructuredData', call, `the data cannot be written as JSON: ${message}`, filePath, ErrorCodes.EVALUATION_ERROR)
    }
  }, unterminated('StructuredData', filePath))
}

// =============================================================================
// SEO Directive
// =============================================================================

/** Every key `@seo` reads. Anything else is ignored, so it is reported. */
const SEO_KEYS = new Set(['title', 'description', 'keywords', 'robots', 'canonical', 'openGraph', 'twitter', 'structuredData'])

/** Where the keys people reach for first actually live. */
const SEO_KEY_HINTS: Record<string, string> = {
  image: 'openGraph.image',
  url: 'canonical or openGraph.url',
  type: 'openGraph.type',
  siteName: 'openGraph.siteName',
  locale: 'openGraph.locale',
  og: 'openGraph',
  author: '@meta(\'author\', ...)',
}

/**
 * Process `@seo(...)` for title, description, Open Graph, Twitter and
 * structured data tags.
 *
 * The argument is any expression that evaluates to an object:
 * `@seo({ title, description })`, `@seo(seo)`, `@seo({ ...seo, title })`,
 * `@seo(buildSeo(page))`. `null` or `undefined` from a variable that exists
 * renders nothing; a variable that does not exist, a value that is not an
 * object, and keys `@seo` does not read are all reported.
 */
export function processSeoDirective(
  template: string,
  context: Record<string, any>,
  filePath: string,
  _options: StxOptions,
): string {
  if (!template.includes('@seo'))
    return template

  return replaceDirectiveCalls(template, SEO_CALL, (args, call) => {
    if (!args.trim()) {
      return reportDirectiveFailure('SEO', call, 'expected an object: @seo({ title, description }) or @seo(seoVariable)', filePath, ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
    }

    const result = evaluateDirectiveArgument(args, context)
    if (!result.ok)
      return reportDirectiveFailure('SEO', call, result.message, filePath, result.code)
    if (result.value === undefined || result.value === null)
      return ''
    if (!isPlainRecord(result.value)) {
      return reportDirectiveFailure('SEO', call, `expected an object such as { title, description }, got ${describeValue(result.value)}`, filePath, ErrorCodes.TYPE_ERROR)
    }

    try {
      return renderSeoTags(result.value as Partial<SeoConfig>, call, filePath)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return reportDirectiveFailure('SEO', call, `Error processing @seo directive: ${message}`, filePath, ErrorCodes.EVALUATION_ERROR)
    }
  }, unterminated('SEO', filePath))
}

/** The value of an optional nested object, reporting one of the wrong shape. */
function nestedConfig<T>(config: Record<string, unknown>, key: string, call: string, filePath: string): T | undefined {
  const value = config[key]
  if (value === undefined || value === null || value === false)
    return undefined
  if (isPlainRecord(value))
    return value as T
  warnDirective(call, `${key} must be an object, got ${describeValue(value)}; its tags were left out`, filePath)
  return undefined
}

function renderSeoTags(config: Partial<SeoConfig>, call: string, filePath: string): string {
  const unknown = Object.keys(config).filter(key => !SEO_KEYS.has(key))
  if (unknown.length > 0) {
    const described = unknown.map(key => SEO_KEY_HINTS[key] ? `${key} (use ${SEO_KEY_HINTS[key]})` : key).join(', ')
    warnDirective(call, `@seo does not read ${described}; ${unknown.length === 1 ? 'it was' : 'they were'} ignored`, filePath)
  }

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
  const og = nestedConfig<NonNullable<SeoConfig['openGraph']>>(config, 'openGraph', call, filePath)
  if (og) {
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
        metaTags += `<meta property="og:image:width" content="${escapeHtml(String(og.imageWidth))}">\n`
      }

      if (og.imageHeight) {
        metaTags += `<meta property="og:image:height" content="${escapeHtml(String(og.imageHeight))}">\n`
      }

      if (og.imageType) {
        metaTags += `<meta property="og:image:type" content="${escapeHtml(og.imageType)}">\n`
      }
    }

    if (og.siteName) {
      metaTags += `<meta property="og:site_name" content="${escapeHtml(og.siteName)}">\n`
    }

    if (og.locale) {
      metaTags += `<meta property="og:locale" content="${escapeHtml(og.locale)}">\n`
    }

    if (og.profile) {
      const profile: [string, string | undefined][] = [
        ['first_name', og.profile.firstName],
        ['last_name', og.profile.lastName],
        ['username', og.profile.username],
        ['gender', og.profile.gender],
      ]
      for (const [key, value] of profile) {
        if (value)
          metaTags += `<meta property="profile:${key}" content="${escapeHtml(value)}">\n`
      }
    }
  }

  // Twitter
  const twitter = nestedConfig<NonNullable<SeoConfig['twitter']>>(config, 'twitter', call, filePath)
  if (twitter) {
    metaTags += `<meta name="twitter:card" content="${escapeHtml(twitter.card || 'summary_large_image')}">\n`

    if (twitter.title || config.title) {
      const twitterTitle = twitter.title || config.title || ''
      metaTags += `<meta name="twitter:title" content="${escapeHtml(twitterTitle)}">\n`
    }

    if (twitter.description || config.description) {
      const twitterDesc = twitter.description || config.description || ''
      metaTags += `<meta name="twitter:description" content="${escapeHtml(twitterDesc)}">\n`
    }

    if (twitter.image || (og && og.image)) {
      const twitterImage = twitter.image || (og ? og.image : '') || ''
      metaTags += `<meta name="twitter:image" content="${escapeHtml(twitterImage)}">\n`

      // A card image with no alt text is announced as "image" and nothing
      // else. The Open Graph alt describes the same picture whenever the
      // card falls back to the Open Graph image.
      const twitterImageAlt = twitter.imageAlt || (!twitter.image && og ? og.imageAlt : undefined)
      if (twitterImageAlt)
        metaTags += `<meta name="twitter:image:alt" content="${escapeHtml(twitterImageAlt)}">\n`
    }

    if (twitter.site) {
      metaTags += `<meta name="twitter:site" content="${escapeHtml(twitter.site)}">\n`
    }

    if (twitter.creator) {
      metaTags += `<meta name="twitter:creator" content="${escapeHtml(twitter.creator)}">\n`
    }
  }

  // Structured data. Filled in the same way @structuredData fills it: JSON-LD
  // with no @context is not schema.org to anything that reads it.
  if (config.structuredData !== undefined && config.structuredData !== null) {
    const data = withSchemaContext(config.structuredData)
    if (data)
      metaTags += `${jsonLdScript(data)}\n`
    else
      warnDirective(call, `structuredData must be an object or an array of objects, got ${describeValue(config.structuredData)}; it was left out`, filePath)
  }

  return metaTags.trim()
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

  // If the HTML already has meta tags or if auto-injection is disabled, return unchanged.
  // `__stx_seo_staged` is the same check for the staged path below: once this
  // render has contributed the block to the head collection it is no longer
  // findable in `html`, so the marker alone would let a nested call stage it a
  // second time.
  if (html.includes('<!-- stx SEO Tags -->')
    || context.__stx_seo_staged === true
    || options.skipDefaultSeoTags === true) {
    return html
  }

  // Skip default injection when the page already produced its own SEO tags
  // via `useSeoMeta()` / `useHead()`. Without this, every page rendered with
  // useSeoMeta ends up with two <title> tags and two <meta property="og:title">
  // tags: the default injector runs first (this function), then renderHead
  // appends user values, so browsers see "stx Project" first and use it.
  // Two checks because useHead may not have rendered into the html yet at this
  // stage — `context.__stx_runtime_head` is the per-render staging area
  // populated by useSeoMeta(), and is the source-of-truth before renderHead
  // emits the final tags into <head>.
  const runtimeHead = context.__stx_runtime_head as
    | { title?: string, meta?: Array<Record<string, string>> }
    | undefined
  const hasUserSeo = !!(
    runtimeHead?.title
    || runtimeHead?.meta?.some(m =>
      m.property === 'og:title'
      || m.name === 'og:title'
      || m.name === 'twitter:title'
      || m.name === 'description',
    )
  )
  if (hasUserSeo) {
    return html
  }
  if (
    /<meta\s+(?:[^>]*\s)?property=["']og:title["']/i.test(html)
    || /<meta\s+(?:[^>]*\s)?name=["']og:title["']/i.test(html)
    || /<meta\s+(?:[^>]*\s)?name=["']twitter:title["']/i.test(html)
  ) {
    return html
  }

  // Check if document has a head tag
  if (!html.includes('<head>') && !html.includes('<head ')) {
    return html
  }

  // Check if title is already set
  const hasTitle = html.includes('<title>') || html.includes('</title>')

  // The page's own <title> and <meta name="description"> rank below anything
  // the render context supplies but above every configured default. A page that
  // writes a plain <title> and description without og/twitter tags used to get
  // "stx Project" as its og:title and twitter:title, plus a second, placeholder
  // <meta name="description"> ahead of its own -- so link previews and search
  // engines saw the placeholder instead of what the page says about itself.
  const pageHead = headSection(html)
  const pageTitle = readPageTitle(pageHead)
  const pageDescription = readPageDescription(pageHead)

  // Get the title from context or fallback
  let title = ''
  if (context.title) {
    title = context.title
  }
  else if (context.meta && context.meta.title) {
    title = context.meta.title
  }
  else if (pageTitle) {
    title = pageTitle
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
  else if (pageDescription) {
    description = pageDescription
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

  // Build basic SEO tags.
  //
  // <meta name="title"> and <meta name="description"> are left out when the
  // page already states them: a second description is a duplicate that
  // crawlers resolve by taking the first one, which used to be ours. The
  // og/twitter tags are still emitted -- they are what the page lacked.
  const titleTag = hasTitle ? '' : `\n<meta name="title" content="${escapeHtml(title)}">`
  const descriptionTag = hasPageDescription(pageHead) ? '' : `\n<meta name="description" content="${escapeHtml(description)}">`
  let seoTagsMinimal = `
<!-- stx SEO Tags -->${titleTag}${descriptionTag}
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

  // Add title tag if missing.
  //
  // This one stays a splice even when the block below is staged. The title has
  // to be IN the document by the time renderHead runs, a few steps later: that
  // pass replaces an existing <title> with a higher-precedence one instead of
  // appending a second. A staged title is invisible to it, so the page would
  // end up with the @head title and then ours -- two titles, browser uses the
  // first. It is also the rare path; a document that already has a <title>
  // pays nothing here.
  let result = html
  if (!hasTitle) {
    result = result.replace(/<head[^>]*>/, `$&\n<title>${escapeHtml(title)}</title>`)
  }

  // Contribute the meta block to the render's head collection when one is open,
  // rather than splicing it in here (stacksjs/stx#1945). Splicing rebuilds the
  // whole document to insert ~500 bytes: on a 182KB page that was measured at
  // 172KB allocated, 99.7% of it a copy of bytes that did not change. Staged,
  // it rides the single rebuild the top-level pipeline already performs for the
  // cloak style and the build-id meta.
  //
  // Nothing else in the pipeline reads these tags between here and that
  // rebuild -- renderHead only reconciles <title>, which is why that one is
  // handled above -- and the passes that strip the block later (render.ts,
  // build-views.ts, site-builder/seo.ts) all run on the finished document.
  const staged = context.__stx_head_injections as { afterOpen: string[] } | undefined
  if (staged) {
    context.__stx_seo_staged = true
    staged.afterOpen.push(`\n${seoTagsMinimal}\n`)
    return result
  }

  // Add SEO tags
  return result.replace(/<head[^>]*>/, `$&\n${seoTagsMinimal}\n`)
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * The document's <head>, so a <title> inside an inline SVG or a description
 * meta in body content is never mistaken for the page's own. A document whose
 * head is never closed is searched whole.
 */
function headSection(html: string): string {
  const end = html.search(/<\/head\s*>/i)
  return end === -1 ? html : html.slice(0, end)
}

/**
 * Undo the five entities escapeHtml produces. The page's own title and
 * description arrive already escaped and are escaped again on the way out,
 * so without this `Tom &amp; Jerry` would be emitted as `Tom &amp;amp; Jerry`.
 * `&amp;` goes last so `&amp;lt;` stays the literal text `&lt;`.
 */
function unescapeBasicEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, '\'')
    .replace(/&amp;/g, '&')
}

/** Text of the page's own <title>, trimmed; empty when there is none. */
function readPageTitle(head: string): string {
  const match = head.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title\s*>/i)
  return match ? unescapeBasicEntities(match[1].trim()) : ''
}

/** Every `<meta name="description" ...>` in the head, in either attribute order. */
function descriptionMetaTags(head: string): string[] {
  return (head.match(/<meta\s[^>]*>/gi) || [])
    .filter(tag => /\sname\s*=\s*["']description["']/i.test(tag))
}

function hasPageDescription(head: string): boolean {
  return descriptionMetaTags(head).length > 0
}

/** Content of the page's own description meta, trimmed; empty when absent or blank. */
function readPageDescription(head: string): string {
  for (const tag of descriptionMetaTags(head)) {
    const match = tag.match(/\scontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    const content = (match?.[1] ?? match?.[2] ?? '').trim()
    if (content)
      return unescapeBasicEntities(content)
  }
  return ''
}

/**
 * Escape HTML entities in a value.
 * Local copy to avoid circular dependencies with expressions module.
 *
 * Takes anything, not just strings: a title that arrives as a number (a year,
 * a product id) used to throw `str.replace is not a function` out of the whole
 * render, or out of @seo as an error comment in place of every tag.
 */
function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// =============================================================================
// Custom Directives
// =============================================================================

/**
 * SEO meta directive.
 *
 * Stages the tag on the render's head rather than returning markup. A `<meta>`
 * emitted where the directive happens to sit lands in the `<body>`, where no
 * crawler reads it: the tag is present in the HTML, the page looks correct, and
 * the description silently never applies. Staging it lets the document shell
 * put it in `<head>`, which is the only place it means anything.
 *
 * This directive shadows `processMetaDirective` in head.ts, since custom
 * directives run first. It therefore has to do that function's job, which is
 * why it takes its arguments as written (`rawParams`) and resolves them with
 * the same `resolveMetaArguments` the other two @meta passes use: a quoted
 * value is text, anything else is an expression.
 */
export const metaDirective: CustomDirective = {
  name: 'meta',
  rawParams: true,
  handler: (_content, params, context, filePath) => {
    const resolved = resolveMetaArguments(params, context ?? {})

    if (resolved.kind === 'error')
      return reportDirectiveFailure('Meta', `@meta(${params.join(', ')})`, resolved.message, filePath, resolved.code)
    if (resolved.kind === 'empty')
      return ''

    if (context) {
      context.__stx_runtime_head = mergeHeadConfigs(
        (context.__stx_runtime_head as HeadConfig) ?? {},
        { meta: [resolved.tag] },
      )
    }

    return ''
  },
  hasEndTag: false,
}

/**
 * SEO structured data directive for JSON-LD generation, the block form:
 * `@structuredData { ... } @endstructuredData`. The body is JSON, not an
 * expression; `@structuredData(expression)` is the form that reads variables.
 */
export const structuredDataDirective: CustomDirective = {
  name: 'structuredData',
  handler: (content, _params, _context, _filePath) => {
    if (content.trim() === '') {
      return inlineError('StructuredData', 'structuredData directive requires JSON-LD content', ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
    }

    try {
      // Parse the JSON content
      const data = JSON.parse(content)

      // Ensure required properties are present
      if (!data['@context']) {
        data['@context'] = 'https://schema.org'
      }

      if (!data['@type']) {
        return inlineError('StructuredData', 'structuredData requires @type property', ErrorCodes.INVALID_DIRECTIVE_SYNTAX)
      }

      // Escaped like the expression form: a `</script>` inside a value used to
      // end this block and render whatever followed it as markup.
      return jsonLdScript(data)
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return inlineError('StructuredData', errorMessage, ErrorCodes.EVALUATION_ERROR)
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
 * @param options.extensions - File extensions to include
 * @param options.ignore - Patterns to ignore
 * @param options.baseUrl - Base URL for the sitemap
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
