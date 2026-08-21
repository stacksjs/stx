/**
 * The arc theme's metrics, against Dia.
 *
 * Every number here was measured from a screen capture at 2x rather than
 * chosen. The capture is 3024x1964 for a 1512x982 point display — a scale of
 * exactly 2.0, confirmed three ways against a window whose point size the
 * window server reports: traffic-light diameter, their spacing, and their
 * absolute position all divide to 2.000.
 *
 * That matters because an earlier pass used 1.512 — the ratio of the displayed
 * image to the original, not the retina scale — and every derived measurement
 * was 32% too large.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sidebarThemes } from '../src/ui/sidebar/themes'

const arc = sidebarThemes.arc
const pinned = readFileSync(join(import.meta.dir, '..', 'src', 'ui', 'sidebar', 'SidebarPinned.stx'), 'utf8')

/** The first `N` of a `px-[Npx]`-style utility in a class string. */
function utilityPx(classes: string, prefix: string): number | null {
  const match = classes.match(new RegExp(`${prefix}-\\[(\\d+)px\\]`))
  return match ? Number.parseInt(match[1], 10) : null
}

describe('rows sit where Dia puts them', () => {
  it('insets the scroll area by 16px', () => {
    // Dia: a 229pt panel with a 196pt selected row, inset 16pt each side.
    // At 8px the rows nearly touch the panel edge and read as bursting out.
    expect(utilityPx(arc.scrollArea, 'px')).toBe(16)
  })

  it('keeps the row itself at Dia\'s height and radius', () => {
    expect(arc.item.base).toContain('h-[30px]')
    expect(arc.item.base).toContain('rounded-[8px]')
  })

  it('keeps rows as discrete cards rather than a contiguous run', () => {
    // Arc and Dia both gap their rows; AppKit does not. That gap is what makes
    // two adjacent selections read as two things.
    expect(arc.sectionGroup).toContain('space-y-[2px]')
  })
})

describe('the favourites grid matches the measurement', () => {
  it('is four columns with a 6px gutter', () => {
    expect(pinned).toContain('export const columns = $props.columns || 4')
    expect(pinned).toContain('gap-[6px]')
  })

  it('uses Dia\'s slightly landscape tile', () => {
    // 50pt wide by 41pt tall, measured. Width follows from the column count,
    // so only the height is set here.
    expect(pinned).toContain('h-[41px]')
  })

  it('leaves the horizontal inset to the scroll area', () => {
    // Dia's grid is nearly full-bleed — 6pt from the panel edge — where its
    // rows are inset 16pt. Its own padding on top of the scroll area's would
    // push it to 24.
    const gridClass = pinned.match(/class="grid gap-\[6px\][^"]*"/)?.[0] ?? ''
    expect(gridClass).not.toContain('px-')
  })

  it('separates the tile from the panel in the right direction', () => {
    // The finding: Dia's tiles are ~9 units DARKER than a pale panel and ~23
    // lighter than a dark one. A white overlay is correct in dark appearance
    // and backwards in light, where it lifted a tile meant to be recessed.
    expect(pinned).toContain('bg-black/[0.035] dark:bg-white/[0.09]')
    expect(pinned).not.toContain('bg-white/45')
  })

  it('gives the well an edge', () => {
    expect(pinned).toContain('ring-1 ring-black/[0.05] dark:ring-white/[0.06]')
  })
})

describe('typography stays where it was measured', () => {
  it('sets rows at 13px, as Dia does', () => {
    expect(arc.item.base).toContain('text-[13px]')
  })

  it('keeps section headers sentence case at 11px', () => {
    // Uppercasing a section header is the single most common tell of a web
    // sidebar imitating a native one.
    expect(arc.sectionHeader).toContain('text-[11px]')
    expect(arc.sectionHeader).not.toContain('uppercase')
  })
})
