import { describe, expect, it } from 'bun:test'
import { addCloakToUnresolvedExpressions } from '../src/misc-directives'

/**
 * The subtree walk behind `addCloakToUnresolvedExpressions` decides whether a
 * mustache belongs to an element's OWN text or to a descendant's. Getting the
 * depth wrong hides a whole panel (stacksjs/stx#1946) or leaves an unresolved
 * `{{ }}` visible.
 *
 * Every case here was checked against a broken walk before being kept: with
 * self-closing detection disabled the first three fail, and with void-tag
 * handling disabled the fourth does. The full suite passed with BOTH broken,
 * which is why these exist.
 */
describe('x-cloak own-text walk', () => {
  it('counts text after a self-closing child as the parent own text', () => {
    // <my-widget /> closes itself, so the mustache after it is the div's.
    const out = addCloakToUnresolvedExpressions('<div><my-widget /> {{ name }}</div>')
    expect(out).toContain('<div x-cloak>')
  })

  it('handles whitespace between the slash and the bracket', () => {
    const out = addCloakToUnresolvedExpressions('<div><my-widget /  > {{ name }}</div>')
    expect(out).toContain('<div x-cloak>')
  })

  it('does not treat a trailing slash inside an attribute as self-closing', () => {
    // The "/" here ends an attribute value, not the tag: <a> stays open, so the
    // mustache is the anchor's own text and the div's own text is empty.
    const out = addCloakToUnresolvedExpressions('<div><a href="/docs/">{{ label }}</a></div>')
    expect(out).toContain('<a href="/docs/" x-cloak>')
    expect(out).not.toContain('<div x-cloak>')
  })

  it('counts text after a void child as the parent own text', () => {
    const out = addCloakToUnresolvedExpressions('<div><br> {{ name }}</div>')
    expect(out).toContain('<div x-cloak>')
  })

  it('leaves a parent alone when only a descendant carries the mustache', () => {
    // The #1946 regression: cloaking the container took the whole panel with it.
    const out = addCloakToUnresolvedExpressions('<div><button>{{ x }}</button></div>')
    expect(out).toContain('<button x-cloak>')
    expect(out).not.toContain('<div x-cloak>')
  })

  it('does not depend on which child comes first', () => {
    const first = addCloakToUnresolvedExpressions('<div><button>{{ x }}</button></div>')
    const second = addCloakToUnresolvedExpressions('<div><h2>t</h2><button>{{ x }}</button></div>')
    expect(first.includes('<div x-cloak>')).toBe(second.includes('<div x-cloak>'))
  })

  it('reads tag names case-insensitively when tracking depth', () => {
    const out = addCloakToUnresolvedExpressions('<div><BR> {{ name }}</div>')
    expect(out).toContain('<div x-cloak>')
  })
})
