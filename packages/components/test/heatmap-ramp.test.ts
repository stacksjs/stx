/**
 * The Heatmap's default ramp is sequential and themeable (stacksjs/stx#1938).
 *
 * The legend was a blue-cyan-green-yellow-red rainbow, which is the one ramp a
 * sequential scale should not use, for two reasons that both show up in real
 * reading:
 *
 * It invents boundaries. The transitions through cyan and yellow are
 * perceptually much sharper than the ones on either side, so a reader sees bands
 * and infers categories where the data is continuous.
 *
 * It is not monotonic in lightness. Yellow is far lighter than both ends, so the
 * ramp goes light in the middle — printed in greyscale, or read with a colour
 * vision deficiency, "high" and "low" become indistinguishable while the middle
 * stands out.
 *
 * Monotonic lightness is therefore what gets asserted, computed from the hex
 * rather than compared against a list of expected colours. A list would pin the
 * palette someone happened to pick; this pins the property that makes the
 * palette legible, and it keeps holding if the hues are retuned.
 *
 * Rendered through `processDirectives` rather than read out of the source: what
 * matters is the gradient an app receives.
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const UI = join(import.meta.dir, '..', 'src', 'ui')

async function render(template: string): Promise<string> {
  const options = { ...defaultConfig, componentsDir: UI } as any
  return processDirectives(template, {}, join(UI, 'probe.stx'), options, new Set<string>())
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m || m.length < 3)
    throw new Error(`not a 6-digit hex colour: ${hex} — a silent 0 here would make every ramp look monotonic`)

  const [r, g, b] = m.slice(0, 3).map((pair) => {
    const channel = Number.parseInt(pair, 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * The ramp the component hands the canvas, in order.
 *
 * Read from `data-heatmap-colors`, which is the array the client script paints
 * from — so this is the plot's ramp, not just the legend's.
 */
function rampFrom(html: string): string[] {
  const m = html.match(/data-heatmap-colors="([^"]*)"/)
  if (!m)
    throw new Error('no data-heatmap-colors in the rendered output — the component did not render, and an empty ramp would pass every check below')

  const decoded = m[1].replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&')
  const parsed = JSON.parse(decoded)
  if (!Array.isArray(parsed) || parsed.length === 0)
    throw new Error(`data-heatmap-colors held no colours: ${decoded}`)
  return parsed
}

/** True when luminance only ever moves one way across the ramp. */
function isMonotonicInLightness(colors: string[]): boolean {
  const lums = colors.map(luminance)
  const rising = lums.every((l, i) => i === 0 || l >= lums[i - 1])
  const falling = lums.every((l, i) => i === 0 || l <= lums[i - 1])
  return rising || falling
}

describe('the default ramp', () => {
  it('is monotonic in lightness, so it survives greyscale', async () => {
    const ramp = rampFrom(await render('<Heatmap />'))

    expect(ramp.length).toBeGreaterThanOrEqual(3)
    expect(isMonotonicInLightness(ramp)).toBe(true)
  })

  it('spans a real lightness range, not a flat one', async () => {
    // A ramp of five identical colours is trivially monotonic. The ends have to
    // be far enough apart to read as low and high without relying on hue.
    const ramp = rampFrom(await render('<Heatmap />'))
    const lums = ramp.map(luminance)

    expect(Math.abs(lums[lums.length - 1] - lums[0])).toBeGreaterThan(0.3)
  })

  it('is not the rainbow', async () => {
    const ramp = rampFrom(await render('<Heatmap />'))

    expect(ramp).not.toContain('#00ff00')
  })
})

describe('the rainbow', () => {
  it('is still reachable by name, because removing it would break callers', async () => {
    const ramp = rampFrom(await render('<Heatmap colorScheme="rainbow" />'))

    expect(ramp).toContain('#00ff00')
  })

  it('is the one scheme that is not monotonic — which is why it is not the default', async () => {
    // Asserting the defect explicitly. If this ever passes, the luminance
    // helper has stopped measuring anything and the checks above are vacuous.
    const ramp = rampFrom(await render('<Heatmap colorScheme="rainbow" />'))

    expect(isMonotonicInLightness(ramp)).toBe(false)
  })
})

describe('the other schemes', () => {
  for (const scheme of ['fire', 'cool', 'grayscale']) {
    it(`${scheme} is monotonic in lightness`, async () => {
      const ramp = rampFrom(await render(`<Heatmap colorScheme="${scheme}" />`))

      expect(isMonotonicInLightness(ramp)).toBe(true)
    })
  }

  it('diverging runs light in the middle on purpose', async () => {
    // The legitimate two-ended case: two hues meeting at a neutral. It is not
    // monotonic and should not be — but it is opt-in, and its midpoint is grey
    // rather than a hue, which is the rainbow's actual mistake.
    const ramp = rampFrom(await render('<Heatmap colorScheme="diverging" />'))
    const mid = ramp[Math.floor(ramp.length / 2)]

    expect(isMonotonicInLightness(ramp)).toBe(false)
    // Neutral: the three channels within a few points of each other.
    const [r, g, b] = mid.replace('#', '').match(/.{2}/g)!.map(h => Number.parseInt(h, 16))
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(12)
  })
})

describe('theming', () => {
  it('exposes each legend stop as a custom property with the scheme as fallback', async () => {
    const out = await render('<Heatmap />')

    // Fallback present, so an app that sets nothing sees no change at all.
    expect(out).toMatch(/var\(--stx-heatmap-stop-1,\s*#[0-9a-f]{6}\)/i)
    expect(out).toContain('--stx-heatmap-stop-5')
  })

  it('resolves the same properties for the canvas, not just the legend', async () => {
    // The legend is CSS and picks these up for free. The plot is painted from
    // JS, so without this an app's themed legend would describe a plot it does
    // not match — worse than not being themeable at all.
    const out = await render('<Heatmap />')

    expect(out).toContain('--stx-heatmap-stop-')
    expect(out).toContain('getPropertyValue')
  })
})
