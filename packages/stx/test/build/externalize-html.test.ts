/**
 * The pure half of the externalizer, used by SSR (stacksjs/stx#1865, #1878).
 *
 * The static build inlines the runtime once per page; a server inlines it once
 * per *request*, which is the same waste in a worse form — no page count bounds
 * it and no browser can cache across a reload. A post-pass over a directory
 * cannot help there because there are no files, so the rewrite is a pure
 * function both paths share.
 */
import { describe, expect, it } from 'bun:test'
import { EXTERNALIZED_ASSET_DIR, externalizeHtml } from '../../src/build-externalize'

const RUNTIME_BODY = 'var stx = 1; /* a very large runtime */'
const RUNTIME = `<script data-stx-scoped data-stx-runtime>${RUNTIME_BODY}</script>`
const ROUTER = '<script data-stx-router>var router = 1;</script>'
const CSS = '<style data-crosswind="generated">.a{color:red}</style>'

describe('externalizing one document', () => {
  it('replaces the inline runtime with a src reference', () => {
    const { html, assets } = externalizeHtml(`<body>${RUNTIME}</body>`)

    expect(html).not.toContain(RUNTIME_BODY)
    expect(html).toContain(`src="/${EXTERNALIZED_ASSET_DIR}/${assets[0].filename}"`)
    expect(assets[0].contents).toBe(RUNTIME_BODY)
  })

  it('names assets by content, so the same runtime is the same file', () => {
    // This is what lets a server cache one asset for every page and every
    // request, rather than one per render.
    const a = externalizeHtml(`<body>${RUNTIME}</body>`)
    const b = externalizeHtml(`<body><p>different page</p>${RUNTIME}</body>`)

    expect(a.assets[0].filename).toBe(b.assets[0].filename)
    expect(a.assets[0].filename).toMatch(/^runtime\.[0-9a-f]+\.js$/)
  })

  it('gives a different name to different content', () => {
    const a = externalizeHtml('<script data-stx-runtime>var a = 1</script>')
    const b = externalizeHtml('<script data-stx-runtime>var b = 2</script>')

    expect(a.assets[0].filename).not.toBe(b.assets[0].filename)
  })

  it('carries a content type, so a server need not re-derive one', () => {
    const { assets } = externalizeHtml(`${RUNTIME}${CSS}`)

    expect(assets.find(a => a.filename.startsWith('runtime'))!.contentType).toContain('javascript')
    expect(assets.find(a => a.filename.startsWith('crosswind'))!.contentType).toContain('css')
  })

  it('handles runtime, router and stylesheet in one pass', () => {
    const { html, assets } = externalizeHtml(`<head>${CSS}</head><body>${RUNTIME}${ROUTER}</body>`)

    expect(assets).toHaveLength(3)
    expect(html).toContain('rel="stylesheet"')
    expect(html).not.toContain('<style data-crosswind')
    expect(html).not.toContain('var router = 1;')
  })

  it('reports the bytes it took out', () => {
    const { bytesInlined } = externalizeHtml(`<body>${RUNTIME}</body>`)

    expect(bytesInlined).toBe(RUNTIME_BODY.length)
  })

  it('dedupes a blob that appears twice in one document', () => {
    const { assets } = externalizeHtml(`${RUNTIME}${RUNTIME}`)

    expect(assets).toHaveLength(1)
  })

  it('accepts a base path, for a server that does not mount at /_stx', () => {
    const { html } = externalizeHtml(`<body>${RUNTIME}</body>`, '/assets/stx')

    expect(html).toContain('src="/assets/stx/runtime.')
  })
})

describe('what it must not touch', () => {
  it('is a no-op on a document it already rewrote', () => {
    // A server may externalize a cached render twice; the second pass must not
    // strip the src it just wrote.
    const once = externalizeHtml(`<body>${RUNTIME}</body>`).html
    const twice = externalizeHtml(once)

    expect(twice.html).toBe(once)
    expect(twice.assets).toHaveLength(0)
    expect(twice.bytesInlined).toBe(0)
  })

  it('leaves an already-external script alone', () => {
    const html = '<script data-stx-runtime src="/vendor/runtime.js"></script>'

    expect(externalizeHtml(html).html).toBe(html)
  })

  it('leaves an empty tag inline rather than spending a request on it', () => {
    const html = '<script data-stx-runtime></script>'

    expect(externalizeHtml(html).assets).toHaveLength(0)
  })

  it('leaves unrelated scripts and styles alone', () => {
    const html = '<script>console.log(1)</script><style>.x{color:blue}</style>'

    expect(externalizeHtml(html).html).toBe(html)
  })

  it('writes nothing — the caller decides where assets live', () => {
    // The whole reason this is separate from the post-pass: SSR has no output
    // directory to write into.
    const { assets } = externalizeHtml(`<body>${RUNTIME}</body>`)

    expect(assets[0]).toEqual({
      filename: assets[0].filename,
      contents: RUNTIME_BODY,
      contentType: 'text/javascript; charset=utf-8',
    })
  })
})
