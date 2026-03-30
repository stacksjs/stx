/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Production Server
 *
 * Serves pre-built stx pages from the .output/ directory.
 * Static pages are served directly. Dynamic pages are hydrated at request time.
 * SPA navigation gets pre-extracted fragments.
 *
 * @module production-server
 */

import fs from 'node:fs'
import path from 'node:path'
import { serve } from 'bun'
import { loadManifest, type BuildManifest, type ManifestRoute } from './manifest'
import { hydrateTemplate, hydrateFragment } from './template-hydrator'
import type { CompiledTemplate } from './template-compiler'

/**
 * Production server configuration.
 */
export interface ProductionServerOptions {
  /** Output directory from stx build (default: '.output') */
  outputDir?: string
  /** Server port (default: 3000) */
  port?: number
  /** Custom request handler for API routes (runs before page routing) */
  onRequest?: (req: Request) => Response | Promise<Response> | null | Promise<null>
  /** Custom API routes */
  apiRoutes?: Record<string, (req: Request) => Response | Promise<Response>>
}

/**
 * MIME types for static file serving.
 */
const MIME_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
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
}

/**
 * Start the production server.
 *
 * Serves pre-built pages from .output/ with minimal per-request work:
 * - Static assets: served from disk with immutable cache headers
 * - SPA fragments: served from pre-extracted HTML files
 * - Static pages: served directly (zero processing)
 * - Dynamic pages: hydrated with request-time data
 */
export async function startProductionServer(options: ProductionServerOptions = {}): Promise<{ port: number, stop: () => void }> {
  const outputDir = path.resolve(options.outputDir || '.output')
  const port = options.port || 3000

  // Load build manifest
  const manifest = loadManifest(outputDir)
  if (!manifest) {
    console.error('[stx] No build manifest found. Run `stx build` first.')
    process.exit(1)
  }

  console.log(`[stx] Production server loading ${manifest.routes.length} routes...`)

  // Pre-load compiled templates into memory
  const compiledTemplates = new Map<string, CompiledTemplate>()
  const fragmentCache = new Map<string, string>()

  for (const route of manifest.routes) {
    try {
      const compiledPath = path.join(outputDir, route.compiledPath)
      const compiled = JSON.parse(await Bun.file(compiledPath).text()) as CompiledTemplate
      compiledTemplates.set(route.pattern, compiled)

      // Pre-load fragments
      const fragmentPath = path.join(outputDir, route.fragmentPath)
      if (await Bun.file(fragmentPath).exists()) {
        fragmentCache.set(route.pattern, await Bun.file(fragmentPath).text())
      }
    }
    catch (error) {
      console.warn(`[stx] Failed to load route ${route.pattern}:`, error)
    }
  }

  // Build route matcher (exact match + param patterns)
  const exactRoutes = new Map<string, ManifestRoute>()
  const paramRoutes: Array<{ regex: RegExp, route: ManifestRoute, paramNames: string[] }> = []

  for (const route of manifest.routes) {
    if (route.hasParams) {
      // Convert pattern like '/player/:id' to regex
      const paramNames: string[] = []
      const regexStr = route.pattern.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name)
        return '([^/]+)'
      })
      paramRoutes.push({ regex: new RegExp(`^${regexStr}$`), route, paramNames })
    }
    else {
      exactRoutes.set(route.pattern, route)
    }
  }

  // Start server
  const server = serve({
    port,
    async fetch(request) {
      const url = new URL(request.url)
      const pathname = url.pathname

      // ── Custom API routes ──
      if (options.onRequest) {
        const response = await options.onRequest(request)
        if (response) return response
      }
      if (options.apiRoutes?.[pathname]) {
        return options.apiRoutes[pathname](request)
      }

      // ── Static assets from public/ ──
      const publicPath = path.join(outputDir, 'public', pathname)
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        const ext = path.extname(pathname)
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'

        // Fingerprinted assets get immutable cache headers
        const isFingerprinted = pathname.startsWith('/__stx/') || /\.[0-9a-f]{8}\./.test(pathname)

        return new Response(Bun.file(publicPath), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': isFingerprinted
              ? 'public, max-age=31536000, immutable'
              : 'public, max-age=3600',
          },
        })
      }

      // ── Route matching ──
      const isSpaNav = request.headers.get('X-STX-Router') === 'true'
      let matchedRoute: ManifestRoute | null = null
      let params: Record<string, string> = {}

      // Try exact match first
      matchedRoute = exactRoutes.get(pathname) || null

      // Try param routes
      if (!matchedRoute) {
        for (const { regex, route, paramNames } of paramRoutes) {
          const match = pathname.match(regex)
          if (match) {
            matchedRoute = route
            paramNames.forEach((name, i) => {
              params[name] = match[i + 1]
            })
            break
          }
        }
      }

      if (!matchedRoute) {
        // Try 404 error page first, then return plain 404
        const errorPage = exactRoutes.get('/404') || null
        if (errorPage) {
          const compiled = compiledTemplates.get(errorPage.compiledPath)
          if (compiled) {
            return new Response(compiled.html, {
              status: 404,
              headers: { 'Content-Type': 'text/html' },
            })
          }
        }
        return new Response('Not Found', { status: 404 })
      }

      // ── SPA fragment response ──
      if (isSpaNav) {
        const fragment = fragmentCache.get(matchedRoute.pattern)
        if (fragment) {
          return new Response(fragment, {
            headers: {
              'Content-Type': 'text/html',
              'X-STX-Fragment': 'true',
              'Cache-Control': 'no-cache',
            },
          })
        }
      }

      // ── Full page response ──
      const compiled = compiledTemplates.get(matchedRoute.pattern)
      if (!compiled) {
        return new Response('Internal Server Error', { status: 500 })
      }

      // Static page — serve pre-rendered HTML directly (zero processing)
      if (!compiled.hasServerScripts && Object.keys(compiled.placeholders).length === 0) {
        return new Response(compiled.html, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=60',
          },
        })
      }

      // Dynamic page — hydrate with request context
      try {
        const html = await hydrateTemplate(compiled, { params, request })
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
          },
        })
      }
      catch (error) {
        console.error(`[stx] Hydration error for ${pathname}:`, error)
        // Fallback to pre-rendered HTML
        return new Response(compiled.html, {
          headers: { 'Content-Type': 'text/html' },
        })
      }
    },
  })

  console.log(`[stx] Production server running at http://localhost:${port}`)
  console.log(`[stx] Serving ${manifest.routes.length} routes (${compiledTemplates.size} pre-loaded)`)

  return { port, stop: () => server.stop() }
}
