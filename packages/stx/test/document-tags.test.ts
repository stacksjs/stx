import { describe, expect, it } from 'bun:test'
import { bodyCloseIndex, headCloseIndex, insertBeforeBodyClose, insertBeforeHeadClose } from '../src/document-tags'
import { injectRouterScript } from '../src/site-builder/router'

// A component that writes a document of its own carries the closing tag in a string.
const PAGE = '<html><body><script>const doc = `<body>${x}</body></html>`; run(doc)</script>\n<p>page</p></body></html>'

describe('insertBeforeBodyClose', () => {
  it('uses the last closing tag, not one inside a script', () => {
    const out = insertBeforeBodyClose(PAGE, '<i>added</i>')
    expect(out).toContain('`<body>${x}</body></html>`; run(doc)</script>')
    expect(out.endsWith('<i>added</i>\n</body></html>')).toBe(true)
  })

  it('matches the tag in any case', () => {
    expect(insertBeforeBodyClose('<BODY>a</BODY>', '<i></i>')).toBe('<BODY>a<i></i>\n</BODY>')
  })

  it('appends when the document has no closing tag', () => {
    expect(insertBeforeBodyClose('<p>a</p>', '<i></i>')).toBe('<p>a</p>\n<i></i>')
  })
})

describe('site build router injection', () => {
  it('leaves a script that contains a closing body tag whole', async () => {
    const out = await injectRouterScript(PAGE)
    expect(out).toContain('const doc = `<body>${x}</body></html>`; run(doc)</script>')
    expect(out.lastIndexOf('__stxRouterConfig')).toBeGreaterThan(out.indexOf('<p>page</p>'))
  })
})

// The same component, hoisted into the head and followed by a later script that also names the tags.
const HOISTED = '<html><head><script>const doc = `<head></head><body></body>`</script><title>t</title></head><body><p>page</p></body><!-- </body> --><script>const again = "</head></body>"</script></html>'

describe('document tags outside scripts', () => {
  it('finds the head close that is not in a script, whether it is first or last in the text', () => {
    const at = headCloseIndex(HOISTED)
    expect(HOISTED.slice(at - 16, at + 7)).toBe('<title>t</title></head>')
    expect(at).not.toBe(HOISTED.indexOf('</head>'))
    expect(at).not.toBe(HOISTED.lastIndexOf('</head>'))
  })

  it('finds the body close that is not in a script or a comment', () => {
    const at = bodyCloseIndex(HOISTED)
    expect(HOISTED.slice(at - 11, at + 7)).toBe('<p>page</p></body>')
  })

  it('puts a stylesheet link in the real head', () => {
    const out = insertBeforeHeadClose(HOISTED, '<link rel="stylesheet" href="/a.css">')
    expect(out).toContain('<title>t</title><link rel="stylesheet" href="/a.css">\n</head><body>')
    expect(out).toContain('const doc = `<head></head><body></body>`</script>')
  })

  it('reports no tag when the only one is inside a script', () => {
    const fragment = '<script>const a = "</head></body>"</script><p>x</p>'
    expect(headCloseIndex(fragment)).toBe(-1)
    expect(bodyCloseIndex(fragment)).toBe(-1)
    expect(insertBeforeHeadClose(fragment, '<i></i>')).toBe(fragment)
  })
})
