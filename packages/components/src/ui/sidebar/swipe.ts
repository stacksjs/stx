/**
 * The geometry and commit rules behind a spaces swipe.
 *
 * Extracted from `SidebarSpaces.stx` for the same reason `route-selection.ts`
 * is: the component's client script cannot be imported, and this is the part
 * worth pinning down. Everything here is pure — no DOM, no state — so the
 * thresholds that decide whether a swipe advances can be asserted directly
 * instead of inferred from a rendered pane.
 *
 * Position is measured in *panels*, not pixels: 1.5 means halfway between the
 * second and third space. Keeping the gesture in panel units makes every
 * threshold independent of how wide the sidebar happens to be, so a 220px pane
 * and a 320px pane need the same flick to advance.
 */

/** Settle animation, matched by the tint crossfade so colour and motion agree. */
export const SETTLE_MS = 420
export const SETTLE_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

/**
 * Travel past the first/last space is compressed towards this asymptote, the
 * same thing a UIScrollView does at the end of a list: the track keeps
 * answering the finger, but tells you there is nothing further.
 */
export const RUBBER_LIMIT = 0.28

/** Drag this fraction of a panel and release, and the swipe commits. */
export const COMMIT_DISTANCE = 0.3

/** Or flick: panels per millisecond, i.e. 1.5 panels/second. */
export const COMMIT_VELOCITY = 0.0015

/** The first pointer travel that decides swipe-or-scroll, in CSS pixels. */
export const AXIS_LOCK_PX = 8

/** A wheel gesture ends when the stream goes quiet for this long. */
export const WHEEL_IDLE_MS = 90

/** Width of one panel as a percentage of the whole track. */
export function panelStep(count: number): number {
  return 100 / Math.max(1, count)
}

/** The compression curve applied beyond either end of the track. */
export function rubber(distance: number): number {
  return (1 - 1 / (distance / RUBBER_LIMIT + 1)) * RUBBER_LIMIT
}

/** Clamp an offset to the track, compressing rather than stopping at the ends. */
export function withResistance(offset: number, count: number): number {
  const last = count - 1
  if (offset < 0)
    return -rubber(-offset)
  if (offset > last)
    return last + rubber(offset - last)
  return offset
}

export function clampIndex(value: number, count: number): number {
  return Math.max(0, Math.min(count - 1, value))
}

/**
 * Where a released gesture lands.
 *
 * A swipe advances at most one space however far or fast it was dragged —
 * Arc behaves the same way, and it keeps a fast flick from skipping past the
 * space you were looking at.
 */
export function settleTarget(
  offset: number,
  gestureStart: number,
  velocity: number,
  count: number,
): number {
  const moved = offset - gestureStart
  const direction = Math.sign(moved) || Math.sign(velocity)
  const dragged = Math.abs(moved) > COMMIT_DISTANCE
  const flicked = Math.abs(velocity) > COMMIT_VELOCITY && Math.sign(velocity) === direction
  const commit = direction !== 0 && (dragged || flicked)
  return clampIndex(commit ? gestureStart + direction : gestureStart, count)
}

/**
 * Whether a wheel event should start a swipe.
 *
 * Claimed only when the very first event is unambiguously horizontal. A DOM
 * wheel stream carries no phase information, so this is a guess — the native
 * path in Craft replaces it with real `NSEvent` phases when the host provides
 * them.
 */
export function wheelClaims(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaX) > Math.abs(deltaY)
}

export type PointerAxis = 'undecided' | 'horizontal' | 'vertical'

/**
 * Axis lock for touch and pen. The first 8px of travel decides, and the
 * decision stands for the rest of the gesture — re-deciding mid-drag is what
 * makes web carousels feel slippery.
 */
export function pointerAxis(dx: number, dy: number): PointerAxis {
  if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX)
    return 'undecided'
  return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
}

/**
 * Convert Craft's release velocity (points per second) into the panels per
 * millisecond the commit thresholds are expressed in.
 */
export function nativeVelocityToPanels(velocityX: number, viewportWidth: number): number {
  return velocityX / (viewportWidth || 1) / 1000
}
