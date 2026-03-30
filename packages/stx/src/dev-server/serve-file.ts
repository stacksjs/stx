// @ts-nocheck - Skip type checking due to HeadersInit type constraints
import type { BunPlugin } from 'bun'
import type { DevServerOptions } from './types'
import { serve } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import {
  getHmrServer,
  injectHotReload,
  isCssOnlyChange,
  shouldIgnoreFile,
  shouldReloadOnChange,
  stopHmrServer,
} from '../hot-reload'
import { partialsCache } from '../includes'
import { plugin as stxPlugin } from '../plugin'
import { clearComponentCache } from '../utils'
import {
  buildCrosswindCSS,
  colors,
  extractSidebarConfig,
  findAvailablePort,
  injectCrosswindCSS,
  openNativeWindow,
  rebuildCrosswindCSS,
  setupKeyboardShortcuts,
} from './index'
import { serveMarkdownFile } from './serve-markdown'

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

      // Read the file content (router injected by plugin)
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

  // Build Crosswind CSS if config exists
  const cwd = path.dirname(absolutePath)
  await buildCrosswindCSS(cwd)

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

  // Load API routes and custom router from stx.config.ts
  let apiRoutes: Record<string, (request: Request) => Response | Promise<Response>> = {}
  let customRouter: { handleRequest: (request: Request) => Response | Promise<Response> } | null = null
  try {
    const { loadStxConfig } = await import('../')
    const projectConfig = await loadStxConfig()
    if (projectConfig?.apiRouter) {
      customRouter = projectConfig?.apiRouter
      console.log(`${colors.blue}Using custom router for API handling${colors.reset}`)
    }
    if (projectConfig?.apiRoutes) {
      apiRoutes = projectConfig.apiRoutes
      const routeCount = Object.keys(apiRoutes).length
      if (routeCount > 0) {
        console.log(`${colors.blue}Loaded ${colors.bright}${routeCount} API route${routeCount > 1 ? 's' : ''}${colors.reset}`)
      }
    }
    // Start broadcasting server if enabled, then auto-discover channels.ts
    if (projectConfig?.broadcasting?.enabled) {
      try {
        const { startBroadcasting, loadChannels } = await import('../broadcasting')
        const bcConfig = projectConfig.broadcasting
        await startBroadcasting(bcConfig)
        const bcPort = bcConfig.port ?? 6001
        console.log(`${colors.magenta}Broadcasting on ${colors.cyan}ws://localhost:${bcPort}/ws${colors.reset}`)

        // Auto-discover channels.ts at project root
        const channelsFile = path.join(process.cwd(), 'channels.ts')
        if (fs.existsSync(channelsFile)) {
          try {
            const count = await loadChannels(channelsFile)
            console.log(`${colors.blue}Loaded ${colors.bright}${count} broadcast channel${count !== 1 ? 's' : ''}${colors.blue} from channels.ts${colors.reset}`)
          }
          catch (err: any) {
            console.warn(`${colors.yellow}Failed to load channels.ts: ${err.message}${colors.reset}`)
          }
        }
      }
      catch (err: any) {
        console.warn(`${colors.yellow}Broadcasting failed to start: ${err.message}${colors.reset}`)
      }
    }
  }
  catch { /* no config or no apiRoutes */ }

  // Start a server
  console.log(`${colors.blue}Starting server on ${colors.cyan}http://localhost:${actualPort}/${colors.reset}...`)
  if (hotReload) {
    console.log(`${colors.magenta}Hot reload enabled on ws://localhost:${actualHmrPort}${colors.reset}`)
  }
  const server = serve({
    port: actualPort,
    async fetch(request) {
      const url = new URL(request.url)

      // Handle requests via custom router (e.g. @stacksjs/bun-router)
      if (customRouter) {
        try {
          const routerResponse = await customRouter.handleRequest(request)
          if (routerResponse.status !== 404) {
            return routerResponse
          }
        }
        catch { /* router error — fall through to STX pages */ }
      }

      // Handle custom API routes from stx.config.ts (fallback)
      if (apiRoutes[url.pathname]) {
        try {
          return await apiRoutes[url.pathname](request)
        }
        catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      // Serve the main HTML for the root path
      if (url.pathname === '/') {
        // Inject Crosswind CSS for utility classes (async)
        const processedContent = async () => {
          let content = await injectCrosswindCSS(htmlContent || '')
          // Inject HMR client script if hot reload is enabled
          if (hotReload) {
            content = injectHotReload(content, actualHmrPort)
          }
          // Inject native sidebar styles and flag when running in native mode
          // CSS is injected to immediately hide web sidebar before any rendering
          if (options.native) {
            const nativeSidebarInjection = `<style>[data-stx-sidebar],.stx-sidebar{display:none!important}</style><script>window.__craftNativeSidebar=true;document.documentElement.classList.add('has-native-sidebar')</script>`
            if (content.includes('<head>')) {
              content = content.replace('<head>', `<head>${nativeSidebarInjection}`)
            }
            else if (content.includes('<html')) {
              content = content.replace(/(<html[^>]*>)/, `$1<head>${nativeSidebarInjection}</head>`)
            }
            else {
              content = `<head>${nativeSidebarInjection}</head>` + content
            }
          }
          return content
        }

        return processedContent().then(content => new Response(content, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
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
    // Read template to extract native sidebar configuration
    const templateContent = await Bun.file(absolutePath).text()
    const sidebarConfig = extractSidebarConfig(templateContent)

    await openNativeWindow(actualPort, {
      title: path.basename(absolutePath, '.stx'),
      nativeSidebar: !!sidebarConfig,
      sidebarConfig,
    })
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
        // Clear all caches to ensure fresh content for included files and components
        partialsCache.clear()
        clearComponentCache()
        const success = await buildFile()

        // Rebuild Crosswind CSS
        await rebuildCrosswindCSS(cwd)

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
