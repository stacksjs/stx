/**
 * The static build ships shared blobs once, not once per page
 * (stacksjs/stx#1865, #1878).
 *
 * Every generated page carried a full inline copy of the signals runtime
 * (~118KB), the router (~38KB) and the generated stylesheet. On a 35-page site
 * that is the same bytes 35 times, cacheable by nobody, and
 * `find dist -name '*.js'` returned nothing — there was no external script to
 * cache in the first place.
 *
 * Done as a post-pass rather than by threading `buildMode`, deliberately. The
 * existing `compile` branch emits `/__stx/runtime.__STX_HASH__.js` — a
 * placeholder only the production builder rewrites — and that mode also
 * suppresses the document shell, so reusing it on the SSG path would produce
 * pages that reference a 404 and have lost their `<html>` wrapper. The trap is
 * why these assertions check the emitted href resolves to a real file.
 *
 * Content-addressed, so the runtime — byte-identical on every page — collapses
 * to one asset.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { EXTERNALIZED_ASSET_DIR, externalizeSharedAssets } from '../../src/build-externalize'

let dir = ''

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-externalize-'))
})

afterEach(async () => {
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

function page(name: string, body: string): void {
  mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
  writeFileSync(path.join(dir, name), `<!DOCTYPE html><html><head></head><body>${body}</body></html>`)
}

const RUNTIME = '<script data-stx-scoped data-stx-runtime>var stx = 1; /* big */</script>'
const ROUTER = '<script data-stx-router>var router = 1; /* big */</script>'
const CSS = '<style data-crosswind="generated">.a{color:red}</style>'

function assets(): string[] {
  const assetDir = path.join(dir, EXTERNALIZED_ASSET_DIR)
  return existsSync(assetDir) ? readdirSync(assetDir).sort() : []
}

describe('shared blobs become shared files', () => {
  it('emits one runtime for pages that all inline the same one', () => {
    page('a.html', RUNTIME)
    page('b.html', RUNTIME)
    page('c.html', RUNTIME)

    const result = externalizeSharedAssets(dir)

    expect(assets().filter(f => f.startsWith('runtime.'))).toHaveLength(1)
    expect(result.pages).toBe(3)
  })

  it('externalizes the router, which ships even on pages with no client script', () => {
    page('a.html', ROUTER)

    externalizeSharedAssets(dir)

    expect(assets().filter(f => f.startsWith('router.'))).toHaveLength(1)
    expect(readFileSync(path.join(dir, 'a.html'), 'utf8')).toContain('<script data-stx-router src="/_stx/router.')
  })

  it('externalizes the generated stylesheet as a link', () => {
    page('a.html', CSS)

    externalizeSharedAssets(dir)

    const html = readFileSync(path.join(dir, 'a.html'), 'utf8')
    expect(html).toContain('rel="stylesheet"')
    expect(html).not.toContain('<style data-crosswind')
  })

  it('leaves an href that resolves to a real file', () => {
    // The failure mode of the buildMode shortcut: a page referencing a
    // placeholder nothing rewrote.
    page('a.html', RUNTIME + ROUTER + CSS)
    externalizeSharedAssets(dir)

    const html = readFileSync(path.join(dir, 'a.html'), 'utf8')
    for (const [, href] of html.matchAll(/(?:src|href)="\/(_stx\/[^"]+)"/g))
      expect(existsSync(path.join(dir, href))).toBe(true)
    expect(html).not.toContain('__STX_HASH__')
  })

  it('takes the bytes out of the HTML', () => {
    page('a.html', RUNTIME)
    const before = readFileSync(path.join(dir, 'a.html'), 'utf8').length

    externalizeSharedAssets(dir)

    expect(readFileSync(path.join(dir, 'a.html'), 'utf8').length).toBeLessThan(before)
  })
})

describe('what it must not do', () => {
  it('is a no-op on a second run', () => {
    // Already-external references have no inline body to match.
    page('a.html', RUNTIME)
    externalizeSharedAssets(dir)
    const once = readFileSync(path.join(dir, 'a.html'), 'utf8')

    const second = externalizeSharedAssets(dir)

    expect(second.pages).toBe(0)
    expect(readFileSync(path.join(dir, 'a.html'), 'utf8')).toBe(once)
  })

  it('leaves a script that is already external alone', () => {
    page('a.html', '<script data-stx-runtime src="/vendor/runtime.js"></script>')

    expect(externalizeSharedAssets(dir).pages).toBe(0)
  })

  it('leaves unrelated scripts and styles alone', () => {
    page('a.html', '<script>console.log(1)</script><style>.x{color:blue}</style>')

    externalizeSharedAssets(dir)

    const html = readFileSync(path.join(dir, 'a.html'), 'utf8')
    expect(html).toContain('console.log(1)')
    expect(html).toContain('.x{color:blue}')
  })

  it('walks nested output directories', () => {
    page(path.join('blog', 'post.html'), RUNTIME)

    expect(externalizeSharedAssets(dir).pages).toBe(1)
  })
})
