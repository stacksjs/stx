/**
 * Drag-out
 *
 * Start a native OS drag from a DOM element so the user can drag a
 * file *out* of the app onto Finder, Slack, an email composer, etc.
 *
 * Browsers can't do this — `dataTransfer.setData('DownloadURL', ...)` is
 * Chrome-specific, deprecated, and gated behind weird user-gesture
 * rules. Inside a Craft window we install a real `NSDraggingItem`-based
 * drag, identical to dragging from Finder.
 *
 * Typical usage:
 *
 *   const onMouseDown = (e: MouseEvent) => {
 *     dragOut(['/Users/me/export.png'], { event: e })
 *   }
 *
 * The mousedown event is preferred over a synthetic call because AppKit
 * uses the current mouse event to anchor the drag preview.
 */

import { hasBridge } from './_bridge'

export interface DragOutOptions {
  /**
   * The mouse event that triggered the drag. Optional — when supplied,
   * the native side anchors the drag preview at the click point.
   */
  event?: MouseEvent
  /** Override anchor x. Used when `event` isn't available. */
  x?: number
  /** Override anchor y. Used when `event` isn't available. */
  y?: number
}

/**
 * Start a native drag with the given file path(s). Returns a promise
 * that resolves when the drag has *started* (not when it ends — there's
 * no reliable native callback for that without per-source delegate
 * scaffolding, and the OS handles the success path on the destination
 * side anyway).
 *
 * Outside a Craft window this rejects with a descriptive error so
 * callers can offer a fallback (e.g. trigger a download).
 */
export async function dragOut(paths: string | string[], options: DragOutOptions = {}): Promise<void> {
  if (!hasBridge('dragOut')) {
    throw new Error('dragOut requires a Craft native window')
  }
  const arr = Array.isArray(paths) ? paths : [paths]
  if (arr.length === 0) throw new Error('dragOut: at least one path required')
  await window.craft!.dragOut.start(arr, options)
}

/** True when native drag-out is available. */
export function isDragOutAvailable(): boolean {
  return hasBridge('dragOut')
}
