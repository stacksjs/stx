/**
 * Compress text responses on the way out.
 *
 * Nothing in stx did. Every page, stylesheet, script and JSON payload it has
 * ever served went out uncompressed, in development and in production alike,
 * which is a factor of ten or more on the wire for exactly the content type
 * that compresses best. A dispensary menu of six hundred products measured
 * 1.25 MB as HTML and 89 KB brotli'd — the page was not too big, it was
 * unsqueezed.
 *
 * Quality 5, not the default 11. On that same page q11 reached 78 KB and took
 * 1.4 seconds of CPU to do it; q5 gives 89 KB in 8.5 ms. Per-request
 * compression is a latency budget, not an archive, and 11 KB is not worth a
 * second and a half of a core.
 */

import zlib from 'node:zlib'

/**
 * Content types worth compressing.
 *
 * Matched by prefix so parameters (`; charset=utf-8`) do not have to be
 * enumerated. Everything absent is either already compressed — images, video,
 * fonts, archives — or so small that the header costs more than the saving.
 * Compressing a PNG again reliably makes it bigger.
 */
const COMPRESSIBLE = [
  'text/',
  'application/json',
  'application/javascript',
  'application/xml',
  'application/xhtml+xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/manifest+json',
  'image/svg+xml',
]

/**
 * Text types that must never be buffered.
 *
 * Compressing means reading the whole body first, and these do not have a
 * whole body: an event stream stays open for the life of the page, so awaiting
 * it waits forever and the request never completes. Hot reload is delivered
 * over exactly this content type, so getting it wrong hangs every dev server
 * on its first page load.
 */
const NEVER_BUFFER = [
  'text/event-stream',
  'multipart/x-mixed-replace',
]

/**
 * Below this, compression is not worth it.
 *
 * A single TCP segment is about 1.4 KB, so anything under it arrives in one
 * packet either way and the only effect of compressing is CPU plus a header.
 * Small payloads also routinely come out *larger* — gzip's own framing is
 * around 20 bytes.
 */
const MIN_BYTES = 1024

export interface CompressionOptions {
  /** Skip payloads smaller than this. Defaults to 1 KB. */
  threshold?: number
  /** Brotli quality, 0–11. Defaults to 5. */
  quality?: number
}

/** Whether this content type is worth compressing. */
export function isCompressible(contentType: string | null): boolean {
  if (!contentType)
    return false

  const type = contentType.toLowerCase()

  if (NEVER_BUFFER.some(prefix => type.startsWith(prefix)))
    return false

  return COMPRESSIBLE.some(prefix => type.startsWith(prefix))
}

/**
 * The best encoding both sides support, or `null` for none.
 *
 * Deliberately ignores the q-values in `Accept-Encoding`. Honouring them means
 * parsing a header that is, in practice, one of about four fixed strings every
 * real browser sends, all of which accept both encodings; the only clients
 * that weight them are testing tools.
 */
export function negotiateEncoding(acceptEncoding: string | null): 'br' | 'gzip' | null {
  if (!acceptEncoding)
    return null

  const accepted = acceptEncoding.toLowerCase()

  // Brotli first: ~20% smaller than gzip on HTML at a comparable cost, and
  // every browser that does not support it predates 2017.
  if (accepted.includes('br'))
    return 'br'

  if (accepted.includes('gzip'))
    return 'gzip'

  return null
}

/**
 * Return `response` compressed, or unchanged when it should not be.
 *
 * Never throws and never drops a body: a failed compress logs nothing and
 * returns the original, because shipping bytes uncompressed is a slower
 * success and a broken compress step is an outage.
 */
export async function compressResponse(
  request: Request,
  response: Response,
  options: CompressionOptions = {},
): Promise<Response> {
  // Someone upstream already encoded it; re-encoding would corrupt it.
  if (response.headers.get('content-encoding'))
    return response

  // 204 and 304 carry no body, and a body on either is a protocol error.
  if (response.status === 204 || response.status === 304 || !response.body)
    return response

  if (!isCompressible(response.headers.get('content-type')))
    return response

  const encoding = negotiateEncoding(request.headers.get('accept-encoding'))
  if (!encoding)
    return response

  try {
    const body = Buffer.from(await response.clone().arrayBuffer())

    if (body.length < (options.threshold ?? MIN_BYTES))
      return response

    const compressed = encoding === 'br'
      ? zlib.brotliCompressSync(body, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: options.quality ?? 5,
            // Lets brotli size its window to the input instead of assuming a
            // large one, which is free and helps small payloads.
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: body.length,
          },
        })
      : zlib.gzipSync(body)

    // Rare, but real for already-dense payloads. Sending the larger of the two
    // would be a strict loss.
    if (compressed.length >= body.length)
      return response

    const headers = new Headers(response.headers)
    headers.set('Content-Encoding', encoding)
    headers.set('Content-Length', String(compressed.length))
    // Without this a shared cache can hand a brotli body to a client that
    // asked for none, which is unreadable rather than merely slow.
    headers.append('Vary', 'Accept-Encoding')

    return new Response(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
  catch {
    return response
  }
}
