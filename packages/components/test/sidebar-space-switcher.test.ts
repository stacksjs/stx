/**
 * The bottom indicator (Dia-style dots).
 *
 * It used to be one icon button per space at 28px each, which fits about eight
 * in a 280px sidebar and then overflows. With every space showing the same
 * default folder glyph, thirteen of them read as a broken progress bar rather
 * than as a switcher. A dot says only "which of how many" and leaves the
 * identifying to the space title and the tint.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(import.meta.dir, '../src/ui/sidebar/SidebarSpaceSwitcher.stx'), 'utf8')
const spaces = readFileSync(join(import.meta.dir, '../src/ui/sidebar/SidebarSpaces.stx'), 'utf8')
const sidebar = readFileSync(join(import.meta.dir, '../src/ui/sidebar/Sidebar.stx'), 'utf8')
const space = readFileSync(join(import.meta.dir, '../src/ui/sidebar/SidebarSpace.stx'), 'utf8')

describe('the indicator is dots, not an icon rail', () => {
  it('renders a dot per space rather than the space icon', () => {
    expect(source).toContain('stx-space-dot-mark')
    // The icon must not come back: it is what made thirteen spaces unreadable.
    expect(source).not.toContain('space.icon')
  })

  it('keeps each dot a real target while the mark stays small', () => {
    // A 6px dot is not clickable. The button is the target; the mark is what
    // you see.
    expect(source).toMatch(/\.stx-space-dot\s*\{[^}]*width:\s*14px/)
    expect(source).toMatch(/\.stx-space-dot-mark\s*\{[^}]*width:\s*6px/)
  })

  it('hides itself for a single space', () => {
    // One lonely dot indicates nothing. Dia hides the row entirely.
    expect(source).toContain('showDots = spaces.length > 1')
  })

  it('scrolls rather than shrinking when there are many spaces', () => {
    // Dots that squeeze to fit stop reading as dots, and a sidebar cannot get
    // wider.
    expect(source).toMatch(/\.stx-space-dots\s*\{[^}]*overflow-x:\s*auto/)
    expect(source).toMatch(/\.stx-space-dots\s*\{[^}]*flex-shrink|\.stx-space-dot\s*\{[^}]*flex-shrink:\s*0/)
  })

  it('still labels every dot for screen readers and pointer users', () => {
    // The dot carries no glyph, so the name has to come from somewhere.
    expect(source).toContain('aria-label="{{ space.label }}"')
    expect(source).toContain('title="{{ space.label }}"')
    expect(source).toContain('role="tab"')
  })

  it('leaves the active state to the parent', () => {
    // One source of truth: SidebarSpaces flips `data-space-current`.
    expect(source).toContain('data-space-current')
    expect(source).not.toContain('addEventListener')
  })

  it('centres the dots against the trailing button', () => {
    // Without a matching gutter the dots sit off-centre by the width of "+".
    expect(source).toContain('stx-space-rail-gutter')
  })
})

describe('a space change is one motion', () => {
  it('publishes the settle timing from the same constants the track uses', () => {
    // Four durations and three easings is what made a swipe read as several
    // things happening near each other.
    expect(spaces).toContain('--stx-space-settle')
    expect(spaces).toContain('SETTLE_MS}ms')
    expect(spaces).toContain('SETTLE_EASE')
  })

  it('has no stylesheet hardcoding its own duration for a space change', () => {
    // Every one of these used to be a literal that could drift.
    for (const file of [spaces, sidebar, space, source]) {
      expect(file).not.toMatch(/--stx-space-(from|to|ink|accent)\s+\d+ms/)
    }
  })

  it('routes the dots, the palette and the space buttons through the tokens', () => {
    expect(source).toContain('var(--stx-space-settle')
    expect(sidebar).toContain('var(--stx-space-settle')
    expect(space).toContain('var(--stx-space-settle')
  })

  it('keeps hover quick, since it is not part of a space change', () => {
    expect(source).toContain('transition-duration: 120ms')
    expect(space).toContain('transition-duration: 120ms')
  })

  it('still honours reduced motion', () => {
    expect(source).toContain('prefers-reduced-motion')
  })
})
