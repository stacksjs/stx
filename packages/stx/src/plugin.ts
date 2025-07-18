/* eslint-disable no-console */
import type { BunPlugin } from 'bun'
import type { StxOptions } from './'
import path from 'node:path'
import { buildWebComponents, cacheTemplate, checkCache, defaultConfig, extractVariables, processDirectives } from './'

export const plugin: BunPlugin = {
  name: 'bun-plugin-stx',
  async setup(build) {
    // Extract options from config or use defaults
    const options: StxOptions = {
      ...defaultConfig,
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

        const content = await Bun.file(filePath).text()

        // Extract script and template sections
        const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = scriptMatch ? scriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

        // Create a sandbox environment to execute the script
        const context: Record<string, any> = {
          // Add some useful globals
          __filename: filePath,
          __dirname: path.dirname(filePath),
          // Add STX config info
          __stx: {
            webComponentsPath,
            builtComponents,
          },
        }

        // Execute script content to extract variables
        await extractVariables(scriptContent, context, filePath)

        // Process template directives
        let output = templateContent

        // Process all directives
        output = await processDirectives(output, context, filePath, options, dependencies)

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
        console.error('STX Plugin Error:', error)
        return {
          contents: `<!DOCTYPE html><html><body><h1>STX Rendering Error</h1><pre>${error.message || String(error)}</pre></body></html>`,
          loader: 'html',
        }
      }
    })
  },
}

export default plugin
