/**
 * A `prop={expr}` attribute value is consumed WHOLE (stacksjs/stx#1956).
 *
 * It is not stx syntax -- `:prop="expr"` is -- but the parsers read an unquoted
 * value "until whitespace", which ended the value at `{{` and turned the rest
 * of the object literal into attribute NAMES: `name:`, `'John`, `Doe'`,
 * `notifications:`, `true`, `}}`. Those became render-context keys, and `true`
 * is identifier-shaped but reserved, so it reached `new Function` as a
 * parameter name and took down the whole component's `<script server>`
 * (that half fixed in ffeaec7058).
 *
 * The value still arrives as a STRING, braces included. Whether stx should
 * evaluate it is an open question on #1956; what must not happen is a tag
 * shattering into junk attributes.
 */
import { describe, expect, it } from 'bun:test'
import { findComponentTags, parseMultilineAttributes } from '../src/component-processing'

const Q = String.fromCharCode(39)

describe('braced attribute values are read as one token', () => {
  it('keeps a multi-line object literal together and still sees later attributes', () => {
    const attrs = [
      'id="profileForm"',
      '  initialValues={{',
      `    name: ${Q}John Doe${Q},`,
      '    notifications: true',
      '  }}',
      '  onSubmit={handleEditProfile}',
      '  className="space-y-4"',
    ].join('\n')

    const props = parseMultilineAttributes(attrs)

    expect(Object.keys(props)).toEqual(['id', 'initialValues', 'onSubmit', 'className'])
    expect(props.initialValues).toContain('notifications: true')
    expect(props.onSubmit).toBe('{handleEditProfile}')
    expect(props.className).toBe('space-y-4')
    // The shattering this guards against produced keys like these.
    for (const junk of ['name:', `${Q}John`, 'notifications:', 'true', '}}'])
      expect(Object.keys(props)).not.toContain(junk)
  })

  it('handles nested braces and braces inside quotes', () => {
    const props = parseMultilineAttributes(
      `config={{ a: { b: 1 }, label: "}" }} after="kept"`,
    )

    expect(Object.keys(props)).toEqual(['config', 'after'])
    expect(props.config).toBe('{{ a: { b: 1 }, label: "}" }}')
    expect(props.after).toBe('kept')
  })

  it('degrades to one bad prop when the braces never close', () => {
    const props = parseMultilineAttributes('broken={{ a: 1 unclosed')

    expect(Object.keys(props)).toEqual(['broken'])
  })

  it('carries the whole attribute span through the component tag matcher', () => {
    const html = `<div><Form
  id="profileForm"
  initialValues={{
    name: ${Q}John Doe${Q}
  }}
  className="space-y-4"
>inner</Form></div>`

    const tags = findComponentTags(html, /[A-Z][a-zA-Z0-9]*/)
    expect(tags).toHaveLength(1)

    const props = parseMultilineAttributes(tags[0].attributes)
    expect(Object.keys(props)).toEqual(['id', 'initialValues', 'className'])
  })
})
