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
 */
export interface ProductionBuildOptions {
  /** Project root directory (default: process.cwd()) */
  root?: string
  /** Output directory (default: '.output') */
  outputDir?: string
  /** Enable debug/dev runtime (default: false) */
  debug?: boolean
  /** Components directory */
  componentsDir?: string
  /** Partials directory */
  partialsDir?: string
  /** Layouts directory */
  layoutsDir?: string
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
 * Build the stx application for production.
 *
 * Produces a `.output/` directory with:
 * - `public/__stx/` — fingerprinted runtime and router JS
 * - `public/assets/` — bundled CSS
 * - `server/pages/` — compiled template JSON files
 * - `server/fragments/` — SPA navigation fragments
 * - `manifest.json` — route map and asset hashes
 */
export async function buildForProduction(options: ProductionBuildOptions = {}): Promise<ProductionBuildResult> {
  const startTime = Date.now()
  const root = path.resolve(options.root || process.cwd())
  const outputDir = path.resolve(root, options.outputDir || '.output')

  console.log('[stx build] Starting production build...')

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
        componentsDir: options.componentsDir,
        partialsDir: options.partialsDir,
        layoutsDir: options.layoutsDir,
        debug: options.debug,
      })

      compiledPages.push(compiled)

      // Replace asset hash placeholders with actual fingerprinted filenames
      compiled.html = compiled.html
        .replace(/runtime\.__STX_HASH__\.js/g, runtimeAsset.filename)
        .replace(/router\.__STX_HASH__\.js/g, routerAsset.filename)

      // Load head config for document shell
      let headConfig = {}
      try {
        const projectConfig = await loadStxConfig()
        headConfig = (projectConfig as any).app?.head || {}
      }
      catch { /* no config */ }

      // Wrap in document shell with router script reference
      compiled.html = ensureDocumentShell(compiled.html, headConfig, {
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

  // ── 5. Generate manifest ──
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
