/**
 * `processServerBindings` resolves attribute bindings, not directives.
 *
 * `:href` names a real HTML attribute and can be resolved to one. `:if` cannot —
 * it is an instruction to the conditional processor, and the element carries no
 * `if` attribute at any point. The pass evaluated every `:name="expr"` alike.
 *
 * It went unnoticed for a long time because it could not fire. Its tag regex
 * required each attribute chunk to begin with whitespace and be a single
 * character, so it never matched a real tag carrying a real attribute — the
 * whole pass was effectively dead code. Fixing that regex in 0.2.173 switched it
 * on for everything at once, and the damage was immediate and silent:
 *
 *     <p :if="error">   ->  <p if="Bad creds">     attribute leaked
 *     <p :if="empty">   ->  <p if="">              ELEMENT STILL RENDERED
 *
 * The second line is the serious one. A falsy condition stopped removing its
 * element, so every server-evaluated `:if` on every page inverted into "always
 * shown" — and the page still answers 200 with no console error. `:show`,
 * `:text`, `:html`, `:model` and `:key` were eaten the same way.
 *
 * These assert the directive is left EXACTLY as authored, because that is what
 * the conditional processor and the client runtime consume. They are pinned
 * against the last release that behaved correctly (0.2.172), not against what
 * looked reasonable while writing the fix.
 */

import { describe, expect, it } from 'bun:test'
import { isRuntimeOwnedColonAttr } from '../src/runtime-globals'
import { processServerBindings } from '../src/server-bindings'

const context = { error: 'Bad creds', empty: '', label: 'Hi', rows: [1, 2], flag: true }

const render = (template: string): string => processServerBindings(template, context)

describe('a directive is left for the processor that owns it', () => {
  it.each([
    [':if', '<p :if="error">x</p>'],
    [':if falsy', '<p :if="empty">x</p>'],
    [':else-if', '<p :else-if="flag">x</p>'],
    [':show', '<p :show="error">x</p>'],
    [':text', '<p :text="label"></p>'],
    [':html', '<p :html="label"></p>'],
    [':model', '<input :model="label">'],
    [':key', '<li :key="error">x</li>'],
    [':for', '<li :for="r in rows">x</li>'],
  ])('%s survives verbatim', (_name, markup) => {
    expect(render(markup)).toBe(markup)
  })

  it('never writes the condition value into the markup', () => {
    // The specific corruption: the VALUE of the condition became an attribute.
    const out = render('<p :if="error">x</p>')

    expect(out).not.toContain('Bad creds')
    expect(out).not.toMatch(/\sif=/)
  })

  it('leaves a falsy condition for the processor rather than resolving it away', () => {
    // `<p if="">` is the shape that made every falsy `:if` render its element.
    expect(render('<p :if="empty">x</p>')).not.toMatch(/\sif=""/)
  })
})

describe('a real attribute binding still resolves', () => {
  it('resolves a value binding', () => {
    expect(render('<a :href="label">x</a>')).toBe('<a href="Hi">x</a>')
  })

  it('drops a falsy boolean attribute', () => {
    expect(render('<button :disabled="empty">x</button>')).toBe('<button>x</button>')
  })

  it('keeps a truthy boolean attribute', () => {
    expect(render('<button :disabled="flag">x</button>')).toBe('<button disabled>x</button>')
  })

  it('resolves :class, which names a real attribute', () => {
    // Deliberately NOT in the runtime-owned list: `:class` and `:style` do
    // resolve to attributes, and this pass has specific handling for them.
    expect(render('<p :class="label">x</p>')).toBe('<p class="Hi">x</p>')
  })
})

describe('isRuntimeOwnedColonAttr', () => {
  it('covers the directives and excludes the attributes', () => {
    for (const name of ['if', 'else-if', 'else', 'for', 'show', 'key', 'text', 'html', 'model', 'ref'])
      expect(isRuntimeOwnedColonAttr(name)).toBe(true)

    for (const name of ['href', 'src', 'disabled', 'class', 'style', 'id', 'value', 'alt'])
      expect(isRuntimeOwnedColonAttr(name)).toBe(false)
  })
})
