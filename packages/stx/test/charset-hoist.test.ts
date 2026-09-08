/**
 * `<meta charset>` is re-asserted to the top of `<head>` without copying the
 * head to decide whether it needs to be (stacksjs/stx#1945).
 *
 * 53d7f2e6ae stopped the injectors displacing the charset, which made this
 * hoist a no-op in RESULT. It was not a no-op in COST: it sliced the whole
 * `<head>` out first, and the head carries the inlined signals runtime, so that
 * was ~170KB per render to conclude "nothing to do". The search runs at an
 * offset in the document now.
 *
 * The rebuild path is what these mainly cover. The fixtures used to measure
 * this issue all have the charset already leading, so the branch that actually
 * moves it is only reachable from a page assembled in an unusual order — and
 * getting the offsets wrong there silently drops head content.
 */

import { describe, expect, it } from 'bun:test'
import { normalizeCriticalHeadOrder } from '../src/color-mode-boot'

describe('charset hoisting', () => {
  it('returns the very same string when the charset already leads', () => {
    // Not an equal string -- the same one. This is the common path, and the
    // whole point is that it costs nothing.
    const html = '<html><head><meta charset="utf-8"><title>t</title></head><body>x</body></html>'
    expect(Object.is(normalizeCriticalHeadOrder(html), html)).toBe(true)
  })

  it('treats leading whitespace as still leading', () => {
    const html = '<html><head>\n  <meta charset="utf-8"><title>t</title></head><body>x</body></html>'
    expect(Object.is(normalizeCriticalHeadOrder(html), html)).toBe(true)
  })

  it('moves a displaced charset to the front, keeping everything else in order', () => {
    const out = normalizeCriticalHeadOrder(
      '<html><head><meta name="a" content="1"><title>t</title><meta charset="utf-8"></head><body>x</body></html>',
    )

    expect(out).toBe('<html><head>\n  <meta charset="utf-8"><meta name="a" content="1"><title>t</title></head><body>x</body></html>')
  })

  it('loses nothing from the head when it rebuilds', () => {
    const out = normalizeCriticalHeadOrder(
      '<html><head><meta name="a"><meta charset="utf-8"><link rel="x"><title>t</title></head><body>x</body></html>',
    )

    for (const fragment of ['<meta name="a">', '<link rel="x">', '<title>t</title>', '<body>x</body>'])
      expect(out).toContain(fragment)
    expect(out.match(/charset/g)).toHaveLength(1)
  })

  it('ignores a charset that is not in the head', () => {
    // The search is bounded by `</head>`; without that bound a stray charset in
    // the body would be hoisted into the head, duplicating it.
    const html = '<html><head><title>t</title></head><body><meta charset="utf-8"></body></html>'
    expect(Object.is(normalizeCriticalHeadOrder(html), html)).toBe(true)
  })

  it('handles a document with no closing </head>', () => {
    const out = normalizeCriticalHeadOrder('<html><head><meta name="a"><meta charset="utf-8"><title>t</title>')

    expect(out).toBe('<html><head>\n  <meta charset="utf-8"><meta name="a"><title>t</title>')
  })

  it('ignores a charset-shaped string that appears before <head>', () => {
    // The search starts at the head opening, not at index 0. Starting at 0
    // finds this one, computes a negative-length span back to the head, and
    // concludes "already leading" -- so the real displaced charset never moves.
    const out = normalizeCriticalHeadOrder(
      '<!-- <meta charset="ignored"> --><html><head><meta name="a"><meta charset="utf-8"><title>t</title></head><body>x</body></html>',
    )

    expect(out).toBe('<!-- <meta charset="ignored"> --><html><head>\n  <meta charset="utf-8"><meta name="a"><title>t</title></head><body>x</body></html>')
  })

  it('leaves a document with no charset alone', () => {
    const html = '<html><head><title>t</title></head><body>x</body></html>'
    expect(Object.is(normalizeCriticalHeadOrder(html), html)).toBe(true)
  })
})
