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

  it('leaves fragments without a head and incomplete style elements untouched', () => {
    const fragment = '<article>Hello</article><style>.page {}</style>'
    expect(hoistDocumentStyles(fragment)).toBe(fragment)
    const incomplete = '<html><head></head><body><style>.page {}'
    expect(hoistDocumentStyles(incomplete)).toBe(incomplete)
  })
})
