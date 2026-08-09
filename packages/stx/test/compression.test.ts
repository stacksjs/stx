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
