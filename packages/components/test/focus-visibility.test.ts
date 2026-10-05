/**
 * Keyboard focus produces a visible change, and the change is visible in BOTH
 * modes.
 *
 * The colour migration (stacksjs/stx#1993) moved every painted surface onto a
 * role, and in doing so it made the focus rings measurable for the first time.
 * Three of them could not be seen:
 *
 *   Switch          `focus-visible:ring-white` on a white panel     1.00:1
 *   Button + 12     `focus:ring-accent-solid` on a dark field       1.98:1
 *   Login/Signup    `focus-visible:ring-transparent`                absent
 *
 * Each survives review for a different reason, and none of them is a missing
 * class. Switch named white because its offset band was neutral-300, so the
 * ring reads in a mockup drawn on grey and vanishes on the panel it ships on.
 * The thirteen named `accent-solid` - a FILL role, which gets DARKER in dark
 * mode (blue-500 -> blue-600) for the same reason a button fill does, while a
 * focus ring has to get lighter to stay on a dark surface. theme-tokens.ts
 * already says so where it explains why `danger-focus` lightens, and already
 * pairs the resting branch name for name:
 *
 *     focus:ring-accent      <->  focus:ring-danger-focus
 *
 * so the error branch had the right role all along and the neutral branch used
 * a fill. And `ring-transparent` on the four OAuth buttons did not merely fail
 * to indicate focus: those buttons draw their edge with `ring-1 ring-inset`, so
 * tabbing to one REMOVED its border.
 *
 * What is pinned here is the property rather than the classes: a focus
 * indicator clears the 3:1 that WCAG 1.4.11 asks of a non-text indicator,
 * against every neutral surface a control in this library can sit on.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { SEMANTIC_TOKENS } from '../../stx/src/theme-tokens'
import { contrastRatio } from './utils/wcag-contrast'

const SRC = path.join(import.meta.dir, '..', 'src')
const MODES = ['light', 'dark'] as const

/** WCAG 2.1 SC 1.4.11: a non-text indicator needs 3:1. */
const INDICATOR = 3

/** Every neutral a focusable control in this library can be painted on. */
const SURFACES = ['panel', 'page', 'field', 'surface', 'surface-raised'] as const

/** Source with comments removed: a comment naming a class is not a use of it. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\{--[\s\S]*?--\}\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

function stxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory()
      ? stxFiles(path.join(dir, e.name))
      : (e.name.endsWith('.stx') ? [path.join(dir, e.name)] : []),
  )
}

/** `focus:ring-accent` -> `accent`; width and offset utilities are not colours. */
const FOCUS_COLOUR = /\b(?:focus|focus-visible|group-focus-visible):(?:ring|outline)-([a-z][a-z0-9/-]*)\b/g
/*
 * A width (`ring-2`) is not a colour, and `ring-offset-panel` is the band
 * BETWEEN the element and the ring: it matches the background on purpose, so
 * measuring it against that background would assert the opposite of its job.
 */
const NOT_A_COLOUR = /^(?:0|1|2|4|8|inset|none|hidden|dashed|solid|double)$|^offset(?:-|$)/

/**
 * The sidebar paints itself with translucent white over a per-space tint, so
 * its focus rings are alpha over an unknown colour by design and there is no
 * pair of shades to resolve. See docs/features/sidebar-spaces.md.
 */
const ALPHA_BY_DESIGN = new Set(['black/10', 'white/15'])

function focusColours(): Map<string, string[]> {
  const byName = new Map<string, string[]>()

  for (const file of stxFiles(SRC)) {
    const source = code(readFileSync(file, 'utf-8'))
    for (const [, name] of source.matchAll(FOCUS_COLOUR)) {
      if (NOT_A_COLOUR.test(name))
        continue
      const rel = path.relative(SRC, file)
      byName.set(name, [...(byName.get(name) ?? []), rel])
    }
  }

  return byName
}

describe('a focus indicator can be seen, in both modes (#1993)', () => {
  it('names a role for every focus ring, never a palette shade', () => {
    const offenders: string[] = []

    for (const [name, files] of focusColours()) {
      if (ALPHA_BY_DESIGN.has(name) || name in SEMANTIC_TOKENS)
        continue
      offenders.push(`${name} (${[...new Set(files)].join(', ')})`)
    }

    expect(offenders).toEqual([])
  })

  it('clears 3:1 against every surface a control can sit on', () => {
    const failures: string[] = []

    for (const [name, files] of focusColours()) {
      if (ALPHA_BY_DESIGN.has(name))
        continue
      const role = SEMANTIC_TOKENS[name]
      if (!role)
        continue

      for (const mode of MODES) {
        for (const surface of SURFACES) {
          const ratio = contrastRatio(role[mode], SEMANTIC_TOKENS[surface][mode])
          if (ratio < INDICATOR)
            failures.push(`${name} on ${surface} (${mode}) is ${ratio.toFixed(2)}:1 — ${[...new Set(files)].join(', ')}`)
        }
      }
    }

    expect(failures).toEqual([])
  })

  /*
   * The rule the fix follows, stated as a value rather than a class so that
   * re-pointing a focus ring at a fill role fails here rather than on screen.
   * A fill darkens in dark mode; a focus ring lightens.
   */
  it('lightens every focus role in dark mode, unlike a fill', () => {
    const step = (ref: string) => (ref === 'white' ? 0 : Number(ref.split('-').pop()))

    for (const [name] of focusColours()) {
      const role = SEMANTIC_TOKENS[name]
      if (!role)
        continue

      expect(step(role.dark), `${name} must lighten in dark mode, has ${role.light} -> ${role.dark}`)
        .toBeLessThan(step(role.light))
    }
  })

  /*
   * `accent-solid` is the fill. It is 2.88:1 on a dark panel and 1.98:1 on a
   * dark field, which is what thirteen focus rings shipped, Button among them.
   */
  it('keeps the fill role out of the focus rings that used it', () => {
    for (const file of stxFiles(SRC))
      expect(code(readFileSync(file, 'utf-8')), path.relative(SRC, file)).not.toMatch(/focus(?:-visible)?:ring-accent-solid/)

    expect(contrastRatio(SEMANTIC_TOKENS['accent-solid'].dark, SEMANTIC_TOKENS.field.dark)).toBeLessThan(INDICATOR)
    expect(contrastRatio(SEMANTIC_TOKENS.accent.dark, SEMANTIC_TOKENS.field.dark)).toBeGreaterThanOrEqual(INDICATOR)
  })

  /*
   * Switch drew its ring white against a neutral-300 offset band: legible in a
   * mockup on grey, 1.00:1 on the panel it ships on.
   */
  it('gives Switch a ring that is not the colour of the panel under it', () => {
    const sw = code(readFileSync(path.join(SRC, 'ui/switch/Switch.stx'), 'utf-8'))

    expect(sw).not.toMatch(/ring-white\b/)
    expect(sw).toContain('focus-visible:ring-accent')
    expect(sw).toContain('focus-visible:ring-offset-panel')
    expect(contrastRatio('white', SEMANTIC_TOKENS.panel.light)).toBe(1)
  })

  /*
   * A transparent focus ring is not a missing indicator but a destructive one
   * on the four OAuth buttons, whose edge IS a ring.
   */
  it('never removes a border to indicate focus', () => {
    const offenders: string[] = []

    for (const file of stxFiles(SRC)) {
      if (/focus(?:-visible)?:ring-transparent/.test(code(readFileSync(file, 'utf-8'))))
        offenders.push(path.relative(SRC, file))
    }

    expect(offenders).toEqual([])
  })

  it('leaves the social buttons an edge that changes colour on focus', () => {
    for (const rel of ['ui/auth/Login.stx', 'ui/auth/Signup.stx']) {
      const source = code(readFileSync(path.join(SRC, rel), 'utf-8'))

      expect(source, rel).toContain('ring-1 ring-line-strong ring-inset')
      expect(source.match(/focus-visible:ring-2 focus-visible:ring-accent/g), rel).toHaveLength(2)
    }
  })
})

/**
 * A floating panel has an edge in both modes.
 *
 * Seven panels drew it as `ring-black/5` — correct on a light page, and 1.00:1
 * against a dark one, where `shadow-lg` has little to work with either. Two of
 * the seven had noticed and added a `dark:` variant, at two different shades
 * (neutral-600 and neutral-700), while using `divide-line` for the dividers
 * INSIDE the same element. They all take `ring-line` now, which is the role
 * those dividers already named.
 */
describe('a floating panel has a hairline in both modes (#1993)', () => {
  const FLOATING = [
    'ui/combobox/ComboboxOptions.stx',
    'ui/command-palette/CommandPalette.stx',
    'ui/dropdown/DropdownItems.stx',
    'ui/listbox/ListboxOptions.stx',
    'ui/notification/Notification.stx',
    'ui/payment/DefaultPaymentMethod.stx',
    'ui/popover/PopoverPanel.stx',
  ] as const

  it('draws every one of them from the line role', () => {
    for (const rel of FLOATING) {
      const source = code(readFileSync(path.join(SRC, rel), 'utf-8'))

      expect(source, rel).toMatch(/ring-1 ring-line\b/)
      expect(source, rel).not.toContain('ring-black/5')
    }
  })

  it('separates the hairline from the page behind it, in both modes', () => {
    for (const mode of MODES) {
      const ratio = contrastRatio(SEMANTIC_TOKENS.line[mode], SEMANTIC_TOKENS.page[mode])

      expect(ratio, `line on page (${mode})`).toBeGreaterThan(1.1)
    }
  })

  it('leaves no panel naming a neutral shade for its ring', () => {
    const offenders: string[] = []

    for (const file of stxFiles(SRC)) {
      const hits = code(readFileSync(file, 'utf-8'))
        .match(/\b(?:[a-z-]+:)*ring-(?:neutral|gray|zinc|slate|stone)-\d{2,3}\b/g) ?? []

      if (hits.length)
        offenders.push(`${path.relative(SRC, file)}: ${hits.join(' ')}`)
    }

    expect(offenders).toEqual([])
  })
})

/**
 * A hovered EDGE is a role too.
 *
 * The sweep that caught the hovered surfaces matched `hover:bg-*` only, so
 * Select's `hover:ring-neutral-400 dark:hover:ring-neutral-500` sat beside a
 * tokenised `ring-line-strong` and was not looked at. It is `line-hover` now,
 * the sixth member of a family that already had surface, surface-raised,
 * surface-sunken, field and link.
 */
describe('a hovered edge is a role (#1993)', () => {
  it('has a line-hover, and it moves toward contrast in both modes', () => {
    const step = (ref: string) => (ref === 'white' ? 0 : Number(ref.split('-').pop()))
    const hover = SEMANTIC_TOKENS['line-hover']
    const resting = SEMANTIC_TOKENS['line-strong']

    expect(hover).toBeDefined()
    // Light: darker than the resting border. Dark: lighter than it.
    expect(step(hover.light)).toBeGreaterThan(step(resting.light))
    expect(step(hover.dark)).toBeLessThan(step(resting.dark))
  })

  it('leaves no component naming a neutral shade on a hovered edge', () => {
    const offenders: string[] = []

    for (const file of stxFiles(SRC)) {
      const hits = code(readFileSync(file, 'utf-8'))
        .match(/\b(?:[a-z-]+:)*hover:(?:ring|border|divide)-(?:neutral|gray|zinc|slate|stone)-\d{2,3}\b/g) ?? []

      if (hits.length)
        offenders.push(`${path.relative(SRC, file)}: ${hits.join(' ')}`)
    }

    expect(offenders).toEqual([])
  })

  it('reads Select\'s two branches as the same decision', () => {
    const select = code(readFileSync(path.join(SRC, 'ui/select/Select.stx'), 'utf-8'))

    expect(select).toContain('hover:ring-line-hover')
    expect(select).not.toMatch(/hover:ring-neutral-\d{3}/)
  })
})

/**
 * An offset band names the background behind it, or it is white.
 *
 * `ring-offset-2` sets a WIDTH. The colour is a separate utility, and the
 * engine's fallback for it is literal white:
 *
 *     --tc-ring-offset-shadow: ... var(--tc-ring-offset-color, #fff)
 *
 * which is right in light mode and, in dark mode, a 2px white band around the
 * control - 15.12:1 against a panel and 17.91:1 against the page, brighter
 * than the ring it is supposed to sit behind. Three components set the width
 * and not the colour, `<Button>` among them, so it was the whole library's
 * most-used focus treatment.
 *
 * The band's job is the opposite of the ring's: the ring has to be seen
 * against the background, the band has to vanish into it. So this is asserted
 * as a ceiling where the ring is asserted as a floor.
 */
describe('a focus ring offset disappears into the background (#1993)', () => {
  /** A band more visible than this is a halo, not a gap. */
  const BAND_CEILING = 1.3

  it('names an offset colour wherever it sets an offset width', () => {
    const offenders: string[] = []

    for (const file of stxFiles(SRC)) {
      const source = code(readFileSync(file, 'utf-8'))
      if (!/ring-offset-(?:[0-9]+)\b/.test(source))
        continue
      if (!/ring-offset-(?:panel|surface|page|content|field)\b/.test(source))
        offenders.push(path.relative(SRC, file))
    }

    expect(offenders).toEqual([])
  })

  it('keeps the band within a shade of the surface it sits on', () => {
    for (const mode of MODES) {
      for (const surface of ['panel', 'page'] as const) {
        const ratio = contrastRatio(SEMANTIC_TOKENS.panel[mode], SEMANTIC_TOKENS[surface][mode])

        expect(ratio, `offset-panel on ${surface} (${mode}) is ${ratio.toFixed(2)}:1`)
          .toBeLessThanOrEqual(BAND_CEILING)
      }
    }
  })

  /*
   * The value the default falls back to, so the reason the utility is required
   * is recorded rather than described: white is a halo on both dark neutrals.
   */
  it('shows why the engine default cannot be left in place', () => {
    for (const surface of ['panel', 'page'] as const) {
      expect(contrastRatio('white', SEMANTIC_TOKENS[surface].dark)).toBeGreaterThan(15)
      expect(contrastRatio('white', SEMANTIC_TOKENS[surface].light)).toBeLessThanOrEqual(BAND_CEILING)
    }
  })
})
