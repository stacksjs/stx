/**
 * The controls and table cells take their size from a role, not a literal.
 *
 * Colour and corners were roles already, and an app with them set still could
 * not adopt a text field without a visual change: the field carried
 * `px-4 py-2 text-base`, a table cell `px-6 py-4 text-sm`, and `className` is
 * no escape hatch for either. `py-2` and an app's `py-1.5` are single-class
 * selectors of equal specificity, so the winner is whichever the engine
 * emitted later - not something a call site controls (stacksjs/stx#1993).
 *
 * Three things are pinned, each on what the browser receives rather than on
 * the source text:
 *
 *  1. every md-size control and every table cell RENDERS with the density
 *     utilities and with none of the literals they replaced;
 *  2. the utilities compile to the variable, with today's value behind it;
 *  3. "today's value" is read from the engine's own scale, so the stock
 *     fallbacks cannot drift from the literals they stand in for.
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '@stacksjs/ts-css/engine'
import { generateCss } from '../../stx/src/dev-server/ts-css'
import { DENSITY_FONT_SIZES, DENSITY_SPACING, DENSITY_TOKENS, densityVariable } from '../../stx/src/theme-tokens'
import { parse, render } from './utils/render-component'

const CONTROL = ['px-control-x', 'py-control-y', 'text-control']
const CONTROL_LITERALS = ['px-4', 'py-2', 'text-base']

/** The class list of the first element matching `selector` in a render. */
async function classesOf(usage: string, selector: string): Promise<string[]> {
  const element = parse(await render(usage)).querySelector(selector)
  expect(element, `${usage} rendered no ${selector}`).not.toBeNull()
  return (element!.getAttribute('class') || '').split(/\s+/).filter(Boolean)
}

describe('every md text control reads the control density roles', () => {
  const CONTROLS: Array<[string, string]> = [
    ['<TextInput label="A" />', 'input'],
    ['<TextInput label="A" size="md" />', 'input'],
    ['<EmailInput label="A" />', 'input'],
    ['<SearchInput label="A" />', 'input'],
    ['<PasswordInput label="A" />', 'input'],
    ['<NumberInput label="A" />', 'input'],
    ['<Select label="A" />', 'select'],
    ['<Textarea label="A" />', 'textarea'],
  ]

  for (const [usage, tag] of CONTROLS) {
    it(`${usage} renders its padding and type from the roles`, async () => {
      const classes = await classesOf(usage, tag)

      for (const name of CONTROL)
        expect(classes, `${usage} lacks ${name}`).toContain(name)
      // Not merely added beside the literal: both present would tie again.
      for (const name of CONTROL_LITERALS)
        expect(classes, `${usage} still carries ${name}`).not.toContain(name)
    })
  }

  /*
   * sm and lg stay literal. They are the exceptions a call site opts into by
   * name, and a token for each would be six more variables for a choice the
   * `size` prop already expresses.
   */
  it('leaves sm and lg as they were', async () => {
    expect(await classesOf('<TextInput size="sm" />', 'input')).toEqual(expect.arrayContaining(['px-3', 'py-1.5', 'text-sm']))
    expect(await classesOf('<Select size="lg" />', 'select')).toEqual(expect.arrayContaining(['px-5', 'py-2.5', 'text-lg']))
  })
})

describe('every table cell reads the cell density roles', () => {
  const TABLE = `<Table><TableHead><TableRow><TableHeader>Name</TableHeader></TableRow></TableHead>
<TableBody><TableRow><TableCell>Ada</TableCell></TableRow></TableBody></Table>`

  it('renders a body cell from the roles', async () => {
    const classes = await classesOf(TABLE, 'td')

    expect(classes).toEqual(expect.arrayContaining(['px-cell-x', 'py-cell-y', 'text-cell']))
    for (const name of ['px-6', 'py-4', 'text-sm'])
      expect(classes).not.toContain(name)
  })

  it('renders a header cell from the roles, on the body\'s inline padding', async () => {
    const classes = await classesOf(TABLE, 'th')

    // The SAME inline role as the body: a header at a different inset from its
    // column is a misaligned table.
    expect(classes).toEqual(expect.arrayContaining(['px-cell-x', 'py-cell-head-y', 'text-cell-head']))
    for (const name of ['px-6', 'py-3', 'text-xs'])
      expect(classes).not.toContain(name)
  })
})

describe('the density utilities compile to a variable with today\'s value', () => {
  it('compiles every spacing role on both axes and every type role', async () => {
    const utilities = [
      ...Object.keys(DENSITY_SPACING).map(name => `px-${name}`),
      ...Object.keys(DENSITY_SPACING).map(name => `py-${name}`),
      ...Object.keys(DENSITY_FONT_SIZES).map(name => `text-${name}`),
    ]
    const css = await generateCss(`<div class="${utilities.join(' ')}"></div>`)

    for (const [name, token] of Object.entries(DENSITY_SPACING)) {
      const value = `var(${densityVariable(token)}, ${DENSITY_TOKENS[token].value})`
      expect(css, `px-${name}`).toMatch(new RegExp(`\\.px-${name}\\s*\\{[^}]*padding-left:\\s*${escape(value)}`))
      expect(css, `py-${name}`).toMatch(new RegExp(`\\.py-${name}\\s*\\{[^}]*padding-top:\\s*${escape(value)}`))
    }
    for (const [name, { size, leading }] of Object.entries(DENSITY_FONT_SIZES)) {
      const rule = new RegExp(`\\.text-${name}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
      expect(rule, `text-${name}`).toContain(`font-size: var(${densityVariable(size)}, ${DENSITY_TOKENS[size].value})`)
      expect(rule, `text-${name}`).toContain(`line-height: var(${densityVariable(leading)}, ${DENSITY_TOKENS[leading].value})`)
      // A font size, not a colour: `text-control` must not paint anything.
      expect(rule, `text-${name}`).not.toContain('color')
    }
  })

  it('ships the :root block that declares them', async () => {
    const css = await generateCss('<div class="px-control-x"></div>')

    for (const [name, token] of Object.entries(DENSITY_TOKENS))
      expect(css).toContain(`${densityVariable(name)}: ${token.value};`)
  })

  /*
   * The stock values are literals in theme-tokens.ts, so this is what keeps
   * them honest: each equals what the utility it replaced compiles to in the
   * engine's own scale. If either side moves, nothing on screen is allowed to.
   */
  it('falls back to exactly what the replaced literals compiled to', () => {
    const { spacing, fontSize } = (defaultConfig as any).theme
    const pairs: Array<[string, string]> = [
      ['control-px', spacing['4']],
      ['control-py', spacing['2']],
      ['control-text', fontSize.base[0]],
      ['control-leading', fontSize.base[1].lineHeight],
      ['cell-px', spacing['6']],
      ['cell-py', spacing['4']],
      ['cell-text', fontSize.sm[0]],
      ['cell-leading', fontSize.sm[1].lineHeight],
      ['cell-head-py', spacing['3']],
      ['cell-head-text', fontSize.xs[0]],
      ['cell-head-leading', fontSize.xs[1].lineHeight],
    ]

    for (const [token, stock] of pairs)
      expect(DENSITY_TOKENS[token].value, token).toBe(stock)
    expect(pairs.map(([token]) => token).sort()).toEqual(Object.keys(DENSITY_TOKENS).sort())
  })
})

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
