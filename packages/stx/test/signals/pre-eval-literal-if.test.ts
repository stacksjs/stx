/**
 * Tests for SSR pre-eval of literal-valued reactive conditional
 * attributes (stacksjs/stx#1739, Phase A).
 *
 * Covers the safe-cut subset: pure literals (`true`, `false`, numbers,
 * quoted strings, `null`, `undefined`). Phase B will add server-resolvable
 * expression analysis (the larger ~75% per the bench-review audit) — out
 * of scope here.
 */
import { describe, expect, it, mock } from 'bun:test'

// `@stacksjs/ts-i18n` resolves via a workspace file: link that isn't
// present in clean checkouts; signal-processing.ts → utils.ts →
// process.ts → i18n.ts triggers the load. Stub it so this file's
// import graph doesn't depend on the unrelated package.
mock.module('@stacksjs/ts-i18n', () => ({ loadLocale: async () => ({}) }))

const { preEvalLiteralReactiveIfs } = await import('../../src/signal-processing')

describe('preEvalLiteralReactiveIfs — falsy literals drop the element', () => {
  it(':if="false" drops the element + children', () => {
    const out = preEvalLiteralReactiveIfs('<div :if="false"><span>hidden</span></div><p>after</p>')
    expect(out).toBe('<p>after</p>')
  })

  it(':if="0" drops the element', () => {
    expect(preEvalLiteralReactiveIfs('<p :if="0">gone</p><p>kept</p>')).toBe('<p>kept</p>')
  })

  it('empty-string literal :if="\'\'" drops the element', () => {
    expect(preEvalLiteralReactiveIfs(`<span :if="''">empty</span><span>after</span>`)).toBe('<span>after</span>')
  })

  it(':if="null" drops the element', () => {
    expect(preEvalLiteralReactiveIfs('<div :if="null">x</div>')).toBe('')
  })

  it(':if="undefined" drops the element', () => {
    expect(preEvalLiteralReactiveIfs('<div :if="undefined">x</div>')).toBe('')
  })

  it('x-if="false" alias drops the element', () => {
    expect(preEvalLiteralReactiveIfs('<div x-if="false">x</div>after')).toBe('after')
  })

  it('@if="false" attribute alias drops the element', () => {
    expect(preEvalLiteralReactiveIfs('<div @if="false">x</div>after')).toBe('after')
  })

  it(':show="false" drops the element', () => {
    expect(preEvalLiteralReactiveIfs('<div :show="false">x</div>after')).toBe('after')
  })

  it('falsy on self-closing element only drops the start tag', () => {
    expect(preEvalLiteralReactiveIfs('<img :if="false" src="x.png" />after')).toBe('after')
  })

  it('falsy on void element (no closing tag) drops just the start tag', () => {
    expect(preEvalLiteralReactiveIfs('<input :if="false" type="text">after')).toBe('after')
  })

  it('falsy element with nested same-tag children is removed correctly', () => {
    const html = '<div :if="false"><div><div>deep</div></div></div><p>after</p>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('<p>after</p>')
  })

  it('falsy outer containing a falsy inner :if (no overlap corruption)', () => {
    // Regression: nested matched :if elements used to produce overlapping
    // replacements whose stale end indices ate trailing content.
    const html = '<div :if="false"><span :if="false">x</span></div>after'
    expect(preEvalLiteralReactiveIfs(html)).toBe('after')
  })

  it('falsy outer containing a truthy inner :if (inner is irrelevant — whole subtree drops)', () => {
    const html = '<div :if="false"><span :if="true">x</span></div>after'
    expect(preEvalLiteralReactiveIfs(html)).toBe('after')
  })

  it('truthy outer containing a falsy inner :if (outer kept + attr stripped, inner dropped)', () => {
    const html = '<div :if="true"><span :if="false">gone</span>kept</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('<div>kept</div>')
  })

  it('two sibling falsy elements both drop, content between them survives', () => {
    const html = '<a :if="false">x</a>MID<b :if="false">y</b>END'
    expect(preEvalLiteralReactiveIfs(html)).toBe('MIDEND')
  })
})

describe('preEvalLiteralReactiveIfs — truthy literals strip the attribute', () => {
  it(':if="true" strips the attribute but keeps the element', () => {
    const out = preEvalLiteralReactiveIfs('<div :if="true"><span>shown</span></div>')
    expect(out).toBe('<div><span>shown</span></div>')
  })

  it(':if="1" strips the attribute', () => {
    expect(preEvalLiteralReactiveIfs('<p :if="1">kept</p>')).toBe('<p>kept</p>')
  })

  it(':if="\'foo\'" (non-empty string) strips the attribute', () => {
    expect(preEvalLiteralReactiveIfs(`<p :if="'foo'">kept</p>`)).toBe('<p>kept</p>')
  })

  it('strips the literal attribute but keeps surrounding attributes intact', () => {
    const out = preEvalLiteralReactiveIfs('<div class="card" :if="true" data-x="1"><span>x</span></div>')
    expect(out).toBe('<div class="card" data-x="1"><span>x</span></div>')
  })

  it('@show="true" attribute alias strips the attribute', () => {
    expect(preEvalLiteralReactiveIfs('<p @show="true">x</p>')).toBe('<p>x</p>')
  })
})

describe('preEvalLiteralReactiveIfs — non-literals are left alone', () => {
  it('identifier reference is preserved for runtime', () => {
    const html = '<div :if="isAdmin">admin</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('member access is preserved', () => {
    const html = '<div :if="user.admin">x</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('signal call is preserved', () => {
    const html = '<div :if="loading()">spinner</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('logical operators are preserved', () => {
    const html = '<div :if="a && b">x</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('mixed literal-looking expressions like "true && cond" are preserved (only pure literals are evaled)', () => {
    const html = '<div :if="true && shown">x</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('template strings are preserved', () => {
    const html = '<div :if="`${state}`">x</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('whitespace around the literal still resolves', () => {
    expect(preEvalLiteralReactiveIfs('<p :if="  false  ">x</p>after')).toBe('after')
  })
})

describe('preEvalLiteralReactiveIfs — if/else chains are deferred to the runtime (Phase B)', () => {
  it('does NOT touch a literal :if that heads an :else chain (would orphan the else)', () => {
    const html = '<div :if="false">A</div><div :else>B</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('does NOT touch :if="true" with a following :else (avoids showing both branches)', () => {
    const html = '<div :if="true">A</div><div :else>B</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('does NOT touch a literal :if heading an :else-if chain', () => {
    const html = '<div :if="false">A</div><div :else-if="x">B</div><div :else>C</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('defers even when a comment sits between the :if and the :else', () => {
    const html = '<div :if="false">A</div><!-- gap --><div :else>B</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('x-if / x-else chain is deferred too', () => {
    const html = '<p x-if="false">A</p><p x-else>B</p>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('a literal :if with a following NON-else sibling is still pre-evaled', () => {
    expect(preEvalLiteralReactiveIfs('<div :if="false">A</div><p>B</p>')).toBe('<p>B</p>')
  })

  it(':show is exempt from the chain guard (no else partner) — literal still pre-evaled', () => {
    // A :show followed by an :else would be a malformed template anyway; :show
    // never participates in chains, so we pre-eval it regardless.
    expect(preEvalLiteralReactiveIfs('<div :show="false">A</div><div>B</div>')).toBe('<div>B</div>')
  })
})

describe('preEvalLiteralReactiveIfs — skip scopes', () => {
  it('does not touch :if inside a <script> body', () => {
    const html = '<script>const s = `<div :if="false">a</div>`;</script>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('does not touch :if inside a <style> body', () => {
    const html = '<style>/* <div :if="false">x</div> */</style>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('templates without any of the target attributes pass through unchanged', () => {
    const html = '<div><p>hello</p></div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })
})

describe('preEvalLiteralReactiveIfs — adversarial-review regressions (stacksjs/stx#1739)', () => {
  it('#1 self-closing non-void falsy element with a SPACE before /> is dropped (not deferred)', () => {
    expect(preEvalLiteralReactiveIfs('<section :if="false" />')).toBe('')
    // and following siblings survive — the bug deleted them via the runtime
    expect(preEvalLiteralReactiveIfs('<section :if="false" />after<p>sib</p>')).toBe('after<p>sib</p>')
  })

  it('#1b self-closing truthy element with a space before /> keeps the element, strips the attr', () => {
    expect(preEvalLiteralReactiveIfs('<section :if="true" class="x" />')).toBe('<section class="x" />')
  })

  it('#2 falsy element wrapping a <script> whose string contains </div> drops the whole element', () => {
    const html = '<div :if="false"><script>const s = "</div>";</script></div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('')
  })

  it('#3 falsy element wrapping a <style> whose CSS string contains </div> drops the whole element', () => {
    const html = '<div :if="false"><style>body { content: "</div>"; }</style></div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('')
  })

  it('#4 falsy element whose comment body contains </div> drops the whole element', () => {
    const html = '<div :if="false"><!-- end with </div> --></div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('')
  })

  it('#2/3/4 the same element when TRUTHY keeps its script/style/comment body intact', () => {
    const html = '<div :if="true"><script>const s = "</div>";</script>kept</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('<div><script>const s = "</div>";</script>kept</div>')
  })

  it('#5 chain guard skips a TEXT node between :if and :else (runtime skips text too)', () => {
    const html = '<div :if="false">A</div>text<div :else>B</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe(html)
  })

  it('#5b chain guard still pre-evals when text is followed by a NON-else element', () => {
    expect(preEvalLiteralReactiveIfs('<div :if="false">A</div>text<p>B</p>')).toBe('text<p>B</p>')
  })
})

describe('preEvalLiteralReactiveIfs — bench-review feature-flag patterns', () => {
  it('feature flag compiled to literal false is eliminated', () => {
    // Build-time: a `:if="enableExperimentalReviews"` got replaced with the
    // resolved literal `false` by the build env-substitution pass. The HTML
    // for the experimental panel should not ship to clients.
    const html = '<section :if="false"><h2>Experimental</h2><div>...long block...</div></section><section>Stable</section>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('<section>Stable</section>')
  })

  it('debug-only block compiled to literal true is kept without the runtime attribute', () => {
    const html = '<div :if="true" class="debug">debug info</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('<div class="debug">debug info</div>')
  })

  it('multiple literals in the same template each get handled', () => {
    const html = '<div :if="true">A</div><div :if="false">B</div><div :if="1">C</div><div :if="0">D</div>'
    expect(preEvalLiteralReactiveIfs(html)).toBe('<div>A</div><div>C</div>')
  })
})

describe('preEvalLiteralReactiveIfs — self-closed <script/> / <style/> in a falsy element (stacksjs/stx#1739 re-review)', () => {
  // Per HTML5, `/>` on <script>/<style> is NOT honored — the browser opens the
  // element and consumes everything up to `</script>` (or EOF) as raw text. So
  // `<div :if="false"><script src="x"/></div>after` would have the browser
  // swallow `</div>after` into the unclosed script, and a falsy-ancestor drop
  // would then delete `after` (the finding-#1 content-loss class). findElementEnd
  // treats a `/>`-terminated script/style as bodyless (matching template-author
  // intent) so the falsy element is dropped cleanly at SSR and siblings survive.
  it('self-closed <script src="..." /> (space before />) — falsy element drops, sibling survives', () => {
    expect(preEvalLiteralReactiveIfs('<div :if="false"><script src="x.js" /></div>after')).toBe('after')
  })

  it('self-closed <script src="..."/> (no space) — falsy element drops', () => {
    expect(preEvalLiteralReactiveIfs('<div :if="false"><script src="x.js"/></div>after')).toBe('after')
  })

  it('self-closed <style /> — falsy element drops', () => {
    expect(preEvalLiteralReactiveIfs('<div :if="false"><style /></div>after')).toBe('after')
  })

  it('a normal <script>…</script> with a body still tracks its real close tag', () => {
    expect(preEvalLiteralReactiveIfs('<div :if="false"><script>let a = 1</script></div>after')).toBe('after')
  })
})
