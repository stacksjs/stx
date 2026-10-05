/**
 * `data-expanded` and `aria-expanded` on a sidebar section.
 *
 * Written inline as `{{ collapsed ? 'false' : 'true' }}`, both were served
 * VERBATIM whenever the section was rendered inside a `<Sidebar>` -- the
 * marker reached the browser unexpanded. `data-expanded` then carried a
 * template string the controller cannot read, and `aria-expanded` carried a
 * value that is neither `true` nor `false`, which is an invalid ARIA state
 * rather than a cosmetic slip.
 *
 * `{{ id }}` on the very same element expanded correctly in the same render,
 * and rendering `<SidebarSection>` directly expanded all of them -- so the
 * fault was in how a nested component's attributes are re-parsed, and a bare
 * identifier is what survives that path.
 *
 * Which is why this is rendered, and rendered BOTH ways. The defect only ever
 * appeared through the parent, so a test of the section on its own would have
 * passed throughout, and a test of the source text would have passed whichever
 * way the engine behaved.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { attrValues, markup, renderSidebar } from './utils/render-sidebar'

const source = readFileSync(join(import.meta.dir, '..', 'src', 'ui', 'sidebar', 'SidebarSection.stx'), 'utf8')

const SECTIONS = `[
  { id: 'shut', label: 'Shut', collapsed: true, items: [{ id: 'a', label: 'A' }] },
  { id: 'open', label: 'Open', items: [{ id: 'b', label: 'B' }] },
]`

describe('a section reports an ARIA state, not a template', () => {
  it('expands both attributes when the section stands alone', async () => {
    const html = markup(await renderSidebar(
      `<body><SidebarSection id="shut" label="Shut" :collapsed="true" :items="[{ id: 'a', label: 'A' }]" /></body>`,
    ))

    expect(attrValues(html, 'aria-expanded')).toEqual(['false'])
    expect(attrValues(html, 'data-expanded')).toEqual(['false'])
  })

  it('expands them through a parent Sidebar, which is where it broke', async () => {
    const html = markup(await renderSidebar(
      `<body><Sidebar theme="macos" placement="static" :sections="${SECTIONS}" /></body>`,
    ))

    expect(attrValues(html, 'aria-expanded')).toEqual(['false', 'true'])
    expect(attrValues(html, 'data-expanded')).toEqual(['false', 'true'])
  })

  it('leaves nothing unexpanded anywhere in the rendered sidebar', async () => {
    // The general form of the same failure: whatever the parse path does to a
    // nested component's attributes, no mustache survives into the markup.
    const html = markup(await renderSidebar(
      `<body><Sidebar theme="macos" placement="static" :sections="${SECTIONS}" /></body>`,
    ))

    expect([...html.matchAll(/\{\{[^}]*\}\}/g)].map(match => match[0])).toEqual([])
  })

  it('leaves no inline conditional in any attribute', () => {
    // Source, deliberately: this is the shape that does not survive nesting --
    // an interpolation containing spaces and quotes, inside an attribute --
    // and the rule is that the component does not write one, whatever today's
    // engine makes of it.
    const inlineConditionals = [...source.matchAll(/="\{\{[^}]*\?[^}]*\}\}"/g)].map(m => m[0])

    expect(inlineConditionals).toEqual([])
  })
})
