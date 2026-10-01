/**
 * The role table's own contrast, measured rather than assumed.
 *
 * `-ink` exists so that text on a fill moves when the fill moves: components
 * wrote `text-white` beside every solid background, which is right for the
 * stock hues and unreadable the moment an app points a fill somewhere light
 * (stacksjs/stx#1993). Nobody had measured whether it was right for the stock
 * hues either, and for two of the six it was not:
 *
 *   white on cyan-500   2.36:1       white on green-500   2.22:1
 *
 * Below the 3:1 floor for text at any size. `info-ink` and `success-ink` named
 * a colour that could not be read on the fill they exist for - the same defect
 * `warning-ink` already carried a dark value to avoid, because white on
 * yellow-500 is 1.90:1.
 *
 * Neither role had a single use in the library when this was found, so nothing
 * changed on screen; the fills appear as spinner dots and progress bars with no
 * text on them. The fix is for the app that reaches for the role next, which is
 * exactly the app the role vocabulary is for.
 *
 * The existing a11y helper's `checkColorContrast` could not catch this: it
 * matches class-name patterns and reports what is "potentially" low, while here
 * every class involved was a role name and the problem was the value behind it.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { SEMANTIC_TOKENS } from '../../stx/src/theme-tokens'
import { contrastRatio } from './utils/wcag-contrast'

const STATUSES = ['accent', 'secondary', 'info', 'danger', 'success', 'warning'] as const
const MODES = ['light', 'dark'] as const

/** WCAG 2.1: 3:1 for large or bold display text and for graphics, 4.5:1 otherwise. */
const LARGE_TEXT = 3
const NORMAL_TEXT = 4.5

function inkOnFill(status: string, mode: 'light' | 'dark'): number {
  return contrastRatio(SEMANTIC_TOKENS[`${status}-ink`][mode], SEMANTIC_TOKENS[`${status}-solid`][mode])
}

describe('an ink is readable on the fill it belongs to', () => {
  it('clears 3:1 for every status in both modes', () => {
    for (const status of STATUSES) {
      for (const mode of MODES) {
        const ratio = inkOnFill(status, mode)

        expect(ratio, `${status}-ink on ${status}-solid (${mode}) is ${ratio.toFixed(2)}:1`)
          .toBeGreaterThanOrEqual(LARGE_TEXT)
      }
    }
  })

  /*
   * The three dark inks are dark for a measured reason, so the reason is
   * asserted too: white on these fills fails outright, which is what stops
   * someone "simplifying" the table back to six identical white inks.
   */
  it('keeps a dark ink exactly where white would fail', () => {
    for (const status of ['info', 'success', 'warning'] as const) {
      expect(SEMANTIC_TOKENS[`${status}-ink`].light).toBe('neutral-900')

      const whiteWould = contrastRatio('white', SEMANTIC_TOKENS[`${status}-solid`].light)

      expect(whiteWould, `white on ${status}-solid is ${whiteWould.toFixed(2)}:1, which does not need a dark ink`)
        .toBeLessThan(LARGE_TEXT)
    }
  })

  /*
   * accent, secondary and danger keep white and are recorded here rather than
   * changed. They clear the 3:1 graphics floor and miss 4.5:1, and they are
   * blue-500, purple-500 and red-500 - what every primary and destructive
   * button in the library already paints. Darkening them is a change to the
   * house hues, not a migration.
   *
   * Pinned as a RANGE so the state is explicit: if one drifts below 3:1 the
   * test above fails, and if someone darkens a fill enough to clear 4.5:1 this
   * one fails and asks for the decision to be written down.
   */
  it('records the three white inks that clear 3:1 but not 4.5:1', () => {
    for (const status of ['accent', 'secondary', 'danger'] as const) {
      expect(SEMANTIC_TOKENS[`${status}-ink`].light).toBe('white')

      const ratio = inkOnFill(status, 'light')

      expect(ratio).toBeGreaterThanOrEqual(LARGE_TEXT)
      expect(ratio).toBeLessThan(NORMAL_TEXT)
    }
  })

  /*
   * A tinted fill carries body text - a badge, a callout - so it has to clear
   * the full 4.5:1 rather than the graphics floor. All twelve do comfortably,
   * which is the argument for the soft pair being 100/800 rather than a
   * narrower step.
   */
  it('clears 4.5:1 for every tinted fill, which carries body text', () => {
    for (const status of STATUSES) {
      for (const mode of MODES) {
        const ratio = contrastRatio(
          SEMANTIC_TOKENS[`${status}-soft-ink`][mode],
          SEMANTIC_TOKENS[`${status}-soft`][mode],
        )

        expect(ratio, `${status}-soft-ink on ${status}-soft (${mode}) is ${ratio.toFixed(2)}:1`)
          .toBeGreaterThanOrEqual(NORMAL_TEXT)
      }
    }
  })
})

describe('neutral text is readable on the neutral surfaces it lands on', () => {
  /*
   * `fg-subtle` is deliberately absent. It is placeholder text at neutral-400,
   * which reads 2.59:1 on a white field - a real weak spot, and one shared with
   * every framework that places placeholders at this step. Raising it is a
   * change to how a form looks at rest, so it is reported rather than decided
   * by a test.
   */
  const PAIRINGS = [
    ['fg', 'panel'],
    ['fg', 'surface'],
    ['fg-strong', 'surface-sunken'],
    ['fg-strong', 'panel'],
    ['fg-muted', 'panel'],
    ['fg-muted', 'surface'],
    ['inverse-ink', 'inverse'],
  ] as const

  it('clears 4.5:1 for every pairing a component actually uses', () => {
    for (const [fg, bg] of PAIRINGS) {
      for (const mode of MODES) {
        const ratio = contrastRatio(SEMANTIC_TOKENS[fg][mode], SEMANTIC_TOKENS[bg][mode])

        expect(ratio, `${fg} on ${bg} (${mode}) is ${ratio.toFixed(2)}:1`)
          .toBeGreaterThanOrEqual(NORMAL_TEXT)
      }
    }
  })

  /*
   * Stepper's upcoming step is why this pairing is here. All three states
   * shared one `text-white`, so a step that had not been reached yet rendered
   * its number white on neutral-300 - 1.48:1, invisible. The ink is per-state
   * now, and `fg-strong` rather than `fg-muted` because muted reads 4.11:1 in
   * dark mode, which would have traded one failure for another.
   */
  it('reads a not-yet-reached step number in both modes', () => {
    for (const mode of MODES) {
      const ratio = contrastRatio(SEMANTIC_TOKENS['fg-strong'][mode], SEMANTIC_TOKENS['surface-sunken'][mode])

      expect(ratio, `the upcoming step number (${mode}) is ${ratio.toFixed(2)}:1`)
        .toBeGreaterThanOrEqual(NORMAL_TEXT)
    }

    /*
     * And the ink it replaced, in the mode where it was wrong. Only LIGHT mode
     * was broken - white on neutral-700 is 10.39:1 and read perfectly well -
     * which is why a shared ink survived: whoever wrote it almost certainly
     * checked it in dark mode.
     */
    const whiteWould = contrastRatio('white', SEMANTIC_TOKENS['surface-sunken'].light)

    expect(whiteWould, `white on surface-sunken is ${whiteWould.toFixed(2)}:1 in light mode`)
      .toBeLessThan(LARGE_TEXT)
  })
})

/**
 * No component writes `text-white` beside a fill role.
 *
 * That pairing is the original defect in miniature: the fill follows the app's
 * theme and the text does not, so pointing `--stx-accent-solid` at anything
 * light leaves an invisible label. Six sites had it, including two where the
 * fill was already a role and only the ink had been missed.
 */
describe('no component pins its ink while its fill is themeable', () => {
  const SRC = path.join(import.meta.dir, '..', 'src')
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : (e.name.endsWith('.stx') ? [path.join(dir, e.name)] : []),
  )
  const code = (source: string) => source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\{--[\s\S]*?--\}\}/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  const BOUND = `[\\s'"\`{}()?:]`
  const FILL = /\bbg-(?:accent|secondary|info|danger|success|warning)(?:-solid)?\b/
  const WHITE = new RegExp(`(?:^|${BOUND})(?:[a-z-]+:)?text-white(?=${BOUND}|$)`)

  it('pairs every themeable fill with a themeable ink', () => {
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      // Per class STRING, since a variant map puts each fill in its own one.
      for (const m of code(readFileSync(file, 'utf-8')).matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`\n]*)`/g)) {
        const classes = ` ${m[1] ?? m[2] ?? m[3] ?? ''} `

        if (FILL.test(classes) && WHITE.test(classes))
          offenders.push(`${path.relative(SRC, file)}: ${classes.trim().slice(0, 70)}`)
      }
    }

    expect(offenders).toEqual([])
  })
})
