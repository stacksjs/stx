export { default as List } from './List.stx'

/** A bounded scrolling collection. Keep keyed data rows as direct children. */
export interface ListProps {
  /** Viewport utilities, including bounds that override the browser's one-viewport default. */
  className?: string
  horizontal?: boolean
  testID?: string
  refreshing?: boolean
  onRefresh?: () => void
  onEndReached?: () => void
  /** Block paging during a request; hasMore stops it after the final page. */
  loading?: boolean
  hasMore?: boolean
  /** Content padding shared by browsers and native hosts. */
  contentContainerStyle?: Record<string, number>
}
