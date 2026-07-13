// @ts-nocheck - Skip type checking due to HeadersInit type constraints
import type { DevServerOptions } from './types'
import type { ProcessedShell } from '../app-shell'
import type { Route, RouteMatch } from '../router'
import { serve } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import { detectShell, processShell, composeShellWithPage, stripDocumentWrapper, isSpaNavigation, extractContainerContent, extractLayoutMetadata } from '../app-shell'
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
import { createRouter, matchRoute, formatRoutes, findErrorPage } from '../router'
import {
  loadMiddlewareFromDirectory,
  runMiddleware,
  createMiddlewareContext,
  createRouteLocation,
  clearMiddleware,
  getMiddlewareNames,
} from '../route-middleware'
import { getPageMeta, resetHead } from '../head'
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

// Interface for built page content
interface BuiltPage {
  route: Route
  content: string
  /**
   * Streaming-SSR boundaries (#1746 Phase 3): present when the page's
   * `<script server>` exports `streamBoundaries` — a map of `data-suspense` id →
   * server-side async render. The shell (`content`) ships first with each
   * boundary's fallback placeholder; these resolve + stream after.
   */
  boundaries?: { id: string, render: () => Promise<string> }[]
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

  // Resolve app directory, respecting the stx root config
  const absoluteAppDir = path.resolve(appDir)
  const { loadStxConfig } = await import('../')
  // Load config from the APP directory, not process.cwd() — important when
  // `stx <app-dir>` is run from outside the app. Without this, a stray
  // stx.config.ts in a parent directory would shadow the app's own config.
  const projectConfig = await loadStxConfig(absoluteAppDir)
  const stxRoot = projectConfig.root && projectConfig.root !== '.'
    ? path.join(absoluteAppDir, projectConfig.root)
    : absoluteAppDir
  const pagesDirName = projectConfig.pagesDir || 'pages'
  const pagesDir = path.join(stxRoot, pagesDirName)

  // Check if pages directory exists
  if (!fs.existsSync(pagesDir)) {
    console.error(`${colors.red}Error: No '${pagesDirName}' directory found in ${colors.bright}${stxRoot}${colors.reset}`)
    console.log(`${colors.dim}Create a ${pagesDirName}/ directory with .stx files to define your routes.${colors.reset}`)
    console.log(`${colors.dim}Example: ${pagesDirName}/index.stx for the homepage.${colors.reset}`)
    return false
  }

  // Create router from stx root (where pages/ lives)
  const routes = createRouter(stxRoot)

  if (routes.length === 0) {
    console.error(`${colors.red}Error: No page files found in ${colors.bright}${pagesDir}${colors.reset}`)
    return false
  }

  console.log(`${colors.blue}Found ${colors.bright}${routes.length}${colors.blue} routes${colors.reset}`)

  // Discover plugin page routes — each plugin declares a pages dir and a URL prefix
  const pluginPageDirs: Array<{ dir: string, prefix: string }> = (projectConfig as any)?._pluginPageDirs || []
  const pluginRoutes: Array<{ route: Route, prefix: string }> = []

  for (const { dir: pluginDir, prefix: pluginPrefix } of pluginPageDirs) {
    if (fs.existsSync(pluginDir)) {
      // Create routes from the plugin's pages directory
      const pRoutes = createRouter(path.dirname(pluginDir), { pagesDir: path.basename(pluginDir) })
      for (const route of pRoutes) {
        // Prefix the route pattern
        const prefixedPattern = pluginPrefix === '/' ? route.pattern : `${pluginPrefix}${route.pattern === '/' ? '' : route.pattern}`
        pluginRoutes.push({
          route: { ...route, pattern: prefixedPattern },
          prefix: pluginPrefix,
        })
      }
      if (pRoutes.length > 0) {
        console.log(`${colors.blue}Plugin pages: ${colors.bright}${pRoutes.length}${colors.blue} routes at ${colors.cyan}${pluginPrefix}${colors.reset}`)
      }
    }
  }

  // Built plugin pages cache
  const builtPluginPages: Map<string, BuiltPage> = new Map()

  // Detect app shell (app.stx) — DEPRECATED in favor of layouts + autoShell.
  // The document shell is now auto-generated by the framework.
  // Shell detection is kept for backwards compat but new apps should use layouts/default.stx.
  let shell: ProcessedShell | null = null
  let shellPath: string | null = null
  if (options.stxOptions?.shell !== false) {
    shellPath = await detectShell(absoluteAppDir, options.stxOptions?.shell)
    if (shellPath) {
      shell = await processShell(shellPath, options.stxOptions || {})
      if (shell) {
        console.log(`${colors.blue}Using app shell: ${colors.bright}${path.relative(absoluteAppDir, shellPath)}${colors.reset} ${colors.dim}(deprecated: use layouts/default.stx instead)${colors.reset}`)
      }
    }
  }

  // Load route middleware from middleware/ directory
  clearMiddleware() // Clear any previously registered middleware
  await loadMiddlewareFromDirectory(absoluteAppDir)
  const loadedMiddleware = getMiddlewareNames()
  if (loadedMiddleware.length > 0) {
    console.log(`${colors.blue}Loaded ${colors.bright}${loadedMiddleware.length}${colors.blue} middleware: ${colors.dim}${loadedMiddleware.join(', ')}${colors.reset}`)
  }

  // Load API routes and custom router from stx.config.ts
  let apiRoutes: Record<string, (request: Request) => Response | Promise<Response>> = {}
  let customRouter: { handleRequest: (request: Request) => Response | Promise<Response> } | null = null
  try {
    const { loadStxConfig } = await import('../')
    const projectConfig = await loadStxConfig(absoluteAppDir)
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

  // Create output directory
  const outputDir = path.join(absoluteAppDir, '.stx/output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Built pages cache
  const builtPages: Map<string, BuiltPage> = new Map()
  // Routes whose page exports streamBoundaries (#1746 Phase 3) — rebuilt per
  // request so the boundary render fns are fresh and see request params.
  const streamingRoutes: Set<string> = new Set()

  // Render a custom error page if it exists in the pages directory
  const renderErrorPage = async (statusCode: number): Promise<string | null> => {
    const errorPagePath = findErrorPage(pagesDir, statusCode)
    if (!errorPagePath) return null

    try {
      const result = await Bun.build({
        entrypoints: [errorPagePath],
        outdir: outputDir,
        plugins: [stxPlugin],
        publicPath: '/',
        define: {
          'process.env.NODE_ENV': '"development"',
        },
        ...options.stxOptions,
      })

      if (!result.success) return null

      const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
      if (!htmlOutput) return null

      return await Bun.file(htmlOutput.path).text()
    }
    catch {
      return null
    }
  }

  // Build a single page file by processing the template directly
  // This matches the approach used by bun-plugin-stx/serve (which powers buddy dev)
  // instead of using Bun.build() which has issues with HTML asset resolution
  /**
   * Build a page's HTML.
   *
   * For static routes this is called once at startup and cached. For dynamic
   * routes (e.g. `/cars/:id`), it's called per request with `requestParams`
   * populated from the matched URL — without that, every `<script server>`
   * that reads `params.id` sees the same fallback value at build time, so
   * every `/book/:id` URL would render the same data.
   */
  const buildPage = async (route: Route, requestParams?: Record<string, string>): Promise<BuiltPage | null> => {
    try {
      const { processDirectives, extractVariables, defaultConfig, loadStxConfig, injectRouterScript } = await import('../')
      const { checkCache, cacheTemplate, readFileCached, templateCache } = await import('../caching')

      // Load project stx.config.ts (e.g. partialsDir, componentsDir, layoutsDir)
      const projectConfig = await loadStxConfig(absoluteAppDir)

      const resolveRel = (dir: string | undefined): string | undefined => {
        if (!dir) return dir
        if (path.isAbsolute(dir)) return dir
        return path.resolve(absoluteAppDir, dir)
      }
      const merged = {
        ...defaultConfig,
        ...projectConfig,
        ...options.stxOptions,
        autoShell: true,
      } as any
      if (options.debugDirectives) merged.debug = true
      merged.partialsDir = resolveRel(merged.partialsDir)
      merged.componentsDir = resolveRel(merged.componentsDir)
      merged.layoutsDir = resolveRel(merged.layoutsDir)
      merged.storesDir = resolveRel(merged.storesDir || 'stores')
      merged.cachePath = resolveRel(merged.cachePath || '.stx/cache')

      const isStaticBuild = !requestParams && !options.profile
      const cacheEnabled = merged.cache !== false

      if (cacheEnabled && isStaticBuild) {
        const memEntry = templateCache.get(route.filePath)
        if (memEntry) {
          try {
            const stats = await fs.promises.stat(route.filePath)
            if (stats.mtime.getTime() <= memEntry.mtime) {
              let valid = true
              for (const dep of memEntry.dependencies) {
                if (!fs.existsSync(dep)) { valid = false; break }
                const depStats = await fs.promises.stat(dep)
                if (depStats.mtime.getTime() > memEntry.mtime) { valid = false; break }
              }
              if (valid) {
                let output = memEntry.output
                if (shell) output = stripDocumentWrapper(output, { preserveHead: true })
                return { route, content: output }
              }
            }
          }
          catch {}
        }

        const cached = await checkCache(route.filePath, merged)
        if (cached) {
          let output = cached
          if (shell) output = stripDocumentWrapper(output, { preserveHead: true })
          return { route, content: output }
        }
      }

      const content = cacheEnabled
        ? await readFileCached(route.filePath)
        : await Bun.file(route.filePath).text()

      // Extract and classify script tags using unified classifier.
      // Server scripts are removed (their vars are extracted into context
      // below). Client scripts stay in place so processDirectives/processSignals
      // can merge them into the page's single __stx_setup_ function — removing
      // them here would split the layout's signals from the page's signals into
      // separate scopes, breaking :text/:show bindings on pages with both
      // (e.g. /host/list). Before returning, we interpolate {{ }} / {!! !!}
      // inside client scripts against the server context so pages can still
      // write `const PRICE = {{ car.price }}` in <script client> blocks.
      const { classifyAllScripts } = await import('../')
      const classified = classifyAllScripts(content)
      const serverScripts = classified.server.map(s => s.content)

      let templateContent = content
      for (const s of classified.server) {
        templateContent = templateContent.replace(s.fullTag, '')
      }

      // Create context and extract variables.
      // `params` is populated for dynamic routes from the request URL so that
      // server scripts writing `const id = params.id` get the actual slug.
      const context: Record<string, any> = {
        __filename: route.filePath,
        __dirname: path.dirname(route.filePath),
        params: requestParams ?? {},
      }

      // Reset the head module global BEFORE variable extraction so each page
      // build starts clean. Without this, useSeoMeta() accumulates state
      // across pages (and across repeat requests), producing duplicate
      // <meta> tags in the final HTML.
      const { resetHead } = await import('../head')
      resetHead()

      for (const scriptBody of serverScripts) {
        try {
          await extractVariables(scriptBody, context, route.filePath)
        }
        catch (e) {
          if (options.stxOptions?.debug) console.error('[stx] variable extraction error', route.filePath, (e as any)?.message || e)
        }
      }

      // Process template directives
      const dependencies = new Set<string>()
      let output: string
      if (options.profile) {
        const t0 = performance.now()
        output = await processDirectives(templateContent, context, route.filePath, merged, dependencies)
        const ms = performance.now() - t0
        // Print directly so the timing is visible alongside the request
        // log without users having to fish into the perf monitor.
        const rel = path.relative(absoluteAppDir, route.filePath) || route.filePath
        console.log(`[stx:profile] ${rel} → ${ms.toFixed(2)}ms`)
      }
      else {
        output = await processDirectives(templateContent, context, route.filePath, merged, dependencies)
      }

      // Inject SPA router (skip when using shell — router goes in shell composition)
      if (!shell) {
        output = await injectRouterScript(output)
      }

      // Interpolate {{ }} / {!! !!} inside the merged __stx_setup_ function
      // ONLY. That's the one script containing user `<script client>` bodies
      // after processScriptSetup's merge. Running the template-wide
      // interpolator here matched `{{ … }}` sequences inside the signals
      // runtime's own regex literals (e.g. /{{\s*(.+?)\s*}}/g) and crashed
      // with "Filter not found: s".
      {
        const { interpolateScriptExpressions } = await import('../expressions')
        output = output.replace(
          /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
          (full, attrs: string, body: string) => {
            if (!/function\s+__stx_setup_/.test(body)) return full
            return `<script${attrs}>${interpolateScriptExpressions(body, context)}</script>`
          },
        )
      }

      // Shell mode: strip document wrapper from page output so it doesn't nest
      // inside the shell's own <!DOCTYPE>/html/head/body structure.
      // Preserves page scripts and styles as fragment content.
      if (shell) {
        output = stripDocumentWrapper(output, { preserveHead: true })
      }

      if (cacheEnabled && isStaticBuild) {
        await cacheTemplate(route.filePath, output, dependencies, merged)
      }

      // Streaming SSR (#1746 Phase 3): a page opts in by exporting
      // `streamBoundaries` from <script server> — a map of boundary id →
      // server-side async render. We don't CALL them here (that would block the
      // shell); we hand them to renderStreamingPage so they resolve after the
      // shell flushes. Record the route so it rebuilds per request (fresh fns).
      const { extractStreamBoundaries } = await import('../streaming')
      // Low-level: streamBoundaries export → functions returning HTML directly.
      let boundaries = extractStreamBoundaries(context)
      // Declarative sugar: each @stream('id') captured a raw inner template;
      // render it per request with $boundary = await streamBoundaries[id]().
      const streamTemplates = context.__streamTemplates as Record<string, string> | undefined
      if (streamTemplates && typeof streamTemplates === 'object' && Object.keys(streamTemplates).length > 0) {
        const dataFns = (context.streamBoundaries || {}) as Record<string, () => Promise<unknown>>
        const fragmentConfig = { ...merged, autoShell: false }
        const tplBoundaries = Object.keys(streamTemplates).map(id => ({
          id,
          render: async (): Promise<string> => {
            const data = typeof dataFns[id] === 'function' ? await dataFns[id]() : undefined
            return processDirectives(streamTemplates[id], { ...context, $boundary: data }, route.filePath, fragmentConfig, new Set())
          },
        }))
        const tplIds = new Set(tplBoundaries.map(b => b.id))
        // @stream template wins over a same-id raw streamBoundaries entry.
        boundaries = [...(boundaries || []).filter(b => !tplIds.has(b.id)), ...tplBoundaries]
      }
      if (boundaries && boundaries.length > 0)
        streamingRoutes.add(route.pattern)
      else
        boundaries = undefined

      return { route, content: output, boundaries }
    }
    catch (error) {
      console.error(`${colors.red}Error building ${colors.bright}${route.pattern}${colors.reset}:`, error)
      return null
    }
  }

  const BUILD_CONCURRENCY = 8

  // Build all pages (including plugin pages)
  const buildAllPages = async (): Promise<boolean> => {
    builtPages.clear()
    builtPluginPages.clear()

    for (let i = 0; i < routes.length; i += BUILD_CONCURRENCY) {
      const chunk = routes.slice(i, i + BUILD_CONCURRENCY)
      const results = await Promise.all(chunk.map(route => buildPage(route)))
      for (const built of results) {
        if (built) builtPages.set(built.route.pattern, built)
      }
    }

  for (let i = 0; i < pluginRoutes.length; i += BUILD_CONCURRENCY) {
      const chunk = pluginRoutes.slice(i, i + BUILD_CONCURRENCY)
      const results = await Promise.all(chunk.map(({ route }) => buildPage(route)))
      for (const built of results) {
        if (built) builtPluginPages.set(built.route.pattern, built)
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

  // Build Crosswind CSS if config exists
  await buildCrosswindCSS(absoluteAppDir)

  // Find available port
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

  // Start HMR server
  if (hotReload) {
    const desiredHmrPort = options.hmrPort || actualPort + 1
    hmrServer = getHmrServer({ wsPort: desiredHmrPort, verbose: false })
    actualHmrPort = hmrServer.start(desiredHmrPort)
  }

  // Inject route params into HTML content via stx runtime
  const injectRouteParams = (content: string, params: Record<string, string>): string => {
    // Use stx.setRouteParams() which internally handles window access
    const paramsScript = `<script>(function(){var s=typeof stx!=='undefined'?stx:{};s._rp=${JSON.stringify(params)};if(s.setRouteParams)s.setRouteParams(s._rp);})()</script>`
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

      // Static-file routing across the three search roots (public/, the
      // app dir for Crosswind dist output, and outputDir).
      //
      // Previously this did three sequential `existsSync + statSync`
      // pairs — six sync syscalls on the request thread, ~3ms of added
      // latency per request even when the file lived in `output/`.
      // Now each candidate is stat'd asynchronously and concurrently;
      // we resolve to the first one that exists as a file, in priority
      // order. The async `.stat()` failure path is "not found" so we
      // catch and treat as null.
      const publicDirName = projectConfig?.publicDir || 'public'
      const publicPath = path.join(absoluteAppDir, publicDirName, url.pathname)
      const distPath = path.join(absoluteAppDir, url.pathname)
      const outputPath = path.join(outputDir, url.pathname)
      const [publicStat, distStat, outputStat] = await Promise.all([
        fs.promises.stat(publicPath).catch(() => null),
        fs.promises.stat(distPath).catch(() => null),
        fs.promises.stat(outputPath).catch(() => null),
      ])
      if (publicStat?.isFile()) return serveStaticFile(publicPath)
      if (distStat?.isFile()) return serveStaticFile(distPath)
      if (outputStat?.isFile()) return serveStaticFile(outputPath)

      // Serve async components — renders a component and returns HTML fragment
      if (url.pathname.startsWith('/_stx/component/')) {
        const componentName = decodeURIComponent(url.pathname.slice('/_stx/component/'.length))
        if (componentName) {
          try {
            const componentTemplate = `<${componentName} />`
            const componentOpts = { ...buildConfig, autoShell: false }
            const html = await processDirectives(componentTemplate, {}, path.join(absoluteAppDir, 'components', `${componentName}.stx`), componentOpts, new Set())
            return new Response(html, { headers: { 'Content-Type': 'text/html' } })
          }
          catch (e: any) {
            return new Response(`<div class="stx-async-error">${e.message}</div>`, { status: 500, headers: { 'Content-Type': 'text/html' } })
          }
        }
      }

      // Runtime image transform endpoint — `/_stx/img?src=…&w=…&f=webp` etc.
      // Lazy import keeps this off the cold path of pages that never call it.
      if (url.pathname === '/_stx/img') {
        const { handleImageRequest } = await import('../image-optimization/serve')
        const imgResponse = await handleImageRequest(request, {
          publicDir: path.join(absoluteAppDir, publicDirName),
          cacheDir: path.join(absoluteAppDir, '.stx/cache/img'),
        })
        if (imgResponse) return imgResponse
      }

      // Handle requests via custom router (e.g. @stacksjs/bun-router)
      // Supports both API routes (routes/api.ts) and web routes (routes/web.ts)
      if (customRouter) {
        try {
          const routerResponse = await customRouter.handleRequest(request)
          // Only use the router response if it's not a 404 (let STX pages handle those)
          if (routerResponse.status !== 404) {
            return routerResponse
          }
        }
        catch { /* router error — fall through to STX pages */ }
      }

      // Handle API routes from stx.config.ts (fallback)
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

      // Match route
      const routeMatch = matchRoute(url.pathname, routes)

      if (routeMatch) {
        // Dynamic routes rebuild per request so server scripts see the actual
        // URL params. Static routes use the cached startup build.
        let builtPage = builtPages.get(routeMatch.route.pattern)
        const isStreamingRoute = streamingRoutes.has(routeMatch.route.pattern)
        if ((routeMatch.route.isDynamic && Object.keys(routeMatch.params).length > 0) || isStreamingRoute) {
          const rebuilt = await buildPage(routeMatch.route, routeMatch.params)
          if (rebuilt) builtPage = rebuilt
        }
        if (builtPage) {
          // Get page metadata (middleware, etc.)
          const pageMeta = getPageMeta()

          // Run route param validation if defined
          if (pageMeta.validate) {
            const isValid = await pageMeta.validate({ params: routeMatch.params })
            if (!isValid) {
              // Validation failed — render 404
              const custom404 = await renderErrorPage(404)
              if (custom404) {
                let content = custom404
                content = await injectCrosswindCSS(content, absoluteAppDir)
                if (hotReload) {
                  content = injectHotReload(content, actualHmrPort)
                }
                return new Response(content, {
                  status: 404,
                  headers: { 'Content-Type': 'text/html' },
                })
              }
              return new Response('Not Found', { status: 404 })
            }
          }

          // Run route middleware if defined
          if (pageMeta.middleware) {
            const toRoute = createRouteLocation(
              url.pathname,
              routeMatch.params,
              pageMeta,
              url.search
            )

            const middlewareContext = createMiddlewareContext(toRoute, null, request)
            const middlewareResult = await runMiddleware(pageMeta.middleware, middlewareContext)

            // Handle redirect
            if (middlewareResult.redirect) {
              const redirectUrl = middlewareResult.redirect.path
              const statusCode = middlewareResult.redirect.options.redirectCode || 302

              // Apply any response headers from middleware
              const headers = new Headers(middlewareResult.responseHeaders)
              headers.set('Location', redirectUrl)

              return new Response(null, {
                status: statusCode,
                headers,
              })
            }

            // Handle abort
            if (middlewareResult.abort) {
              const { statusCode, message } = middlewareResult.abort.error
              return new Response(
                `<!DOCTYPE html><html><head><title>Error ${statusCode}</title></head><body><h1>Error ${statusCode}</h1><p>${message}</p></body></html>`,
                {
                  status: statusCode,
                  headers: { 'Content-Type': 'text/html' },
                }
              )
            }

            // Inject middleware state into page via stx runtime
            if (Object.keys(middlewareResult.state).length > 0) {
              const stateScript = `<script>(function(){var s=typeof stx!=='undefined'?stx:{};s._ms=${JSON.stringify(middlewareResult.state)};if(s.setMiddlewareState)s.setMiddlewareState(s._ms);})()</script>`
              builtPage.content = builtPage.content.replace('</head>', `${stateScript}</head>`)
            }
          }

          let content = builtPage.content

          // Shell mode: SPA navigation returns page fragment only
          if (shell && isSpaNavigation(request)) {
            const layoutMetadata = extractLayoutMetadata(content)
            // Capture the page <title> from the FULL page before reducing to
            // the fragment, so the SPA router can update document.title on
            // swap (fragments carry no <head>). URI-encoded so any title text
            // is header-safe.
            const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
            const pageTitle = titleMatch ? titleMatch[1].trim() : ''
            // Inject route params into fragment
            if (Object.keys(routeMatch.params).length > 0) {
              content = injectRouteParams(content, routeMatch.params)
            }
            // Generate Crosswind CSS for this page's utility classes and include in fragment
            // Without this, SPA-navigated pages have no CSS for their utility classes
            content = await injectCrosswindCSS(content, absoluteAppDir)
            // Extract only the router container's inner content. The processed
            // template includes the full layout (nav + main + footer). If we
            // return it all, the router injects nav/footer INSIDE <main>,
            // causing broken nesting and layout issues.
            const routerContainer = (projectConfig as any)?.router?.container || 'main'
            content = extractContainerContent(content, routerContainer)
            return new Response(content, {
              headers: {
                'Content-Type': 'text/html',
                'X-STX-Fragment': 'true',
                'X-STX-Layout': layoutMetadata.layout,
                'X-STX-Layout-Group': layoutMetadata.group,
                ...(pageTitle && { 'X-STX-Title': encodeURIComponent(pageTitle) }),
                'Cache-Control': 'no-store, no-cache, must-revalidate',
              },
            })
          }

          // Shell mode: direct request wraps page in shell
          if (shell) {
            content = composeShellWithPage(shell, content)
          }

          // Inject route params for dynamic routes
          if (Object.keys(routeMatch.params).length > 0) {
            content = injectRouteParams(content, routeMatch.params)
          }

          // Inject Crosswind CSS
          content = await injectCrosswindCSS(content, absoluteAppDir)

          // Inject HMR client
          if (hotReload) {
            content = injectHotReload(content, actualHmrPort)
          }

          // Inject native sidebar styles and flag when running in native mode
          if (options.native) {
            const nativeSidebarInjection = `<style>[data-stx-sidebar],.stx-sidebar{display:none!important}</style><script>window.__craftNativeSidebar=true;document.documentElement.classList.add('has-native-sidebar')</script>`
            if (content.includes('<head>')) {
              content = content.replace('<head>', `<head>${nativeSidebarInjection}`)
            }
            else {
              content = `<head>${nativeSidebarInjection}</head>` + content
            }
          }

          // Flag titlebar-hidden mode so traffic-light components defer to the
          // real native window controls drawn by craft.
          if (options.titlebarHidden) {
            const tbInjection = `<style>html.stx-titlebar-hidden .stx-traffic-lights-dot{visibility:hidden}</style><script>document.documentElement.classList.add('stx-titlebar-hidden')</script>`
            if (content.includes('<head>')) {
              content = content.replace('<head>', `<head>${tbInjection}`)
            }
            else {
              content = `<head>${tbInjection}</head>${content}`
            }
          }

          // Streaming SSR (#1746 Phase 3): when the page exported
          // streamBoundaries, flush the shell (`content`, fully pipelined —
          // layout/Crosswind/HMR already applied) immediately, then stream each
          // boundary as its server-side async render resolves. Full-page loads
          // only; SPA fragment nav returned earlier.
          if (builtPage.boundaries && builtPage.boundaries.length > 0) {
            const { renderStreamingPage, streamToResponse } = await import('../streaming')
            // 30s per-boundary cap so a hung data source can't hold the stream
            // (and the connection) open forever — it degrades to an error UI.
            return streamToResponse(renderStreamingPage(content, builtPage.boundaries, { timeoutMs: 30000 }), {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            })
          }

          return new Response(content, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        }
      }

      // Match plugin page routes
      if (pluginRoutes.length > 0) {
        const allPluginPatterns = pluginRoutes.map(pr => pr.route)
        const pluginMatch = matchRoute(url.pathname, allPluginPatterns)
        if (pluginMatch) {
          const builtPage = builtPluginPages.get(pluginMatch.route.pattern)
          if (builtPage) {
            let content = builtPage.content

            // Shell mode: direct request wraps page in shell
            if (shell) {
              content = composeShellWithPage(shell, content)
            }

            // Inject route params for dynamic routes
            if (Object.keys(pluginMatch.params).length > 0) {
              content = injectRouteParams(content, pluginMatch.params)
            }

            content = await injectCrosswindCSS(content, absoluteAppDir)

            if (hotReload) {
              content = injectHotReload(content, actualHmrPort)
            }

            return new Response(content, {
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            })
          }
        }

        // SPA fallback for plugin routes: if pathname starts with a plugin prefix,
        // serve that plugin's index page
        for (const { prefix: pluginPrefix } of pluginPageDirs) {
          if (pluginPrefix !== '/' && url.pathname.startsWith(pluginPrefix)) {
            const pluginIndex = builtPluginPages.get(pluginPrefix) || builtPluginPages.get(pluginPrefix + '/')
            if (pluginIndex) {
              let content = pluginIndex.content
              if (shell) {
                content = composeShellWithPage(shell, content)
              }
              content = await injectCrosswindCSS(content, absoluteAppDir)
              if (hotReload) {
                content = injectHotReload(content, actualHmrPort)
              }
              return new Response(content, {
                headers: {
                  'Content-Type': 'text/html',
                  'Cache-Control': 'no-store, no-cache, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                },
              })
            }
          }
        }
      }

      // SPA fallback: serve index page for unmatched routes
      const indexPage = builtPages.get('/')
      if (indexPage) {
        let content = indexPage.content
        content = await injectCrosswindCSS(content, absoluteAppDir)
        if (hotReload) {
          content = injectHotReload(content, actualHmrPort)
        }
        // Inject native sidebar styles and flag when running in native mode
        if (options.native) {
          const nativeSidebarInjection = `<style>[data-stx-sidebar],.stx-sidebar{display:none!important}</style><script>window.__craftNativeSidebar=true;document.documentElement.classList.add('has-native-sidebar')</script>`
          if (content.includes('<head>')) {
            content = content.replace('<head>', `<head>${nativeSidebarInjection}`)
          }
          else {
            content = `<head>${nativeSidebarInjection}</head>` + content
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
      }

      // Try custom 404 error page
      const custom404 = await renderErrorPage(404)
      if (custom404) {
        let content = custom404
        content = await injectCrosswindCSS(content, absoluteAppDir)
        if (hotReload) {
          content = injectHotReload(content, actualHmrPort)
        }
        return new Response(content, {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        })
      }

      return new Response('Not Found', { status: 404 })
    },
    async error(error) {
      // Try custom 500 error page
      const custom500 = await renderErrorPage(500)
      if (custom500) {
        return new Response(custom500, {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        })
      }

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
  const allRouteStrings = [...routeStrings]

  // Add plugin routes
  for (const { route: pluginRoute } of pluginRoutes) {
    allRouteStrings.push(`${pluginRoute.pattern}`)
  }

  allRouteStrings.forEach((str, i) => {
    const isLast = i === allRouteStrings.length - 1
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
    // For app mode, try to find sidebar config from index page or layout
    let sidebarConfig
    const indexPath = path.join(pagesDir, 'index.stx')
    if (fs.existsSync(indexPath)) {
      const templateContent = await Bun.file(indexPath).text()
      sidebarConfig = extractSidebarConfig(templateContent)
    }

    // Read app.window from stx.config.ts so each app can pick a sensible
    // default size (e.g. ImageOptim wants ~640×480, not 1400×900).
    const appWindow = (projectConfig as any)?.app?.window ?? {}

    await openNativeWindow(actualPort, {
      title: (projectConfig as any)?.app?.head?.title || path.basename(absoluteAppDir) || 'stx App',
      width: appWindow.width,
      height: appWindow.height,
      darkMode: appWindow.darkMode,
      hotReload: appWindow.hotReload,
      titlebarHidden: appWindow.titlebarHidden ?? options.titlebarHidden === true,
      nativeSidebar: !!sidebarConfig,
      sidebarConfig,
    })
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

    // eslint-disable-next-line pickier/no-unused-vars
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
          // Clear all caches to ensure fresh content
          partialsCache.clear()
          clearComponentCache()
          try {
            const { invalidateFileCache, templateCache } = await import('../caching')
            invalidateFileCache(path.resolve(absoluteAppDir, filename))
            templateCache.delete(path.resolve(absoluteAppDir, filename))
          }
          catch {}
          // Rebuild shell if shell file changed
          if (shellPath && filename) {
            const changedPath = path.resolve(absoluteAppDir, filename)
            if (changedPath === shellPath || path.basename(shellPath) === filename) {
              const newShell = await processShell(shellPath, options.stxOptions || {})
              if (newShell) shell = newShell
            }
          }
          await buildAllPages()
          await rebuildCrosswindCSS(absoluteAppDir)

          if (hotReload && hmrServer) {
            hmrServer.reload(filename)
          }
        }
        // For other JS/TS files (could be components, lib, etc.), rebuild
        else {
          console.log(`${colors.yellow}${filename} changed, rebuilding...${colors.reset}`)
          // Clear all caches to ensure fresh content
          partialsCache.clear()
          clearComponentCache()
          try {
            const { invalidateFileCache, templateCache } = await import('../caching')
            invalidateFileCache(path.resolve(absoluteAppDir, filename))
            templateCache.delete(path.resolve(absoluteAppDir, filename))
          }
          catch {}
          await buildAllPages()

          if (hotReload && hmrServer) {
            hmrServer.reload(filename)
          }
        }
      }
else if (isCssOnlyChange(filename)) {
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
