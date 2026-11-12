import type { SplitDirection } from './core'

export * from './core'
export { default as SplitPane } from './SplitPane.stx'
export * from './view'

export interface SplitPaneProps {
  /** `horizontal` puts the panes side by side, `vertical` stacks them. Default `horizontal`. */
  direction?: SplitDirection
  /** Shares, one per pane: `[30, 70]`, `[1, 2, 1]`, or the text `30,70`. */
  sizes?: number[] | string
  /** The least a pane can be, in pixels. A pane overrides it with `data-min-size`. Default 48. */
  minSize?: number
  /** Pixels an arrow key moves a separator. Default 16. */
  step?: number
  /** Keeps the layout in local storage under this name. */
  storageKey?: string
  /** The accessible name of a separator. Default `Resize panes`. */
  label?: string
  /** A CSS length. Default `100%`. */
  height?: string
  id?: string
  className?: string
}
