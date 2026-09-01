/**
 * Two silent failures in what a partial's `<script client>` receives.
 *
 * 1. stacksjs/stacks#2391 — `{{ }}` / `{!! !!}` inside a partial's client
 *    script were never interpolated. The page-level pass runs at the top of
 *    `processOtherDirectives`, before `processIncludes` expands anything, so
 *    a partial's script body was the one that never got it. `const point =
 *    {!! vm.mapPoint !!}` then reached the bundler as literal text and failed
 *    with `Expected identifier but found "!"`, or - when the script needed no
 *    bundling - was emitted verbatim as a SyntaxError shipped to the browser.
 *    The dev server disagreed with the build because it interpolates the
 *    collected client scripts in a separate pass after the template resolves.
 *
 * 2. stacksjs/stacks#2394 — a partial carrying the page skeleton (`<!DOCTYPE>`,
 *    `<html>`, `<body>`) got no `data-stx-scope` stamped anywhere: the leading
 *    doctype failed the first-element match and the function returned silently.
 *    The emitted script still registered `window.stx._scopes[id]`, the runtime
 *    still looked the element up by that id, found nothing, and every binding
 *    in the partial stayed inert with no error at any layer.
 *
 * Rendered via src `processDirectives` rather than Bun.build+stxPlugin so the
 * assertions exercise src, not a possibly-stale dist.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs } from '../utils'

describe('include <script client>: server expressions and scope stamping', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as any
  const render = (tmpl: string, context: Record<string, any> = {}): Promise<string> =>
    processDirectives(tmpl, context, 'page.stx', opts, new Set())

  it('interpolates {!! raw !!} in a partial client script, as the page-level pass does', async () => {
    await createPartialFile(
      'raw-splice.stx',
      `<div id="map"></div>\n`
      + `<script client>\n  const point = {!! vm.mapPoint !!};\n  window.__point = point\n</script>\n`,
    )

    const html = await render(
      `<script server>\nconst vm = { mapPoint: JSON.stringify({ lat: 1, lng: 2 }) }\n</script>\n@include('raw-splice')`,
    )

    // The transpiler reformats the spliced literal, so match on the values
    // rather than the exact JSON text: the point is that a value arrived at all.
    expect(html).toMatch(/const point = \{\s*"?lat"?:\s*1,\s*"?lng"?:\s*2\s*\}/)
    expect(html).not.toContain('{!!')
  })

  it('interpolates {{ expr }} in a partial client script as a JS literal', async () => {
    await createPartialFile(
      'json-splice.stx',
      `<div id="slug"></div>\n`
      + `<script client>\n  const slug = {{ vm.slug }};\n  window.__slug = slug\n</script>\n`,
    )

    const html = await render(
      `<script server>\nconst vm = { slug: 'nonna-pia' }\n</script>\n@include('json-splice')`,
    )

    expect(html).toContain('const slug = "nonna-pia"')
  })

  it('leaves an expression it cannot resolve untouched, for the client to handle', async () => {
    await createPartialFile(
      'unresolved.stx',
      `<div></div>\n<script client>\n  const later = {{ notOnTheServer }};\n</script>\n`,
    )

    const html = await render(`@include('unresolved')`)

    expect(html).toContain('{{ notOnTheServer }}')
  })

  it('stamps the scope on <body> when the partial carries the page skeleton', async () => {
    await createPartialFile(
      'skeleton.stx',
      `<!DOCTYPE html>\n<html><body>\n<p :text="count()"></p>\n`
      + `<script client>\n  const count = state(0)\n</script>\n</body></html>\n`,
    )

    const html = await render(`@include('skeleton')`)

    const scopeId = html.match(/window\.stx\._scopes\['(stx_scope_skeleton_\d+)'\]/)?.[1]
    expect(scopeId).toBeTruthy()

    // The runtime resolves the scope with querySelector on this attribute, so
    // an id registered but never stamped hydrates nothing.
    const body = html.match(/<body\b[^>]*>/)?.[0] ?? ''
    expect(body).toContain(`data-stx-scope="${scopeId}"`)
  })

  it('still stamps the first element for an ordinary fragment partial', async () => {
    await createPartialFile(
      'fragment.stx',
      `<section>\n<p :text="count()"></p>\n</section>\n`
      + `<script client>\n  const count = state(0)\n</script>\n`,
    )

    const html = await render(`@include('fragment')`)

    const scopeId = html.match(/window\.stx\._scopes\['(stx_scope_fragment_\d+)'\]/)?.[1]
    expect(scopeId).toBeTruthy()
    expect(html).toContain(`<section data-stx-scope="${scopeId}"`)
  })
})
