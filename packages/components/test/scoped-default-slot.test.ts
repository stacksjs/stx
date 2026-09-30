/**
 * A default slot carrying bound props still renders the caller's children.
 *
 * `<slot :striped="striped" />` matched neither slot pattern in the renderer:
 * the default one required the tag name to be followed by nothing but
 * whitespace, and the named one required `name=`. So it was never
 * substituted - the children were dropped and a literal `<slot …>` element
 * was emitted into the page.
 *
 * Nine shipped components are written that way, so nine rendered as empty
 * shells. `<Table>` produced a `<table>` with no rows in it whatever you put
 * inside, and `rows.length` was 0. Silent: no throw, no warning, and a
 * `<slot>` element in the browser does nothing and reports nothing.
 * stacksjs/stx#1975, found by an app migrating onto the library.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
// `../../stx/src`, never `@stacksjs/stx`, which resolves to a lagging dist.
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')
const UI = path.join(ROOT, 'src/ui')

async function render(markup: string): Promise<string> {
  return processDirectives(
    markup,
    {},
    path.join(ROOT, 'scoped-slot-audit.stx'),
    { componentsDir: UI, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/** Markup only: a component ships its own template inside a client script too. */
function markup(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/g, '')
}

describe('Table renders what it was given (#1975)', () => {
  const TABLE = `<Table striped="true">
  <TableHead><TableRow><TableHeader>Date</TableHeader><TableHeader>Session</TableHeader></TableRow></TableHead>
  <TableBody><TableRow><TableCell>Mon</TableCell><TableCell>Intervals</TableCell></TableRow></TableBody>
</Table>`

  it('puts the rows inside the table instead of dropping them', async () => {
    const html = markup(await render(TABLE))

    expect(html).toContain('<thead')
    expect(html).toContain('<tbody')
    expect(html).toContain('Date')
    expect(html).toContain('Intervals')
  })

  it('emits no literal slot element', async () => {
    const html = markup(await render(TABLE))

    // The old output was `<slot striped="true" hoverable="true" / />`, which a
    // browser renders as nothing at all.
    expect(html).not.toContain('<slot')
  })
})

describe('DropdownItem keeps its label (#1975)', () => {
  it('renders the content between its tags', async () => {
    const html = markup(await render('<DropdownItem>Duplicate</DropdownItem>'))

    expect(html).toContain('Duplicate')
    expect(html).not.toContain('<slot')
  })
})

/**
 * The rule, for the whole library.
 *
 * Nine components used this form, so a fix verified against one of them says
 * very little. Every component whose template has a default slot with bound
 * props is rendered here with a child, and the child has to come out.
 */
describe('no component with a bound default slot drops its children', () => {
  function stxFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory())
        return stxFiles(full)
      return full.endsWith('.stx') ? [full] : []
    })
  }

  /** Components whose template contains `<slot :prop="…" />`. */
  const withBoundSlot = stxFiles(UI)
    .filter(file => /<slot\s+:/.test(readFileSync(file, 'utf-8')))
    .map(file => path.basename(file, '.stx'))

  it('finds the components this is about', () => {
    // A sweep over an empty list passes by checking nothing.
    expect(withBoundSlot.length).toBeGreaterThan(5)
    expect(withBoundSlot).toContain('Table')
  })

  for (const tag of withBoundSlot) {
    it(`<${tag}> renders its child`, async () => {
      const html = markup(await render(`<${tag}>SLOTTED-CHILD</${tag}>`))

      expect(html).toContain('SLOTTED-CHILD')
      expect(html).not.toContain('<slot')
    })
  }
})
