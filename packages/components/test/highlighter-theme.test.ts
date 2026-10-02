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

  it('names one palette when it could only ship one', async () => {
    /*
     * This asserted `auto` resolved to `github-light`, and its own comment said
     * to delete it once both palettes could be emitted. They can be now, so
     * what it asserts has changed rather than gone: the returned `theme` is
     * `'auto'` when BOTH palettes shipped, and a concrete name when only one
     * did - which is the case here, because the highlighter cannot load in this
     * runner and there is no CSS to choose between.
     *
     * Reporting `auto` on the plain-text floor would be the same class of
     * untruth this issue is about, so the field tracks what was emitted rather
     * than what was asked for.
     */
    expect(globalThis.matchMedia).toBeUndefined()

    const result = await highlight(CODE, { language: 'typescript', theme: 'auto' })

    expect(result.theme).toBe(result.css ? 'auto' : 'github-light')
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

/**
 * `auto` emits BOTH palettes and lets CSS choose (stacksjs/stx#2015, item 2).
 *
 * The first half of this issue was the theme never reaching the highlighter.
 * The second is that `auto` could not work at all: `highlight()` runs in
 * `<script server>`, `globalThis.matchMedia` does not exist there, and a
 * viewer's preference is not knowable at render time — so branching in JS
 * always answered light.
 *
 * The engine's own `renderDualTheme` does not solve it. Its CSS styles the
 * `.syntax` container for both modes and leaves every token colour inline,
 * where no stylesheet rule can reach it, so it yields a dark panel with
 * light-theme token colours — the unreadable half, kept. There are no
 * per-token-type rules in its output, single or dual, to override instead.
 *
 * So the colours are read back out of two renders and re-emitted as rules on
 * the token classes the spans already carry, with the inline styles stripped.
 */
/*
 * Skipped in this runner for the reason at the top of the file, so verified
 * out-of-band while developing. From the repo root, where the highlighter does
 * load:
 *
 *   bun -e "import { highlight } from './packages/components/src/utils/highlighter'
 *   const r = await highlight('const a = 1 // n', { language: 'typescript', theme: 'auto' })
 *   console.log(/style=\"color/.test(r.html), /prefers-color-scheme/.test(r.css), r.css.includes('#0d1117'))"
 *
 *   -> false true true
 *
 * The first must be false (inline colours stripped) and the other two true.
 */
describe.skipIf(!highlighterLoaded)('auto ships both palettes', () => {
  const auto = () => highlight(CODE, { language: 'typescript', theme: 'auto' })

  it('reports itself as auto, because both palettes are present', async () => {
    const result = await auto()

    expect(result.theme).toBe('auto')
  })

  it('strips the inline colours that no media query could override', async () => {
    const result = await auto()

    // The whole reason a media query could not work.
    expect(result.html).not.toMatch(/style="color/)
    // …while the classes the rules key on survive.
    expect(result.html).toMatch(/class="token [\w-]+"/)
  })

  it('carries both switches, matching how the library does dark mode', async () => {
    const result = await auto()

    // A viewer following their OS…
    expect(result.css).toContain('@media (prefers-color-scheme: dark)')
    // …and an app with a manual toggle.
    expect(result.css).toMatch(/\.dark \.syntax/)
    // The media query is guarded, or a page pinned to light on a dark OS would
    // still get dark code.
    expect(result.css).toContain(':root:not(.light)')
  })

  it('puts the dark panel in the dark block, not just the tokens', async () => {
    const result = await auto()

    // `.syntax` carries `background-color: #ffffff` from the light stylesheet,
    // which the issue names: dark tokens on a white panel is the same bug in
    // reverse, and the half a reader notices first.
    expect(result.css).toMatch(/\.dark \.syntax \{[^}]*background-color:\s*#0d1117/i)
    expect(result.css).toContain('#0d1117')
  })

  it('emits a dark colour for a token it also emits a light colour for', async () => {
    const result = await auto()
    const classes = [...result.css.matchAll(/\.syntax \.token\.([\w-]+) \{/g)].map(m => m[1])

    expect(classes.length).toBeGreaterThan(0)
    // Every token rule appears in both halves: once plain, once under dark.
    for (const cls of new Set(classes)) {
      const plain = new RegExp(`(?:^|\\n)\\.syntax \\.token\\.${cls} \\{`, 'm')
      const dark = new RegExp(`\\.dark \\.syntax \\.token\\.${cls} \\{`)

      expect(plain.test(result.css), `${cls} has no light rule`).toBe(true)
      expect(dark.test(result.css), `${cls} has no dark rule`).toBe(true)
    }
  })

  /*
   * The explicit modes are deliberately unchanged: one palette, inline colours,
   * which is correct when the caller has already decided and is the cheaper
   * output. Only `auto` pays for both.
   */
  it('leaves an explicitly chosen theme on the single-palette path', async () => {
    for (const theme of ['light', 'dark'] as const) {
      const result = await highlight(CODE, { language: 'typescript', theme })

      expect(result.html, theme).toMatch(/style="color/)
      expect(result.css, theme).not.toContain('prefers-color-scheme')
    }
  })
})
