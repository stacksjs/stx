/**
 * bun-plugin-stx
 *
 * Bun build plugin for processing .stx template files and .md markdown files.
 *
 * ## Plugin Architecture
 *
 * There are two plugin implementations in the stx monorepo:
 *
 * 1. **This plugin** (`bun-plugin-stx`) - External package for users
 *    - Exported as a function: `stxPlugin(options)`
 *    - Designed for external consumption via npm/bun install
 *    - Re-exports common utilities from @stacksjs/stx
 *
 * 2. **Internal plugin** (`@stacksjs/stx/plugin`) - Used by dev-server
 *    - Exported as a constant: `plugin`
 *    - Has additional error handling with StxError classes
 *    - Includes performance monitoring
 *
 * Both plugins share the same core processing pipeline from @stacksjs/stx.
 * The duplication exists because:
 * - Different export patterns (function vs constant)
 * - Internal plugin needs access to internal error classes
 * - Avoiding circular dependencies
 *
 * ## Usage
 *
 * ```typescript
 * import { stxPlugin } from 'bun-plugin-stx'
 *
 * await Bun.build({
 *   entrypoints: ['./src/index.stx'],
 *   plugins: [stxPlugin({ debug: true })]
 * })
 * ```
 */

import type { StxOptions } from '@stacksjs/stx'
import type { BunPlugin } from 'bun'
import path from 'node:path'
import { buildWebComponents, cacheTemplate, checkCache, defaultConfig, extractVariables, processClientScript, processDirectives, readMarkdownFile, renderToString } from '@stacksjs/stx'

// Export watch functionality
export { createWatcher, startWatchMode, watchAndBuild } from './watch'
export type {
  WatchAndBuildOptions,
  WatchBuildResult,
  WatcherInstance,
  WatchEvent,
  WatchOptions,
} from './watch'

// Re-export functions and types that consumers might need
// Note: serve is exported from ./serve.ts, not here (to avoid duplicate export names when bundled)
export { createMiddleware, createRoute, readMarkdownFile } from '@stacksjs/stx'
export type { CustomDirective, CustomDirectiveHandler, ServeOptions, ServeResult, StxOptions } from '@stacksjs/stx'

/**
 * Escape HTML entities in error messages to prevent XSS in error pages.
 * Matches the escaping behavior in @stacksjs/stx/expressions.
 */
function escapeHtmlForError(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Generate a styled error page HTML
 * Consistent with error handling in @stacksjs/stx/plugin
 */
function generateErrorPage(title: string, message: string, filePath?: string): string {
  const escapedMessage = escapeHtmlForError(message)
  const escapedPath = filePath ? escapeHtmlForError(filePath) : ''

  return `<!DOCTYPE html>
<html>
<head>
  <title>stx Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; background: #1a1a2e; color: #eee; }
    h1 { color: #ff6b6b; }
    pre { background: #16213e; padding: 1rem; border-radius: 4px; overflow-x: auto; border-left: 4px solid #ff6b6b; }
    .file-path { color: #888; font-size: 0.9rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${escapedPath ? `<div class="file-path">File: ${escapedPath}</div>` : ''}
  <pre>${escapedMessage}</pre>
</body>
</html>`
}

/**
 * Create a Bun plugin for processing .stx and .md files
 *
 * @param userOptions - Optional configuration to override defaults
 * @returns BunPlugin instance
 *
 * @example
 * ```typescript
 * // Basic usage
 * const plugin = stxPlugin()
 *
 * // With options
 * const plugin = stxPlugin({
 *   debug: true,
 *   cache: true,
 *   cachePath: '.stx/cache'
 * })
 * ```
 */
export function stxPlugin(userOptions?: StxOptions): BunPlugin {
  return {
    name: 'bun-plugin-stx',
    async setup(build) {
      // Merge user options with defaults
      const options: StxOptions = {
        ...defaultConfig,
        ...userOptions,
      }

      // Track all dependencies for web component building
      const allDependencies = new Set<string>()

      // Get web components output path
      const webComponentsPath = options.webComponents?.enabled
        ? `./${path.relative(path.dirname(build.config?.outdir || 'dist'), options.webComponents.outputDir || 'dist/web-components')}`
        : '/web-components'

      // Build web components if enabled
      const builtComponents: string[] = []
      if (options.webComponents?.enabled) {
        try {
          const components = await buildWebComponents(options, allDependencies)
          builtComponents.push(...components)
          if (options.debug && components.length > 0) {
            console.log(`Successfully built ${components.length} web components`)
          }
        }
        catch (error) {
          console.error('Failed to build web components:', error)
        }
      }

      // Handler for .md files
      build.onLoad({ filter: /\.md$/ }, async ({ path: filePath }) => {
        try {
          // Process the markdown file with frontmatter
          const { content: htmlContent, data: frontmatter } = await readMarkdownFile(filePath, options)

          // Generate JavaScript module exports
          const jsContent = `// ${filePath}
var content = ${JSON.stringify(htmlContent)};
var data = ${JSON.stringify(frontmatter)};

export { content, data };
export { content as default };
`

          return {
            contents: jsContent,
            loader: 'js',
          }
        }
        catch (error: any) {
          console.error('Markdown Processing Error:', error)
          const errorContent = generateErrorPage(
            'Markdown Processing Error',
            error.message || 'Unknown error',
            filePath,
          )
          const jsContent = `// ${filePath}
var content = ${JSON.stringify(errorContent)};
var data = {};

export { content, data };
export { content as default };
`
          return {
            contents: jsContent,
            loader: 'js',
          }
        }
      })

      // Handler for .jsx and .tsx files (JSX component support)
      build.onLoad({ filter: /\.(jsx|tsx)$/ }, async ({ path: filePath }) => {
        try {
          const source = await Bun.file(filePath).text()

          // Use Bun's built-in transpiler with stx as the JSX import source
          const loader = filePath.endsWith('.tsx') ? 'tsx' : 'jsx'
          const transpiler = new Bun.Transpiler({
            loader,
            jsxOptimizationInline: true,
          })

          const code = transpiler.transformSync(source)

          return {
            contents: code,
            loader: 'js',
          }
        }
        catch (error: any) {
          console.error('JSX Processing Error:', error)
          return {
            contents: `export default function() { return null; }`,
            loader: 'js',
          }
        }
      })

      build.onLoad({ filter: /\.stx$/ }, async ({ path: filePath }) => {
        try {
        // Track dependencies for caching
          const dependencies = new Set<string>()

          // Check for cached content if caching is enabled
          if (options.cache && options.cachePath) {
            const cachedOutput = await checkCache(filePath, options)
            if (cachedOutput) {
              if (options.debug) {
                console.log(`Using cached version of ${filePath}`)
              }
              return {
                contents: cachedOutput,
                loader: 'html',
              }
            }
          }

          const content = await Bun.file(filePath).text()

          // SFC Support: Extract <template> content if present
          // This allows Vue-style single file components with explicit <template> tags
          let workingContent = content
          const templateTagMatch = content.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i)
          if (templateTagMatch) {
            workingContent = templateTagMatch[1].trim()
          }

          // Extract all script tags and categorize them from original content
          const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
          const clientScripts: string[] = []
          const serverScripts: string[] = []
          const signalsScripts: string[] = [] // Scripts using STX signals API
          let scriptMatch: RegExpExecArray | null

          // Check if script uses STX signals API (state, derived, effect, batch)
          const usesSignalsAPI = (content: string) => /\b(?:state|derived|effect|batch)\s*\(/.test(content)

          while ((scriptMatch = scriptRegex.exec(content)) !== null) {
            const attrs = scriptMatch[1]
            const scriptContent = scriptMatch[2]
            const fullScript = scriptMatch[0]

            // Check if it's a client-only script
            const isClientScript = attrs.includes('client') || attrs.includes('type="module"') || attrs.includes('src=')
            // Check if it uses STX signals API (should be processed by signals runtime)
            const isSignalsScript = usesSignalsAPI(scriptContent)

            if (isSignalsScript) {
              // Scripts with signals should be kept in template for processSignals to handle
              signalsScripts.push(fullScript)
            }
            else if (isClientScript) {
              clientScripts.push(fullScript)
            }
            else {
              serverScripts.push(scriptContent)
            }
          }

          // Remove non-signals script tags from template, keep signals scripts for processSignals
          let templateContent = workingContent
          // Remove server scripts and client scripts, but keep signals scripts
          for (const script of serverScripts) {
            const escapedScript = script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            templateContent = templateContent.replace(new RegExp(`<script\\b[^>]*>${escapedScript}<\\/script>`, 'gi'), '')
          }
          for (const script of clientScripts) {
            const escapedScript = script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            templateContent = templateContent.replace(escapedScript, '')
          }

          // Create a sandbox environment to execute the script
          const context: Record<string, any> = {
          // Add some useful globals
            __filename: filePath,
            __dirname: path.dirname(filePath),
            // Add stx config info
            __stx: {
              webComponentsPath,
              builtComponents,
            },
            // Add stx options for directives that need them (like @component)
            __stx_options: options,
            // Enable SFC mode: events.ts will collect bindings instead of
            // generating standalone scripts, so we can inject them into
            // the component's <script client> scope
            __stx_sfc_mode: true,
          }

          // Execute server script content to extract variables
          for (const scriptContent of serverScripts) {
            await extractVariables(scriptContent, context, filePath)
          }

          // Process template directives
          let output = templateContent

          // Process all directives
          output = await processDirectives(output, context, filePath, options, dependencies)

          // Transform and inject client scripts before </body>
          // processClientScript resolves @stores imports, injects event
          // bindings into the script scope, and auto-wraps in a scoped IIFE
          if (clientScripts.length > 0) {
            const eventBindings = (context.__stx_event_bindings || []) as any[]
            const transformedScripts = clientScripts.map((fullScript: string) => {
              const contentMatch = fullScript.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)
              if (!contentMatch) return fullScript
              return processClientScript(contentMatch[1], { eventBindings })
            })
            const scriptsHtml = transformedScripts.join('\n')
            const bodyEndMatch = output.match(/(<\/body>)/i)
            if (bodyEndMatch) {
              output = output.replace(/(<\/body>)/i, `${scriptsHtml}\n$1`)
            }
            else {
              output += `\n${scriptsHtml}`
            }
            // Clear event bindings after use
            context.__stx_event_bindings = []
          }

          // Track dependencies for this file
          dependencies.forEach(dep => allDependencies.add(dep))

          // Cache the processed output if caching is enabled
          if (options.cache && options.cachePath) {
            await cacheTemplate(filePath, output, dependencies, options)
            if (options.debug) {
              console.log(`Cached template ${filePath} with ${dependencies.size} dependencies`)
            }
          }

          return {
            contents: output,
            loader: 'html',
          }
        }
        catch (error: any) {
          console.error('stx Plugin Error:', error)
          return {
            contents: generateErrorPage(
              'stx Rendering Error',
              error.message || String(error),
              filePath,
            ),
            loader: 'html',
          }
        }
      })
    },
  }
}

export default stxPlugin
