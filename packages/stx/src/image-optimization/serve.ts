/**
 * Runtime Image Transform Endpoint
 *
 * IPX-equivalent: a single `/_stx/img?src=…&w=…&h=…&f=…&q=…&fit=…` route
 * that on-demand resizes / re-encodes a source image (resolved inside
 * `publicDir`) and returns the bytes with long cache headers.
 *
 *   <img src="/_stx/img?src=/images/hero.jpg&w=800&f=webp&q=80">
 *
 * Why "runtime" matters: lets templates link plain `/images/hero.jpg`
 * and let the consumer (or a `<source>` srcset generator) request the
 * optimized variant lazily. Avoids pre-generating every possible
 * width × format combo at build time.
 *
 * Caching is content-addressed: the output path is keyed by
 * sha256(src bytes + transform params), so the same URL always returns
 * the same bytes and the response is safe to mark `immutable`.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { type ImageFormat, getMimeType } from './processor'

// ============================================================================
// Public types
// ============================================================================

export interface ImageServeOptions {
  /** Filesystem root for resolving src URLs. Required. */
  publicDir: string
  /** Disk cache directory for transformed images. Default: `.stx/cache/img`. */
  cacheDir?: string
  /** Maximum allowed output width. Requests beyond this clamp to it. */
  maxWidth?: number
  /** Maximum allowed output height. */
  maxHeight?: number
  /** Default quality when the request doesn't specify one. */
  defaultQuality?: number
  /** Default fit mode when not specified. */
  defaultFit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  /** URL pathname this handler responds to. Default: `/_stx/img`. */
  routePath?: string
}

// ============================================================================
// Constants
// ============================================================================

const VALID_FORMATS = new Set<ImageFormat>(['webp', 'avif', 'jpeg', 'png'])
const VALID_FITS = new Set(['cover', 'contain', 'fill', 'inside', 'outside'])
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])

// Default caps. Anything wider/taller than 4096 is almost always wasteful
// and provides an easy DoS vector if left uncapped.
const DEFAULT_MAX_DIMENSION = 4096
const DEFAULT_QUALITY = 80
const DEFAULT_FIT = 'cover' as const

// ============================================================================
// Handler
// ============================================================================

/**
 * Probe the request URL and return a Response if it matches the image
 * route, or `null` if the caller should keep trying other handlers.
 *
 * Designed to be a drop-in inside any Bun/fetch-style server:
 *
 *   const imgResponse = await handleImageRequest(request, { publicDir })
 *   if (imgResponse) return imgResponse
 *   // …other routes
 */
export async function handleImageRequest(
  request: Request,
  options: ImageServeOptions,
): Promise<Response | null> {
  const routePath = options.routePath ?? '/_stx/img'
  const url = new URL(request.url)
  if (url.pathname !== routePath) return null

  const parsed = parseRequest(url, options)
  if (!parsed.ok) {
    return new Response(parsed.error, { status: parsed.status, headers: { 'Content-Type': 'text/plain' } })
  }

  const { srcFsPath, srcUrl, width, height, format, quality, fit } = parsed

  // Cache key combines the source-file hash with the transform params, so
  // any change to the source content OR any parameter forces a new entry
  // and the URL remains content-addressable.
  let srcStat: fs.Stats
  try {
    srcStat = fs.statSync(srcFsPath)
  }
  catch {
    return new Response(`Source image not found: ${srcUrl}`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  if (!srcStat.isFile()) {
    return new Response('Not a file', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }

  const cacheDir = options.cacheDir ?? '.stx/cache/img'
  await fs.promises.mkdir(cacheDir, { recursive: true })

  // Hash inputs: source-file content fingerprint (mtime + size — cheap and
  // stable; full-content hash would re-read the file on every request),
  // transform params, output format.
  const fingerprint = `${srcFsPath}:${srcStat.mtimeMs}:${srcStat.size}`
  const paramKey = `${width}x${height}:${format}:${quality}:${fit}`
  const cacheKey = crypto.createHash('sha256').update(`${fingerprint}|${paramKey}`).digest('hex').slice(0, 16)
  const cachePath = path.join(cacheDir, `${cacheKey}.${format}`)

  const mime = getMimeType(format)
  const headers = {
    'Content-Type': mime,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': `"${cacheKey}"`,
    'X-Stx-Image-Cache': 'HIT',
  }

  // Conditional GET: if client already has this ETag, short-circuit.
  if (request.headers.get('if-none-match') === `"${cacheKey}"`) {
    return new Response(null, { status: 304, headers })
  }

  const cached = Bun.file(cachePath)
  if (await cached.exists()) {
    return new Response(cached, { headers })
  }

  // Cache miss — generate.
  try {
    const sourceBuffer = Buffer.from(await Bun.file(srcFsPath).arrayBuffer())
    const { resizeAndConvert } = await loadResize()
    const outputBuffer = await resizeAndConvert(sourceBuffer, { width, height, format, quality, fit })
    await Bun.write(cachePath, outputBuffer)
    headers['X-Stx-Image-Cache'] = 'MISS'
    return new Response(new Uint8Array(outputBuffer), { headers })
  }
  catch (err) {
    const msg = (err as Error).message
    return new Response(`Image processing failed: ${msg}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

// ============================================================================
// Self-contained handler factory
// ============================================================================

/**
 * Wrap {@link handleImageRequest} into a self-contained route handler.
 *
 * Most router slots type their handlers as `(req: Request) => Promise<Response>`
 * — they don't accept `null` inside the Promise the way the chainable
 * `handleImageRequest` returns it. Use this factory when plugging into a
 * router slot of that shape:
 *
 *   const handler = createImageHandler({ publicDir: 'public' })
 *   router.get('/_stx/img', handler)
 *
 * When the request URL doesn't match the configured route path, the
 * returned handler responds with `404 Not Found`. Use the lower-level
 * `handleImageRequest` directly if you want to chain to a fallback.
 */
export function createImageHandler(
  options: ImageServeOptions,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const response = await handleImageRequest(request, options)
    return response ?? new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

// ============================================================================
// Parsing & validation
// ============================================================================

type ParseResult =
  | {
    ok: true
    srcFsPath: string
    srcUrl: string
    width: number
    height: number
    format: ImageFormat
    quality: number
    fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  }
  | { ok: false, error: string, status: number }

function parseRequest(url: URL, options: ImageServeOptions): ParseResult {
  const srcUrl = url.searchParams.get('src')
  if (!srcUrl) return { ok: false, error: 'Missing required param: src', status: 400 }
  if (!srcUrl.startsWith('/')) {
    return { ok: false, error: 'src must be an absolute URL path (start with /)', status: 400 }
  }
  if (srcUrl.startsWith('//')) {
    // Protocol-relative — could be hijacked to remote URLs in lenient parsers.
    return { ok: false, error: 'src must be a local path', status: 400 }
  }

  const srcExt = path.extname(srcUrl).toLowerCase()
  if (!SOURCE_EXTS.has(srcExt)) {
    return { ok: false, error: `Unsupported source extension: ${srcExt}`, status: 400 }
  }

  // Resolve and verify the file is inside publicDir. path.resolve normalizes
  // `../` traversal; we then assert the resolved path is still a descendant
  // of publicDir before any FS work happens.
  const publicDir = path.resolve(options.publicDir)
  const candidate = path.resolve(publicDir, srcUrl.slice(1))
  if (!candidate.startsWith(`${publicDir}${path.sep}`) && candidate !== publicDir) {
    return { ok: false, error: 'src is outside publicDir', status: 400 }
  }

  const maxWidth = options.maxWidth ?? DEFAULT_MAX_DIMENSION
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_DIMENSION

  const widthParam = url.searchParams.get('w')
  const heightParam = url.searchParams.get('h')
  const width = widthParam ? Number.parseInt(widthParam, 10) : 0
  const height = heightParam ? Number.parseInt(heightParam, 10) : 0
  if (widthParam && (!Number.isFinite(width) || width <= 0)) {
    return { ok: false, error: 'Invalid w (must be positive integer)', status: 400 }
  }
  if (heightParam && (!Number.isFinite(height) || height <= 0)) {
    return { ok: false, error: 'Invalid h (must be positive integer)', status: 400 }
  }
  if (!widthParam && !heightParam) {
    return { ok: false, error: 'At least one of w or h is required', status: 400 }
  }

  const clampedWidth = Math.min(width || maxWidth, maxWidth)
  const clampedHeight = Math.min(height || maxHeight, maxHeight)

  // Format: default to webp (best size/quality ratio). Falls back to the
  // source extension if explicitly requested (e.g. f=jpeg).
  const formatParam = url.searchParams.get('f') || 'webp'
  if (!VALID_FORMATS.has(formatParam as ImageFormat)) {
    return { ok: false, error: `Invalid f (must be one of: ${[...VALID_FORMATS].join(', ')})`, status: 400 }
  }
  const format = formatParam as ImageFormat

  const qualityParam = url.searchParams.get('q')
  const quality = qualityParam ? Number.parseInt(qualityParam, 10) : (options.defaultQuality ?? DEFAULT_QUALITY)
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
    return { ok: false, error: 'Invalid q (must be 1-100)', status: 400 }
  }

  const fitParam = url.searchParams.get('fit') || options.defaultFit || DEFAULT_FIT
  if (!VALID_FITS.has(fitParam)) {
    return { ok: false, error: `Invalid fit (must be one of: ${[...VALID_FITS].join(', ')})`, status: 400 }
  }
  const fit = fitParam as 'cover' | 'contain' | 'fill' | 'inside' | 'outside'

  return {
    ok: true,
    srcFsPath: candidate,
    srcUrl,
    width: clampedWidth,
    height: clampedHeight,
    format,
    quality,
    fit,
  }
}

// Lazy load of the resize helper to avoid pulling the full processor into
// callers that just want the handler.
async function loadResize(): Promise<{
  resizeAndConvert: (
    buffer: Buffer,
    options: { width: number, height: number, format: ImageFormat, quality: number, fit: string },
  ) => Promise<Buffer>
}> {
  return await import('./processor')
}
