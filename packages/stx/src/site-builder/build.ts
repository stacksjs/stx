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
import { join, relative } from 'node:path'
import process from 'node:process'
import stxPlugin from 'bun-plugin-stx'
import { injectCrosswindCSS } from '../dev-server/crosswind'
import { injectSeo } from './seo'
import { generateSitemap, type SitemapEntry } from './sitemap'
import { generateRobots } from './robots'
import { injectRouterScript } from './router'
import { injectThemeBootstrap } from './theme'
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

  for (const file of htmlFiles) {
    const fullPath = join(outDir, file)
    let html = readFileSync(fullPath, 'utf8')

    // Strip references to the empty chunk files we just deleted.
    html = stripDeadScriptTags(html)

    html = await injectCrosswindCSS(html, process.cwd())
    html = injectSeo(html, options, options.pages?.[pathFromFile(file)], pathFromFile(file))
    html = injectThemeBootstrap(html, options)
    html = autoWrapContent(html)
    if (options.spa !== false)
      html = await injectRouterScript(html, options.router)

    writeFileSync(fullPath, html)
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

  // sitemap.xml
  if (options.sitemap !== false) {
    const entries: SitemapEntry[] = htmlFiles
      .filter(f => f !== '404.html')
      .map(f => ({ path: pathFromFile(f), page: options.pages?.[pathFromFile(f)] }))
    writeFileSync(join(outDir, 'sitemap.xml'), generateSitemap(options, entries))
  }

  // robots.txt
  const robots = generateRobots(options)
  if (robots !== null)
    writeFileSync(join(outDir, 'robots.txt'), robots)

  const builtPages = htmlFiles.map(pathFromFile)
  return { outDir, pages: builtPages, durationMs: Date.now() - start }
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

  let wrapStart = 0
  const navOrHeaderClose = [...inner.matchAll(/<\/(?:nav|header)>/gi)]
  if (navOrHeaderClose.length > 0) {
    const last = navOrHeaderClose[navOrHeaderClose.length - 1]
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
