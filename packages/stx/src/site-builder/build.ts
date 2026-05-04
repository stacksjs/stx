import { Glob } from 'bun'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import process from 'node:process'
import stxPlugin from 'bun-plugin-stx'
import { injectCrosswindCSS } from '../dev-server/crosswind'
import { injectSeo } from './seo'
import { generateSitemap, type SitemapEntry } from './sitemap'
import { generateRobots } from './robots'
import { injectRouterScript } from './router'
import { injectThemeBootstrap } from './theme'
import {
  applyTranslations,
  buildAlternateLinks,
  buildLangPickerScript,
  localizePath,
  resolveI18n,
} from './i18n'
import type { BuildOptions, SiteConfig } from './types'

export interface BuildResult {
  outDir: string
  pages: string[]
  durationMs: number
}

/**
 * Build a static stx site end-to-end:
 * 1. Bundle all pages with bun-plugin-stx
 * 2. Inject Crosswind CSS into each HTML file
 * 3. Replace stx default SEO tags with site-specific ones
 * 4. Drop the empty bundle chunks bun-plugin-stx leaves behind
 * 5. Copy public/ assets verbatim
 * 6. Synthesize 404.html (uses pages/404.stx if present, else clones index)
 * 7. Generate sitemap.xml and robots.txt
 */
export async function buildStaticSite(options: BuildOptions): Promise<BuildResult> {
  const start = Date.now()
  const pagesDir = options.pagesDir ?? 'pages'
  const outDir = options.outDir ?? 'dist'
  const publicDir = options.publicDir ?? 'public'

  if (!options.noClean)
    rmSync(outDir, { recursive: true, force: true })

  mkdirSync(outDir, { recursive: true })

  const glob = new Glob(`${pagesDir}/**/*.stx`)
  const entrypoints = await Array.fromAsync(glob.scan('.'))
  if (entrypoints.length === 0)
    throw new Error(`No .stx files found in ${pagesDir}/`)

  const result = await Bun.build({
    entrypoints,
    outdir: outDir,
    plugins: [stxPlugin()],
    naming: { entry: '[name].[ext]' },
  })

  if (!result.success) {
    console.error(result.logs)
    throw new Error('Build failed')
  }

  // Drop empty chunk-*.js files — bun-plugin-stx emits a 0-byte JS sibling
  // for each .stx page. The HTML doesn't reference them, but they get
  // uploaded and 404 from any straggler <script> tags.
  pruneEmptyJsChunks(outDir)

  // Walk the actual emitted .html files (not the build result, which lists
  // chunks too) so we can rewrite them with SEO + Crosswind CSS.
  const htmlFiles = listFiles(outDir).filter(f => f.endsWith('.html'))
  const i18n = resolveI18n(options, process.cwd())
  // Used for locale-aware <a href> rewrites — any internal href that
  // matches one of these paths gets the current locale's prefix in
  // non-default-locale builds, so navigation stays within the locale.
  const knownPaths = new Set(htmlFiles.map(pathFromFile))

  for (const file of htmlFiles) {
    const fullPath = join(outDir, file)
    const sourceHtml = readFileSync(fullPath, 'utf8')
    const basePath = pathFromFile(file)

    // Single-locale (default) build: rewrite the file in place.
    const localesToEmit = i18n ? i18n.locales : [options.seo?.locale?.split(/[_-]/)[0] ?? 'en']

    for (const locale of localesToEmit) {
      let html = sourceHtml

      // Strip references to the empty chunk files we just deleted.
      html = stripDeadScriptTags(html)

      // Translation tokens — must run before SEO because page meta may use them.
      if (i18n)
        html = applyTranslations(html, i18n, locale)

      html = await injectCrosswindCSS(html, process.cwd())
      html = injectSeo(html, options, options.pages?.[basePath], basePath)

      if (i18n) {
        // Per-locale: <html lang>, hreflang alternates, og:locale,
        // canonical pointing at the *localized* URL (overriding the
        // default-locale canonical injectSeo just wrote).
        html = applyLocaleHead(html, options, i18n, locale, basePath)
        // Rewrite any internal `<a href="/...">` that points at a known
        // page so non-default-locale visitors stay inside their locale
        // when they click around. Without this, every nav click on a
        // /de/ page would yank the visitor back to the English version
        // even though the link text was localized.
        html = localizeInternalLinks(html, locale, i18n.defaultLocale, knownPaths)
      }

      html = injectThemeBootstrap(html, options)
      html = autoWrapContent(html)

      if (i18n)
        html = html.replace(/<\/body>/i, `${buildLangPickerScript(i18n, locale)}\n</body>`)

      if (options.spa !== false)
        html = await injectRouterScript(html, options.router)

      const targetFile = i18n ? localePathToFile(basePath, locale, i18n.defaultLocale) : file
      const targetPath = join(outDir, targetFile)
      mkdirSync(dirnameOf(targetPath), { recursive: true })
      writeFileSync(targetPath, html)

      // Default-locale: keep the original file name. Non-default: the
      // original file might still be present from the bun build pass —
      // remove it so we don't ship dupes.
      if (i18n && locale !== i18n.defaultLocale && targetFile !== file) {
        // (no-op: targetFile is under /<code>/, original file stays for default-locale pass)
      }
    }
  }

  // Public assets — copied last so they overwrite any same-named files
  if (existsSync(publicDir))
    cpSync(publicDir, outDir, { recursive: true })

  // 404.html
  const fourOhFourSrc = join(outDir, '404.html')
  if (!existsSync(fourOhFourSrc) && existsSync(join(outDir, 'index.html'))) {
    // No pages/404.stx — synthesize a minimal 404 from index with a swapped title
    const fallback = readFileSync(join(outDir, 'index.html'), 'utf8')
      .replace(/<title>[^<]*<\/title>/i, `<title>404 — ${escapeText(options.name)}</title>`)
    writeFileSync(fourOhFourSrc, fallback)
  }

  // sitemap.xml — for multi-locale builds, emit one entry per
  // (page, locale) combination so search engines can crawl every
  // translation. Page-level metadata (priority, changefreq) carries
  // over from the base path config.
  if (options.sitemap !== false) {
    const entries: SitemapEntry[] = []
    const basePaths = htmlFiles
      .filter(f => f !== '404.html')
      .map(pathFromFile)
    const sitemapLocales = i18n ? i18n.locales : [null]
    for (const basePath of basePaths) {
      const meta = options.pages?.[basePath]
      for (const loc of sitemapLocales) {
        const path = (loc && i18n) ? localizePath(basePath, loc, i18n.defaultLocale) : basePath
        entries.push({ path, page: meta })
      }
    }
    writeFileSync(join(outDir, 'sitemap.xml'), generateSitemap(options, entries))
  }

  // robots.txt
  const robots = generateRobots(options)
  if (robots !== null)
    writeFileSync(join(outDir, 'robots.txt'), robots)

  const builtPages = htmlFiles.map(pathFromFile)
  return { outDir, pages: builtPages, durationMs: Date.now() - start }
}

function dirnameOf(p: string): string { return dirname(p) }

/** Reverse of pathFromFile, scoped to a locale. */
function localePathToFile(basePath: string, locale: string, defaultLocale: string): string {
  const localized = localizePath(basePath, locale, defaultLocale)
  if (localized === '/') return 'index.html'
  // Strip leading and trailing slashes — trailing slash on a locale root
  // (`/de/`) is for URL routing, not a path component.
  const trimmed = localized.replace(/^\//, '').replace(/\/$/, '')
  if (!trimmed.includes('/')) {
    // Just a top-level segment like "/about" or "/de"
    if (locale !== defaultLocale && trimmed === locale)
      return `${locale}/index.html`
    return `${trimmed}.html`
  }
  // Nested: /de/about → de/about.html (or /de/404.html)
  return `${trimmed}.html`.replace(/\.html\.html$/, '.html')
}

function pathFromFile(file: string): string {
  if (file === 'index.html') return '/'
  return `/${file.replace(/\.html$/, '').replace(/\/index$/, '')}`
}

function listFiles(dir: string, base: string = dir): string[] {
  const out: string[] = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(full, base))
    else out.push(relative(base, full))
  }
  return out
}

function pruneEmptyJsChunks(outDir: string): void {
  for (const file of listFiles(outDir)) {
    if (!/^chunk-.*\.js(?:\.map)?$/.test(file)) continue
    const full = join(outDir, file)
    try {
      const stat = statSync(full)
      if (stat.size === 0) unlinkSync(full)
    }
    catch {}
  }
}

function stripDeadScriptTags(html: string): string {
  return html.replace(/<script[^>]*src=["']\.\/chunk-[^"']*\.js["'][^>]*><\/script>\s*/g, '')
}

/**
 * Apply per-locale `<html lang>`, hreflang alternates, og:locale, and
 * a localized canonical URL. Runs after `injectSeo` so it can overwrite
 * the canonical that step wrote with one that points at the actual
 * URL the user is on (with the locale prefix).
 */
function applyLocaleHead(
  html: string,
  site: SiteConfig,
  i18n: ReturnType<typeof resolveI18n>,
  locale: string,
  basePath: string,
): string {
  if (!i18n) return html

  // <html lang="…">
  if (/<html\b[^>]*\blang=/i.test(html))
    html = html.replace(/<html\b([^>]*)\blang="[^"]*"/i, `<html$1lang="${locale}"`)
  else
    html = html.replace(/<html\b([^>]*)>/i, `<html$1 lang="${locale}">`)

  const localizedUrl = `${site.url.replace(/\/$/, '')}${localizePath(basePath, locale, i18n.defaultLocale)}`

  // Replace canonical
  if (/<link rel="canonical"/.test(html)) {
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escapeAttr(localizedUrl)}">`)
  }

  // Replace og:locale
  const ogLocale = locale.includes('_') || locale.includes('-') ? locale : locale.toLowerCase()
  if (/<meta property="og:locale"/.test(html))
    html = html.replace(/<meta property="og:locale"[^>]*>/, `<meta property="og:locale" content="${escapeAttr(ogLocale)}">`)

  // Replace og:url with the localized URL
  if (/<meta property="og:url"/.test(html))
    html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${escapeAttr(localizedUrl)}">`)

  // hreflang alternates
  const alternates = buildAlternateLinks(site.url, basePath, i18n)
  if (!html.includes('hreflang='))
    html = html.replace(/<link rel="canonical"[^>]*>/, m => `${alternates}\n  ${m}`)

  return html
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Rewrite `<a href="/...">` on a non-default-locale page so internal
 * links point at the same locale, not the default locale's version.
 *
 * Matches only hrefs whose *path* portion is in `knownPaths` — query
 * strings and fragments are preserved on the rewritten URL. Hrefs that
 * already start with the locale prefix, that target external sites
 * (`https://`, `mailto:`, `tel:`, schemeless `//`), or that are pure
 * fragments (`#section`) are left alone. The default locale skips this
 * step entirely; its pages already live at the unprefixed paths.
 */
function localizeInternalLinks(
  html: string,
  locale: string,
  defaultLocale: string,
  knownPaths: Set<string>,
): string {
  if (locale === defaultLocale) return html
  return html.replace(
    /<a\b([^>]*?)\bhref="(\/[^"]*)"([^>]*)>/gi,
    (full, before, href, after) => {
      if (href.startsWith('//')) return full
      if (href === `/${locale}` || href === `/${locale}/` || href.startsWith(`/${locale}/`))
        return full
      const m = href.match(/^(\/[^?#]*)(.*)$/)
      if (!m) return full
      const [, pathOnly, rest] = m
      const normalized = pathOnly === '/' ? '/' : pathOnly.replace(/\/$/, '')
      if (!knownPaths.has(normalized)) return full
      const localized = normalized === '/' ? `/${locale}/` : `/${locale}${normalized}`
      return `<a${before}href="${localized}${rest}"${after}>`
    },
  )
}

/**
 * Wrap the page's body content in `<main>` if it isn't already, so the
 * SPA router's view-transition CSS (which targets `main, #app-content,
 * [data-stx-content]`) animates the content while leaving `<nav>`,
 * `<header>`, `<footer>`, and any other top-level elements stable
 * across navigation.
 *
 * Skips: pages already containing `<main>` or `[data-stx-content]`,
 * pages without a `<body>`. Wraps the run between the last
 * `<nav>...</nav>` / `<header>...</header>` close tag (if any) and the
 * first `<footer` open tag (if any), defaulting to the entire body
 * content. Trailing `</body>`-adjacent scripts (theme guard, router)
 * stay outside the wrap.
 */
function autoWrapContent(html: string): string {
  if (/<main\b/i.test(html) || /\bdata-stx-content\b/i.test(html))
    return html

  const bodyOpenMatch = html.match(/<body\b[^>]*>/i)
  const bodyCloseIdx = html.search(/<\/body\s*>/i)
  if (!bodyOpenMatch || bodyCloseIdx < 0) return html

  const bodyContentStart = bodyOpenMatch.index! + bodyOpenMatch[0].length
  const inner = html.slice(bodyContentStart, bodyCloseIdx)

  // Only treat <nav> as the "chrome above main" boundary. <header> is
  // ambiguous — it commonly holds the page's title/lede, which the
  // user expects to fade with the rest of the content on navigation.
  // Wrapping past it would leave the page hero static across hops and
  // make the transition feel partial.
  let wrapStart = 0
  const navClose = [...inner.matchAll(/<\/nav>/gi)]
  if (navClose.length > 0) {
    const last = navClose[navClose.length - 1]
    wrapStart = last.index! + last[0].length
  }

  let wrapEnd = inner.length
  const footerOpen = inner.search(/<footer\b/i)
  if (footerOpen !== -1)
    wrapEnd = Math.min(wrapEnd, footerOpen)
  const trailingScript = inner.search(/<script\b[^>]*data-stx-(?:theme-toggle|reparent-progress)\b/i)
  if (trailingScript !== -1)
    wrapEnd = Math.min(wrapEnd, trailingScript)

  if (wrapEnd <= wrapStart) return html
  const middle = inner.slice(wrapStart, wrapEnd)
  if (!middle.trim()) return html

  const newInner = `${inner.slice(0, wrapStart)}\n  <main>${middle}</main>\n${inner.slice(wrapEnd)}`
  return `${html.slice(0, bodyContentStart)}${newInner}${html.slice(bodyCloseIdx)}`
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function defineSiteConfig<T extends SiteConfig>(config: T): T {
  return config
}
