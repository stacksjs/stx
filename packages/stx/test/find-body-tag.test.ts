import { describe, expect, it } from 'bun:test'
import { findBodyOpenTag, hasBodyOpenTag, replaceBodyOpenTag } from '../src/find-body-tag'

/**
 * The first `<body` in a document is not necessarily a tag.
 *
 * process.ts stamps `data-stx="__stx_setup_…"` onto the body open tag, and the
 * runtime invokes a page's setup function by reading that attribute. It used
 * to find the tag with a bare `/<body([^>]*)>/`, which takes the first match
 * anywhere — including inside a `<style>` block, a `<script>`, or an HTML
 * comment.
 *
 * A layout whose CSS comment said "inherits from <body>" therefore had
 * data-stx stamped into the comment. The real body never got it, the setup
 * function shipped and parsed and was never called, and every `:if`,
 * `:hidden`, `@click` and `{{ signal() }}` on the page went inert with no
 * error. runtime-injection.ts had the same shape and would inject the signals
 * runtime script inside the style block, where it never runs.
 */

const REAL_CASE = `<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    /*
     * Re-assert colour, not just the variables. colour inherits as a computed
     * value from <body>, so a heading with no rule of its own keeps the page
     * ink no matter what --paper-rgb says here.
     */
    .on-media { color: rgb(var(--paper-rgb)); }
  </style>
</head>
<body class="page">
  <main>x</main>
</body>
</html>`

describe('findBodyOpenTag', () => {
  it('skips the mention inside a style block that broke a whole site', () => {
    const match = findBodyOpenTag(REAL_CASE)

    expect(match).not.toBeNull()
    expect(match!.tag).toBe('<body class="page">')
    expect(match!.attrs).toBe(' class="page"')
    // The style block sits earlier in the document; the match must be after it.
    expect(match!.index).toBeGreaterThan(REAL_CASE.indexOf('</style>'))
  })

  it('skips a mention inside an HTML comment', () => {
    const html = '<!-- the <body> element owns this --><body id="real">x</body>'
    expect(findBodyOpenTag(html)!.tag).toBe('<body id="real">')
  })

  it('skips a mention inside a script', () => {
    const html = `<script>var s = "<body>";</script><body id="real">x</body>`
    expect(findBodyOpenTag(html)!.tag).toBe('<body id="real">')
  })

  it('skips several text regions in a row', () => {
    const html = [
      '<!-- <body> -->',
      '<style>/* <body> */</style>',
      '<script>"<body>"</script>',
      '<body data-real="1">x</body>',
    ].join('\n')

    expect(findBodyOpenTag(html)!.attrs).toBe(' data-real="1"')
  })

  it('finds a plain body tag with no attributes', () => {
    const match = findBodyOpenTag('<html><body>x</body></html>')
    expect(match!.tag).toBe('<body>')
    expect(match!.attrs).toBe('')
  })

  it('matches case-insensitively, as HTML does', () => {
    expect(findBodyOpenTag('<HTML><BODY CLASS="x">y</BODY>')!.attrs).toBe(' CLASS="x"')
  })

  it('does not mistake a longer tag name for body', () => {
    // `<bodyguard>` is not `<body>`; the \b in the pattern is what stops it.
    expect(findBodyOpenTag('<bodyguard></bodyguard>')).toBeNull()
  })

  it('returns null when there is no body tag at all', () => {
    expect(findBodyOpenTag('<div>fragment</div>')).toBeNull()
    expect(hasBodyOpenTag('<div>fragment</div>')).toBe(false)
  })

  it('returns null when only text regions mention it', () => {
    expect(findBodyOpenTag('<style>/* <body> */</style><div>x</div>')).toBeNull()
  })

  it('treats an unterminated style block as swallowing the rest', () => {
    // The browser sees everything after it as CSS text, so there is no tag.
    expect(findBodyOpenTag('<style>/* <body> */ <body>real</body>')).toBeNull()
  })
})

describe('replaceBodyOpenTag', () => {
  it('stamps the real tag, not the one in the comment', () => {
    const out = replaceBodyOpenTag(REAL_CASE, (_tag, attrs) => `<body${attrs} data-stx="__stx_setup_1_2">`)

    expect(out).toContain('<body class="page" data-stx="__stx_setup_1_2">')
    // The comment is left exactly as the author wrote it.
    expect(out).toContain('value from <body>, so a heading')
    expect(out.match(/data-stx=/g)).toHaveLength(1)
  })

  it('preserves existing attributes', () => {
    const out = replaceBodyOpenTag('<body class="a" id="b">x</body>', (_t, attrs) => `<body${attrs} data-stx="s">`)
    expect(out).toBe('<body class="a" id="b" data-stx="s">x</body>')
  })

  it('can inject after the tag instead of rewriting it', () => {
    const out = replaceBodyOpenTag('<style>/* <body> */</style><body>x</body>', tag => `${tag}\n<script>r()</script>`)

    // The script lands after the real body, never inside the style block.
    expect(out.indexOf('<script>r()')).toBeGreaterThan(out.indexOf('</style>'))
    expect(out).toContain('<body>\n<script>r()</script>x')
  })

  it('leaves a fragment untouched', () => {
    const fragment = '<div>no body here</div>'
    expect(replaceBodyOpenTag(fragment, () => '<body>')).toBe(fragment)
  })
})

/**
 * Where a skipped region ENDS.
 *
 * The close was matched with `indexOf('</script>')`, an exact string. But an
 * end tag may carry whitespace before its `>` — `</script >` is legal HTML and
 * browsers close on it — so the scan read the script as unterminated, which
 * this module treats as "the document has no real body tag" and answers null.
 * The caller then skips its injection silently: no `data-stx` stamp, no
 * runtime script, an inert page and no error.
 *
 * `conditionals.ts` masks scripts with `<\/script\s*>` and would have skipped
 * the same region correctly, so the two parsers disagreed about where a script
 * ends. That disagreement is the bug, independently of which one is right.
 */
describe('a close tag may carry whitespace', () => {
  it('finds the body after a script closed with </script >', () => {
    const html = `<html><head><script>const t = '<body>'</script >
</head><body class="real">x</body></html>`
    const match = findBodyOpenTag(html)

    expect(match).not.toBeNull()
    expect(match!.tag).toBe('<body class="real">')
  })

  it('finds the body after a style closed with </style >', () => {
    const html = `<html><head><style>/* see <body> */</style	>
</head><body id="real">x</body></html>`
    const match = findBodyOpenTag(html)

    expect(match).not.toBeNull()
    expect(match!.tag).toBe('<body id="real">')
  })

  it('still refuses a genuinely unterminated region', () => {
    // Everything after an unclosed script is script text to a browser, so
    // there is no real body tag to find and answering null is correct.
    expect(findBodyOpenTag(`<html><script>const t = '<body>'</html>`)).toBeNull()
  })
})

/**
 * The scan is linear in the document.
 *
 * It used to do `html.slice(cursor)` per iteration and `html.toLowerCase()`
 * per skipped region — two full copies of the document for every script and
 * style tag walked past. Measured over a page built from repeated script and
 * style blocks: 281 KB took 1471 ms to find one tag, against 12 ms now.
 *
 * The size below is chosen from that measurement rather than guessed. An
 * earlier version of this test used a 42 KB document, where the quadratic
 * implementation still finished in 29 ms — comfortably inside any threshold a
 * reasonable person would write, so the test passed against the bug it was
 * written to catch. It is only decisive once the document is large enough for
 * the two curves to separate.
 */
describe('scanning does not copy the document', () => {
  it('walks a large document with many skipped regions quickly', () => {
    const block = `<script>const s = 'a <body> mention'</script><style>/* <body> */</style>`
    const html = `<html><head>${block.repeat(4000)}</head><body class="real">x</body></html>`

    expect(html.length).toBeGreaterThan(250_000)

    const started = performance.now()
    const match = findBodyOpenTag(html)
    const elapsed = performance.now() - started

    expect(match!.tag).toBe('<body class="real">')
    // Quadratic scanning takes ~1470 ms here; linear takes ~12 ms.
    expect(elapsed).toBeLessThan(400)
  })
})
