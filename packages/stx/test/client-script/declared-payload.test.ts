/**
 * A page can declare what crosses into `<script client>` (stacksjs/stx#1868).
 *
 * The only bridge was name scraping: a server binding was published if its
 * name appeared as a free identifier in the client source. So a page could not
 * state what it expected, and client code had to defend against the bridge not
 * having emitted a name:
 *
 *   const liveCount = state(typeof liveNow === 'number' ? liveNow : 0)
 *
 * …while a server const that existed ONLY to be scraped read as dead to every
 * linter. `defineClientPayload({ liveNow, range })` makes the set explicit: a
 * name is either declared or absent, never "present because you happened to
 * mention it".
 *
 * Scraping is untouched when nothing is declared — every existing page relies
 * on it, so the declaration is opt-in and the two are tested side by side.
 */
import { describe, expect, it } from 'bun:test'
import { extractBridgeData, generateServerDataBridge } from '../../src/client-script'

/** What actually reaches the page for a given context + client source. */
function bridge(context: Record<string, unknown>, clientCode: string): string {
  return generateServerDataBridge(clientCode, extractBridgeData(context))
}

describe('declared payload (#1868)', () => {
  it('publishes a declared name the client never mentions', () => {
    // The point of declaring. Under scraping this emitted nothing, so the
    // client had to guard against absence.
    const out = bridge(
      { liveNow: 7, __stxClientPayload: { liveNow: 7 } },
      'const n = 1',
    )
    expect(out).toContain('var liveNow = 7')
  })

  it('does NOT publish an undeclared name, even when referenced', () => {
    // The other half of the contract, and the one that makes the payload
    // bounded: mentioning a name is no longer enough to ship it.
    const out = bridge(
      { liveNow: 7, secretish: 'x', __stxClientPayload: { liveNow: 7 } },
      'console.log(liveNow, secretish)',
    )
    expect(out).toContain('var liveNow = 7')
    expect(out).not.toContain('secretish')
  })

  it('never emits the reserved marker', () => {
    const out = bridge(
      { a: 1, __stxClientPayload: { a: 1 } },
      'console.log(a)',
    )
    expect(out).not.toContain('__stxDeclaredPayload')
  })

  it('still refuses to clobber a name the client declares itself', () => {
    // Declaring a payload must not override client ownership — that would
    // produce a duplicate binding, which is a SyntaxError rather than a
    // shadow.
    const out = bridge(
      { range: '30d', __stxClientPayload: { range: '30d' } },
      'const range = "7d"',
    )
    expect(out).not.toContain('var range')
  })

  it('drops a function from the declared set', () => {
    const out = bridge(
      { fn: () => 1, n: 2, __stxClientPayload: { fn: () => 1, n: 2 } },
      'const x = 1',
    )
    expect(out).toContain('var n = 2')
    expect(out).not.toContain('var fn')
  })

  it('carries objects and arrays', () => {
    const out = bridge(
      { cfg: { a: [1, 2] }, __stxClientPayload: { cfg: { a: [1, 2] } } },
      'const x = 1',
    )
    expect(out).toContain('var cfg = {"a":[1,2]}')
  })

  it('still escapes markup in a declared value', () => {
    // The declaration must not become a way to break out of the script tag.
    const out = bridge(
      { html: '</script><b>', __stxClientPayload: { html: '</script><b>' } },
      'const x = 1',
    )
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c')
  })
})

describe('scraping is unchanged when nothing is declared (#1868)', () => {
  it('publishes a referenced name', () => {
    const out = bridge({ liveNow: 7 }, 'console.log(liveNow)')
    expect(out).toContain('var liveNow = 7')
  })

  it('does not publish an unreferenced name', () => {
    // Control: without a declaration the reference check still gates the
    // payload, which is what keeps existing pages from growing.
    const out = bridge({ liveNow: 7 }, 'const n = 1')
    expect(out).toBe('')
  })

  it('still skips a name the client declares', () => {
    const out = bridge({ range: '30d' }, 'const range = "7d"')
    expect(out).not.toContain('var range')
  })

  it('still honours the __ opt-out', () => {
    const out = bridge({ __secret: 'x' }, 'console.log(__secret)')
    expect(out).toBe('')
  })
})
