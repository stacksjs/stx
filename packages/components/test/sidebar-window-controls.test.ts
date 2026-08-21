/**
 * Who draws the window controls.
 *
 * `showWindowControls` was a boolean, which could only say "draw them" or
 * "don't". Inside a real window with the titlebar hidden the platform draws
 * its own regardless, so "draw them" there put SIX circles in the corner —
 * three live buttons from the window server and three HTML replicas beneath.
 *
 * Measured from a Craft window at 2x, the platform's are 12pt discs 20pt
 * apart, the first 10pt from the window's left edge, the block ending 62pt in
 * and centred 14pt below the top. `native` reserves that room and renders
 * nothing into it.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const source = readFileSync(join(import.meta.dir, '..', 'src', 'ui', 'sidebar', 'SidebarHeader.stx'), 'utf8')

/** The `windowControls` resolution, evaluated the way the template computes it. */
function resolve(props: { windowControls?: string, showWindowControls?: boolean, isArc?: boolean }): string {
  const isArc = props.isArc ?? true
  return props.windowControls || ((props.showWindowControls ?? !isArc) ? 'draw' : 'none')
}

describe('the mode a header resolves to', () => {
  it('draws replicas when asked to', () => {
    expect(resolve({ windowControls: 'draw' })).toBe('draw')
  })

  it('reserves room when the platform owns them', () => {
    expect(resolve({ windowControls: 'native' })).toBe('native')
  })

  it('takes neither when told none', () => {
    expect(resolve({ windowControls: 'none' })).toBe('none')
  })
})

describe('the old boolean keeps working', () => {
  it('true still means draw', () => {
    expect(resolve({ showWindowControls: true })).toBe('draw')
  })

  it('false still means none', () => {
    expect(resolve({ showWindowControls: false })).toBe('none')
  })

  it('is overridden by the explicit mode', () => {
    // An app migrating should not have to remove the old prop first.
    expect(resolve({ showWindowControls: true, windowControls: 'native' })).toBe('native')
  })

  it('still defaults to drawing on the macOS theme', () => {
    // A macOS sidebar owns its traffic lights; arc's are opt-in.
    expect(resolve({ isArc: false })).toBe('draw')
    expect(resolve({ isArc: true })).toBe('none')
  })
})

describe('the template honours the mode', () => {
  it('renders nothing into the reserved space', () => {
    // Anything drawn here would sit underneath live buttons.
    expect(source).toContain('@if(reserveWindowControls)')
    expect(source).toContain('var(--stx-native-controls-width, 52px)')
    expect(source).toContain('aria-hidden="true"')
  })

  it('never draws replicas and reserves room at the same time', () => {
    // The two branches are mutually exclusive by construction: both derive
    // from one string, and a string is one value.
    expect(source).toContain("export const showWindowControls = windowControls === 'draw'")
    expect(source).toContain("export const reserveWindowControls = windowControls === 'native'")
  })

  it('lets a title share the row in either mode', () => {
    expect(source).toContain('titleInChrome = isArc && (showWindowControls || reserveWindowControls)')
  })

  it('aligns the reserved row with where the platform puts its buttons', () => {
    // The chrome row is 28pt tall — its action buttons set that, not the text
    // — so its contents centre 14pt down, which is exactly where the platform
    // puts the middle of its controls (they span 8..19pt). Any padding above
    // pushes the name below buttons it is meant to sit beside.
    expect(source).toContain("reserveWindowControls ? 'pt-0' : 'pt-[12px]'")
  })
})
