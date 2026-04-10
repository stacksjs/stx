/* eslint-disable no-console */
/**
 * Production Builder
 *
 * Orchestrates the production build process:
 * 1. Discover routes from pages/
 * 2. Generate shared assets (runtime, router)
 * 3. Compile all templates
 * 4. Generate CSS from all pages
 * 5. Write .output/ directory
 * 6. Generate manifest
 *
 * @module production-builder
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRouter, type Route } from './router'
import { buildRuntimeAsset, buildRouterAsset, type BuiltAsset } from './build-assets'
import { compileTemplate, type CompiledTemplate } from './template-compiler'
import { generateManifest, writeManifest, type ManifestRoute, type ManifestAssets } from './manifest'
import { ensureDocumentShell } from './document-shell'
import { stripDocumentWrapper } from './app-shell'
import { loadStxConfig } from './config'

/**
 * Production build configuration.
 *
 * Most fields are optional and fall back to `stx.config.ts` if not provided.
 * Resolution order for each field: explicit option → config file → default.
 */
export interface ProductionBuildOptions {
  /** Project root directory (default: process.cwd()) */
  root?: string
  /** Output directory (default: '.output') */
  outputDir?: string
  /** Enable debug/dev runtime (default: false) */
  debug?: boolean
  /** Components directory (default: stx.config componentsDir → 'components') */
  componentsDir?: string
  /** Partials directory (default: stx.config partialsDir → 'partials') */
  partialsDir?: string
  /** Layouts directory (default: stx.config layoutsDir → 'layouts') */
  layoutsDir?: string
  /**
   * Public assets directory. Files in this directory are copied verbatim
   * into `.output/public/` so the production server can serve them at the
   * URL root (matching the dev server behavior).
   * Default: stx.config publicDir → 'public'
   */
  publicDir?: string
}

/**
 * Result of a production build.
 */
export interface ProductionBuildResult {
  /** Number of pages compiled */
  pageCount: number
  /** Generated asset filenames */
  assets: ManifestAssets
  /** Output directory path */
  outputDir: string
  /** Build duration in ms */
  duration: number
}

/**
 * Files we never want to ship in a production build, regardless of where
 * they live in the user's `publicDir`. macOS finder metadata, editor
 * scratch files, and the like.
 */
const PUBLIC_ASSET_BLOCKLIST = new Set([
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  '.gitkeep',
  '.gitignore',
])

/**
 * Recursively copy a directory's contents into a destination, preserving
 * structure. Skips paths that already exist in the destination so we don't
 * clobber framework-written files (e.g. __stx/ and assets/), and skips
 * common junk files (.DS_Store, Thumbs.db, etc).
 */
function copyPublicAssets(srcDir: string, destDir: string): { copied: number, bytes: number } {
  let copied = 0
  let bytes = 0

  if (!fs.existsSync(srcDir)) {
    return { copied, bytes }
  }

  function walk(currentSrc: string, currentDest: string): void {
    const entries = fs.readdirSync(currentSrc, { withFileTypes: true })
    for (const entry of entries) {
      if (PUBLIC_ASSET_BLOCKLIST.has(entry.name)) continue

      const srcPath = path.join(currentSrc, entry.name)
      const destPath = path.join(currentDest, entry.name)

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true })
        walk(srcPath, destPath)
      }
      else if (entry.isFile()) {
        // Skip if a framework-written file already exists (e.g. __stx/runtime.js)
        if (fs.existsSync(destPath)) continue
        fs.copyFileSync(srcPath, destPath)
        copied++
        bytes += fs.statSync(destPath).size
      }
    }
  }

  walk(srcDir, destDir)
  return { copied, bytes }
}

/**
 * Build the stx application for production.
 *
 * Produces a `.output/` directory with:
 * - `public/__stx/` — fingerprinted runtime and router JS
 * - `public/assets/` — bundled CSS
 * - `public/<user files>` — copied verbatim from the project's `publicDir`
 *   (default: `public/`). Source images, fonts, robots.txt, sitemap.xml, etc.
 * - `server/pages/` — compiled template JSON files
 * - `server/fragments/` — SPA navigation fragments
 * - `manifest.json` — route map and asset hashes
 *
 * Reads `stx.config.ts` once at the start for `publicDir`, `componentsDir`,
 * `layoutsDir`, `partialsDir`, and `app.head`. Direct option overrides take
 * precedence over the config file.
 */
export async function buildForProduction(options: ProductionBuildOptions = {}): Promise<ProductionBuildResult> {
  const startTime = Date.now()
  const root = path.resolve(options.root || process.cwd())
  const outputDir = path.resolve(root, options.outputDir || '.output')

  console.log('[stx build] Starting production build...')

  // ── 0. Load stx.config.ts once ──
  // Resolution order for each setting: explicit option → config file → default
  let projectConfig: Record<string, any> = {}
  try {
    projectConfig = (await loadStxConfig()) as Record<string, any>
  }
  catch {
    // No config file — use defaults
  }

  const componentsDir = options.componentsDir ?? projectConfig.componentsDir ?? 'components'
  const partialsDir = options.partialsDir ?? projectConfig.partialsDir ?? 'partials'
  const layoutsDir = options.layoutsDir ?? projectConfig.layoutsDir ?? 'layouts'
  const publicDir = options.publicDir ?? projectConfig.publicDir ?? 'public'
  const headConfigDefault = projectConfig.app?.head || {}

  // ── 1. Clean output directory ──
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true })
  }

  // Create directory structure
  const dirs = [
    path.join(outputDir, 'public', '__stx'),
    path.join(outputDir, 'public', 'assets'),
    path.join(outputDir, 'server', 'pages'),
    path.join(outputDir, 'server', 'fragments'),
  ]
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // ── 2. Discover routes ──
  console.log('[stx build] Discovering routes...')
  const allRoutes = createRouter(root)
  // Filter out non-page files (components, layouts, partials)
  const excludeDirs = ['components', 'layouts', 'partials']
  const routes = allRoutes.filter(r => {
    return !excludeDirs.some(dir => r.pattern.startsWith(`/${dir}/`) || r.pattern === `/${dir}`)
  })
  console.log(`[stx build] Found ${routes.length} page routes (${allRoutes.length - routes.length} non-page files excluded)`)

  // ── 3. Generate shared assets ──
  console.log('[stx build] Generating shared assets...')
  const runtimeAsset = buildRuntimeAsset(options.debug)
  const routerAsset = buildRouterAsset()

  // Write runtime JS
  await Bun.write(
    path.join(outputDir, 'public', '__stx', runtimeAsset.filename),
    runtimeAsset.content,
  )
  // Write router JS
  await Bun.write(
    path.join(outputDir, 'public', '__stx', routerAsset.filename),
    routerAsset.content,
  )

  console.log(`[stx build] Runtime: ${runtimeAsset.filename} (${(runtimeAsset.content.length / 1024).toFixed(1)}KB)`)
  console.log(`[stx build] Router: ${routerAsset.filename} (${(routerAsset.content.length / 1024).toFixed(1)}KB)`)

  // ── 4. Compile all templates ──
  console.log('[stx build] Compiling templates...')
  const compiledPages: CompiledTemplate[] = []
  const manifestRoutes: ManifestRoute[] = []

  for (const route of routes) {
    try {
      const compiled = await compileTemplate(route.filePath, route.pattern, {
        componentsDir,
        partialsDir,
        layoutsDir,
        debug: options.debug,
      })

      compiledPages.push(compiled)

      // Replace asset hash placeholders with actual fingerprinted filenames
      compiled.html = compiled.html
        .replace(/runtime\.__STX_HASH__\.js/g, runtimeAsset.filename)
        .replace(/router\.__STX_HASH__\.js/g, routerAsset.filename)

      // Wrap in document shell with router script reference.
      // Uses the head config loaded once at the top of the build (from stx.config.ts).
      compiled.html = ensureDocumentShell(compiled.html, headConfigDefault, {
        bodyScripts: [`<script src="/__stx/${routerAsset.filename}"></script>`],
      })

      // Extract fragment AFTER shell wrapping (body content without document wrapper)
      compiled.fragment = stripDocumentWrapper(compiled.html)

      // Write compiled template
      const safeRouteName = route.pattern === '/' ? 'index' : route.pattern.slice(1).replace(/\//g, '-').replace(/[[\]]/g, '_')
      const compiledPath = path.join('server', 'pages', `${safeRouteName}.compiled.json`)
      const fragmentPath = path.join('server', 'fragments', `${safeRouteName}.html`)

      await Bun.write(
        path.join(outputDir, compiledPath),
        JSON.stringify(compiled, null, 2),
      )
      await Bun.write(
        path.join(outputDir, fragmentPath),
        compiled.fragment,
      )

      manifestRoutes.push({
        pattern: route.pattern,
        compiledPath,
        fragmentPath,
        isDynamic: compiled.hasServerScripts,
        hasParams: route.pattern.includes(':') || route.pattern.includes('['),
      })

      console.log(`[stx build]   ✓ ${route.pattern}`)
    }
    catch (error) {
      console.error(`[stx build]   ✗ ${route.pattern}:`, error instanceof Error ? error.message : error)
    }
  }

  // ── 5. Copy user public assets ──
  // Recursively copy `${publicDir}/**` into `.output/public/`. Skips paths
  // that already exist in the destination, so framework-written files
  // (`__stx/runtime.*.js`, `__stx/router.*.js`, `assets/*.css`) are
  // preserved if a user happens to have a conflicting filename.
  const userPublicSrc = path.resolve(root, publicDir)
  if (fs.existsSync(userPublicSrc)) {
    const { copied, bytes } = copyPublicAssets(
      userPublicSrc,
      path.join(outputDir, 'public'),
    )
    if (copied > 0) {
      console.log(`[stx build] Copied ${copied} public asset${copied === 1 ? '' : 's'} (${(bytes / 1024).toFixed(1)}KB) from ${publicDir}/`)
    }
  }

  // ── 6. Generate manifest ──
  const assets: ManifestAssets = {
    runtime: runtimeAsset.filename,
    router: routerAsset.filename,
  }

  const manifest = generateManifest(manifestRoutes, assets, outputDir)
  writeManifest(manifest, outputDir)

  const duration = Date.now() - startTime
  console.log(`\n[stx build] Done in ${duration}ms — ${compiledPages.length} pages compiled`)

  return {
    pageCount: compiledPages.length,
    assets,
    outputDir,
    duration,
  }
}
