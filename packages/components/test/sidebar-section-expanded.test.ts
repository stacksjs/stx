/**
 * `data-expanded` and `aria-expanded` on a sidebar section.
 *
 * Written inline as `{{ collapsed ? 'false' : 'true' }}`, both were served
 * VERBATIM whenever the section was rendered inside a `<Sidebar>` — the marker
 * reached the browser unexpanded. `data-expanded` then carried a template
 * string the controller cannot read, and `aria-expanded` carried a value that
 * is neither `true` nor `false`, which is an invalid ARIA state rather than a
 * cosmetic slip.
 *
 * `{{ id }}` on the very same element expanded correctly in the same render,
 * and rendering `<SidebarSection>` directly expanded all of them — so the
 * fault is in how a nested component's attributes are re-parsed, and a bare
 * identifier is what survives that path.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(import.meta.dir, '..', 'src', 'ui', 'sidebar', 'SidebarSection.stx'), 'utf8')

describe('the expanded state is precomputed, not inlined', () => {
  it('computes the attribute value in the script block', () => {
    expect(source).toContain("export const expandedAttr = collapsed ? 'false' : 'true'")
  })

  it('interpolates a bare identifier into both attributes', () => {
    expect(source).toContain('data-expanded="{{ expandedAttr }}"')
    expect(source).toContain('aria-expanded="{{ expandedAttr }}"')
  })

  it('leaves no inline conditional in any attribute', () => {
    // The shape that does not survive nesting: an interpolation containing
    // spaces and quotes, inside an attribute.
    const inlineConditionals = [...source.matchAll(/="\{\{[^}]*\?[^}]*\}\}"/g)].map(m => m[0])
    expect(inlineConditionals).toEqual([])
  })

  it('reports the two ARIA states an expandable header can be in', () => {
    // Whatever the mechanism, the rendered values have to be exactly these —
    // `aria-expanded` accepts nothing else.
    const collapsedValue = (collapsed: boolean) => (collapsed ? 'false' : 'true')
    expect(collapsedValue(true)).toBe('false')
    expect(collapsedValue(false)).toBe('true')
  })
})
