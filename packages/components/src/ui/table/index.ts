export { default as Table } from './Table.stx'
export { default as TableBody } from './TableBody.stx'
export { default as TableCell } from './TableCell.stx'
export { default as TableHead } from './TableHead.stx'
export { default as TableHeader } from './TableHeader.stx'
export { default as TableRow } from './TableRow.stx'

export interface TableProps {
  /** The table's accessible name, rendered as its first child `<caption>`. */
  caption?: string
  /** Show the caption; it is visually hidden (`sr-only`) by default. */
  captionVisible?: boolean
  className?: string
  striped?: boolean
  hoverable?: boolean
}

export interface TableHeadProps {
  className?: string
}

export interface TableBodyProps {
  className?: string
}

export interface TableRowProps {
  className?: string
  hoverable?: boolean
}

export interface TableHeaderProps {
  className?: string
  /** Which cells this header heads; `col` by default. */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
  /** Render the label as a `<button>` that emits `click`. */
  sortable?: boolean
  /** The current direction, set as `aria-sort` on the `<th>`. */
  sort?: 'asc' | 'desc' | ''
  onClick?: () => void
}

export interface TableCellProps {
  className?: string
}
