import type { TreeNode, TreeOpenKind, TreePath } from './core'
import type { TinkerValue } from './tinker'

export * from './core'
export { default as JsonTree } from './JsonTree.stx'
export * from './tinker'
export * from './view'

export interface JsonTreeProps {
  /** The value, described as tree nodes. Bind it: `:value="node()"`. */
  value?: TreeNode | TreeNode[] | null
  /** A tinker result, adapted to tree nodes on the client. Bind it: `:tinker="result()"`. */
  tinker?: TinkerValue | null
  /** Containers nearer the root than this start expanded. Default 1. */
  depth?: number
  /** Pixels per row. Default 22. */
  rowHeight?: number
  /** A CSS length. Default `20rem`. */
  height?: string
  /** The tree's accessible name. Default `Value`. */
  label?: string
  /** Says where a node can be opened, overriding the node's own `openable`. Bound: `:openable="fn"`. */
  openable?: (node: TreeNode, path: TreePath) => TreeOpenKind | TreeOpenKind[] | null | undefined
  /** The host shows its own context menu, so the browser's is suppressed. */
  contextMenu?: boolean
  id?: string
  className?: string
}
