/**
 * The page's overlay stack, for an overlay the app draws itself.
 *
 * Dialog, Drawer and stxConfirm/stxAlert all go on one stack in the stx
 * runtime (`window.stx.overlays`): the topmost overlay answers Escape and owns
 * Tab, the page stays locked from the first open to the last close, and focus
 * moves into an overlay and back to whatever opened it. An app's own slide-over
 * or full-screen panel joins the same stack through these, so it nests with the
 * library's dialogs instead of competing with them (stacksjs/stx#2057).
 *
 * ```ts
 * import { closeOverlay, openOverlay } from '@stacksjs/components/overlays'
 *
 * effect(() => {
 *   if (panelOpen()) openOverlay('workout-panel', { panel: '#wp-panel', onEscape: close })
 *   else closeOverlay('workout-panel')
 * })
 * onDestroy(() => closeOverlay('workout-panel'))
 * ```
 *
 * An overlay the app lifts into `<body>` itself (a bottom sheet) passes that
 * element as `root`: the rest of the page goes inert behind it, and stays
 * inert while a dialog opened from its content is on top.
 *
 * Every call is a no-op where there is no runtime (server rendering, tests
 * without a DOM), so shared code can call them unguarded.
 *
 * Import them from `@stacksjs/components/overlays` in a `<script client>`. The
 * package root re-exports them too, but the root also reaches the syntax
 * highlighter, which needs Node's streams and cannot be bundled for a browser.
 */

export interface OverlayOptions {
  /** Where focus is kept while this overlay is on top: an element, a selector, or a function returning one. A selector or function is looked up each time, since the panel may not be rendered yet when the overlay opens. */
  panel: Element | string | null | (() => Element | null)
  /** The overlay's outermost element, when it is not the panel. An overlay that is a direct child of `<body>` makes the rest of the page inert while it, or an overlay opened inside it, is on top. */
  root?: Element | null
  /**
   * A base z-index for `root`. While the overlay is open its z-index is this
   * plus its place in the stack, so an overlay opened later draws over one
   * opened before it wherever the two sit in the document. Kept after it
   * closes, so a closing transition stays above what it was over. Leave it
   * out to keep the stylesheet's.
   */
  zIndex?: number
  /** Escape while this overlay is on top. Leave it out for one that must be answered rather than dismissed. */
  onEscape?: (() => void) | null
  /** Where focus goes first. Defaults to `[autofocus]`, then the first focusable element, then the panel. */
  initialFocus?: HTMLElement | null | (() => HTMLElement | null)
  /** Where focus goes back to on close. Defaults to whatever had focus when it opened. */
  opener?: Element | null
  /** Give focus back on close. Default true. */
  restoreFocus?: boolean
}

interface OverlayStack {
  open: (id: string, options: OverlayOptions) => void
  close: (id: string) => void
  isTop: (id: string) => boolean
  list: () => string[]
}

function stack(): OverlayStack | undefined {
  return (globalThis as { stx?: { overlays?: OverlayStack } }).stx?.overlays
}

/** Put an overlay on top. Calling it again for an open id only updates its options. */
export function openOverlay(id: string, options: OverlayOptions): void {
  stack()?.open(id, options)
}

/** Take an overlay off the stack, wherever it is in it. */
export function closeOverlay(id: string): void {
  stack()?.close(id)
}

/** Whether this overlay is the one that has the keyboard. */
export function isTopOverlay(id: string): boolean {
  return stack()?.isTop(id) ?? false
}

/** Open overlay ids, outermost first. */
export function openOverlays(): string[] {
  return stack()?.list() ?? []
}
