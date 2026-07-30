import { describe, expect, it } from 'bun:test'
import { scanScriptTags } from '../../src/signal-processing'

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
