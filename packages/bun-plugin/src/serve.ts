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
    catch {
      // Silently ignore
    }
  }

  // Headwind CSS lazy loading
  let headwindModule: { CSSGenerator: any, config: any } | null = null
  let headwindLoadAttempted = false

  async function loadHeadwind(): Promise<{ CSSGenerator: any, config: any } | null> {
    if (headwindLoadAttempted)
      return headwindModule
    headwindLoadAttempted = true

    try {
      const mod = await import('@stacksjs/headwind')
      headwindModule = { CSSGenerator: mod.CSSGenerator, config: mod.config }
      console.log('✅ Headwind CSS engine loaded')
      return headwindModule
    }
    catch {
      try {
        const nodePath = await import('node:path')
        const localPath = nodePath.join(process.env.HOME || '', 'Code/headwind/packages/headwind/src/index.ts')
        const mod = await import(localPath)
        headwindModule = { CSSGenerator: mod.CSSGenerator, config: mod.config }
        console.log('✅ Headwind CSS engine loaded from local path')
        return headwindModule
      }
      catch {
        console.warn('⚠️ Headwind CSS engine not available')
        return null
      }
    }
  }

  async function generateHeadwindCSS(htmlContent: string): Promise<string> {
    try {
      const hw = await loadHeadwind()
      if (!hw)
        return ''

      const classRegex = /class\s*=\s*["']([^"']+)["']/gi
      const classes = new Set<string>()
      let match = classRegex.exec(htmlContent)
      while (match !== null) {
        for (const cls of match[1].split(/\s+/)) {
          if (cls.trim())
            classes.add(cls.trim())
        }
        match = classRegex.exec(htmlContent)
      }

      if (classes.size === 0)
        return ''

      const generator = new hw.CSSGenerator({ ...hw.config, preflight: true, minify: false })
      for (const className of classes) {
        generator.generate(className)
      }
      return generator.toCSS(true, false)
    }
    catch (error) {
      console.warn('Failed to generate Headwind CSS:', error)
      return ''
    }
  }

  // Lazy template processing function
  async function processTemplate(filePath: string): Promise<string> {
    const path = await import('node:path')
    const content = await Bun.file(filePath).text()

    const inlineScriptMatch = content.match(/<script(?!\s[^>]*src=)\b[^>]*>([\s\S]*?)<\/script>/i)
    const scriptContent = inlineScriptMatch ? inlineScriptMatch[1] : ''
    const templateContent = inlineScriptMatch
      ? content.replace(/<script(?!\s[^>]*src=)\b[^>]*>[\s\S]*?<\/script>/i, '')
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

    // Strip <template> wrapper tags FIRST - browsers don't render template content
    // STX uses <template> in source but output should be renderable HTML
    output = output.replace(/<template[^>]*>/gi, '').replace(/<\/template>/gi, '')

    // Generate Headwind CSS for utility classes
    const headwindCSS = await generateHeadwindCSS(output)

    // Component CSS for common dashboard patterns (works with Headwind preflight)
    const componentCSS = `
/* Dashboard Component Styles */
.page-container { padding: 1.5rem; min-height: 100vh; background: #f9fafb; }
@media (prefers-color-scheme: dark) { .page-container { background: #111827; } }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; }
.page-header-content h1 { font-size: 1.875rem; font-weight: 700; color: #111827; }
.page-header-content p { color: #6b7280; margin-top: 0.25rem; }
@media (prefers-color-scheme: dark) {
  .page-header-content h1 { color: #f9fafb; }
  .page-header-content p { color: #9ca3af; }
}
.page-header-actions { display: flex; align-items: center; gap: 0.75rem; }
.page-content { display: flex; flex-direction: column; gap: 1.5rem; }

/* Grid */
.grid { display: grid; gap: 1rem; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
@media (max-width: 1024px) { .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; } }

/* Cards */
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.25rem; }
.card:hover { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
@media (prefers-color-scheme: dark) { .card { background: #1f2937; border-color: #374151; } }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.card-title { font-size: 0.9375rem; font-weight: 600; color: #111827; }
@media (prefers-color-scheme: dark) { .card-title { color: #f9fafb; } }
.card-body { color: #6b7280; }

/* Stat Cards */
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.25rem; }
@media (prefers-color-scheme: dark) { .stat-card { background: #1f2937; border-color: #374151; } }
.stat-card-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; }
.stat-card-icon.blue { background: #dbeafe; color: #2563eb; }
.stat-card-icon.green { background: #dcfce7; color: #16a34a; }
.stat-card-icon.orange { background: #ffedd5; color: #ea580c; }
.stat-card-icon.red { background: #fee2e2; color: #dc2626; }
.stat-card-value { font-size: 2rem; font-weight: 700; color: #111827; }
@media (prefers-color-scheme: dark) { .stat-card-value { color: #f9fafb; } }
.stat-card-label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
.stat-card-trend { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 500; margin-top: 0.5rem; padding: 0.25rem 0.5rem; border-radius: 0.375rem; }
.stat-card-trend.up { background: #dcfce7; color: #16a34a; }
.stat-card-trend.down { background: #fee2e2; color: #dc2626; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: 0.5rem; border: none; cursor: pointer; transition: all 0.15s; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
.btn-secondary:hover { background: #e5e7eb; }
@media (prefers-color-scheme: dark) { .btn-secondary { background: #374151; color: #e5e7eb; border-color: #4b5563; } .btn-secondary:hover { background: #4b5563; } }
.btn-ghost { background: transparent; color: #6b7280; }
.btn-ghost:hover { background: #f3f4f6; color: #111827; }
@media (prefers-color-scheme: dark) { .btn-ghost:hover { background: #374151; color: #f9fafb; } }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }

/* Badges */
.badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; font-size: 0.6875rem; font-weight: 600; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.025em; }
.badge-success { background: #dcfce7; color: #16a34a; }
.badge-warning { background: #fef3c7; color: #d97706; }
.badge-error { background: #fee2e2; color: #dc2626; }
.badge-info { background: #dbeafe; color: #2563eb; }
.badge-neutral { background: #f3f4f6; color: #6b7280; }
@media (prefers-color-scheme: dark) {
  .badge-success { background: rgba(22,163,74,0.2); }
  .badge-warning { background: rgba(217,119,6,0.2); }
  .badge-error { background: rgba(220,38,38,0.2); }
  .badge-info { background: rgba(37,99,235,0.2); }
  .badge-neutral { background: #374151; }
}

/* Tables */
.table-container { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 0.75rem; }
@media (prefers-color-scheme: dark) { .table-container { border-color: #374151; } }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: #6b7280; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; }
@media (prefers-color-scheme: dark) { th { background: #1f2937; border-color: #374151; color: #9ca3af; } }
td { padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; color: #111827; }
@media (prefers-color-scheme: dark) { td { border-color: #374151; color: #f9fafb; } }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f9fafb; }
@media (prefers-color-scheme: dark) { tr:hover td { background: #1f2937; } }

/* Lists */
.list { display: flex; flex-direction: column; }
.list-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
@media (prefers-color-scheme: dark) { .list-item { border-color: #374151; } }
.list-item:last-child { border-bottom: none; }
.list-item:hover { background: #f9fafb; }
@media (prefers-color-scheme: dark) { .list-item:hover { background: #374151; } }
.list-item-icon { width: 2.25rem; height: 2.25rem; border-radius: 0.5rem; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
@media (prefers-color-scheme: dark) { .list-item-icon { background: #374151; } }
.list-item-content { flex: 1; min-width: 0; }
.list-item-title { font-weight: 500; color: #111827; }
@media (prefers-color-scheme: dark) { .list-item-title { color: #f9fafb; } }
.list-item-subtitle { font-size: 0.75rem; color: #6b7280; margin-top: 0.125rem; }

/* Forms */
.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.025em; }
.form-input { width: 100%; padding: 0.625rem 0.875rem; font-size: 0.875rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background: #fff; color: #111827; transition: border-color 0.15s, box-shadow 0.15s; }
.form-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
@media (prefers-color-scheme: dark) { .form-input { background: #1f2937; border-color: #4b5563; color: #f9fafb; } }

/* Utilities */
.text-muted { color: #6b7280; }
.text-sm { font-size: 0.875rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }

/* Empty State */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; text-align: center; }
.empty-state-icon { width: 4rem; height: 4rem; border-radius: 1rem; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: #9ca3af; margin-bottom: 1rem; }
@media (prefers-color-scheme: dark) { .empty-state-icon { background: #374151; } }
.empty-state-title { font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 0.5rem; }
@media (prefers-color-scheme: dark) { .empty-state-title { color: #f9fafb; } }
.empty-state-description { font-size: 0.875rem; color: #6b7280; max-width: 25rem; margin-bottom: 1.25rem; }
`

    // Combine component CSS with Headwind utilities
    const allCSS = [componentCSS, headwindCSS].filter(Boolean).join('\n')

    if (allCSS) {
      const styleTag = `<style>\n${allCSS}\n</style>`
      if (output.includes('</head>')) {
        output = output.replace('</head>', `${styleTag}\n</head>`)
      }
      else if (output.includes('<body')) {
        output = output.replace(/<body/i, `${styleTag}\n<body`)
      }
      else {
        output = styleTag + output
      }
    }

    return output
  }

  // Function to get or create route
  async function getRoute(requestPath: string): Promise<string | null> {
    // Check cache first
    if (routes.has(requestPath))
      return routes.get(requestPath)!

    // Discover files if needed
    const files = await discoverFiles()
    const nodePath = await import('node:path')

    // Normalize the request path
    let normalizedPath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath

    // Try to find matching file with various strategies
    const possibleFiles: string[] = []

    // Strategy 1: Direct path match (e.g., /pages/home.stx -> pages/home.stx)
    for (const ext of ['.stx', '.md', '.html', '']) {
      const directPath = normalizedPath.endsWith(ext) ? normalizedPath : `${normalizedPath}${ext}`
      possibleFiles.push(directPath)
    }

    // Strategy 2: Look for index files in directory
    possibleFiles.push(`${normalizedPath}/index.stx`)
    possibleFiles.push(`${normalizedPath}/index.md`)
    possibleFiles.push(`${normalizedPath}/index.html`)

    // Strategy 3: Simple filename match (legacy behavior)
    const filename = nodePath.basename(normalizedPath, nodePath.extname(normalizedPath))
    if (filename && !normalizedPath.includes('/')) {
      possibleFiles.push(`${filename}.stx`)
      possibleFiles.push(`${filename}.md`)
      possibleFiles.push(`${filename}.html`)
    }

    // Find a matching file from discovered files
    for (const possible of possibleFiles) {
      for (const filePath of files) {
        // Normalize file path for comparison
        const normalizedFilePath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')
        if (normalizedFilePath === possible || normalizedFilePath.endsWith(`/${possible}`)) {
          // Process and cache
          const output = await processTemplate(filePath)
          routes.set(requestPath, output)
          return output
        }
      }
    }

    // Strategy 4: Try finding by relative path within any pattern directory
    for (const filePath of files) {
      const normalizedFilePath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')

      // Check if this file matches by extracting route from file path
      // e.g., pages/library/components.stx -> /pages/library/components or /library/components
      const fileRoute = normalizedFilePath.replace(/\.(stx|md|html)$/, '')

      // Check various possible route formats
      if (`/${fileRoute}` === requestPath ||
          fileRoute === normalizedPath ||
          `/${fileRoute}.stx` === requestPath ||
          `/${fileRoute}.md` === requestPath ||
          `/${fileRoute}.html` === requestPath) {
        const output = await processTemplate(filePath)
        routes.set(requestPath, output)
        return output
      }

      // Strategy 5: Pretty routes - strip 'pages/' prefix for cleaner URLs
      // e.g., /home -> pages/home.stx, /library/components -> pages/library/components.stx
      if (fileRoute.startsWith('pages/')) {
        const prettyRoute = fileRoute.slice(6) // Remove 'pages/' prefix
        if (`/${prettyRoute}` === requestPath ||
            prettyRoute === normalizedPath) {
          const output = await processTemplate(filePath)
          routes.set(requestPath, output)
          return output
        }
      }
    }

    return null
  }

  // Start server immediately - processing happens on-demand
  console.log(`🌐 Server running at: http://localhost:${port}`)
  console.log(`💡 Templates will be processed on first request\n`)

  // CORS headers for cross-origin requests (needed for Craft WebView)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  const _server = bunServe({
    port,
    async fetch(req) {
      const url = new URL(req.url)
      let path = url.pathname

      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
      }

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
            ...corsHeaders,
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
            ...corsHeaders,
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
                css: 'text/css',
                js: 'application/javascript',
                json: 'application/json',
                png: 'image/png',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                gif: 'image/gif',
                svg: 'image/svg+xml',
                ico: 'image/x-icon',
                woff: 'font/woff',
                woff2: 'font/woff2',
                ttf: 'font/ttf',
                eot: 'application/vnd.ms-fontobject',
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
      const availableRoutes: string[] = []

      for (const filePath of files) {
        // Normalize and create route from file path
        const normalizedPath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')
        const route = `/${normalizedPath}`
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
