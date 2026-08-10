/**
 * Compressing responses on the way out.
 *
 * stx served everything uncompressed — every page, stylesheet, script and JSON
 * payload, in development and production alike — which is an order of
 * magnitude on the wire for precisely the content that compresses best. A
 * six-hundred-product menu measured 1.25 MB as HTML and 89 KB brotli'd.
 *
 * The cases below are the ones where compressing is the wrong answer, because
 * those are the ones that corrupt a response rather than merely fail to
 * shrink it.
 */

import { describe, expect, test } from 'bun:test'
import { compressResponse, isCompressible, negotiateEncoding } from '../src/compression'

const BIG = '<p>the quick brown fox jumps over the lazy dog</p>'.repeat(200)

const html = (body = BIG) => new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
const asking = (accept: string) => new Request('https://example.test/', { headers: { 'Accept-Encoding': accept } })

describe('negotiateEncoding', () => {
  test('prefers brotli when both are on offer', () => {
    expect(negotiateEncoding('gzip, deflate, br, zstd')).toBe('br')
  })

  test('falls back to gzip', () => {
    expect(negotiateEncoding('gzip, deflate')).toBe('gzip')
  })

  test('returns nothing when the client asks for nothing it can read', () => {
    expect(negotiateEncoding(null)).toBeNull()
    expect(negotiateEncoding('identity')).toBeNull()
  })

  test('honours q=0 as the refusal it is', () => {
    /*
     * The bug this replaced: the check was `header.includes('br')`, and the one
     * string in the header that means "do not send me brotli" contains `br`.
     * Answering an explicit refusal with a brotli body is not a missed
     * optimisation — it is a response the client cannot decode.
     */
    expect(negotiateEncoding('br;q=0, gzip')).toBe('gzip')
    expect(negotiateEncoding('gzip;q=0, br')).toBe('br')
    expect(negotiateEncoding('br;q=0, gzip;q=0')).toBeNull()
    expect(negotiateEncoding('br; q=0.0, gzip')).toBe('gzip')
  })

  test('reads the wildcard, in both directions', () => {
    expect(negotiateEncoding('*')).toBe('br')
    // The shape a client uses to say "only what I named": identity, nothing else.
    expect(negotiateEncoding('identity;q=1, *;q=0')).toBeNull()
    // An explicit coding outranks the wildcard that would have excluded it.
    expect(negotiateEncoding('gzip, *;q=0')).toBe('gzip')
  })

  test('is not fooled by a coding that merely contains a known name', () => {
    expect(negotiateEncoding('identity, deflate')).toBeNull()
  })
})

describe('isCompressible', () => {
  test('accepts text and the text-shaped application types', () => {
    expect(isCompressible('text/html; charset=utf-8')).toBe(true)
    expect(isCompressible('application/json')).toBe(true)
    expect(isCompressible('image/svg+xml')).toBe(true)
  })

  test('refuses formats that are already compressed', () => {
    // Deflating a PNG again reliably makes it bigger and costs CPU to do it.
    expect(isCompressible('image/png')).toBe(false)
    expect(isCompressible('video/mp4')).toBe(false)
    expect(isCompressible('font/woff2')).toBe(false)
    expect(isCompressible(null)).toBe(false)
  })
})

describe('compressResponse', () => {
  test('compresses a page, and it round-trips', async () => {
    const out = await compressResponse(asking('br'), html())

    expect(out.headers.get('Content-Encoding')).toBe('br')

    // The bytes have to actually decode. A wrong header on a correct body and
    // a right header on a mangled body look identical from the outside.
    const raw = Buffer.from(await out.arrayBuffer())
    const zlib = await import('node:zlib')

    expect(zlib.brotliDecompressSync(raw).toString()).toBe(BIG)
    expect(raw.length).toBeLessThan(BIG.length / 4)
  })

  test('uses gzip for a client that cannot read brotli', async () => {
    const out = await compressResponse(asking('gzip'), html())
    const zlib = await import('node:zlib')

    expect(out.headers.get('Content-Encoding')).toBe('gzip')
    expect(zlib.gunzipSync(Buffer.from(await out.arrayBuffer())).toString()).toBe(BIG)
  })

  test('marks the response as varying by encoding', async () => {
    /*
     * Without this a shared cache can serve a brotli body to a client that
     * asked for none — not slow, unreadable.
     */
    const out = await compressResponse(asking('br'), html())

    expect(out.headers.get('Vary')).toContain('Accept-Encoding')
  })

  test('leaves the body alone when the client asked for no encoding', async () => {
    const out = await compressResponse(new Request('https://example.test/'), html())

    expect(out.headers.get('Content-Encoding')).toBeNull()
    expect(await out.text()).toBe(BIG)
  })

  test('does not re-encode something already encoded', async () => {
    // Double-encoding produces a body no client can read.
    const already = new Response('x'.repeat(5000), {
      headers: { 'Content-Type': 'text/html', 'Content-Encoding': 'gzip' },
    })

    expect((await compressResponse(asking('br'), already)).headers.get('Content-Encoding')).toBe('gzip')
  })

  test('skips a payload too small to be worth it', async () => {
    // Under a packet either way, and gzip framing alone is ~20 bytes.
    const out = await compressResponse(asking('br'), html('<p>hi</p>'))

    expect(out.headers.get('Content-Encoding')).toBeNull()
  })

  test('leaves a binary response untouched', async () => {
    const png = new Response(new Uint8Array(4096), { headers: { 'Content-Type': 'image/png' } })

    expect((await compressResponse(asking('br'), png)).headers.get('Content-Encoding')).toBeNull()
  })

  test('leaves a bodiless response untouched', async () => {
    // A body on a 304 is a protocol error, so there is nothing to compress.
    const notModified = new Response(null, { status: 304, headers: { 'Content-Type': 'text/html' } })

    expect((await compressResponse(asking('br'), notModified)).status).toBe(304)
  })

  test('preserves status and headers', async () => {
    const missing = new Response(BIG, {
      status: 404,
      headers: { 'Content-Type': 'text/html', 'X-Custom': 'kept' },
    })
    const out = await compressResponse(asking('br'), missing)

    expect(out.status).toBe(404)
    expect(out.headers.get('X-Custom')).toBe('kept')
  })

  test('reports the compressed length, not the original', async () => {
    // A Content-Length describing the uncompressed body truncates the response.
    const out = await compressResponse(asking('br'), html())
    const actual = (await out.arrayBuffer()).byteLength

    expect(Number(out.headers.get('Content-Length'))).toBe(actual)
  })
})

describe('the body survives every exit (#compression)', () => {
  /*
   * Reading the body without cloning it is what makes compression affordable —
   * a tee buffers the branch nobody reads, so a 1.25 MB page costs 2.5 MB to
   * compress. The cost of that choice is that the original Response is spent,
   * and returning a spent Response yields an EMPTY one. Every path below is an
   * exit taken after the read.
   */
  test('a payload under the threshold still arrives intact', async () => {
    const small = '<p>short</p>'
    const out = await compressResponse(asking('br'), html(small))

    expect(out.headers.get('Content-Encoding')).toBeNull()
    expect(await out.text()).toBe(small)
  })

  test('an incompressible payload still arrives intact', async () => {
    // Random bytes: brotli cannot beat the original, so the larger of the two
    // is discarded — and the body has to come back whole, not empty.
    let seed = 7
    const noise = new Uint8Array(4096).map(() => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return (seed >>> 16) & 0xFF
    })

    const out = await compressResponse(
      asking('br'),
      new Response(noise, { headers: { 'Content-Type': 'text/html' } }),
    )

    expect(out.headers.get('Content-Encoding')).toBeNull()
    expect(new Uint8Array(await out.arrayBuffer())).toEqual(noise)
  })

  test('preserves status and headers on the uncompressed path too', async () => {
    const missing = new Response('<p>gone</p>', {
      status: 404,
      headers: { 'Content-Type': 'text/html', 'X-Custom': 'kept' },
    })
    const out = await compressResponse(asking('br'), missing)

    expect(out.status).toBe(404)
    expect(out.headers.get('X-Custom')).toBe('kept')
    expect(await out.text()).toBe('<p>gone</p>')
  })
})

describe('Vary is a cache key, and it is stated once', () => {
  test('is set even when the answer was not compressed', async () => {
    /*
     * The same URL IS compressed for the next client, so the representation
     * varies by Accept-Encoding whether or not this reply was squeezed. A cache
     * that stored the small variant without this would key it for everybody.
     */
    const out = await compressResponse(asking('br'), html('<p>short</p>'))

    expect(out.headers.get('Vary')).toBe('Accept-Encoding')
  })

  test('does not repeat a field the response already declared', async () => {
    const varying = new Response(BIG, {
      headers: { 'Content-Type': 'text/html', 'Vary': 'Accept-Encoding' },
    })
    const out = await compressResponse(asking('br'), varying)

    expect(out.headers.get('Vary')).toBe('Accept-Encoding')
  })

  test('keeps the fields that were already there', async () => {
    const varying = new Response(BIG, {
      headers: { 'Content-Type': 'text/html', 'Vary': 'Accept-Language' },
    })
    const out = await compressResponse(asking('br'), varying)

    expect(out.headers.get('Vary')).toBe('Accept-Language, Accept-Encoding')
  })
})

describe('compression never blocks the loop it serves from', () => {
  test('uses no synchronous zlib call in the response path', async () => {
    /*
     * Pinned by inspection because the difference is invisible to a functional
     * assertion: `brotliCompressSync` and `brotliCompress` return the same
     * bytes at the same wall-clock for ONE request. The difference only shows
     * under concurrency, where Bun's single JS thread makes every queued
     * request wait out the compress in front of it. Measured on 1.19 MB of
     * page HTML: 13.3 ms of blocked loop against 0.9 ms, and eight concurrent
     * pages at 110 ms against 36 ms.
     *
     * A timing assertion for this is the kind that goes flaky on a loaded
     * machine and gets muted, so this names the rule instead.
     */
    const source = await Bun.file(new URL('../src/compression.ts', import.meta.url)).text()
    const syncCalls = source.match(/zlib\.\w+Sync\b/g) ?? []

    expect(syncCalls).toEqual([])
  })
})

describe('streaming responses', () => {
  test('never touches an event stream', async () => {
    /*
     * `text/event-stream` matches the `text/` prefix, and compressing means
     * buffering the whole body — which an event stream does not have. Awaiting
     * one waits for the life of the page. Hot reload is delivered over this
     * content type, so the mistake hangs every dev server on first load.
     */
    const stream = new Response(
      new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: hi\n\n')) } }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    )

    const out = await compressResponse(asking('br'), stream)

    expect(out.headers.get('Content-Encoding')).toBeNull()
    expect(out).toBe(stream)
  })

  test('isCompressible says no to it directly', () => {
    expect(isCompressible('text/event-stream')).toBe(false)
    expect(isCompressible('multipart/x-mixed-replace; boundary=x')).toBe(false)
  })
})
