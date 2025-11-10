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

  if (patterns.length === 0) {
    console.error('Usage: serve <files...> [--port 3000]')
    console.error('\nExamples:')
    console.error('  serve pages/*.stx')
    console.error('  serve pages/*.md')
    console.error('  serve pages/*.html')
    console.error('  serve pages/ --port 3000')
    console.error('  serve index.stx about.md page.html')
    console.error('\nAfter installing: bun add bun-plugin-stx')
    process.exit(1)
  }

  console.log('🚀 Starting stx development server...\n')

  // Discover all .stx, .md, and .html files
  const sourceFiles: string[] = []
  const supportedExtensions = ['.stx', '.md', '.html']

  for (const pattern of patterns) {
    try {
      // Check if it's a directory using fs.stat
      const fs = await import('node:fs/promises')
      const stat = await fs.stat(pattern).catch(() => null)

      if (stat?.isDirectory()) {
        // Scan directory for supported files
        for (const ext of ['.stx', '.md', '.html']) {
          const glob = new Glob(`**/*${ext}`)
          const files = await Array.fromAsync(glob.scan(pattern))
          sourceFiles.push(...files.map(f => `${pattern}/${f}`.replace(/\/+/g, '/')))
        }
      }
      else if (pattern.includes('*')) {
        // Handle glob patterns
        const glob = new Glob(pattern)
        const basePath = pattern.split('*')[0].replace(/\/$/, '')
        const files = await Array.fromAsync(glob.scan(basePath || '.'))
        sourceFiles.push(...files.map(f => basePath ? `${basePath}/${f}` : f))
      }
      else if (supportedExtensions.some(ext => pattern.endsWith(ext))) {
        // Single file with supported extension
        sourceFiles.push(pattern)
      }
    }
    catch (error) {
      console.error(`Error processing pattern "${pattern}":`, error)
    }
  }

  if (sourceFiles.length === 0) {
    console.error('❌ No .stx, .md, or .html files found')
    process.exit(1)
  }

  console.log(`📄 Found ${sourceFiles.length} file(s):`)
  sourceFiles.forEach(file => console.log(`   - ${file}`))

  // Copy assets directory to build output so they're available during build
  console.log('\n📦 Copying assets...')
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const assetsDir = './resources/assets'
  const targetAssetsDir = './.stx/assets'

  try {
    const assetsExist = await fs.stat(assetsDir).then(() => true).catch(() => false)
    if (assetsExist) {
      // Remove existing assets dir in build output
      await fs.rm(targetAssetsDir, { recursive: true, force: true })
      // Copy assets recursively
      await fs.cp(assetsDir, targetAssetsDir, { recursive: true })
      console.log('✓ Assets copied')
    }
  }
  catch (error) {
    console.log('⚠ No assets directory found, skipping copy')
  }

  // Process files directly without using Bun.build to avoid path resolution
  console.log('\n🔨 Processing templates...')
  const routes = new Map<string, string>()

  // Import stx processing functions
  const { processDirectives, extractVariables, defaultConfig } = await import('@stacksjs/stx')

  for (const filePath of sourceFiles) {
    try {
      const content = await Bun.file(filePath).text()

      // Extract inline script (without src attribute) for variable extraction
      // This should match <script> or <script type="..."> but NOT <script src="...">
      const inlineScriptMatch = content.match(/<script(?!\s+[^>]*src=)\b[^>]*>([\s\S]*?)<\/script>/i)
      const scriptContent = inlineScriptMatch ? inlineScriptMatch[1] : ''
      // Only remove the inline script tag if it exists
      const templateContent = inlineScriptMatch ? content.replace(/<script(?!\s+[^>]*src=)\b[^>]*>[\s\S]*?<\/script>/i, '') : content

      // Create execution context
      const context: Record<string, any> = {
        __filename: filePath,
        __dirname: path.dirname(filePath),
      }

      // Execute script to extract variables
      await extractVariables(scriptContent, context, filePath)

      // Process template directives
      let output = templateContent
      const dependencies = new Set<string>()
      output = await processDirectives(output, context, filePath, defaultConfig, dependencies)

      // Determine route from filename
      const filename = path.basename(filePath, path.extname(filePath))
      const route = ['index', 'home'].includes(filename) ? '/' : `/${filename}`

      console.log(`   ✓ ${filePath} -> ${route}`)
      routes.set(route, output)
    }
    catch (error) {
      console.error(`   ✗ Error processing ${filePath}:`, error)
    }
  }

  console.log('✅ Processing complete\n')

  // Start server
  const _server = bunServe({
    port,
    async fetch(req) {
      const url = new URL(req.url)
      let path = url.pathname

      // Normalize path
      if (path === '/index')
        path = '/'

      // Try to serve the requested page
      if (routes.has(path)) {
        return new Response(routes.get(path), {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
          },
        })
      }

      // Try without extension
      if (routes.has(`${path}.html`)) {
        return new Response(routes.get(`${path}.html`), {
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

      // 404 page
      const availableRoutes = Array.from(routes.keys())
        .map(route => `<li><a href="${route}">${route}</a></li>`)
        .join('\n')

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
            <ul>${availableRoutes}</ul>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  console.log(`🌐 Server running at: http://localhost:${port}\n`)
  console.log('📚 Available routes:')
  routes.forEach((_, route) => {
    console.log(`   http://localhost:${port}${route}`)
  })
  console.log('\n💡 Press Ctrl+C to stop\n')

  // Keep the process running
  await Bun.sleep(Number.POSITIVE_INFINITY)
}

main().catch(console.error)
