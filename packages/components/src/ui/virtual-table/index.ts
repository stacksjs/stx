/**
 * @deprecated Use `<DataGrid>` (`../data-grid`). It virtualizes columns as
 * well as rows and adds sorting, resizing, filtering, selection, keyboard
 * navigation and export. `<VirtualTable>` stays so existing pages keep
 * working, and gets no new features.
 */
export { default as VirtualTable } from './VirtualTable.stx'

export interface VirtualTableColumn<T = any> {
  key: string
  label?: string
  width?: number
  minWidth?: string
  render?: (value: any, row: T) => string
}

export interface VirtualTableProps<T = any> {
  columns: VirtualTableColumn<T>[]
  data: T[]
  rowHeight?: number
  height?: number
  headerHeight?: number
  overscan?: number
  striped?: boolean
  hoverable?: boolean
  className?: string
}
