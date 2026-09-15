import { beforeEach, describe, expect, it } from 'bun:test'
import { clearScriptScanCache, scanScriptTags } from '../../src/signal-processing'

describe('scanScriptTags', () => {
  it('returns real script elements in browser order', () => {
    const html = '<script client>one()</script><div>x</div><script type="module">two()</script>'

    expect(scanScriptTags(html).map(script => ({
      attrs: script.attrs.trim(),
      body: script.body,
    }))).toEqual([
      { attrs: 'client', body: 'one()' },
      { attrs: 'type="module"', body: 'two()' },
    ])
  })

  it('ignores script-like text in comments, attributes, and style bodies', () => {
    const html = `
      <!-- classes live in <script client> state -->
      <div title="<script>attribute()</script>"></div>
      <style>.note::after { content: '<script>style()</script>'; }</style>
      <script client>real()</script>
    `

    const scripts = scanScriptTags(html)
    expect(scripts).toHaveLength(1)
    expect(scripts[0].body).toBe('real()')
  })

  it('does not scan beyond an unclosed opaque region', () => {
    expect(scanScriptTags('<!-- open <script>comment()</script>')).toEqual([])
    expect(scanScriptTags('<style>.x { content: "<script>style()</script>" }')).toEqual([])
  })

  it('applies attribute filters without losing later scripts', () => {
    const html = '<script server>serverOnly()</script><script client>clientOnly()</script>'
    const scripts = scanScriptTags(html, { skipAttrs: /\bserver\b/g })

    expect(scripts).toHaveLength(1)
    expect(scripts[0].body).toBe('clientOnly()')
  })
})

/** Big enough to take the cached path (the scan memo starts at 64KB). */
function padded(body: string): string {
  return `<html><body>${'<p>filler filler filler</p>\n'.repeat(3000)}${body}</body></html>`
}

const THREE_SCRIPTS = '<script server>s()</script><script client>c()</script><script type="application/json">{}</script>'

describe('scanScriptTags memo', () => {
  beforeEach(() => {
    clearScriptScanCache()
  })

  it('gives each filter its own subset of one shared walk', () => {
    // The memo stores the UNFILTERED walk and applies skipAttrs afterwards, so
    // the first caller's filter must not narrow what a later caller sees.
    const html = padded(THREE_SCRIPTS)
    expect(html.length).toBeGreaterThan(65536)

    expect(scanScriptTags(html, { skipAttrs: /\bserver\b/ }).map(s => s.body)).toEqual(['c()', '{}'])
    expect(scanScriptTags(html, { skipAttrs: /application\/json/ }).map(s => s.body)).toEqual(['s()', 'c()'])
    expect(scanScriptTags(html).map(s => s.body)).toEqual(['s()', 'c()', '{}'])
  })

  it('reflects an edit rather than serving the previous document', () => {
    const html = padded(THREE_SCRIPTS)
    expect(scanScriptTags(html).map(s => s.body)).toEqual(['s()', 'c()', '{}'])

    const edited = html.replace('c()', 'edited()')
    expect(scanScriptTags(edited).map(s => s.body)).toEqual(['s()', 'edited()', '{}'])
    expect(scanScriptTags(html).map(s => s.body)).toEqual(['s()', 'c()', '{}'])
  })

  it('resets lastIndex so a global filter matches on every call', () => {
    const html = padded(THREE_SCRIPTS)
    const skipAttrs = /\bserver\b/g

    expect(scanScriptTags(html, { skipAttrs })).toHaveLength(2)
    expect(scanScriptTags(html, { skipAttrs })).toHaveLength(2)
  })

  it('hands back an array the caller owns', () => {
    const html = padded(THREE_SCRIPTS)
    scanScriptTags(html).length = 0

    expect(scanScriptTags(html)).toHaveLength(3)
  })

  it('freezes records so a mutation cannot travel into a later scan', () => {
    const html = padded(THREE_SCRIPTS)
    const script = scanScriptTags(html)[0]

    expect(() => {
      ;(script as { body: string }).body = 'hijacked()'
    }).toThrow()
    expect(scanScriptTags(html)[0].body).toBe('s()')
  })

  it('keeps working past the entry cap', () => {
    const bodies = ['a()', 'b()', 'c()', 'd()', 'e()', 'f()']
    const docs = bodies.map(body => padded(`<script client>${body}</script>`))

    for (const doc of docs) expect(scanScriptTags(doc)).toHaveLength(1)
    // The cap evicts oldest-first; an evicted document must be re-walked
    // correctly rather than answered from a neighbour's entry.
    for (let i = 0; i < docs.length; i++)
      expect(scanScriptTags(docs[i])[0].body).toBe(bodies[i])
  })
})
