import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { renderView } from '../../stx/src/build-views'
import {
  clampIndex,
  COMMIT_DISTANCE,
  COMMIT_VELOCITY,
  nativeVelocityToPanels,
  panelStep,
  pointerAxis,
  RUBBER_LIMIT,
  settleTarget,
  wheelClaims,
  withResistance,
} from '../src/ui/sidebar/swipe'

describe('Sidebar spaces — geometry', () => {
  it('divides the track evenly between spaces', () => {
    expect(panelStep(4)).toBe(25)
    expect(panelStep(1)).toBe(100)
  })

  it('never divides by zero when there are no spaces', () => {
    expect(panelStep(0)).toBe(100)
  })

  it('leaves offsets inside the track untouched', () => {
    expect(withResistance(0, 4)).toBe(0)
    expect(withResistance(1.5, 4)).toBe(1.5)
    expect(withResistance(3, 4)).toBe(3)
  })

  it('compresses travel past either end towards an asymptote', () => {
    // Past the start: still moves, but always less than it was dragged.
    const before = withResistance(-1, 4)
    expect(before).toBeLessThan(0)
    expect(before).toBeGreaterThan(-RUBBER_LIMIT)

    // Past the end: same, measured from the last panel.
    const after = withResistance(4, 4)
    expect(after).toBeGreaterThan(3)
    expect(after).toBeLessThan(3 + RUBBER_LIMIT)
  })

  it('never escapes the asymptote no matter how hard it is dragged', () => {
    expect(withResistance(-1000, 4)).toBeGreaterThan(-RUBBER_LIMIT)
    expect(withResistance(1000, 4)).toBeLessThan(3 + RUBBER_LIMIT)
  })

  it('clamps an index to the available spaces', () => {
    expect(clampIndex(-3, 4)).toBe(0)
    expect(clampIndex(9, 4)).toBe(3)
    expect(clampIndex(2, 4)).toBe(2)
  })
})

describe('Sidebar spaces — settling', () => {
  it('commits once dragged past a third of a panel', () => {
    expect(settleTarget(1 + COMMIT_DISTANCE + 0.01, 1, 0, 4)).toBe(2)
    expect(settleTarget(1 - COMMIT_DISTANCE - 0.01, 1, 0, 4)).toBe(0)
  })

  it('snaps home when the drag falls short and there was no flick', () => {
    expect(settleTarget(1.1, 1, 0, 4)).toBe(1)
    expect(settleTarget(0.9, 1, 0, 4)).toBe(1)
  })

  it('commits on a flick even when the drag fell short', () => {
    expect(settleTarget(1.05, 1, COMMIT_VELOCITY * 2, 4)).toBe(2)
    expect(settleTarget(0.95, 1, -COMMIT_VELOCITY * 2, 4)).toBe(0)
  })

  it('ignores a flick that fights the direction of travel', () => {
    // Dragged forward, flicked backward: the drag fell short, so it snaps home
    // rather than committing in either direction.
    expect(settleTarget(1.05, 1, -COMMIT_VELOCITY * 2, 4)).toBe(1)
  })

  it('advances at most one space however far it is dragged', () => {
    expect(settleTarget(3.9, 0, 0, 4)).toBe(1)
    expect(settleTarget(0, 3, 0, 4)).toBe(2)
  })

  it('advances at most one space however hard it is flicked', () => {
    expect(settleTarget(1.05, 1, COMMIT_VELOCITY * 50, 4)).toBe(2)
  })

  it('stays put at the ends rather than running off the track', () => {
    expect(settleTarget(-0.5, 0, -COMMIT_VELOCITY * 5, 4)).toBe(0)
    expect(settleTarget(3.5, 3, COMMIT_VELOCITY * 5, 4)).toBe(3)
  })

  it('does nothing when the gesture never moved', () => {
    expect(settleTarget(2, 2, 0, 4)).toBe(2)
  })
})

describe('Sidebar spaces — input claiming', () => {
  it('claims a wheel gesture only when it starts unambiguously horizontal', () => {
    expect(wheelClaims(30, 2)).toBe(true)
    expect(wheelClaims(2, 30)).toBe(false)
  })

  it('leaves a diagonal wheel gesture to the scroller', () => {
    // Ties go to vertical: a sidebar scrolls far more often than it swipes.
    expect(wheelClaims(10, 10)).toBe(false)
  })

  it('waits out the first 8px before locking a pointer axis', () => {
    expect(pointerAxis(0, 0)).toBe('undecided')
    expect(pointerAxis(7, 7)).toBe('undecided')
    expect(pointerAxis(-7, 2)).toBe('undecided')
  })

  it('locks the pointer axis once the travel is decisive', () => {
    expect(pointerAxis(12, 3)).toBe('horizontal')
    expect(pointerAxis(-12, 3)).toBe('horizontal')
    expect(pointerAxis(3, 12)).toBe('vertical')
  })

  it('resolves a perfectly diagonal pointer drag to vertical', () => {
    expect(pointerAxis(12, 12)).toBe('vertical')
  })
})

describe('Sidebar spaces — native velocity', () => {
  it('converts points per second into panels per millisecond', () => {
    // One viewport width per second across a 250px pane is one panel per
    // 1000ms, which is below the flick threshold.
    expect(nativeVelocityToPanels(250, 250)).toBeCloseTo(0.001, 6)
    expect(nativeVelocityToPanels(250, 250)).toBeLessThan(COMMIT_VELOCITY)

    // Twice that clears it.
    expect(nativeVelocityToPanels(500, 250)).toBeGreaterThan(COMMIT_VELOCITY)
  })

  it('produces a flick that the settle thresholds agree is a flick', () => {
    const velocity = nativeVelocityToPanels(900, 300)
    expect(settleTarget(1.05, 1, velocity, 4)).toBe(2)
  })

  it('survives a zero-width viewport rather than returning Infinity', () => {
    expect(Number.isFinite(nativeVelocityToPanels(500, 0))).toBe(true)
  })
})

describe('Sidebar spaces — server-rendered focus containment', () => {
  const SPACE = join(import.meta.dir, '../src/ui/sidebar/SidebarSpace.stx')

  async function renderSpace(active: boolean): Promise<string> {
    const html = await renderView(SPACE, {
      id: 'dev',
      label: 'Development',
      active,
      sections: [],
      pinned: [],
    })
    return html.slice(html.indexOf('<section'), html.indexOf('>', html.indexOf('<section')) + 1)
  }

  // The controller sets `inert` in onMount, which leaves every off-screen space
  // in the tab order for the whole window between first paint and hydration.
  // On a server-rendered page that window is real, so the attribute has to ship
  // in the HTML.
  it('marks an off-screen space inert in the server-rendered HTML', async () => {
    expect(await renderSpace(false)).toMatch(/\binert\b/)
  })

  it('leaves the active space focusable', async () => {
    expect(await renderSpace(true)).not.toMatch(/\binert\b/)
  })
})
