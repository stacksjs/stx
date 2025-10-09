/**
 * Programmatic server API for serving stx templates and markdown files
 * Designed to be used by documentation systems like BunPress
 */

import type { Server } from 'bun'
import type { StxOptions } from './types'
import { serve as bunServe } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import { readMarkdownFile } from './assets'
import { processDirectives } from './process'
import { extractVariables } from './utils'

export interface ServeOptions {
  /** Server port */
  port?: number
  /** Root directory to serve from */
  root?: string
  /** stx processing options */
  stxOptions?: StxOptions
  /** Enable file watching and hot reload */
  watch?: boolean
  /** Custom request handler */
  onRequest?: (request: Request) => Response | Promise<Response> | null | undefined
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
  server: Server
  stop: () => void
  url: string
}

/**
 * Serve a directory of stx templates and markdown files
 * This is the main function for programmatic usage
 */
export async function serve(options: ServeOptions = {}): Promise<ServeResult> {
  const {
    port = 3000,
    root = '.',
    stxOptions = {},
    watch = true,
    onRequest,
    routes = {},
    middleware = [],
    on404,
    onError,
  } = options

  const rootDir = path.resolve(root)

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

    // Read and process file
    const content = await Bun.file(filePath).text()

    // Extract script and template sections
    const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
    const scriptContent = scriptMatch ? scriptMatch[1] : ''
    const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

    // Create context
    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: path.dirname(filePath),
    }

    // Extract variables from script
    await extractVariables(scriptContent, context, filePath)

    // Process template
    const dependencies = new Set<string>()
    const output = await processDirectives(templateContent, context, filePath, stxOptions, dependencies)

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
      catch (error: any) {
        if (onError) {
          return await onError(error, request)
        }

        return new Response(
          `<h1>Error</h1><pre>${error.message}\n${error.stack}</pre>`,
          {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
          },
        )
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
    fetch: handleRequest,
  })

  // Setup file watching
  let watcher: fs.FSWatcher | null = null
  if (watch) {
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

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`)
  }

  const isMarkdown = absolutePath.endsWith('.md')
  const isStx = absolutePath.endsWith('.stx')

  if (!isMarkdown && !isStx) {
    throw new Error(`Unsupported file type: ${absolutePath}. Only .stx and .md files are supported.`)
  }

  // Serve the file by creating a route for it
  return await serve({
    ...options,
    root: path.dirname(absolutePath),
    routes: {
      '/': async () => {
        let content: string

        if (isMarkdown) {
          const { content: md } = await readMarkdownFile(absolutePath, options.stxOptions)
          content = md
        }
        else {
          const fileContent = await Bun.file(absolutePath).text()
          const scriptMatch = fileContent.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
          const scriptContent = scriptMatch ? scriptMatch[1] : ''
          const templateContent = fileContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

          const context: Record<string, any> = {}
          await extractVariables(scriptContent, context, absolutePath)

          const dependencies = new Set<string>()
          content = await processDirectives(templateContent, context, absolutePath, options.stxOptions || {}, dependencies)
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
) {
  return handler
}

/**
 * Helper to create a route handler
 */
export function createRoute(handler: (request: Request) => Response | Promise<Response>) {
  return handler
}
