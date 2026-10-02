/**
 * `highlight()` renders the theme it was asked for (stacksjs/stx#2015).
 *
 * The theme was resolved, returned in the result, and never passed to the
 * highlighter. Every render came from the shared instance's own
 * `github-light`, so every CodeBlock in every app was light whatever it asked
 * for, while the returned `theme` field reported the request. That field made
 * it worse than silent: it said `github-dark` over light CSS.
 *
 * Four of GitHub Light's seven token colours sit below 0.4 luminance, so on a
 * dark code surface the result is not merely off-brand, it is unreadable, and
 * `className` cannot reach inline token colours to paper over it.
 *
 * Note what this file can and cannot check here. `ts-syntax-highlighter@0.2.17`
 * ships a bundle importing `bunfig` without declaring it, so it throws wherever
 * that is unreachable, which includes this test runner: `highlight()` takes its
 * plain-text floor and emits no CSS at all. The palette assertions are
 * therefore skipped rather than quietly passing on an empty string, and they
 * run wherever the highlighter does load. What survives in both places is the
 * metadata contract, which is where the original lie lived.
 */
import { describe, expect, it } from 'bun:test'
import { highlight } from '../src/utils/highlighter'

const CODE = 'const x: number = 1'

/** The panel background, the cheapest proof of which palette shipped. */
function background(css: string): string | undefined {
  return /background-color:\s*(#[0-9a-f]{3,8})/i.exec(css)?.[1]?.toLowerCase()
}

// Decided once, by asking rather than assuming: a highlighter that loaded
// returns CSS, and one that did not returns none.
const probe = await highlight(CODE, { language: 'typescript', theme: 'light' })
const highlighterLoaded = probe.css.length > 0

describe('highlight() reports the theme it was asked for', () => {
  it('reports the resolved theme even when highlighting is unavailable', async () => {
    // The second untruth in #2015, and the one reachable from here. This path
    // returned a hardcoded `github-light`, so a caller asking for dark and
    // getting the plain-text floor was told it got light.
    const result = await highlight(CODE, { language: 'typescript', theme: 'dark' })

    expect(result.theme).toBe('github-dark')
  })

  it('resolves auto to light where no media query can be asked', async () => {
    /*
     * Not an endorsement, a record of the limitation. `highlight()` runs in
     * `<script server>`, where `globalThis.matchMedia` does not exist, so
     * `auto` cannot discover a preference, and a viewer's is not knowable at
     * render time regardless.
     *
     * Emitting both palettes and letting CSS choose is the honest answer and is
     * not available: this highlighter writes token colours as inline `style`
     * attributes on each span rather than through its token classes, so no
     * media query can override them. Its own `renderDualTheme` takes
     * `TokenLine[]`, which no public method returns.
     *
     * `theme: 'dark'` is the explicit escape until that changes. If this fails
     * because `auto` produced dark, the limitation is gone and this test is the
     * one to delete.
     */
    expect(globalThis.matchMedia).toBeUndefined()

    const result = await highlight(CODE, { language: 'typescript', theme: 'auto' })

    expect(result.theme).toBe('github-light')
  })
})

describe.skipIf(!highlighterLoaded)('highlight() emits the palette it reports', () => {
  it('emits the dark palette for theme: dark', async () => {
    const result = await highlight(CODE, { language: 'typescript', theme: 'dark' })

    expect(result.theme).toBe('github-dark')
    expect(background(result.css)).toBe('#0d1117')
  })

  it('emits the light palette for theme: light', async () => {
    const result = await highlight(CODE, { language: 'typescript', theme: 'light' })

    expect(result.theme).toBe('github-light')
    expect(background(result.css)).toBe('#ffffff')
  })

  it('does not ship one palette for both', async () => {
    // The regression in one assertion: the two were byte identical, 2777
    // characters of GitHub Light, and only the metadata differed.
    const dark = await highlight(CODE, { language: 'typescript', theme: 'dark' })
    const light = await highlight(CODE, { language: 'typescript', theme: 'light' })

    expect(dark.css).not.toBe(light.css)
    expect(background(dark.css)).not.toBe(background(light.css))
  })
})
