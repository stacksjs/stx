import { describe, expect, it } from 'bun:test'
import { processExpressions } from '../../src/expressions'
import { generateSignalsRuntimeDev } from '../../src/signals'

/**
 * Regression tests for: a `{{ }}` expression that references a client-only
 * signal must be PRESERVED for client hydration, not baked to its
 * server-evaluated value.
 *
 * The server SSG interpolator previously preserved a `{{ }}` for the client
 * ONLY when the whole expression server-evaluated to exactly `undefined`.
 * A bare `{{ likes }}` (signal absent from the server context) evaluates to
 * `undefined` and was preserved. But a COMPOUND expression such as
 * `{{ liked ? … : likes + ' people' }}` evaluates to a *defined* string
 * ("undefined people…") and was therefore baked into static HTML — freezing
 * it at the undefined-substituted text with no way for the client to re-bind.
 * Template literals were doubly affected: the `${…}` body was stripped before
 * the "references a client var?" check, so its signal was never seen.
 */

// A `:if` directive marks the template client-reactive (usesSignalsInScript),
// matching a real signal component. `likes`/`liked`/`rating` are client-only
// signals (absent from the server context); `serverVar` IS server context.
const reactive = (expr: string): string =>
  processExpressions(`<div :if="x">${expr}</div>`, { serverVar: 'S' }, 't.stx')

describe('client-signal {{ }} preservation', () => {
  it('preserves a COMPOUND expression referencing a client-only signal', () => {
    const out = reactive(`{{ likes + ' people find this helpful' }}`)
    expect(out).toContain(`{{ likes + ' people find this helpful' }}`)
  })

  it('preserves a nested ternary over client-only signals', () => {
    const expr = `{{ liked ? 'You find this helpful' : likes === 0 ? 'Be the first' : likes + ' people' }}`
    expect(reactive(expr)).toContain(expr)
  })

  it('preserves a TEMPLATE LITERAL whose ${} references a client-only signal', () => {
    expect(reactive('{{ `${rating}/5` }}')).toContain('{{ `${rating}/5` }}')
    expect(reactive('{{ `(${totalResults})` }}')).toContain('{{ `(${totalResults})` }}')
  })

  it('still BAKES an expression that uses only server-context vars (no over-preserve)', () => {
    expect(reactive('{{ 1 + 2 }}')).toContain('3')
    expect(reactive('{{ serverVar }}')).toContain('S')
    // template literal over ONLY context vars must bake, not preserve
    const tpl = reactive('{{ `Hello ${serverVar}` }}')
    expect(tpl).toContain('Hello S')
    expect(tpl).not.toContain('{{')
  })

  it('runtime binds classes on SVG via setAttribute (SVGElement.className is read-only)', () => {
    // Guards the companion client fix: `bindClass` must not do `el.className = …`
    // on an SVG element (throws, aborting hydration for the rest of the page).
    const rt = generateSignalsRuntimeDev()
    expect(rt).toContain(`el.setAttribute('class'`)
  })
})
