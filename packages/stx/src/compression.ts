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
import { promisify } from 'node:util'

/*
 * The async variants, not the `…Sync` ones.
 *
 * Bun runs JavaScript on one thread, so a synchronous compress does not cost
 * the request that pays for it — it costs every request behind it. Measured on
 * 1.19 MB of page HTML: `brotliCompressSync` blocks the loop for 13.3 ms,
 * `brotliCompress` for 0.9 ms, at the same wall-clock for a single request.
 * Eight concurrent pages take 110 ms sequentially and 36 ms through the
 * threadpool, because zlib's async path releases the thread while it works.
 *
 * The sync call is the version that reads faster and behaves worse under
 * exactly the load this feature exists for.
 */
const brotliCompress = promisify(zlib.brotliCompress)
const gzipCompress = promisify(zlib.gzip)

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
 * Parse `Accept-Encoding` into coding -> quality.
 *
 * Only the q-values matter here, and only really one of them: `q=0` is not a
 * preference, it is a refusal. RFC 9110 spells it "not acceptable".
 */
function parseAcceptEncoding(header: string): Map<string, number> {
  const weights = new Map<string, number>()

  for (const part of header.split(',')) {
    const [rawName, ...params] = part.trim().split(';')
    const name = rawName.trim().toLowerCase()
    if (!name)
      continue

    let quality = 1
    for (const param of params) {
      const match = /^\s*q\s*=\s*([\d.]+)\s*$/i.exec(param)
      if (!match)
        continue
      const parsed = Number.parseFloat(match[1])
      if (Number.isFinite(parsed))
        quality = parsed
    }

    weights.set(name, quality)
  }

  return weights
}

/**
 * The best encoding both sides support, or `null` for none.
 *
 * This used to be `accepted.includes('br')` on the raw header, on the argument
 * that q-values are only ever sent by testing tools. The substring is the
 * problem: `br;q=0` contains `br`, and it is the one string in the header that
 * means *do not send me brotli*. Answering that with a brotli body is not a
 * missed optimisation, it is a response the client cannot read — the failure
 * this function's `Vary` sibling exists to prevent, arrived at from the other
 * direction.
 *
 * Brotli is still preferred when both are genuinely on offer: ~20% smaller
 * than gzip on HTML at comparable cost, and every browser without it predates
 * 2017.
 */
export function negotiateEncoding(acceptEncoding: string | null): 'br' | 'gzip' | null {
  if (!acceptEncoding)
    return null

  const weights = parseAcceptEncoding(acceptEncoding)
  // `*` stands in for anything not named — including a `*;q=0` that refuses
  // everything the client did not explicitly allow.
  const wildcard = weights.get('*')
  const quality = (coding: string): number => weights.get(coding) ?? wildcard ?? 0

  if (quality('br') > 0)
    return 'br'

  if (quality('gzip') > 0)
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

  // `Uint8Array<ArrayBuffer>`, not `Buffer`: the DOM lib's `BodyInit` does not
  // accept a Node Buffer, and zlib is happy with either.
  let body: Uint8Array<ArrayBuffer>
  try {
    // Read once, not `clone().arrayBuffer()`. Cloning tees the stream, so the
    // branch nobody reads is buffered too and a 1.25 MB page costs 2.5 MB of
    // resident memory to compress.
    body = new Uint8Array(await response.arrayBuffer())
  }
  catch {
    // Nothing was successfully read, so the original is still the best answer.
    return response
  }

  /*
   * The body is consumed from here on, so every remaining exit has to rebuild
   * a response rather than return the original — handing back a Response whose
   * body has already been read yields an empty one, which is the silent
   * truncation this module is otherwise trying to avoid.
   *
   * `Vary` goes on the uncompressed answer too. The same URL is compressed for
   * the next client, so the representation genuinely does vary by
   * `Accept-Encoding` whether or not this particular reply was squeezed.
   */
  const passthrough = (): Response => new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: varyByAcceptEncoding(response.headers),
  })

  if (body.length < (options.threshold ?? MIN_BYTES))
    return passthrough()

  try {
    const compressed = encoding === 'br'
      ? await brotliCompress(body, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: options.quality ?? 5,
            // Lets brotli size its window to the input instead of assuming a
            // large one, which is free and helps small payloads.
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: body.length,
          },
        })
      : await gzipCompress(body)

    // Rare, but real for already-dense payloads. Sending the larger of the two
    // would be a strict loss.
    if (compressed.length >= body.length)
      return passthrough()

    const headers = varyByAcceptEncoding(response.headers)
    headers.set('Content-Encoding', encoding)
    headers.set('Content-Length', String(compressed.length))

    return new Response(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
  catch {
    return passthrough()
  }
}

/**
 * A copy of `headers` that declares `Accept-Encoding` as a cache key.
 *
 * Without it a shared cache can hand a brotli body to a client that asked for
 * none, which is unreadable rather than merely slow. Appended only when it is
 * not already listed, because `Vary: Accept-Encoding, Accept-Encoding` is
 * legal, pointless, and confusing to read in a response.
 */
function varyByAcceptEncoding(source: Headers): Headers {
  const headers = new Headers(source)
  const existing = headers.get('Vary')

  if (!existing) {
    headers.set('Vary', 'Accept-Encoding')
    return headers
  }

  const listed = existing.split(',').some(field => field.trim().toLowerCase() === 'accept-encoding')
  if (!listed)
    headers.set('Vary', `${existing}, Accept-Encoding`)

  return headers
}
