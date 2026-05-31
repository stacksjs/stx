/**
 * The non-reactive `@event` fallback (when no `[data-stx-scope]` ancestor exposes
 * `__stx_execute`) used to inline the raw, HTML-entity-encoded handler as JS —
 * `else { doIt(&quot;a&quot;) }` — which is invalid JS (entities aren't JS) and,
 * for forwarded handlers, simply never ran. The fix routes the fallback through
 * `__stx_runHandler`, which keeps the handler entity-encoded in the emitted
 * <script> (so no raw markup / `</script>` can appear) and decodes it to JS only
 * in memory before running it with `$event`/`$el` in scope.
 */
import { describe, expect, it } from 'bun:test'
import { processEventDirectives } from '../../src/events'

function run(template: string): string {
  return processEventDirectives(template, {}, '/tmp/page.stx')
}

describe('non-reactive @event fallback', () => {
  it('routes the fallback through __stx_runHandler (not raw-inlined)', () => {
    const out = run('<button @click="doIt(&quot;a&quot;)">x</button>')
    expect(out).toContain('__stx_runHandler(')
    // The handler stays entity-encoded in the HTML; it is never inlined raw.
    expect(out).toContain('doIt(&quot;a&quot;)')
    expect(out).not.toMatch(/else\s*\{\s*doIt\("a"\)/)
  })

  it('keeps markup-bearing handlers entity-safe in the <script> (no breakout)', () => {
    // A handler whose entities decode to `</script>` must NOT appear raw in output.
    const out = run('<button @click="x = &#39;&lt;/script&gt;&#39;">x</button>')
    expect(out).not.toContain('</script>\'')
    expect(out).toContain('&lt;/script&gt;')
    expect(out).toContain('__stx_runHandler(')
  })

  it('emits the in-memory decode helper exactly once', () => {
    const out = run('<button @click="a()">x</button><button @click="b()">y</button>')
    const occurrences = out.split('function __stx_runHandler(').length - 1
    expect(occurrences).toBe(1)
    expect(out).toContain('.replace(/&lt;/g, \'<\')')
  })
})
