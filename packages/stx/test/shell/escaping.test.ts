/**
 * The document shell escapes everything it interpolates (stacksjs/stx#1792,
 * part one item 4).
 *
 * `<title>` is RCDATA: markup inside it is not parsed, but the closing tag IS
 * still recognised. So a title carrying `</title><script>…` ends the element
 * early and the remainder is parsed as markup — a stored XSS, since a page
 * title is routinely user-influenced (frontmatter, a server script, a database
 * row, a search query echoed back).
 *
 * Nothing about it was loud: the page rendered, the title looked wrong only if
 * you read the source, and no warning existed anywhere.
 *
 * The same unescaped interpolation applied to every meta, link and script
 * attribute the shell emits, and to bodyClass and bodyAttrs — so the test
 * sweeps all of them rather than only the reported one.
 *
 * Deliberately NOT escaped, and asserted as such below: `headRaw` and inline
 * script `content`. Both are documented raw escape hatches whose entire purpose
 * is to emit markup verbatim.
 */
import { describe, expect, it } from 'bun:test'
import { generateDocumentShell, hasDocumentShell, injectConfigHeadTags } from '../../src/document-shell'

const BREAKOUT = `x</title><script>alert(1)</script>`
const ATTR_BREAKOUT = `" onload="alert(1)`

function shell(head: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  return generateDocumentShell('<main>body</main>', head as never, options as never)
}

describe('title escaping', () => {
  it('does not let a title close its own element', () => {
    const out = shell({ title: BREAKOUT })
    expect(out).not.toContain('<script>alert(1)</script>')
    expect(out).toContain('&lt;/title&gt;')
  })

  it('escapes a title supplied as an option, not just from config', () => {
    // Both paths reach the same interpolation, and options wins — so a fix that
    // only covered the config path would leave the more common one open.
    const out = shell({ title: 'safe' }, { title: BREAKOUT })
    expect(out).not.toContain('<script>alert(1)</script>')
  })

  it('leaves an ordinary title readable', () => {
    expect(shell({ title: 'Dashboard' })).toContain('<title>Dashboard</title>')
  })

  it('escapes an ampersand without double-encoding an existing entity', () => {
    const out = shell({ title: 'Tips & Tricks' })
    expect(out).toContain('<title>Tips &amp; Tricks</title>')
    expect(out).not.toContain('&amp;amp;')
  })
})

describe('attribute escaping', () => {
  it('escapes meta attribute values', () => {
    const out = shell({ meta: [{ name: 'description', content: ATTR_BREAKOUT }] })
    expect(out).not.toContain('onload="alert(1)"')
    expect(out).toContain('&quot;')
  })

  it('escapes link attribute values', () => {
    const out = shell({ link: [{ rel: 'stylesheet', href: ATTR_BREAKOUT }] })
    expect(out).not.toContain('onload="alert(1)"')
  })

  it('escapes script tag attribute values', () => {
    const out = shell({ script: [{ src: ATTR_BREAKOUT }] })
    expect(out).not.toContain('onload="alert(1)"')
  })

  it('escapes bodyClass and bodyAttrs', () => {
    const out = shell({ bodyClass: ATTR_BREAKOUT, bodyAttrs: { 'data-x': ATTR_BREAKOUT } })
    expect(out).not.toContain('onload="alert(1)"')
  })

  it('escapes the same values when injected into an existing head', () => {
    // injectConfigHeadTags is the other emission path, and it had the identical
    // bug — a fix covering only generateDocumentShell would miss every page
    // that brought its own <head>.
    const page = '<!DOCTYPE html><html><head><title>t</title></head><body></body></html>'
    const out = injectConfigHeadTags(page, { meta: [{ name: 'description', content: ATTR_BREAKOUT }] } as never)
    expect(out).not.toContain('onload="alert(1)"')
  })

  it('keeps ordinary attribute values intact', () => {
    const out = shell({ meta: [{ name: 'description', content: 'A normal description' }] })
    expect(out).toContain('content="A normal description"')
  })
})

describe('documented raw escape hatches stay raw', () => {
  it('does not escape headRaw', () => {
    // Its whole purpose is verbatim markup; escaping it would break every app
    // that uses it, and it is author-controlled by definition.
    const out = shell({ headRaw: '<link rel="preconnect" href="https://cdn.example.com">' })
    expect(out).toContain('<link rel="preconnect" href="https://cdn.example.com">')
  })

  it('does not escape inline script content', () => {
    const out = shell({ script: [{ content: 'window.__X__ = 1 < 2' }] })
    expect(out).toContain('window.__X__ = 1 < 2')
  })
})

/**
 * Shell detection is anchored (stacksjs/stx#1792, part one item 3).
 *
 * It used to be an unanchored `/<html[\s>]/i.test(html)`, so a DOCTYPE or an
 * html tag mentioned ANYWHERE — including inside a comment — reported a shell
 * that was not there.
 *
 * The cascade was silent and severe: no shell means no `<head>`, so the cloak
 * style never ships and every element stx deliberately hid renders VISIBLE; no
 * `<meta name="stx-layout">`; and without that the router's document sniff
 * fails and every navigation hard-reloads. The reporter ended up writing a
 * house rule telling authors not to name the tag in prose — a framework needing
 * a prose workaround in comments has a bug, not a convention.
 */
describe('shell detection is anchored', () => {
  it('ignores a comment that names the html tag', () => {
    expect(hasDocumentShell('<!-- see the root <html> element -->\n<main>hi</main>')).toBe(false)
  })

  it('ignores a comment that names a doctype', () => {
    expect(hasDocumentShell('<!-- add <!DOCTYPE html> at the top -->\n<main>hi</main>')).toBe(false)
  })

  it('ignores a doctype inside page content, such as a code sample', () => {
    // Docs pages and install snippets legitimately print one.
    expect(hasDocumentShell('<main><pre><!DOCTYPE html></pre></main>')).toBe(false)
  })

  it('still detects a real document', () => {
    expect(hasDocumentShell('<!DOCTYPE html><html><head></head><body></body></html>')).toBe(true)
    expect(hasDocumentShell('\n  <html><head></head><body></body></html>')).toBe(true)
  })

  it('steps over a leading comment, script or style before the wrapper', () => {
    // All three legitimately precede the wrapper in real output; treating such
    // a document as a fragment would wrap it and nest <html>.
    expect(hasDocumentShell('<!-- generated --><!DOCTYPE html><html></html>')).toBe(true)
    expect(hasDocumentShell('<script>var a=1</script><html></html>')).toBe(true)
    expect(hasDocumentShell('<style>body{margin:0}</style><html><body></body></html>')).toBe(true)
  })

  it('wraps a fragment whose comment mentions the tag', () => {
    // The end-to-end consequence: this used to come back unwrapped, with no
    // <head> and therefore no cloak style.
    const out = generateDocumentShell('<!-- the root <html> element --><main>hi</main>', {} as never, {} as never)
    expect(out).toContain('<head')
    expect(out).toContain('data-stx-cloak')
  })
})
