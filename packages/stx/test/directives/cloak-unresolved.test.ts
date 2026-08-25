/**
 * Which element a reactive mustache cloaks (stacksjs/stx#1946).
 *
 * `x-cloak` is `display:none`, so an element that stays cloaked because its
 * bundle was slow, or never ran, is invisible — and for a control, invisible is
 * indistinguishable from absent. Cloaking the element that HOLDS the expression
 * is the intended trade: better a missing label for 200ms than a flash of raw
 * `{{ }}`.
 *
 * Cloaking its ANCESTORS was not intended. The old scan read "everything up to
 * the first `</`", which walks straight through child tags, so a container whose
 * first descendant subtree reached a mustache was stamped too. That shipped an
 * install-instructions panel to production as an empty box, and it was
 * order-dependent: putting any element with a closing tag before the mustache
 * silently fixed it. Both directions are pinned below.
 *
 * There was no way to say "render it anyway", so `x-no-cloak` is the opt-out —
 * tested on both stamping passes, since an author should not have to know which
 * one would have hidden their element.
 */

import { describe, expect, it } from 'bun:test'
import { addCloakToConditionalDirectives, addCloakToUnresolvedExpressions } from '../../src/misc-directives'

/**
 * Tag names carrying an `x-cloak` attribute, in document order.
 *
 * Quoted attribute values are blanked to same-length filler first. A `>` inside
 * one (`:if="count > 0"`) otherwise ends the `[^>]*` scan early and the match is
 * silently missed — the same trap the tag matcher itself had to fix in #1771,
 * and it read here as "the fix stopped cloaking" rather than "the test cannot
 * see it".
 */
function cloaked(html: string): string[] {
  const flattened = html.replace(/"[^"]*"|'[^']*'/g, m => '"'.repeat(m.length))
  return [...flattened.matchAll(/<([a-z][\w-]*)\b[^>]*\sx-cloak(?:[=\s/>])/gi)].map(m => m[1].toLowerCase())
}

describe('the element holding the expression', () => {
  it('is cloaked, which is the point', () => {
    const out = addCloakToUnresolvedExpressions(`<button @click="submit()">{{ busy() ? 'Sending' : 'Send' }}</button>`)

    expect(cloaked(out)).toEqual(['button'])
  })

  it('is cloaked when the expression follows a child element', () => {
    // Still the element's own text, just not the first thing in it. Scoping to
    // "before the first child tag" would have missed this and let a raw
    // mustache flash.
    const out = addCloakToUnresolvedExpressions(`<p><b>Hi</b> {{ name }}</p>`)

    expect(cloaked(out)).toContain('p')
  })

  it('is cloaked when a void element precedes the expression', () => {
    // `<img>` never closes. Counting it as an open subtree would swallow the
    // rest of the parent's text and lose the mustache.
    const out = addCloakToUnresolvedExpressions(`<p><img src="/a.png"> {{ name }}</p>`)

    expect(cloaked(out)).toContain('p')
  })
})

describe('an ancestor of the expression', () => {
  it('is not cloaked, so a panel does not ship as a blank box', () => {
    const html = `<div class="panel"><div x-for="opt in options"><button>{{ opt.label }}</button></div></div>`

    const out = addCloakToUnresolvedExpressions(html)

    expect(cloaked(out)).toEqual(['button'])
    expect(out).toMatch(/<div class="panel">/)
  })

  it('is not cloaked regardless of what the first child is', () => {
    // The order-dependence that made this so hard to see: these two differ only
    // by a heading, and only one of them used to lose its container.
    const withoutHeading = addCloakToUnresolvedExpressions(`<div class="panel"><button>{{ label }}</button></div>`)
    const withHeading = addCloakToUnresolvedExpressions(`<div class="panel"><h2>Install</h2><button>{{ label }}</button></div>`)

    expect(cloaked(withoutHeading)).toEqual(cloaked(withHeading))
    expect(cloaked(withoutHeading)).toEqual(['button'])
  })

  it('is not cloaked when it is a nav wrapping a dynamic link', () => {
    // The whole navigation used to disappear because one link label was
    // reactive.
    const out = addCloakToUnresolvedExpressions(`<nav class="top"><a href="/x">{{ name }}</a></nav>`)

    expect(cloaked(out)).toEqual(['a'])
  })

  it('is not confused by a comment before the expression', () => {
    const out = addCloakToUnresolvedExpressions(`<div class="panel"><!-- note --><button>{{ label }}</button></div>`)

    expect(cloaked(out)).toEqual(['button'])
  })

  it('is not confused by a ">" inside a child attribute', () => {
    const out = addCloakToUnresolvedExpressions(`<div class="panel"><button :if="count > 0">{{ label }}</button></div>`)

    expect(cloaked(out)).toEqual(['button'])
  })
})

describe('x-no-cloak', () => {
  it('keeps an element with a reactive mustache visible', () => {
    const out = addCloakToUnresolvedExpressions(`<button x-no-cloak @click="submit()">{{ label }}</button>`)

    expect(cloaked(out)).toEqual([])
  })

  it('keeps an element with a conditional directive visible', () => {
    // The other stamping pass. An author opting out should not have to know
    // which one would have hidden the element.
    const out = addCloakToConditionalDirectives(`<div :show="ready()" x-no-cloak>Content</div>`)

    expect(cloaked(out)).toEqual([])
  })

  it('does not opt out a different element', () => {
    const out = addCloakToUnresolvedExpressions(`<p x-no-cloak>{{ a }}</p><p>{{ b }}</p>`)

    expect(cloaked(out)).toEqual(['p'])
    expect(out).toMatch(/<p x-no-cloak>\{\{ a \}\}<\/p>/)
  })
})

describe('elements with nothing to cloak', () => {
  it('are left alone', () => {
    const html = `<div class="panel"><h2>Install</h2><p>Run the command below.</p></div>`

    expect(addCloakToUnresolvedExpressions(html)).toBe(html)
  })

  it('are not double-stamped when already cloaked by hand', () => {
    const out = addCloakToUnresolvedExpressions(`<span x-cloak>{{ name }}</span>`)

    expect(out.match(/x-cloak/g)?.length).toBe(1)
  })
})
