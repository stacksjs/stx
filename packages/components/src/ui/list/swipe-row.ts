export interface SwipeRowAction {
  id: string
  label: string
  destructive?: boolean
  accessibilityLabel?: string
  testID?: string
}

export interface SwipeRowProps {
  actions: SwipeRowAction[]
  actionsLabel?: string
  className?: string
  disabled?: boolean
  testID?: string
}

// Native screens have separate script contexts. One open row per context also
// keeps browser lists from leaving several action trays open at the same time.
let dismissOpenRow: (() => void) | undefined

export function openSwipeRow(dismiss: () => void): void {
  if (dismissOpenRow === dismiss) return
  dismissOpenRow?.()
  dismissOpenRow = dismiss
}

export function closeSwipeRow(dismiss: () => void): void {
  if (dismissOpenRow === dismiss) dismissOpenRow = undefined
}

/** Movement before a drag decides whether it is a swipe (horizontal) or a scroll. */
export const SWIPE_SLOP = 8

/** A drag past the ends gives a third of the extra distance, as UIKit's rubber band does. */
export function swipeOffset(position: number, reveal: number): number {
  if (position > 0) return position / 3
  if (position < -reveal) return -reveal + (position + reveal) / 3
  return position
}

/**
 * Whether a drag that ends at `position` (0 closed, -reveal open) with
 * `velocity` (points per millisecond, negative leftward) settles open: past
 * half of the reveal, or flung either way.
 */
export function swipeSettlesOpen(position: number, reveal: number, velocity = 0): boolean {
  if (velocity < -0.5) return true
  if (velocity > 0.5) return false
  return position < -reveal / 2
}
