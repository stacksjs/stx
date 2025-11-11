export { default as VirtualList } from './VirtualList.stx'

export interface VirtualListProps<T = any> {
  items: T[]
  itemHeight: number
  height: number
  overscan?: number
  renderItem?: (item: T, index: number) => string
  className?: string
}
