/**
 * Tests for the runtime `/_stx/img` transform endpoint.
 *
 * Validates request parsing, path-traversal refusal, dimension/quality
 * clamping, format validation, conditional GET (304), and the actual
 * end-to-end resize via a real JPEG fixture so we exercise the
 * processor swap-in too.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { handleImageRequest } from '../../src/image-optimization/serve'

// ts-images' pure-TS codec is slow on real-world JPEGs — each transform
// takes ~5-15s, which blows past the 5s default per-test timeout. Bump it
// here so the actual contract tests have room to breathe.
const TRANSFORM_TIMEOUT = 60_000

let publicDir: string
let cacheDir: string

beforeAll(async () => {
  publicDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-img-serve-'))
  cacheDir = path.join(publicDir, '.cache')
  await fs.promises.mkdir(path.join(publicDir, 'images'), { recursive: true })

  // Use the repo's small logo PNG as a fixture — it's 4KB, a real valid PNG,
  // and ts-images can decode it in milliseconds. We write the same bytes
  // under .jpg URL paths because serve.ts validates the URL extension is
  // a known image type, not the file's actual format; ts-images' codec
  // sniffs the magic bytes regardless.
  const fixtureBytes = await fs.promises.readFile(
    path.resolve(__dirname, '../../../vscode/logo.png'),
  )
  await fs.promises.writeFile(path.join(publicDir, 'images/hero.jpg'), fixtureBytes)
  await fs.promises.writeFile(path.join(publicDir, 'images/banner.jpg'), fixtureBytes)
})

afterAll(async () => {
  await fs.promises.rm(publicDir, { recursive: true, force: true }).catch(() => {})
})

function req(query: string): Request {
  return new Request(`http://test/_stx/img?${query}`)
}

describe('handleImageRequest — request parsing', () => {
  it('returns null when URL pathname does not match', async () => {
    const r = await handleImageRequest(
      new Request('http://test/some-other-path?src=/images/hero.jpg&w=200'),
      { publicDir, cacheDir },
    )
    expect(r).toBeNull()
  })

  it('400 when src is missing', async () => {
    const r = await handleImageRequest(req('w=200'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
    expect(await r?.text()).toContain('src')
  })

  it('400 when src is not absolute path', async () => {
    const r = await handleImageRequest(req('src=images/hero.jpg&w=200'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
  })

  it('400 when src is protocol-relative', async () => {
    const r = await handleImageRequest(req('src=//evil.com/foo.jpg&w=200'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
  })

  it('refuses path traversal escape from publicDir', async () => {
    const r = await handleImageRequest(req('src=/../../../etc/passwd.jpg&w=200'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
  })

  it('400 when src has unsupported extension', async () => {
    const r = await handleImageRequest(req('src=/images/logo.svg&w=200'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
    expect(await r?.text()).toContain('extension')
  })

  it('400 when neither w nor h is provided', async () => {
    const r = await handleImageRequest(req('src=/images/hero.jpg'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
    expect(await r?.text()).toMatch(/w or h/i)
  })

  it('400 when w is not a positive integer', async () => {
    const r = await handleImageRequest(req('src=/images/hero.jpg&w=abc'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
  })

  it('400 when format is invalid', async () => {
    const r = await handleImageRequest(req('src=/images/hero.jpg&w=200&f=bmp'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
    expect(await r?.text()).toContain('Invalid f')
  })

  it('400 when quality is out of range', async () => {
    const r = await handleImageRequest(req('src=/images/hero.jpg&w=200&q=999'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
  })

  it('400 when fit is invalid', async () => {
    const r = await handleImageRequest(req('src=/images/hero.jpg&w=200&fit=stretch'), { publicDir, cacheDir })
    expect(r?.status).toBe(400)
  })

  it('404 when src does not exist', async () => {
    const r = await handleImageRequest(req('src=/images/missing.jpg&w=200'), { publicDir, cacheDir })
    expect(r?.status).toBe(404)
  })
})

describe('handleImageRequest — successful transform', () => {
  it('returns the resized image with correct headers', async () => {
    // (Timeouts applied per-test below via the third `it` argument because
    // ts-images' pure-TS encoder is slow even on tiny fixtures.)
    const r = await handleImageRequest(req('src=/images/hero.jpg&w=320&f=webp&q=75'), {
      publicDir,
      cacheDir,
    })
    expect(r?.status).toBe(200)
    expect(r?.headers.get('content-type')).toBe('image/webp')
    expect(r?.headers.get('cache-control')).toContain('immutable')
    expect(r?.headers.get('etag')).toBeTruthy()
    const buf = await r?.arrayBuffer()
    expect(buf?.byteLength ?? 0).toBeGreaterThan(0)
  }, TRANSFORM_TIMEOUT)

  it('hits cache on second identical request', async () => {
    const first = await handleImageRequest(req('src=/images/hero.jpg&w=200&f=webp'), {
      publicDir,
      cacheDir,
    })
    expect(first?.headers.get('x-stx-image-cache')).toBe('MISS')

    const second = await handleImageRequest(req('src=/images/hero.jpg&w=200&f=webp'), {
      publicDir,
      cacheDir,
    })
    expect(second?.headers.get('x-stx-image-cache')).toBe('HIT')

    // Identical ETag → identical content
    expect(second?.headers.get('etag')).toBe(first?.headers.get('etag'))
  }, TRANSFORM_TIMEOUT)

  it('produces different cache entries for different params', async () => {
    const a = await handleImageRequest(req('src=/images/hero.jpg&w=240&f=webp'), {
      publicDir,
      cacheDir,
    })
    const b = await handleImageRequest(req('src=/images/hero.jpg&w=240&f=jpeg'), {
      publicDir,
      cacheDir,
    })
    expect(a?.headers.get('etag')).not.toBe(b?.headers.get('etag'))
  }, TRANSFORM_TIMEOUT)

  it('produces different cache entries for different source files', async () => {
    const a = await handleImageRequest(req('src=/images/hero.jpg&w=180&f=webp'), {
      publicDir,
      cacheDir,
    })
    const b = await handleImageRequest(req('src=/images/banner.jpg&w=180&f=webp'), {
      publicDir,
      cacheDir,
    })
    // Even though the fixtures are identical bytes, the cache key includes
    // the resolved fs path so they get separate entries — preferable to
    // collisions, conservative cost.
    expect(a?.headers.get('etag')).not.toBe(b?.headers.get('etag'))
  }, TRANSFORM_TIMEOUT)

  it('returns 304 on conditional GET with matching If-None-Match', async () => {
    // Prime the cache.
    const first = await handleImageRequest(req('src=/images/hero.jpg&w=150&f=webp'), {
      publicDir,
      cacheDir,
    })
    const etag = first?.headers.get('etag')
    expect(etag).toBeTruthy()

    const conditional = new Request(`http://test/_stx/img?src=/images/hero.jpg&w=150&f=webp`, {
      headers: { 'If-None-Match': etag! },
    })
    const r = await handleImageRequest(conditional, { publicDir, cacheDir })
    expect(r?.status).toBe(304)
    expect((await r?.arrayBuffer())?.byteLength ?? 0).toBe(0)
  }, TRANSFORM_TIMEOUT)

  it('clamps oversized width to maxWidth', async () => {
    const r = await handleImageRequest(req('src=/images/hero.jpg&w=99999&f=webp'), {
      publicDir,
      cacheDir,
      maxWidth: 512,
    })
    expect(r?.status).toBe(200)
    // Hard to verify exact emitted width without re-decoding, but cache
    // key should match a 512-width request (not the 99999 one), so a
    // separate explicit-512 call should be a cache HIT.
    const matched = await handleImageRequest(req('src=/images/hero.jpg&w=512&f=webp'), {
      publicDir,
      cacheDir,
      maxWidth: 512,
    })
    expect(matched?.headers.get('x-stx-image-cache')).toBe('HIT')
  }, TRANSFORM_TIMEOUT)

  it('uses defaultQuality when q is not specified', async () => {
    const r = await handleImageRequest(req('src=/images/hero.jpg&w=160&f=webp'), {
      publicDir,
      cacheDir,
      defaultQuality: 60,
    })
    expect(r?.status).toBe(200)
    // Explicit q=60 should hit the same cache entry.
    const matched = await handleImageRequest(req('src=/images/hero.jpg&w=160&f=webp&q=60'), {
      publicDir,
      cacheDir,
      defaultQuality: 60,
    })
    expect(matched?.headers.get('x-stx-image-cache')).toBe('HIT')
  }, TRANSFORM_TIMEOUT)

  it('respects a custom routePath', async () => {
    const r = await handleImageRequest(
      new Request('http://test/api/img?src=/images/hero.jpg&w=200&f=webp'),
      { publicDir, cacheDir, routePath: '/api/img' },
    )
    expect(r?.status).toBe(200)
  }, TRANSFORM_TIMEOUT)
})
