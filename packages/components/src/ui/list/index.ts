export { default as List } from './List.stx'

/** A bounded scrolling collection. Keep keyed data rows as direct children. */
export interface ListProps {
  className?: string
  testID?: string
  refreshing?: boolean
  onRefresh?: () => void
  onEndReached?: () => void
  /** Block paging during a request; hasMore stops it after the final page. */
  loading?: boolean
  hasMore?: boolean
  contentContainerStyle?: Record<string, number>
}
