/**
 * A page with a scoped partial renders the same bytes every time (#1945).
 *
 * Component scope ids were made deterministic in cbe08f0b4b; a partial's
 * `<script client>` still drew its scope id from a module counter that
 * outlived the render, so every request rendered `stx_scope_nav_1`, then
 * `_5`, then `_9`. One layout nav was enough to make every render of every
 * page unique, and every memo keyed on the page's bytes -- its stylesheet,
 * the composables it reaches, its module registry -- missed on every request.
 * hq.training's coach calendar spent ~0.3s a request re-deriving them.
 *
 * The id keeps the properties the component ids have: identical between
 * renders of one page, unique within the document, distinct between pages.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs } from '../utils'

describe('a scoped partial\'s id', () => {
  beforeAll(async () => {
    await setupTestDirs()
    await createPartialFile(
      'counter-nav.stx',
      `<nav><p :text="count()"></p></nav>\n<script client>\n  const count = state(0)\n</script>\n`,
    )
  })
  afterAll(cleanupTestDirs)

  const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as any
  const render = (tmpl: string, file = 'page.stx'): Promise<string> =>
    processDirectives(tmpl, {}, file, opts, new Set())
  const ids = (html: string) => [...html.matchAll(/<nav\b[^>]*\sdata-stx-scope="(stx_scope_counter_nav_[^"]+)"/g)].map(m => m[1])

  it('is the same on every render of the page, so the page is the same bytes', async () => {
    const first = await render(`@include('counter-nav')`)
    const second = await render(`@include('counter-nav')`)
    expect(ids(first)).toHaveLength(1)
    expect(second).toBe(first)
  })

  it('is unique within a document', async () => {
    const html = await render(`@include('counter-nav')\n@include('counter-nav')`)
    const found = ids(html)
    expect(found).toHaveLength(2)
    expect(new Set(found).size).toBe(2)
  })

  it('differs between pages, so a navigation never puts two scopes on one name', async () => {
    const a = ids(await render(`@include('counter-nav')`, 'a.stx'))
    const b = ids(await render(`@include('counter-nav')`, 'b.stx'))
    expect(a[0]).not.toBe(b[0])
  })
})
