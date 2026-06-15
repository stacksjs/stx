import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs } from '../utils'

// Regression: stacksjs/stx#1758
//
// An @include partial's <script> is stripped (includes.ts) BEFORE its body
// expressions are processed, so processExpressions' usesSignalsInScript gate
// can't see the partial's own state()/derived(). Without recovering that gate
// from the partial's full content, `{{ signalCall() }}` is evaluated
// server-side (undefined → emptied) and the marker is consumed — the partial
// renders permanently blank instead of binding on the client.
//
// The fix computes usesSignalsInScript on the FULL partial content and passes
// it to processExpressions as { forceSignals }. These tests pin both the fix
// (signal partials preserve {{ }}) and that it does NOT over-preserve
// (server-var / signal-free partials still evaluate server-side).
//
// Rendered via src `processDirectives` rather than Bun.build+stxPlugin so the
// assertions exercise src, not a possibly-stale dist (see test-realm memory).
describe('stx#1758: {{ }} in @include partials with their own signals', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as any
  const render = (tmpl: string): Promise<string> =>
    processDirectives(tmpl, {}, 'page.stx', opts, new Set())

  it('preserves {{ signalCall() }} when the partial defines its own signals', async () => {
    await createPartialFile(
      'signal-counter.stx',
      `<script client>\n  const n = derived(() => 42)\n</script>\n<p class="counter">{{ n() }}</p>`,
    )
    const out = await render(`<div>@include('signal-counter')</div>`)
    // Must survive as a runtime marker, not be emptied server-side.
    expect(out).toMatch(/\{\{\s*n\(\)\s*\}\}/)
  })

  it('still evaluates <script server> vars in a partial (no over-preservation)', async () => {
    await createPartialFile(
      'server-card.stx',
      `<script server>\n  const who = 'Alice'\n</script>\n<p class="server">{{ who }}</p>`,
    )
    const out = await render(`<div>@include('server-card')</div>`)
    expect(out).toContain('Alice')
    expect(out).not.toMatch(/\{\{\s*who\s*\}\}/)
  })

  it('does not over-preserve {{ }} in a signal-free partial', async () => {
    await createPartialFile('dumb.stx', `<p class="dumb">{{ mystery }}</p>`)
    const out = await render(`<div>@include('dumb')</div>`)
    // No signals anywhere → evaluated server-side (undefined → empty), not shipped
    // to the client as a literal it cannot resolve.
    expect(out).not.toMatch(/\{\{\s*mystery\s*\}\}/)
  })
})
