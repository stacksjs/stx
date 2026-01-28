import type { BunPlugin } from 'bun'
import type { StxOptions } from './'
import path from 'node:path'
import { buildWebComponents, cacheTemplate, checkCache, extractVariables, loadStxConfig, processDirectives } from './'
import { devHelpers, errorLogger, safeExecuteAsync, StxFileError, StxRuntimeError } from './error-handling'
import { escapeHtml } from './expressions'
import { performanceMonitor } from './performance-utils'

export const plugin: BunPlugin = {
  name: 'bun-plugin-stx',
  async setup(build) {
    // Load and await the config from the project directory
    const loadedConfig = await loadStxConfig()

    // Extract options from loaded config or use defaults
    const options: StxOptions = {
      ...loadedConfig,
      ...(build.config as any)?.stx,
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

        // Read file content with error handling
        const content = await safeExecuteAsync(
          () => Bun.file(filePath).text(),
          '',
          (error) => {
            throw new StxFileError(
              `Failed to read stx file: ${filePath}`,
              filePath,
              undefined,
              undefined,
              `File read error: ${error.message}`,
            )
          },
        )

        if (!content) {
          throw new StxFileError(`stx file is empty: ${filePath}`, filePath)
        }

        // Extract script and template sections with performance monitoring
        const { scriptContent, templateContent, allScripts } = performanceMonitor.time('script-extraction', () => {
          // SFC Support: Extract <template> content if present
          // This allows Vue-style single file components with explicit <template> tags
          // Only match <template> WITHOUT an id attribute - templates with id are HTML template elements
          // that should be preserved (used for client-side JS template cloning)
          let workingContent = content
          const templateTagMatch = content.match(/<template\b(?![^>]*\bid\s*=)[^>]*>([\s\S]*?)<\/template>/i)
          if (templateTagMatch) {
            workingContent = templateTagMatch[1].trim()
          }

          // Extract all script tags (both inline and external) from original content
          const allScriptMatches = content.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || []

          // Find server-side script (for variable extraction)
          // Server-side scripts typically have: module.exports, export const, or simple variable declarations
          // Client-side scripts have: document, window, addEventListener, etc.
          let serverScriptContent = ''
          const clientScripts: string[] = []

          for (const scriptTag of allScriptMatches) {
            const innerContent = scriptTag.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1] || ''

            // Check if script has the 'server' attribute (explicit server-side script)
            // Extract attributes from the script tag and check for 'server' word
            const attrsMatch = scriptTag.match(/<script\b([^>]*)>/i)
            const attrs = attrsMatch ? attrsMatch[1] : ''
            const hasServerAttribute = /\bserver\b/i.test(attrs)

            // Check if this is a client-side script (has browser APIs)
            const isClientScript = /\b(?:document|window|addEventListener|querySelector|getElementById|fetch\(|localStorage|sessionStorage)\b/.test(innerContent)

            // Check if this looks like a server-side data script
            // Either has explicit 'server' attribute, or has server-side patterns
            const isServerScript = hasServerAttribute
              || /\b(?:module\.exports|export\s+(?:const|let|var|function|default))\b/.test(innerContent)
              || (/^\s*(?:const|let|var)\s+\w+\s*=/.test(innerContent) && !isClientScript)

            if (isServerScript && !isClientScript) {
              serverScriptContent = innerContent
            }
            else if (!hasServerAttribute) {
              // Keep client scripts to add back to output (never add server scripts)
              clientScripts.push(scriptTag)
            }
          }

          // Remove script tags from template content (use workingContent which may be from <template> tag)
          const templateContent = workingContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
          return { scriptContent: serverScriptContent, templateContent, allScripts: clientScripts }
        })

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
        }

        // Execute script content to extract variables with error handling
        await safeExecuteAsync(
          () => extractVariables(scriptContent, context, filePath),
          undefined,
          (error) => {
            const scriptError = new StxRuntimeError(
              `Script execution failed in ${filePath}: ${error.message}`,
              filePath,
              undefined,
              undefined,
              scriptContent.substring(0, 100),
            )
            errorLogger.log(scriptError, { filePath, scriptContent })

            if (options.debug) {
              throw scriptError
            }
            // In production, continue with empty context
          },
        )

        // Process template directives with performance monitoring
        const processedTemplate = await performanceMonitor.timeAsync('directive-processing', async () => {
          return await processDirectives(templateContent, context, filePath, options, dependencies)
        })

        // Preserve all script content in final output
        let output = processedTemplate

        // Add all script tags back to the output
        if (allScripts.length > 0) {
          // Find the closing </body> tag and insert scripts before it
          const bodyEndMatch = output.match(/(<\/body>)/i)
          if (bodyEndMatch) {
            const scriptsHtml = allScripts.join('\n')
            output = output.replace(/(<\/body>)/i, `${scriptsHtml}\n$1`)
          }
          else {
            // If no </body> tag, append scripts at the end
            output += `\n${allScripts.join('\n')}`
          }
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
      catch (error: unknown) {
        const enhancedError = error instanceof Error
          ? error
          : new StxRuntimeError(`Plugin processing failed: ${String(error)}`, filePath)

        errorLogger.log(enhancedError, { filePath, buildConfig: build.config })
        devHelpers.logDetailedError(enhancedError, { filePath, plugin: 'bun-plugin-stx' })

        if (options.debug) {
          console.error('stx Plugin Error:', enhancedError)
        }

        // Check if error has stx-specific properties
        const stxError = enhancedError as any
        const errorLine = stxError.line || null
        const errorContext = stxError.context || null

        // Create a more helpful error page
        const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>stx Rendering Error</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    .error-header { color: #dc3545; border-left: 4px solid #dc3545; padding-left: 16px; margin-bottom: 24px; }
    .error-details { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .error-code { background: #2d3748; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: 'Monaco', 'Menlo', monospace; font-size: 14px; }
    .help-section { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px; margin-top: 24px; }
    .file-path { font-family: monospace; background: #f1f3f4; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="error-header">
    <h1>stx Template Error</h1>
    <p>An error occurred while processing your stx template.</p>
  </div>

  <div class="error-details">
    <h3>Error Details</h3>
    <p><strong>File:</strong> <span class="file-path">${escapeHtml(filePath)}</span></p>
    <p><strong>Error:</strong> ${escapeHtml(enhancedError.message)}</p>
    ${errorLine ? `<p><strong>Line:</strong> ${escapeHtml(String(errorLine))}</p>` : ''}
    ${errorContext ? `<p><strong>Context:</strong> ${escapeHtml(String(errorContext))}</p>` : ''}
  </div>

  ${enhancedError.stack
    ? `
  <div class="error-details">
    <h3>Stack Trace</h3>
    <pre class="error-code">${escapeHtml(enhancedError.stack)}</pre>
  </div>`
    : ''}

  <div class="help-section">
    <h3>💡 Troubleshooting Tips</h3>
    <ul>
      <li>Check the syntax of your stx directives (e.g., @if, @foreach)</li>
      <li>Verify that all variables used in the template are properly defined</li>
      <li>Ensure script tags have valid JavaScript/TypeScript syntax</li>
      <li>Run <code>stx debug ${escapeHtml(path.basename(filePath))}</code> for detailed analysis</li>
      <li>Enable debug mode in your stx config for more detailed error messages</li>
    </ul>
  </div>
</body>
</html>`

        return {
          contents: errorHtml,
          loader: 'html',
        }
      }
    })
  },
}

export default plugin
