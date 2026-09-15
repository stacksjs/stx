import { describe, expect, it } from 'bun:test'
import { mightContainOwnTextMustache, scanAtElementPosition } from '../src/html-masking'

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

describe('mustache preflight', () => {
  it('ignores browser scripts, styles, comments, and attributes', () => {
    const html = '<main title="{{ attr }}"><!-- {{ note }} --><script>const x = "{{ runtime }}"</script><style>.x { color: red }</style>Ready</main>'

    expect(mightContainOwnTextMustache(html)).toBe(false)
  })

  it('keeps delimiters split across child elements on the cloak path', () => {
    expect(mightContainOwnTextMustache('<p>{<b>x</b>{ name }<i>x</i>}</p>')).toBe(true)
  })

  it('is conservative across unrelated text nodes', () => {
    expect(mightContainOwnTextMustache('<p>{{ start</p><p>end }}</p>')).toBe(true)
  })
})
