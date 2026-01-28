/**
 * STX View Builder
 *
 * Provides a simple API to build STX views to static HTML files.
 * This handles all the boilerplate for:
 * - Processing STX templates
 * - Extracting server-side variables
 * - Generating Tailwind CSS via Headwind
 * - Supporting layouts and components
 * - Placeholder token replacement for dynamic values
 */

import fs from 'node:fs'
import path from 'node:path'
import { extractVariables } from './variable-extractor'
import { defaultConfig } from './config'
import { processDirectives } from './process'
import type { StxOptions } from './types'

export interface ViewBuildOptions {
  /** Source directory containing .stx files */
  viewsDir: string
  /** Output directory for built HTML files */
  outputDir: string
  /** Components directory (defaults to viewsDir/components) */
  componentsDir?: string
  /** Layouts directory (defaults to viewsDir/layouts) */
  layoutsDir?: string
  /** Partials directory (defaults to viewsDir/partials) */
  partialsDir?: string
  /** Props/context to pass to all views */
  globalProps?: Record<string, unknown>
  /** Placeholder tokens for runtime replacement */
  placeholders?: Record<string, string>
  /** Specific views to build (defaults to all .stx files in viewsDir root) */
  views?: ViewConfig[]
  /** Enable debug logging */
  debug?: boolean
  /** Generate manifest.json with build info */
  generateManifest?: boolean
}

export interface ViewConfig {
  /** Input file name (e.g., 'dashboard.stx') */
  input: string
  /** Output file name (defaults to input with .html extension) */
  output?: string
  /** Props specific to this view */
  props?: Record<string, unknown>
}

export interface BuildResult {
  success: boolean
  views: string[]
  errors: Array<{ file: string; error: string }>
  duration: number
}

/**
 * Render a single STX template to HTML
 */
export async function renderView(
  templatePath: string,
  props: Record<string, unknown> = {},
  options: Partial<StxOptions> = {},
): Promise<string> {
  const content = await Bun.file(templatePath).text()

  // Extract script content and template
  const scriptMatch = content.match(/<script\s+server\s*>([\s\S]*?)<\/script>/i)
  const scriptContent = scriptMatch ? scriptMatch[1] : ''
  let templateContent = scriptMatch
    ? content.replace(/<script\s+server\s*>[\s\S]*?<\/script>/i, '')
    : content

  // Replace <script client> with regular <script> for output
  templateContent = templateContent.replace(/<script\s+client\s*>/gi, '<script>')

  // Build context with props
  const context: Record<string, unknown> = {
    __filename: templatePath,
    __dirname: path.dirname(templatePath),
    props,
    // Also spread props at top level for convenience
    ...props,
  }

  // Extract variables from server script
  if (scriptContent) {
    await extractVariables(scriptContent, context, templatePath)
  }

  // Merge options with defaults
  const config: StxOptions = {
    ...defaultConfig,
    ...options,
  }

  // Process STX directives
  const result = await processDirectives(templateContent, context, templatePath, config, new Set())
  return result
}

/**
 * Build all views in a directory
 */
export async function buildViews(options: ViewBuildOptions): Promise<BuildResult> {
  const startTime = performance.now()
  const result: BuildResult = {
    success: true,
    views: [],
    errors: [],
    duration: 0,
  }

  const {
    viewsDir,
    outputDir,
    componentsDir = path.join(viewsDir, 'components'),
    layoutsDir = path.join(viewsDir, 'layouts'),
    partialsDir = path.join(viewsDir, 'partials'),
    globalProps = {},
    placeholders = {},
    views,
    debug = false,
    generateManifest = true,
  } = options

  if (debug) {
    console.log('Building STX views...')
    console.log(`  Source: ${viewsDir}`)
    console.log(`  Output: ${outputDir}`)
  }

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true })

  // Build STX options
  const stxOptions: Partial<StxOptions> = {
    componentsDir,
    layoutsDir,
    partialsDir,
    debug,
  }

  // Determine which views to build
  let viewsToBuild: ViewConfig[]

  if (views && views.length > 0) {
    viewsToBuild = views
  }
  else {
    // Auto-discover .stx files in the root of viewsDir
    const files = fs.readdirSync(viewsDir)
    viewsToBuild = files
      .filter(f => f.endsWith('.stx'))
      .map(f => ({ input: f }))
  }

  // Build each view
  for (const view of viewsToBuild) {
    const inputPath = path.join(viewsDir, view.input)
    const outputName = view.output || view.input.replace(/\.stx$/, '.html')
    const outputPath = path.join(outputDir, outputName)

    if (debug) {
      console.log(`  Building ${view.input}...`)
    }

    try {
      // Merge global props with view-specific props
      // Placeholders override actual values for runtime replacement
      const props = {
        ...globalProps,
        ...view.props,
        ...placeholders,
      }

      const html = await renderView(inputPath, props, stxOptions)
      await Bun.write(outputPath, html)
      result.views.push(outputName)
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      result.errors.push({ file: view.input, error: errorMessage })
      result.success = false

      if (debug) {
        console.error(`    Error: ${errorMessage}`)
      }
    }
  }

  // Generate manifest
  if (generateManifest) {
    const manifest = {
      buildTime: new Date().toISOString(),
      views: result.views,
      placeholders,
      errors: result.errors.length > 0 ? result.errors : undefined,
    }
    await Bun.write(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  }

  result.duration = performance.now() - startTime

  if (debug) {
    if (result.success) {
      console.log(`\n✅ Built ${result.views.length} views in ${result.duration.toFixed(0)}ms`)
    }
    else {
      console.log(`\n⚠️ Built ${result.views.length} views with ${result.errors.length} errors`)
    }
  }

  return result
}

/**
 * Watch views directory and rebuild on changes
 */
export function watchViews(
  options: ViewBuildOptions,
  callback?: (result: BuildResult) => void,
): { close: () => void } {
  const watcher = fs.watch(options.viewsDir, { recursive: true }, async (eventType, filename) => {
    if (!filename) return

    // Only rebuild on .stx file changes
    if (filename.endsWith('.stx') || filename.endsWith('.ts') || filename.endsWith('.js')) {
      if (options.debug) {
        console.log(`\nFile changed: ${filename}, rebuilding...`)
      }
      const result = await buildViews(options)
      callback?.(result)
    }
  })

  return {
    close: () => watcher.close(),
  }
}

// Default export for convenience
export default buildViews
