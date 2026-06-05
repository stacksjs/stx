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
import { hydrateTemplateStream, hydrateFragment } from './template-hydrator'
import type { CompiledTemplate } from './template-compiler'
import { extractLayoutMetadata, type LayoutMetadata } from './app-shell'

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
 * MIME types for static file serving. Matches the dev server's
 * `staticContentTypes` map in `bun-plugin/src/serve.ts`. Add new entries
 * to both places (or extract to a shared module if this happens often).
 */
const MIME_TYPES: Record<string, string> = {
  // Code
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  // Markup / docs
  '.html': 'text/html',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  // Audio / video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
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
  const layoutMetadataCache = new Map<string, LayoutMetadata>()

  for (const route of manifest.routes) {
    try {
      const compiledPath = path.join(outputDir, route.compiledPath)
      const compiled = JSON.parse(await Bun.file(compiledPath).text()) as CompiledTemplate
      compiledTemplates.set(route.pattern, compiled)
      layoutMetadataCache.set(route.pattern, extractLayoutMetadata(compiled.html))

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
      // Mounted at the URL root: .output/public/images/hero.jpg → /images/hero.jpg
      // Includes path traversal protection, URI decoding, directory skipping,
      // and fingerprinted-asset cache hints. Matches the dev server handler
      // in bun-plugin/src/serve.ts.
      if ((request.method === 'GET' || request.method === 'HEAD') && pathname !== '/') {
        const publicRoot = path.resolve(outputDir, 'public')

        // Decode URI components and reject embedded NULs
        let safePathname: string
        try {
          safePathname = decodeURIComponent(pathname)
        }
        catch {
          safePathname = pathname
        }

        if (!safePathname.includes('\0')) {
          // Resolve and verify the result stays inside publicRoot. path.resolve
          // normalizes .. segments before the prefix check, which is the
          // standard defense against directory traversal.
          const resolvedPath = path.resolve(publicRoot, `.${safePathname}`)
          const isInsidePublicRoot = resolvedPath === publicRoot
            || resolvedPath.startsWith(`${publicRoot}${path.sep}`)

          if (isInsidePublicRoot) {
            try {
              if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
                const ext = path.extname(resolvedPath).toLowerCase()
                const contentType = MIME_TYPES[ext] || 'application/octet-stream'

                // Fingerprinted assets get immutable cache headers
                const isFingerprinted = pathname.startsWith('/__stx/') || /\.[0-9a-f]{8}\./.test(pathname)

                return new Response(Bun.file(resolvedPath), {
                  headers: {
                    'Content-Type': contentType,
                    'Cache-Control': isFingerprinted
                      ? 'public, max-age=31536000, immutable'
                      : 'public, max-age=3600',
                  },
                })
              }
            }
            catch {
              // File read failed — fall through
            }
          }
        }
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
        // Try 404 error page first, then return plain 404. Note:
        // compiledTemplates is keyed by `route.pattern` (see the loader
        // at line ~105), so the lookup must use `errorPage.pattern`, NOT
        // `errorPage.compiledPath` — that was a pre-existing bug noticed
        // while wiring in the parallel /500 lookup for stacksjs/stx#1722.
        // It silently broke the entire 404.stx feature in production.
        const errorPage = exactRoutes.get('/404') || null
        if (errorPage) {
          const compiled = compiledTemplates.get(errorPage.pattern)
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
          const layoutMetadata = layoutMetadataCache.get(matchedRoute.pattern)
          return new Response(fragment, {
            headers: {
              'Content-Type': 'text/html',
              'X-STX-Fragment': 'true',
              ...(layoutMetadata
                ? {
                    'X-STX-Layout': layoutMetadata.layout,
                    'X-STX-Layout-Group': layoutMetadata.group,
                  }
                : {}),
              'Cache-Control': 'no-cache',
            },
          })
        }
      }

      // ── Full page response ──
      const compiled = compiledTemplates.get(matchedRoute.pattern)
      if (!compiled) {
        // Try the user's 500 error page first (mirrors the /404 lookup at
        // line ~229). Before stacksjs/stx#1722 this always returned a
        // bare "Internal Server Error" text response, so apps that ship
        // a branded `pages/500.stx` got an unbranded error in production.
        const errorPage = exactRoutes.get('/500') || null
        if (errorPage) {
          // Key by pattern (see the 404 path above and the loader at line ~105).
          const compiledError = compiledTemplates.get(errorPage.pattern)
          if (compiledError) {
            return new Response(compiledError.html, {
              status: 500,
              headers: { 'Content-Type': 'text/html' },
            })
          }
        }
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
        const { html, boundaries } = await hydrateTemplateStream(compiled, { params, request })
        // Streaming SSR (#1746): a page that exported streamBoundaries streams
        // its shell first, then each boundary as its server-side data resolves.
        if (boundaries && boundaries.length > 0) {
          const { renderStreamingPage, streamToResponse } = await import('./streaming')
          return streamToResponse(renderStreamingPage(html, boundaries, { timeoutMs: 30000 }), {
            headers: { 'Cache-Control': 'no-cache' },
          })
        }
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
