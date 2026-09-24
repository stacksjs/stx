import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs } from '../utils'

/**
 * A partial's JSON-LD reaches the page as JSON.
 *
 * The page pipeline passes data blocks (`application/ld+json`,
 * `application/json`, `importmap`, ...) through verbatim, but an included
 * partial routed every non-server `<script>` through its client-script branch
 * and wrapped it in the scope IIFE. A shared head partial is exactly where
 * JSON-LD lives, so every structured-data block on such a site shipped as
 * JavaScript no search engine could parse, with nothing on the page looking
 * wrong.
 */
describe('data-block scripts in a partial', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as any
  const render = (tmpl: string, context: Record<string, unknown> = {}): Promise<string> =>
    processDirectives(tmpl, context, 'page.stx', opts, new Set())

  function ldJson(html: string): string[] {
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]!)
  }

  it('keeps JSON-LD verbatim, interpolated from the page scope', async () => {
    await createPartialFile(
      'seo-head.stx',
      `<script server>\nconst siteName = 'Example'\n</script>\n`
      + `<meta name="x" content="{{ siteName }}">\n`
      + `@if (typeof jsonLd !== 'undefined' && jsonLd)\n  <script type="application/ld+json">{!! jsonLd !!}</script>\n@endif\n`,
    )
    const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', 'name': 'Mario Adrion' })
    const out = await render(`<head>@include('seo-head')</head>`, { jsonLd })

    const blocks = ldJson(out)
    expect(blocks).toHaveLength(1)
    expect(JSON.parse(blocks[0]!)).toEqual({ '@context': 'https://schema.org', '@type': 'Person', 'name': 'Mario Adrion' })
    expect(out).not.toContain('stx_scope_seo_head')
  })

  it('still drops the block when its @if is false', async () => {
    await createPartialFile(
      'seo-head-optional.stx',
      `@if (typeof jsonLd !== 'undefined' && jsonLd)\n  <script type="application/ld+json">{!! jsonLd !!}</script>\n@endif\n<meta name="y">`,
    )
    const out = await render(`<head>@include('seo-head-optional')</head>`)
    expect(ldJson(out)).toHaveLength(0)
  })

  it('leaves executable scripts to the client-script branch', async () => {
    await createPartialFile(
      'with-client.stx',
      `<script client>\nconst count = state(0)\n</script>\n<p :text="count()"></p>`,
    )
    const out = await render(`<div>@include('with-client')</div>`)
    expect(out).toContain('data-stx-scoped')
  })
})
