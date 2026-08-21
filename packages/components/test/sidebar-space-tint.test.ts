/**
 * Which end of a space's panel carries its colour.
 *
 * `from` is the top of the gradient. The light and dark palettes used to
 * disagree about it: light ran 16% of the seed at the top down to 34% at the
 * bottom, while dark ran 26% down to 14%. So the same space put its colour at
 * opposite ends of the panel depending on the system appearance, and a layout
 * checked in one mode was wrong in the other.
 *
 * Arc and Dia both put the colour at the top and fade downward. Sampled from
 * Dia's sidebar at @2x, the panel is about three times as far from white near
 * the top (#caded6) as near the bottom (#eaf4f4).
 */
import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deriveSpaceTint, normalizeSpace, resolveSpaceTint, spaceTintVars, spaceWash, spaceWashGradient } from '../src/ui/sidebar/spaces'

/** The seed percentage out of a `color-mix(in oklab, SEED N%, INTO)` string. */
function seedPercent(value: string): number {
  const match = value.match(/(\d+(?:\.\d+)?)%/)
  expect(match).not.toBeNull()
  return Number.parseFloat(match![1])
}

describe('deriveSpaceTint: the colour sits at the top', () => {
  it('fades downward in light appearance', () => {
    const tint = deriveSpaceTint('#0088ff')
    expect(seedPercent(tint.light.from)).toBeGreaterThan(seedPercent(tint.light.to))
  })

  it('fades downward in dark appearance too', () => {
    const tint = deriveSpaceTint('#0088ff')
    expect(seedPercent(tint.dark.from)).toBeGreaterThan(seedPercent(tint.dark.to))
  })

  it('agrees between the two appearances', () => {
    // The actual regression: not that either direction was wrong on its own,
    // but that they pointed opposite ways.
    const tint = deriveSpaceTint('#34c759')
    const lightFadesDown = seedPercent(tint.light.from) > seedPercent(tint.light.to)
    const darkFadesDown = seedPercent(tint.dark.from) > seedPercent(tint.dark.to)
    expect(lightFadesDown).toBe(darkFadesDown)
  })

  it('matches the strength sampled from Dia', () => {
    // Dia's panel sits ~43 from white at the top and ~15 at the bottom,
    // averaged over RGB. A mix into white tracks its percentage almost
    // one-to-one, so those readings ARE the percentages. The previous 34/16
    // was visibly paler than the thing it imitated.
    const tint = deriveSpaceTint('#34c759')
    expect(seedPercent(tint.light.from)).toBeGreaterThanOrEqual(40)
    expect(seedPercent(tint.light.from)).toBeLessThanOrEqual(48)
    expect(seedPercent(tint.light.to)).toBeLessThanOrEqual(18)
  })

  it('holds the top-to-bottom ratio Dia holds', () => {
    // Dia measures 2.95. Getting the magnitude right without the ratio gives a
    // panel that is strong but flat, which is what 34/16 (ratio 2.0) was.
    const tint = deriveSpaceTint('#34c759')
    const ratio = seedPercent(tint.light.from) / seedPercent(tint.light.to)
    expect(ratio).toBeGreaterThan(2.5)
    expect(ratio).toBeLessThan(3.4)
  })

  it('keeps both appearances in step when the strength moves', () => {
    // Dark is scaled by the same factor as light rather than left behind, or
    // strengthening one mode quietly makes the two disagree again — the exact
    // failure the direction fix was about.
    const tint = deriveSpaceTint('#0088ff')
    const lightRatio = seedPercent(tint.light.from) / seedPercent(tint.light.to)
    const darkRatio = seedPercent(tint.dark.from) / seedPercent(tint.dark.to)
    expect(Math.abs(lightRatio - darkRatio)).toBeLessThan(0.5)
  })

  it('leaves a white selection card clearly lighter than the panel', () => {
    // The constraint the old note used to justify staying pale. It is a real
    // constraint — it is just satisfied at this strength, as Dia demonstrates.
    // A card needs to sit well clear of the panel it floats on; at 44% of a
    // seed mixed into white the panel is still far nearer white than not.
    const tint = deriveSpaceTint('#ff383c')
    expect(seedPercent(tint.light.from)).toBeLessThan(60)
  })
})

describe('resolveSpaceTint', () => {
  it('accepts a macOS system colour name', () => {
    expect(resolveSpaceTint('blue').light.from).toContain('#0088ff')
  })

  it('accepts any CSS colour', () => {
    expect(resolveSpaceTint('#ff6b6b').light.from).toContain('#ff6b6b')
  })

  it('passes a prebuilt palette straight through', () => {
    const built = deriveSpaceTint('#0088ff')
    expect(resolveSpaceTint(built)).toBe(built)
  })

  it('falls back to a neutral rather than to nothing', () => {
    // An untinted space has to sit in the same perceptual family as the
    // tinted ones, or it reads as broken rather than as deliberate.
    expect(resolveSpaceTint().light.from).toContain('color-mix')
  })
})

describe('spaceTintVars', () => {
  it('publishes both appearances so the server can render either', () => {
    const vars = spaceTintVars(deriveSpaceTint('blue'))
    for (const name of ['light-from', 'light-to', 'light-ink', 'light-accent', 'dark-from', 'dark-to', 'dark-ink', 'dark-accent'])
      expect(vars).toContain(`--stx-space-${name}:`)
  })
})

describe('normalizeSpace: whether the panel draws its own title', () => {
  it('draws it by default', () => {
    expect(normalizeSpace({ id: 'a', label: 'Personal' }).showTitle).toBe(true)
  })

  it('can be turned off when the app names the space elsewhere', () => {
    // An Arc header with a title puts the name beside the traffic lights, the
    // way Dia does; drawing it again inside the panel says the same thing
    // twice and spends a line of panel height doing it.
    expect(normalizeSpace({ id: 'a', label: 'Personal', showTitle: false }).showTitle).toBe(false)
  })

  it('keeps the label even when the title is suppressed', () => {
    // The label is still the panel's accessible name and the switcher rail's
    // tooltip, so suppressing the title must not drop it.
    expect(normalizeSpace({ id: 'a', label: 'Personal', showTitle: false }).label).toBe('Personal')
  })
})

describe('the panel is painted as one fade, not a bulge', () => {
  const source = readFileSync(join(import.meta.dir, '..', 'src', 'ui', 'sidebar', 'Sidebar.stx'), 'utf8')

  /** The `background:` declarations inside the space-painting rules. */
  function spaceBackgrounds(): string[] {
    return [...source.matchAll(/background:\s*([^;]+);/g)]
      .map(match => match[1])
      .filter(value => value.includes('--stx-space-from'))
  }

  it('paints both appearances with the space colour', () => {
    expect(spaceBackgrounds()).toHaveLength(2)
  })

  it('layers no white sheen over the end that carries the colour', () => {
    // A highlight falling off over the top third made sense when the tint ran
    // pale-at-top; with the colour anchored there it bleaches the space's own
    // identity and turns a fade into a bulge — lightest at the crown, darkest
    // a third down, lightening again below.
    for (const background of spaceBackgrounds())
      expect(background).not.toContain('rgba(255, 255, 255')
  })

  it('uses a single linear-gradient per appearance', () => {
    for (const background of spaceBackgrounds())
      expect(background.match(/linear-gradient/g)).toHaveLength(1)
  })
})

/**
 * The SHAPE of the wash down the panel, as opposed to its strength.
 *
 * Sampled from Dia at @2x down a column with no rows, tiles or switcher on it
 * (x=748 of the reference capture, the full panel height), then normalised to
 * 1 at the top and 0 at the bottom. One reading is dropped: t=0.45 breaks
 * monotonicity by +0.14 where its neighbours are smooth, so it is a divider or
 * the switcher rather than the wash.
 */
const DIA_CURVE: Array<[number, number]> = [
  [0.00, 1.000], [0.05, 0.887], [0.10, 0.790], [0.15, 0.774], [0.20, 0.694],
  [0.25, 0.597], [0.30, 0.548], [0.35, 0.532], [0.40, 0.452], [0.50, 0.323],
  [0.55, 0.274], [0.60, 0.258], [0.65, 0.161], [0.70, 0.129], [0.75, 0.097],
  [0.80, 0.000], [0.85, 0.000], [0.90, 0.000], [1.00, 0.000],
]

/**
 * A CSS colour interpolation hint, evaluated the way the spec defines it: the
 * transition's progress is raised to a power chosen so the midpoint lands on
 * the hint. Returns remaining strength, 1 down to 0.
 */
function washAt(t: number, hint = spaceWash.hint / 100, end = spaceWash.end / 100): number {
  if (t >= end)
    return 0
  const exponent = Math.log(0.5) / Math.log(hint / end)
  return 1 - (t / end) ** exponent
}

function rmsAgainstDia(fit: (t: number) => number): number {
  const total = DIA_CURVE.reduce((sum, [t, n]) => sum + (fit(t) - n) ** 2, 0)
  return Math.sqrt(total / DIA_CURVE.length)
}

describe('the wash follows Dia\'s curve, not a straight line', () => {
  it('reaches half strength well before halfway down', () => {
    // The single most visible departure: Dia is at half strength at 35%, where
    // a two-stop gradient is still at 65%.
    expect(washAt(spaceWash.hint / 100)).toBeCloseTo(0.5, 2)
    expect(spaceWash.hint).toBeLessThan(45)
  })

  it('has flattened onto its final value before the bottom', () => {
    expect(washAt(spaceWash.end / 100)).toBe(0)
    expect(washAt(0.95)).toBe(0)
    expect(spaceWash.end).toBeLessThan(100)
  })

  it('fits Dia far better than a straight line does', () => {
    const eased = rmsAgainstDia(t => washAt(t))
    const linear = rmsAgainstDia(t => 1 - t)
    expect(eased).toBeLessThan(0.05)
    expect(eased).toBeLessThan(linear / 4)
  })

  it('never departs from Dia by more than a hair', () => {
    const worst = Math.max(...DIA_CURVE.map(([t, n]) => Math.abs(washAt(t) - n)))
    // 0.06 of a span that is ~21 8-bit steps wide is about one step.
    expect(worst).toBeLessThan(0.06)
  })

  it('stays monotonic, so the panel still reads as one fade', () => {
    let previous = Number.POSITIVE_INFINITY
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const value = washAt(t)
      expect(value).toBeLessThanOrEqual(previous + 1e-9)
      previous = value
    }
  })
})

describe('spaceWashGradient', () => {
  it('places the hint and the flattening stop where the constants say', () => {
    expect(spaceWashGradient('red', 'blue'))
      .toBe(`linear-gradient(180deg, red 0%, ${spaceWash.hint}%, blue ${spaceWash.end}%)`)
  })

  it('matches every copy of the CSS the components paint with', () => {
    // The helper exists so a consumer painting the same surface draws the same
    // curve. If a component's own CSS drifts from it, that promise is void.
    //
    // Scanned across the whole directory rather than one file, because the
    // rule genuinely exists twice: Sidebar.stx paints the pane, and
    // SidebarSpaces.stx mirrors it for a space used standalone. Three
    // corrections to the wash — direction, sheen, curve — landed only in the
    // first, and the second kept painting an upside-down, bleached, linear
    // version for months' worth of releases without a test noticing.
    const dir = join(import.meta.dir, '..', 'src', 'ui', 'sidebar')
    const expected = spaceWashGradient('var(--stx-space-from)', 'var(--stx-space-to)')

    const painted = readdirSync(dir)
      .filter(name => name.endsWith('.stx'))
      .flatMap((name) => {
        const source = readFileSync(join(dir, name), 'utf8')
        return [...source.matchAll(/background:\s*(linear-gradient\([^;]+)\);/g)]
          .map(match => ({ file: name, value: `${match[1]})` }))
          .filter(entry => entry.value.includes('--stx-space-from'))
      })

    // Two components, each with a light and a dark rule.
    expect(painted).toHaveLength(4)
    expect(new Set(painted.map(entry => entry.file)).size).toBe(2)

    for (const entry of painted)
      expect({ file: entry.file, value: entry.value }).toEqual({ file: entry.file, value: expected })
  })

  it('leaves no sheen layered over any of them', () => {
    // The bleaching layer was removed from one file and left in the other.
    const dir = join(import.meta.dir, '..', 'src', 'ui', 'sidebar')
    for (const name of readdirSync(dir).filter(entry => entry.endsWith('.stx'))) {
      const source = readFileSync(join(dir, name), 'utf8')
      for (const match of source.matchAll(/background:\s*([^;]+);/g)) {
        if (match[1].includes('--stx-space-from'))
          expect({ file: name, hasSheen: match[1].includes('rgba(255, 255, 255') }).toEqual({ file: name, hasSheen: false })
      }
    }
  })
})
