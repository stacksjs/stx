// @ts-nocheck - Skip type checking due to error type constraints
/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Programmatic server API for serving stx templates and markdown files
 * Designed to be used by documentation systems like BunPress
 */

import type { Server } from 'bun'
import type { StxOptions } from './types'
import { serve as bunServe } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import { findSfcTemplateBlock } from './sfc-template'
import { readMarkdownFile } from './assets'
import { processDirectives } from './process'
import { extractVariables } from './utils'
import { compressResponse } from './compression'

export interface ServeOptions {
  /** Server port */
  port?: number
  /** Root directory to serve from */
  root?: string
  /**
   * Directory to load `stx.config.ts` from. Defaults to `process.cwd()`.
   *
   * Deliberately separate from `root`: `root` is the directory of templates
   * being served, which is usually a subdirectory of the project (`docs/`,
   * `src/views/`), while the config sits at the project root. `loadStxConfig`
   * does not search parent directories — that is by design, so a stray config
   * above a project cannot shadow it — so the two have to be named separately.
   */
  configDir?: string
  /** stx processing options. Merged over the loaded config; these win. */
  stxOptions?: StxOptions
  /** Enable file watching and hot reload */
  watch?: boolean
  /**
   * Custom request handler. Return a Response to short-circuit the default
   * pipeline; return `null` / `undefined` (sync or async) to fall through to
   * the rest of the routing chain.
   *
   * The async-fall-through shape (`Promise<Response | null | undefined>`) is
   * intentional — it makes `handleImageRequest` and other chainable handlers
   * plug in directly without a wrapper:
   *
   *   serve({ onRequest: (req) => handleImageRequest(req, options) })
   */
  onRequest?: (request: Request) =>
    | Response
    | null
    | undefined
    | Promise<Response | null | undefined>
  /** Custom route handlers */
  routes?: Record<string, (request: Request) => Response | Promise<Response>>
  /** Middleware functions */
  middleware?: Array<(request: Request, next: () => Response | Promise<Response>) => Response | Promise<Response>>
  /** 404 handler */
  on404?: (request: Request) => Response | Promise<Response>
  /** Error handler */
  onError?: (error: Error, request: Request) => Response | Promise<Response>
}

export interface ServeResult {
  server: Server<any>
  stop: () => void
  url: string
}

/**
 * Create an HTML response helper
 */
export function htmlResponse(html: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...headers,
    },
  })
}

/**
 * The stx options a server actually runs with: the project's own config, with
 * any explicitly-passed `stxOptions` layered on top.
 *
 * Both entry points need this and neither had it. `serve()` ran on a bare
 * `{}`, so `plugins` never loaded and every library tag failed to resolve
 * against a search path naming only the built-in directories — the same
 * project rendered differently depending on whether the dev server or
 * `serve()` started it. `serveFile()` delegates to `serve()` but rendered its
 * one route through the raw options, so it would have kept the old behaviour
 * even after `serve()` was fixed.
 *
 * The config is read from `configDir` (default: the process's own directory)
 * rather than from `root`, because `root` is normally a subdirectory of the
 * project and `loadStxConfig` deliberately does not search parent directories.
 */
async function resolveStxOptions(options: ServeOptions): Promise<StxOptions> {
  const { loadStxConfig } = await import('./config')
  // A project without a config is an ordinary case, not a failure — fall back
  // to the caller's options alone rather than refusing to start.
  const projectConfig = await loadStxConfig(options.configDir ?? process.cwd())
    .catch(() => ({} as StxOptions))
  return { ...projectConfig, ...(options.stxOptions ?? {}) }
}

/**
 * Serve a directory of stx templates and markdown files
 * This is the main function for programmatic usage
 */
export async function serve(options: ServeOptions = {}): Promise<ServeResult> {
  const {
    port = 3000,
    root = '.',
    watch = true,
    onRequest,
    routes = {},
    middleware = [],
    on404,
    onError,
  } = options

  const rootDir = path.resolve(root)

  // The project's own stx.config.ts. Without this, `serve()` ran on an empty
  // options object: `plugins` never loaded, so `_pluginComponentDirs` was
  // unset and every library tag — `<Sidebar>`, `<Button>` — failed to resolve
  // with a "searched paths" list that named only the two built-in directories.
  // The dev server has always loaded it (see dev-server/serve-app.ts); the
  // programmatic entry point silently did not, so the same project rendered
  // differently depending on which one started it.
  //
  const stxOptions = await resolveStxOptions(options)

  // Cache for processed files
  const fileCache = new Map<string, { content: string, mtime: number }>()

  /**
   * Process a stx file
   */
  async function processStxFile(filePath: string): Promise<string> {
    const stats = fs.statSync(filePath)
    const cacheKey = `${filePath}:${stats.mtimeMs}`

    // Check cache
    const cached = fileCache.get(cacheKey)
    if (cached) {
      return cached.content
    }

    // Evict stale entries for this file path (different mtime)
    for (const key of fileCache.keys()) {
      if (key.startsWith(`${filePath}:`) && key !== cacheKey) {
        fileCache.delete(key)
      }
    }

    // Read and process file
    let content = await Bun.file(filePath).text()

    // SFC Support: extract the explicit wrapper, preserving runtime templates.
    let workingContent = content
    const templateBlock = findSfcTemplateBlock(content)
    if (templateBlock)
      workingContent = templateBlock.content.trim()

    // Extract all script tags and categorize them from the PAGE content
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
    const clientScripts: string[] = []
    const serverScripts: string[] = []
    let scriptMatch: RegExpExecArray | null

    while ((scriptMatch = scriptRegex.exec(content)) !== null) {
      const attrs = scriptMatch[1]
      const scriptContent = scriptMatch[2]
      const fullScript = scriptMatch[0]

      // Only <script server> runs on the server — bare <script> and <script client> are client-side
      const isServerScript = attrs.includes('server')

      if (isServerScript) {
        serverScripts.push(scriptContent)
      }
      else {
        clientScripts.push(fullScript)
      }
    }

    // Extract <style> tags to preserve them
    const styleMatches = content.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []

    // Remove script and style tags from template content
    let templateContent = workingContent
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

    // Create context
    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: path.dirname(filePath),
    }

    // Extract variables from server-side script content
    for (const scriptContent of serverScripts) {
      await extractVariables(scriptContent, context, filePath)
    }

    // Process template
    const dependencies = new Set<string>()
    const processedTemplate = await processDirectives(templateContent, context, filePath, stxOptions, dependencies)

    // Build final output
    let output = processedTemplate

    // Add styles to <head> if present
    if (styleMatches.length > 0) {
      const stylesHtml = styleMatches.join('\n')
      const headEndMatch = output.match(/(<\/head>)/i)
      if (headEndMatch) {
        output = output.replace(/(<\/head>)/i, `${stylesHtml}\n$1`)
      }
    }

    // Add client scripts before </body> — interpolating {{ }} / {!! !!} in each
    // script body so server data can be spliced into client code without manual
    // data-island plumbing. See interpolateScriptsInTemplate() for the rules.
    if (clientScripts.length > 0) {
      const { interpolateScriptsInTemplate } = await import('./expressions')
      const scriptsHtml = interpolateScriptsInTemplate(clientScripts.join('\n'), context)
      const bodyEndMatch = output.match(/(<\/body>)/i)
      if (bodyEndMatch) {
        output = output.replace(/(<\/body>)/i, `${scriptsHtml}\n$1`)
      }
      else {
        // If no </body> tag, append scripts at the end
        output += `\n${scriptsHtml}`
      }
    }

    // Cache result
    fileCache.set(cacheKey, { content: output, mtime: stats.mtimeMs })

    return output
  }

  /**
   * Process a markdown file
   */
  async function processMarkdownFile(filePath: string): Promise<string> {
    const stats = fs.statSync(filePath)
    const cacheKey = `${filePath}:${stats.mtimeMs}`

    // Check cache
    const cached = fileCache.get(cacheKey)
    if (cached) {
      return cached.content
    }

    // Read and process markdown
    const { content } = await readMarkdownFile(filePath, stxOptions)

    // Cache result
    fileCache.set(cacheKey, { content, mtime: stats.mtimeMs })

    return content
  }

  /**
   * Resolve a request path to a file
   */
  function resolveRequestPath(pathname: string): string | null {
    // Remove leading slash
    const relPath = pathname.startsWith('/') ? pathname.slice(1) : pathname

    // Try different file extensions and paths
    const possiblePaths = [
      relPath,
      `${relPath}.stx`,
      `${relPath}.md`,
      `${relPath}.html`,
      path.join(relPath, 'index.stx'),
      path.join(relPath, 'index.md'),
      path.join(relPath, 'index.html'),
    ]

    for (const possiblePath of possiblePaths) {
      const fullPath = path.join(rootDir, possiblePath)
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return fullPath
      }
    }

    return null
  }

  /**
   * Handle a request
   */
  async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Apply middleware
    let next = async (): Promise<Response> => {
      // Check custom routes first
      if (routes[url.pathname]) {
        return await routes[url.pathname](request)
      }

      // Check custom request handler
      if (onRequest) {
        const customResponse = await onRequest(request)
        if (customResponse) {
          return customResponse
        }
      }

      // Resolve file path
      const filePath = resolveRequestPath(url.pathname)

      if (!filePath) {
        // 404
        if (on404) {
          return await on404(request)
        }
        return new Response('Not Found', { status: 404 })
      }

      try {
        let content: string
        let contentType = 'text/html'

        // Determine file type and process accordingly
        if (filePath.endsWith('.stx')) {
          content = await processStxFile(filePath)
        }
        else if (filePath.endsWith('.md')) {
          content = await processMarkdownFile(filePath)
        }
        else if (filePath.endsWith('.html')) {
          content = await Bun.file(filePath).text()
        }
        else if (filePath.endsWith('.css')) {
          content = await Bun.file(filePath).text()
          contentType = 'text/css'
        }
        else if (filePath.endsWith('.js')) {
          content = await Bun.file(filePath).text()
          contentType = 'text/javascript'
        }
        else if (filePath.endsWith('.json')) {
          content = await Bun.file(filePath).text()
          contentType = 'application/json'
        }
        else {
          // Serve as binary file
          return new Response(Bun.file(filePath))
        }

        return new Response(content, {
          headers: { 'Content-Type': contentType },
        })
      }
      catch (error: unknown) {
        if (onError) {
          return await onError(error, request)
        }

        const msg = error instanceof Error ? error.message : String(error)
        // Only include stack traces in debug mode to avoid information disclosure
        const isDebug = stxOptions?.debug === true
        const body = isDebug
          ? `<h1>Error</h1><pre>${msg}\n${error instanceof Error ? error.stack : ''}</pre>`
          : `<h1>Internal Server Error</h1><p>An error occurred while processing your request.</p>`
        return new Response(body, {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        })
      }
    }

    // Apply middleware in reverse order
    for (let i = middleware.length - 1; i >= 0; i--) {
      const mw = middleware[i]
      const currentNext = next
      next = async () => await mw(request, currentNext)
    }

    return await next()
  }

  // Start server
  const server = bunServe({
    port,
    // Compression at the boundary, so it covers every route, the 404 and the
    // error page alike. See src/compression.ts.
    fetch: async (request: Request) => compressResponse(request, await handleRequest(request)),
  })

  // Setup file watching
  let watcher: fs.FSWatcher | null = null
  if (watch) {
    // eslint-disable-next-line pickier/no-unused-vars
    watcher = fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.stx') || filename.endsWith('.md') || filename.endsWith('.html'))) {
        // Clear cache for changed file
        fileCache.clear()
      }
    })
  }

  // Return server control object
  return {
    server,
    url: server.url.toString(),
    stop() {
      if (watcher) {
        watcher.close()
      }
      server.stop()
    },
  }
}

/**
 * Serve a single stx or markdown file
 */
export async function serveFile(
  filePath: string,
  options: Omit<ServeOptions, 'root'> = {},
): Promise<ServeResult> {
  const absolutePath = path.resolve(filePath)

  if (!await Bun.file(absolutePath).exists()) {
    throw new Error(`File not found: ${absolutePath}`)
  }

  const isMarkdown = absolutePath.endsWith('.md')
  const isStx = absolutePath.endsWith('.stx')

  if (!isMarkdown && !isStx) {
    throw new Error(`Unsupported file type: ${absolutePath}. Only .stx and .md files are supported.`)
  }

  // Resolved here as well as inside `serve()`, because this route closure
  // renders the file itself rather than going through the directory pipeline.
  // `loadStxConfig` caches per directory, so this is a map lookup.
  const stxOptions = await resolveStxOptions(options)

  // Serve the file by creating a route for it
  return await serve({
    ...options,
    root: path.dirname(absolutePath),
    routes: {
      '/': async () => {
        let content: string

        if (isMarkdown) {
          const { content: md } = await readMarkdownFile(absolutePath, stxOptions)
          content = md
        }
        else {
          const fileContent = await Bun.file(absolutePath).text()
          // Extract only <script server> contents for variable extraction
          const serverScriptContents: string[] = []
          const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
          let scriptM: RegExpExecArray | null
          while ((scriptM = scriptRe.exec(fileContent)) !== null) {
            if (scriptM[1].includes('server')) {
              serverScriptContents.push(scriptM[2])
            }
          }
          const scriptContent = serverScriptContents.join('\n')
          const templateContent = fileContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

          const context: Record<string, any> = {}
          if (scriptContent.trim()) {
            await extractVariables(scriptContent, context, absolutePath)
          }

          const dependencies = new Set<string>()
          content = await processDirectives(templateContent, context, absolutePath, stxOptions, dependencies)
        }

        return new Response(content, {
          headers: { 'Content-Type': 'text/html' },
        })
      },
      ...options.routes,
    },
  })
}

/**
 * Create a middleware function
 */
export function createMiddleware(
  handler: (request: Request, next: () => Response | Promise<Response>) => Response | Promise<Response>,
): (request: Request, next: () => Response | Promise<Response>) => Response | Promise<Response> {
  return handler
}

/**
 * Helper to create a route handler
 */
export function createRoute(handler: (request: Request) => Response | Promise<Response>): (request: Request) => Response | Promise<Response> {
  return handler
}
