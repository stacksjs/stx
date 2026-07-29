import { describe, expect, it } from 'bun:test'
import { generateCrosswindCSS } from '../src/dev-server/crosswind'

/**
 * End-to-end guard on the CSS the dev server actually serves for arbitrary
 * utility values.
 *
 * These all broke at once, and none of them broke loudly. `import('@cwcss/crosswind')`
 * resolves relative to stx rather than to the app being served, so stx's own
 * hoisted copy won even when the project declared a newer one — and the engine
 * version decides what a class compiles to. On a stale engine `blur-[50px]`
 * came out as `blur(50pxpx)` and `backdrop-saturate-[180%]` as `saturate(NaN)`,
 * both of which a browser silently drops, so the utility just did nothing and
 * the element looked like it had never been styled.
 *
 * Asserting on the served CSS covers the whole chain: extraction, engine
 * resolution, and generation.
 */
describe('arbitrary values survive the dev server CSS pipeline', () => {
  async function serve(classNames: string): Promise<string> {
    return generateCrosswindCSS(`<div class="${classNames}"></div>`)
  }

  it('never emits a doubled unit, NaN, or an empty rule for filters', async () => {
    const css = await serve('blur-[3px] backdrop-blur-[50px] backdrop-saturate-[180%] backdrop-saturate-[1.7] brightness-[1.2] hue-rotate-[30deg]')

    // Each function is named so several can compose on one element; the
    // shared `filter` / `backdrop-filter` declaration lists them all.
    expect(css).toContain('--cw-blur: blur(3px)')
    expect(css).toContain('--cw-backdrop-blur: blur(50px)')
    expect(css).toContain('--cw-backdrop-saturate: saturate(180%)')
    expect(css).toContain('--cw-backdrop-saturate: saturate(1.7)')
    expect(css).toContain('--cw-brightness: brightness(1.2)')
    expect(css).toContain('--cw-hue-rotate: hue-rotate(30deg)')

    expect(css).not.toContain('pxpx')
    expect(css).not.toContain('NaN')
  })

  it('emits arbitrary box shadows rather than dropping them', async () => {
    const css = await serve('shadow-[0_1px_4px_rgba(0,0,0,0.12)]')
    expect(css).toContain('0 1px 4px rgba(0,0,0,0.12)')
  })

  it('covers the common arbitrary families used across a dashboard', async () => {
    const css = await serve('h-[32px] w-[22px] p-[10px] gap-[7px] text-[13px] leading-[16px] rounded-[8px] max-w-[65ch] min-h-[100dvh] z-[60] bg-[#f2f2f4]/90')

    for (const declaration of [
      'height: 32px',
      'width: 22px',
      'padding: 10px',
      'gap: 7px',
      'font-size: 13px',
      'line-height: 16px',
      'border-radius: 8px',
      'max-width: 65ch',
      'min-height: 100dvh',
      'z-index: 60',
      'rgb(242 242 244 / 0.9)',
    ])
      expect(css).toContain(declaration)
  })
})
