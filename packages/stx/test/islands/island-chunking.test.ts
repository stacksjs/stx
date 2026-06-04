/**
 * Per-island production chunking (stacksjs/stx#1746) — the pure emitter.
 *
 * extractIslandChunks lifts each inline `<script type="stx/island">` IIFE into a
 * content-hashed chunk and rewrites the tag to a `data-stx-src` reference with an
 * empty body. These tests pin the pure transform (no I/O): determinism, dedup,
 * the no-op guarantees, and that non-island markup is left byte-identical.
 */
import { describe, expect, it } from 'bun:test'
import { extractIslandChunks, injectIslandChunkPrefetch } from '../../src/island-chunking'

const IIFE = `(function(){ var s = window.stx; window.stx._scopes["S1"] = { n: s.state(0) }; })();`
const tag = (sid: string, body: string) =>
  `<script type="stx/island" data-stx-island="${sid}" data-stx-scoped>${body}</script>`

describe('extractIslandChunks (#1746)', () => {
  it('lifts an inline island IIFE into a chunk and rewrites the tag', () => {
    const html = `<div data-stx-scope="S1">hi</div>${tag('S1', IIFE)}`
    const { html: out, chunks } = extractIslandChunks(html)

    expect(chunks).toHaveLength(1)
    expect(chunks[0].code).toBe(IIFE) // exact IIFE (trimmed) lands in the chunk
    expect(out).toContain(`data-stx-src="/_stx/islands/${chunks[0].hash}.js"`)
    expect(out).toContain('data-stx-island="S1"')
    expect(out).toContain('type="stx/island"') // browser still skips it at parse
    expect(out).toContain('data-stx-scoped') // build/SPA passes still skip it
    // body is now empty — the bytes moved out
    expect(out).toContain(`data-stx-src="/_stx/islands/${chunks[0].hash}.js" data-stx-scoped></script>`)
    expect(out).not.toContain('window.stx._scopes') // IIFE no longer inline
  })

  it('hashes deterministically and busts the hash when the IIFE changes', () => {
    const a = extractIslandChunks(tag('S1', IIFE)).chunks[0].hash
    const b = extractIslandChunks(tag('S1', IIFE)).chunks[0].hash
    expect(a).toBe(b) // stable across calls

    const c = extractIslandChunks(tag('S1', `${IIFE} /* x */`)).chunks[0].hash
    expect(c).not.toBe(a) // one-char change → different chunk URL
  })

  it('dedupes byte-identical IIFEs within a page to one chunk', () => {
    const html = `${tag('A', IIFE)}<p>x</p>${tag('B', IIFE)}`
    const { html: out, chunks } = extractIslandChunks(html)

    expect(chunks).toHaveLength(1) // one shared chunk
    const hash = chunks[0].hash
    // both tags reference the same chunk, each keeping its own scope id
    expect(out).toContain(`data-stx-island="A" data-stx-src="/_stx/islands/${hash}.js"`)
    expect(out).toContain(`data-stx-island="B" data-stx-src="/_stx/islands/${hash}.js"`)
  })

  it('gives distinct IIFEs distinct hashes', () => {
    const other = `(function(){ window.stx._scopes["B"] = {}; })();`
    const { chunks } = extractIslandChunks(`${tag('A', IIFE)}${tag('B', other)}`)
    expect(chunks).toHaveLength(2)
    expect(chunks[0].hash).not.toBe(chunks[1].hash)
  })

  it('is a no-op for HTML with no island tags', () => {
    const html = `<div>hello</div><script data-stx-scoped>console.log(1)</script>`
    const { html: out, chunks } = extractIslandChunks(html)
    expect(out).toBe(html) // byte-identical
    expect(chunks).toEqual([])
  })

  it('leaves non-island scripts byte-identical', () => {
    const ordinary = `<script>const x = "type=\\"stx/island\\" data-stx-island=\\"fake\\""</script>`
    const html = `${ordinary}${tag('S1', IIFE)}<footer>f</footer>`
    const { html: out } = extractIslandChunks(html)
    // The ordinary script (even though its string mentions the marker) is untouched.
    expect(out).toContain(ordinary)
    expect(out).toContain('<footer>f</footer>')
  })

  it('is idempotent — re-running on already-chunked HTML changes nothing', () => {
    const once = extractIslandChunks(tag('S1', IIFE)).html
    const { html: twice, chunks } = extractIslandChunks(once)
    expect(twice).toBe(once) // empty-body + existing data-stx-src → skipped
    expect(chunks).toEqual([])
  })
})

// A chunked page: a host (data-stx-scope + stx-hydrate) + its chunk reference.
const chunkedPage = (sid: string, trigger: string, hash: string) =>
  `<html><head><title>t</title></head><body>`
  + `<div data-stx-scope="${sid}" stx-hydrate="${trigger}"><span x-text="n"></span></div>`
  + `<script type="stx/island" data-stx-island="${sid}" data-stx-src="/_stx/islands/${hash}.js" data-stx-scoped></script>`
  + `</body></html>`

describe('injectIslandChunkPrefetch (#1746)', () => {
  it('prefetches a visible island chunk into the head', () => {
    const out = injectIslandChunkPrefetch(chunkedPage('S1', 'visible', 'aaa'))
    expect(out).toContain('<link rel="prefetch" href="/_stx/islands/aaa.js" as="script">')
    // inserted inside the head (before </head>)
    expect(out.indexOf('rel="prefetch"')).toBeLessThan(out.indexOf('</head>'))
  })

  it('prefetches an idle island chunk', () => {
    const out = injectIslandChunkPrefetch(chunkedPage('S1', 'idle', 'bbb'))
    expect(out).toContain('href="/_stx/islands/bbb.js"')
  })

  it('does NOT prefetch interaction or media islands (may never hydrate)', () => {
    expect(injectIslandChunkPrefetch(chunkedPage('S1', 'interaction', 'ccc'))).not.toContain('rel="prefetch"')
    expect(injectIslandChunkPrefetch(chunkedPage('S1', 'media:(max-width:768px)', 'ddd'))).not.toContain('rel="prefetch"')
  })

  it('only prefetches eligible islands on a mixed page', () => {
    const mixed
      = `<html><head></head><body>`
      + `<div data-stx-scope="V" stx-hydrate="visible"></div>`
      + `<script data-stx-island="V" data-stx-src="/_stx/islands/vv.js" data-stx-scoped></script>`
      + `<div data-stx-scope="I" stx-hydrate="interaction"></div>`
      + `<script data-stx-island="I" data-stx-src="/_stx/islands/ii.js" data-stx-scoped></script>`
      + `</body></html>`
    const out = injectIslandChunkPrefetch(mixed)
    expect(out).toContain('rel="prefetch" href="/_stx/islands/vv.js"') // visible → prefetched
    // interaction → no prefetch link (its chunk tag still references the url in body)
    expect(out).not.toContain('rel="prefetch" href="/_stx/islands/ii.js"')
  })

  it('is a no-op without a head, or on non-chunked HTML', () => {
    const noHead = `<body><div data-stx-scope="S1" stx-hydrate="visible"></div><script data-stx-island="S1" data-stx-src="/x.js"></script></body>`
    expect(injectIslandChunkPrefetch(noHead)).toBe(noHead)
    const noChunks = `<html><head></head><body><p>hi</p></body></html>`
    expect(injectIslandChunkPrefetch(noChunks)).toBe(noChunks)
  })

  it('is idempotent — no duplicate prefetch link on re-run', () => {
    const once = injectIslandChunkPrefetch(chunkedPage('S1', 'visible', 'aaa'))
    const twice = injectIslandChunkPrefetch(once)
    expect(twice).toBe(once)
    expect(twice.match(/rel="prefetch" href="\/_stx\/islands\/aaa\.js"/g)).toHaveLength(1)
  })
})
