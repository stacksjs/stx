/**
 * Tests for locating markup landmarks around already-inlined runtimes.
 *
 * Regression focus: the setup script was anchored with `String.replace` on
 * `</head>` / `<body>`. By the time it runs, the signals runtime is already
 * inlined as a ~200KB `<script>` whose own source mentions those landmarks in
 * comments (e.g. "script is appended to <body>"). The first textual hit was
 * therefore inside the runtime, so the setup script was spliced into the
 * middle of it and its `</script>` closed the runtime tag early. The rest of
 * the runtime spilled into the document as text, the script never parsed,
 * `window.stx` stayed undefined, and every `{{ }}` / `:for` on the page
 * rendered raw.
 */

import { describe, expect, it } from 'bun:test'
import { findMarkupIndexOutsideScripts } from '../src/signal-processing'

describe('findMarkupIndexOutsideScripts', () => {
  it('skips a landmark that only appears inside an inlined script', () => {
    const html = [
      '<html><head><title>t</title>',
      '<script data-stx-scoped>',
      '  // SPA fallback: during router navigation, script is appended to <body>',
      '</script>',
      '</head><body class="app"><p>hi</p></body></html>',
    ].join('\n')

    const idx = findMarkupIndexOutsideScripts(html, /<body[^>]*>/i)

    expect(idx).toBeGreaterThan(-1)
    expect(html.slice(idx)).toStartWith('<body class="app">')
  })

  it('skips a landmark that only appears inside a style block', () => {
    const html = `<style>/* </head> */</style></head><body></body>`

    const idx = findMarkupIndexOutsideScripts(html, /<\/head>/i)

    expect(html.slice(idx)).toStartWith('</head><body>')
  })

  it('returns -1 when every match is embedded', () => {
    const html = `<script>var s = "<body>"; // </head>\n</script>`

    expect(findMarkupIndexOutsideScripts(html, /<body[^>]*>/i)).toBe(-1)
    expect(findMarkupIndexOutsideScripts(html, /<\/head>/i)).toBe(-1)
  })

  it('finds a landmark that precedes the script containing a decoy', () => {
    const html = `<head></head><body><script>// <body> decoy</script></body>`

    expect(findMarkupIndexOutsideScripts(html, /<body[^>]*>/i)).toBe(html.indexOf('<body>'))
  })

  it('does not depend on a caller regex carrying lastIndex state', () => {
    const sticky = /<body[^>]*>/gi
    const html = `<script>// <body></script><body id="real">`

    // Called twice with the same global regex: a lastIndex-sensitive
    // implementation returns a different answer the second time.
    const first = findMarkupIndexOutsideScripts(html, sticky)
    const second = findMarkupIndexOutsideScripts(html, sticky)

    expect(first).toBe(html.indexOf('<body id="real">'))
    expect(second).toBe(first)
  })

  it('handles an unterminated script by treating the rest as embedded', () => {
    const html = `<div></div><script>// <body>`

    // No closing tag, so the block regex cannot match: the landmark inside the
    // dangling script is still reported, which is the pre-existing behaviour
    // for malformed input and keeps the helper total.
    expect(findMarkupIndexOutsideScripts(html, /<body[^>]*>/i)).toBe(html.indexOf('<body>'))
  })
})
