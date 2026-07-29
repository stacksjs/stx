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
import { findMarkupIndexOutsideScripts, rewriteStxImportSpecifiers } from '../src/signal-processing'

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

/**
 * Regression focus: the merged setup destructures the stx API from
 * `window.stx`, so `import { state }` needs no runtime binding. But when the
 * bundler inlines a composable that imports a name the outer script already
 * binds, it renames the local and emits `import { state as state2 }`. The old
 * rewrite discarded the whole line, leaving `state2` unbound — the setup threw
 * `state2 is not defined` on its first call, which aborted hydration for the
 * entire page rather than just that composable.
 */
describe('rewriteStxImportSpecifiers', () => {
  it('preserves a renamed specifier as a local alias', () => {
    const out = rewriteStxImportSpecifiers(' state as state2 ')

    expect(out).toStartWith('var state2 = state;')
  })

  it('emits no binding for plain specifiers already destructured', () => {
    const out = rewriteStxImportSpecifiers(' state, derived ')

    expect(out).not.toContain('var ')
    expect(out).toContain('stx import stripped')
  })

  it('carries every renamed specifier in one declaration', () => {
    const out = rewriteStxImportSpecifiers('state as state2, derived, effect as effect3')

    expect(out).toStartWith('var state2 = state, effect3 = effect;')
  })

  it('erases type-only specifiers, which have no runtime binding', () => {
    expect(rewriteStxImportSpecifiers('type Signal, type Ref as R')).not.toContain('var ')
    expect(rewriteStxImportSpecifiers('type Signal, state as state2')).toStartWith('var state2 = state;')
  })

  it('ignores a self-rename, which would redeclare the destructured name', () => {
    expect(rewriteStxImportSpecifiers('state as state')).not.toContain('var ')
  })

  it('tolerates trailing commas and whitespace', () => {
    expect(rewriteStxImportSpecifiers(' state as state2 , ')).toStartWith('var state2 = state;')
    expect(rewriteStxImportSpecifiers('   ')).toBe('// [stx import stripped — resolved via window.stx in __stx_setup]')
  })

  it('can repeat an alias chosen by independently bundled composables', () => {
    const first = rewriteStxImportSpecifiers('state as state2')
    const second = rewriteStxImportSpecifiers('state as state2')

    expect(() => new Function('state', `${first}\n${second}`)).not.toThrow()
  })
})
