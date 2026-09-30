/**
 * A component that renders a table cell carries its scope on the cell.
 *
 * Components with a client script are wrapped in `<div data-stx-scope="…">`.
 * A `<div>` between `<tr>` and `<th>` is not permitted by the table content
 * model, so the HTML parser hoists the wrapper out of the table: it lands as
 * an empty div before the `<table>`, in the parent element. The `<th>` itself
 * survives in the right place, so the page looks right - what moved is the
 * scope, and with it the component's client behaviour.
 *
 * `<TableHeader sortable>` registered its @click on that wrapper, now nowhere
 * near the cell a reader clicks, so sorting a table by its header could not
 * work and nothing said why. stacksjs/stx#1980, found by an app migrating
 * onto the library.
 *
 * ## Asserted on the emitted HTML, not on a parsed DOM
 *
 * The hoisting is a real HTML parser's doing. very-happy-dom does not
 * reproduce it - it happily leaves a div inside a tr - so a test that parsed
 * this markup and looked for the wrapper would pass either way and prove
 * nothing. What the fix controls, and what a browser then acts on, is the
 * bytes: the scope attribute on the cell, and no element between the row and
 * the cell.
 */
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'
import { scopeOnRootElement } from '../../stx/src/utils'

const ROOT = path.resolve(import.meta.dir, '..')

async function render(markup: string): Promise<string> {
  return processDirectives(
    markup,
    {},
    path.join(ROOT, 'table-scope-audit.stx'),
    { componentsDir: path.join(ROOT, 'src/ui'), root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/** Markup only: a component ships its own template inside a client script too. */
function markup(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
}

describe('a table cell component is scoped in place (#1980)', () => {
  const TABLE = `<table class="min-w-full">
  <TableHead><TableRow><TableHeader sortable="true">Date</TableHeader></TableRow></TableHead>
  <TableBody><TableRow><TableCell>Mon</TableCell></TableRow></TableBody>
</table>`

  it('puts the scope on the th rather than in a wrapper', async () => {
    const html = markup(await render(TABLE))

    expect(html).toMatch(/<th[^>]*\bdata-stx-scope="[^"]+"/)
    expect(html).not.toMatch(/<div[^>]*\bdata-stx-scope/)
  })

  it('leaves nothing between the row and the cell', async () => {
    const html = markup(await render(TABLE))
    const row = html.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/)

    // Whitespace, yes. An element, no - that is the one the parser relocates.
    expect(row?.[1].trim().startsWith('<th')).toBe(true)
  })

  it('keeps the sortable header its click handler', async () => {
    const html = markup(await render(TABLE))
    const header = html.match(/<th\b[^>]*>/)?.[0] ?? ''

    // The handler and the scope have to be on the same element for the
    // handler to be bound to what a reader clicks.
    expect(header).toContain('data-stx-scope')
    expect(html).toMatch(/<th[^>]*@click/)
  })
})

describe('scopeOnRootElement only takes over where a wrapper would move', () => {
  const ATTRS = ' data-stx-scope="s1"'

  it('stamps a single table-section root', () => {
    expect(scopeOnRootElement('<th class="a">X</th>', ATTRS))
      .toBe('<th data-stx-scope="s1" class="a">X</th>')
    expect(scopeOnRootElement('<tbody><tr><td>X</td></tr></tbody>', ATTRS))
      .toContain('<tbody data-stx-scope="s1">')
  })

  it('leaves an ordinary root to the wrapper', () => {
    // A div wrapper around a div is legal everywhere and is what every other
    // component in the library already ships, snapshots included.
    expect(scopeOnRootElement('<div>X</div>', ATTRS)).toBeNull()
    expect(scopeOnRootElement('<button>X</button>', ATTRS)).toBeNull()
  })

  it('declines a run of siblings, which would need a scope each', () => {
    expect(scopeOnRootElement('<tr><td>a</td></tr><tr><td>b</td></tr>', ATTRS)).toBeNull()
  })

  it('skips leading comments to find the root', () => {
    expect(scopeOnRootElement('<!-- c -->\n<td>X</td>', ATTRS))
      .toContain('<td data-stx-scope="s1">')
  })

  it('covers the other content models that reject a div', () => {
    for (const tag of ['option', 'li', 'dt', 'dd'])
      expect(scopeOnRootElement(`<${tag}>X</${tag}>`, ATTRS)).toContain(`<${tag} data-stx-scope="s1">`)
  })
})
