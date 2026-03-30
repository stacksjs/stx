// @ts-nocheck - Skip type checking due to HeadersInit type constraints
import type { BunPlugin } from 'bun'
import type { SyntaxHighlightTheme } from '../types'
import type { DevServerOptions } from './types'
import { serve } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import { readMarkdownFile } from '../assets'
import { stxClientHelpers } from '../client-helpers'
import { config } from '../config'
import { partialsCache } from '../includes'
import { plugin as stxPlugin } from '../plugin'
import { clearComponentCache } from '../utils'
import {
  colors,
  findAvailablePort,
  getFrontmatterHtml,
  getThemeSelectorHtml,
  getThemeSelectorScript,
  getThemeSelectorStyles,
  injectCrosswindCSS,
  setupKeyboardShortcuts,
} from './index'

// Interface for mapping routes to built stx file content
interface RouteMapping {
  [routePath: string]: {
    filePath: string
    content: string
    fileType: 'stx' | 'md'
  }
}

// Dynamic route info for [param] segments
interface DynamicRoute {
  pattern: RegExp
  paramNames: string[]
  filePath: string
  routeTemplate: string
  fileType: 'stx' | 'md'
}

// Helper function to find the common directory for multiple paths
export function findCommonDir(paths: string[]): string {
  if (paths.length === 0)
    return ''
  if (paths.length === 1)
    return paths[0]

  // Split all paths into components
  const parts = paths.map(p => p.split(path.sep))

  // Find the common prefix
  const commonParts: string[] = []
  for (let i = 0; i < parts[0].length; i++) {
    const part = parts[0][i]
    if (parts.every(p => p[i] === part)) {
      commonParts.push(part)
    }
    else {
      break
    }
  }

  // Join the common parts back into a path
  return commonParts.join(path.sep)
}

// Build and serve multiple files (stx and Markdown)
export async function serveMultipleStxFiles(filePaths: string[], options: DevServerOptions = {}): Promise<boolean> {
  // Default options
  const port = options.port || 3000
  const watch = options.watch !== false

  // Validate all files exist and are supported types
  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath)
    if (!fs.existsSync(absolutePath)) {
      console.error(`${colors.red}Error: File not found: ${colors.bright}${absolutePath}${colors.reset}`)
      return false
    }
    if (!absolutePath.endsWith('.stx') && !absolutePath.endsWith('.md')) {
      console.error(`${colors.red}Error: Unsupported file type: ${colors.bright}${absolutePath}${colors.reset}. Only .stx and .md files are supported.`)
      return false
    }
  }

  // Create a temporary output directory
  const outputDir = path.join(process.cwd(), '.stx/output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Get the common directory from all file paths
  const commonDir = findCommonDir(filePaths.map(f => path.dirname(path.resolve(f))))

  // Initial build of all files
  console.log(`${colors.blue}Processing ${colors.bright}${filePaths.length}${colors.reset} files...`)

  // Route mapping for serving files
  const routes: RouteMapping = {}
  const dynamicRoutes: DynamicRoute[] = []

  // Function to build all files
  const buildFiles = async (): Promise<boolean> => {
    try {
      // Process each file individually
      for (const filePath of filePaths) {
        const absolutePath = path.resolve(filePath)
        const isMarkdown = absolutePath.endsWith('.md')

        if (isMarkdown) {
          // Process Markdown file
          try {
            // Read and process the markdown file
            const { content, data } = await readMarkdownFile(absolutePath, {
              markdown: {
                syntaxHighlighting: {
                  serverSide: true,
                  enabled: true,
                  defaultTheme: config.markdown?.syntaxHighlighting?.defaultTheme || 'github-dark',
                  highlightUnknownLanguages: true,
                },
              },
            })

            // Get the default theme from config
            const markdownConfig = options.markdown?.syntaxHighlighting || config.markdown?.syntaxHighlighting
            const defaultTheme = markdownConfig?.defaultTheme || 'github-dark'

            // Combine available themes
            const baseThemes: SyntaxHighlightTheme[] = ['github-dark'] // Always include github-dark
            const configThemes = markdownConfig?.additionalThemes || []
            const availableThemes = [...new Set([...baseThemes, ...configThemes])]

            // Create the theme options HTML
            const themeOptions = availableThemes.map((theme: SyntaxHighlightTheme) =>
              `<option value="${theme}"${theme === defaultTheme ? ' selected' : ''}>${theme}</option>`,
            ).join('\n      ')

            // Create a simple HTML wrapper for the content with a nice theme
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || path.basename(absolutePath)}</title>
  <!-- Syntax highlighting styles -->
  <style id="syntax-theme">
    :root {
      --shiki-color-text: #24292e;
      --shiki-color-background: #ffffff;
      --shiki-token-constant: #005cc5;
      --shiki-token-string: #032f62;
      --shiki-token-comment: #6a737d;
      --shiki-token-keyword: #d73a49;
      --shiki-token-parameter: #24292e;
      --shiki-token-function: #6f42c1;
      --shiki-token-string-expression: #032f62;
      --shiki-token-punctuation: #24292e;
      --shiki-token-link: #032f62;
    }
    pre {
      background-color: var(--shiki-color-background);
      padding: 1rem;
      border-radius: 4px;
    }
    code {
      color: var(--shiki-color-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .dark-mode {
      --shiki-color-text: #e1e4e8;
      --shiki-color-background: #24292e;
      --shiki-token-constant: #79b8ff;
      --shiki-token-string: #9ecbff;
      --shiki-token-comment: #6a737d;
      --shiki-token-keyword: #f97583;
      --shiki-token-parameter: #e1e4e8;
      --shiki-token-function: #b392f0;
      --shiki-token-string-expression: #9ecbff;
      --shiki-token-punctuation: #e1e4e8;
      --shiki-token-link: #9ecbff;
    }
  </style>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    pre {
      border-radius: 4px;
      padding: 0;
      margin: 1.5rem 0;
      overflow-x: auto;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    pre code {
      display: block;
      padding: 1rem;
      overflow-x: auto;
    }
    /* Apply background color to code blocks based on theme */
    pre.syntax-highlighter {
      background-color: var(--shiki-color-background) !important;
    }
    .dark-mode pre.syntax-highlighter {
      background-color: var(--shiki-color-background) !important;
    }
    code {
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
    }
    h1, h2, h3, h4 {
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    h1 { color: #111; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    h2 { color: #333; border-bottom: 1px solid #f0f0f0; padding-bottom: 0.3rem; }
    h3 { color: #444; }
    img {
      max-width: 100%;
      border-radius: 4px;
      margin: 1rem 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin-left: 0;
      color: #555;
      background: #f9f9f9;
      padding: 0.5rem 1rem;
      margin: 1.5rem 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5rem 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem;
    }
    th {
      background: #f0f0f0;
      text-align: left;
    }
    tr:nth-child(even) {
      background-color: #f8f8f8;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: 0;
      border-top: 1px solid #eee;
      margin: 2rem 0;
    }
    .frontmatter {
      background: #f8f8f8;
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #ddd;
    }
    .frontmatter-item {
      margin-bottom: 0.5rem;
      display: flex;
    }
    .frontmatter-label {
      font-weight: bold;
      min-width: 100px;
      color: #555;
    }
    ${getThemeSelectorStyles()}
  </style>
</head>
<body>
  ${getFrontmatterHtml(data)}
  ${getThemeSelectorHtml(themeOptions)}

  ${content}

  <script>
    ${getThemeSelectorScript()}
  </script>
</body>
</html>
            `

            // Generate route path based on file location relative to common directory
            const relativePath = path.relative(commonDir, absolutePath)
            // Remove .md extension and use as route
            let routePath = `/${relativePath.replace(/\.md$/, '')}`

            // Handle index files - they should serve at their parent directory path
            if (routePath.endsWith('/index')) {
              routePath = routePath.slice(0, -6) || '/'
            }

            // Add to routes mapping
            routes[routePath || '/'] = {
              filePath: absolutePath,
              content: htmlContent,
              fileType: 'md',
            }
          }
          catch (error) {
            console.error(`${colors.red}Error processing Markdown file ${colors.bright}${filePath}${colors.reset}:`, error)
            continue
          }
        }
        else {
          // Plugin to handle public asset paths
          const publicAssetsPlugin: BunPlugin = {
            name: 'public-assets',
            setup(build) {
              build.onResolve({ filter: /^\/(images|fonts|assets|public)\// }, (args) => {
                return {
                  path: args.path,
                  external: true,
                }
              })
            },
          }

          // Build stx file
          const result = await Bun.build({
            entrypoints: [absolutePath],
            outdir: outputDir,
            plugins: [publicAssetsPlugin, stxPlugin],
            define: {
              'process.env.NODE_ENV': '"development"',
            },
            ...options.stxOptions,
          })

          if (!result.success) {
            console.error(`${colors.red}Build failed for ${colors.bright}${filePath}${colors.reset}:`, result.logs)
            continue
          }

          // Find the HTML output
          const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
          if (!htmlOutput) {
            console.error(`${colors.red}No HTML output found for ${colors.bright}${filePath}${colors.reset}`)
            continue
          }

          // Read the file content (router injected by plugin)
          const htmlContent = await Bun.file(htmlOutput.path).text()

          // Generate route path based on file location relative to common directory
          const relativePath = path.relative(commonDir, absolutePath)
          // Remove .stx extension and use as route
          let routePath = `/${relativePath.replace(/\.stx$/, '')}`

          // Handle index files - they should serve at their parent directory path
          if (routePath.endsWith('/index')) {
            routePath = routePath.slice(0, -6) || '/'
          }

          // Check if this is a dynamic route (contains [param] segments)
          if (routePath.includes('[')) {
            const paramNames = [...routePath.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
            const regexStr = routePath.replace(/\[([^\]]+)\]/g, '([^/]+)')
            dynamicRoutes.push({
              pattern: new RegExp(`^${regexStr}$`),
              paramNames,
              filePath: absolutePath,
              routeTemplate: routePath,
              fileType: 'stx',
            })
            // Store the template content keyed by the template path for later param injection
            routes[routePath] = {
              filePath: absolutePath,
              content: htmlContent,
              fileType: 'stx',
            }
          }
          else {
            // Add to routes mapping
            routes[routePath || '/'] = {
              filePath: absolutePath,
              content: htmlContent,
              fileType: 'stx',
            }
          }
        }
      }

      // Check if we have at least one successful build
      if (Object.keys(routes).length === 0) {
        console.error(`${colors.red}No files were successfully processed${colors.reset}`)
        return false
      }

      return true
    }
    catch (error) {
      console.error(`${colors.red}Error processing files:${colors.reset}`, error)
      return false
    }
  }

  // Do initial build
  const buildSuccess = await buildFiles()
  if (!buildSuccess) {
    return false
  }

  // Find an available port (with fallback)
  let actualPort = port
  try {
    actualPort = await findAvailablePort(port)
    if (actualPort !== port) {
      console.log(`${colors.yellow}Port ${port} is busy, using port ${actualPort} instead${colors.reset}`)
    }
  }
  catch {
    console.error(`${colors.red}Could not find an available port${colors.reset}`)
    return false
  }

  // Start a server
  console.log(`${colors.blue}Starting server on ${colors.cyan}http://localhost:${actualPort}/${colors.reset}...`)
  const server = serve({
    port: actualPort,
    async fetch(request) {
      const url = new URL(request.url)

      // Check if it's a file in the public directory FIRST (before route matching)
      // This ensures static assets like fonts, images are served correctly
      const publicPath = path.join(process.cwd(), 'public', url.pathname)
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        const file = Bun.file(publicPath)
        const ext = path.extname(publicPath).toLowerCase()
        let contentType = 'application/octet-stream'

        // Transpile TypeScript files on the fly
        if (ext === '.ts' || ext === '.tsx') {
          const transpiler = new Bun.Transpiler({ loader: ext === '.tsx' ? 'tsx' : 'ts' })
          const code = await file.text()
          const js = transpiler.transformSync(code)
          return new Response(js, {
            headers: {
              'Content-Type': 'application/javascript',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        }

        switch (ext) {
          case '.html':
            contentType = 'text/html'
            break
          case '.css':
            contentType = 'text/css'
            break
          case '.js':
            contentType = 'text/javascript'
            break
          case '.json':
            contentType = 'application/json'
            break
          case '.png':
            contentType = 'image/png'
            break
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg'
            break
          case '.gif':
            contentType = 'image/gif'
            break
          case '.svg':
            contentType = 'image/svg+xml'
            break
          case '.ico':
            contentType = 'image/x-icon'
            break
          case '.woff':
            contentType = 'font/woff'
            break
          case '.woff2':
            contentType = 'font/woff2'
            break
          case '.ttf':
            contentType = 'font/ttf'
            break
          case '.otf':
            contentType = 'font/otf'
            break
          case '.eot':
            contentType = 'application/vnd.ms-fontobject'
            break
        }

        return new Response(file, {
          headers: { 'Content-Type': contentType },
        })
      }

      // First, try to match the pathname exactly to a route
      let routeMatched = routes[url.pathname]

      // If no match, try to find a index match (for cases like /about -> /about/index)
      if (!routeMatched && !url.pathname.endsWith('/')) {
        routeMatched = routes[`${url.pathname}/`]
      }

      // If still no match, try dynamic routes (e.g., /vehicles/[vin])
      if (!routeMatched) {
        for (const dynRoute of dynamicRoutes) {
          const match = url.pathname.match(dynRoute.pattern)
          if (match) {
            // Get the template content
            const templateRoute = routes[dynRoute.routeTemplate]
            if (templateRoute) {
              // Inject route params into the page content as a script block
              const params: Record<string, string> = {}
              for (let i = 0; i < dynRoute.paramNames.length; i++) {
                params[dynRoute.paramNames[i]] = decodeURIComponent(match[i + 1])
              }
              let content = templateRoute.content
              // Inject params as a global variable before </head> or at start of <body>
              const paramScript = `<script>window.__routeParams = ${JSON.stringify(params)};</script>`
              if (content.includes('</head>')) {
                content = content.replace('</head>', `${paramScript}\n</head>`)
              }
              else {
                content = paramScript + content
              }
              routeMatched = { ...templateRoute, content }
            }
            break
          }
        }
      }

      // If we found a matching route, serve its content with Crosswind CSS injection
      if (routeMatched) {
        // Inject Crosswind CSS for utility classes (async)
        // Always return full HTML — the SPA router extracts <main> content
        // and swaps <head> styles client-side via DOMParser
        return injectCrosswindCSS(routeMatched.content).then(content => {
          // Inject stx client helpers (formatters, badge system, detail panel builder, etc.)
          if (content.includes('</head>')) {
            content = content.replace('</head>', `${stxClientHelpers}\n</head>`)
          }
          return new Response(content, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        })
      }

      // Check if it's a file in the output directory (bundled assets like images, JS, CSS)
      const requestedPath = path.join(outputDir, url.pathname)
      if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
        const file = Bun.file(requestedPath)
        // Determine content type based on extension
        const ext = path.extname(requestedPath).toLowerCase()
        let contentType = 'text/plain'

        // Transpile TypeScript files on the fly
        if (ext === '.ts' || ext === '.tsx') {
          const transpiler = new Bun.Transpiler({ loader: ext === '.tsx' ? 'tsx' : 'ts' })
          const code = await file.text()
          const js = transpiler.transformSync(code)
          return new Response(js, {
            headers: {
              'Content-Type': 'application/javascript',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        }

        switch (ext) {
          case '.html':
            contentType = 'text/html'
            break
          case '.css':
            contentType = 'text/css'
            break
          case '.js':
            contentType = 'text/javascript'
            break
          case '.json':
            contentType = 'application/json'
            break
          case '.png':
            contentType = 'image/png'
            break
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg'
            break
          case '.gif':
            contentType = 'image/gif'
            break
          case '.svg':
            contentType = 'image/svg+xml'
            break
          case '.ico':
            contentType = 'image/x-icon'
            break
          case '.woff':
            contentType = 'font/woff'
            break
          case '.woff2':
            contentType = 'font/woff2'
            break
          case '.ttf':
            contentType = 'font/ttf'
            break
          case '.otf':
            contentType = 'font/otf'
            break
          case '.eot':
            contentType = 'application/vnd.ms-fontobject'
            break
        }

        return new Response(file, {
          headers: { 'Content-Type': contentType },
        })
      }

      // If still no match and there's a root route, serve that as fallback (SPA mode)
      if (url.pathname !== '/' && routes['/']) {
        const isRouterRequest = request.headers.get('X-STX-Router') === 'true'

        return injectCrosswindCSS(routes['/'].content).then(content => {
          if (isRouterRequest) {
            const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
            if (mainMatch) {
              const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
              const title = titleMatch ? titleMatch[1] : ''
              const partialHtml = `<!DOCTYPE html><html><head><title>${title}</title></head><body><main>${mainMatch[1]}</main></body></html>`
              return new Response(partialHtml, {
                headers: {
                  'Content-Type': 'text/html',
                  'X-STX-Partial': 'true',
                  'Cache-Control': 'no-store, no-cache, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                },
              })
            }
          }

          return new Response(content, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        })
      }

      // Fallback 404 response
      return new Response('Not Found', { status: 404 })
    },
    error(error) {
      return new Response(`<pre>${error}\n${error.stack}</pre>`, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    },
  })

  // Print Bun-style output header
  console.clear()
  console.log(`\n${colors.blue}stx${colors.reset}  ${colors.green}${process.env.stx_VERSION || 'v0.0.10'}${colors.reset}  ${colors.dim}ready in  ${Math.random() * 10 + 5 | 0}.${Math.random() * 90 + 10 | 0}  ms${colors.reset}`)
  console.log(`\n${colors.bright}→  ${colors.cyan}http://localhost:${actualPort}/${colors.reset}`)

  // Print the routes in Bun-like format
  console.log(`\n${colors.yellow}Routes:${colors.reset}`)

  // Get all routes sorted for display (exclude dynamic route templates from static list)
  const dynamicTemplates = new Set(dynamicRoutes.map(d => d.routeTemplate))
  const sortedRoutes = Object.entries(routes)
    .filter(([route]) => !dynamicTemplates.has(route))
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([route, info]) => ({
      route: route === '/' ? '/' : route,
      filePath: path.relative(process.cwd(), info.filePath),
      fileType: info.fileType,
    }))

  // Add dynamic routes to display
  for (const dynRoute of dynamicRoutes) {
    const displayRoute = dynRoute.routeTemplate.replace(/\[([^\]]+)\]/g, ':$1')
    sortedRoutes.push({
      route: displayRoute,
      filePath: path.relative(process.cwd(), dynRoute.filePath),
      fileType: 'stx',
    })
  }
  sortedRoutes.sort((a, b) => a.route.localeCompare(b.route))

  // Display routes in tree-like structure
  sortedRoutes.forEach((routeInfo, index) => {
    const isLast = index === sortedRoutes.length - 1
    const prefix = isLast ? '└─ ' : '├─ '
    const fileTypeLabel = routeInfo.fileType === 'md' ? `${colors.magenta}(markdown)${colors.reset}` : ''

    console.log(`  ${colors.green}${prefix}${routeInfo.route}${colors.reset} → ${colors.bright}${routeInfo.filePath}${colors.reset} ${fileTypeLabel}`)
  })

  console.log(`\nPress ${colors.cyan}h${colors.reset} + ${colors.cyan}Enter${colors.reset} to show shortcuts`)

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(server.url.toString(), () => {
    if (watch) {
      const watcher = fs.watch(commonDir, { recursive: true })
      watcher.close()
    }
    server.stop()
  })

  // Set up file watching if enabled
  if (watch) {
    // Watch the entire common directory for changes
    console.log(`${colors.blue}Watching for changes...${colors.reset}`)

    // eslint-disable-next-line pickier/no-unused-vars
    const watcher = fs.watch(commonDir, { recursive: true }, async (eventType, filename) => {
      if (!filename)
        return

      // Only rebuild if it's a supported file type
      if (filename.endsWith('.stx') || filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.md')) {
        console.log(`${colors.yellow}File ${colors.bright}${filename}${colors.yellow} changed, rebuilding...${colors.reset}`)
        // Clear all caches to ensure fresh content for included files and components
        partialsCache.clear()
        clearComponentCache()
        await buildFiles()
      }
    })

    // Clean up on process exit
    process.on('SIGINT', () => {
      watcher.close()
      server.stop()
      process.exit(0)
    })
  }

  return true
}
