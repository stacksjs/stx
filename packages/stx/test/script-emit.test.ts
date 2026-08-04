/**
 * Script bodies are escaped at EMIT time (stacksjs/stx#1792, part one item 2).
 *
 * A `</script>` anywhere inside a script body — in a string, a comment, or a
 * runtime value — ends the element as far as the HTML parser is concerned.
 * Everything after it is painted onto the page as text, and every declaration
 * below it silently does not exist. It hit the reporting codebase twice in
 * production; the second time it took out reveal, rotate, copy, members,
 * alerts, archive and delete on one settings page, and stayed invisible for
 * weeks because every project used for verification happened to take a
 * different branch.
 *
 * The documented workaround is to write `<\/script>` in the source, and it does
 * not work: `transpileTypeScript` runs the block through Bun's transpiler,
 * which normalises the escape away before the browser sees it. So the escape
 * protects the source from stx's own scanners and is then stripped, leaving the
 * HTML parser to apply exactly the rule it was meant to dodge.
 *
 * Escaping on emit is the only place the protection survives, because it
 * happens after the transpiler.
 */
import { describe, expect, it } from 'bun:test'
import { assertNoRawClose, escapeScriptBody } from '../src/script-emit'
import { processScriptSetup } from '../src/signal-processing'

describe('escapeScriptBody', () => {
  it('neutralises a closing tag in a string', () => {
    expect(escapeScriptBody(`const s = '</script>'`)).toBe(`const s = '<\\/script>'`)
  })

  it('neutralises a closing tag in a comment', () => {
    expect(escapeScriptBody('// closing tag: </script>')).toBe('// closing tag: <\\/script>')
  })

  it('is case-insensitive', () => {
    expect(escapeScriptBody('x = "</SCRIPT>"')).toBe('x = "<\\/SCRIPT>"')
  })

  it('handles several occurrences', () => {
    expect(escapeScriptBody('a="</script>";b="</script>"')).toBe('a="<\\/script>";b="<\\/script>"')
  })

  it('is idempotent', () => {
    // An already-escaped body contains no raw closing tag, so a second pass is
    // a no-op rather than a double-escape.
    const once = escapeScriptBody(`const s = '</script>'`)
    expect(escapeScriptBody(once)).toBe(once)
  })

  it('leaves an ordinary body untouched', () => {
    const js = 'const a = 1 < 2\nconst b = x / y'
    expect(escapeScriptBody(js)).toBe(js)
  })

  it('does not disturb an unrelated closing tag', () => {
    // Only the sequence that ends a script element matters.
    const js = `const s = '</div>'`
    expect(escapeScriptBody(js)).toBe(js)
  })
})

describe('assertNoRawClose', () => {
  it('warns when a raw closing tag survives to emit', () => {
    const warnings: string[] = []
    const real = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
    try {
      assertNoRawClose(`const s = '</script>'`, 'test-site', '/app/page.stx')
    }
    finally {
      console.warn = real
    }
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('/app/page.stx')
    expect(warnings[0]).toContain('test-site')
  })

  it('stays silent for a clean body', () => {
    const warnings: string[] = []
    const real = console.warn
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
    try {
      assertNoRawClose('const a = 1', 'test-site')
    }
    finally {
      console.warn = real
    }
    expect(warnings).toEqual([])
  })
})

describe('through the setup emitter', () => {
  it('does not truncate on an install snippet that is itself a script tag', async () => {
    // The reporter's second production hit, reduced: the JavaScript install
    // snippet IS an sdk.js tag, so the client block truncated at that
    // assignment and every control defined below it silently vanished.
    const template = `<script client>
const snippet = '<' + 'script src="/sdk.js"><\\/script>'
const after = state('DEFINED-BELOW-THE-SNIPPET')
</script>
<main><p>{{ after() }}</p></main>`

    const { setupCode } = await processScriptSetup(template, '/app/settings.stx')
    const body = setupCode ?? ''
    const beforeClosing = body.slice(0, body.lastIndexOf('</script>'))

    // Nothing inside the emitted body may end the element early…
    expect(/<\/script/i.test(beforeClosing)).toBe(false)
    // …so the declaration that used to disappear survives.
    expect(body).toContain('DEFINED-BELOW-THE-SNIPPET')
  })

  it('leaves a normal client script unchanged', async () => {
    const template = `<script client>
const n = state(0)
</script>
<main><p>{{ n() }}</p></main>`
    const { setupCode } = await processScriptSetup(template, '/app/page.stx')
    expect(setupCode).toContain('state(0)')
    expect(setupCode).not.toContain('<\\/')
  })
})
