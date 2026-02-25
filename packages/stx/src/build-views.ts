/**
 * STX View Builder
 *
 * Provides a simple API to build STX views to static HTML files.
 * This handles all the boilerplate for:
 * - Processing STX templates
 * - Extracting server-side variables
 * - Generating Tailwind CSS via Crosswind
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

/**
 * Render a .stx email template to an email-ready HTML string
 *
 * Optimized for email rendering:
 * - Disables SEO tag injection
 * - Inlines utility classes as style attributes (via Crosswind)
 * - Strips <style> and <script> blocks
 * - Returns clean HTML + plain text suitable for email
 *
 * @example
 * ```typescript
 * const { html, text } = await renderEmail('resources/emails/welcome.stx', {
 *   userName: 'John',
 *   unsubscribeUrl: 'https://example.com/unsubscribe?token=abc',
 * })
 * ```
 */
export async function renderEmail(
  templatePath: string,
  props: Record<string, unknown> = {},
  options: Partial<StxOptions> = {},
): Promise<{ html: string, text: string }> {
  // Disable SEO tags and client-side features for emails
  const emailOptions: Partial<StxOptions> = {
    ...options,
    skipDefaultSeoTags: true,
    skipSignalsRuntime: true,
  }

  let html = await renderView(templatePath, props, emailOptions)

  // Inline utility classes as style attributes
  html = await inlineCssClasses(html)

  // Strip <script> tags (email should have no JS)
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

  // Strip <style> blocks (already inlined)
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

  // Strip stx SEO comment blocks
  html = html.replace(/<!--\s*stx SEO Tags\s*-->/gi, '')

  // Clean up blank lines left behind
  html = html.replace(/\n\s*\n\s*\n/g, '\n\n').trim()

  // Generate plain text version
  const text = htmlToPlainText(html)

  return { html, text }
}

/**
 * Inline CSS classes as style attributes for email compatibility.
 *
 * Generates CSS from utility classes via Crosswind, parses the rules,
 * and applies them as inline `style` attributes on matching elements.
 * Email clients ignore <style> blocks, so this is required.
 */
async function inlineCssClasses(html: string): Promise<string> {
  try {
    const { generateCrosswindCSS, extractClassNames } = await import('./dev-server/crosswind')

    const classes = extractClassNames(html)
    if (classes.size === 0) return html

    const css = await generateCrosswindCSS(html)
    if (!css) return html

    // Parse CSS rules into a class → properties map
    const classStyles = parseCssToMap(css)
    if (classStyles.size === 0) return html

    // Walk through HTML elements with class attributes and inline matching styles
    return html.replace(
      /(<[a-z][a-z0-9]*)((?:\s+[a-z][a-z0-9-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*\s+)class\s*=\s*"([^"]*)"((?:\s+[a-z][a-z0-9-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*\s*)(\/?>)/gi,
      (_match, tag, beforeClass, classValue, afterClass, closing) => {
        const classNames = classValue.split(/\s+/).filter(Boolean)
        const inlineProps: string[] = []

        for (const cls of classNames) {
          const styles = classStyles.get(cls)
          if (styles) {
            inlineProps.push(styles)
          }
        }

        if (inlineProps.length === 0) {
          return `${tag}${beforeClass}class="${classValue}"${afterClass}${closing}`
        }

        const inlineStyle = inlineProps.join('; ')

        // Check if there's already a style attribute
        const fullAttrs = `${beforeClass}${afterClass}`
        const existingStyleMatch = fullAttrs.match(/style\s*=\s*"([^"]*)"/)

        if (existingStyleMatch) {
          // Merge with existing style - existing styles take precedence
          const merged = `${inlineStyle}; ${existingStyleMatch[1]}`
          const updatedBefore = beforeClass.replace(/style\s*=\s*"[^"]*"/, `style="${merged}"`)
          const updatedAfter = afterClass.replace(/style\s*=\s*"[^"]*"/, `style="${merged}"`)
          return `${tag}${updatedBefore}class="${classValue}"${updatedAfter}${closing}`
        }

        return `${tag}${beforeClass}class="${classValue}" style="${inlineStyle}"${afterClass}${closing}`
      },
    )
  }
  catch {
    // Crosswind not available, return HTML as-is
    return html
  }
}

/**
 * Parse CSS text into a Map of className → inline style string.
 * Handles simple single-class selectors like `.text-center { text-align: center; }`
 */
function parseCssToMap(css: string): Map<string, string> {
  const map = new Map<string, string>()

  // Match simple class selectors: .class-name { properties }
  const ruleRegex = /\.([a-zA-Z0-9_-]+(?:\\:[a-zA-Z0-9_-]+)*)\s*\{([^}]+)\}/g
  let match = ruleRegex.exec(css)

  while (match !== null) {
    // Unescape CSS class names (e.g. hover\:bg-blue-500 → hover:bg-blue-500)
    const className = match[1].replace(/\\/g, '')
    const properties = match[2]
      .split(';')
      .map(p => p.trim())
      .filter(Boolean)
      .join('; ')

    if (properties) {
      map.set(className, properties)
    }
    match = ruleRegex.exec(css)
  }

  return map
}

/**
 * Convert HTML to plain text for email text/plain part
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/g, '(c)')
    .replace(/&middot;/g, '-')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()
}

// Default export for convenience
export default buildViews
