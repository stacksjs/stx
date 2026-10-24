export { default as List } from './List.stx'

/** A bounded scrolling collection. Keep keyed data rows as direct children. */
export interface ListProps {
  className?: string
  testID?: string
  refreshing?: boolean
  onRefresh?: () => void
  onEndReached?: () => void
  onEndReachedThreshold?: number
  contentContainerStyle?: Record<string, number>
}
