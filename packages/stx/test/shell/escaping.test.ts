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
import { generateDocumentShell, injectConfigHeadTags } from '../../src/document-shell'

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
