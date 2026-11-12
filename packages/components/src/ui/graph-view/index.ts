import type { GraphEdge, GraphNode, LayeredDirection } from './core'
import type { GraphLayoutName } from './view'

export * from './core'
export { default as GraphView } from './GraphView.stx'
export * from './view'

export interface GraphViewProps {
  /** `{ id, label?, kind?, detail?, expandable?, data? }`. Bound with `:nodes`. */
  nodes?: GraphNode[]
  /** `{ source, target, label?, directed?, id? }`. Bound with `:edges`. */
  edges?: GraphEdge[]
  /** `layered` points every edge one way; `force` lets the nodes find their own places. Default `layered`. */
  layout?: GraphLayoutName
  /** The flow of the layered layout: `LR` or `TB`. Default `LR`. */
  direction?: LayeredDirection
  /** The id of the selected node. */
  selected?: string
  /** A CSS length. Default `24rem`. */
  height?: string
  /** Default 0.1. */
  minZoom?: number
  /** Default 4. */
  maxZoom?: number
  /** Show the zoom, fit and layout buttons. Default true. */
  toolbar?: boolean
  /** Suppress the browser's own menu on a right click. */
  contextMenu?: boolean
  /** Move nodes to a new layout over a moment. Default true. */
  animate?: boolean
  /** The accessible name of the graph. Default `Graph`. */
  label?: string
  id?: string
  className?: string
}
