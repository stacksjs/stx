import type { PreviewScheme, ViewportName } from './core'

export * from './core'
export { default as PreviewFrame } from './PreviewFrame.stx'
export * from './view'

export interface PreviewFrameProps {
  /** The markup to show: a whole document or a fragment. */
  html?: string
  /** `fill` (default), `phone`, `tablet` or `desktop`. */
  viewport?: Exclude<ViewportName, 'custom'>
  /** A viewport of its own size, in CSS pixels. Both are needed, and they win over `viewport`. */
  frameWidth?: number
  frameHeight?: number
  /** Turn a phone or tablet on its side. */
  landscape?: boolean
  /**
   * The colour scheme the frame is drawn with, which is what the page's
   * `prefers-color-scheme` reports in an engine that passes a frame's scheme
   * to its page (Chromium; WebKit reports the system's). `auto` (default)
   * follows the host page.
   */
  scheme?: PreviewScheme
  /** Let the page's own scripts run. They get an origin of their own and cannot reach the host. Default off. */
  scripts?: boolean
  /** Let a form in the page submit. Default off. */
  forms?: boolean
  /** Show the viewport, scheme and reload controls. Default on. */
  toolbar?: boolean
  /** The frame's accessible name. Default `Preview`. */
  title?: string
  /** A CSS length for the whole component. Default `24rem`. */
  height?: string
  id?: string
  className?: string
}
