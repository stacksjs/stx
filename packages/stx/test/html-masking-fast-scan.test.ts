import { describe, expect, it } from 'bun:test'
import { scanAtElementPosition } from '../src/html-masking'

function markTokens(html: string): string[] {
  return scanAtElementPosition(html, (source, i) =>
    source.startsWith('<mark>', i) ? i + '<mark>'.length : -1).map(item => item.token)
}

describe('element-position mask scan', () => {
  it('finds only real element positions across long text', () => {
    const html = `<div title="<mark>">${'plain text '.repeat(1000)}<mark></div>`

    expect(markTokens(html)).toEqual(['<mark>'])
  })

  it('skips comments and raw script/style text', () => {
    const html = '<!-- <mark> --><SCRIPT>const x = "<mark>"</SCRIPT><style>.x::after{content:"<mark>"}</style><mark>'

    expect(markTokens(html)).toEqual(['<mark>'])
  })

  it('treats an unclosed script as opaque through the document end', () => {
    expect(markTokens('<script>const x = "<mark>"')).toEqual([])
  })
})
