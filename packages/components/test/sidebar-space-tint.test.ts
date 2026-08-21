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
import { deriveSpaceTint, normalizeSpace, resolveSpaceTint, spaceTintVars } from '../src/ui/sidebar/spaces'

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

  it('keeps the wash pale enough for a white card to read as raised', () => {
    // Arc's spaces are washes, not fills. Past roughly 40% the selection card
    // stops looking lifted off the panel.
    const tint = deriveSpaceTint('#ff383c')
    expect(seedPercent(tint.light.from)).toBeLessThanOrEqual(40)
  })

  it('holds a top-to-bottom ratio in the region Dia uses', () => {
    const tint = deriveSpaceTint('#34c759')
    const ratio = seedPercent(tint.light.from) / seedPercent(tint.light.to)
    expect(ratio).toBeGreaterThan(1.5)
    expect(ratio).toBeLessThan(4)
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
