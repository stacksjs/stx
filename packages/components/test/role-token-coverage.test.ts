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
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { SEMANTIC_TOKENS, SHAPE_TOKENS, semanticColors, semanticTokenCSS, shapeVariable, tokenVariable } from '../../stx/src/theme-tokens'
import { generateCss } from '../../stx/src/dev-server/ts-css'
import { defaultConfig } from '@stacksjs/ts-css/engine'

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
    const css = await generateCss('<div class="ring-danger-line text-danger-fg placeholder-danger-fg-subtle focus:ring-danger-focus"></div>')

    for (const role of FIELD_ERROR)
      expect(css, `${role} did not compile`).toContain(`var(${tokenVariable(role)},`)

    // `placeholder-*` is a pseudo-element variant, not a plain colour utility.
    expect(css).toContain('::placeholder')
  })

  /*
   * The point of the names: they mirror the RESTING branch one for one, so the
   * two states read as the same four decisions rather than as two unrelated
   * class strings.
   */
  it('mirrors the resting branch name for name', () => {
    for (const rel of ['input/TextInput.stx', 'input/NumberInput.stx', 'input/PasswordInput.stx', 'select/Select.stx', 'textarea/Textarea.stx']) {
      const source = code(readFileSync(path.join(UI, rel), 'utf-8'))

      expect(source, rel).toContain("'ring-danger-line text-danger-fg placeholder-danger-fg-subtle focus:ring-danger-focus'")
      expect(source, rel).toContain("'ring-line-strong text-fg placeholder-fg-subtle focus:ring-accent'")
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
   * Switch's off-state and focus-ring offsets are achromatic by design: a
   * toggle that is off has no hue, and giving it one would be inventing a
   * decision rather than preserving it.
   */
  it('leaves Switch\'s achromatic parts achromatic', () => {
    const sw = code(readFileSync(path.join(UI, 'switch/Switch.stx'), 'utf-8'))

    expect(sw).toContain('bg-accent-solid')
    expect(sw).toMatch(/bg-neutral-\d{3}/)
  })
})
