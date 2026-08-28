/**
 * Who draws the window controls.
 *
 * `showWindowControls` was a boolean, which could only say "draw them" or
 * "don't". Inside a real window the platform draws its own regardless, so
 * "draw them" there put SIX circles in the corner — three live buttons from
 * the window server and three HTML replicas beneath.
 *
 * A fixed choice cannot be right in both places the same markup renders: mock
 * lights are the point on a docs page and a bug in an app. So the default is
 * `auto`, which asks the host — Craft publishes
 * `--craft-window-controls-replicas` and `--craft-window-controls-width`
 * before the document is parsed, and a browser publishes neither.
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
  return props.windowControls || ((props.showWindowControls ?? !isArc) ? 'auto' : 'none')
}

describe('the mode a header resolves to', () => {
  it('leaves it to the host by default', () => {
    expect(resolve({ isArc: false })).toBe('auto')
  })

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
  it('true now means auto, not replicas', () => {
    // It only ever meant "there should be controls here". Who draws them is
    // the platform's business, and inside a window the platform already did.
    expect(resolve({ showWindowControls: true })).toBe('auto')
  })

  it('false still means none', () => {
    expect(resolve({ showWindowControls: false })).toBe('none')
  })

  it('is overridden by the explicit mode', () => {
    // An app migrating should not have to remove the old prop first.
    expect(resolve({ showWindowControls: true, windowControls: 'native' })).toBe('native')
  })

  it('still leaves arc bare and macOS not', () => {
    // A macOS sidebar owns its top-left corner; arc's is opt-in.
    expect(resolve({ isArc: false })).toBe('auto')
    expect(resolve({ isArc: true })).toBe('none')
  })
})

describe('the template honours the mode', () => {
  it('renders nothing into the reserved space', () => {
    // Anything drawn here would sit underneath live buttons.
    expect(source).toContain('@if(reserveWindowControls)')
    expect(source).toContain('var(--stx-native-controls-width, max(0px,')
    expect(source).toContain('aria-hidden="true"')
  })

  it('asks the host whether a replica should show', () => {
    // Set to `none` by every Craft window that has real buttons, and unset in
    // a browser, so the fallback is what a docs page gets.
    expect(source).toContain('display: var(--craft-window-controls-replicas, flex)')
  })

  it('reserves what the host says the buttons need', () => {
    // 62px is the measurement `native` assumes; `auto` cannot assume there are
    // any buttons, so with no host publishing a width it reserves nothing.
    expect(source).toContain("var(--craft-window-controls-width, ${autoWindowControls ? '0px' : '62px'})")
  })

  it('draws a replica and reserves room together only under auto', () => {
    // Both are true at once for `auto` alone, and there the two do not
    // collide: whichever the host wanted takes up space, the other collapses.
    expect(source).toContain("export const showWindowControls = windowControls === 'draw' || autoWindowControls")
    expect(source).toContain("export const reserveWindowControls = windowControls === 'native' || autoWindowControls")
    expect(source).toContain("export const replicaStyle = autoWindowControls")
  })

  it('lets a title share the row in either mode', () => {
    expect(source).toContain('titleInChrome = isArc && (showWindowControls || reserveWindowControls)')
  })

  it('aligns the reserved row with where the platform puts its buttons', () => {
    // The chrome row is 28pt tall — its action buttons set that, not the text
    // — so its contents centre 14pt down, which is exactly where the platform
    // puts the middle of its controls (they span 8..19pt). Any padding above
    // pushes the name below buttons it is meant to sit beside.
    //
    // Arithmetic rather than a branch, because only the host knows: a window
    // that keeps its buttons in a titlebar of their own publishes a width of
    // 0, does not overlay this row, and keeps its padding.
    expect(source).toContain('padding-top: max(0px, calc(12px - ')
    expect(source).toContain("reserveWindowControls ? arcChromePadding : 'padding-top: 12px'")
  })
})
