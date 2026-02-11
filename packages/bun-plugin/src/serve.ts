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
import { loadConfig } from 'bunfig'

export interface ServeOptions {
  patterns: string[]
  port?: number
  componentsDir?: string
  layoutsDir?: string
  partialsDir?: string
}

// Default STX config for serving - matches @stacksjs/stx defaults
const defaultStxConfig = {
  partialsDir: 'partials',
  componentsDir: 'components',
  layoutsDir: 'layouts',
}

/**
 * Start the STX development server
 * @param options Server options with patterns and port
 */
export async function serve(options: ServeOptions): Promise<void> {
  // Load STX config via bunfig - supports stx.config.ts, .stx.config.ts, etc.
  const stxConfig = await loadConfig({
    name: 'stx',
    cwd: process.cwd(),
    defaultConfig: defaultStxConfig,
  })

  // Options passed directly take precedence, then bunfig config, then defaults
  const componentsDir = options.componentsDir ?? stxConfig.componentsDir ?? defaultStxConfig.componentsDir
  const layoutsDir = options.layoutsDir ?? stxConfig.layoutsDir ?? defaultStxConfig.layoutsDir
  const partialsDir = options.partialsDir ?? stxConfig.partialsDir ?? defaultStxConfig.partialsDir

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
            const discovered = await Array.fromAsync(glob.scan({ cwd: pattern, followSymlinks: true }))
            files.push(...discovered.map(f => `${pattern}/${f}`.replace(/\/+/g, '/')))
          }
        }
        else if (pattern.includes('*')) {
          const glob = new Glob(pattern)
          const basePath = pattern.split('*')[0].replace(/\/$/, '')
          const discovered = await Array.fromAsync(glob.scan({ cwd: basePath || '.', followSymlinks: true }))
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

  // Crosswind CSS lazy loading
  let crosswindModule: { CSSGenerator: any, config: any } | null = null
  let crosswindLoadAttempted = false

  async function loadCrosswind(): Promise<{ CSSGenerator: any, config: any } | null> {
    if (crosswindLoadAttempted)
      return crosswindModule
    crosswindLoadAttempted = true

    try {
      // Try the npm package first
      const mod = await import('@cwcss/crosswind')
      crosswindModule = { CSSGenerator: mod.CSSGenerator, config: mod.config }
      console.log('✅ Crosswind CSS engine loaded')
      return crosswindModule
    }
    catch {
      try {
        // Fallback to local development path
        const nodePath = await import('node:path')
        const localPath = nodePath.join(process.env.HOME || '', 'Code/Tools/crosswind/packages/crosswind/src/index.ts')
        const mod = await import(localPath)
        crosswindModule = { CSSGenerator: mod.CSSGenerator, config: mod.config }
        console.log('✅ Crosswind CSS engine loaded from local path')
        return crosswindModule
      }
      catch {
        console.warn('⚠️ Crosswind CSS engine not available')
        return null
      }
    }
  }

  async function generateCrosswindCSS(htmlContent: string): Promise<string> {
    try {
      const cw = await loadCrosswind()
      if (!cw)
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

      const generator = new cw.CSSGenerator({ ...cw.config, preflight: true, minify: false })
      for (const className of classes) {
        generator.generate(className)
      }
      return generator.toCSS(true, false)
    }
    catch (error) {
      console.warn('Failed to generate Crosswind CSS:', error)
      return ''
    }
  }

  // Lazy template processing function
  async function processTemplate(filePath: string): Promise<string> {
    const path = await import('node:path')
    const content = await Bun.file(filePath).text()

    // Extract server-side script specifically (marked with 'server' attribute)
    const serverScriptMatch = content.match(/<script\s+server\b[^>]*>([\s\S]*?)<\/script>/i)
    const scriptContent = serverScriptMatch ? serverScriptMatch[1] : ''

    // Remove only the server script from template content
    const templateContent = serverScriptMatch
      ? content.replace(/<script\s+server\b[^>]*>[\s\S]*?<\/script>/gi, '')
      : content

    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: path.dirname(filePath),
    }

    const { processDirectives, extractVariables, defaultConfig } = await import('@stacksjs/stx')
    await extractVariables(scriptContent, context, filePath)

    // Merge custom options with default config
    const config = {
      ...defaultConfig,
      ...(componentsDir && { componentsDir }),
      ...(layoutsDir && { layoutsDir }),
      ...(partialsDir && { partialsDir }),
    }

    let output = templateContent
    const dependencies = new Set<string>()
    output = await processDirectives(output, context, filePath, config, dependencies)

    // Strip <template> wrapper tags FIRST - browsers don't render template content
    // STX uses <template> in source but output should be renderable HTML
    output = output.replace(/<template[^>]*>/gi, '').replace(/<\/template>/gi, '')

    // Generate and inject Crosswind CSS
    const crosswindCSS = await generateCrosswindCSS(output)
    if (crosswindCSS) {
      const styleTag = `<style>/* crosswind css */\n${crosswindCSS}</style>`
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
    // For root path (empty normalizedPath), use index.* directly without leading slash
    if (normalizedPath === '') {
      possibleFiles.push('index.stx')
      possibleFiles.push('index.md')
      possibleFiles.push('index.html')
    }
    else {
      possibleFiles.push(`${normalizedPath}/index.stx`)
      possibleFiles.push(`${normalizedPath}/index.md`)
      possibleFiles.push(`${normalizedPath}/index.html`)
    }

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

      // For absolute paths, extract the relative portion from the pattern
      // e.g., /Users/.../dashboard/pages/home.stx with pattern /Users/.../dashboard
      //       becomes pages/home.stx
      let relativeFilePath = normalizedFilePath
      for (const pattern of patterns) {
        const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '')
        if (normalizedFilePath.startsWith(normalizedPattern + '/')) {
          relativeFilePath = normalizedFilePath.slice(normalizedPattern.length + 1)
          break
        }
      }

      // Check if this file matches by extracting route from file path
      // e.g., pages/library/components.stx -> /pages/library/components or /library/components
      const fileRoute = relativeFilePath.replace(/\.(stx|md|html)$/, '')

      // Check various possible route formats
      // Special case: index files should map to root path
      const isIndexFile = fileRoute === 'index' || fileRoute.endsWith('/index')
      const isRootRequest = requestPath === '/' || normalizedPath === ''

      if (`/${fileRoute}` === requestPath ||
          fileRoute === normalizedPath ||
          `/${fileRoute}.stx` === requestPath ||
          `/${fileRoute}.md` === requestPath ||
          `/${fileRoute}.html` === requestPath ||
          (isIndexFile && isRootRequest)) {
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

    // Strategy 6: Dynamic route segments - [param].stx files
    // e.g., /data/product -> pages/data/[model].stx or data/[model].stx
    for (const filePath of files) {
      const normalizedFilePath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')

      // Check if this file has a dynamic segment like [param]
      if (!normalizedFilePath.includes('['))
        continue

      // Extract the relative path from patterns
      let relativeFilePath = normalizedFilePath
      for (const pattern of patterns) {
        const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '')
        if (normalizedFilePath.startsWith(normalizedPattern + '/')) {
          relativeFilePath = normalizedFilePath.slice(normalizedPattern.length + 1)
          break
        }
      }

      // Convert dynamic route file to regex pattern
      // e.g., pages/data/[model].stx -> ^pages/data/([^/]+)$
      const fileRouteBase = relativeFilePath.replace(/\.(stx|md|html)$/, '')
      const routePattern = fileRouteBase
        .replace(/\[([^\]]+)\]/g, '([^/]+)') // Replace [param] with capture group
        .replace(/\//g, '\\/') // Escape slashes

      // Try matching with and without 'pages/' prefix
      const regexPatterns = [
        new RegExp(`^${routePattern}$`),
      ]
      if (fileRouteBase.startsWith('pages/')) {
        const prettyPattern = fileRouteBase.slice(6).replace(/\[([^\]]+)\]/g, '([^/]+)').replace(/\//g, '\\/')
        regexPatterns.push(new RegExp(`^${prettyPattern}$`))
      }

      for (const regex of regexPatterns) {
        const match = normalizedPath.match(regex)
        if (match) {
          // Extract param names and values
          const paramNames = [...fileRouteBase.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
          const paramValues = match.slice(1)

          // Process template with dynamic params in context
          const output = await processTemplateDynamic(filePath, paramNames, paramValues, normalizedPath)
          routes.set(requestPath, output)
          return output
        }
      }
    }

    return null
  }

  // Process template with dynamic route parameters
  async function processTemplateDynamic(
    filePath: string,
    paramNames: string[],
    paramValues: string[],
    routePath: string,
  ): Promise<string> {
    const path = await import('node:path')
    const content = await Bun.file(filePath).text()

    // Extract server-side script specifically (marked with 'server' attribute)
    const serverScriptMatch = content.match(/<script\s+server\b[^>]*>([\s\S]*?)<\/script>/i)
    const scriptContent = serverScriptMatch ? serverScriptMatch[1] : ''
    // Remove only the server script from template content
    const templateContent = serverScriptMatch
      ? content.replace(/<script\s+server\b[^>]*>[\s\S]*?<\/script>/gi, '')
      : content

    // Build context with dynamic params
    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: path.dirname(filePath),
      __route: routePath,
    }

    // Add each param to context
    for (let i = 0; i < paramNames.length; i++) {
      context[paramNames[i]] = paramValues[i]
    }

    const { processDirectives, extractVariables, defaultConfig } = await import('@stacksjs/stx')
    await extractVariables(scriptContent, context, filePath)

    const config = {
      ...defaultConfig,
      ...(componentsDir && { componentsDir }),
      ...(layoutsDir && { layoutsDir }),
      ...(partialsDir && { partialsDir }),
    }

    let output = templateContent
    const dependencies = new Set<string>()
    output = await processDirectives(output, context, filePath, config, dependencies)

    output = output.replace(/<template[^>]*>/gi, '').replace(/<\/template>/gi, '')

    const crosswindCSS = await generateCrosswindCSS(output)
    if (crosswindCSS) {
      const styleTag = `<style>/* crosswind css */\n${crosswindCSS}</style>`
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

      // Handle API routes for data operations
      if (path.startsWith('/api/data/') && req.method === 'POST') {
        try {
          const tableName = path.replace('/api/data/', '').split('/')[0]
          if (!tableName) {
            return new Response(JSON.stringify({ error: 'Table name required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            })
          }

          const body = await req.json()
          const nodePath = await import('node:path')

          // Import bun:sqlite for database operations
          const { Database } = await import('bun:sqlite')
          const dbPath = nodePath.resolve(process.cwd(), 'database/stacks.sqlite')
          const db = new Database(dbPath)

          // Get column info to validate fields
          const tableInfo = db.query(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string, type: string, notnull: number, dflt_value: any }>
          const validColumns = tableInfo.map((c: any) => c.name).filter((n: string) => n !== 'id' && n !== 'created_at' && n !== 'updated_at')

          // Build INSERT query with only valid columns that have values
          const columns: string[] = []
          const placeholders: string[] = []
          const values: any[] = []

          for (const col of validColumns) {
            if (body[col] !== undefined && body[col] !== '') {
              columns.push(col)
              placeholders.push('?')
              values.push(body[col])
            }
          }

          // Add timestamps
          const now = new Date().toISOString()
          if (tableInfo.some((c: any) => c.name === 'created_at')) {
            columns.push('created_at')
            placeholders.push('?')
            values.push(now)
          }
          if (tableInfo.some((c: any) => c.name === 'updated_at')) {
            columns.push('updated_at')
            placeholders.push('?')
            values.push(now)
          }

          if (columns.length === 0) {
            db.close()
            return new Response(JSON.stringify({ error: 'No valid fields provided' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            })
          }

          const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
          const stmt = db.prepare(query)
          const result = stmt.run(...values)

          db.close()

          return new Response(JSON.stringify({
            success: true,
            id: result.lastInsertRowid,
            message: 'Record created successfully',
          }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }
        catch (error: any) {
          console.error('API Error:', error)
          return new Response(JSON.stringify({
            error: error.message || 'Failed to create record',
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }
      }

      // Normalize path
      if (path === '/index')
        path = '/'

      // Redirect root to /home if no index exists (dashboard pattern)
      if (path === '/') {
        const indexContent = await getRoute('/')
        if (!indexContent) {
          // Try /home as default landing page
          const homeContent = await getRoute('/home')
          if (homeContent) {
            return new Response(null, {
              status: 302,
              headers: {
                'Location': '/home',
                ...corsHeaders,
              },
            })
          }
        }
      }

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
        let normalizedPath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')

        // For absolute paths, extract relative portion from patterns
        for (const pattern of patterns) {
          const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '')
          if (normalizedPath.startsWith(normalizedPattern + '/')) {
            normalizedPath = normalizedPath.slice(normalizedPattern.length + 1)
            break
          }
        }

        // Strip extension and 'pages/' prefix for cleaner route display
        let route = normalizedPath.replace(/\.(stx|md|html)$/, '')
        if (route.startsWith('pages/')) {
          route = route.slice(6) // Remove 'pages/' prefix
        }

        availableRoutes.push(`<li><a href="/${route}">/${route}</a></li>`)
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
