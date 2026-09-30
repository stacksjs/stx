/**
 * A placeholder that pulses must stop pulsing for a viewer who asked their
 * system to reduce motion.
 *
 * `animate-pulse` compiles to an unconditional rule, and nothing in the
 * generated sheet guards it - so a skeleton pulsed regardless of the
 * preference. Skeletons are the worst case for this: they cover the whole page
 * while it loads, so there can be a dozen of them going at once, and for the
 * people this setting exists for the motion is a physical symptom rather than
 * a dislike. WCAG 2.3.3. Reported in stacksjs/stx#1995 by an app that could
 * not adopt Skeleton because swapping their own guarded version for it would
 * have been an accessibility regression.
 *
 * The `animate` prop is not the answer: it is a global on/off at the call site,
 * so the caller has to choose between animating for everyone and animating for
 * nobody. `motion-safe:` asks the question per viewer instead.
 *
 * Spinners are deliberately NOT guarded. A spinner is the only signal that
 * anything is happening at all, so freezing it removes the information rather
 * than the decoration, and what is left is a static circle that reads as a
 * broken image. Skeletons already convey "loading" through their shape and
 * lose nothing by holding still.
 */
import { describe, expect, it } from 'bun:test'
import { generateCss } from '../../stx/src/dev-server/ts-css'

describe('motion-safe guards the library placeholder pulse', () => {
  /*
   * Asserted on the compiled CSS, not on the class string: the point is that a
   * reduced-motion viewer gets no animation, and only the generated sheet says
   * whether that is true.
   */
  it('puts the pulse behind prefers-reduced-motion: no-preference', async () => {
    const css = await generateCss('<div class="motion-safe:animate-pulse"></div>')

    expect(css).toContain('prefers-reduced-motion: no-preference')
    expect(css).toContain('motion-safe\\:animate-pulse')
  })

  it('shows the unguarded class is what the sheet has no guard for', async () => {
    const css = await generateCss('<div class="animate-pulse"></div>')

    expect(css).toContain('animate-pulse')
    expect(css).not.toContain('prefers-reduced-motion')
  })

  it('leaves no bare animate-pulse in the library', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs')
    const { join } = await import('node:path')
    const src = join(import.meta.dir, '..', 'src')

    const walk = (dir: string): string[] => readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry)
      if (statSync(full).isDirectory())
        return walk(full)
      return full.endsWith('.stx') ? [full] : []
    })

    const offenders = walk(src).filter((file) => {
      const source = readFileSync(file, 'utf-8')
      // A bare occurrence: one not preceded by the motion-safe variant.
      return /(?<!motion-safe:)animate-pulse/.test(source)
    })

    expect(offenders.map(f => f.slice(src.length + 1))).toEqual([])
  })
})
