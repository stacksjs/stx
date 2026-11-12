import { describe, expect, it } from 'bun:test'
import { insertBeforeBodyClose } from '../src/body-close'
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
