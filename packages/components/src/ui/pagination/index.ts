export { default as Pagination } from './Pagination.stx'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  siblingCount?: number
  showFirstLast?: boolean
  showPrevNext?: boolean
  onChange?: (page: number) => void
  className?: string
}
