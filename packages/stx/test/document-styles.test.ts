import { describe, expect, it } from 'bun:test'
import { hoistDocumentStyles } from '../src/document-styles'
import { processDirectives } from '../src/process'

// This render boundary catches first-paint ordering, without relying on a
// browser's network buffering to happen to reveal the flash.
describe('styles before first paint', () => {
  it('renders authored body CSS in the head, in cascade order', async () => {
    const html = await processDirectives('<html><head><style>.shell { color: red }</style></head><body><main>Hello</main><style>.one { color: blue }</style><style media="print" nonce="test">.two { color: green }</style></body></html>', {}, 'page.stx', {})
    const head = html.slice(0, html.indexOf('</head>'))
    const body = html.slice(html.indexOf('<body'))
    expect(head).toContain('.one { color: blue }')
    expect(head).toContain('media="print" nonce="test"')
    expect(head.indexOf('.shell')).toBeLessThan(head.indexOf('.one'))
    expect(head.indexOf('.one')).toBeLessThan(head.indexOf('.two'))
    expect(body).not.toContain('<style')
    expect(body).toContain('<main>Hello</main>')
  })

  it('leaves scripts, comments, quoted attributes and inert or local styles alone', () => {
    const local = '<script>const css = "<style>.script {}</style>"</script><!-- <style>.comment {}</style> --><div title="<style>.attribute {}</style>"></div><template shadowrootmode="open"><template><style>.nested {}</style></template><style>.shadow {}</style></template><svg><style>.svg {}</style></svg><noscript><style>.noscript {}</style></noscript>'
    const html = hoistDocumentStyles(`<html><head></head><body>${local}<style>.page {}</style></body></html>`)
    expect(html).toContain(`<body>${local}</body>`)
    expect(html.slice(0, html.indexOf('</head>'))).toContain('<style>.page {}</style>')
    expect(hoistDocumentStyles(html)).toBe(html)
  })

  it('preserves literal CSS in RCDATA/raw text and styles with an implicit scope root', () => {
    const local = '<textarea><template><style>.literal {}</style></textarea><xmp><style>.example {}</style></xmp><section><style>@scope { p { color: red } }</style></section>'
    const html = hoistDocumentStyles(`<html><head></head><body>${local}<style>.page {}</style></body></html>`)
    expect(html).toContain(`<body>${local}</body>`)
    expect(html.slice(0, html.indexOf('</head>'))).toContain('<style>.page {}</style>')
    expect(hoistDocumentStyles('<html><head></head><body><plaintext><style>literal')).toBe('<html><head></head><body><plaintext><style>literal')
  })

  it('hoists a stylesheet repeated by each instance of a component once (#2219)', () => {
    // A component's <style> is the same in every instance, and only one
    // carrying data-stx-scoped used to be deduplicated.
    const row = '<style data-native-exclude>.row {}</style><div class="row">x</div>'
    const html = hoistDocumentStyles(`<html><head></head><body>${row.repeat(3)}<style>.other {}</style>${row}</body></html>`)
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head.split('.row {}').length - 1).toBe(1)
    // Cascade order is the first appearance of each.
    expect(head.indexOf('.row {}')).toBeLessThan(head.indexOf('.other {}'))
    expect(html.slice(html.indexOf('<body'))).not.toContain('<style')
    expect(html.split('<div class="row">x</div>').length - 1).toBe(4)
  })

  it('keeps a copy that differs, and one inside a template or script', () => {
    const local = '<template><style>.row {}</style></template><script>const css = "<style>.row {}</style>"</script>'
    const html = hoistDocumentStyles(`<html><head></head><body><style>.row {}</style>${local}<style>.row { color: red }</style></body></html>`)
    expect(html).toContain(`<body>${local}</body>`)
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toContain('<style>.row {}</style>')
    expect(head).toContain('<style>.row { color: red }</style>')
  })

  it('leaves fragments without a head and incomplete style elements untouched', () => {
    const fragment = '<article>Hello</article><style>.page {}</style>'
    expect(hoistDocumentStyles(fragment)).toBe(fragment)
    const incomplete = '<html><head></head><body><style>.page {}'
    expect(hoistDocumentStyles(incomplete)).toBe(incomplete)
  })
})
