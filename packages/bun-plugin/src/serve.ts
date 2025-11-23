#!/usr/bin/env bun

/**
 * stx serve command
 * Serves .stx, .md, and .html files directly without manual build step
 *
 * Usage:
 *   serve pages/*.stx
 *   serve pages/*.md
 *   serve pages/*.html
 *   serve pages/ --port 3000
 *   serve pages/home.stx pages/about.md pages/index.html
 */

import { serve as bunServe, Glob } from 'bun'
import process from 'node:process'
import stxPlugin from './index'

export interface ServeOptions {
  patterns: string[]
  port?: number
}

/**
 * Start the STX development server
 * @param options Server options with patterns and port
 */
export async function serve(options: ServeOptions): Promise<void> {
  const { patterns, port = 3456 } = options

  if (patterns.length === 0) {
    console.error('Usage: serve <files...> [--port 3000]')
    console.error('\nExamples:')
    console.error('  serve pages/*.stx')
    console.error('  serve pages/*.md')
    console.error('  serve pages/*.html')
    console.error('  serve pages/ --port 3000')
    console.error('  serve index.stx about.md page.html')
    console.error('\nAfter installing: bun add bun-plugin-stx')
    throw new Error('No file patterns provided')
  }

  // Lazy-load: Cache for processed templates
  const routes = new Map<string, string>()
  let sourceFiles: string[] | null = null
  let assetsInitialized = false

  // Lazy file discovery function
  async function discoverFiles() {
    if (sourceFiles !== null)
      return sourceFiles

    const files: string[] = []
    const supportedExtensions = ['.stx', '.md', '.html']

    for (const pattern of patterns) {
      try {
        const fs = await import('node:fs/promises')
        const stat = await fs.stat(pattern).catch(() => null)

        if (stat?.isDirectory()) {
          for (const ext of ['.stx', '.md', '.html']) {
            const glob = new Glob(`**/*${ext}`)
            const discovered = await Array.fromAsync(glob.scan(pattern))
            files.push(...discovered.map(f => `${pattern}/${f}`.replace(/\/+/g, '/')))
          }
        }
        else if (pattern.includes('*')) {
          const glob = new Glob(pattern)
          const basePath = pattern.split('*')[0].replace(/\/$/, '')
          const discovered = await Array.fromAsync(glob.scan(basePath || '.'))
          files.push(...discovered.map(f => basePath ? `${basePath}/${f}` : f))
        }
        else if (supportedExtensions.some(ext => pattern.endsWith(ext))) {
          files.push(pattern)
        }
      }
      catch (error) {
        console.error(`Error processing pattern "${pattern}":`, error)
      }
    }

    sourceFiles = files
    return files
  }

  // Lazy asset copy function
  async function ensureAssets() {
    if (assetsInitialized)
      return

    assetsInitialized = true
    const fs = await import('node:fs/promises')
    const assetsDir = './resources/assets'
    const targetAssetsDir = './.stx/assets'

    try {
      const assetsExist = await fs.stat(assetsDir).then(() => true).catch(() => false)
      if (assetsExist) {
        await fs.rm(targetAssetsDir, { recursive: true, force: true })
        await fs.cp(assetsDir, targetAssetsDir, { recursive: true })
      }
    }
    catch (error) {
      // Silently ignore
    }
  }

  // Lazy template processing function
  async function processTemplate(filePath: string): Promise<string> {
    const path = await import('node:path')
    const content = await Bun.file(filePath).text()

    const inlineScriptMatch = content.match(/<script(?!\s+[^>]*src=)\b[^>]*>([\s\S]*?)<\/script>/i)
    const scriptContent = inlineScriptMatch ? inlineScriptMatch[1] : ''
    const templateContent = inlineScriptMatch
      ? content.replace(/<script(?!\s+[^>]*src=)\b[^>]*>[\s\S]*?<\/script>/i, '')
      : content

    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: path.dirname(filePath),
    }

    const { processDirectives, extractVariables, defaultConfig } = await import('@stacksjs/stx')
    await extractVariables(scriptContent, context, filePath)

    let output = templateContent
    const dependencies = new Set<string>()
    output = await processDirectives(output, context, filePath, defaultConfig, dependencies)

    return output
  }

  // Function to get or create route
  async function getRoute(path: string): Promise<string | null> {
    // Check cache first
    if (routes.has(path))
      return routes.get(path)!

    // Discover files if needed
    const files = await discoverFiles()
    const nodePath = await import('node:path')

    // Find matching file
    for (const filePath of files) {
      const filename = nodePath.basename(filePath, nodePath.extname(filePath))
      const route = ['index', 'home'].includes(filename) ? '/' : `/${filename}`

      if (route === path) {
        // Process and cache
        const output = await processTemplate(filePath)
        routes.set(route, output)
        return output
      }
    }

    return null
  }

  // Start server immediately - processing happens on-demand
  console.log(`🌐 Server running at: http://localhost:${port}`)
  console.log(`💡 Templates will be processed on first request\n`)

  const _server = bunServe({
    port,
    async fetch(req) {
      const url = new URL(req.url)
      let path = url.pathname

      // Normalize path
      if (path === '/index')
        path = '/'

      // Try to serve the requested page (lazy load on demand)
      const content = await getRoute(path)
      if (content) {
        return new Response(content, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
          },
        })
      }

      // Try without extension
      const contentWithExt = await getRoute(`${path}.html`)
      if (contentWithExt) {
        return new Response(contentWithExt, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
          },
        })
      }

      // Try to serve build artifacts (chunk files, CSS, etc.) from .stx
      if (path.startsWith('/chunk-') || path.endsWith('.js') || path.endsWith('.css')) {
        try {
          const buildFile = Bun.file(`.stx${path}`)
          if (await buildFile.exists()) {
            const ext = path.split('.').pop()?.toLowerCase()
            const contentType = ext === 'css' ? 'text/css' : ext === 'js' ? 'application/javascript' : 'text/plain'

            return new Response(buildFile, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache', // Build artifacts change during dev
              },
            })
          }
        }
        catch {
          // Continue to other handlers
        }
      }

      // Smart asset serving - Laravel-style path resolution
      // Supports both /assets/* and /resources/assets/* paths
      if (path.startsWith('/assets/') || path.startsWith('/resources/assets/')) {
        // Ensure assets are copied on first request
        await ensureAssets()
        // Try multiple possible paths (like Laravel does)
        const possiblePaths = [
          path, // Original path
          path.replace(/^\/assets\//, '/resources/assets/'), // /assets/* -> /resources/assets/*
          path.replace(/^\/resources\/assets\//, '/assets/'), // /resources/assets/* -> /assets/*
        ]

        for (const assetPath of possiblePaths) {
          try {
            const filePath = `.${assetPath}`
            const file = Bun.file(filePath)

            if (await file.exists()) {
              // Determine content type based on file extension
              const ext = assetPath.split('.').pop()?.toLowerCase()

              // Handle TypeScript files - transpile to JavaScript
              if (ext === 'ts') {
                const transpiler = new Bun.Transpiler({
                  loader: 'ts',
                })
                const code = await file.text()
                const transpiled = transpiler.transformSync(code)

                return new Response(transpiled, {
                  headers: {
                    'Content-Type': 'application/javascript',
                    'Cache-Control': 'no-cache', // Dev mode - no caching for TS
                  },
                })
              }

              const contentTypes: Record<string, string> = {
                'css': 'text/css',
                'js': 'application/javascript',
                'json': 'application/json',
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
                'ico': 'image/x-icon',
                'woff': 'font/woff',
                'woff2': 'font/woff2',
                'ttf': 'font/ttf',
                'eot': 'application/vnd.ms-fontobject',
              }

              return new Response(file, {
                headers: {
                  'Content-Type': contentTypes[ext || ''] || 'application/octet-stream',
                  'Cache-Control': 'public, max-age=31536000',
                },
              })
            }
          }
          catch {
            // Continue to next path
            continue
          }
        }
      }

      // Handle favicon.ico requests
      if (path === '/favicon.ico') {
        // Try common favicon locations
        const faviconPaths = [
          './public/favicon.ico',
          './resources/assets/favicon.ico',
          './favicon.ico',
        ]

        for (const faviconPath of faviconPaths) {
          try {
            const favicon = Bun.file(faviconPath)
            if (await favicon.exists()) {
              return new Response(favicon, {
                headers: {
                  'Content-Type': 'image/x-icon',
                  'Cache-Control': 'public, max-age=86400',
                },
              })
            }
          }
          catch {
            continue
          }
        }

        // Return empty 204 if no favicon found
        return new Response(null, { status: 204 })
      }

      // 404 page - discover files to show available routes
      const files = await discoverFiles()
      const nodePath = await import('node:path')
      const availableRoutes: string[] = []

      for (const filePath of files) {
        const filename = nodePath.basename(filePath, nodePath.extname(filePath))
        const route = ['index', 'home'].includes(filename) ? '/' : `/${filename}`
        availableRoutes.push(`<li><a href="${route}">${route}</a></li>`)
      }

      const routesList = availableRoutes.join('\n')

      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>404 - Not Found</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                max-width: 800px;
                margin: 4rem auto;
                padding: 2rem;
                text-align: center;
              }
              h1 { color: #e53e3e; }
              ul { list-style: none; padding: 0; margin: 2rem 0; }
              li { margin: 0.5rem 0; }
              a { color: #667eea; text-decoration: none; font-size: 1.1rem; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>404 - Page Not Found</h1>
            <p>The page "${path}" doesn't exist.</p>
            <h2>Available pages:</h2>
            <ul>${routesList}</ul>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  // Keep the process running
  await Bun.sleep(Number.POSITIVE_INFINITY)
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2)

  // Remove 'serve' if it's the first argument (for compatibility)
  if (args[0] === 'serve') {
    args.shift()
  }
  const portIndex = args.indexOf('--port')
  const port = portIndex !== -1 && args[portIndex + 1] ? Number.parseInt(args[portIndex + 1]) : 3456

  // Get file patterns (everything that's not a flag)
  const patterns = args.filter(arg => !arg.startsWith('--') && arg !== args[portIndex + 1])

  // Call the exported serve function
  await serve({ patterns, port })
}

// Only run main() if this file is being executed directly (not imported)
if (import.meta.main) {
  main().catch(console.error)
}
