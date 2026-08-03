/**
 * The production signals runtime ships no `console.log` (stacksjs/stx#1786).
 *
 * The runtime is a template literal, so its debug logging is ordinary source
 * that would be served verbatim; `generateSignalsRuntime()` strips every
 * `console.log(…)` call before minifying (added for #1668 bug 8). Nothing
 * pinned that, so a regression — a stray log, or the strip itself breaking on
 * some new call shape — would have shipped silently into consumer consoles,
 * firing once per bound element on every hydration.
 *
 * `console.warn` / `console.error` are deliberately preserved: they report real
 * problems and should reach a consumer's DevTools.
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntime, generateSignalsRuntimeDev } from '../../src/signals'

describe('signals runtime — console output', () => {
  const prod = generateSignalsRuntime()

  it('has no console.log in the production build', () => {
    // Report the surrounding source, not just a count — a bare number tells you
    // nothing about which log leaked.
    const leaked = Array.from(prod.matchAll(/console\.log\(/g))
      .map(m => prod.slice(m.index, (m.index ?? 0) + 90))
    expect(leaked).toEqual([])
  })

  it('keeps console.warn and console.error', () => {
    expect(prod).toContain('console.warn(')
    expect(prod).toContain('console.error(')
  })

  it('is not the dev build by accident', () => {
    // A thrown minifier sends generateSignalsRuntime() down a fallback that
    // returns the dev runtime unstripped. If that ever became the normal path
    // the assertion above would be the only thing standing between a debug log
    // and production, so make the distinction explicit.
    expect(prod).not.toBe(generateSignalsRuntimeDev())
  })

  it('does not log on class bindings or events', () => {
    // The specific leftovers #1786 reported: per-element logging on
    // x-class/@click, plus the per-attribute and per-event traces from the same
    // debugging session. Their sibling handlers (@style, @show, @text, @model)
    // never logged, which is what made them read as accidental.
    for (const build of [prod, generateSignalsRuntimeDev()]) {
      expect(build).not.toContain('HIT x-class handler')
      expect(build).not.toContain('attr loop entry')
      expect(build).not.toContain('attr iter')
      expect(build).not.toContain('event fired')
    }
  })
})
