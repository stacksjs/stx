// @ts-nocheck - Skip type checking due to error type constraints
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

    // Evict stale entries for this file path (different mtime)
    for (const key of fileCache.keys()) {
      if (key.startsWith(`${filePath}:`) && key !== cacheKey) {
        fileCache.delete(key)
      }
    }

    // Read and process file
    let content = await Bun.file(filePath).text()

    // SFC Support: Extract <template> content if present
    // Only match <template> WITHOUT an id attribute - templates with id are HTML template elements
    // that should be preserved (used for client-side JS template cloning)
    // Uses balanced depth tracking to handle nested <template> tags
    let workingContent = content
    const templateOpenMatch = content.match(/<template\b(?![^>]*\bid\s*=)[^>]*>/i)
    if (templateOpenMatch && templateOpenMatch.index !== undefined) {
      const contentStart = templateOpenMatch.index + templateOpenMatch[0].length
      let depth = 1
      let pos = contentStart
      while (pos < content.length && depth > 0) {
        const openIdx = content.indexOf('<template', pos)
        const closeIdx = content.indexOf('</template>', pos)
        if (closeIdx === -1) break
        if (openIdx !== -1 && openIdx < closeIdx) {
          depth++
          pos = openIdx + '<template'.length
        }
        else {
          depth--
          if (depth === 0) {
            workingContent = content.substring(contentStart, closeIdx).trim()
            break
          }
          pos = closeIdx + '</template>'.length
        }
      }
    }

    // Extract all script tags and categorize them from the PAGE content
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
    const clientScripts: string[] = []
    const serverScripts: string[] = []
    let scriptMatch: RegExpExecArray | null

    while ((scriptMatch = scriptRegex.exec(content)) !== null) {
      const attrs = scriptMatch[1]
      const scriptContent = scriptMatch[2]
      const fullScript = scriptMatch[0]

      // Check if it's a client-only script
      const isClientScript = attrs.includes('client') || attrs.includes('type="module"') || attrs.includes('src=')

      if (isClientScript) {
        clientScripts.push(fullScript)
      } else {
        // Server script - extract variables but don't output
        serverScripts.push(scriptContent)
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

    // Add client scripts before </body>
    if (clientScripts.length > 0) {
      const scriptsHtml = clientScripts.join('\n')
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
          // Extract ALL script contents (not just the first) using global regex
          const scriptContents: string[] = []
          const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
          let scriptM: RegExpExecArray | null
          while ((scriptM = scriptRe.exec(fileContent)) !== null) {
            scriptContents.push(scriptM[1])
          }
          const scriptContent = scriptContents.join('\n')
          const templateContent = fileContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

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
): (request: Request, next: () => Response | Promise<Response>) => Response | Promise<Response> {
  return handler
}

/**
 * Helper to create a route handler
 */
export function createRoute(handler: (request: Request) => Response | Promise<Response>): (request: Request) => Response | Promise<Response> {
  return handler
}
