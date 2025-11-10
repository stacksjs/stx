export { default as Table } from './Table.stx'
export { default as TableHead } from './TableHead.stx'
export { default as TableBody } from './TableBody.stx'
export { default as TableRow } from './TableRow.stx'
export { default as TableHeader } from './TableHeader.stx'
export { default as TableCell } from './TableCell.stx'

export interface TableProps {
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
  sortable?: boolean
  onClick?: () => void
}

export interface TableCellProps {
  className?: string
}
