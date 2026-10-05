/**
 * The painted primitives name a ROLE, not a palette shade.
 *
 * 56 of 102 components hard-coded a Tailwind shade and 59 used `dark:`
 * variants, which made the library unadoptable by an app with its own palette:
 * `<Button variant="primary">` shipped Tailwind blue into a rose-accented
 * product, and `className` was no escape hatch, because it is appended to the
 * class ATTRIBUTE and attribute order does not decide CSS - `bg-blue-500` and
 * `bg-accent` are single-class selectors of equal specificity, so the winner is
 * whichever lands later in the generated stylesheet. stacksjs/stx#1993.
 *
 * What this pins is the contract an app depends on: the roles exist, they
 * compile to a variable with a fallback, the solid/hover/ink triple is
 * coherent, and the migrated components' status colours go through them.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { SEMANTIC_TOKENS, SHAPE_TOKENS, semanticColors, semanticTokenCSS, shapeVariable, tokenVariable } from '../../stx/src/theme-tokens'
import { generateCss } from '../../stx/src/dev-server/ts-css'
import { defaultConfig } from '@stacksjs/ts-css/engine'
import { contrastRatio } from './utils/wcag-contrast'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

const STATUSES = ['accent', 'secondary', 'info', 'danger', 'success', 'warning'] as const

/** Source with comments removed: a comment naming a shade is not a use of it. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\{--[\s\S]*?--\}\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

describe('the role vocabulary covers what a painted component needs', () => {
  it('has a text, solid, hover, ink, soft and soft-ink role for every status', () => {
    for (const status of STATUSES) {
      for (const suffix of ['', '-solid', '-solid-hover', '-ink', '-soft', '-soft-ink']) {
        const role = `${status}${suffix}`

        expect(SEMANTIC_TOKENS[role], `missing role ${role}`).toBeDefined()
      }
    }
  })

  /*
   * A fill, its hover and its text have to move TOGETHER. An app that points
   * --stx-accent-solid at a pale colour needs the ink to follow, or the label
   * disappears; and `hover:bg-accent-solid` would just repaint the same colour,
   * which is why hover is its own role rather than a variant.
   */
  it('keeps each solid fill darker than its hover, in both modes', () => {
    for (const status of STATUSES) {
      const fill = SEMANTIC_TOKENS[`${status}-solid`]
      const hover = SEMANTIC_TOKENS[`${status}-solid-hover`]
      const step = (ref: string) => Number(ref.split('-').pop())

      expect(step(hover.light)).toBeGreaterThan(step(fill.light))
      expect(step(hover.dark)).toBeGreaterThan(step(fill.dark))
    }
  })

  /*
   * White on a yellow fill is about 1.9:1, which fails at any text size. The
   * ink role exists so the one status where white is wrong can say so.
   */
  it('does not put white ink on the caution fill', () => {
    expect(SEMANTIC_TOKENS['warning-ink'].light).not.toBe('white')
    expect(SEMANTIC_TOKENS['accent-ink'].light).toBe('white')
  })

  it('compiles every new role to a variable with a fallback', async () => {
    const classes = STATUSES.flatMap(status => [
      `bg-${status}-solid`,
      `hover:bg-${status}-solid-hover`,
      `text-${status}-ink`,
      `bg-${status}-soft`,
      `text-${status}-soft-ink`,
    ])
    const css = await generateCss(`<div class="${classes.join(' ')}"></div>`)

    for (const name of classes) {
      const role = name.replace(/^(?:hover:)?(?:bg|text)-/, '')

      // The variable, so an app can move it; and a fallback, so a page that
      // never receives the :root block still renders.
      expect(css, `${name} did not compile`).toContain(`var(${tokenVariable(role)},`)
    }
  })

  /*
   * A white surface had no name, which is why 43 places - every card, menu,
   * dialog and form control - stayed literal after the status hues migrated.
   * `surface` is gray-50 and `surface-raised` is gray-100; neither is white.
   */
  it('has a name for a white surface, and a second for a control inside one', () => {
    expect(SEMANTIC_TOKENS.panel).toMatchObject({ light: 'white', dark: 'neutral-800' })
    expect(SEMANTIC_TOKENS.field).toMatchObject({ light: 'white', dark: 'neutral-700' })

    // The distinction is the point: a control one step lighter than the panel
    // it sits in, or it disappears into it.
    expect(SEMANTIC_TOKENS.field.dark).not.toBe(SEMANTIC_TOKENS.panel.dark)
    expect(SEMANTIC_TOKENS.field.light).toBe(SEMANTIC_TOKENS.panel.light)
  })

  it('gives every role a value in both modes', () => {
    const css = semanticTokenCSS((defaultConfig as any).theme.colors)

    for (const role of Object.keys(SEMANTIC_TOKENS)) {
      expect(css, `${role} missing from :root`).toContain(`${tokenVariable(role)}:`)
    }
    expect(css).toContain(':root {')
    expect(css).toContain('.dark {')
  })

  it('exposes every role as a palette entry, so it works as an ordinary utility', () => {
    const colors = semanticColors((defaultConfig as any).theme.colors)

    for (const role of Object.keys(SEMANTIC_TOKENS))
      expect(colors[role], `${role} is not a palette entry`).toContain(`var(${tokenVariable(role)},`)
  })
})

describe('the migrated primitives carry no status shade', () => {
  /*
   * Only the five status hues, and only in the components this pass covered.
   * Neutrals are a separate question - a gray-800 label does not stop a
   * themed app adopting the component - and purple and cyan are off-vocabulary
   * on purpose: Badge's `secondary` and `info` would collapse onto colours
   * another variant already uses.
   */
  const MIGRATED = [
    'button/Button.stx',
    'badge/Badge.stx',
    'notification/Notification.stx',
    'dialog/DialogPanel.stx',
    'popover/PopoverPanel.stx',
    'listbox/ListboxOptions.stx',
    'combobox/ComboboxOptions.stx',
  ]

  const STATUS_HUE = /\b(?:[a-z-]+:)*(?:bg|text|border|ring|divide|stroke|fill|placeholder|outline)-(?:blue|red|green|yellow|indigo)-\d{2,3}\b/g

  for (const rel of MIGRATED) {
    it(`${rel} names no blue, red, green, yellow or indigo shade`, () => {
      const hits = code(readFileSync(path.join(UI, rel), 'utf-8')).match(STATUS_HUE) ?? []

      expect(hits).toEqual([])
    })
  }

  it('still has the components reach the roles, not just avoid shades', () => {
    // Avoiding a shade is easy by deleting the colour; the point is that the
    // role took its place.
    const button = readFileSync(path.join(UI, 'button/Button.stx'), 'utf-8')

    expect(button).toContain('bg-accent-solid')
    expect(button).toContain('hover:bg-accent-solid-hover')
    expect(button).toContain('text-accent-ink')
    expect(button).toContain('bg-danger-solid')
  })

  /*
   * The neutral pass, same shape: the surfaces have to reach the role rather
   * than merely stop naming a shade.
   */
  it('paints its panels and fields through the surface roles', () => {
    const panels = ['dialog/DialogPanel.stx', 'popover/PopoverPanel.stx', 'listbox/ListboxOptions.stx']
    for (const rel of panels)
      expect(readFileSync(path.join(UI, rel), 'utf-8'), rel).toContain('bg-panel')

    for (const rel of ['input/TextInput.stx', 'textarea/Textarea.stx', 'select/Select.stx'])
      expect(readFileSync(path.join(UI, rel), 'utf-8'), rel).toContain('bg-field')
  })

  /*
   * No component should carry `bg-white dark:bg-<neutral>` any more: that
   * pairing IS the panel/field role, and leaving one behind is how a themed
   * app ends up with a white card in a dark product.
   */
  it('leaves no white-surface pairing unmigrated', () => {
    const offenders: string[] = []
    for (const rel of MIGRATED.concat(['input/TextInput.stx', 'select/Select.stx', 'card/Card.stx', 'tabs/Tabs.stx'])) {
      const source = code(readFileSync(path.join(UI, rel), 'utf-8'))
      if (/bg-white\s+dark:bg-(?:gray|neutral|zinc|slate|stone)-\d{2,3}/.test(source))
        offenders.push(rel)
    }

    expect(offenders).toEqual([])
  })
})

/**
 * Shape, which was the other half of why the library could not be adopted.
 *
 * An app whose buttons are pills got `rounded-md`, and `className` is no escape
 * hatch for a radius for exactly the reason it was not one for a colour:
 * `rounded-md` and `rounded-full` are single-class selectors of equal
 * specificity, so the winner is whichever lands later in the generated
 * stylesheet. Same for a height — `h-10` against `h-8`.
 */
describe('a control takes its shape from a role (#1993)', () => {
  it('compiles the radius roles to a variable with a fallback', async () => {
    const css = await generateCss('<div class="rounded-control rounded-panel rounded-pill rounded-t-control"></div>')

    for (const role of Object.keys(SHAPE_TOKENS))
      expect(css, `rounded-${role} did not compile`).toContain(`var(${shapeVariable(role)},`)

    // Directional variants have to work too, or a component with one rounded
    // edge has to drop back to a shade.
    expect(css).toContain('border-top-left-radius')
  })

  it('keeps today\'s radius as the fallback, so nothing moves by default', () => {
    expect(SHAPE_TOKENS.control.value).toBe('0.375rem')
    expect(SHAPE_TOKENS.panel.value).toBe('0.5rem')
    expect(SHAPE_TOKENS.pill.value).toBe('9999px')
  })

  it('rounds the controls through the control role', () => {
    for (const rel of ['button/Button.stx', 'input/TextInput.stx', 'select/Select.stx', 'textarea/Textarea.stx'])
      expect(code(readFileSync(path.join(UI, rel), 'utf-8')), rel).toContain('rounded-control')
  })

  /*
   * A menu is a panel, not a control, and this is the distinction that makes
   * the roles safe to re-point: an app setting --stx-radius-control to a pill
   * radius must not end up with pill-shaped dropdown menus. These five used
   * the control radius by value and were moved to `panel` deliberately, which
   * is the only appearance change in the shape pass.
   */
  it('rounds the menus through the panel role, not the control one', () => {
    for (const rel of ['dropdown/DropdownItems.stx', 'listbox/ListboxOptions.stx', 'combobox/ComboboxOptions.stx']) {
      const source = code(readFileSync(path.join(UI, rel), 'utf-8'))

      expect(source, rel).toContain('rounded-panel')
      expect(source, rel).not.toContain('rounded-control')
    }
  })

  /*
   * The height has to come from the padding, or an app passing its own padding
   * gets the padding it asked for and the height it did not.
   */
  it('gives the controls no fixed height to fight', () => {
    for (const rel of ['button/Button.stx', 'input/TextInput.stx', 'select/Select.stx']) {
      const sizes = code(readFileSync(path.join(UI, rel), 'utf-8'))
        .match(/const sizeClasses = \{[\s\S]*?\}/)?.[0] ?? ''

      expect(sizes, rel).not.toMatch(/\bh-\d/)
      expect(sizes, rel).toMatch(/\bpy-[\d.]+/)
    }
  })

  /*
   * A circle is not a theming decision. An avatar, a spinner and a skeleton
   * stay `rounded-full` so re-pointing the pill radius cannot turn them into
   * squares.
   */
  it('leaves genuine circles alone', () => {
    for (const rel of ['avatar/Avatar.stx', 'spinner/Spinner.stx', 'skeleton/Skeleton.stx'])
      expect(code(readFileSync(path.join(UI, rel), 'utf-8')), rel).toContain('rounded-full')
  })
})

/**
 * A field in its error state, which is four colours rather than one.
 *
 * The five inputs shared a byte-identical error string of raw shades, and
 * nothing in the vocabulary matched it: the nearest roles were two steps away
 * in both modes, so forcing it onto `danger` or `danger-soft` would have turned
 * a pale error outline into a strong one (stacksjs/stx#1993).
 */
describe('a field in error takes its colours from roles (#1993)', () => {
  const FIELD_ERROR = ['danger-fg', 'danger-fg-subtle', 'danger-line', 'danger-focus'] as const

  it('has a role for each of the four decisions', () => {
    for (const role of FIELD_ERROR)
      expect(SEMANTIC_TOKENS[role], `missing role ${role}`).toBeDefined()
  })

  it('compiles them, including the placeholder variant', async () => {
    const css = await generateCss('<div class="ring-danger-line text-danger-fg placeholder-danger-fg-subtle focus:ring-danger-focus placeholder-danger"></div>')

    for (const role of FIELD_ERROR)
      expect(css, `${role} did not compile`).toContain(`var(${tokenVariable(role)},`)

    // `placeholder-*` is a pseudo-element variant, not a plain colour utility.
    expect(css).toContain('::placeholder')
  })

  /*
   * The point of the names: the two branches read as the same four decisions
   * rather than as two unrelated class strings.
   *
   * Three of the four still mirror one for one. The PLACEHOLDER no longer
   * does, and that is deliberate: `fg-subtle` and `danger-fg-subtle` were
   * 2.59:1 and 1.92:1, below the floor for text, so both placeholders moved to
   * roles that could be read - and those roles already existed as `fg-soft`
   * and `danger`. Adding `fg-placeholder` and `danger-fg-placeholder` at
   * identical values, purely so this assertion could stay symmetrical, would
   * have been two names for colours the vocabulary already had.
   */
  it('reads as the same four decisions in both branches', () => {
    for (const rel of ['input/TextInput.stx', 'input/NumberInput.stx', 'input/PasswordInput.stx', 'select/Select.stx', 'textarea/Textarea.stx']) {
      const source = code(readFileSync(path.join(UI, rel), 'utf-8'))

      expect(source, rel).toContain("'ring-danger-line text-danger-fg placeholder-danger focus:ring-danger-focus'")
      expect(source, rel).toContain("'ring-line-strong text-fg placeholder-fg-soft focus:ring-accent'")
    }
  })

  /*
   * A focus ring has to stay visible against a dark field, so it LIGHTENS in
   * dark mode - the opposite of a solid fill, and the same reason coloured text
   * lightens. Getting this backwards is how #1930's regression happened.
   */
  it('lightens the focus ring in dark mode, unlike a fill', () => {
    expect(SEMANTIC_TOKENS['danger-focus']).toMatchObject({ light: 'red-500', dark: 'red-400' })
    expect(SEMANTIC_TOKENS['danger-solid']).toMatchObject({ light: 'red-500', dark: 'red-600' })
  })

  it('leaves no raw red shade in any form control', () => {
    const offenders: string[] = []
    for (const rel of ['input/TextInput.stx', 'input/NumberInput.stx', 'input/PasswordInput.stx',
      'select/Select.stx', 'textarea/Textarea.stx', 'checkbox/Checkbox.stx', 'radio/Radio.stx', 'form/Form.stx']) {
      if (/-red-\d{2,3}\b/.test(code(readFileSync(path.join(UI, rel), 'utf-8'))))
        offenders.push(rel)
    }

    expect(offenders).toEqual([])
  })
})

/**
 * Every variant of a role-driven map reaches a role.
 *
 * Badge's `secondary` was purple with no role behind it, and `info` was cyan
 * while four of its siblings were already tokenised - so two of seven variants
 * stayed put in a themed app while the rest moved. That is the worst failure
 * shape available: silent, and visible only to the person whose badge is the
 * wrong colour (stacksjs/stx#1993).
 */
describe('no variant is left as the unthemeable one', () => {
  it('gives every status, including secondary, the full set of roles', () => {
    for (const status of STATUSES)
      for (const suffix of ['', '-solid', '-soft', '-soft-ink'])
        expect(SEMANTIC_TOKENS[`${status}${suffix}`], `missing ${status}${suffix}`).toBeDefined()
  })

  /*
   * `info` and `accent` had identical defaults, which is a vocabulary with two
   * names you cannot tell apart - and it hid a misuse: every `info` in the
   * library was a SELECTED or ACTIVE state that reached for it only because
   * the hue was blue while accent was indigo. Those are accent now, and info
   * is cyan, which is what the two components that genuinely mean
   * informational already painted.
   */
  it('keeps accent and info distinguishable', () => {
    expect(SEMANTIC_TOKENS.accent.light).not.toBe(SEMANTIC_TOKENS.info.light)
    expect(SEMANTIC_TOKENS['accent-soft'].light).not.toBe(SEMANTIC_TOKENS['info-soft'].light)
  })

  it('leaves no palette shade in Badge or Switch', () => {
    for (const rel of ['badge/Badge.stx', 'switch/Switch.stx']) {
      const hits = code(readFileSync(path.join(UI, rel), 'utf-8'))
        .match(/\b(?:[a-z-]+:)*(?:bg|text|border|ring|divide|stroke|fill)-(?:blue|red|green|yellow|indigo|cyan|purple|teal|sky)-\d{2,3}\b/g) ?? []

      expect(hits, rel).toEqual([])
    }
  })

  /*
   * A badge is a pill by intent, so it takes the pill ROLE and an app can ask
   * for slightly-rounded badges. The dot and the remove button keep
   * `rounded-full`: those are genuine circles, and re-pointing the pill radius
   * must not square them off.
   */
  it('rounds the badge through the pill role, and its dot through neither', () => {
    const badge = code(readFileSync(path.join(UI, 'badge/Badge.stx'), 'utf-8'))

    expect(badge).toMatch(/badgeClasses = `[^`]*rounded-pill/)
    expect(badge).toMatch(/dotClasses = `[^`]*rounded-full/)
  })

  /*
   * Switch's off-state track is achromatic by design: a toggle that is off has
   * no hue, and giving it one would be inventing a decision rather than
   * preserving it. That argument stops at the off state - it was extended to
   * the focus RING, which is an indicator and was 1.00:1 on the panel it ships
   * on. See focus-visibility.test.ts.
   */
  it('leaves Switch\'s achromatic parts achromatic', () => {
    const sw = code(readFileSync(path.join(UI, 'switch/Switch.stx'), 'utf-8'))

    expect(sw).toContain('bg-accent-solid')
    expect(sw).toMatch(/bg-neutral-\d{3}/)
  })
})

/**
 * A hovered neutral surface is a role, and the role is visible in both modes.
 *
 * The coloured families got a `-solid-hover` when the fills were migrated,
 * because a fill and its hover have to move together. The neutrals did not, so
 * thirteen interactive surfaces each invented their own pair - and four of them
 * invented one that cannot be seen (stacksjs/stx#1993):
 *
 *   `bg-panel hover:bg-surface`                  neutral-800 -> neutral-800
 *   `bg-surface-raised hover:bg-surface-sunken`  neutral-700 -> neutral-700
 *
 * `surface` shares a dark value with `panel`, and `surface-raised` with
 * `surface-sunken`, so those rows highlighted in light mode and did nothing at
 * all in dark. That defect survives review because the class is present and
 * its name reads correctly; only resolving both sides shows it.
 *
 * So the assertions below are about the RELATIONSHIP rather than any shade: a
 * hover must differ from the surface it hovers, in both modes, and must move
 * toward contrast rather than away from it.
 */
describe('a hovered neutral surface is a role (#1993)', () => {
  /** Each `-hover` role and the surface it is the hover for. */
  const HOVER_PAIRS = [
    ['surface', 'surface-hover'],
    ['surface-raised', 'surface-raised-hover'],
    ['surface-sunken', 'surface-sunken-hover'],
    ['field', 'field-hover'],
    /*
     * A link is on this list for the same reason, and it is the pair that
     * shows why the direction assertion below is per-mode rather than
     * absolute: a link darkens on hover in light mode and LIGHTENS in dark,
     * because it is already the brightest thing in a dark paragraph.
     */
    ['link', 'link-hover'],
  ] as const

  /** `white` is the top of the neutral ladder, below `neutral-50`. */
  const step = (ref: string) => (ref === 'white' ? 0 : Number(ref.split('-').pop()))

  it('gives every neutral surface a hover partner', () => {
    for (const [base, hover] of HOVER_PAIRS) {
      expect(SEMANTIC_TOKENS[base], `missing surface ${base}`).toBeDefined()
      expect(SEMANTIC_TOKENS[hover], `missing hover ${hover}`).toBeDefined()
    }
  })

  /*
   * The one that matters. Before the roles existed, four call sites paired two
   * surfaces whose DARK values are equal, so the hover was absent in dark mode
   * while looking entirely correct in the source.
   */
  it('keeps each hover distinct from its surface, in both modes', () => {
    for (const [base, hover] of HOVER_PAIRS) {
      const surface = SEMANTIC_TOKENS[base]
      const hovered = SEMANTIC_TOKENS[hover]

      expect(hovered.light, `${hover} is invisible on ${base} in light mode`).not.toBe(surface.light)
      expect(hovered.dark, `${hover} is invisible on ${base} in dark mode`).not.toBe(surface.dark)
    }
  })

  /*
   * Direction, not just difference: light mode darkens toward the cursor and
   * dark mode lightens. A hover that moved the other way would pass the test
   * above while reading as the surface receding.
   */
  it('moves each hover toward contrast rather than away', () => {
    for (const [base, hover] of HOVER_PAIRS) {
      const surface = SEMANTIC_TOKENS[base]
      const hovered = SEMANTIC_TOKENS[hover]

      expect(step(hovered.light), `${hover} lightens in light mode`).toBeGreaterThan(step(surface.light))
      expect(step(hovered.dark), `${hover} darkens in dark mode`).toBeLessThan(step(surface.dark))
    }
  })

  /*
   * `surface-hover` doubles as the hover for `panel` and for a transparent row,
   * which is why there is no `panel-hover`: a table row, an accordion header
   * and a nav item are painted on whatever the host put them on, so their
   * hover has to read against every neutral the library uses as a page or
   * panel background.
   */
  /*
   * The page is distinguishable from the panels on it, which `surface` could
   * not manage: it describes itself as "page and panel background" and sits at
   * neutral-800 in dark mode, the same value as `panel`. Four components
   * hard-coded the step below rather than use it.
   */
  it('keeps the page distinct from a panel and a field, in both modes', () => {
    for (const other of ['panel', 'field', 'surface'] as const) {
      expect(SEMANTIC_TOKENS.page.dark, `page is indistinguishable from ${other} in dark mode`)
        .not.toBe(SEMANTIC_TOKENS[other].dark)
    }
    // In light mode a panel is white and the page is a step down from it.
    expect(SEMANTIC_TOKENS.page.light).not.toBe(SEMANTIC_TOKENS.panel.light)
  })

  /*
   * The fourth rung, and the property that made it necessary.
   *
   * A table's head is `surface` and its body is `content`, and the body is
   * BRIGHTER than its header in light mode and DARKER in dark mode - in both,
   * the header is the surface with more presence. `panel` cannot express it:
   * `panel` and `surface` share neutral-800 in dark, so a body on `panel`
   * would be the same colour as its own header.
   */
  it('keeps a content area distinct from the chrome above it, in both modes', () => {
    const head = SEMANTIC_TOKENS.surface
    const body = SEMANTIC_TOKENS.content

    expect(body.light, 'the body matches its header in light mode').not.toBe(head.light)
    expect(body.dark, 'the body matches its header in dark mode').not.toBe(head.dark)

    // And it must differ from the panel it may be nested in, which is the
    // substitution that looks right and collapses in dark mode.
    for (const other of ['panel', 'field'] as const) {
      expect(body.dark, `content is indistinguishable from ${other} in dark mode`)
        .not.toBe(SEMANTIC_TOKENS[other].dark)
    }
  })

  /*
   * `content` DOES share `page`'s dark value, deliberately: a full-bleed table
   * body sitting flush with the page is a normal arrangement, and the rows are
   * separated by `divide-line` rather than by the surface behind them. Asserted
   * so the overlap reads as a decision rather than an oversight - and so that
   * moving either one has to move this line too.
   */
  it('lets a full-bleed body sit flush with the page', () => {
    expect(SEMANTIC_TOKENS.content.dark).toBe(SEMANTIC_TOKENS.page.dark)
    // In light mode the paper is still a step brighter than the page.
    expect(SEMANTIC_TOKENS.content.light).not.toBe(SEMANTIC_TOKENS.page.light)
  })

  /*
   * A floating panel is a `panel`, and CommandPalette was the one that was not:
   * it painted `bg-white dark:bg-neutral-900` while DialogPanel, DropdownItems,
   * ListboxOptions and ComboboxOptions all used the role.
   */
  it('paints every floating panel from the panel role', () => {
    for (const rel of [
      'dialog/DialogPanel.stx',
      'dropdown/DropdownItems.stx',
      'listbox/ListboxOptions.stx',
      'combobox/ComboboxOptions.stx',
      'command-palette/CommandPalette.stx',
    ]) {
      const source = code(readFileSync(path.join(UI, rel), 'utf-8'))

      expect(source, rel).toContain('bg-panel')
      /*
       * Opaque only. A translucent `dark:bg-neutral-500/50` is a SCRIM - the
       * backdrop over the page behind a palette or a drawer - and an alpha over
       * whatever is beneath it is the right way to express that. It is not a
       * panel surface naming a shade.
       */
      expect(source, rel).not.toMatch(/bg-white(?![a-z/-])|dark:bg-neutral-\d{3}(?!\/)/)
    }
  })

  it('makes the row highlight visible on every neutral it can land on', () => {
    const hover = SEMANTIC_TOKENS['surface-hover']

    for (const base of ['panel', 'surface'] as const) {
      expect(hover.light).not.toBe(SEMANTIC_TOKENS[base].light)
      expect(hover.dark).not.toBe(SEMANTIC_TOKENS[base].dark)
    }
    // VirtualTable's body, the darkest neutral a row sits on.
    expect(hover.dark).not.toBe('neutral-900')
  })

  /*
   * CodeBlock's copy chip is the documented exception. It floats over
   * highlighted code, whose background comes from the syntax theme rather than
   * from a utility here, so it is deliberately dark in BOTH modes - the same
   * call as Switch's off state. A role whose light value is white would break
   * it, and inventing an always-dark surface role for one call site would be
   * worse than naming the shade.
   */
  it('leaves no other component naming a neutral shade on hover', () => {
    const SRC = path.join(import.meta.dir, '..', 'src')
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.stx') ? [path.join(dir, e.name)] : []),
    )
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      const hits = code(readFileSync(file, 'utf-8'))
        .match(/\b(?:[a-z-]+:)*hover:bg-(?:neutral|gray|zinc|slate|stone)-\d{2,3}\b/g) ?? []

      if (hits.length) offenders.push(`${path.relative(SRC, file)}: ${hits.join(' ')}`)
    }

    expect(offenders).toEqual(['components/CodeBlock.stx: hover:bg-neutral-700'])
  })

  /*
   * An accent fill hovering to a different hue. SubscriptionCheckout painted
   * `bg-accent-solid` and then `hover:bg-indigo-700`, left behind when accent
   * moved from indigo to blue - so the one state a themed app cannot inspect
   * jumped hue on the way in. Calendar's selected day had the same shape, and
   * its dark hover was blue-600 on a blue-600 fill: absent.
   */
  it('hovers a solid fill through the fill\'s own hover role', () => {
    for (const rel of ['payment/SubscriptionCheckout.stx', 'calendar/Calendar.stx']) {
      const source = code(readFileSync(path.join(UI, rel), 'utf-8'))

      expect(source, rel).not.toMatch(/hover:bg-(?:indigo|blue)-\d{2,3}/)
      expect(source, rel).toContain('hover:bg-accent-solid-hover')
    }
  })
})

/**
 * Two colours that must agree come from one role, and no component names
 * `gray` (stacksjs/stx#1993).
 *
 * The neutral roles name `neutral`, which is achromatic; `gray` is blue-tinted.
 * Mixing them is not a palette preference, it is a visible seam - and Tooltip
 * had one. The bubble was `bg-neutral-900 dark:bg-neutral-700` and the arrow
 * that points out of it was `border-t-gray-900 dark:border-t-gray-700`: the
 * same colour by intent, spelled as two independent literals in two different
 * families, so the triangle was tinted against the bubble it belonged to.
 *
 * Nothing held those five classes together, which is the argument for the role
 * rather than for simply correcting the family.
 */
describe('nothing is left naming gray (#1993)', () => {
  const SRC = path.join(import.meta.dir, '..', 'src')
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.stx') ? [path.join(dir, e.name)] : []),
  )

  it('names no gray shade anywhere in the library', () => {
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      const hits = code(readFileSync(file, 'utf-8')).match(/\bgray-\d{2,3}\b/g) ?? []

      if (hits.length) offenders.push(`${path.relative(SRC, file)}: ${hits.join(' ')}`)
    }

    expect(offenders).toEqual([])
  })

  /*
   * And one accent hue, for the same reason.
   *
   * `accent` moved from indigo to blue because the library had two names for
   * one meaning. Three components kept their own third and fourth: `<Login>`
   * was an indigo page, `<Signup>` and `<TwoFactorChallenge>` teal ones - and
   * TwoFactorChallenge used BOTH, an indigo focus ring above a teal button. An
   * app installing the auth set got three hues none of which were its own, and
   * no variable reached any of them.
   *
   * Their submit buttons also hovered the wrong way: indigo-600 -> indigo-500
   * and teal-600 -> teal-500 LIGHTEN on hover, the opposite direction from
   * every other fill in the library. On `accent-solid` they darken.
   */
  it('names no second accent hue', () => {
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      const hits = code(readFileSync(file, 'utf-8'))
        .match(/\b(?:[a-z-]+:)*(?:bg|text|border|ring|outline|divide|from|to|placeholder|fill|stroke)-(?:indigo|teal)-\d{2,3}\b/g) ?? []

      if (hits.length) offenders.push(`${path.relative(SRC, file)}: ${hits.join(' ')}`)
    }

    expect(offenders).toEqual([])
  })

  /*
   * A `dark:` variant whose value is a ROLE is redundant and misleading: the
   * token already carries both modes, so `dark:ring-accent-soft-ink` resolves
   * through the same variable the plain class does and says nothing extra.
   * One slipped in while migrating the payment badge, kept only to change an
   * alpha from 10% to 20%.
   */
  it('never wraps a role token in a dark: variant', () => {
    const offenders: string[] = []
    const roles = Object.keys(SEMANTIC_TOKENS).sort((a, b) => b.length - a.length).join('|')
    const pattern = new RegExp(`\\b(?:[a-z-]+:)*dark:(?:[a-z-]+:)*(?:bg|text|border|ring|ring-offset|outline|divide|placeholder|fill|stroke)-(?:${roles})(?![a-z-])`, 'g')

    for (const file of walk(SRC)) {
      const hits = code(readFileSync(file, 'utf-8')).match(pattern) ?? []

      if (hits.length) offenders.push(`${path.relative(SRC, file)}: ${hits.join(' ')}`)
    }

    expect(offenders).toEqual([])
  })

  it('has an inverted surface and its ink', () => {
    expect(SEMANTIC_TOKENS.inverse).toBeDefined()
    expect(SEMANTIC_TOKENS['inverse-ink']).toBeDefined()
    // Inverted means dark in BOTH modes, which is the whole point: a tooltip
    // bubble reads against the page either way.
    expect(Number(SEMANTIC_TOKENS.inverse.light.split('-').pop())).toBeGreaterThan(500)
    expect(Number(SEMANTIC_TOKENS.inverse.dark.split('-').pop())).toBeGreaterThan(500)
  })

  /*
   * The arrow is the bubble. Asserting they share the role - rather than that
   * both happen to say neutral-900 - is what makes re-pointing `--stx-inverse`
   * move the triangle with the bubble.
   */
  it('paints the tooltip arrow and its bubble from one role', () => {
    const tooltip = code(readFileSync(path.join(UI, 'tooltip/Tooltip.stx'), 'utf-8'))

    expect(tooltip).toContain('bg-inverse')
    expect(tooltip).toContain('text-inverse-ink')
    for (const side of ['t', 'b', 'l', 'r'])
      expect(tooltip, `arrow side ${side}`).toContain(`border-${side}-inverse`)
  })

  /*
   * A focus ring's offset is the surface BEHIND the control, so it belongs to
   * a surface role. Eight controls declared `dark:focus:ring-offset-gray-900`
   * and left light mode to the engine's `#fff` default - which is `panel`'s
   * light value, so naming the role keeps light identical and corrects dark
   * from a blue-tinted gray-900 to the neutral-800 the panel actually is.
   */
  it('takes a focus ring offset from the surface behind the control', () => {
    for (const rel of [
      'tabs/Tabs.stx',
      'radio/Radio.stx',
      'checkbox/Checkbox.stx',
      'pagination/Pagination.stx',
      'accordion/Accordion.stx',
      'accordion/AccordionItem.stx',
    ]) {
      const source = code(readFileSync(path.join(UI, rel), 'utf-8'))

      expect(source, rel).toContain('focus:ring-offset-panel')
      expect(source, rel).not.toMatch(/ring-offset-(?:gray|neutral)-\d{2,3}/)
    }
  })
})

/**
 * A hover that resolves to the resting value is not a hover.
 *
 * The sweep above checks the role TABLE: every `-hover` role differs from the
 * surface it partners. That cannot see a component pairing two roles itself,
 * and two links in `<Login>` were written `text-accent hover:text-accent` --
 * the same class twice, so "Forgot password?" and "Sign up" had no hover state
 * at all. They are `text-link hover:text-link-hover` now, which is what the
 * five links in `<Footer>` already used.
 *
 * Checked by resolving both sides rather than by comparing the class names: the
 * original #1993 defect was `bg-panel hover:bg-surface`, two DIFFERENT names
 * that share a dark value, and `text-accent hover:text-accent` is the same
 * defect with the spelling that makes it obvious. Only one of the two is
 * visible in review, so neither is checked that way.
 */
describe('a hovered role differs from its resting role (#1993)', () => {
  /** Longest first, so `ring-offset` is never read as `ring`. */
  const PAINTED = ['ring-offset', 'placeholder', 'divide', 'border', 'stroke', 'text', 'fill', 'ring', 'from', 'via', 'bg', 'to'] as const

  it('leaves no resting/hover pair resolving to one value', () => {
    const SRC = path.join(import.meta.dir, '..', 'src')
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.stx') ? [path.join(dir, e.name)] : []),
    )
    const findings: string[] = []

    for (const file of walk(SRC)) {
      for (const group of code(readFileSync(file, 'utf-8')).matchAll(/(?:class="|class=`|Classes = [`'"]|: ')([^"`']{0,700})/g)) {
        const classes = group[1].split(/\s+/).filter(Boolean)

        for (const prop of PAINTED) {
          const resting = classes.find(c => new RegExp(`^${prop}-[a-z][a-z-]*$`).test(c))
          const hovered = classes.find(c => new RegExp(`^hover:${prop}-[a-z][a-z-]*$`).test(c))
          if (!resting || !hovered)
            continue

          const a = SEMANTIC_TOKENS[resting.slice(prop.length + 1)]
          const b = SEMANTIC_TOKENS[hovered.slice(prop.length + 7)]
          if (!a || !b)
            continue

          for (const mode of ['light', 'dark'] as const) {
            if (a[mode] === b[mode])
              findings.push(`${path.relative(SRC, file)}: ${resting} -> ${hovered} are both ${a[mode]} in ${mode}`)
          }
        }
      }
    }

    expect([...new Set(findings)]).toEqual([])
  })

  /*
   * An `-ink` belongs on its own `-solid`, which is the fill it was measured
   * against. `<TabBarItem>`'s count badge put `text-danger-ink` on `bg-danger`
   * -- the TEXT role used as a fill -- and white on red-400 is 2.89:1 in dark
   * mode, under even the 3:1 graphics floor. On `danger-solid` it is 3.82:1 /
   * 4.76:1. A 10px badge is still short of the 4.5:1 that text this size wants
   * in light mode; that is the ceiling of a tiny count bubble rather than
   * something this pairing can fix, and the fills are tuned for the bold
   * button labels they mostly carry.
   */
  it('puts every ink on the fill it was measured against', () => {
    const SRC = path.join(import.meta.dir, '..', 'src')
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.stx') ? [path.join(dir, e.name)] : []),
    )
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      for (const group of code(readFileSync(file, 'utf-8')).matchAll(/(?:class="|class=`|Classes = [`'"]|: ')([^"`']{0,700})/g)) {
        const classes = group[1].split(/\s+/).filter(Boolean)
        const ink = classes.find(c => /^text-[a-z-]+-ink$/.test(c))
        const fill = classes.find(c => /^bg-[a-z-]+$/.test(c) && c.slice(3) in SEMANTIC_TOKENS)
        if (!ink || !fill)
          continue

        /*
         * `accent-soft-ink` goes on `accent-soft` and `inverse-ink` on
         * `inverse`: the ink names its fill. The six bare statuses are the
         * exception, because there `accent` is the TEXT role and the fill it
         * was measured against is `accent-solid`.
         */
        const name = ink.slice(5, -4)
        const expected = STATUSES.includes(name as typeof STATUSES[number]) ? `${name}-solid` : name
        if (fill.slice(3) !== expected)
          offenders.push(`${path.relative(SRC, file)}: ${ink} on ${fill}, not bg-${expected}`)
      }
    }

    expect(offenders).toEqual([])
  })

  it('gives the auth links the treatment the footer links already had', () => {
    const login = code(readFileSync(path.join(import.meta.dir, '..', 'src', 'ui/auth/Login.stx'), 'utf-8'))

    expect(login.match(/text-link[^"]*hover:text-link-hover/g)).toHaveLength(2)
    expect(login).not.toMatch(/hover:text-accent\b/)
  })
})

/**
 * A FOREGROUND is never a raw neutral shade.
 *
 * The migration's sweeps caught hovers and status shades, so five
 * foregrounds survived by being neither — and all five were unreadable in
 * light mode, where `neutral-400` is 2.06:1 to 2.59:1 against the surface
 * under it:
 *
 *   CommandPalette   placeholder-neutral-400  2.59:1 on a panel
 *   CommandPalette   text-neutral-400         2.59:1  (the search icon)
 *   SubscriptionCheckout  text-neutral-400    2.06:1 on a sunken well
 *   Footer x2        text-neutral-400         2.48:1  (the separators)
 *
 * `fg-soft` is neutral-500 / neutral-400, so its DARK value is the shade
 * these already used: the fix moves nothing in dark mode and lifts light mode
 * to 3.76:1 and 4.73:1. That shared dark value is also why it went unnoticed —
 * whoever checked it in dark mode saw the right colour.
 *
 * `placeholder-neutral-400` was the pointed one: ten placeholders in the
 * library name a role, and role-contrast.test.ts documents that this very
 * shade could not carry placeholder text. One field never got the memo.
 *
 * BACKGROUNDS are a different question and deliberately not swept here. A
 * scrim, a video letterbox and a toggle's off track are achromatic by intent
 * and have no themed surface behind them to take a role from.
 */
describe('a foreground is a role, not a shade (#1993)', () => {
  /*
   * Drawer's close button sits ON the scrim, outside the panel, so the thing
   * behind it is the overlay rather than a surface the theme controls.
   */
  const ON_AN_OVERLAY = ['ui/drawer/Drawer.stx: text-neutral-300']

  it('leaves no component painting text, a placeholder or a glyph from a shade', () => {
    const SRC = path.join(import.meta.dir, '..', 'src')
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.stx') ? [path.join(dir, e.name)] : []),
    )
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      const hits = code(readFileSync(file, 'utf-8'))
        .match(/\b(?:[a-z-]+:)*(?:text|placeholder|fill|stroke)-(?:neutral|gray|zinc|slate|stone)-\d{2,3}\b/g) ?? []

      if (hits.length)
        offenders.push(`${path.relative(SRC, file)}: ${hits.join(' ')}`)
    }

    expect(offenders).toEqual(ON_AN_OVERLAY)
  })

  /*
   * The reason the fix is safe, as a value: fg-soft's dark half IS the shade
   * that was there, so nothing moves in dark mode. Re-pointing fg-soft at
   * something lighter than neutral-400 would make these five unreadable again
   * and should fail here.
   */
  it('keeps fg-soft readable on every surface these five landed on', () => {
    for (const surface of ['panel', 'page', 'surface-sunken'] as const) {
      for (const mode of ['light', 'dark'] as const) {
        const ratio = contrastRatio(SEMANTIC_TOKENS['fg-soft'][mode], SEMANTIC_TOKENS[surface][mode])

        expect(ratio, `fg-soft on ${surface} (${mode}) is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
