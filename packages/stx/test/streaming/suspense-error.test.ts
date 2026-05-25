/**
 * Streaming suspense error UI tests (#1711).
 *
 * Covers the catch handler in `packages/stx/src/streaming.ts` ~ line 334:
 *
 *   catch (error: unknown) {
 *     const errorMsg = error instanceof Error ? error.message : String(error)
 *     controller.enqueue(`
 * <script>
 * window.__stxSuspense.resolve('${name}', '<div class="stx-error">…');
 * </script>`)
 *   }
 *
 * When a suspense boundary's `processDirectives` promise rejects, the streaming
 * pipeline must:
 *   1. Still close the stream successfully (one boundary's failure must not
 *      take down the rest of the page).
 *   2. Replace that boundary's placeholder with a marked-up error UI (`<div
 *      class="stx-error">`) so the client can detect and style it.
 *   3. HTML-escape the error message — never inject raw `<script>` or quote
 *      characters from the thrown Error into the page.
 *   4. Coerce non-Error throws via `String(error)`.
 *
 * Real production failure modes (a directive whose handler throws, a database
 * lookup that times out, an upstream API returning a malformed response) are
 * hard to trigger reproducibly from a test, so we mock `processDirectives` to
 * reject for content tagged with a sentinel string. Everything else flows
 * normally — confirming the surrounding pipeline is unaffected.
 */
import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

// IMPORTANT: mock.module must run BEFORE the import of streaming, since
// streaming.ts captures `processDirectives` at module-evaluation time. We use
// the `../../src/process` specifier here to match the relative import inside
// streaming.ts; without that match, the mock would be silently ignored.
mock.module('../../src/process', () => ({
  processDirectives: async (content: string) => {
    if (content.includes('__FAIL_ERROR__'))
      throw new Error('boom <script>alert("xss")</script>')
    if (content.includes('__FAIL_STRING__'))
      // eslint-disable-next-line no-throw-literal
      throw 'plain string error'
    return content
  },
}))

const { streamTemplate } = await import('../../src/streaming')

const TEST_DIR = import.meta.dir
const TMP = path.join(TEST_DIR, 'temp-suspense-error')

async function drain(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader()
  let out = ''
  while (true) {
    const r = await reader.read()
    if (r.done)
      break
    out += r.value
  }
  return out
}

describe('streaming suspense error UI (#1711)', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TMP, { recursive: true })
  })

  afterAll(async () => {
    await fs.promises.rm(TMP, { recursive: true, force: true })
  })

  it('replaces the placeholder with a stx-error div when the boundary throws', async () => {
    const file = path.join(TMP, 'error-boundary.stx')
    await Bun.write(file, [
      '<div>shell</div>',
      '<!-- @suspense:bad -->',
      '__FAIL_ERROR__',
      '<!-- @endsuspense:bad -->',
    ].join('\n'))

    const out = await drain(await streamTemplate(file))

    // The error-path script fires for the failing boundary.
    expect(out).toContain('__stxSuspense.resolve(\'bad\'')
    expect(out).toContain('<div class="stx-error">Error loading content:')
  })

  it('HTML-escapes the error message (no raw <script> in the output)', async () => {
    const file = path.join(TMP, 'escape.stx')
    await Bun.write(file, [
      '<!-- @suspense:bad -->',
      '__FAIL_ERROR__',
      '<!-- @endsuspense:bad -->',
    ].join('\n'))

    const out = await drain(await streamTemplate(file))

    // The Error message contains `<script>alert("xss")</script>`. After
    // escaping it must appear with entity-encoded angle brackets and quotes.
    expect(out).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    // The raw script-tag boundary must NOT appear inside the stx-error div —
    // that's the actual XSS risk (a `<script>` substring in user-supplied
    // error text would close the outer script and start a fresh one). We
    // scope the assertion to the error div itself so it doesn't false-fire
    // on the `</script>` that closes the resolve() script tag.
    const errorDivMatch = out.match(/<div class="stx-error">[\s\S]*?<\/div>/)
    expect(errorDivMatch).not.toBeNull()
    expect(errorDivMatch![0]).not.toContain('<script>')
    expect(errorDivMatch![0]).not.toContain('</script>')
  })

  it('coerces non-Error throws via String(error)', async () => {
    const file = path.join(TMP, 'string-throw.stx')
    await Bun.write(file, [
      '<!-- @suspense:bad -->',
      '__FAIL_STRING__',
      '<!-- @endsuspense:bad -->',
    ].join('\n'))

    const out = await drain(await streamTemplate(file))

    // The thrown value was a string; the handler must `String()` it (which is
    // a no-op for strings) and inline it as the error message.
    expect(out).toContain('Error loading content: plain string error')
    expect(out).toContain('class="stx-error"')
  })

  it('keeps successful sibling boundaries flowing even when one fails', async () => {
    const file = path.join(TMP, 'mixed.stx')
    await Bun.write(file, [
      '<div>shell</div>',
      '<!-- @suspense:ok -->',
      'OK_CONTENT',
      '<!-- @endsuspense:ok -->',
      '<!-- @suspense:bad -->',
      '__FAIL_ERROR__',
      '<!-- @endsuspense:bad -->',
    ].join('\n'))

    const out = await drain(await streamTemplate(file))

    // Failing boundary gets the error UI.
    expect(out).toContain('__stxSuspense.resolve(\'bad\'')
    expect(out).toContain('stx-error')

    // Healthy boundary still resolves with its real content. The resolve
    // call for 'ok' must NOT contain the stx-error marker.
    const okResolveMatch = out.match(/__stxSuspense\.resolve\('ok',[\s\S]*?\);/)
    expect(okResolveMatch).not.toBeNull()
    expect(okResolveMatch![0]).toContain('OK_CONTENT')
    expect(okResolveMatch![0]).not.toContain('stx-error')
  })

  it('still closes the stream cleanly after a boundary failure', async () => {
    const file = path.join(TMP, 'closes.stx')
    await Bun.write(file, [
      '<!-- @suspense:bad -->',
      '__FAIL_ERROR__',
      '<!-- @endsuspense:bad -->',
    ].join('\n'))

    // drain() walks until reader.read() reports done — a hung or errored
    // stream would deadlock this test, so the fact that we reach the
    // assertion at all is half the proof.
    const out = await drain(await streamTemplate(file))
    expect(out.length).toBeGreaterThan(0)
    // The runtime <script> for __stxSuspense should be present — proving the
    // pipeline progressed past the shell into the resolve phase.
    expect(out).toContain('__stxSuspense')
  })
})
