/**
 * A render failure is a 500, not a 200 (stacksjs/stx#1854).
 *
 * When processDirectives cannot recover, it returns an HTML comment as the
 * ENTIRE document — `<!-- Template Processing failed: … -->` in development,
 * `<!-- stx rendering error -->` in production (errors/logger.ts:90-95). The
 * serve path then shipped that with the page's own status, which is 200.
 *
 * A 200 is what made it invisible: uptime checks, CDNs and browser caches all
 * see a healthy response whose body happens to be a comment. Both other stx
 * servers already get this right — production-server.ts looks up a /500 route,
 * dev-server/serve-app.ts calls renderErrorPage(500).
 *
 * HONEST LIMIT OF THIS TEST. I could not drive processDirectives into that
 * outer catch from a template: stx recovers from a missing include, a missing
 * layout, an unclosed @if, a throwing <script server> and a throwing custom
 * directive, all of which render a page. So the end-to-end 200 is asserted at
 * the level the marker is defined at, not by inducing a real failure. The
 * predicate is pinned against the two format strings taken from the module that
 * emits them, so it cannot drift from them silently.
 */
import { describe, expect, it } from 'bun:test'
import { errorRecovery } from '../../stx/src/errors/logger'
import { isRenderableCacheCandidate, isRenderFailure } from '../src/serve'

describe('isRenderFailure', () => {
  it('recognises the development marker, as the emitter writes it', () => {
    // Taken from the emitter rather than retyped, so a change to the format
    // fails here instead of silently un-detecting failures.
    const emitted = errorRecovery.createFallbackContent('Template Processing', new Error('boom'))

    expect(emitted).toMatch(/^<!--/)
    expect(isRenderFailure(emitted)).toBe(true)
  })

  it('recognises both literal markers', () => {
    expect(isRenderFailure('<!-- Template Processing failed: boom -->')).toBe(true)
    expect(isRenderFailure('<!-- stx rendering error -->')).toBe(true)
  })

  it('does not flag a healthy page', () => {
    expect(isRenderFailure('<!DOCTYPE html><html><body><main>fine</main></body></html>')).toBe(false)
  })

  it('does not flag a page that merely mentions the words', () => {
    // A docs page about error handling must not start returning 500.
    expect(isRenderFailure('<p>When template processing failed, stx logs it.</p>')).toBe(false)
  })
})

describe('the cache guard and the status guard agree', () => {
  it('never caches what it would serve as 500', () => {
    // These were two independent predicates; the caching one already existed
    // and was correct, while the response had no equivalent. Deriving one from
    // the other is what stops them disagreeing about the same document.
    for (const html of [
      '<!-- Template Processing failed: boom -->',
      '<!-- stx rendering error -->',
      '<main>fine</main>',
    ])
      expect(isRenderableCacheCandidate(html)).toBe(!isRenderFailure(html))
  })
})
