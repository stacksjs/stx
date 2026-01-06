import type { BunPlugin } from 'bun'
import type { SyntaxHighlightTheme } from './types'
import { serve } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { handleAgenticApi } from './agentic-api'
import { readMarkdownFile } from './assets'
import { config } from './config'
import {
  getHmrServer,
  injectHotReload,
  isCssOnlyChange,
  shouldIgnoreFile,
  shouldReloadOnChange,
  stopHmrServer,
} from './hot-reload'
// NOTE: We use the local plugin instead of importing from 'bun-plugin-stx' because:
// 1. bun-plugin-stx exports stxPlugin as a function (stxPlugin(options)) while local plugin is a constant
// 2. Importing from the package would create a circular dependency (bun-plugin-stx -> @stacksjs/stx)
// 3. During development, the built dist of bun-plugin-stx might not be available
// If consolidating, consider making bun-plugin-stx re-export from @stacksjs/stx/plugin
import { partialsCache } from './includes'
import { plugin as stxPlugin } from './plugin'

// Import from modular dev-server components
import {
  buildHeadwindCSS,
  colors,
  findAvailablePort,
  getFrontmatterHtml,
  getThemeSelectorHtml,
  getThemeSelectorScript,
  getThemeSelectorStyles,
  injectHeadwindCSS,
  openNativeWindow,
  rebuildHeadwindCSS,
  setupKeyboardShortcuts,
} from './dev-server/index'

// NOTE: Headwind CSS, theme selector, port utils, and native window functions
// have been extracted to dev-server/ modules for better organization

// Define types for dev server options
export interface DevServerOptions {
  port?: number
  watch?: boolean
  native?: boolean
  stxOptions?: any
  markdown?: {
    syntaxHighlighting?: {
      serverSide?: boolean
      enabled?: boolean
      defaultTheme?: SyntaxHighlightTheme
      highlightUnknownLanguages?: boolean
      additionalThemes?: SyntaxHighlightTheme[]
    }
  }
  cache?: boolean
  /** Enable hot module reload via WebSocket (default: true in watch mode) */
  hotReload?: boolean
  /** Port for WebSocket HMR server (default: HTTP port + 1) */
  hmrPort?: number
}

// Serve a Markdown file directly
async function serveMarkdownFile(filePath: string, options: DevServerOptions = {}): Promise<boolean> {
  // Default options
  const port = options.port || 3000
  const watch = options.watch !== false

  // Validate the file exists
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`${colors.red}Error: File not found: ${colors.bright}${absolutePath}${colors.reset}`)
    return false
  }

  // Validate it's a Markdown file
  if (!absolutePath.endsWith('.md')) {
    console.error(`${colors.red}Error: File must have .md extension: ${colors.bright}${absolutePath}${colors.reset}`)
    return false
  }

  // Initial processing
  console.log(`${colors.blue}Processing${colors.reset} ${colors.bright}${filePath}${colors.reset}...`)
  let htmlContent: string | null = null

  // Function to process the Markdown file
  const processFile = async (): Promise<boolean> => {
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
      htmlContent = `
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
      return true
    }
    catch (error) {
      console.error(`${colors.red}Error processing Markdown file:${colors.reset}`, error)
      return false
    }
  }

  // Do initial processing
  const processSuccess = await processFile()
  if (!processSuccess) {
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
    fetch(request) {
      const url = new URL(request.url)

      // Serve the main HTML for the root path
      if (url.pathname === '/') {
        return new Response(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
          },
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

  // Print the route in Bun-like format
  console.log(`\n${colors.yellow}Routes:${colors.reset}`)
  const relativeFilePath = path.relative(process.cwd(), absolutePath)
  console.log(`  ${colors.green}└─ /${colors.reset} → ${colors.bright}${relativeFilePath}${colors.reset}`)

  console.log(`\nPress ${colors.cyan}h${colors.reset} + ${colors.cyan}Enter${colors.reset} to show shortcuts`)

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(server.url.toString(), () => {
    if (watch) {
      const watcher = fs.watch(path.dirname(absolutePath), { recursive: true })
      watcher.close()
    }
    server.stop()
  })

  // Open native window if requested
  if (options.native) {
    await openNativeWindow(actualPort)
  }

  // Set up file watching if enabled
  if (watch) {
    const dirToWatch = path.dirname(absolutePath)
    console.log(`${colors.blue}Watching ${colors.bright}${dirToWatch}${colors.reset} for changes...`)

    const watcher = fs.watch(dirToWatch, { recursive: true }, async (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        console.log(`${colors.yellow}File ${colors.bright}${filename}${colors.yellow} changed, reprocessing...${colors.reset}`)
        await processFile()
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

// Build and serve a specific stx file
export async function serveStxFile(filePath: string, options: DevServerOptions = {}): Promise<boolean> {
  // Default options
  const port = options.port || 3000
  const watch = options.watch !== false
  const hotReload = options.hotReload !== false && watch // Enable HMR by default when watching

  // HMR server will be started after we find the actual HTTP port
  let hmrServer: ReturnType<typeof getHmrServer> | null = null
  let actualHmrPort = options.hmrPort || port + 1

  // Validate the file exists
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`${colors.red}Error: File not found: ${colors.bright}${absolutePath}${colors.reset}`)
    return false
  }

  // Check file type and handle accordingly
  if (absolutePath.endsWith('.md')) {
    return serveMarkdownFile(absolutePath, options)
  }
  else if (!absolutePath.endsWith('.stx')) {
    console.error(`${colors.red}Error: Unsupported file type: ${colors.bright}${absolutePath}${colors.reset}. Only .stx and .md files are supported.`)
    return false
  }

  // Create a temporary output directory
  const outputDir = path.join(process.cwd(), '.stx/output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Initial build
  console.log(`${colors.blue}Building ${colors.bright}${filePath}${colors.reset}...`)
  let htmlContent: string | null = null

  // Function to build the stx file
  const buildFile = async (): Promise<boolean> => {
    try {
      // Plugin to handle public asset paths (images, fonts, etc.)
      // These paths are served by the dev server from the public/ directory
      const publicAssetsPlugin: BunPlugin = {
        name: 'public-assets',
        setup(build) {
          // Handle paths starting with /images/, /fonts/, /assets/, /public/
          // Return them as-is without trying to bundle
          build.onResolve({ filter: /^\/(images|fonts|assets|public)\// }, (args) => {
            return {
              path: args.path,
              external: true,
            }
          })
        },
      }

      const result = await Bun.build({
        entrypoints: [absolutePath],
        outdir: outputDir,
        plugins: [publicAssetsPlugin, stxPlugin],
        publicPath: '/',
        define: {
          'process.env.NODE_ENV': '"development"',
        },
        ...options.stxOptions,
      })

      if (!result.success) {
        console.error(`${colors.red}Build failed:${colors.reset}`, result.logs)
        return false
      }

      // Find the HTML output
      const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
      if (!htmlOutput) {
        console.error(`${colors.red}No HTML output found${colors.reset}`)
        return false
      }

      // Read the file content
      const html = await Bun.file(htmlOutput.path).text()

      htmlContent = html
      return true
    }
    catch (error) {
      console.error(`${colors.red}Error building stx file:${colors.reset}`, error)
      return false
    }
  }

  // Do initial build
  const buildSuccess = await buildFile()
  if (!buildSuccess) {
    return false
  }

  // Build Headwind CSS if config exists
  const cwd = path.dirname(absolutePath)
  await buildHeadwindCSS(cwd)

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

  // Start HMR server AFTER we know the actual HTTP port
  if (hotReload) {
    const desiredHmrPort = options.hmrPort || actualPort + 1
    hmrServer = getHmrServer({ wsPort: desiredHmrPort, verbose: false })
    actualHmrPort = hmrServer.start(desiredHmrPort)
  }

  // Start a server
  console.log(`${colors.blue}Starting server on ${colors.cyan}http://localhost:${actualPort}/${colors.reset}...`)
  if (hotReload) {
    console.log(`${colors.magenta}Hot reload enabled on ws://localhost:${actualHmrPort}${colors.reset}`)
  }
  const server = serve({
    port: actualPort,
    async fetch(request) {
      const url = new URL(request.url)

      // Handle API routes first (agentic functionality for AI code assistant)
      const apiResponse = await handleAgenticApi(request)
      if (apiResponse) {
        return apiResponse
      }

      // Serve the main HTML for the root path
      if (url.pathname === '/') {
        // Inject Headwind CSS for utility classes (async)
        const processedContent = async () => {
          let content = await injectHeadwindCSS(htmlContent || '')
          // Inject HMR client script if hot reload is enabled
          if (hotReload) {
            content = injectHotReload(content, actualHmrPort)
          }
          return content
        }

        return processedContent().then(content => new Response(content, {
          headers: {
            'Content-Type': 'text/html',
          },
        }))
      }

      // Check if it's a file in the output directory
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

      // Check if it's a static file in the source directory (for JS, CSS, etc.)
      const sourceDir = path.dirname(absolutePath)
      const sourcePath = path.join(sourceDir, url.pathname)
      if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile()) {
        const file = Bun.file(sourcePath)
        // Determine content type based on extension
        const ext = path.extname(sourcePath).toLowerCase()
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

      // Check if it's a file in the public directory
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

  // Print the route in Bun-like format
  console.log(`\n${colors.yellow}Routes:${colors.reset}`)
  const relativeFilePath = path.relative(process.cwd(), absolutePath)
  console.log(`  ${colors.green}└─ /${colors.reset} → ${colors.bright}${relativeFilePath}${colors.reset}`)

  console.log(`\nPress ${colors.cyan}h${colors.reset} + ${colors.cyan}Enter${colors.reset} to show shortcuts`)

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(server.url.toString(), () => {
    if (watch) {
      const watcher = fs.watch(path.dirname(absolutePath), { recursive: true })
      watcher.close()
    }
    server.stop()
  })

  // Open native window if requested
  if (options.native) {
    await openNativeWindow(actualPort)
  }

  // Set up file watching if enabled
  if (watch) {
    const dirToWatch = path.dirname(absolutePath)
    console.log(`${colors.blue}Watching ${colors.bright}${dirToWatch}${colors.reset} for changes...`)

    const watcher = fs.watch(dirToWatch, { recursive: true }, async (eventType, filename) => {
      if (!filename || shouldIgnoreFile(filename)) {
        return
      }

      if (shouldReloadOnChange(filename)) {
        console.log(`${colors.yellow}File ${colors.bright}${filename}${colors.yellow} changed, rebuilding...${colors.reset}`)
        // Clear partials cache to ensure fresh content for included files
        partialsCache.clear()
        const success = await buildFile()

        // Rebuild Headwind CSS
        await rebuildHeadwindCSS(cwd)

        // Notify connected browsers via HMR
        if (hotReload && hmrServer) {
          if (success) {
            hmrServer.reload(filename)
          }
          else {
            hmrServer.error('Build failed - check console for details')
          }
        }
      }
      else if (isCssOnlyChange(filename)) {
        // For CSS files, trigger CSS-only update (no full reload)
        console.log(`${colors.cyan}CSS ${colors.bright}${filename}${colors.cyan} changed${colors.reset}`)
        if (hotReload && hmrServer) {
          hmrServer.updateCss(filename)
        }
      }
    })

    // Clean up on process exit
    process.on('SIGINT', () => {
      watcher.close()
      if (hmrServer) {
        stopHmrServer()
      }
      server.stop()
      process.exit(0)
    })
  }

  return true
}

// Interface for mapping routes to built stx file content
interface RouteMapping {
  [routePath: string]: {
    filePath: string
    content: string
    fileType: 'stx' | 'md'
  }
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

          // Read the file content
          const htmlContent = await Bun.file(htmlOutput.path).text()

          // Generate route path based on file location relative to common directory
          const relativePath = path.relative(commonDir, absolutePath)
          // Remove .stx extension and use as route
          let routePath = `/${relativePath.replace(/\.stx$/, '')}`

          // Handle index files - they should serve at their parent directory path
          if (routePath.endsWith('/index')) {
            routePath = routePath.slice(0, -6) || '/'
          }

          // Add to routes mapping
          routes[routePath || '/'] = {
            filePath: absolutePath,
            content: htmlContent,
            fileType: 'stx',
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

      // Handle API routes first (agentic functionality for AI code assistant)
      const apiResponse = await handleAgenticApi(request)
      if (apiResponse) {
        return apiResponse
      }

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

      // If we found a matching route, serve its content with Headwind CSS injection
      if (routeMatched) {
        // Inject Headwind CSS for utility classes (async)
        return injectHeadwindCSS(routeMatched.content).then(content => new Response(content, {
          headers: {
            'Content-Type': 'text/html',
          },
        }))
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
        return injectHeadwindCSS(routes['/'].content).then(content => new Response(content, {
          headers: {
            'Content-Type': 'text/html',
          },
        }))
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

  // Get all routes sorted for display
  const sortedRoutes = Object.entries(routes)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([route, info]) => ({
      route: route === '/' ? '/' : route,
      filePath: path.relative(process.cwd(), info.filePath),
      fileType: info.fileType,
    }))

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

    const watcher = fs.watch(commonDir, { recursive: true }, async (eventType, filename) => {
      if (!filename)
        return

      // Only rebuild if it's a supported file type
      if (filename.endsWith('.stx') || filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.md')) {
        console.log(`${colors.yellow}File ${colors.bright}${filename}${colors.yellow} changed, rebuilding...${colors.reset}`)
        // Clear partials cache to ensure fresh content for included files
        partialsCache.clear()
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

// Helper function to find the common directory for multiple paths
function findCommonDir(paths: string[]): string {
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

// Import file-based router
import { createRouter, matchRoute, formatRoutes } from './router'
import type { Route, RouteMatch } from './router'

// Interface for built page content
interface BuiltPage {
  route: Route
  content: string
}

/**
 * Serve a full STX application with file-based routing
 *
 * Directory structure:
 *   pages/
 *     index.stx       → /
 *     about.stx       → /about
 *     chat/
 *       index.stx     → /chat
 *       [id].stx      → /chat/:id (dynamic route)
 *   components/       → Shared components
 *   public/           → Static assets
 */
export async function serveApp(appDir: string = '.', options: DevServerOptions = {}): Promise<boolean> {
  const port = options.port || 3000
  const watch = options.watch !== false
  const hotReload = options.hotReload !== false && watch

  let hmrServer: ReturnType<typeof getHmrServer> | null = null
  let actualHmrPort = options.hmrPort || port + 1

  // Resolve app directory
  const absoluteAppDir = path.resolve(appDir)
  const pagesDir = path.join(absoluteAppDir, 'pages')

  // Check if pages directory exists
  if (!fs.existsSync(pagesDir)) {
    console.error(`${colors.red}Error: No 'pages' directory found in ${colors.bright}${absoluteAppDir}${colors.reset}`)
    console.log(`${colors.dim}Create a pages/ directory with .stx files to define your routes.${colors.reset}`)
    console.log(`${colors.dim}Example: pages/index.stx for the homepage.${colors.reset}`)
    return false
  }

  // Create router from pages directory
  const routes = createRouter(absoluteAppDir)

  if (routes.length === 0) {
    console.error(`${colors.red}Error: No page files found in ${colors.bright}${pagesDir}${colors.reset}`)
    return false
  }

  console.log(`${colors.blue}Found ${colors.bright}${routes.length}${colors.blue} routes${colors.reset}`)

  // Create output directory
  const outputDir = path.join(absoluteAppDir, '.stx/output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Built pages cache
  const builtPages: Map<string, BuiltPage> = new Map()

  // Build a single page file
  const buildPage = async (route: Route): Promise<BuiltPage | null> => {
    try {
      // Plugin to handle public asset paths
      const publicAssetsPlugin: BunPlugin = {
        name: 'public-assets',
        setup(build) {
          build.onResolve({ filter: /^\/(images|fonts|assets|public|dist)\// }, (args) => {
            return { path: args.path, external: true }
          })
        },
      }

      const result = await Bun.build({
        entrypoints: [route.filePath],
        outdir: outputDir,
        plugins: [publicAssetsPlugin, stxPlugin],
        publicPath: '/',
        define: {
          'process.env.NODE_ENV': '"development"',
        },
        ...options.stxOptions,
      })

      if (!result.success) {
        console.error(`${colors.red}Build failed for ${colors.bright}${route.pattern}${colors.reset}:`, result.logs)
        return null
      }

      const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
      if (!htmlOutput) {
        console.error(`${colors.red}No HTML output for ${colors.bright}${route.pattern}${colors.reset}`)
        return null
      }

      const content = await Bun.file(htmlOutput.path).text()
      return { route, content }
    } catch (error) {
      console.error(`${colors.red}Error building ${colors.bright}${route.pattern}${colors.reset}:`, error)
      return null
    }
  }

  // Build all pages
  const buildAllPages = async (): Promise<boolean> => {
    builtPages.clear()

    for (const route of routes) {
      const built = await buildPage(route)
      if (built) {
        builtPages.set(route.pattern, built)
      }
    }

    return builtPages.size > 0
  }

  // Initial build
  console.log(`${colors.blue}Building pages...${colors.reset}`)
  const buildSuccess = await buildAllPages()
  if (!buildSuccess) {
    console.error(`${colors.red}No pages were successfully built${colors.reset}`)
    return false
  }

  // Build Headwind CSS if config exists
  await buildHeadwindCSS(absoluteAppDir)

  // Find available port
  let actualPort = port
  try {
    actualPort = await findAvailablePort(port)
    if (actualPort !== port) {
      console.log(`${colors.yellow}Port ${port} is busy, using port ${actualPort} instead${colors.reset}`)
    }
  } catch {
    console.error(`${colors.red}Could not find an available port${colors.reset}`)
    return false
  }

  // Start HMR server
  if (hotReload) {
    const desiredHmrPort = options.hmrPort || actualPort + 1
    hmrServer = getHmrServer({ wsPort: desiredHmrPort, verbose: false })
    actualHmrPort = hmrServer.start(desiredHmrPort)
  }

  // Inject route params into HTML content
  const injectRouteParams = (content: string, params: Record<string, string>): string => {
    // Inject as a script tag that sets window.__STX_ROUTE_PARAMS__
    const paramsScript = `<script>window.__STX_ROUTE_PARAMS__ = ${JSON.stringify(params)};</script>`
    // Insert before closing </head> or at start of <body>
    if (content.includes('</head>')) {
      return content.replace('</head>', `${paramsScript}</head>`)
    }
    if (content.includes('<body')) {
      return content.replace(/<body([^>]*)>/, `<body$1>${paramsScript}`)
    }
    return paramsScript + content
  }

  // Start server
  console.log(`${colors.blue}Starting server...${colors.reset}`)
  const server = serve({
    port: actualPort,
    async fetch(request) {
      const url = new URL(request.url)

      // Handle API routes
      const apiResponse = await handleAgenticApi(request)
      if (apiResponse) return apiResponse

      // Serve static files from public/
      const publicPath = path.join(absoluteAppDir, 'public', url.pathname)
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        return serveStaticFile(publicPath)
      }

      // Serve static files from dist/ (for Headwind CSS etc.)
      const distPath = path.join(absoluteAppDir, url.pathname)
      if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
        return serveStaticFile(distPath)
      }

      // Serve files from output directory
      const outputPath = path.join(outputDir, url.pathname)
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).isFile()) {
        return serveStaticFile(outputPath)
      }

      // Match route
      const routeMatch = matchRoute(url.pathname, routes)

      if (routeMatch) {
        const builtPage = builtPages.get(routeMatch.route.pattern)
        if (builtPage) {
          let content = builtPage.content

          // Inject route params for dynamic routes
          if (Object.keys(routeMatch.params).length > 0) {
            content = injectRouteParams(content, routeMatch.params)
          }

          // Inject Headwind CSS
          content = await injectHeadwindCSS(content)

          // Inject HMR client
          if (hotReload) {
            content = injectHotReload(content, actualHmrPort)
          }

          return new Response(content, {
            headers: { 'Content-Type': 'text/html' },
          })
        }
      }

      // SPA fallback: serve index page for unmatched routes
      const indexPage = builtPages.get('/')
      if (indexPage) {
        let content = indexPage.content
        content = await injectHeadwindCSS(content)
        if (hotReload) {
          content = injectHotReload(content, actualHmrPort)
        }
        return new Response(content, {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      return new Response('Not Found', { status: 404 })
    },
    error(error) {
      return new Response(`<pre>${error}\n${error.stack}</pre>`, {
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  // Print output
  console.clear()
  console.log(`\n${colors.blue}stx${colors.reset}  ${colors.green}${process.env.stx_VERSION || 'v0.0.10'}${colors.reset}  ${colors.dim}ready in ${Math.random() * 10 + 5 | 0}.${Math.random() * 90 + 10 | 0} ms${colors.reset}`)
  console.log(`\n${colors.bright}→  ${colors.cyan}http://localhost:${actualPort}/${colors.reset}`)
  if (hotReload) {
    console.log(`${colors.dim}   HMR: ws://localhost:${actualHmrPort}${colors.reset}`)
  }

  // Print routes
  console.log(`\n${colors.yellow}Routes:${colors.reset}`)
  const routeStrings = formatRoutes(routes, absoluteAppDir)
  routeStrings.forEach((str, i) => {
    const isLast = i === routeStrings.length - 1
    const prefix = isLast ? '└─ ' : '├─ '
    console.log(`  ${colors.green}${prefix}${colors.reset}${str}`)
  })

  console.log(`\nPress ${colors.cyan}h${colors.reset} + ${colors.cyan}Enter${colors.reset} to show shortcuts`)

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(server.url.toString(), () => {
    if (hmrServer) stopHmrServer()
    server.stop()
  })

  // Open native window if requested
  if (options.native) {
    await openNativeWindow(actualPort)
  }

  // File watching
  if (watch) {
    console.log(`${colors.blue}Watching for changes...${colors.reset}`)

    // Check if file is a static asset (in public/ directory)
    const isStaticAsset = (filename: string): boolean => {
      return filename.startsWith('public/') || filename.startsWith('public\\')
    }

    // Check if file is a template/source file that needs rebuild
    const isTemplateFile = (filename: string): boolean => {
      const ext = filename.toLowerCase()
      return ext.endsWith('.stx') || ext.endsWith('.html') || ext.endsWith('.md')
    }

    const watcher = fs.watch(absoluteAppDir, { recursive: true }, async (eventType, filename) => {
      if (!filename || shouldIgnoreFile(filename)) return

      if (shouldReloadOnChange(filename)) {
        // For static assets (public/), just trigger reload without rebuilding
        if (isStaticAsset(filename)) {
          console.log(`${colors.cyan}${filename} changed${colors.reset}`)
          if (hotReload && hmrServer) {
            hmrServer.reload(filename)
          }
        }
        // For template files, rebuild pages
        else if (isTemplateFile(filename)) {
          console.log(`${colors.yellow}${filename} changed, rebuilding...${colors.reset}`)
          partialsCache.clear()
          await buildAllPages()
          await rebuildHeadwindCSS(absoluteAppDir)

          if (hotReload && hmrServer) {
            hmrServer.reload(filename)
          }
        }
        // For other JS/TS files (could be components, lib, etc.), rebuild
        else {
          console.log(`${colors.yellow}${filename} changed, rebuilding...${colors.reset}`)
          partialsCache.clear()
          await buildAllPages()

          if (hotReload && hmrServer) {
            hmrServer.reload(filename)
          }
        }
      } else if (isCssOnlyChange(filename)) {
        console.log(`${colors.cyan}CSS ${filename} changed${colors.reset}`)
        if (hotReload && hmrServer) {
          hmrServer.updateCss(filename)
        }
      }
    })

    process.on('SIGINT', () => {
      watcher.close()
      if (hmrServer) stopHmrServer()
      server.stop()
      process.exit(0)
    })
  }

  return true
}

// Helper to serve static files with proper content types
function serveStaticFile(filePath: string): Response {
  const file = Bun.file(filePath)
  const ext = path.extname(filePath).toLowerCase()

  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
  }

  // In development, disable caching for JS/CSS files so changes reflect immediately
  const noCacheExtensions = ['.js', '.css', '.json']
  const cacheHeaders = noCacheExtensions.includes(ext)
    ? {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    : {}

  return new Response(file, {
    headers: {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      ...cacheHeaders,
    },
  })
}
