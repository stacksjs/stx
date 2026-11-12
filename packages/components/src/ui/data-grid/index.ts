import type { GridColumn } from './core'

export * from './core'
export { default as DataGrid } from './DataGrid.stx'
export * from './view'

export interface DataGridProps<Row = any> {
  /** The rows: objects, or arrays. Bind it (`:rows`), or hand big data to `setRows()`. */
  rows?: Row[]
  /** Left out, the columns and their types are worked out from the rows. */
  columns?: GridColumn<Row>[]
  /** Pixels. Default 28. */
  rowHeight?: number
  /** Pixels. Default 32. */
  headerHeight?: number
  /** A CSS length. Default `24rem`. */
  height?: string
  /** Show the filter field. Default true. */
  filterable?: boolean
  /** Show the CSV and JSON buttons. Default true. */
  exportable?: boolean
  /** Rows can be selected. Default true. */
  selectable?: boolean
  /** The filter text. */
  filter?: string
  /** The grid's accessible name. Default `Data`. */
  label?: string
  /** The name of an exported file, without its extension. Default `data`. */
  fileName?: string
  /** Suppress the browser's menu on a right click, for a host that shows its own. */
  contextMenu?: boolean
  id?: string
  className?: string
}
