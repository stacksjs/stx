/**
 * Streaming suspense error-UI tests (#1711).
 *
 * Covers `buildSuspenseResolveScript` — the per-boundary resolve logic
 * extracted from streamTemplate's inline loop. When a suspense boundary's
 * content promise rejects, the function must:
 *   1. Not throw — one boundary's failure can't take down the stream.
 *   2. Emit a marked-up error UI (`<div class="stx-error">`) into the
 *      boundary's placeholder via __stxSuspense.resolve.
 *   3. HTML-escape the error message — never inject raw `<script>` or quote
 *      characters from the thrown Error into the page.
 *   4. Coerce non-Error throws via `String(error)`.
 *   5. Resolve real content (the success path) intact.
 *
 * Testing the extracted function directly (with resolving/rejecting promises)
 * avoids mocking `processDirectives`. The previous version mocked it via
 * Bun's `mock.module`, which is process-global and does NOT restore at file
 * boundaries — it leaked into every later test that imports processDirectives
 * (returning input unchanged → silently no-op'ing the render pipeline), which
 * was the root cause of a ~110-test cross-contamination cluster in the full
 * `bun test` run. No global mocking here.
 */
import { describe, expect, it } from 'bun:test'
import { buildSuspenseResolveScript } from '../../src/streaming'

describe('buildSuspenseResolveScript — error path (#1711)', () => {
  it('emits a stx-error div when the boundary promise rejects', async () => {
    const out = await buildSuspenseResolveScript('bad', Promise.reject(new Error('kaboom')))
    expect(out).toContain('__stxSuspense.resolve(\'bad\'')
    expect(out).toContain('<div class="stx-error">Error loading content:')
    expect(out).toContain('kaboom')
  })

  it('does not throw when the boundary rejects (stream stays alive)', async () => {
    // The function must resolve to a string, never reject — otherwise one
    // failing boundary would reject Promise.all and tear down the stream.
    const p = buildSuspenseResolveScript('bad', Promise.reject(new Error('x')))
    await expect(p).resolves.toBeString()
  })

  it('HTML-escapes the error message (no raw <script> in the error div)', async () => {
    const out = await buildSuspenseResolveScript(
      'bad',
      Promise.reject(new Error('boom <script>alert("xss")</script>')),
    )
    // Entity-encoded angle brackets + quotes.
    expect(out).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    // The error div itself must carry no raw script-tag boundary — that's
    // the actual XSS risk. Scope the assertion to the div (the wrapping
    // resolve() <script> tag's own </script> is unrelated).
    const errorDiv = out.match(/<div class="stx-error">[\s\S]*?<\/div>/)
    expect(errorDiv).not.toBeNull()
    expect(errorDiv![0]).not.toContain('<script>')
    expect(errorDiv![0]).not.toContain('</script>')
  })

  it('coerces non-Error throws via String(error)', async () => {
    // eslint-disable-next-line prefer-promise-reject-errors
    const out = await buildSuspenseResolveScript('bad', Promise.reject('plain string error'))
    expect(out).toContain('Error loading content: plain string error')
    expect(out).toContain('class="stx-error"')
  })
})

describe('buildSuspenseResolveScript — success path (#1711)', () => {
  it('injects resolved content into the boundary placeholder', async () => {
    const out = await buildSuspenseResolveScript('ok', Promise.resolve('<p>hello</p>'))
    expect(out).toContain('__stxSuspense.resolve(\'ok\'')
    expect(out).toContain('<p>hello</p>')
    // Success path uses the content as-is — no stx-error wrapper.
    expect(out).not.toContain('stx-error')
  })

  it('escapes backticks and </script> in resolved content', async () => {
    const out = await buildSuspenseResolveScript('ok', Promise.resolve('a `b` </script> c'))
    // Backtick escaped so it can't close the template literal; </script>
    // escaped so it can't break out of the wrapping script tag.
    expect(out).toContain('\\`b\\`')
    expect(out).toContain('<\\/script>')
  })

  it('keeps sibling boundaries independent (one fails, one succeeds)', async () => {
    const okOut = await buildSuspenseResolveScript('ok', Promise.resolve('GOOD'))
    const badOut = await buildSuspenseResolveScript('bad', Promise.reject(new Error('BAD')))
    // The healthy boundary resolves with its real content and no error marker.
    expect(okOut).toContain('GOOD')
    expect(okOut).not.toContain('stx-error')
    // The failing boundary is isolated to its own error UI.
    expect(badOut).toContain('stx-error')
    expect(badOut).toContain('BAD')
  })
})
