/**
 * Production-server streaming (stacksjs/stx#1746). The compiled-template
 * production server re-runs a page's `<script server>` per request, so a
 * `streamBoundaries` export is repopulated fresh and the page can stream — it's
 * NOT blocked by the compiled-template model. `hydrateTemplateStream` is the
 * seam: it returns the hydrated shell + the boundaries for `renderStreamingPage`.
 */
import { describe, expect, it } from 'bun:test'
import type { CompiledTemplate } from '../../src/template-compiler'
import { hydrateTemplateStream } from '../../src/template-hydrator'

function compiled(serverScript: string, html: string, streamTemplates?: Record<string, string>): CompiledTemplate {
  return {
    route: '/x',
    sourceFile: '/tmp/x.stx',
    html,
    fragment: html,
    placeholders: {},
    hasServerScripts: true,
    serverScriptContent: [serverScript],
    dependencies: [],
    contentHash: 'h',
    streamTemplates,
  }
}

describe('hydrateTemplateStream (#1746 production streaming)', () => {
  it('extracts streamBoundaries from the re-run server script + returns the shell', async () => {
    const c = compiled(
      `const streamBoundaries = { article: async () => '<article id="a">DATA</article>' }`,
      `<body><div data-suspense="article">Loading…</div></body>`,
    )
    const { html, boundaries } = await hydrateTemplateStream(c, {})

    expect(html).toContain('data-suspense="article"') // shell carries the placeholder
    expect(boundaries).toBeTruthy()
    expect(boundaries!.map(b => b.id)).toEqual(['article'])
    // the boundary runs the page's async render, fresh per request
    expect(await boundaries![0].render()).toBe('<article id="a">DATA</article>')
  })

  it('returns no boundaries for a normal (non-streaming) page', async () => {
    const c = compiled(`const title = 'Home'`, `<h1>Home</h1>`)
    const { boundaries } = await hydrateTemplateStream(c, {})
    expect(boundaries).toBeUndefined()
  })

  it('replays a compile-time @stream template with its $boundary data', async () => {
    // @stream captured this inner template at build; streamBoundaries supplies data.
    const c = compiled(
      `const streamBoundaries = { article: async () => ({ title: 'Hello' }) }`,
      `<body><div data-suspense="article">Loading…</div></body>`,
      { article: '<article>{{ $boundary.title }}</article>' },
    )
    const { boundaries } = await hydrateTemplateStream(c, {})
    expect(boundaries!.map(b => b.id)).toEqual(['article'])
    expect(await boundaries![0].render()).toContain('Hello') // template rendered with data
  })
})
