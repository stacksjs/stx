/**
 * `findComponentTags` scans without copying (stacksjs/stx#1945).
 *
 * The scan tests every `<` in the document. It used to do that by slicing the
 * whole remaining document and matching an anchored pattern against the copy:
 * on a component-dense 237KB page, 4,250 slices totalling 95MB in one render --
 * 89% of everything that render allocated, and the single largest item behind
 * the issue. It matches at an offset in the original string now.
 *
 * The behaviour that has to survive is pinned by the component suite at large;
 * what is pinned HERE is the risk the rewrite introduces and nothing else
 * covers: a sticky regex carries `lastIndex` between calls, and the matcher is
 * now shared across calls rather than rebuilt per `<`. A stale index silently
 * skips tags near the start of the next document.
 */

import { describe, expect, it } from 'bun:test'
import { findComponentTags } from '../../src/component-processing'

const PASCAL = /[A-Z][a-zA-Z0-9]*/

describe('component tag scanning', () => {
  it('finds a tag at the very start of the document', () => {
    // Offset 0 is where a leaked lastIndex bites first.
    const tags = findComponentTags('<Card />', PASCAL)

    expect(tags).toHaveLength(1)
    expect(tags[0].tagName).toBe('Card')
    expect(tags[0].startIndex).toBe(0)
  })

  it('gives the same answer on a second call with a fresh pattern object', () => {
    // The three callers declare their patterns inside the function, so every
    // call passes a NEW RegExp with the same source -- the matcher is looked up
    // by source, which is what makes reuse (and lastIndex) possible at all.
    const html = '<Card /><Badge />'
    const first = findComponentTags(html, /[A-Z][a-zA-Z0-9]*/)
    const second = findComponentTags(html, /[A-Z][a-zA-Z0-9]*/)

    expect(second.map(t => [t.tagName, t.startIndex])).toEqual(first.map(t => [t.tagName, t.startIndex]))
    expect(second.map(t => t.tagName)).toEqual(['Card', 'Badge'])
  })

  it('does not carry an index over from a longer previous document', () => {
    findComponentTags(`${'<p>filler</p>'.repeat(40)}<Card />`, PASCAL)
    const tags = findComponentTags('<Badge />', PASCAL)

    expect(tags.map(t => t.tagName)).toEqual(['Badge'])
  })

  it('still refuses a prefix of a longer tag name', () => {
    // #1845: `<ion-button />` matched `ion`, lost the hyphen that marks it a
    // custom element, and resolved ion.stx from disk -- splicing an ENOENT
    // error into the page. The lookahead that prevents it moved into the
    // shared matcher, so it is worth asserting where it now lives.
    const tags = findComponentTags('<ion-button />', /[a-z][a-z0-9]*/)

    expect(tags).toHaveLength(0)
  })

  it('reports offsets into the original string, not a slice of it', () => {
    const prefix = '<div class="wrap">\n  '
    const tags = findComponentTags(`${prefix}<Card title="x" />\n</div>`, PASCAL)

    expect(tags).toHaveLength(1)
    expect(tags[0].startIndex).toBe(prefix.length)
    expect(tags[0].fullMatch).toBe('<Card title="x" />')
  })
})
