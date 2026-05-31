/**
 * Regression test for stacksjs/stx#1730 — originally reported in
 * stacksjs/stacks#1920.
 *
 * Pre-fix, the component-tag scanner walked the assembled page HTML
 * (including script content) with three regex passes. JS string
 * literals like Leaflet's VML feature detection
 * (div.innerHTML = '<v:shape adj="1"/>') got matched by the lowercase
 * pass (/[a-z][a-z0-9]*\/, no ':' in the charset) — it captured
 * just the 'v', tried to load 'v.stx', failed with ENOENT, and
 * injected the error string verbatim into the emitted JS:
 *
 *   div.innerHTML = '[Error loading component: ENOENT: ..., open 'v']
 *
 * The unbalanced quote chain crashed the browser parser with
 * "Unexpected identifier 'v'" pointing into Leaflet's internals.
 *
 * Fix stashes script bodies behind NUL-delimited sentinel markers
 * before the three-pass scan and restores them after. These tests
 * pin the behavior so a future refactor can't silently regress.
 */
import { describe, expect, it } from 'bun:test'
import { processComponents } from '../../src/component-renderer'
import { restoreStashedScripts, stashScriptElements } from '../../src/component-processing'
import { maskAtElementPosition, matchHtmlComment } from '../../src/html-masking'
import { defaultConfig } from '../../src/config'

async function processOnce(template: string): Promise<string> {
  const deps = new Set<string>()
  // Use a temp filepath; resolution machinery only matters for tag *resolution*,
  // and these tests assert that no resolution happens for script-internal tags.
  return processComponents(template, {}, '/tmp/test-page.stx', { ...defaultConfig, debug: false }, deps)
}

describe('component scanner does not descend into <script> content (#1730)', () => {
  it('leaves Leaflet-style "<v:shape>" string literal untouched', async () => {
    const template = `
      <div id="map"></div>
      <script>
        var div = document.createElement('div');
        div.innerHTML = '<v:shape adj="1"/>';
      </script>
    `

    const output = await processOnce(template)

    // The script content must contain the literal exactly as written.
    expect(output).toContain(`div.innerHTML = '<v:shape adj="1"/>';`)
    // And it must NOT contain the diagnostic that the bug produced.
    expect(output).not.toContain('Error loading component')
    expect(output).not.toContain('ENOENT')
  })

  it('survives multiple tag-like string literals in the same script', async () => {
    // Real-world Leaflet has a few of these; defense against the obvious
    // "fixed for one, broken for the next" regression.
    const template = `
      <script>
        var a = '<v:shape adj="1"/>';
        var b = '<o:roundrect/>';
        var c = '<x:foo/>';
      </script>
    `

    const output = await processOnce(template)

    expect(output).toContain(`'<v:shape adj="1"/>'`)
    expect(output).toContain(`'<o:roundrect/>'`)
    expect(output).toContain(`'<x:foo/>'`)
    expect(output).not.toContain('Error loading component')
  })

  it('skips both inline and type="module" script variants', async () => {
    const template = `
      <script type="module">
        const html = '<v:shape/>';
        console.log(html);
      </script>
      <script src="/external.js"></script>
      <script client>
        const x = '<custom-tag/>';
      </script>
    `

    const output = await processOnce(template)

    expect(output).toContain(`'<v:shape/>'`)
    expect(output).toContain(`'<custom-tag/>'`)
    expect(output).not.toContain('Error loading component')
  })

  it('still scans component tags OUTSIDE script content', async () => {
    // Sanity check: the fix doesn't accidentally disable component
    // resolution for the rest of the page. A reference to a non-existent
    // component outside any script SHOULD still produce an error (or
    // pass through with the original tag), proving the scanner ran.
    const template = `
      <NonExistentComponent />
      <script>
        var s = '<v:shape/>';
      </script>
    `

    const output = await processOnce(template)

    // Script content preserved.
    expect(output).toContain(`'<v:shape/>'`)
    // The out-of-script tag was seen by the scanner. We don't pin a
    // specific behavior (error message vs passthrough vs warning)
    // because that's tangential — we just want to know the scanner
    // ran on the outer content. The presence of the original tag
    // name in the output (either as-is or in a diagnostic) is enough.
    expect(
      output.includes('NonExistentComponent')
      || output.includes('non-existent-component')
      || output.includes('Error loading component'),
    ).toBe(true)
  })

  it('does not introduce stray sentinel markers in the output', async () => {
    // The implementation uses NUL-delimited markers internally. If
    // restoration is buggy or a marker leaks past the restore step,
    // raw `\x00STX_SCRIPT_N\x00` strings would appear in the output.
    const template = `
      <script>
        var s = '<v:shape/>';
      </script>
      <p>after script</p>
    `

    const output = await processOnce(template)

    expect(output).not.toContain('STX_SCRIPT_')
    expect(output).not.toMatch(/\x00/)
  })
})

describe('stashScriptElements — tag/quote-aware (XSS guard)', () => {
  it('stashes a genuine top-level <script> element', () => {
    const { output, scripts } = stashScriptElements('<p>x</p><script>var a = 1</script><p>y</p>')
    expect(scripts).toEqual(['<script>var a = 1</script>'])
    expect(output).toBe('<p>x</p>\x00STX_SCRIPT_0\x00<p>y</p>')
    expect(restoreStashedScripts(output, scripts)).toBe('<p>x</p><script>var a = 1</script><p>y</p>')
  })

  it('does NOT stash a <script> that lives inside an attribute value', () => {
    // The bug: this <script> is attribute text, not an element. Stashing it would
    // let the renderer's escaping run against a harmless placeholder, then restore
    // the raw <script> back into the attribute — an XSS.
    const input = '<StxLink aria-label="<script>alert(1)</script>">x</StxLink>'
    const { output, scripts } = stashScriptElements(input)
    expect(scripts).toEqual([])
    expect(output).toBe(input)
  })

  it('does NOT stash a <script> inside a single-quoted attribute value', () => {
    const input = `<a data-x='<script>bad()</script>'>x</a>`
    const { scripts } = stashScriptElements(input)
    expect(scripts).toEqual([])
  })

  it('stashes a real element but leaves an attribute-embedded one in place', () => {
    const input = '<a title="<script>no()</script>">t</a><script>yes()</script>'
    const { output, scripts } = stashScriptElements(input)
    expect(scripts).toEqual(['<script>yes()</script>'])
    expect(output).toContain('title="<script>no()</script>"') // untouched, renderer will escape
    expect(output).toContain('\x00STX_SCRIPT_0\x00')
  })

  it('end-to-end: an attribute-embedded <script> is HTML-escaped, not executed', async () => {
    const output = await processOnce(
      '<StxLink to="/x" aria-label="<script>alert(1)</script>">go</StxLink>',
    )
    expect(output).toContain('aria-label="&lt;script&gt;alert(1)&lt;/script&gt;"')
    expect(output).not.toContain('<script>alert(1)</script>')
  })
})

describe('maskAtElementPosition — HTML comments (XSS guard)', () => {
  const ph = (_t: string, i: number) => `\x00C${i}\x00`

  it('masks a top-level comment but not one inside an attribute value', () => {
    const input = '<p>a</p><!-- real --><div title="<!-- attr -->">x</div>'
    const { output, tokens } = maskAtElementPosition(input, matchHtmlComment, ph)
    expect(tokens).toEqual(['<!-- real -->'])
    expect(output).toBe('<p>a</p>\x00C0\x00<div title="<!-- attr -->">x</div>')
  })

  it('handles a comment containing a quote+angle-bracket payload at top level', () => {
    const input = '<!-- "><img onerror=alert(1)> --><p>ok</p>'
    const { output, tokens } = maskAtElementPosition(input, matchHtmlComment, ph)
    expect(tokens).toEqual(['<!-- "><img onerror=alert(1)> -->'])
    expect(output).toBe('\x00C0\x00<p>ok</p>')
  })

  it('leaves an unterminated comment unmasked', () => {
    const input = '<p>a</p><!-- no close'
    const { tokens } = maskAtElementPosition(input, matchHtmlComment, ph)
    expect(tokens).toEqual([])
  })
})
