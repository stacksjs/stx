/**
 * Regression: a fragment page (no <html>/<head>/<body> of its own) writes its
 * font <link>s and scoped <style> at the top of the file. Those used to be
 * emitted verbatim into <body>, which renders fine on a direct load — browsers
 * honour <link>/<style> in body — but breaks SPA navigation, because the router
 * reconciles `head style` / `head link[rel=stylesheet]` only. On a
 * container-only swap the incoming page's CSS was never applied, so the page
 * painted unstyled after a click and correct after a reload.
 *
 * Also covers <meta>: a fragment declaring `stx-layout` needs it in <head> for
 * the router's layout-group comparison to read it off the fetched document.
 */
import { describe, expect, it } from 'bun:test'
import { generateDocumentShell, hoistLeadingHeadTags } from '../../src/document-shell'

const FRAGMENT = `
<meta name="stx-layout" content="auth">
<link rel="stylesheet" href="/fonts.css">
<style>:root { --accent: #46d3c0 }</style>

<main class="flex">form</main>`

describe('hoistLeadingHeadTags', () => {
  it('hoists the leading link/meta/style run and leaves the markup behind', () => {
    const { body, hoisted } = hoistLeadingHeadTags(FRAGMENT)
    expect(hoisted).toHaveLength(3)
    expect(body).toContain('<main class="flex">')
    expect(body).not.toContain('<style>')
    expect(body).not.toContain('<link')
    expect(body).not.toContain('<meta')
  })

  it('leaves a <style> that sits next to its markup alone', () => {
    const { body, hoisted } = hoistLeadingHeadTags('<main>x</main>\n<style>a{}</style>')
    expect(hoisted).toHaveLength(0)
    expect(body).toContain('<style>a{}</style>')
  })

  it('steps over a leading <script> without moving it', () => {
    const { body, hoisted } = hoistLeadingHeadTags('<script>var a = 1</script>\n<link rel="stylesheet" href="/a.css">\n<main>x</main>')
    expect(hoisted).toEqual(['<link rel="stylesheet" href="/a.css">'])
    expect(body).toContain('<script>var a = 1</script>')
    expect(body).toContain('<main>x</main>')
  })

  it('does not hoist a <style> that only appears inside a script string', () => {
    const src = '<script>var s = "<style>x</style>"</script><main>y</main>'
    const { body, hoisted } = hoistLeadingHeadTags(src)
    expect(hoisted).toHaveLength(0)
    expect(body).toBe(src)
  })

  it('steps over comments', () => {
    const { body, hoisted } = hoistLeadingHeadTags('<!-- hi -->\n<style>a{}</style>\n<div>x</div>')
    expect(hoisted).toHaveLength(1)
    expect(body).toContain('<!-- hi -->')
    expect(body).toContain('<div>x</div>')
  })

  it('is a no-op when there is nothing to hoist', () => {
    const { body, hoisted } = hoistLeadingHeadTags('<main>hello</main>')
    expect(hoisted).toHaveLength(0)
    expect(body).toBe('<main>hello</main>')
  })
})

describe('generateDocumentShell (fragment head tags)', () => {
  it('puts the fragment\'s own link/meta/style in <head>, not <body>', () => {
    const out = generateDocumentShell(FRAGMENT)
    const headEnd = out.indexOf('</head>')

    for (const needle of ['/fonts.css', '--accent: #46d3c0', 'stx-layout'])
      expect(out.indexOf(needle)).toBeLessThan(headEnd)

    // the markup still renders in the body
    expect(out.indexOf('<main class="flex">')).toBeGreaterThan(headEnd)
  })

  it('keeps the page style after Crosswind so the page still wins the cascade', () => {
    const out = generateDocumentShell(FRAGMENT, {}, { styles: ['<style data-crosswind="generated">.flex{display:flex}</style>'] })
    expect(out.indexOf('data-crosswind')).toBeLessThan(out.indexOf('--accent: #46d3c0'))
  })

  it('leaves a page with no leading head tags unchanged in the body', () => {
    const out = generateDocumentShell('<main>plain</main>')
    expect(out).toContain('<main>plain</main>')
  })
})
