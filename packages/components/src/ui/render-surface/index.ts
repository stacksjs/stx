export { default as RenderSurface } from './RenderSurface.stx'
export type { RenderFrame, RenderLoop, RenderSurfaceError, RenderSurfaceFilter, RenderSurfaceHost, RenderSurfaceMetrics } from './render-surface'
export { presentFrame, RENDER_SURFACE_MAX_SIDE, renderSurfaceHost, startRenderLoop } from './render-surface'

/** A box shared TypeScript draws into, frame by frame (stacksjs/stx#2108). */
export interface RenderSurfaceProps {
  /** The name frames are given to. Unique on the screen; each instance gets its own when it is left out. */
  surface?: string
  /** How a frame of another size is scaled to the box. */
  filter?: 'nearest' | 'linear'
  /** True by default. A surface that is not opaque takes premultiplied alpha. */
  opaque?: boolean
  /** What a screen reader says for it. */
  label?: string
  /** What shows in its place where nothing can draw one. */
  unavailableText?: string
  className?: string
  /** The first size in a window. */
  onReady?: (detail: import('./render-surface').RenderSurfaceMetrics) => void
  onResize?: (detail: import('./render-surface').RenderSurfaceMetrics) => void
  /** The app went to the background on a phone; nothing is kept. */
  onLost?: (detail: { surface: string, reason: string }) => void
  /** Back from a loss: draw a whole frame again. */
  onRestored?: (detail: import('./render-surface').RenderSurfaceMetrics) => void
  /** `UNAVAILABLE` or `DUPLICATE`. */
  onError?: (detail: import('./render-surface').RenderSurfaceError) => void
}
