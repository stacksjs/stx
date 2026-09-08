/**
 * Component tags are rendered end-to-start, and the document is assembled once
 * (stacksjs/stx#1945).
 *
 * Each tag used to be spliced into the page as it was rendered, and a splice
 * rebuilds the whole document: N component tags meant N rebuilds, 540KB per
 * render on a component-dense page. The replacements are collected and the
 * document is assembled in one pass now.
 *
 * The offsets all index into the pre-loop scan, so the ASSEMBLY could just as
 * well run forwards. The RENDERING could not: a component consumes ids from a
 * per-render scope sequence, so the order tags are rendered in is visible in
 * the output. Switching the loop to forward order leaves all 311 component
 * tests green while renumbering every scope id in the page -- which is why this
 * file exists.
 */

import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const options = {
  ...defaultConfig,
  componentsDir: '/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/components/src/ui',
} as StxOptions

/** The `<n>` from `stx_<name>_<n>_<random>`, per scope, in document order. */
function scopeSequence(html: string, name: string): number[] {
  return [...html.matchAll(new RegExp(`data-stx-scope="stx_${name}_(\\d+)_`, 'g'))].map(m => Number(m[1]))
}

describe('component rendering order', () => {
  it('renders later tags first, so their scope ids come first in the sequence', async () => {
    const out = await processDirectives(
      '<html><head><meta charset="utf-8"></head><body><Card>one</Card><Card>two</Card><Card>three</Card></body></html>',
      {},
      '/app/page.stx',
      options,
      new Set(),
    )

    const ids = scopeSequence(out, 'card')
    expect(ids).toHaveLength(3)
    // End-to-start rendering: the LAST card in the source got the lowest id.
    expect(ids[0]).toBeGreaterThan(ids[1])
    expect(ids[1]).toBeGreaterThan(ids[2])
  })

  it('keeps the spans between tags, in order, exactly once', async () => {
    // The assembly walks a cursor across the original string. A cursor left at
    // startIndex duplicates the span it just emitted; one advanced too far eats
    // the text between two tags. Distinctive markers, because a bare letter
    // matches inside the surrounding markup.
    const out = await processDirectives(
      '<html><head><meta charset="utf-8"></head><body>MARK_A<Card>one</Card>MARK_B<Card>two</Card>MARK_C</body></html>',
      {},
      '/app/page.stx',
      options,
      new Set(),
    )

    for (const marker of ['MARK_A', 'MARK_B', 'MARK_C'])
      expect(out.match(new RegExp(marker, 'g'))).toHaveLength(1)

    const scopes = [...out.matchAll(/data-stx-scope="stx_card_\d+_/g)].map(m => m.index as number)
    expect(scopes).toHaveLength(2)
    expect(out.indexOf('MARK_A')).toBeLessThan(scopes[0])
    expect(scopes[0]).toBeLessThan(out.indexOf('MARK_B'))
    expect(out.indexOf('MARK_B')).toBeLessThan(scopes[1])
    expect(scopes[1]).toBeLessThan(out.indexOf('MARK_C'))
  })
})
